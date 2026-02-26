"""
Weather Routes - Location-based weather data for agricultural decisions
"""

from fastapi import APIRouter
from typing import Optional
import random

router = APIRouter()

# Simulated weather data (in production, integrate with OpenWeatherMap API or similar)
WEATHER_CONDITIONS = [
    {"icon": "☀️", "description": "Sunny", "advisory_type": "clear"},
    {"icon": "🌤️", "description": "Partly Cloudy", "advisory_type": "clear"},
    {"icon": "⛅", "description": "Mostly Cloudy", "advisory_type": "overcast"},
    {"icon": "☁️", "description": "Cloudy", "advisory_type": "overcast"},
    {"icon": "🌧️", "description": "Light Rain", "advisory_type": "rain"},
    {"icon": "⛈️", "description": "Thunderstorm", "advisory_type": "storm"},
]

AGRICULTURAL_ADVISORIES = {
    "clear": (
        "Favorable conditions for field operations, spraying, and harvesting. "
        "Ensure adequate irrigation as evapotranspiration will be high. "
        "Apply pesticides/fungicides in early morning or late evening to avoid rapid evaporation."
    ),
    "overcast": (
        "Good conditions for transplanting and field operations. "
        "Reduced evapotranspiration - adjust irrigation accordingly. "
        "Monitor for fungal diseases as humidity may increase."
    ),
    "rain": (
        "Postpone pesticide/herbicide application. "
        "Ensure proper drainage in fields to prevent waterlogging. "
        "Good time for fertilizer application if rain is light. "
        "Monitor for leaf diseases that thrive in wet conditions."
    ),
    "storm": (
        "Avoid all field operations. Protect nursery beds and young transplants. "
        "Ensure drainage channels are clear. Stake tall crops to prevent lodging. "
        "Inspect fields after the storm for damage assessment."
    )
}

DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


@router.get("/weather")
async def get_weather(location: Optional[str] = "Hyderabad"):
    """
    Get weather information for a location.
    In production, integrate with a weather API (OpenWeatherMap, Weather.gov, etc.)
    """
    # Simulated current weather
    condition_idx = random.randint(0, 2)  # Bias towards good weather
    condition = WEATHER_CONDITIONS[condition_idx]

    temp = random.randint(22, 35)
    humidity = random.randint(40, 85)
    wind = random.randint(5, 25)
    pressure = random.randint(1005, 1020)

    # Generate 5-day forecast
    forecast = []
    for i in range(5):
        day_condition = WEATHER_CONDITIONS[random.randint(0, len(WEATHER_CONDITIONS) - 1)]
        high = random.randint(24, 38)
        low = high - random.randint(5, 12)
        forecast.append({
            "day": DAYS_OF_WEEK[i % 7],
            "icon": day_condition["icon"],
            "high": high,
            "low": low,
            "description": day_condition["description"]
        })

    advisory = (
        f"Weather in {location}: {condition['description']} with temperature of {temp}°C. "
        + AGRICULTURAL_ADVISORIES[condition["advisory_type"]]
    )

    return {
        "temp": temp,
        "icon": condition["icon"],
        "description": condition["description"],
        "location": location,
        "humidity": humidity,
        "wind": wind,
        "pressure": pressure,
        "forecast": forecast,
        "advisory": advisory
    }
