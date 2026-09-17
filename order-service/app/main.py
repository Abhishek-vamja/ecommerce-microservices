from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database import engine, Base
from app.models.order import Cart, CartItem, WishlistItem, Order, OrderItem, OrderTracking
from app.router import order_router
from app.grpc_service.server import start_grpc_server, stop_grpc_server


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    
    # Start High-Speed Binary gRPC Server on Port 50053
    await start_grpc_server(host="0.0.0.0", port=50053)

    yield

    # Graceful gRPC Server Shutdown
    await stop_grpc_server()


app = FastAPI(
    title="Ecommerce Order Service",
    version="1.0.0",
    lifespan=lifespan,
)

APP_V1 = "/api/v1"

@app.get("/")
async def root():
    return {"service": "order-service", "status": "running"}

@app.get("/health")
async def health():
    return {"service": "order-service", "status": "healthy"}

app.include_router(order_router.router, prefix=APP_V1)
app.include_router(order_router.router, prefix="/api")
app.include_router(order_router.router)
