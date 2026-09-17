import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./nexora_order.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "econ-super-secret-jwt-key-2026-change-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    PRODUCT_SERVICE_URL: str = os.getenv("PRODUCT_SERVICE_URL", "http://localhost:8002")
    PAYMENT_SERVICE_URL: str = os.getenv("PAYMENT_SERVICE_URL", "http://localhost:8004")
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))

settings = Settings()
