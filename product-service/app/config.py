import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./nexora.db")
    ALLOW_SQLITE_FALLBACK: bool = False
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your_secret_key")

settings = Settings()