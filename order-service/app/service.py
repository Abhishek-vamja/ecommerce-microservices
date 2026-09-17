import os
import uuid
from datetime import datetime
from typing import List, Optional
import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.models.order import Cart, CartItem, WishlistItem, Order, OrderItem, OrderTracking
from app.schema.order import CartItemAdd, CheckoutRequest
from app.core.rate_limiter import redis_client

security = HTTPBearer()


def get_current_user(role: list = None):
    async def _get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
    ) -> dict:
        token = credentials.credentials
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
            user_id = payload.get("user_id") or payload.get("sub")
            _role = payload.get("role")
            if not user_id:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
            if role is not None and (_role is None or _role.lower() not in [r.lower() for r in role]):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
            return {"user_id": user_id, "role": _role}
        except jwt.PyJWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return _get_current_user


def get_or_create_cart(db: Session, user_id: str) -> Cart:
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def add_item_to_cart(db: Session, user_id: str, data: CartItemAdd) -> Cart:
    cart = get_or_create_cart(db, user_id)
    existing_item = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == data.product_id
    ).first()

    if existing_item:
        existing_item.quantity += data.quantity
        existing_item.unit_price = data.unit_price
        if data.seller_id: existing_item.seller_id = data.seller_id
        if data.shop_name: existing_item.shop_name = data.shop_name
    else:
        new_item = CartItem(
            cart_id=cart.id,
            product_id=data.product_id,
            product_name=data.product_name,
            unit_price=data.unit_price,
            image_url=data.image_url,
            seller_id=data.seller_id or "seller_default",
            shop_name=data.shop_name or "ShopMate Direct",
            quantity=data.quantity,
        )
        db.add(new_item)

    db.commit()
    db.refresh(cart)
    return cart


def update_cart_item_qty(db: Session, user_id: str, item_id: str, quantity: int) -> Cart:
    cart = get_or_create_cart(db, user_id)
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    if quantity <= 0:
        db.delete(item)
    else:
        item.quantity = quantity
    db.commit()
    db.refresh(cart)
    return cart


def remove_cart_item(db: Session, user_id: str, item_id: str) -> Cart:
    cart = get_or_create_cart(db, user_id)
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.cart_id == cart.id).first()
    if item:
        db.delete(item)
        db.commit()
        db.refresh(cart)
    return cart


def clear_user_cart(db: Session, user_id: str) -> bool:
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if cart:
        db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
        db.commit()
    return True


def toggle_wishlist_item(db: Session, user_id: str, product_id: str, product_name: str = "", unit_price: float = 0.0, image_url: str = "") -> dict:
    existing = db.query(WishlistItem).filter(
        WishlistItem.user_id == user_id,
        WishlistItem.product_id == product_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"action": "removed", "product_id": product_id}
    else:
        new_witem = WishlistItem(
            user_id=user_id,
            product_id=product_id,
            product_name=product_name,
            unit_price=unit_price,
            image_url=image_url,
        )
        db.add(new_witem)
        db.commit()
        return {"action": "added", "product_id": product_id}


def move_wishlist_to_cart(db: Session, user_id: str, product_id: str) -> dict:
    witem = db.query(WishlistItem).filter(
        WishlistItem.user_id == user_id,
        WishlistItem.product_id == product_id
    ).first()

    if not witem:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wishlist item not found")

    # Add to cart
    add_item_to_cart(db, user_id, CartItemAdd(
        product_id=witem.product_id,
        product_name=witem.product_name,
        unit_price=float(witem.unit_price),
        image_url=witem.image_url,
        quantity=1,
    ))

    # Remove from wishlist
    db.delete(witem)
    db.commit()
    return {"message": "Moved to cart successfully", "product_id": product_id}


