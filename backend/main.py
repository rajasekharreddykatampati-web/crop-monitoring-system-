"""
CropDoctor - AI-Based Crop Monitoring and Decision Support System
FastAPI Backend Main Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router
from crop import router as crop_router
from weather import router as weather_router
from admin import router as admin_router

app = FastAPI(
    title="CropDoctor API",
    description="AI-Based Crop Monitoring and Decision Support System using DSSAT",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check route (must be before static files mount)
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "CropDoctor API", "version": "1.0.0"}

# Include API routes
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(crop_router, prefix="/api", tags=["Crop Analysis"])
app.include_router(weather_router, prefix="/api", tags=["Weather"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])

# NOTE: Frontend is served separately (open frontend HTML files directly or via a static host)

if __name__ == "__main__":
    import uvicorn
    # Run the application using uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
