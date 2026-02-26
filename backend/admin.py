from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db, User, Analysis
from auth import get_current_user

router = APIRouter()

def get_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user or current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized.")
    return current_user

@router.get("/farmers")
async def get_farmers(db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    farmers = db.query(User).filter(User.role == "farmer").all()
    return [{
        "id": f.id,
        "name": f.name,
        "email_phone": f.email_phone,
        "address": f.address,
        "is_active": f.is_active,
        "created_at": f.created_at
    } for f in farmers]

@router.get("/farmers/{farmer_id}/analysis")
async def get_farmer_analysis(farmer_id: int, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    analyses = db.query(Analysis).filter(Analysis.user_id == farmer_id).order_by(Analysis.created_at.desc()).all()
    return [{
        "id": a.id,
        "crop_type": a.crop_type,
        "disease_prediction": a.disease_prediction,
        "confidence": a.confidence,
        "is_healthy": a.is_healthy,
        "yield_per_ha": a.yield_per_ha,
        "total_yield": a.total_yield,
        "created_at": a.created_at
    } for a in analyses]

@router.post("/farmers/{farmer_id}/revoke")
async def revoke_farmer_access(farmer_id: int, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    farmer = db.query(User).filter(User.id == farmer_id, User.role == "farmer").first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found.")
    
    farmer.is_active = not farmer.is_active
    db.commit()
    
    status = "revoked" if not farmer.is_active else "restored"
    return {"message": f"Farmer access {status} successfully.", "is_active": farmer.is_active}
