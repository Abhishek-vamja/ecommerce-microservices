import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Import all models to ensure metadata registration
import app.models  # noqa: F401

logger = logging.getLogger("nexora.db")


def init_engine():
    """Initialize PostgreSQL engine with SQLite fallback support."""
    db_url = settings.DATABASE_URL
    try:
        engine = create_engine(db_url, pool_pre_ping=True)
        # Verify connection
        with engine.connect() as conn:
            pass
        logger.info(f"Connected to primary database: {db_url.split('@')[-1] if '@' in db_url else db_url}")
        return engine
    except Exception as e:
        if settings.ALLOW_SQLITE_FALLBACK:
            logger.warning(f"PostgreSQL connection failed ({e}). Falling back to SQLite database (nexora.db)...")
            sqlite_url = "sqlite:///./nexora.db"
            return create_engine(sqlite_url, connect_args={"check_same_thread": False})
        else:
            raise e

engine = init_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

async def get_db():
    """FastAPI dependency yielding a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
