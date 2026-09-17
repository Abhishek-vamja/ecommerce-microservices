from fastapi.responses import Response as FastResponse, JSONResponse
from httpx import Response


def forward_response(response: Response, cache_key: str = None, cache_ttl: int = None) -> FastResponse:
    """
    Direct zero-copy forward of downstream response to eliminate JSON decode/re-encode latency.
    """
    media_type = response.headers.get("content-type", "application/json")
    content_bytes = response.content

    if cache_key and response.status_code == 200:
        from app.core.cache import gateway_cache
        gateway_cache.set(cache_key, content_bytes, status_code=200, media_type=media_type, ttl=cache_ttl)

    return FastResponse(
        content=content_bytes,
        status_code=response.status_code,
        media_type=media_type,
        headers={"X-Cache-Lookup": "MISS"}
    )