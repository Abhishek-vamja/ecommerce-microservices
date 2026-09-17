from fastapi import Request
from fastapi.routing import APIRouter

from app.config import settings
from app.core.response_helper import forward_response
from app.core.http_client import get_http_client
from app.core.cache import gateway_cache

router = APIRouter(tags=["Product API Gateway"])


def extract_headers(request: Request) -> dict:
    headers = {}
    if auth := request.headers.get("authorization"):
        headers["Authorization"] = auth
    if xff := request.headers.get("x-forwarded-for"):
        headers["X-Forwarded-For"] = xff
    elif request.client:
        headers["X-Forwarded-For"] = request.client.host
    return headers


@router.get("/product")
@router.get("/product/")
async def get_products(request: Request):
    cache_key = f"products:{str(request.query_params)}"
    if cached := gateway_cache.get(cache_key):
        return cached

    client = get_http_client()
    response = await client.get(
        f"{settings.PRODUCT_SERVICE_URL}/product/",
        params=request.query_params,
        headers=extract_headers(request),
    )
    return forward_response(response, cache_key=cache_key, cache_ttl=20)


@router.get("/filter-meta")
@router.get("/product/filter-meta")
async def get_filter_meta(request: Request):
    cache_key = "filter_meta"
    if cached := gateway_cache.get(cache_key):
        return cached

    client = get_http_client()
    response = await client.get(
        f"{settings.PRODUCT_SERVICE_URL}/filter-meta",
        headers=extract_headers(request),
    )
    return forward_response(response, cache_key=cache_key, cache_ttl=60)


@router.get("/product/{id}")
async def get_product_details(id: str, request: Request):
    cache_key = f"product:{id}"
    if cached := gateway_cache.get(cache_key):
        return cached

    client = get_http_client()
    response = await client.get(
        f"{settings.PRODUCT_SERVICE_URL}/product/{id}",
        headers=extract_headers(request),
    )
    return forward_response(response, cache_key=cache_key, cache_ttl=30)


@router.post("/product")
@router.post("/product/")
async def create_product(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}

    client = get_http_client()
    response = await client.post(
        f"{settings.PRODUCT_SERVICE_URL}/product/",
        json=data,
        headers=extract_headers(request),
    )
    # Invalidate products cache on mutations
    gateway_cache.invalidate("products:")
    gateway_cache.invalidate("filter_meta")
    return forward_response(response)


@router.get("/categories")
async def get_categories(request: Request):
    cache_key = "categories"
    if cached := gateway_cache.get(cache_key):
        return cached

    client = get_http_client()
    response = await client.get(
        f"{settings.PRODUCT_SERVICE_URL}/categories",
        headers=extract_headers(request),
    )
    return forward_response(response, cache_key=cache_key, cache_ttl=60)


@router.post("/categories")
async def create_category(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}

    client = get_http_client()
    response = await client.post(
        f"{settings.PRODUCT_SERVICE_URL}/categories",
        json=data,
        headers=extract_headers(request),
    )
    gateway_cache.invalidate("categories")
    return forward_response(response)


@router.get("/promotions/banners")
async def get_banners(request: Request):
    cache_key = f"banners:{str(request.query_params)}"
    if cached := gateway_cache.get(cache_key):
        return cached

    client = get_http_client()
    response = await client.get(
        f"{settings.PRODUCT_SERVICE_URL}/promotions/banners",
        params=request.query_params,
        headers=extract_headers(request),
    )
    return forward_response(response, cache_key=cache_key, cache_ttl=60)


# --- SELLER MULTI-VENDOR PRODUCT ROUTES ---

@router.post("/product/seller/add")
async def proxy_seller_add_product(request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}
    client = get_http_client()
    response = await client.post(
        f"{settings.PRODUCT_SERVICE_URL}/product/seller/add",
        json=data,
        headers=extract_headers(request),
    )
    gateway_cache.invalidate("products:")
    gateway_cache.invalidate("filter_meta")
    return forward_response(response)


@router.get("/product/seller/my-products")
async def proxy_seller_my_products(request: Request):
    client = get_http_client()
    response = await client.get(
        f"{settings.PRODUCT_SERVICE_URL}/product/seller/my-products",
        params=request.query_params,
        headers=extract_headers(request),
    )
    return forward_response(response)


@router.put("/product/seller/{product_id}")
async def proxy_seller_update_product(product_id: str, request: Request):
    try:
        data = await request.json()
    except Exception:
        data = {}
    client = get_http_client()
    response = await client.put(
        f"{settings.PRODUCT_SERVICE_URL}/product/seller/{product_id}",
        json=data,
        headers=extract_headers(request),
    )
    gateway_cache.invalidate("products:")
    gateway_cache.invalidate("filter_meta")
    gateway_cache.invalidate(f"product:{product_id}")
    return forward_response(response)


@router.delete("/product/seller/{product_id}")
async def proxy_seller_delete_product(product_id: str, request: Request):
    client = get_http_client()
    response = await client.delete(
        f"{settings.PRODUCT_SERVICE_URL}/product/seller/{product_id}",
        headers=extract_headers(request),
    )
    gateway_cache.invalidate("products:")
    gateway_cache.invalidate("filter_meta")
    gateway_cache.invalidate(f"product:{product_id}")
    return forward_response(response)