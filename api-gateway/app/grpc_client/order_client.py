import os
import logging
from typing import Optional, Dict, Any, List
import grpc
from google.protobuf.json_format import MessageToDict

from app.grpc_gen import order_pb2, order_pb2_grpc

logger = logging.getLogger(__name__)

GRPC_ORDER_HOST = os.getenv("GRPC_ORDER_HOST", "localhost:50053")

_channel = None
_stub = None


def get_order_grpc_stub() -> order_pb2_grpc.OrderGrpcServiceStub:
    global _channel, _stub
    if _channel is None or _stub is None:
        _channel = grpc.aio.insecure_channel(
            GRPC_ORDER_HOST,
            options=[
                ("grpc.max_receive_message_length", 32 * 1024 * 1024),
                ("grpc.max_send_message_length", 32 * 1024 * 1024),
                ("grpc.keepalive_time_ms", 30000),
                ("grpc.keepalive_timeout_ms", 10000),
            ]
        )
        _stub = order_pb2_grpc.OrderGrpcServiceStub(_channel)
    return _stub


async def close_order_grpc_channel():
    global _channel, _stub
    if _channel:
        await _channel.close()
        _channel = None
        _stub = None


class OrderGrpcClient:

    @staticmethod
    async def get_cart(user_id: str) -> Dict[str, Any]:
        stub = get_order_grpc_stub()
        req = order_pb2.CartRequest(user_id=user_id)
        resp = await stub.GetCart(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def add_to_cart(user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        stub = get_order_grpc_stub()
        req = order_pb2.AddToCartRequest(
            user_id=user_id,
            product_id=payload.get("product_id", ""),
            product_name=payload.get("product_name", ""),
            unit_price=float(payload.get("unit_price", 0.0)),
            image_url=payload.get("image_url", ""),
            quantity=int(payload.get("quantity", 1)),
            seller_id=payload.get("seller_id", ""),
            shop_name=payload.get("shop_name", ""),
        )
        resp = await stub.AddToCart(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def update_cart_item(user_id: str, item_id: str, quantity: int) -> Dict[str, Any]:
        stub = get_order_grpc_stub()
        req = order_pb2.UpdateCartItemRequest(user_id=user_id, item_id=item_id, quantity=quantity)
        resp = await stub.UpdateCartItem(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def delete_cart_item(user_id: str, item_id: str) -> Dict[str, Any]:
        stub = get_order_grpc_stub()
        req = order_pb2.DeleteCartItemRequest(user_id=user_id, item_id=item_id)
        resp = await stub.DeleteCartItem(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def clear_cart(user_id: str) -> Dict[str, Any]:
        stub = get_order_grpc_stub()
        req = order_pb2.CartRequest(user_id=user_id)
        resp = await stub.ClearCart(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def get_wishlist(user_id: str) -> List[Dict[str, Any]]:
        stub = get_order_grpc_stub()
        req = order_pb2.WishlistRequest(user_id=user_id)
        resp = await stub.GetWishlist(req, timeout=4.0)
        data = MessageToDict(resp, preserving_proto_field_name=True)
        return data.get("items", [])

    @staticmethod
    async def toggle_wishlist(user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        stub = get_order_grpc_stub()
        req = order_pb2.ToggleWishlistRequest(
            user_id=user_id,
            product_id=payload.get("product_id", ""),
            product_name=payload.get("product_name", ""),
            unit_price=float(payload.get("unit_price", 0.0)),
            image_url=payload.get("image_url", ""),
        )
        resp = await stub.ToggleWishlist(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def move_wishlist_to_cart(user_id: str, product_id: str) -> Dict[str, Any]:
        stub = get_order_grpc_stub()
        req = order_pb2.MoveWishlistRequest(user_id=user_id, product_id=product_id)
        resp = await stub.MoveWishlistToCart(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def checkout_order(user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        stub = get_order_grpc_stub()
        req = order_pb2.CheckoutGrpcRequest(
            user_id=user_id,
            shipping_address=payload.get("shipping_address", ""),
            payment_method=payload.get("payment_method", "ONLINE"),
            coupon_code=payload.get("coupon_code", ""),
        )
        resp = await stub.CheckoutOrder(req, timeout=5.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def get_my_orders(user_id: str) -> List[Dict[str, Any]]:
        stub = get_order_grpc_stub()
        req = order_pb2.MyOrdersRequest(user_id=user_id)
        resp = await stub.GetMyOrders(req, timeout=4.0)
        data = MessageToDict(resp, preserving_proto_field_name=True)
        return data.get("orders", [])

    @staticmethod
    async def get_order_by_id(user_id: str, order_id: str) -> Optional[Dict[str, Any]]:
        stub = get_order_grpc_stub()
        req = order_pb2.OrderDetailRequest(user_id=user_id, order_id=order_id)
        resp = await stub.GetOrderById(req, timeout=4.0)
        if not resp.exists:
            return None
        data = MessageToDict(resp, preserving_proto_field_name=True)
        return data.get("order")

    @staticmethod
    async def get_order_tracking(order_id: str) -> Optional[Dict[str, Any]]:
        stub = get_order_grpc_stub()
        req = order_pb2.OrderTrackingRequest(order_id=order_id)
        resp = await stub.GetOrderTracking(req, timeout=4.0)
        if not resp.exists:
            return None
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def get_seller_analytics(seller_id: str) -> Dict[str, Any]:
        stub = get_order_grpc_stub()
        req = order_pb2.SellerAnalyticsRequest(seller_id=seller_id)
        resp = await stub.GetSellerAnalytics(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def get_seller_orders(seller_id: str) -> List[Dict[str, Any]]:
        stub = get_order_grpc_stub()
        req = order_pb2.SellerOrdersRequest(seller_id=seller_id)
        resp = await stub.GetSellerOrders(req, timeout=4.0)
        data = MessageToDict(resp, preserving_proto_field_name=True)
        return data.get("orders", [])

    @staticmethod
    async def update_seller_order_status(order_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        stub = get_order_grpc_stub()
        req = order_pb2.UpdateOrderStatusRequest(
            order_id=order_id,
            status=payload.get("status", "PROCESSING"),
            message=payload.get("message", ""),
        )
        resp = await stub.UpdateSellerOrderStatus(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def get_admin_profits() -> Dict[str, Any]:
        stub = get_order_grpc_stub()
        req = order_pb2.EmptyOrderRequest()
        resp = await stub.GetAdminProfits(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def get_admin_sellers_summary() -> List[Dict[str, Any]]:
        stub = get_order_grpc_stub()
        req = order_pb2.EmptyOrderRequest()
        resp = await stub.GetAdminSellersSummary(req, timeout=4.0)
        data = MessageToDict(resp, preserving_proto_field_name=True)
        return data.get("sellers", [])
