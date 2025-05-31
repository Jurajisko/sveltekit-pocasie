from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import asyncpg
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Weather App Pro API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Weather App Pro API is running!", "status": "success"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "weather-app-backend"}

@app.get("/db-test")
async def test_database():
    """Test database connection"""
    try:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return {"database": "error", "message": "DATABASE_URL not found in environment"}
        
        logger.info(f"Attempting to connect to database...")
        conn = await asyncpg.connect(database_url)
        
        # Test query
        result = await conn.fetchval("SELECT version()")
        await conn.close()
        
        logger.info("Database connection successful")
        return {
            "database": "connected", 
            "version": result[:50] + "..." if len(result) > 50 else result,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        return {
            "database": "error", 
            "message": str(e),
            "status": "failed"
        }

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Weather App Backend starting up...")
    
    # Check environment variables
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        logger.info("✅ DATABASE_URL found in environment")
    else:
        logger.error("❌ DATABASE_URL not found in environment")

@app.on_event("shutdown") 
async def shutdown_event():
    logger.info("🛑 Weather App Backend shutting down...")
