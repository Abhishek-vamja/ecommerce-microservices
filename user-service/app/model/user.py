import uuid
from enum import Enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class UserRole(str, Enum):
    ADMIN = "admin"
    ENDUSER = "enduser"
    SELLER = "seller"

class User(Base):
    """User account entity model."""
    __tablename__ = "users"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    unique_id = Column(
        String(40),
        unique=True,
        index=True,
        nullable=False,
        default=lambda: f"usr_{uuid.uuid4()}",
    )

    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(
        SQLEnum(UserRole),
        nullable=False,
        default=UserRole.ENDUSER,
    )
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")


class Address(Base):
    """User delivery address model."""
    __tablename__ = "addresses"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id = Column(String(40), ForeignKey("users.unique_id"), nullable=False, index=True)
    recipient_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    address_line1 = Column(String(255), nullable=False)
    address_line2 = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(20), nullable=False, index=True)
    is_default = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="addresses")


class SellerShop(Base):
    """Seller Shop Profile entity."""
    __tablename__ = "seller_shops"

    id = Column(
        String(50),
        primary_key=True,
        default=lambda: f"seller_{uuid.uuid4().hex[:10]}",
    )
    user_id = Column(String(40), ForeignKey("users.unique_id"), unique=True, nullable=False, index=True)
    shop_name = Column(String(150), nullable=False)
    shop_slug = Column(String(150), unique=True, index=True, nullable=False)
    owner_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    category = Column(String(100), nullable=True)
    description = Column(String(500), nullable=True)
    logo_url = Column(String(500), nullable=True)
    banner_url = Column(String(500), nullable=True)
    address_line = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    pincode = Column(String(20), nullable=True)
    gst_number = Column(String(50), nullable=True)
    pan_number = Column(String(50), nullable=True)
    bank_account_number = Column(String(50), nullable=True)
    ifsc_code = Column(String(20), nullable=True)
    commission_percentage = Column(String(10), default="5.0")
    is_verified = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="seller_shop")

