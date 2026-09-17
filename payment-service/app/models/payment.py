import uuid
from datetime import datetime
from sqlalchemy import Column, String, Numeric, DateTime, Text, JSON
from app.database import Base


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(String(50), primary_key=True, default=lambda: f"pay_{uuid.uuid4().hex[:12]}")
    order_id = Column(String(50), nullable=False, index=True)
    user_id = Column(String(50), nullable=False, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), default="INR")
    gateway = Column(String(30), default="RAZORPAY")
    razorpay_order_id = Column(String(100), unique=True, index=True, nullable=False)
    razorpay_payment_id = Column(String(100), index=True, nullable=True)
    razorpay_signature = Column(String(255), nullable=True)
    status = Column(String(30), default="CREATED", index=True)  # CREATED, SUCCESS, FAILED, REFUNDED
    raw_response = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
