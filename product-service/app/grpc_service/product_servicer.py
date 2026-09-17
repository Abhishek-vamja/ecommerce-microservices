import os
import math
import logging
from uuid import uuid4
from datetime import datetime
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.product import Product, Category
from app.grpc_gen import product_pb2, product_pb2_grpc

logger = logging.getLogger(__name__)


def _model_to_proto(p: Product) -> product_pb2.ProductItem:
    return product_pb2.ProductItem(
        id=str(p.unique_id or p.id),
        name=p.name or "",
        description=p.description or "",
        price=float(p.price or 0.0),
        stock=int(p.stock or 0),
        category_id=p.category_id or "",
        brand=p.brand or "",
        image_url=p.image_url or "",
        images=[],
        is_active=bool(p.is_active),
        is_deal=bool(p.is_deal),
        discount_percentage=float(p.discount_percentage or 0.0),
        rating=float(p.rating or 4.5),
        reviews_count=int(p.rating_count or 0),
        seller_id=p.seller_id or "",
        shop_name=p.shop_name or "",
        created_at=p.created_at.isoformat() if p.created_at else "",
        updated_at=p.updated_at.isoformat() if p.updated_at else "",
    )


def _category_to_proto(c: Category) -> product_pb2.CategoryItem:
    return product_pb2.CategoryItem(
        id=c.id,
        name=c.name or "",
        slug=c.slug or "",
        icon="",
        image_url=c.icon_url or "",
        is_active=True,
        display_order=int(c.display_order or 0),
    )


