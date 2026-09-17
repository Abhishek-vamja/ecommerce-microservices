import httpx
from typing import Optional

_client: Optional[httpx.AsyncClient] = None

def get_http_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        limits = httpx.Limits(
            max_keepalive_connections=200,
            max_connections=1000,
            keepalive_expiry=60.0
        )
        timeout = httpx.Timeout(10.0, connect=2.0)
        _client = httpx.AsyncClient(limits=limits, timeout=timeout)
    return _client

async def init_http_client() -> httpx.AsyncClient:
    return get_http_client()

async def close_http_client():
    global _client
    if _client is not None and not _client.is_closed:
        await _client.aclose()
        _client = None
