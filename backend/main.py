from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
from typing import Optional

app = FastAPI(title="Weather App Pro API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: specific domains only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tomorrow.io API configuration
TOMORROW_IO_API_KEY = "CoemxyXvE8oBM2nuW2iQ5Ka0X560eUnd"
TOMORROW_IO_BASE_URL = "https://api.tomorrow.io/v4"

@app.get("/")
async def root():
    return {
        "message": "Weather App Pro API is running!", 
        "status": "success",
        "endpoints": [
            "/health - Health check",
            "/api/weather/{location} - Get weather data",
            "/docs - API documentation"
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "weather-app-backend"}

@app.get("/api/weather/{location}")
async def get_weather(location: str):
    """
    Get current weather data for specified location
    
    Args:
        location: City name, coordinates, or address
        
    Returns:
        Weather data from Tomorrow.io API
    """
    
    if not location or len(location.strip()) < 2:
        raise HTTPException(status_code=400, detail="Location parameter is required")
    
    # Clean location input
    location = location.strip()
    
    try:
        # Tomorrow.io API call
        url = f"{TOMORROW_IO_BASE_URL}/weather/realtime"
        params = {
            "location": location,
            "apikey": TOMORROW_IO_API_KEY
        }
        
        headers = {
            "accept": "application/json"
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params, headers=headers)
            
            if response.status_code == 200:
                weather_data = response.json()
                
                # Extract and format key weather information
                if weather_data.get("data") and weather_data["data"].get("values"):
                    values = weather_data["data"]["values"]
                    
                    # Format response for frontend
                    formatted_data = {
                        "location": location,
                        "timestamp": weather_data["data"].get("time"),
                        "weather": {
                            "temperature": values.get("temperature"),
                            "humidity": values.get("humidity"),
                            "windSpeed": values.get("windSpeed"),
                            "windDirection": values.get("windDirection"),
                            "weatherCode": values.get("weatherCode"),
                            "visibility": values.get("visibility"),
                            "cloudCover": values.get("cloudCover"),
                            "precipitationIntensity": values.get("precipitationIntensity")
                        },
                        "status": "success"
                    }
                    
                    return formatted_data
                else:
                    raise HTTPException(status_code=502, detail="Invalid weather data format")
                    
            elif response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid API key")
            elif response.status_code == 404:
                raise HTTPException(status_code=404, detail="Location not found")
            elif response.status_code == 429:
                raise HTTPException(status_code=429, detail="API rate limit exceeded")
            else:
                raise HTTPException(
                    status_code=502, 
                    detail=f"Weather service error: {response.status_code}"
                )
                
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Weather service timeout")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Weather service connection error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/weather/test/bratislava")
async def test_bratislava_weather():
    """Test endpoint for Bratislava weather"""
    return await get_weather("Bratislava")

@app.get("/api/test/tomorrow")
async def test_tomorrow_api():
    """Test Tomorrow.io API connection"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{TOMORROW_IO_BASE_URL}/weather/realtime",
                params={"location": "New York", "apikey": TOMORROW_IO_API_KEY}
            )
            
            return {
                "api_status": "connected" if response.status_code == 200 else "error",
                "status_code": response.status_code,
                "api_key_valid": response.status_code != 401,
                "rate_limit_ok": response.status_code != 429
            }
    except Exception as e:
        return {
            "api_status": "connection_error",
            "error": str(e)
        }

# Weather code mapping for user-friendly descriptions
WEATHER_CODES = {
    1000: "Clear, Sunny",
    1100: "Mostly Clear",
    1101: "Partly Cloudy",
    1102: "Mostly Cloudy",
    1001: "Cloudy",
    2000: "Fog",
    2100: "Light Fog",
    4000: "Drizzle",
    4001: "Rain",
    4200: "Light Rain",
    4201: "Heavy Rain",
    5000: "Snow",
    5001: "Flurries",
    5100: "Light Snow",
    5101: "Heavy Snow",
    6000: "Freezing Drizzle",
    6001: "Freezing Rain",
    6200: "Light Freezing Rain",
    6201: "Heavy Freezing Rain",
    7000: "Ice Pellets",
    7101: "Heavy Ice Pellets",
    7102: "Light Ice Pellets",
    8000: "Thunderstorm"
}

@app.get("/api/weather/description/{weather_code}")
async def get_weather_description(weather_code: int):
    """Get human-readable weather description from weather code"""
    description = WEATHER_CODES.get(weather_code, "Unknown weather condition")
    return {"weather_code": weather_code, "description": description}


# 
# Open Meteo
# https://open-meteo.com/en/docs
#

@app.get("/api/weather-free/{location}")
async def get_weather_free(location: str, type: Optional[str] = "hourly"):
    """FREE weather data cez Open-Meteo (unlimited calls)"""
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Geocoding → lat/lon
            geo_url = "https://geocoding-api.open-meteo.com/v1/search"
            geo_response = await client.get(geo_url, params={"name": location})
            geo_data = geo_response.json()
            
            if not geo_data.get("results"):
                raise HTTPException(status_code=404, detail="Location not found")
            
            place = geo_data["results"][0]
            lat = place["latitude"]
            lon = place["longitude"]
            
            # Weather fetch
            weather_url = "https://api.open-meteo.com/v1/forecast"
            weather_params = {
                "latitude": lat,
                "longitude": lon,
                "timezone": "auto"
            }

            # Podľa typu forecastu
            if type == "hourly":
                weather_params["hourly"] = "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability,weather_code"
            elif type == "daily":
                weather_params["daily"] = "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code"
            elif type == "current":
                weather_params["current"] = "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code"
            else:
                raise HTTPException(status_code=400, detail="Invalid forecast type")

            weather_response = await client.get(weather_url, params=weather_params)
            weather_data = weather_response.json()

            # Výstup podľa typu
            output = {
                "location": f"{place['name']}, {place.get('country', '')}",
                "source": "open-meteo",
                "status": "success"
            }

            if type == "hourly":
                hourly = weather_data.get("hourly", {})
                hourly_list = []
                for i in range(min(24, len(hourly["time"]))):
                    hourly_list.append({
                        "time": hourly["time"][i],
                        "temperature": hourly["temperature_2m"][i],
                        "humidity": hourly["relative_humidity_2m"][i],
                        "windSpeed": hourly["wind_speed_10m"][i],
                        "precipitationProbability": hourly["precipitation_probability"][i],
                        "weatherCode": hourly["weather_code"][i]
                    })
                output["forecast"] = { "hourly": hourly_list }

            elif type == "daily":
                daily = weather_data.get("daily", {})
                daily_list = []
                for i in range(len(daily["time"])):
                    daily_list.append({
                        "date": daily["time"][i],
                        "temperatureMax": daily["temperature_2m_max"][i],
                        "temperatureMin": daily["temperature_2m_min"][i],
                        "precipitationProbability": daily["precipitation_probability_max"][i],
                        "weatherCode": daily["weather_code"][i]
                    })
                output["forecast"] = { "daily": daily_list }

            elif type == "current":
                current = weather_data.get("current", {})
                output["weather"] = {
                    "temperature": current.get("temperature_2m"),
                    "humidity": current.get("relative_humidity_2m"),
                    "windSpeed": current.get("wind_speed_10m"),
                    "weatherCode": current.get("weather_code")
                }
                output["timestamp"] = current.get("time")

            return output
            
    except Exception as e:
        import traceback
        traceback_str = traceback.format_exc()
        raise HTTPException(status_code=500, detail=f"Open-Meteo error: {str(e)}\n{traceback_str}")

