import logging
from typing import Optional
import jwt
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.routing import APIRouter

from app.config import settings
from app.core.response_helper import forward_response
from app.core.http_client import get_http_client
from app.grpc_client.order_client import OrderGrpcClient

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Order API Gateway"])


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


# --- Cart Routes ---

@router.get("/cart")
async def get_cart(request: Request):
    user_id = get_user_id_from_token(request)
    if user_id:
        try:
            cart = await OrderGrpcClient.get_cart(user_id)
            return JSONResponse(status_code=200, content=cart)
        except Exception as e:
            logger.warning(f"[Order Gateway gRPC Fallback] get_cart: {e}")

    client = get_http_client()
    res = await client.get(f"{settings.ORDER_SERVICE_URL}/cart", headers=extract_headers(request))
    return forward_response(res)


@router.post("/cart/items")
async def add_to_cart(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}

    user_id = get_user_id_from_token(request)
    if user_id:
        try:
            res = await OrderGrpcClient.add_to_cart(user_id, data)
            status_code = 200 if res.get("success", True) else 400
            return JSONResponse(status_code=status_code, content=res)
        except Exception as e:
            logger.warning(f"[Order Gateway gRPC Fallback] add_to_cart: {e}")

    client = get_http_client()
    res = await client.post(f"{settings.ORDER_SERVICE_URL}/cart/items", json=data, headers=extract_headers(request))
    return forward_response(res)


@router.put("/cart/items/{item_id}")
async def update_cart(item_id: str, request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}

    user_id = get_user_id_from_token(request)
    if user_id:
        try:
            qty = int(data.get("quantity", 1))
            res = await OrderGrpcClient.update_cart_item(user_id, item_id, qty)
            status_code = 200 if res.get("success", True) else 400
            return JSONResponse(status_code=status_code, content=res)
        except Exception as e:
            logger.warning(f"[Order Gateway gRPC Fallback] update_cart: {e}")

    client = get_http_client()
    res = await client.put(f"{settings.ORDER_SERVICE_URL}/cart/items/{item_id}", json=data, headers=extract_headers(request))
    return forward_response(res)


@router.delete("/cart/items/{item_id}")
async def delete_cart(item_id: str, request: Request):
    user_id = get_user_id_from_token(request)
    if user_id:
        try:
            res = await OrderGrpcClient.delete_cart_item(user_id, item_id)
            status_code = 200 if res.get("success", True) else 400
            return JSONResponse(status_code=status_code, content=res)
        except Exception as e:
            logger.warning(f"[Order Gateway gRPC Fallback] delete_cart: {e}")

    client = get_http_client()
    res = await client.delete(f"{settings.ORDER_SERVICE_URL}/cart/items/{item_id}", headers=extract_headers(request))
    return forward_response(res)


@router.delete("/cart/clear")
async def clear_cart(request: Request):
    user_id = get_user_id_from_token(request)
    if user_id:
        try:
            res = await OrderGrpcClient.clear_cart(user_id)
            status_code = 200 if res.get("success", True) else 400
            return JSONResponse(status_code=status_code, content=res)
        except Exception as e:
            logger.warning(f"[Order Gateway gRPC Fallback] clear_cart: {e}")

    client = get_http_client()
    res = await client.delete(f"{settings.ORDER_SERVICE_URL}/cart/clear", headers=extract_headers(request))
    return forward_response(res)


# --- Wishlist Routes ---

@router.get("/wishlist")
async def get_wishlist(request: Request):
    user_id = get_user_id_from_token(request)
    if user_id:
        try:
            items = await OrderGrpcClient.get_wishlist(user_id)
            return JSONResponse(status_code=200, content=items)
        except Exception as e:
            logger.warning(f"[Order Gateway gRPC Fallback] get_wishlist: {e}")

    client = get_http_client()
    res = await client.get(f"{settings.ORDER_SERVICE_URL}/wishlist", headers=extract_headers(request))
    return forward_response(res)


@router.post("/wishlist/toggle")
async def toggle_wishlist(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}

    user_id = get_user_id_from_token(request)
    if user_id:
        try:
            res = await OrderGrpcClient.toggle_wishlist(user_id, data)
            return JSONResponse(status_code=200, content=res)
        except Exception as e:
            logger.warning(f"[Order Gateway gRPC Fallback] toggle_wishlist: {e}")

    client = get_http_client()
    res = await client.post(f"{settings.ORDER_SERVICE_URL}/wishlist/toggle", json=data, headers=extract_headers(request))
    return forward_response(res)


@router.post("/wishlist/move-to-cart/{product_id}")
async def move_to_cart(product_id: str, request: Request):
    user_id = get_user_id_from_token(request)
    if user_id:
        try:
            res = await OrderGrpcClient.move_wishlist_to_cart(user_id, product_id)
            return JSONResponse(status_code=200, content=res)
        except Exception as e:
            logger.warning(f"[Order Gateway gRPC Fallback] move_to_cart: {e}")

    client = get_http_client()
    res = await client.post(f"{settings.ORDER_SERVICE_URL}/wishlist/move-to-cart/{product_id}", headers=extract_headers(request))
    return forward_response(res)


# --- Order Routes ---

