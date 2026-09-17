import os
import logging
import grpc
from typing import List, Dict, Any

from app.grpc_gen import product_pb2, product_pb2_grpc

logger = logging.getLogger(__name__)

GRPC_PRODUCT_HOST = os.getenv("GRPC_PRODUCT_HOST", "localhost:50051")
_channel = None
_stub = None

def get_product_stub() -> product_pb2_grpc.ProductGrpcServiceStub:
    global _channel, _stub
    if _channel is None or _stub is None:
        _channel = grpc.aio.insecure_channel(
            GRPC_PRODUCT_HOST,
            options=[
                ("grpc.max_receive_message_length", 16 * 1024 * 1024),
                ("grpc.max_send_message_length", 16 * 1024 * 1024),
            ]
        )
        _stub = product_pb2_grpc.ProductGrpcServiceStub(_channel)
    return _stub

async def deduct_stock_grpc(product_id: str, quantity: int) -> bool:
    """Invoke Product Service over gRPC HTTP/2 to atomically decrement product stock."""
    try:
        stub = get_product_stub()
        req = product_pb2.DeductStockGrpcRequest(product_id=product_id, quantity=quantity)
        resp = await stub.DeductStock(req, timeout=3.0)
        return resp.success
    except Exception as e:
        logger.warning(f"[gRPC Inter-service DeductStock Warning]: {e}")
        return False