async def checkout_order(db: Session, user_id: str, data: CheckoutRequest) -> Order:
    """
    Atomic Checkout Process with Redis Temporary Stock Hold (10 min TTL).
    """
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot checkout an empty cart")

    total_amount = sum(float(item.unit_price) * item.quantity for item in cart.items)
    discount_amount = 0.0
    if data.coupon_code and data.coupon_code.upper() == "SHOPMATE10":
        discount_amount = total_amount * 0.10

    shipping_fee = 0.0 if total_amount >= 499.0 else 50.0
    net_amount = max(0.0, total_amount - discount_amount + shipping_fee)

    order_id = f"ord_{uuid.uuid4().hex[:12]}"
    order_number = f"SM-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    # Acquire 10-minute temporary stock holds in Redis
    try:
        pipe = redis_client.pipeline()
        for item in cart.items:
            hold_key = f"stock_hold:{item.product_id}:{order_id}"
            pipe.set(hold_key, item.quantity, ex=600)  # 10 minutes
        pipe.execute()
    except Exception as e:
        print(f"[Redis Stock Hold Warning]: {e}")

    # Atomic DB Transaction
    try:
        with db.begin_nested():
            order = Order(
                id=order_id,
                order_number=order_number,
                user_id=user_id,
                total_amount=total_amount,
                discount_amount=discount_amount,
                shipping_fee=shipping_fee,
                net_amount=net_amount,
                status="CONFIRMED" if data.payment_method.upper() == "COD" else "PENDING",
                payment_method=data.payment_method.upper(),
                payment_status="UNPAID",
                shipping_address=data.shipping_address,
            )
            db.add(order)

            # Snapshot cart items into immutable order items
            for item in cart.items:
                gross = float(item.unit_price) * item.quantity
                fee = round(gross * 0.05, 2)
                payout = round(gross - fee, 2)
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=item.product_id,
                    product_name=item.product_name,
                    unit_price=item.unit_price,
                    quantity=item.quantity,
                    total_price=gross,
                    image_url=item.image_url,
                    seller_id=item.seller_id or "seller_default",
                    shop_name=item.shop_name or "ShopMate Direct",
                    commission_rate=5.0,
                    platform_fee=fee,
                    seller_payout=payout,
                )
                db.add(order_item)

            # Initial tracking record
            tracking = OrderTracking(
                order_id=order.id,
                status="ORDER_PLACED",
                message="Order successfully placed and initiated.",
            )
            db.add(tracking)

            # If COD, clear cart immediately and trigger stock deduction
            if data.payment_method.upper() == "COD":
                clear_user_cart(db, user_id)

        db.commit()
        db.refresh(order)
        return order
    except Exception as e:
        db.rollback()
        # Release Redis stock holds on DB failure
        for item in cart.items:
            redis_client.delete(f"stock_hold:{item.product_id}:{order_id}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create order: {str(e)}")


async def finalize_order_payment(db: Session, order_id: str, payment_id: str) -> Order:
    """
    Called when payment is captured. Commits permanent stock deduction, marks CONFIRMED, and clears cart.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = "CONFIRMED"
    order.payment_status = "PAID"

    # Add tracking milestone
    tracking = OrderTracking(
        order_id=order.id,
        status="PAYMENT_CONFIRMED",
        message=f"Payment captured successfully via Razorpay (Ref: {payment_id}).",
    )
    db.add(tracking)

    # Empty active cart for user
    clear_user_cart(db, order.user_id)

    # Trigger stock reduction in product-service via High-Speed gRPC (with HTTP fallback)
    for item in order.items:
        try:
            from app.grpc_service.product_client import deduct_stock_grpc
            grpc_success = await deduct_stock_grpc(item.product_id, item.quantity)
            if not grpc_success:
                # HTTP fallback
                async with httpx.AsyncClient(timeout=3.0) as client:
                    await client.post(
                        f"{settings.PRODUCT_SERVICE_URL}/product/deduct-stock",
                        json={"items": [{"product_id": item.product_id, "quantity": item.quantity}]},
                    )
        except Exception as e:
            print(f"[Product Stock Deduction Warning for {item.product_id}]: {e}")

    # Release Redis stock hold
    for item in order.items:
        redis_client.delete(f"stock_hold:{item.product_id}:{order_id}")

    db.commit()
    db.refresh(order)
    return order


async def fail_order_payment(db: Session, order_id: str, reason: str = "Payment failed") -> Order:
    """
    Called when payment webhook receives payment.failed.
    Marks PAYMENT_FAILED and releases reserved items.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = "PAYMENT_FAILED"
    order.payment_status = "FAILED"

    tracking = OrderTracking(
        order_id=order.id,
        status="PAYMENT_FAILED",
        message=f"Payment failed: {reason}",
    )
    db.add(tracking)

    for item in order.items:
        redis_client.delete(f"stock_hold:{item.product_id}:{order_id}")

    db.commit()
    db.refresh(order)
    return order
