from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel


class CartItemAdd(BaseModel):
    product_id: str
    product_name: str
    unit_price: float
    image_url: Optional[str] = None
    seller_id: Optional[str] = None
    shop_name: Optional[str] = None
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    unit_price: float
    image_url: Optional[str] = None
    seller_id: Optional[str] = None
    shop_name: Optional[str] = None
    quantity: int
    item_total: float

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    id: str
    user_id: str
    items: List[CartItemResponse]
    subtotal: float
    item_count: int


class WishlistItemAdd(BaseModel):
    product_id: str
    product_name: str
    unit_price: float
    image_url: Optional[str] = None


class WishlistItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    unit_price: float
    image_url: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CheckoutRequest(BaseModel):
    shipping_address: dict
    payment_method: str = "ONLINE"  # ONLINE or COD
    coupon_code: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: str
    product_id: str
    product_name: str
    unit_price: float
    quantity: int
    total_price: float
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


class OrderTrackingResponse(BaseModel):
    status: str
    message: str
    timestamp: datetime

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: str
    order_number: str
    total_amount: float
    discount_amount: float
    shipping_fee: float
    net_amount: float
    status: str
    payment_method: str
    payment_status: str
    shipping_address: Optional[dict] = None
    created_at: datetime
    items: List[OrderItemResponse] = []
    tracking: List[OrderTrackingResponse] = []
    payment_order_id: Optional[str] = None

    class Config:
        from_attributes = True


class OrderConfirmInternalRequest(BaseModel):
    order_id: str
    razorpay_payment_id: str
    payment_status: str = "PAID"
