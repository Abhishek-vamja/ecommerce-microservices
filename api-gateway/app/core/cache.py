import time
from typing import Optional, Tuple, Any
from fastapi.responses import Response

class MemoryCache:
    def __init__(self, default_ttl: int = 30):
        self._cache: dict[str, Tuple[float, bytes, int, str]] = {}
        self._default_ttl = default_ttl

    def get(self, key: str) -> Optional[Response]:
        item = self._cache.get(key)
        if not item:
            return None
        expires_at, content, status_code, media_type = item
        if time.time() > expires_at:
            self._cache.pop(key, None)
            return None
        return Response(
            content=content,
            status_code=status_code,
            media_type=media_type,
            headers={'X-Cache-Lookup': 'HIT', 'Cache-Control': 'public, max-age=30'}
        )

    def set(self, key: str, content: bytes, status_code: int = 200, media_type: str = 'application/json', ttl: Optional[int] = None):
        ttl = ttl or self._default_ttl
        self._cache[key] = (time.time() + ttl, content, status_code, media_type)

    def invalidate(self, prefix: str = ''):
        if not prefix:
            self._cache.clear()
            return
        keys_to_del = [k for k in self._cache if k.startswith(prefix)]
        for k in keys_to_del:
            self._cache.pop(k, None)

gateway_cache = MemoryCache(default_ttl=30)
