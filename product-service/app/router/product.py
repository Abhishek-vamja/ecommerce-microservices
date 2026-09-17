import traceback
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy import func, select, or_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.exception import error_response
from app.models.product import Product, Category, BannerPromotion
from app.schema.products import (
    CreateProduct,
    CategoryCreate,
    BannerCreate,
    DeductStockRequest,
)
from app.service import create_products, get_current_user, deduct_product_stock
from app.core.rate_limiter import rate_limit

router = APIRouter(tags=["Product Service API"])

ONLY_ADMIN = ["admin"]
ALL = ["admin", "enduser"]


@router.get("/product", dependencies=[Depends(rate_limit(max_requests=60, window_seconds=60, key_prefix="rl:prod_list"))])
@router.get("/product/", dependencies=[Depends(rate_limit(max_requests=60, window_seconds=60, key_prefix="rl:prod_list"))])
async def get_products(
    db: Session = Depends(get_db),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=12, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    category_id: Optional[str] = Query(default=None),
    brand: Optional[str] = Query(default=None),
    is_deal: Optional[bool] = Query(default=None),
    min_price: Optional[float] = Query(default=None),
    max_price: Optional[float] = Query(default=None),
    min_rating: Optional[float] = Query(default=None),
    seller_id: Optional[str] = Query(default=None),
    sort_by: Optional[str] = Query(default="newest"),  # newest, price_asc, price_desc, rating
):
    """
    Public Product Listing with pagination, search, category, brand, rating, and deal filters.
    """
    try:
        offset = (page - 1) * page_size
        query = select(Product).filter(Product.is_active == True)

        if seller_id:
            query = query.filter(Product.seller_id == seller_id)

        if search:
            search_filter = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Product.name.ilike(search_filter),
                    Product.description.ilike(search_filter),
                    Product.brand.ilike(search_filter),
                    Product.shop_name.ilike(search_filter),
                )
            )

        if category_id and category_id.lower() != "all":
            # Match by category_id or slug
            cat = db.query(Category).filter(or_(Category.id == category_id, Category.slug == category_id)).first()
            if cat:
                query = query.filter(or_(Product.category_id == cat.id, Product.category_id == cat.slug))
            else:
                query = query.filter(Product.category_id == category_id)

        if brand and brand.lower() != "all":
            query = query.filter(Product.brand.ilike(f"%{brand.strip()}%"))

        if is_deal is not None:
            query = query.filter(Product.is_deal == is_deal)

        if min_price is not None:
            query = query.filter(Product.price >= min_price)

        if max_price is not None:
            query = query.filter(Product.price <= max_price)

        if min_rating is not None:
            query = query.filter(Product.rating >= min_rating)

        # Sorting
        if sort_by == "price_asc":
            query = query.order_by(Product.price.asc())
        elif sort_by == "price_desc":
            query = query.order_by(Product.price.desc())
        elif sort_by == "rating":
            query = query.order_by(Product.rating.desc())
        else:
            query = query.order_by(Product.created_at.desc())

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = db.scalar(count_query) or 0

        # Paginate
        paginated_query = query.offset(offset).limit(page_size)
        products = db.scalars(paginated_query).all()

        return JSONResponse(
            status_code=200,
            content={
                "message": "Products fetched successfully",
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total": total,
                    "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
                },
                "data": [
                    {
                        "unique_id": str(product.unique_id),
                        "name": product.name,
                        "description": product.description,
                        "price": float(product.price) if product.price is not None else 0.0,
                        "original_price": float(product.original_price) if product.original_price is not None else None,
                        "discount_percentage": product.discount_percentage or 0,
                        "rating": float(product.rating) if product.rating is not None else 4.5,
                        "rating_count": product.rating_count or 0,
                        "stock": product.stock,
                        "image_url": product.image_url,
                        "category_id": product.category_id,
                        "brand": product.brand,
                        "seller_id": product.seller_id,
                        "shop_name": product.shop_name,
                        "is_deal": product.is_deal,
                        "deal_ends_at": product.deal_ends_at.isoformat() if product.deal_ends_at else None,
                    }
                    for product in products
                ],
            },
        )
    except Exception as e:
        traceback.print_exc()
        return error_response()


