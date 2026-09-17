import logging
from typing import Optional
from fastapi import Request, Query
from fastapi.responses import JSONResponse
from fastapi.routing import APIRouter

from app.config import settings
from app.core.response_helper import forward_response
from app.core.http_client import get_http_client
from app.core.cache import gateway_cache
from app.grpc_client.client import ProductGrpcClient

logger = logging.getLogger(__name__)

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
async def get_products(
    request: Request,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    category_id: Optional[str] = Query(default=None),
    brand: Optional[str] = Query(default=None),
    is_deal: Optional[bool] = Query(default=None),
    min_price: Optional[float] = Query(default=None),
    max_price: Optional[float] = Query(default=None),
    min_rating: Optional[float] = Query(default=None),
    seller_id: Optional[str] = Query(default=None),
    sort_by: Optional[str] = Query(default="newest"),
):
    cache_key = f"products:{str(request.query_params)}"
    if cached := gateway_cache.get(cache_key):
        return cached

    # 1. Try High-Speed Binary gRPC First
    try:
        data = await ProductGrpcClient.get_products(
            page=page,
            page_size=page_size,
            search=search,
            category_id=category_id,
            brand=brand,
            is_deal=is_deal,
            min_price=min_price,
            max_price=max_price,
            min_rating=min_rating,
            seller_id=seller_id,
            sort_by=sort_by,
        )
        gateway_cache.set(cache_key, data, ttl=20)
        return JSONResponse(status_code=200, content=data)
    except Exception as grpc_err:
        logger.warning(f"[gRPC Failover] ProductGrpcClient failed, falling back to HTTP: {grpc_err}")

    # 2. Seamless HTTP Fallback
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

    # 1. Try gRPC
    try:
        data = await ProductGrpcClient.get_filter_meta()
        gateway_cache.set(cache_key, data, ttl=60)
        return JSONResponse(status_code=200, content=data)
    except Exception as grpc_err:
        logger.warning(f"[gRPC Failover] FilterMeta gRPC failed, fallback to HTTP: {grpc_err}")

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

    # 1. Try gRPC
    try:
        product_data = await ProductGrpcClient.get_product_by_id(id)
        if product_data:
            gateway_cache.set(cache_key, product_data, ttl=30)
            return JSONResponse(status_code=200, content=product_data)
    except Exception as grpc_err:
        logger.warning(f"[gRPC Failover] GetProductById gRPC failed: {grpc_err}")

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

    # Try gRPC
    try:
        created = await ProductGrpcClient.create_product(data)
        gateway_cache.invalidate("products:")
        gateway_cache.invalidate("filter_meta")
        return JSONResponse(status_code=201, content=created)
    except Exception as grpc_err:
        logger.warning(f"[gRPC Failover] CreateProduct gRPC failed: {grpc_err}")

    client = get_http_client()
    response = await client.post(
        f"{settings.PRODUCT_SERVICE_URL}/product/",
        json=data,
        headers=extract_headers(request),
    )
    gateway_cache.invalidate("products:")
    gateway_cache.invalidate("filter_meta")
    return forward_response(response)


@router.get("/categories")
async def get_categories(request: Request):
    cache_key = "categories"
    if cached := gateway_cache.get(cache_key):
        return cached

    # 1. Try gRPC
    try:
        cats = await ProductGrpcClient.get_categories()
        gateway_cache.set(cache_key, cats, ttl=60)
        return JSONResponse(status_code=200, content=cats)
    except Exception as grpc_err:
        logger.warning(f"[gRPC Failover] GetCategories gRPC failed: {grpc_err}")

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

    # Try gRPC
    try:
        created = await ProductGrpcClient.create_product(data)
        gateway_cache.invalidate("products:")
        gateway_cache.invalidate("filter_meta")
        return JSONResponse(status_code=201, content={"message": "Product created successfully", "product": created})
    except Exception as grpc_err:
        logger.warning(f"[gRPC Failover] Seller Add Product gRPC failed: {grpc_err}")

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
async def proxy_seller_my_products(
    request: Request,
    seller_id: str = Query(...),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
):
    # Try gRPC
    try:
        data = await ProductGrpcClient.get_seller_products(seller_id, page, page_size)
        return JSONResponse(status_code=200, content=data)
    except Exception as grpc_err:
        logger.warning(f"[gRPC Failover] Seller My-Products gRPC failed: {grpc_err}")

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