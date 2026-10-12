import os
from typing import List


class Settings:
    APP_NAME: str = os.getenv("APP_NAME", "TaskFlow API")
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # SQLite file path
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "tasks.db")
    
    # CORS Origins (includes Vite frontend defaults)
    _raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
    ALLOWED_ORIGINS: List[str] = [origin.strip() for origin in _raw_origins.split(",") if origin.strip()]


settings = Settings()
