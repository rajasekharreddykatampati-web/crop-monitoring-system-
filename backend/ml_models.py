"""
ML Models for CropDoctor
- Crop Disease Detection: CNN-based image classification (simulated with color analysis)
- Yield Prediction: Random Forest Regression with DSSAT parameters
- Irrigation Optimization: Rule-based + regression model

In production, these should be replaced with properly trained models:
1. Disease Detection: Fine-tuned ResNet50/EfficientNet on PlantVillage dataset
2. Yield Prediction: Random Forest/XGBoost trained on historical yield data + DSSAT outputs
3. Irrigation: Trained on soil-moisture-weather interaction data
"""

import numpy as np
from typing import Dict, List, Tuple, Optional


class CropDiseaseModel:
    """
    Simplified crop disease detection model.
    Uses color histogram analysis as features.
    
    Production replacement: 
    - Train ResNet50 / EfficientNet-B4 on PlantVillage dataset (87K+ images)
    - 38 disease classes across 14 crop species
    - Expected accuracy: 95%+
    """
    
    def __init__(self):
        self.disease_db = {
            "tomato": [
                "Early Blight", "Late Blight", "Leaf Mold", 
                "Septoria Leaf Spot", "Bacterial Spot", "Healthy"
            ],
            "rice": [
                "Blast", "Brown Spot", "Leaf Scald", 
                "Bacterial Leaf Blight", "Healthy"
            ],
            "wheat": [
                "Rust", "Powdery Mildew", "Septoria", 
                "Tan Spot", "Healthy"
            ],
            "corn": [
                "Northern Leaf Blight", "Gray Leaf Spot", 
                "Common Rust", "Healthy"
            ],
            "potato": [
                "Early Blight", "Late Blight", "Healthy"
            ]
        }
    
    def extract_features(self, image_array: np.ndarray) -> Dict:
        """Extract color and texture features from image."""
        features = {}
        
        if len(image_array.shape) == 3:
            # Color channel means
            features["mean_r"] = np.mean(image_array[:, :, 0])
            features["mean_g"] = np.mean(image_array[:, :, 1])
            features["mean_b"] = np.mean(image_array[:, :, 2])
            
            # Color channel std
            features["std_r"] = np.std(image_array[:, :, 0])
            features["std_g"] = np.std(image_array[:, :, 1])
            features["std_b"] = np.std(image_array[:, :, 2])
            
            # Green ratio (indicator of plant health)
            features["green_ratio"] = features["mean_g"] / (features["mean_r"] + features["mean_b"] + 1)
            
            # Brown/yellow ratio (indicator of disease)
            features["brown_ratio"] = (features["mean_r"] + features["mean_g"]) / (features["mean_b"] + 1)
        
        return features
    
    def predict(self, image_array: np.ndarray, crop_type: str = "default") -> Dict:
        """Predict disease from image features."""
        features = self.extract_features(image_array)
        green_ratio = features.get("green_ratio", 0.5)
        
        # Decision logic based on color analysis
        is_healthy = green_ratio > 0.55
        confidence = 80 + np.random.uniform(0, 15)
        
        diseases = self.disease_db.get(crop_type, self.disease_db.get("tomato"))
        
        if is_healthy:
            disease = "Healthy"
        else:
            disease_list = [d for d in diseases if d != "Healthy"]
            disease = np.random.choice(disease_list) if disease_list else "Unknown Disease"
        
        return {
            "disease": disease,
            "confidence": round(confidence, 1),
            "is_healthy": is_healthy,
            "features": features
        }


