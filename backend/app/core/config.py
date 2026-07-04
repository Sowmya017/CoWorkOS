from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/coworkos"
    SECRET_KEY: str = "coworkos-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"
    GROK_API_KEY: str = ""

    def get_cors_origins(self) -> List[str]:
        s = self.CORS_ORIGINS.strip()
        # Handle JSON array format: ["a","b"] → split on ,
        if s.startswith("["):
            import json
            return json.loads(s)
        return [o.strip() for o in s.split(",") if o.strip()]

    class Config:
        env_file = ".env"

settings = Settings()
