import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class Cart(Base):
    __tablename__ = "carts"

    id = Column(String(50), primary_key=True, default=lambda: f"cart_{uuid.uuid4().hex[:10]}")
    user_id = Column(String(50), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(String(50), primary_key=True, default=lambda: f"citem_{uuid.uuid4().hex[:10]}")
    cart_id = Column(String(50), ForeignKey("carts.id"), nullable=False, index=True)
    product_id = Column(String(50), nullable=False, index=True)
    product_name = Column(String(150), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    image_url = Column(String(500), nullable=True)
    seller_id = Column(String(50), nullable=True, index=True)
    shop_name = Column(String(150), nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    cart = relationship("Cart", back_populates="items")


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id = Column(String(50), primary_key=True, default=lambda: f"witem_{uuid.uuid4().hex[:10]}")
    user_id = Column(String(50), nullable=False, index=True)
    product_id = Column(String(50), nullable=False, index=True)
    product_name = Column(String(150), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    image_url = Column(String(500), nullable=True)
    seller_id = Column(String(50), nullable=True)
    shop_name = Column(String(150), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Order(Base):
    __tablename__ = "orders"

    id = Column(String(50), primary_key=True, default=lambda: f"ord_{uuid.uuid4().hex[:10]}")
    order_number = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(String(50), nullable=False, index=True)
    total_amount = Column(Numeric(10, 2), nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0.0)
    shipping_fee = Column(Numeric(10, 2), default=0.0)
    net_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(30), default="PENDING", index=True)  # PENDING, CONFIRMED, PROCESSING, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
    payment_method = Column(String(30), default="ONLINE")  # ONLINE, COD
    payment_status = Column(String(30), default="UNPAID")  # UNPAID, PAID, FAILED, REFUNDED
    shipping_address = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    tracking = relationship("OrderTracking", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String(50), primary_key=True, default=lambda: f"oitem_{uuid.uuid4().hex[:10]}")
    order_id = Column(String(50), ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(String(50), nullable=False)
    product_name = Column(String(150), nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    image_url = Column(String(500), nullable=True)
    seller_id = Column(String(50), nullable=True, index=True)
    shop_name = Column(String(150), nullable=True)
    commission_rate = Column(Numeric(5, 2), default=5.0)  # 5%
    platform_fee = Column(Numeric(10, 2), default=0.0)    # 5% of gross
    seller_payout = Column(Numeric(10, 2), default=0.0)   # 95% of gross

    order = relationship("Order", back_populates="items")


class OrderTracking(Base):
    __tablename__ = "order_tracking"

    id = Column(String(50), primary_key=True, default=lambda: f"track_{uuid.uuid4().hex[:10]}")
    order_id = Column(String(50), ForeignKey("orders.id"), nullable=False, index=True)
    status = Column(String(30), nullable=False)
    message = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="tracking")
