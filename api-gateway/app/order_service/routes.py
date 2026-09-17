from fastapi import Request
from fastapi.routing import APIRouter

from app.config import settings
from app.core.response_helper import forward_response
from app.core.http_client import get_http_client

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


# --- Cart Routes ---

@router.get("/cart")
async def get_cart(request: Request):
    client = get_http_client()
    res = await client.get(f"{settings.ORDER_SERVICE_URL}/cart", headers=extract_headers(request))
    return forward_response(res)


@router.post("/cart/items")
async def add_to_cart(request: Request):
    data = await request.json()
    client = get_http_client()
    res = await client.post(f"{settings.ORDER_SERVICE_URL}/cart/items", json=data, headers=extract_headers(request))
    return forward_response(res)


@router.put("/cart/items/{item_id}")
async def update_cart(item_id: str, request: Request):
    data = await request.json()
    client = get_http_client()
    res = await client.put(f"{settings.ORDER_SERVICE_URL}/cart/items/{item_id}", json=data, headers=extract_headers(request))
    return forward_response(res)


@router.delete("/cart/items/{item_id}")
async def delete_cart(item_id: str, request: Request):
    client = get_http_client()
    res = await client.delete(f"{settings.ORDER_SERVICE_URL}/cart/items/{item_id}", headers=extract_headers(request))
    return forward_response(res)


@router.delete("/cart/clear")
async def clear_cart(request: Request):
    client = get_http_client()
    res = await client.delete(f"{settings.ORDER_SERVICE_URL}/cart/clear", headers=extract_headers(request))
    return forward_response(res)


# --- Wishlist Routes ---

@router.get("/wishlist")
async def get_wishlist(request: Request):
    client = get_http_client()
    res = await client.get(f"{settings.ORDER_SERVICE_URL}/wishlist", headers=extract_headers(request))
    return forward_response(res)


@router.post("/wishlist/toggle")
async def toggle_wishlist(request: Request):
    data = await request.json()
    client = get_http_client()
    res = await client.post(f"{settings.ORDER_SERVICE_URL}/wishlist/toggle", json=data, headers=extract_headers(request))
    return forward_response(res)


@router.post("/wishlist/move-to-cart/{product_id}")
async def move_to_cart(product_id: str, request: Request):
    client = get_http_client()
    res = await client.post(f"{settings.ORDER_SERVICE_URL}/wishlist/move-to-cart/{product_id}", headers=extract_headers(request))
    return forward_response(res)


# --- Order Routes ---

@router.post("/order/checkout")
async def checkout(request: Request):
    data = await request.json()
    client = get_http_client()
    res = await client.post(f"{settings.ORDER_SERVICE_URL}/order/checkout", json=data, headers=extract_headers(request))
    return forward_response(res)


@router.get("/order/my-orders")
async def get_my_orders(request: Request):
    client = get_http_client()
    res = await client.get(f"{settings.ORDER_SERVICE_URL}/order/my-orders", headers=extract_headers(request))
    return forward_response(res)


@router.get("/order/{order_id}")
async def get_order_details(order_id: str, request: Request):
    client = get_http_client()
    res = await client.get(f"{settings.ORDER_SERVICE_URL}/order/{order_id}", headers=extract_headers(request))
    return forward_response(res)


@router.get("/order/{order_id}/tracking")
async def get_order_tracking(order_id: str, request: Request):
    client = get_http_client()
    res = await client.get(f"{settings.ORDER_SERVICE_URL}/order/{order_id}/tracking", headers=extract_headers(request))
    return forward_response(res)


# --- Seller & Admin Routes ---

@router.get("/order/seller/analytics")
async def get_seller_analytics(request: Request):
    client = get_http_client()
    params = dict(request.query_params)
    res = await client.get(f"{settings.ORDER_SERVICE_URL}/order/seller/analytics", params=params, headers=extract_headers(request))
    return forward_response(res)


@router.get("/order/seller/orders")
async def get_seller_orders(request: Request):
    client = get_http_client()
    params = dict(request.query_params)
    res = await client.get(f"{settings.ORDER_SERVICE_URL}/order/seller/orders", params=params, headers=extract_headers(request))
    return forward_response(res)


@router.put("/order/seller/{order_id}/status")
async def update_seller_order_status(order_id: str, request: Request):
    data = await request.json()
    client = get_http_client()
    res = await client.put(f"{settings.ORDER_SERVICE_URL}/order/seller/{order_id}/status", json=data, headers=extract_headers(request))
    return forward_response(res)


@router.get("/order/admin/profits")
async def get_admin_profits(request: Request):
    client = get_http_client()
    res = await client.get(f"{settings.ORDER_SERVICE_URL}/order/admin/profits", headers=extract_headers(request))
    return forward_response(res)


@router.get("/order/admin/sellers-summary")
async def get_admin_sellers_summary(request: Request):
    client = get_http_client()
    res = await client.get(f"{settings.ORDER_SERVICE_URL}/order/admin/sellers-summary", headers=extract_headers(request))
    return forward_response(res)

