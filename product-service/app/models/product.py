from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        default=lambda: f"cat_{uuid4().hex[:8]}",
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    icon_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    parent_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class BannerPromotion(Base):
    __tablename__ = "banner_promotions"

    id: Mapped[str] = mapped_column(
        String(50),
        primary_key=True,
        default=lambda: f"ban_{uuid4().hex[:8]}",
        index=True,
    )
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    subtitle: Mapped[str | None] = mapped_column(String(255), nullable=True)
    badge_text: Mapped[str | None] = mapped_column(String(100), nullable=True)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    cta_link: Mapped[str | None] = mapped_column(String(255), nullable=True)
    placement: Mapped[str] = mapped_column(String(50), default="hero_carousel")  # hero_carousel, side_card, bottom_banner
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True,
    )
    
    unique_id: Mapped[str] = mapped_column(
        String(45),
        primary_key=True,
        default=lambda: f"prod_{uuid4()}",
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    price: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    original_price: Mapped[float | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )

    discount_percentage: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    rating: Mapped[float] = mapped_column(
        Numeric(3, 1),
        default=4.5,
        nullable=False,
    )

    rating_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    stock: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    category_id: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )

    brand: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        index=True,
    )

    is_deal: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )

    deal_ends_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    seller_id: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )

    shop_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    created_by: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )