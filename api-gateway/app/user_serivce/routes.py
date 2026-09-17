import logging
from typing import Optional
import jwt
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.routing import APIRouter

from app.config import settings
from app.core.response_helper import forward_response
from app.core.http_client import get_http_client
from app.grpc_client.user_client import UserGrpcClient

logger = logging.getLogger(__name__)

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


@router.post("/auth")
@router.post("/register")
@router.post("/login")
async def register_or_login(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}

    try:
        email = data.get("email", "")
        role = data.get("role", "enduser")
        if email:
            res = await UserGrpcClient.register_or_login(email=email, role=role)
            status_code = 200 if res.get("success", True) else 400
            return JSONResponse(status_code=status_code, content=res)
    except Exception as e:
        logger.warning(f"[User Gateway gRPC Fallback] register_or_login: {e}")

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

    try:
        user_id = data.get("user_id", "")
        otp = int(data.get("otp", 0))
        if user_id and otp:
            res = await UserGrpcClient.verify_otp(user_id=user_id, otp=otp)
            status_code = 200 if res.get("success", True) else 400
            return JSONResponse(status_code=status_code, content=res)
    except Exception as e:
        logger.warning(f"[User Gateway gRPC Fallback] verify_otp: {e}")

    client = get_http_client()
    response = await client.post(
        f"{settings.USER_SERVICE_URL}/user/verify",
        json=data,
        headers=extract_headers(request),
    )
    return forward_response(response)


@router.get("/me")
async def get_profile(request: Request):
    user_id = get_user_id_from_token(request)
    if user_id:
        try:
            profile = await UserGrpcClient.get_user_profile(user_id)
            if profile:
                return JSONResponse(status_code=200, content=profile)
            return JSONResponse(status_code=404, content={"detail": "User not found"})
        except Exception as e:
            logger.warning(f"[User Gateway gRPC Fallback] get_profile: {e}")

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

    user_id = get_user_id_from_token(request)
    if user_id:
        try:
            res = await UserGrpcClient.update_user_profile(user_id, data)
            status_code = 200 if res.get("success", True) else 400
            return JSONResponse(status_code=status_code, content=res)
        except Exception as e:
            logger.warning(f"[User Gateway gRPC Fallback] update_profile: {e}")

    client = get_http_client()
    response = await client.put(
        f"{settings.USER_SERVICE_URL}/user/me",
        json=data,
        headers=extract_headers(request),
    )
    return forward_response(response)


@router.get("/addresses")
async def get_addresses(request: Request):
    user_id = get_user_id_from_token(request)
    if user_id:
        try:
            addresses = await UserGrpcClient.get_addresses(user_id)
            return JSONResponse(status_code=200, content=addresses)
        except Exception as e:
            logger.warning(f"[User Gateway gRPC Fallback] get_addresses: {e}")

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

    user_id = get_user_id_from_token(request)
    if user_id:
        try:
            res = await UserGrpcClient.add_address(user_id, data)
            status_code = 201 if res.get("success", True) else 400
            return JSONResponse(status_code=status_code, content=res)
        except Exception as e:
            logger.warning(f"[User Gateway gRPC Fallback] add_address: {e}")

    client = get_http_client()
    response = await client.post(
        f"{settings.USER_SERVICE_URL}/user/addresses",
        json=data,
        headers=extract_headers(request),
    )
    return forward_response(response)


@router.delete("/addresses/{address_id}")
async def delete_address(address_id: str, request: Request):
    user_id = get_user_id_from_token(request)
    if user_id:
        try:
            res = await UserGrpcClient.delete_address(user_id, address_id)
            status_code = 200 if res.get("success", True) else 404
            return JSONResponse(status_code=status_code, content=res)
        except Exception as e:
            logger.warning(f"[User Gateway gRPC Fallback] delete_address: {e}")

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

    try:
        res = await UserGrpcClient.register_seller(data)
        status_code = 201 if res.get("success", True) else 400
        return JSONResponse(status_code=status_code, content=res)
    except Exception as e:
        logger.warning(f"[User Gateway gRPC Fallback] seller_register: {e}")

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

    try:
        email = data.get("email", "")
        if email:
            res = await UserGrpcClient.seller_auth_otp(email)
            status_code = 200 if res.get("success", True) else 404
            return JSONResponse(status_code=status_code, content=res)
    except Exception as e:
        logger.warning(f"[User Gateway gRPC Fallback] seller_auth: {e}")

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

    try:
        user_id = data.get("user_id", "")
        otp = int(data.get("otp", 0))
        if user_id and otp:
            res = await UserGrpcClient.seller_verify_otp(user_id, otp)
            status_code = 200 if res.get("success", True) else 400
            return JSONResponse(status_code=status_code, content=res)
    except Exception as e:
        logger.warning(f"[User Gateway gRPC Fallback] seller_verify: {e}")

    client = get_http_client()
    response = await client.post(
        f"{settings.USER_SERVICE_URL}/user/seller/verify",
        json=data,
        headers=extract_headers(request),
    )
    return forward_response(response)


@router.get("/seller/me")
async def proxy_seller_me(request: Request):
    user_id = get_user_id_from_token(request)
    if user_id:
        try:
            seller = await UserGrpcClient.get_seller_profile(user_id)
            if seller:
                return JSONResponse(status_code=200, content=seller)
            return JSONResponse(status_code=404, content={"detail": "Seller shop not found"})
        except Exception as e:
            logger.warning(f"[User Gateway gRPC Fallback] seller_me: {e}")

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

    try:
        email = data.get("email", "")
        if email:
            res = await UserGrpcClient.admin_auth_otp(email)
            status_code = 200 if res.get("success", True) else 403
            return JSONResponse(status_code=status_code, content=res)
    except Exception as e:
        logger.warning(f"[User Gateway gRPC Fallback] admin_auth: {e}")

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

    try:
        user_id = data.get("user_id", "")
        otp = int(data.get("otp", 0))
        if user_id and otp:
            res = await UserGrpcClient.admin_verify_otp(user_id, otp)
            status_code = 200 if res.get("success", True) else 400
            return JSONResponse(status_code=status_code, content=res)
    except Exception as e:
        logger.warning(f"[User Gateway gRPC Fallback] admin_verify: {e}")

    client = get_http_client()
    response = await client.post(
        f"{settings.USER_SERVICE_URL}/user/admin/verify",
        json=data,
        headers=extract_headers(request),
    )
    return forward_response(response)


@router.get("/admin/sellers")
async def proxy_admin_sellers(request: Request):
    try:
        sellers = await UserGrpcClient.get_all_sellers_for_admin()
        return JSONResponse(status_code=200, content=sellers)
    except Exception as e:
        logger.warning(f"[User Gateway gRPC Fallback] admin_sellers: {e}")

    client = get_http_client()
    response = await client.get(
        f"{settings.USER_SERVICE_URL}/user/admin/sellers",
        headers=extract_headers(request),
    )
    return forward_response(response)


@router.put("/admin/sellers/{seller_id}/toggle-status")
async def proxy_admin_toggle_seller(seller_id: str, request: Request):
    try:
        res = await UserGrpcClient.toggle_seller_status(seller_id)
        status_code = 200 if res.get("success", True) else 404
        return JSONResponse(status_code=status_code, content=res)
    except Exception as e:
        logger.warning(f"[User Gateway gRPC Fallback] toggle_seller: {e}")

    client = get_http_client()
    response = await client.put(
        f"{settings.USER_SERVICE_URL}/user/admin/sellers/{seller_id}/toggle-status",
        headers=extract_headers(request),
    )
    return forward_response(response)