@router.post("/order/checkout")
async def checkout(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}

    user_id = get_user_id_from_token(request)
    if user_id:
        try:
            res = await OrderGrpcClient.checkout_order(user_id, data)
            if res.get("success", True):
                return JSONResponse(status_code=201, content=res)
            return JSONResponse(status_code=400, content={"detail": res.get("error_message", "Checkout failed")})
        except Exception as e:
            logger.warning(f"[Order Gateway gRPC Fallback] checkout: {e}")

    client = get_http_client()
    res = await client.post(f"{settings.ORDER_SERVICE_URL}/order/checkout", json=data, headers=extract_headers(request))
    return forward_response(res)


@router.get("/order/my-orders")
async def get_my_orders(request: Request):
    user_id = get_user_id_from_token(request)
    if user_id:
        try:
            orders = await OrderGrpcClient.get_my_orders(user_id)
            return JSONResponse(status_code=200, content=orders)
        except Exception as e:
            logger.warning(f"[Order Gateway gRPC Fallback] get_my_orders: {e}")

    client = get_http_client()
    res = await client.get(f"{settings.ORDER_SERVICE_URL}/order/my-orders", headers=extract_headers(request))
    return forward_response(res)


@router.get("/order/{order_id}")
async def get_order_details(order_id: str, request: Request):
    user_id = get_user_id_from_token(request) or ""
    try:
        order = await OrderGrpcClient.get_order_by_id(user_id, order_id)
        if order:
            return JSONResponse(status_code=200, content=order)
        return JSONResponse(status_code=404, content={"detail": "Order not found"})
    except Exception as e:
        logger.warning(f"[Order Gateway gRPC Fallback] get_order_details: {e}")

    client = get_http_client()
    res = await client.get(f"{settings.ORDER_SERVICE_URL}/order/{order_id}", headers=extract_headers(request))
    return forward_response(res)


@router.get("/order/{order_id}/tracking")
async def get_order_tracking(order_id: str, request: Request):
    try:
        tracking = await OrderGrpcClient.get_order_tracking(order_id)
        if tracking and tracking.get("exists", True):
            return JSONResponse(status_code=200, content=tracking)
        return JSONResponse(status_code=404, content={"detail": "Order tracking not found"})
    except Exception as e:
        logger.warning(f"[Order Gateway gRPC Fallback] get_order_tracking: {e}")

    client = get_http_client()
    res = await client.get(f"{settings.ORDER_SERVICE_URL}/order/{order_id}/tracking", headers=extract_headers(request))
    return forward_response(res)


# --- Seller & Admin Routes ---

@router.get("/order/seller/analytics")
async def get_seller_analytics(request: Request):
    params = dict(request.query_params)
    seller_id = params.get("seller_id", "")
    if seller_id:
        try:
            analytics = await OrderGrpcClient.get_seller_analytics(seller_id)
            return JSONResponse(status_code=200, content=analytics)
        except Exception as e:
            logger.warning(f"[Order Gateway gRPC Fallback] get_seller_analytics: {e}")

    client = get_http_client()
    res = await client.get(f"{settings.ORDER_SERVICE_URL}/order/seller/analytics", params=params, headers=extract_headers(request))
    return forward_response(res)


@router.get("/order/seller/orders")
async def get_seller_orders(request: Request):
    params = dict(request.query_params)
    seller_id = params.get("seller_id", "")
    if seller_id:
        try:
            orders = await OrderGrpcClient.get_seller_orders(seller_id)
            return JSONResponse(status_code=200, content=orders)
        except Exception as e:
            logger.warning(f"[Order Gateway gRPC Fallback] get_seller_orders: {e}")

    client = get_http_client()
    res = await client.get(f"{settings.ORDER_SERVICE_URL}/order/seller/orders", params=params, headers=extract_headers(request))
    return forward_response(res)


@router.put("/order/seller/{order_id}/status")
async def update_seller_order_status(order_id: str, request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}

    try:
        res = await OrderGrpcClient.update_seller_order_status(order_id, data)
        status_code = 200 if res.get("success", True) else 400
        return JSONResponse(status_code=status_code, content=res)
    except Exception as e:
        logger.warning(f"[Order Gateway gRPC Fallback] update_seller_order_status: {e}")

    client = get_http_client()
    res = await client.put(f"{settings.ORDER_SERVICE_URL}/order/seller/{order_id}/status", json=data, headers=extract_headers(request))
    return forward_response(res)


@router.get("/order/admin/profits")
async def get_admin_profits(request: Request):
    try:
        profits = await OrderGrpcClient.get_admin_profits()
        return JSONResponse(status_code=200, content=profits)
    except Exception as e:
        logger.warning(f"[Order Gateway gRPC Fallback] get_admin_profits: {e}")

    client = get_http_client()
    res = await client.get(f"{settings.ORDER_SERVICE_URL}/order/admin/profits", headers=extract_headers(request))
    return forward_response(res)


@router.get("/order/admin/sellers-summary")
async def get_admin_sellers_summary(request: Request):
    try:
        summary = await OrderGrpcClient.get_admin_sellers_summary()
        return JSONResponse(status_code=200, content=summary)
    except Exception as e:
        logger.warning(f"[Order Gateway gRPC Fallback] get_admin_sellers_summary: {e}")

    client = get_http_client()
    res = await client.get(f"{settings.ORDER_SERVICE_URL}/order/admin/sellers-summary", headers=extract_headers(request))
    return forward_response(res)