class ProductGrpcService(product_pb2_grpc.ProductGrpcServiceServicer):

    async def GetProducts(self, request, context):
        db: Session = SessionLocal()
        try:
            page = max(1, request.page or 1)
            page_size = min(100, max(1, request.page_size or 12))
            offset = (page - 1) * page_size

            query = select(Product).filter(Product.is_active == True)

            if request.seller_id:
                query = query.filter(Product.seller_id == request.seller_id)

            if request.search:
                search_filter = f"%{request.search.strip()}%"
                query = query.filter(
                    or_(
                        Product.name.ilike(search_filter),
                        Product.description.ilike(search_filter),
                        Product.brand.ilike(search_filter),
                        Product.shop_name.ilike(search_filter),
                    )
                )

            if request.category_id and request.category_id.lower() != "all":
                cat = db.query(Category).filter(
                    or_(Category.id == request.category_id, Category.slug == request.category_id)
                ).first()
                if cat:
                    query = query.filter(or_(Product.category_id == cat.id, Product.category_id == cat.slug))
                else:
                    query = query.filter(Product.category_id == request.category_id)

            if request.brand and request.brand.lower() != "all":
                query = query.filter(Product.brand.ilike(f"%{request.brand.strip()}%"))

            if request.has_is_deal:
                query = query.filter(Product.is_deal == request.is_deal)

            if request.has_min_price:
                query = query.filter(Product.price >= request.min_price)

            if request.has_max_price:
                query = query.filter(Product.price <= request.max_price)

            if request.has_min_rating:
                query = query.filter(Product.rating >= request.min_rating)

            # Sorting
            sort_by = request.sort_by or "newest"
            if sort_by == "price_asc":
                query = query.order_by(Product.price.asc())
            elif sort_by == "price_desc":
                query = query.order_by(Product.price.desc())
            elif sort_by == "rating":
                query = query.order_by(Product.rating.desc())
            else:
                query = query.order_by(Product.created_at.desc())

            count_query = select(func.count()).select_from(query.subquery())
            total = db.scalar(count_query) or 0

            products = db.scalars(query.offset(offset).limit(page_size)).all()
            total_pages = math.ceil(total / page_size) if total > 0 else 1

            proto_items = [_model_to_proto(p) for p in products]

            return product_pb2.ProductListResponse(
                items=proto_items,
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
            )
        except Exception as e:
            logger.error(f"[gRPC GetProducts] Error: {e}", exc_info=True)
            return product_pb2.ProductListResponse(items=[], total=0, page=1, page_size=12, total_pages=0)
        finally:
            db.close()

    async def GetProductById(self, request, context):
        db: Session = SessionLocal()
        try:
            prod_id = request.id.strip()
            product = db.query(Product).filter(
                or_(
                    Product.unique_id == prod_id,
                    Product.name == prod_id
                )
            ).first()

            if not product:
                # Try UUID query if format matches
                try:
                    product = db.query(Product).filter(Product.id == prod_id).first()
                except Exception:
                    pass

            if not product:
                return product_pb2.ProductDetailResponse(
                    exists=False,
                    error_message=f"Product with id '{prod_id}' not found."
                )

            return product_pb2.ProductDetailResponse(
                product=_model_to_proto(product),
                exists=True,
                error_message=""
            )
        except Exception as e:
            logger.error(f"[gRPC GetProductById] Error: {e}", exc_info=True)
            return product_pb2.ProductDetailResponse(exists=False, error_message=str(e))
        finally:
            db.close()

    async def GetSellerProducts(self, request, context):
        db: Session = SessionLocal()
        try:
            page = max(1, request.page or 1)
            page_size = min(100, max(1, request.page_size or 50))
            offset = (page - 1) * page_size

            query = select(Product).filter(Product.seller_id == request.seller_id)
            count_query = select(func.count()).select_from(query.subquery())
            total = db.scalar(count_query) or 0

            products = db.scalars(query.order_by(Product.created_at.desc()).offset(offset).limit(page_size)).all()
            total_pages = math.ceil(total / page_size) if total > 0 else 1

            return product_pb2.ProductListResponse(
                items=[_model_to_proto(p) for p in products],
                total=total,
                page=page,
                page_size=page_size,
                total_pages=total_pages,
            )
        except Exception as e:
            logger.error(f"[gRPC GetSellerProducts] Error: {e}", exc_info=True)
            return product_pb2.ProductListResponse(items=[], total=0, page=1, page_size=50, total_pages=0)
        finally:
            db.close()

    async def GetCategories(self, request, context):
        db: Session = SessionLocal()
        try:
            cats = db.query(Category).order_by(Category.display_order.asc(), Category.name.asc()).all()
            return product_pb2.CategoriesResponse(
                categories=[_category_to_proto(c) for c in cats]
            )
        except Exception as e:
            logger.error(f"[gRPC GetCategories] Error: {e}", exc_info=True)
            return product_pb2.CategoriesResponse(categories=[])
        finally:
            db.close()

    async def GetFilterMeta(self, request, context):
        db: Session = SessionLocal()
        try:
            brands_res = db.query(Product.brand).filter(
                Product.is_active == True,
                Product.brand.isnot(None)
            ).distinct().all()
            brands = [b[0] for b in brands_res if b[0]]

            cats = db.query(Category).order_by(Category.display_order.asc()).all()

            price_min, price_max = db.query(
                func.min(Product.price),
                func.max(Product.price)
            ).filter(Product.is_active == True).first()

            return product_pb2.FilterMetaResponse(
                brands=brands,
                categories=[_category_to_proto(c) for c in cats],
                price_range=product_pb2.PriceRange(
                    min=float(price_min or 0.0),
                    max=float(price_max or 100000.0),
                )
            )
        except Exception as e:
            logger.error(f"[gRPC GetFilterMeta] Error: {e}", exc_info=True)
            return product_pb2.FilterMetaResponse(
                brands=[],
                categories=[],
                price_range=product_pb2.PriceRange(min=0.0, max=100000.0)
            )
        finally:
            db.close()

    async def CreateProduct(self, request, context):
        db: Session = SessionLocal()
        try:
            new_prod = Product(
                unique_id=f"prod_{uuid4().hex[:10]}",
                name=request.name.strip(),
                description=request.description.strip(),
                price=request.price,
                stock=request.stock,
                category_id=request.category_id or "cat_electronics",
                brand=request.brand or "Generic",
                image_url=request.image_url or "",
                seller_id=request.seller_id or "",
                shop_name=request.shop_name or "Official Store",
                discount_percentage=int(request.discount_percentage or 0),
                is_active=True,
                created_by=request.seller_id or "system",
            )
            db.add(new_prod)
            db.commit()
            db.refresh(new_prod)
            return product_pb2.ProductDetailResponse(
                product=_model_to_proto(new_prod),
                exists=True,
                error_message=""
            )
        except Exception as e:
            db.rollback()
            logger.error(f"[gRPC CreateProduct] Error: {e}", exc_info=True)
            return product_pb2.ProductDetailResponse(exists=False, error_message=str(e))
        finally:
            db.close()

    async def DeductStock(self, request, context):
        db: Session = SessionLocal()
        try:
            prod_id = request.product_id.strip()
            prod = db.query(Product).filter(
                or_(Product.unique_id == prod_id, Product.name == prod_id)
            ).first()

            if not prod:
                return product_pb2.DeductStockGrpcResponse(
                    success=False,
                    remaining_stock=0,
                    error_message=f"Product '{prod_id}' not found."
                )

            if prod.stock < request.quantity:
                return product_pb2.DeductStockGrpcResponse(
                    success=False,
                    remaining_stock=prod.stock,
                    error_message=f"Insufficient stock for '{prod.name}'. Requested: {request.quantity}, Available: {prod.stock}"
                )

            prod.stock -= request.quantity
            db.commit()
            db.refresh(prod)
            return product_pb2.DeductStockGrpcResponse(
                success=True,
                remaining_stock=prod.stock,
                error_message=""
            )
        except Exception as e:
            db.rollback()
            logger.error(f"[gRPC DeductStock] Error: {e}", exc_info=True)
            return product_pb2.DeductStockGrpcResponse(success=False, remaining_stock=0, error_message=str(e))
        finally:
            db.close()
