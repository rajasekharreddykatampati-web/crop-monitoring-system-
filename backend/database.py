import os
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import sessionmaker, relationship, declarative_base
from datetime import datetime

# URL provided by user
DATABASE_URL = "postgresql://postgres.fyahdygkqiluweajsotg:Rajasekhar%40123@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    address = Column(String)
    age = Column(Integer)
    email_phone = Column(String, unique=True, index=True)
    password_hash = Column(String)
    initials = Column(String)
    role = Column(String, default="farmer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    analyses = relationship("Analysis", back_populates="owner")

class Analysis(Base):
    __tablename__ = "analyses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    crop_type = Column(String)
    disease_prediction = Column(String)
    confidence = Column(Float)
    is_healthy = Column(Boolean)
    yield_per_ha = Column(Float)
    total_yield = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="analyses")

# Create tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
