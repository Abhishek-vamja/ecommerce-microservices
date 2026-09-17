import os
import logging
from typing import Optional, Dict, Any
import grpc
from google.protobuf.json_format import MessageToDict

from app.grpc_gen import payment_pb2, payment_pb2_grpc

logger = logging.getLogger(__name__)

GRPC_PAYMENT_HOST = os.getenv("GRPC_PAYMENT_HOST", "localhost:50054")

_channel = None
_stub = None


def get_payment_grpc_stub() -> payment_pb2_grpc.PaymentGrpcServiceStub:
    global _channel, _stub
    if _channel is None or _stub is None:
        _channel = grpc.aio.insecure_channel(
            GRPC_PAYMENT_HOST,
            options=[
                ("grpc.max_receive_message_length", 16 * 1024 * 1024),
                ("grpc.max_send_message_length", 16 * 1024 * 1024),
                ("grpc.keepalive_time_ms", 30000),
                ("grpc.keepalive_timeout_ms", 10000),
            ]
        )
        _stub = payment_pb2_grpc.PaymentGrpcServiceStub(_channel)
    return _stub


async def close_payment_grpc_channel():
    global _channel, _stub
    if _channel:
        await _channel.close()
        _channel = None
        _stub = None


class PaymentGrpcClient:

    @staticmethod
    async def create_payment_order(user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        stub = get_payment_grpc_stub()
        req = payment_pb2.CreatePaymentOrderGrpcRequest(
            user_id=user_id,
            order_id=payload.get("order_id", ""),
            amount=float(payload.get("amount", 0.0)),
            currency=payload.get("currency", "INR"),
        )
        resp = await stub.CreatePaymentOrder(req, timeout=5.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def verify_payment(payload: Dict[str, Any]) -> Dict[str, Any]:
        stub = get_payment_grpc_stub()
        req = payment_pb2.VerifyPaymentGrpcRequest(
            razorpay_order_id=payload.get("razorpay_order_id", ""),
            razorpay_payment_id=payload.get("razorpay_payment_id", ""),
            razorpay_signature=payload.get("razorpay_signature", ""),
        )
        resp = await stub.VerifyPayment(req, timeout=5.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def handle_webhook(payload_json: str, signature: str = "") -> Dict[str, Any]:
        stub = get_payment_grpc_stub()
        req = payment_pb2.HandleWebhookGrpcRequest(
            payload_json=payload_json,
            signature=signature,
        )
        resp = await stub.HandleWebhook(req, timeout=5.0)
        return MessageToDict(resp, preserving_proto_field_name=True)
