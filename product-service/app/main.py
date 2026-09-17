
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from fastapi import FastAPI

from app.database import engine, Base, SessionLocal
from app.models.product import Product, Category, BannerPromotion
from app.router import product


def seed_initial_catalog():
    """Seed initial catalog, categories, and banners to match UI."""
    db = SessionLocal()
    try:
        # Seed Categories if empty
        if db.query(Category).count() == 0:
            categories_data = [
                {"name": "Electronics", "slug": "electronics", "icon_url": "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=100", "display_order": 1},
                {"name": "Fashion", "slug": "fashion", "icon_url": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=100", "display_order": 2},
                {"name": "Home & Living", "slug": "home-living", "icon_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=100", "display_order": 3},
                {"name": "Beauty & Personal Care", "slug": "beauty", "icon_url": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=100", "display_order": 4},
                {"name": "Sports & Fitness", "slug": "sports", "icon_url": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=100", "display_order": 5},
                {"name": "Toys & Games", "slug": "toys-games", "icon_url": "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=100", "display_order": 6},
                {"name": "Books & Stationery", "slug": "books", "icon_url": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=100", "display_order": 7},
                {"name": "Health & Wellness", "slug": "health", "icon_url": "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=100", "display_order": 8},
                {"name": "Automotive", "slug": "automotive", "icon_url": "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=100", "display_order": 9},
                {"name": "Grocery & Essentials", "slug": "grocery", "icon_url": "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100", "display_order": 10},
            ]
            for cat_data in categories_data:
                db.add(Category(**cat_data))
            db.commit()

        # Seed Banner Promotions if empty
        if db.query(BannerPromotion).count() == 0:
            banners_data = [
                {
                    "title": "MacBook Pro",
                    "subtitle": "Supercharged for pros. M3 chip | Liquid Retina XDR | Up to 22-hour battery",
                    "badge_text": "THE NEXT GENERATION",
                    "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200",
                    "cta_link": "/product/prod_macbook_pro",
                    "placement": "hero_carousel",
                    "display_order": 1,
                },
                {
                    "title": "Feel Every Detail",
                    "subtitle": "Premium Sound for a Better You",
                    "badge_text": "BOSE",
                    "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
                    "cta_link": "/product/prod_bose_headphones",
                    "placement": "side_card",
                    "display_order": 1,
                },
                {
                    "title": "Skincare That Cares",
                    "subtitle": "Beauty for every you",
                    "badge_text": "PREMIUM CARE",
                    "image_url": "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600",
                    "cta_link": "/category/beauty",
                    "placement": "side_card",
                    "display_order": 2,
                },
            ]
            for ban_data in banners_data:
                db.add(BannerPromotion(**ban_data))
            db.commit()

        # Seed Featured Deals of the Day if missing
        products_data = [
            {
                "unique_id": "prod_iphone_15",
                "name": "iPhone 15 (128GB)",
                "description": "Dynamic Island, 48MP Main camera, and USB-C in an all-new durable design.",
                "price": 69999.00,
                "original_price": 79999.00,
                "discount_percentage": 13,
                "rating": 4.7,
                "rating_count": 12400,
                "stock": 50,
                "image_url": "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500",
                "category_id": "electronics",
                "brand": "Apple",
                "is_deal": True,
                "deal_ends_at": datetime.utcnow() + timedelta(hours=12, minutes=34, seconds=56),
                "created_by": "system_seed",
            },
            {
                "unique_id": "prod_nike_air_max_270",
                "name": "Nike Air Max 270",
                "description": "Nike's first lifestyle Air unit delivers energy with every step and maximum comfort.",
                "price": 7499.00,
                "original_price": 11999.00,
                "discount_percentage": 38,
                "rating": 4.5,
                "rating_count": 8100,
                "stock": 35,
                "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
                "category_id": "fashion",
                "brand": "Nike",
                "is_deal": True,
                "deal_ends_at": datetime.utcnow() + timedelta(hours=12, minutes=34, seconds=56),
                "created_by": "system_seed",
            },
            {
                "unique_id": "prod_fossil_mens_watch",
                "name": "Fossil Men's Watch",
                "description": "Classic stainless steel chronograph with rich leather strap.",
                "price": 5999.00,
                "original_price": 9995.00,
                "discount_percentage": 40,
                "rating": 4.3,
                "rating_count": 4100,
                "stock": 40,
                "image_url": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=500",
                "category_id": "fashion",
                "brand": "Fossil",
                "is_deal": True,
                "deal_ends_at": datetime.utcnow() + timedelta(hours=12, minutes=34, seconds=56),
                "created_by": "system_seed",
            },
            {
                "unique_id": "prod_boat_airdopes_161",
                "name": "boAt Airdopes 161",
                "description": "Truly wireless earbuds with ASAP Charge, up to 17 hours total playback.",
                "price": 1299.00,
                "original_price": 2999.00,
                "discount_percentage": 57,
                "rating": 4.2,
                "rating_count": 12100,
                "stock": 100,
                "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500",
                "category_id": "electronics",
                "brand": "boAt",
                "is_deal": True,
                "deal_ends_at": datetime.utcnow() + timedelta(hours=12, minutes=34, seconds=56),
                "created_by": "system_seed",
            },
        ]
        for p_data in products_data:
            existing = db.query(Product).filter(Product.unique_id == p_data["unique_id"]).first()
            if not existing:
                db.add(Product(**p_data))
        
        # Ensure older products are active
        db.query(Product).filter(Product.is_active == None).update({"is_active": True})
        db.commit()
    except Exception as e:
        print(f"[Seed Warning] Catalog seeding skipped: {e}")
    finally:
        db.close()


from sqlalchemy import text

from app.grpc_service.server import start_grpc_server, stop_grpc_server

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    # Ensure any new columns exist in existing PostgreSQL/SQLite databases
    for col, col_type in [
        ("original_price", "NUMERIC(10, 2)"),
        ("discount_percentage", "INTEGER DEFAULT 0"),
        ("rating", "NUMERIC(3, 1) DEFAULT 4.5"),
        ("rating_count", "INTEGER DEFAULT 0"),
        ("image_url", "VARCHAR(500)"),
        ("category_id", "VARCHAR(50)"),
        ("brand", "VARCHAR(100)"),
        ("is_deal", "BOOLEAN DEFAULT FALSE"),
        ("deal_ends_at", "TIMESTAMP"),
    ]:
        try:
            with engine.connect() as conn:
                conn.execute(text(f"ALTER TABLE products ADD COLUMN IF NOT EXISTS {col} {col_type};"))
                conn.commit()
        except Exception:
            pass
    seed_initial_catalog()

    # Start High-Speed Binary gRPC Server concurrently on Port 50051
    await start_grpc_server(host="0.0.0.0", port=50051)
    
    yield
    
    # Graceful gRPC Server Shutdown
    await stop_grpc_server()


app = FastAPI(
    title="Ecommerce Product Service",
    version="1.0.0",
    lifespan=lifespan,
)

APP_V1 = "/api/v1"

@app.get("/")
async def root():
    return {
        "service": "product-service",
        "message": "Product Service is running",
    }

@app.get("/health")
async def health_check():
    return {
        "service": "product-service",
        "status": "healthy",
    }

# Include with /api, /api/v1, and default prefixes for maximum gateway and direct compatibility
app.include_router(product.router, prefix="/api/v1")
app.include_router(product.router, prefix="/api")
app.include_router(product.router)
