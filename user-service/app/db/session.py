import logging
from app.database import engine, SessionLocal

logger = logging.getLogger("nexora.db")

async def get_db():
    """FastAPI dependency yielding a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
