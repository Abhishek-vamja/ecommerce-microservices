import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    USER_SERVICE_URL: str = os.getenv("USER_SERVICE_URL", "http://localhost:8001")
    PRODUCT_SERVICE_URL: str = os.getenv("PRODUCT_SERVICE_URL", "http://localhost:8002")
    ORDER_SERVICE_URL: str = os.getenv("ORDER_SERVICE_URL", "http://localhost:8003")
    PAYMENT_SERVICE_URL: str = os.getenv("PAYMENT_SERVICE_URL", "http://localhost:8004")

settings = Settings()