@router.get("/filter-meta")
@router.get("/product/filter-meta")
async def get_filter_meta(db: Session = Depends(get_db)):
    """
    Get dynamic filter metadata: available brands, price range min/max, categories.
    """
    try:
        # Get distinct brands
        brands_res = db.query(Product.brand).filter(Product.brand.isnot(None), Product.is_active == True).distinct().all()
        brands = sorted([b[0] for b in brands_res if b[0]])

        # Get min and max prices
        min_price = db.scalar(select(func.min(Product.price)).filter(Product.is_active == True)) or 0
        max_price = db.scalar(select(func.max(Product.price)).filter(Product.is_active == True)) or 100000

        # Get categories
        categories = db.query(Category).order_by(Category.display_order.asc()).all()

        return JSONResponse(
            status_code=200,
            content={
                "brands": brands,
                "price_range": {
                    "min": float(min_price),
                    "max": float(max_price),
                },
                "categories": [
                    {
                        "id": cat.id,
                        "name": cat.name,
                        "slug": cat.slug,
                        "icon_url": cat.icon_url,
                    }
                    for cat in categories
                ]
            }
        )
    except Exception as e:
        traceback.print_exc()
        return error_response()


@router.get("/product/{id}", dependencies=[Depends(rate_limit(max_requests=100, window_seconds=60, key_prefix="rl:prod_detail"))])
async def get_product_details(
    id: str,
    db: Session = Depends(get_db),
):
    """
    Public single product details.
    """
    try:
        product = db.query(Product).filter(Product.unique_id == id).first()
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        return JSONResponse(
            status_code=200,
            content={
                "unique_id": str(product.unique_id),
                "name": product.name,
                "description": product.description,
                "price": float(product.price) if product.price is not None else 0.0,
                "original_price": float(product.original_price) if product.original_price is not None else None,
                "discount_percentage": product.discount_percentage or 0,
                "rating": float(product.rating) if product.rating is not None else 4.5,
                "rating_count": product.rating_count or 0,
                "stock": product.stock,
                "image_url": product.image_url,
                "category_id": product.category_id,
                "brand": product.brand,
                "seller_id": product.seller_id,
                "shop_name": product.shop_name,
                "is_deal": product.is_deal,
                "deal_ends_at": product.deal_ends_at.isoformat() if product.deal_ends_at else None,
                "is_active": product.is_active,
                "created_by": str(product.created_by),
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        return error_response()


# =========================================================================
# SELLER MULTI-VENDOR PRODUCT MANAGEMENT ENDPOINTS
# =========================================================================

@router.post("/product/seller/add")
async def add_seller_product(
    data: CreateProduct,
    db: Session = Depends(get_db),
):
    """Seller adds a new product to their shop catalog."""
    try:
        from uuid import uuid4
        product_name = data.name or data.title or "Untitled Product"
        prod = Product(
            id=uuid4(),
            unique_id=f"prod_{uuid4().hex[:10]}",
            name=product_name,
            description=data.description or "",
            price=data.price,
            original_price=data.original_price or data.price,
            discount_percentage=data.discount_percentage or 0,
            rating=4.5,
            rating_count=0,
            stock=data.stock,
            image_url=data.image_url,
            category_id=data.category_id or "cat_groceries",
            brand=data.brand or "ShopMate",
            seller_id=data.seller_id,
            shop_name=data.shop_name or "Verified Seller",
            is_deal=data.is_deal or False,
            deal_ends_at=data.deal_ends_at,
            is_active=True,
            created_by=data.seller_id or "seller",
        )
        db.add(prod)
        db.commit()
        db.refresh(prod)
        return JSONResponse(
            status_code=201,
            content={
                "message": "Product added to shop successfully!",
                "unique_id": str(prod.unique_id),
                "name": prod.name,
                "stock": prod.stock,
                "price": float(prod.price),
                "shop_name": prod.shop_name,
            }
        )
    except Exception as e:
        traceback.print_exc()
        return error_response()


@router.get("/product/seller/my-products")
async def get_seller_my_products(
    seller_id: str = Query(...),
    db: Session = Depends(get_db),
):
    """Fetch all products belonging to a specific seller shop."""
    try:
        products = db.query(Product).filter(Product.seller_id == seller_id).order_by(Product.created_at.desc()).all()
        return JSONResponse(
            status_code=200,
            content=[
                {
                    "unique_id": str(p.unique_id),
                    "name": p.name,
                    "description": p.description,
                    "price": float(p.price),
                    "original_price": float(p.original_price) if p.original_price else None,
                    "discount_percentage": p.discount_percentage or 0,
                    "stock": p.stock,
                    "image_url": p.image_url,
                    "category_id": p.category_id,
                    "brand": p.brand,
                    "seller_id": p.seller_id,
                    "shop_name": p.shop_name,
                    "is_active": p.is_active,
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                }
                for p in products
            ]
        )
    except Exception as e:
        traceback.print_exc()
        return error_response()


@router.put("/product/seller/{product_id}")
async def update_seller_product(
    product_id: str,
    data: dict,
    db: Session = Depends(get_db),
):
    """Seller updates price, stock, or details of their product."""
    try:
        prod = db.query(Product).filter(Product.unique_id == product_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail="Product not found")

        if "name" in data: prod.name = data["name"]
        if "price" in data: prod.price = float(data["price"])
        if "original_price" in data: prod.original_price = float(data["original_price"]) if data["original_price"] else None
        if "stock" in data: prod.stock = int(data["stock"])
        if "image_url" in data: prod.image_url = data["image_url"]
        if "is_active" in data: prod.is_active = bool(data["is_active"])
        if "discount_percentage" in data: prod.discount_percentage = int(data["discount_percentage"])
        if "description" in data: prod.description = data["description"]

        db.commit()
        return JSONResponse(status_code=200, content={"message": "Product updated successfully", "unique_id": str(prod.unique_id)})
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        return error_response()


@router.delete("/product/seller/{product_id}")
async def delete_seller_product(
    product_id: str,
    db: Session = Depends(get_db),
):
    """Seller deletes or archives a product from catalog."""
    try:
        prod = db.query(Product).filter(Product.unique_id == product_id).first()
        if not prod:
            raise HTTPException(status_code=404, detail="Product not found")
        db.delete(prod)
        db.commit()
        return JSONResponse(status_code=200, content={"message": "Product deleted successfully"})
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        return error_response()



@router.post("/product", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60, key_prefix="rl:prod_create"))])
@router.post("/product/", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60, key_prefix="rl:prod_create"))])
async def create_product(
    data: CreateProduct,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user(ONLY_ADMIN)),
):
    """Admin product creation."""
    try:
        prod = create_products(db, current_user, data)
        return JSONResponse(
            status_code=201,
            content={
                "message": "Product created successfully",
                "product_id": str(prod.unique_id),
                "product_name": prod.name,
                "product_price": float(prod.price) if prod.price is not None else 0.0,
                "product_image_url": prod.image_url,
            },
        )
    except Exception as e:
        traceback.print_exc()
        return error_response()


