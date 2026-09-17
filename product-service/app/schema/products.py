from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class CreateProduct(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    discount_percentage: int = 0
    rating: float = 4.5
    rating_count: int = 0
    stock: int = 0
    image_url: Optional[str] = None
    category_id: Optional[str] = None
    brand: Optional[str] = None
    is_deal: bool = False
    deal_ends_at: Optional[datetime] = None
    is_active: bool = True
    seller_id: Optional[str] = None
    shop_name: Optional[str] = None
    created_by: Optional[str] = "seller"



class ProductResponse(BaseModel):
    unique_id: str
    name: str
    description: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    discount_percentage: int = 0
    rating: float = 4.5
    rating_count: int = 0
    stock: int
    image_url: Optional[str] = None
    category_id: Optional[str] = None
    brand: Optional[str] = None
    is_deal: bool = False
    deal_ends_at: Optional[datetime] = None
    is_active: bool
    seller_id: Optional[str] = None
    shop_name: Optional[str] = None

    class Config:
        from_attributes = True


class DeductStockRequest(BaseModel):
    items: List[dict]  # List of {"product_id": str, "quantity": int}


class CategoryCreate(BaseModel):
    name: str
    slug: str
    icon_url: Optional[str] = None
    parent_id: Optional[str] = None
    display_order: int = 0


class CategoryResponse(BaseModel):
    id: str
    name: str
    slug: str
    icon_url: Optional[str] = None
    parent_id: Optional[str] = None
    display_order: int

    class Config:
        from_attributes = True


class BannerCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    badge_text: Optional[str] = None
    image_url: str
    cta_link: Optional[str] = None
    placement: str = "hero_carousel"
    is_active: bool = True
    display_order: int = 0


class BannerResponse(BaseModel):
    id: str
    title: str
    subtitle: Optional[str] = None
    badge_text: Optional[str] = None
    image_url: str
    cta_link: Optional[str] = None
    placement: str
    is_active: bool
    display_order: int

    class Config:
        from_attributes = True

