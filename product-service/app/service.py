import os
from datetime import datetime
from typing import List, Optional

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.models.product import Product, Category, BannerPromotion
from app.schema.products import CreateProduct

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")
ALGORITHM = "HS256"

security = HTTPBearer()


def get_current_user(role: list = None):
    async def _get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
    ) -> dict:
        token = credentials.credentials

        try:
            payload = jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[ALGORITHM],
            )

            user_id = payload.get("user_id") or payload.get("sub")
            _role = payload.get("role")

            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token",
                )

            if role is not None and (_role is None or _role.lower() not in [r.lower() for r in role]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No access to use this endpoint",
                )

            return {
                "user_id": user_id,
                "role": _role,
            }

        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )


    return _get_current_user


def create_products(
    db: Session,
    current_user: dict,
    data: CreateProduct,
) -> Product:
    # Auto-calculate discount percentage if original_price is given
    disc_pct = data.discount_percentage
    if data.original_price and data.original_price > data.price and disc_pct == 0:
        disc_pct = int(round(((data.original_price - data.price) / data.original_price) * 100))

    product = Product(
        name=data.name,
        description=data.description,
        price=data.price,
        original_price=data.original_price,
        discount_percentage=disc_pct,
        rating=data.rating,
        rating_count=data.rating_count,
        stock=data.stock,
        image_url=data.image_url,
        category_id=data.category_id,
        brand=data.brand,
        is_deal=data.is_deal,
        deal_ends_at=data.deal_ends_at,
        is_active=data.is_active,
        created_by=current_user.get("user_id"),
    )

    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def deduct_product_stock(db: Session, items: List[dict]) -> bool:
    """Atomically deduct stock for multiple items."""
    for item in items:
        pid = item.get("product_id")
        qty = item.get("quantity", 1)
        product = db.query(Product).filter(Product.unique_id == pid).first()
        if not product or product.stock < qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for product {pid}"
            )
        product.stock -= qty
    db.commit()
    return True