@router.post("/product/deduct-stock")
async def deduct_stock(
    data: DeductStockRequest,
    db: Session = Depends(get_db),
):
    """Internal service endpoint to decrement product inventory upon order confirmation."""
    try:
        deduct_product_stock(db, data.items)
        return JSONResponse(status_code=200, content={"message": "Stock deducted successfully"})
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        return error_response()


@router.get("/categories")
async def list_categories(db: Session = Depends(get_db)):
    """Public Category Listing for sidebar and circular icon bar."""
    try:
        categories = db.query(Category).order_by(Category.display_order.asc()).all()
        return JSONResponse(
            status_code=200,
            content=[
                {
                    "id": cat.id,
                    "name": cat.name,
                    "slug": cat.slug,
                    "icon_url": cat.icon_url,
                    "parent_id": cat.parent_id,
                    "display_order": cat.display_order,
                }
                for cat in categories
            ]
        )
    except Exception as e:
        traceback.print_exc()
        return error_response()


@router.post("/categories")
async def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user(ONLY_ADMIN)),
):
    """Admin Category Creation."""
    try:
        cat = Category(
            name=data.name,
            slug=data.slug,
            icon_url=data.icon_url,
            parent_id=data.parent_id,
            display_order=data.display_order,
        )
        db.add(cat)
        db.commit()
        db.refresh(cat)
        return JSONResponse(status_code=201, content={"id": cat.id, "name": cat.name, "slug": cat.slug})
    except Exception as e:
        traceback.print_exc()
        return error_response()


@router.get("/promotions/banners")
async def list_banners(
    placement: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    """Public Banner & Promo Cards listing."""
    try:
        query = db.query(BannerPromotion).filter(BannerPromotion.is_active == True)
        if placement:
            query = query.filter(BannerPromotion.placement == placement)
        banners = query.order_by(BannerPromotion.display_order.asc()).all()

        return JSONResponse(
            status_code=200,
            content=[
                {
                    "id": ban.id,
                    "title": ban.title,
                    "subtitle": ban.subtitle,
                    "badge_text": ban.badge_text,
                    "image_url": ban.image_url,
                    "cta_link": ban.cta_link,
                    "placement": ban.placement,
                }
                for ban in banners
            ]
        )
    except Exception as e:
        traceback.print_exc()
        return error_response()


@router.post("/promotions/banners")
async def create_banner(
    data: BannerCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user(ONLY_ADMIN)),
):
    """Admin banner promotion creation."""
    try:
        ban = BannerPromotion(
            title=data.title,
            subtitle=data.subtitle,
            badge_text=data.badge_text,
            image_url=data.image_url,
            cta_link=data.cta_link,
            placement=data.placement,
            is_active=data.is_active,
            display_order=data.display_order,
        )
        db.add(ban)
        db.commit()
        db.refresh(ban)
        return JSONResponse(status_code=201, content={"id": ban.id, "title": ban.title})
    except Exception as e:
        traceback.print_exc()
        return error_response()

  