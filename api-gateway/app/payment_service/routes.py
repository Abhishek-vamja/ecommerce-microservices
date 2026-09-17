import json
import logging
from typing import Optional
import jwt
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.routing import APIRouter

from app.config import settings
from app.core.response_helper import forward_response
from app.core.http_client import get_http_client
from app.grpc_client.payment_client import PaymentGrpcClient

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Payment API Gateway"])


def extract_headers(request: Request) -> dict:
    headers = {}
    if auth := request.headers.get("authorization"):
        headers["Authorization"] = auth
    if xff := request.headers.get("x-forwarded-for"):
        headers["X-Forwarded-For"] = xff
    elif request.client:
        headers["X-Forwarded-For"] = request.client.host
    return headers


def get_user_id_from_token(request: Request) -> Optional[str]:
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        return None
    token = auth.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload.get("user_id") or payload.get("sub")
    except Exception:
        return None


@router.post("/payment/create-order")
async def create_payment_order(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}

    user_id = get_user_id_from_token(request) or "user_guest"
    try:
        res = await PaymentGrpcClient.create_payment_order(user_id, data)
        if res.get("success", True):
            return JSONResponse(status_code=200, content=res)
        return JSONResponse(status_code=400, content={"detail": res.get("error_message", "Failed to create payment order")})
    except Exception as e:
        logger.warning(f"[Payment Gateway gRPC Fallback] create_order: {e}")

    client = get_http_client()
    res = await client.post(f"{settings.PAYMENT_SERVICE_URL}/payment/create-order", json=data, headers=extract_headers(request))
    return forward_response(res)


@router.post("/payment/verify")
async def verify_payment(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}

    try:
        res = await PaymentGrpcClient.verify_payment(data)
        if res.get("success", True):
            return JSONResponse(status_code=200, content=res)
        return JSONResponse(status_code=400, content={"detail": res.get("error_message", "Failed to verify payment")})
    except Exception as e:
        logger.warning(f"[Payment Gateway gRPC Fallback] verify_payment: {e}")

    client = get_http_client()
    res = await client.post(f"{settings.PAYMENT_SERVICE_URL}/payment/verify", json=data, headers=extract_headers(request))
    return forward_response(res)


@router.post("/payment/webhook")
async def payment_webhook(request: Request):
    try:
        raw_body = await request.body()
        sig = request.headers.get("X-Razorpay-Signature") or request.headers.get("x-razorpay-signature") or ""
        payload_str = raw_body.decode('utf-8') if raw_body else "{}"

        res = await PaymentGrpcClient.handle_webhook(payload_str, sig)
        return JSONResponse(status_code=200, content=res)
    except Exception as e:
        logger.warning(f"[Payment Gateway gRPC Fallback] webhook: {e}")

    try:
        data = await request.json()
    except Exception:
        data = {}
    client = get_http_client()
    res = await client.post(f"{settings.PAYMENT_SERVICE_URL}/payment/webhook", json=data, headers=extract_headers(request))
    return forward_response(res)
