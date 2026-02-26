# 🌱 CropDoctor - AI-Based Crop Monitoring & Decision Support System

## About

**CropDoctor** is an AI-Based Crop Monitoring and Decision Support System powered by DSSAT (Decision Support System for Agrotechnology Transfer). It helps farmers make data-driven decisions for crop management using Machine Learning models.

## Features

- 🔬 **Crop Disease Detection** - Upload crop images for AI-powered disease analysis with treatment recommendations
- 📈 **Yield Prediction** - Predict crop yields using DSSAT-integrated ML models (Random Forest Regression)
- 💧 **Irrigation Management** - Smart irrigation scheduling based on soil, crop, and weather conditions
- 🧪 **Fertilizer Recommendation** - Personalized NPK fertilizer recommendations per crop and growth stage
- 🌤️ **Weather Integration** - Real-time weather data with agricultural advisories
- 📋 **Reports** - Comprehensive crop monitoring and analysis reports

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript |
| Backend | FastAPI (Python) |
| ML Models | scikit-learn, NumPy, Pillow |
| Auth | JWT + bcrypt (Farmer), Google OAuth (Admin - placeholder) |

## Project Structure

```
FIE/
├── frontend/
│   ├── index.html          # Landing page
│   ├── login.html          # Login & Signup
│   ├── dashboard.html      # Main dashboard (CropDoctor)
│   ├── css/
│   │   └── style.css       # Global styles
│   └── js/
│       ├── auth.js          # Authentication logic
│       └── dashboard.js     # Dashboard & module logic
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── routes/
│   │   ├── auth.py          # Authentication routes
│   │   ├── crop.py          # Disease, Yield, Irrigation, Fertilizer
│   │   └── weather.py       # Weather data routes
│   └── models/
│       └── ml_models.py     # ML model classes
└── README.md
```

## Setup & Installation

### Prerequisites
- Python 3.9+
- pip

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Access the Application

1. Open browser and go to `http://localhost:8000`
2. Or open `frontend/index.html` directly for frontend-only mode (uses simulated ML results)

## User Roles

### Farmer
- Sign up with: Name, Address, Age, Email/Phone, Password
- Access all monitoring and analysis features

### Admin
- Sign in with Google (Firebase Integrated)
- Access admin dashboard and management features

## ML Models Used

1. **Disease Detection**: Multi-feature image analysis engine (Color histograms, HSV analysis, Texture variance, Brown/Yellow spot ratios, and Health scoring) for high accuracy across 7 crops.
2. **Yield Prediction**: DSSAT parameter-based Random Forest Regression model (v2.1).
3. **Irrigation Optimization**: Smart water scheduling based on real-time moisture, crop stage, and soil drainage.
4. **Fertilizer Recommendation**: Personalized expert system with split-dose NPK recommendations.

## DSSAT Integration

The system uses DSSAT framework parameters for:
- Crop growth simulation
- Soil-water balance calculations
- Weather impact assessment
- Yield estimation calibration

---

**CropDoctor** - Empowering farmers with AI-driven insights for sustainable agriculture. 🌾
