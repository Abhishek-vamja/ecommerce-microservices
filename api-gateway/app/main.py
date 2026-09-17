import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Enable winloop on Windows if installed
if sys.platform == "win32":
    try:
        import winloop
        winloop.install()
    except Exception:
        pass

from app.user_serivce.routes import router as user_router
from app.product_service.routes import router as product_router
from app.order_service.routes import router as order_router
from app.payment_service.routes import router as payment_router
from app.core.ws_manager import ws_manager
from app.core.http_client import init_http_client, close_http_client, get_http_client
from app.config import settings
import httpx


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize shared persistent HTTP connection pool (HTTP keep-alive)
    await init_http_client()
    yield
    # Gracefully close connection pool
    await close_http_client()


app = FastAPI(
    title="Ecommerce API Gateway",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for all frontend origins (React / Next.js / Partner Portal / ngrok tunnels)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://localhost:8000",
        "https://wipe-harvest-zone.ngrok-free.dev",
        "http://wipe-harvest-zone.ngrok-free.dev",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https?://.*\.ngrok(-free)?\.(dev|app|io)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api"

app.include_router(user_router, prefix=API_PREFIX)
app.include_router(product_router, prefix=API_PREFIX)
app.include_router(order_router, prefix=API_PREFIX)
app.include_router(payment_router, prefix=API_PREFIX)


# --- WEBSOCKET ENDPOINTS FOR REAL-TIME USER ENGAGEMENT ---

@app.websocket("/ws/order/{order_id}")
async def websocket_order_endpoint(websocket: WebSocket, order_id: str):
    await ws_manager.connect_order(websocket, order_id)
    try:
        while True:
            # Keepalive listener / echo
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_order(websocket, order_id)


@app.websocket("/ws/user/{user_id}")
async def websocket_user_endpoint(websocket: WebSocket, user_id: str):
    await ws_manager.connect_user(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_user(websocket, user_id)


@app.websocket("/ws")
async def websocket_global_endpoint(websocket: WebSocket):
    await ws_manager.connect_global(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_global(websocket)


# --- INTERNAL BROADCAST & WEBHOOK ALIASES ---

@app.post("/internal/ws/broadcast")
async def internal_ws_broadcast(request: Request):
    """Internal endpoint called by microservices to push real-time events over WebSockets."""
    try:
        payload = await request.json()
        order_id = payload.get("order_id")
        user_id = payload.get("user_id")

        if order_id:
            await ws_manager.broadcast_order_event(order_id, payload)
        if user_id:
            await ws_manager.broadcast_user_event(user_id, payload)
        if not order_id and not user_id:
            # Broadcast globally
            await ws_manager.broadcast_order_event("__all__", payload)

        return JSONResponse(status_code=200, content={"status": "broadcast_sent"})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/webhook/razorpay")
@app.post("/payment/webhook")
async def root_webhook_alias(request: Request):
    """Direct alias for Razorpay webhooks configured at root level."""
    body = await request.json()
    headers = {k: v for k, v in request.headers.items() if k.lower().startswith("x-razorpay")}
    client = get_http_client()
    res = await client.post(f"{settings.PAYMENT_SERVICE_URL}/payment/webhook", json=body, headers=headers)
    return JSONResponse(status_code=res.status_code, content=res.json() if res.content else {})


@app.get("/")
async def root():
    return {
        "service": "api-gateway",
        "message": "ShopMate API Gateway is running with WebSockets",
        "version": "1.0.0",
        "services": [
            "user-service (8001)",
            "product-service (8002)",
            "order-service (8003)",
            "payment-service (8004)"
        ],
        "websocket_endpoints": [
            "ws://localhost:8000/ws/order/{order_id}",
            "ws://localhost:8000/ws/user/{user_id}",
            "ws://localhost:8000/ws"
        ]
    }


@app.get("/health")
async def health_check():
    return {
        "service": "api-gateway",
        "status": "healthy",
        "websocket": "ready"
    }


