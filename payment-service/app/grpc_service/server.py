import asyncio
import logging
import grpc
from grpc.aio import server as aio_server

from app.grpc_gen import payment_pb2_grpc
from app.grpc_service.payment_servicer import PaymentGrpcService

logger = logging.getLogger(__name__)

_grpc_server = None

async def start_grpc_server(host: str = "0.0.0.0", port: int = 50054):
    global _grpc_server
    try:
        _grpc_server = aio_server()
        payment_pb2_grpc.add_PaymentGrpcServiceServicer_to_server(PaymentGrpcService(), _grpc_server)
        listen_addr = f"{host}:{port}"
        _grpc_server.add_insecure_port(listen_addr)
        await _grpc_server.start()
        logger.info(f"[gRPC Server] High-speed Payment gRPC Server running on {listen_addr}")
        print(f"\n>>> [gRPC SERVER] Payment gRPC Service listening on port {port} <<<\n")
    except Exception as e:
        logger.error(f"[gRPC Server] Startup failed: {e}", exc_info=True)
        print(f"\n[gRPC Server Error] Could not bind Payment gRPC port {port}: {e}\n")

async def stop_grpc_server():
    global _grpc_server
    if _grpc_server:
        logger.info("[gRPC Server] Gracefully stopping Payment gRPC Server...")
        await _grpc_server.stop(grace=3.0)
        logger.info("[gRPC Server] Stopped successfully.")
