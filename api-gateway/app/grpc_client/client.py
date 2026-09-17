import os
import logging
from typing import Optional, Dict, Any, List
import grpc
from google.protobuf.json_format import MessageToDict

from app.grpc_gen import product_pb2, product_pb2_grpc

logger = logging.getLogger(__name__)

GRPC_PRODUCT_HOST = os.getenv("GRPC_PRODUCT_HOST", "localhost:50051")

_channel = None
_stub = None


def get_grpc_stub() -> product_pb2_grpc.ProductGrpcServiceStub:
    global _channel, _stub
    if _channel is None or _stub is None:
        _channel = grpc.aio.insecure_channel(
            GRPC_PRODUCT_HOST,
            options=[
                ("grpc.max_receive_message_length", 32 * 1024 * 1024),
                ("grpc.max_send_message_length", 32 * 1024 * 1024),
                ("grpc.keepalive_time_ms", 30000),
                ("grpc.keepalive_timeout_ms", 10000),
            ]
        )
        _stub = product_pb2_grpc.ProductGrpcServiceStub(_channel)
    return _stub


async def close_grpc_channel():
    global _channel, _stub
    if _channel:
        await _channel.close()
        _channel = None
        _stub = None


class ProductGrpcClient:

    @staticmethod
    async def get_products(
        page: int = 1,
        page_size: int = 12,
        search: Optional[str] = None,
        category_id: Optional[str] = None,
        brand: Optional[str] = None,
        is_deal: Optional[bool] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        min_rating: Optional[float] = None,
        seller_id: Optional[str] = None,
        sort_by: Optional[str] = None,
    ) -> Dict[str, Any]:
        stub = get_grpc_stub()
        req = product_pb2.ProductListRequest(
            page=page,
            page_size=page_size,
            search=search or "",
            category_id=category_id or "",
            brand=brand or "",
            has_is_deal=is_deal is not None,
            is_deal=bool(is_deal) if is_deal is not None else False,
            has_min_price=min_price is not None,
            min_price=float(min_price) if min_price is not None else 0.0,
            has_max_price=max_price is not None,
            max_price=float(max_price) if max_price is not None else 0.0,
            has_min_rating=min_rating is not None,
            min_rating=float(min_rating) if min_rating is not None else 0.0,
            seller_id=seller_id or "",
            sort_by=sort_by or "newest",
        )
        resp = await stub.GetProducts(req, timeout=3.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def get_product_by_id(product_id: str) -> Optional[Dict[str, Any]]:
        stub = get_grpc_stub()
        req = product_pb2.ProductDetailRequest(id=product_id)
        resp = await stub.GetProductById(req, timeout=3.0)
        if not resp.exists:
            return None
        data = MessageToDict(resp, preserving_proto_field_name=True)
        return data.get("product")

    @staticmethod
    async def get_seller_products(seller_id: str, page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        stub = get_grpc_stub()
        req = product_pb2.SellerProductsRequest(
            seller_id=seller_id,
            page=page,
            page_size=page_size
        )
        resp = await stub.GetSellerProducts(req, timeout=3.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def get_categories() -> List[Dict[str, Any]]:
        stub = get_grpc_stub()
        req = product_pb2.CategoriesRequest()
        resp = await stub.GetCategories(req, timeout=3.0)
        data = MessageToDict(resp, preserving_proto_field_name=True)
        return data.get("categories", [])

    @staticmethod
    async def get_filter_meta() -> Dict[str, Any]:
        stub = get_grpc_stub()
        req = product_pb2.FilterMetaRequest()
        resp = await stub.GetFilterMeta(req, timeout=3.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def create_product(payload: Dict[str, Any]) -> Dict[str, Any]:
        stub = get_grpc_stub()
        req = product_pb2.CreateProductGrpcRequest(
            name=payload.get("name") or payload.get("title") or "",
            description=payload.get("description", ""),
            price=float(payload.get("price", 0.0)),
            stock=int(payload.get("stock", 0)),
            category_id=payload.get("category_id", "cat_electronics"),
            brand=payload.get("brand", "Generic"),
            image_url=payload.get("image_url", ""),
            seller_id=payload.get("seller_id", ""),
            shop_name=payload.get("shop_name", "Official Store"),
            discount_percentage=float(payload.get("discount_percentage", 0)),
        )
        resp = await stub.CreateProduct(req, timeout=5.0)
        data = MessageToDict(resp, preserving_proto_field_name=True)
        if not data.get("exists", True) and data.get("error_message"):
            raise ValueError(data.get("error_message"))
        return data.get("product", {})

    @staticmethod
    async def deduct_stock(product_id: str, quantity: int) -> Dict[str, Any]:
        stub = get_grpc_stub()
        req = product_pb2.DeductStockGrpcRequest(
            product_id=product_id,
            quantity=quantity
        )
        resp = await stub.DeductStock(req, timeout=3.0)
        return MessageToDict(resp, preserving_proto_field_name=True)
