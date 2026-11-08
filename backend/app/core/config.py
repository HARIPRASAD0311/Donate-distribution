from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict, Any
import yaml
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent
CONFIG_PATH = BASE_DIR / "config" / "scenario.yaml"

class Settings(BaseSettings):
    PROJECT_NAME: str = "ResQNet Backend"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'resqnet.db'}"
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "*",
    ]
    
    # Authoritative scenario reference clock
    SCENARIO_NOW_STR: str = "2024-07-05T09:30:00Z"
    
    @property
    def SCENARIO_NOW(self) -> datetime:
        return datetime.fromisoformat(self.SCENARIO_NOW_STR.replace("Z", "+00:00"))

    def get_scenario_metadata(self) -> Dict[str, Any]:
        if CONFIG_PATH.exists():
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return yaml.safe_load(f)
        return {}

settings = Settings()