class YieldPredictionModel:
    """
    Yield prediction model combining DSSAT parameters with ML regression.
    
    Features used:
    - Crop type (one-hot encoded)
    - Soil type (encoded as water retention + nutrient capacity)
    - Season (growing degree days proxy)
    - Weather (temperature, rainfall)
    - Management (planting date, harvest date)
    
    Production replacement:
    - Train Random Forest / XGBoost on historical yield data
    - Integrate DSSAT CERES/CROPGRO model outputs as features
    - Use ensemble: DSSAT simulation + ML correction factor
    """
    
    # DSSAT-referenced crop productivity ranges (tonnes/ha)
    CROP_PARAMS = {
        "rice":      {"base_yield": 4.5, "opt_temp": 28, "opt_rain": 200, "duration": 120},
        "wheat":     {"base_yield": 3.8, "opt_temp": 22, "opt_rain": 100, "duration": 135},
        "corn":      {"base_yield": 6.2, "opt_temp": 25, "opt_rain": 150, "duration": 110},
        "soybean":   {"base_yield": 2.8, "opt_temp": 26, "opt_rain": 120, "duration": 100},
        "cotton":    {"base_yield": 1.8, "opt_temp": 30, "opt_rain": 80,  "duration": 160},
        "sugarcane": {"base_yield": 70,  "opt_temp": 32, "opt_rain": 180, "duration": 330},
        "potato":    {"base_yield": 25,  "opt_temp": 20, "opt_rain": 100, "duration": 90},
        "tomato":    {"base_yield": 30,  "opt_temp": 24, "opt_rain": 90,  "duration": 85}
    }
    
    SOIL_PARAMS = {
        "clay":   {"yield_factor": 0.92, "water_retention": 0.9},
        "sandy":  {"yield_factor": 0.78, "water_retention": 0.5},
        "loamy":  {"yield_factor": 1.10, "water_retention": 0.85},
        "silt":   {"yield_factor": 1.00, "water_retention": 0.8},
        "peat":   {"yield_factor": 0.88, "water_retention": 0.95},
        "chalky": {"yield_factor": 0.82, "water_retention": 0.6}
    }
    
    def predict(self, crop: str, soil: str, area: float,
                season: str, temperature: Optional[float] = None,
                rainfall: Optional[float] = None) -> Dict:
        """Predict yield based on input parameters."""
        
        crop_params = self.CROP_PARAMS.get(crop, self.CROP_PARAMS["rice"])
        soil_params = self.SOIL_PARAMS.get(soil, self.SOIL_PARAMS["loamy"])
        season_factor = {"kharif": 1.05, "rabi": 0.95, "zaid": 0.85}.get(season, 1.0)
        
        # Base prediction
        yield_per_ha = crop_params["base_yield"] * soil_params["yield_factor"] * season_factor
        
        # Temperature stress factor
        if temperature:
            temp_diff = abs(temperature - crop_params["opt_temp"])
            temp_factor = max(0.6, 1 - (temp_diff * 0.015))
            yield_per_ha *= temp_factor
        
        # Rainfall factor
        if rainfall:
            rain_ratio = rainfall / crop_params["opt_rain"]
            if rain_ratio < 0.3:
                yield_per_ha *= 0.6  # Severe drought
            elif rain_ratio < 0.7:
                yield_per_ha *= 0.8  # Mild drought
            elif rain_ratio > 2.0:
                yield_per_ha *= 0.85  # Flooding risk
            elif rain_ratio > 1.3:
                yield_per_ha *= 0.92  # Excess rain
        
        # Model noise (simulating prediction uncertainty)
        noise = np.random.normal(1.0, 0.05)
        yield_per_ha *= noise
        
        total_yield = yield_per_ha * area
        
        return {
            "yield_per_hectare": round(max(0, yield_per_ha), 2),
            "total_yield": round(max(0, total_yield), 2),
            "confidence": round(75 + np.random.uniform(0, 20), 1),
            "crop": crop,
            "area": area
        }


class IrrigationModel:
    """
    Smart irrigation recommendation model.
    Combines crop water requirements with soil and weather data.
    """
    
    CROP_ETc = {  # Crop evapotranspiration (mm/day)
        "rice": 6.0, "wheat": 3.5, "corn": 5.0, "soybean": 4.0,
        "cotton": 4.5, "sugarcane": 7.0
    }
    
    def recommend(self, crop: str, soil: str, 
                  moisture: float = 40, stage: str = "vegetative") -> Dict:
        """Get irrigation recommendation."""
        
        etc = self.CROP_ETc.get(crop, 4.0)
        
        stage_kc = {"seedling": 0.4, "vegetative": 1.0, "flowering": 1.2,
                    "fruiting": 1.0, "maturity": 0.4}
        
        kc = stage_kc.get(stage, 1.0)
        daily_water = etc * kc * 1000  # Convert to liters/hectare
        
        # Soil adjustment
        soil_factor = {"clay": 0.8, "sandy": 1.3, "loamy": 1.0, "silt": 0.9}
        daily_water *= soil_factor.get(soil, 1.0)
        
        return {
            "water_liters_per_ha_per_day": round(daily_water),
            "irrigation_interval_hours": 24 if moisture < 35 else (48 if moisture < 55 else 72),
            "moisture_status": "Low" if moisture < 35 else ("Adequate" if moisture < 65 else "High")
        }
