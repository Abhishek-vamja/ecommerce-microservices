from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy import text

from app.database import engine, Base
from app.model.user import User, Address
from app.router import user_router
from app.grpc_service.server import start_grpc_server, stop_grpc_server


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    # Ensure any new columns exist in existing PostgreSQL/SQLite databases
    for col, col_type in [
        ("phone", "VARCHAR(20)"),
        ("avatar_url", "VARCHAR(500)"),
    ]:
        try:
            with engine.connect() as conn:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col} {col_type};"))
                conn.commit()
        except Exception:
            pass

    # Start High-Speed Binary gRPC Server on Port 50052
    await start_grpc_server(host="0.0.0.0", port=50052)

    yield

    # Graceful gRPC Server Shutdown
    await stop_grpc_server()


app = FastAPI(
    title="Ecommerce User Service",
    version="1.0.0",
    lifespan=lifespan,
)

APP_V1 = "/api/v1"

@app.get("/")
async def root():
    return {
        "service": "user-service",
        "message": "User Service is running",
    }

@app.get("/health")
async def health_check():
    return {
        "service": "user-service",
        "status": "healthy",
    }

app.include_router(user_router.router)