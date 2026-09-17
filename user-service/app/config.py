import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./nexora.db")
    ALLOW_SQLITE_FALLBACK: bool = False
    ACCESS_TOKEN_EXPIRE_MINUTES : int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10080))
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your_secret_key")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")

settings = Settings()