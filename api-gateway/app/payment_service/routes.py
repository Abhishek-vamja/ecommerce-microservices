from fastapi import Request
from fastapi.routing import APIRouter

from app.config import settings
from app.core.response_helper import forward_response
from app.core.http_client import get_http_client

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


@router.post("/payment/create-order")
async def create_payment_order(request: Request):
    data = await request.json()
    client = get_http_client()
    res = await client.post(f"{settings.PAYMENT_SERVICE_URL}/payment/create-order", json=data, headers=extract_headers(request))
    return forward_response(res)


@router.post("/payment/verify")
async def verify_payment(request: Request):
    data = await request.json()
    client = get_http_client()
    res = await client.post(f"{settings.PAYMENT_SERVICE_URL}/payment/verify", json=data, headers=extract_headers(request))
    return forward_response(res)


@router.post("/payment/webhook")
async def payment_webhook(request: Request):
    data = await request.json()
    client = get_http_client()
    res = await client.post(f"{settings.PAYMENT_SERVICE_URL}/payment/webhook", json=data, headers=extract_headers(request))
    return forward_response(res)
