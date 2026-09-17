from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database import engine, Base
from app.models.order import Cart, CartItem, WishlistItem, Order, OrderItem, OrderTracking
from app.router import order_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


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

