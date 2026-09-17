from fastapi import Request
from fastapi.routing import APIRouter

from app.config import settings
from app.core.response_helper import forward_response
from app.core.http_client import get_http_client

router = APIRouter(prefix="/user", tags=["User API Gateway"])


def extract_headers(request: Request) -> dict:
    headers = {}
    if auth := request.headers.get("authorization"):
        headers["Authorization"] = auth
    if xff := request.headers.get("x-forwarded-for"):
        headers["X-Forwarded-For"] = xff
    elif request.client:
        headers["X-Forwarded-For"] = request.client.host
    return headers


@router.post("/auth")
@router.post("/register")
@router.post("/login")
async def register_or_login(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}

    client = get_http_client()
    response = await client.post(
        f"{settings.USER_SERVICE_URL}/user/auth",
        json=data,
        headers=extract_headers(request),
    )
    return forward_response(response)


@router.post("/verify")
@router.post("/verify-otp")
async def verify_otp(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}

    client = get_http_client()
    response = await client.post(
        f"{settings.USER_SERVICE_URL}/user/verify",
        json=data,
        headers=extract_headers(request),
    )
    return forward_response(response)


@router.get("/me")
async def get_profile(request: Request):
    client = get_http_client()
    response = await client.get(
        f"{settings.USER_SERVICE_URL}/user/me",
        headers=extract_headers(request),
    )
    return forward_response(response)


@router.put("/me")
async def update_profile(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}

    client = get_http_client()
    response = await client.put(
        f"{settings.USER_SERVICE_URL}/user/me",
        json=data,
        headers=extract_headers(request),
    )
    return forward_response(response)


@router.get("/addresses")
async def get_addresses(request: Request):
    client = get_http_client()
    response = await client.get(
        f"{settings.USER_SERVICE_URL}/user/addresses",
        headers=extract_headers(request),
    )
    return forward_response(response)


@router.post("/addresses")
async def add_address(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}

    client = get_http_client()
    response = await client.post(
        f"{settings.USER_SERVICE_URL}/user/addresses",
        json=data,
        headers=extract_headers(request),
    )
    return forward_response(response)


@router.delete("/addresses/{address_id}")
async def delete_address(address_id: str, request: Request):
    client = get_http_client()
    response = await client.delete(
        f"{settings.USER_SERVICE_URL}/user/addresses/{address_id}",
        headers=extract_headers(request),
    )
    return forward_response(response)


# --- SELLER & ADMIN ROUTES ---

@router.post("/seller/register")
async def proxy_seller_register(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}
    client = get_http_client()
    response = await client.post(
        f"{settings.USER_SERVICE_URL}/user/seller/register",
        json=data,
        headers=extract_headers(request),
    )
    return forward_response(response)


@router.post("/seller/auth")
@router.post("/seller/login")
async def proxy_seller_auth(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}
    client = get_http_client()
    response = await client.post(
        f"{settings.USER_SERVICE_URL}/user/seller/auth",
        json=data,
        headers=extract_headers(request),
    )
    return forward_response(response)


@router.post("/seller/verify")
async def proxy_seller_verify(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}
    client = get_http_client()
    response = await client.post(
        f"{settings.USER_SERVICE_URL}/user/seller/verify",
        json=data,
        headers=extract_headers(request),
    )
    return forward_response(response)


@router.get("/seller/me")
async def proxy_seller_me(request: Request):
    client = get_http_client()
    response = await client.get(
        f"{settings.USER_SERVICE_URL}/user/seller/me",
        headers=extract_headers(request),
    )
    return forward_response(response)


@router.post("/admin/auth")
@router.post("/admin/login")
async def proxy_admin_auth(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}
    client = get_http_client()
    response = await client.post(
        f"{settings.USER_SERVICE_URL}/user/admin/auth",
        json=data,
        headers=extract_headers(request),
    )
    return forward_response(response)


@router.post("/admin/verify")
async def proxy_admin_verify(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}
    client = get_http_client()
    response = await client.post(
        f"{settings.USER_SERVICE_URL}/user/admin/verify",
        json=data,
        headers=extract_headers(request),
    )
    return forward_response(response)


@router.get("/admin/sellers")
async def proxy_admin_sellers(request: Request):
    client = get_http_client()
    response = await client.get(
        f"{settings.USER_SERVICE_URL}/user/admin/sellers",
        headers=extract_headers(request),
    )
    return forward_response(response)


@router.put("/admin/sellers/{seller_id}/toggle-status")
async def proxy_admin_toggle_seller(seller_id: str, request: Request):
    client = get_http_client()
    response = await client.put(
        f"{settings.USER_SERVICE_URL}/user/admin/sellers/{seller_id}/toggle-status",
        headers=extract_headers(request),
    )
    return forward_response(response)



