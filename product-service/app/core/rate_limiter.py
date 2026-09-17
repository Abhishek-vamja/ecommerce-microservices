import time
from typing import Callable
from fastapi import HTTPException, Request, status
from redis import Redis

redis_client = Redis(host="localhost", port=6379, db=0, decode_responses=True, protocol=2)



def rate_limit(max_requests: int, window_seconds: int, key_prefix: str = "rl:prod") -> Callable:
    """
    FastAPI dependency for sliding-window rate limiting per endpoint using Redis.
    """
    async def _rate_limiter(request: Request):
        try:
            client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown").split(",")[0].strip()
            path = request.url.path
            current_time = int(time.time())
            window_start = current_time - window_seconds
            redis_key = f"{key_prefix}:{path}:{client_ip}"

            pipe = redis_client.pipeline()
            pipe.zremrangebyscore(redis_key, 0, window_start)
            pipe.zcard(redis_key)
            pipe.zadd(redis_key, {str(current_time): current_time})
            pipe.expire(redis_key, window_seconds)
            results = pipe.execute()

            request_count = results[1]
            if request_count >= max_requests:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "message": f"Rate limit exceeded. Maximum {max_requests} requests per {window_seconds} seconds.",
                        "retry_after_seconds": window_seconds
                    }
                )
        except HTTPException:
            raise
        except Exception as e:
            print(f"[Rate Limiter Warning] Redis check failed: {e}")

    return _rate_limiter
