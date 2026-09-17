from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class CreatePaymentOrderRequest(BaseModel):
    order_id: str
    amount: float
    currency: str = "INR"


class CreatePaymentOrderResponse(BaseModel):
    order_id: str
    razorpay_order_id: str
    amount: float
    currency: str
    key_id: str


class VerifyPaymentRequest(BaseModel):
    order_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentTransactionResponse(BaseModel):
    id: str
    order_id: str
    user_id: str
    amount: float
    currency: str
    gateway: str
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
