"""
Authentication Routes - Farmer Signup/Login, Admin Login using SQLAlchemy
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from database import get_db, User

router = APIRouter()
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except Exception:
        return None
    user = db.query(User).filter(User.id == user_id).first()
    return user

SECRET_KEY = "cropdoctor-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_initials(name: str) -> str:
    parts = name.strip().split()
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    return name[:2].upper()

class FarmerSignup(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    address: str = Field(..., min_length=5)
    age: int = Field(..., ge=18, le=100)
    email_phone: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)

class AdminLogin(BaseModel):
    email: str
    password: str

class FarmerLogin(BaseModel):
    email_phone: str
    password: str

@router.post("/signup")
async def farmer_signup(data: FarmerSignup, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email_phone == data.email_phone).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="An account with this email/phone already exists.")
    
    new_user = User(
        name=data.name,
        address=data.address,
        age=data.age,
        email_phone=data.email_phone,
        password_hash=pwd_context.hash(data.password),
        initials=get_initials(data.name),
        role="farmer"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "Account created successfully", "user": {
        "id": new_user.id,
        "name": new_user.name,
        "initials": new_user.initials,
        "email_phone": new_user.email_phone,
        "role": new_user.role
    }}

@router.post("/login")
async def farmer_login(data: FarmerLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email_phone == data.email_phone).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials. User not found.")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your access has been revoked by the admin. Please contact support.")

    if not pwd_context.verify(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials. Wrong password.")

    token = create_token({
        "sub": str(user.id),
        "name": user.name,
        "role": user.role,
        "email_phone": user.email_phone
    })

    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "initials": user.initials,
            "email_phone": user.email_phone,
            "address": user.address,
            "age": user.age,
            "role": user.role
        }
    }

@router.post("/admin/login")
async def admin_login(data: AdminLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email_phone == data.email).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=401, detail="Invalid credentials or you are not an admin.")
    
    if not pwd_context.verify(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials. Wrong password.")

    token = create_token({
        "sub": str(user.id),
        "name": user.name,
        "role": user.role,
        "email_phone": user.email_phone
    })
    
    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "initials": user.initials,
            "email_phone": user.email_phone,
            "role": user.role
        }
    }
