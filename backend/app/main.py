from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="ResQNet Humanitarian Resource Decision-Support System API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "scenarioNow": settings.SCENARIO_NOW_STR,
        "mode": "live",
        "scenario": settings.get_scenario_metadata().get("scenario", {}).get("name", "Assam Flood 2024"),
    }

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "scenarioClock": settings.SCENARIO_NOW_STR,
        "docsUrl": "/docs",
    }
