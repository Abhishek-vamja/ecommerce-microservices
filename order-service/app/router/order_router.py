import traceback
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.order import Cart, CartItem, WishlistItem, Order, OrderItem, OrderTracking
from app.schema.order import (
    CartItemAdd,
    CartItemUpdate,
    CartResponse,
    WishlistItemAdd,
    CheckoutRequest,
    OrderConfirmInternalRequest,
)
from app.service import (
    get_current_user,
    get_or_create_cart,
    add_item_to_cart,
    update_cart_item_qty,
    remove_cart_item,
    clear_user_cart,
    toggle_wishlist_item,
    move_wishlist_to_cart,
    checkout_order,
    finalize_order_payment,
    fail_order_payment,
)
from app.core.rate_limiter import rate_limit

router = APIRouter(tags=["Order Service"])


# --- CART ENDPOINTS ---

@router.get("/cart")
async def get_cart(
    current_user: dict = Depends(get_current_user()),
    db: Session = Depends(get_db),
):
    try:
        user_id = current_user.get("user_id")
        cart = get_or_create_cart(db, user_id)
        items_res = [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "unit_price": float(item.unit_price),
                "image_url": item.image_url,
                "quantity": item.quantity,
                "item_total": float(item.unit_price) * item.quantity,
            }
            for item in cart.items
        ]
        subtotal = sum(i["item_total"] for i in items_res)
        return JSONResponse(
            status_code=200,
            content={
                "id": cart.id,
                "user_id": user_id,
                "items": items_res,
                "subtotal": subtotal,
                "item_count": sum(i["quantity"] for i in items_res),
            }
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cart/items")
async def add_to_cart(
    data: CartItemAdd,
    current_user: dict = Depends(get_current_user()),
    db: Session = Depends(get_db),
):
    try:
        user_id = current_user.get("user_id")
        cart = add_item_to_cart(db, user_id, data)
        return JSONResponse(status_code=200, content={"message": "Item added to cart", "cart_id": cart.id})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/cart/items/{item_id}")
async def update_cart_item(
    item_id: str,
    data: CartItemUpdate,
    current_user: dict = Depends(get_current_user()),
    db: Session = Depends(get_db),
):
    try:
        user_id = current_user.get("user_id")
        update_cart_item_qty(db, user_id, item_id, data.quantity)
        return JSONResponse(status_code=200, content={"message": "Cart updated"})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/cart/items/{item_id}")
async def delete_cart_item(
    item_id: str,
    current_user: dict = Depends(get_current_user()),
    db: Session = Depends(get_db),
):
    try:
        user_id = current_user.get("user_id")
        remove_cart_item(db, user_id, item_id)
        return JSONResponse(status_code=200, content={"message": "Item removed from cart"})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/cart/clear")
async def empty_cart(
    current_user: dict = Depends(get_current_user()),
    db: Session = Depends(get_db),
):
    try:
        user_id = current_user.get("user_id")
        clear_user_cart(db, user_id)
        return JSONResponse(status_code=200, content={"message": "Cart cleared"})
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# --- WISHLIST ENDPOINTS ---

@router.get("/wishlist")
async def get_wishlist(
    current_user: dict = Depends(get_current_user()),
    db: Session = Depends(get_db),
):
    try:
        user_id = current_user.get("user_id")
        items = db.query(WishlistItem).filter(WishlistItem.user_id == user_id).all()
        return JSONResponse(
            status_code=200,
            content=[
                {
                    "id": w.id,
                    "product_id": w.product_id,
                    "product_name": w.product_name,
                    "unit_price": float(w.unit_price),
                    "image_url": w.image_url,
                    "created_at": w.created_at.isoformat() if w.created_at else None,
                }
                for w in items
            ]
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/wishlist/toggle")
async def toggle_wishlist(
    data: WishlistItemAdd,
    current_user: dict = Depends(get_current_user()),
    db: Session = Depends(get_db),
):
    try:
        user_id = current_user.get("user_id")
        result = toggle_wishlist_item(db, user_id, data.product_id, data.product_name, data.unit_price, data.image_url or "")
        return JSONResponse(status_code=200, content=result)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/wishlist/move-to-cart/{product_id}")
async def move_to_cart_route(
    product_id: str,
    current_user: dict = Depends(get_current_user()),
    db: Session = Depends(get_db),
):
    try:
        user_id = current_user.get("user_id")
        result = move_wishlist_to_cart(db, user_id, product_id)
        return JSONResponse(status_code=200, content=result)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# --- ORDER & CHECKOUT ENDPOINTS ---

@router.post("/order/checkout", dependencies=[Depends(rate_limit(max_requests=10, window_seconds=60, key_prefix="rl:checkout"))])
async def create_checkout(
    data: CheckoutRequest,
    current_user: dict = Depends(get_current_user()),
    db: Session = Depends(get_db),
):
    """
    Initiates checkout, snapshots order items, locks prices, and reserves stock for 10 minutes.
    """
    try:
        user_id = current_user.get("user_id")
        order = await checkout_order(db, user_id, data)
        return JSONResponse(
            status_code=201,
            content={
                "message": "Order initiated successfully",
                "order_id": order.id,
                "order_number": order.order_number,
                "total_amount": float(order.total_amount),
                "discount_amount": float(order.discount_amount),
                "shipping_fee": float(order.shipping_fee),
                "net_amount": float(order.net_amount),
                "status": order.status,
                "payment_method": order.payment_method,
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/order/my-orders")
async def get_my_orders(
    current_user: dict = Depends(get_current_user()),
    db: Session = Depends(get_db),
):
    try:
        user_id = current_user.get("user_id")
        orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
        return JSONResponse(
            status_code=200,
            content=[
                {
                    "id": ord.id,
                    "order_number": ord.order_number,
                    "net_amount": float(ord.net_amount),
                    "status": ord.status,
                    "payment_method": ord.payment_method,
                    "payment_status": ord.payment_status,
                    "created_at": ord.created_at.isoformat() if ord.created_at else None,
                    "item_count": len(ord.items),
                    "items": [
                        {
                            "id": it.id,
                            "product_id": it.product_id,
                            "product_name": it.product_name,
                            "unit_price": float(it.unit_price),
                            "quantity": it.quantity,
                            "total_price": float(it.total_price),
                            "image_url": it.image_url,
                        }
                        for it in ord.items
                    ]
                }
                for ord in orders
            ]
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/order/{order_id}")
async def get_order_by_id(
    order_id: str,
    current_user: dict = Depends(get_current_user()),
    db: Session = Depends(get_db),
):
    try:
        user_id = current_user.get("user_id")
        order = db.query(Order).filter(Order.id == order_id, Order.user_id == user_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        return JSONResponse(
            status_code=200,
            content={
                "id": order.id,
                "order_number": order.order_number,
                "total_amount": float(order.total_amount),
                "discount_amount": float(order.discount_amount),
                "shipping_fee": float(order.shipping_fee),
                "net_amount": float(order.net_amount),
                "status": order.status,
                "payment_method": order.payment_method,
                "payment_status": order.payment_status,
                "shipping_address": order.shipping_address,
                "created_at": order.created_at.isoformat() if order.created_at else None,
                "items": [
                    {
                        "id": it.id,
                        "product_id": it.product_id,
                        "product_name": it.product_name,
                        "unit_price": float(it.unit_price),
                        "quantity": it.quantity,
                        "total_price": float(it.total_price),
                        "image_url": it.image_url,
                    }
                    for it in order.items
                ],
                "tracking": [
                    {
                        "status": tr.status,
                        "message": tr.message,
                        "timestamp": tr.timestamp.isoformat() if tr.timestamp else None,
                    }
                    for tr in order.tracking
                ]
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/order/{order_id}/tracking")
async def get_order_tracking(
    order_id: str,
    db: Session = Depends(get_db),
):
    """Public/Authenticated tracking status for an order."""
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        # Build timeline
        stages = ["ORDER_PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"]
        current_status = order.status

        return JSONResponse(
            status_code=200,
            content={
                "order_id": order.id,
                "order_number": order.order_number,
                "current_status": current_status,
                "created_at": order.created_at.isoformat() if order.created_at else None,
                "stages": stages,
                "history": [
                    {
                        "status": tr.status,
                        "message": tr.message,
                        "timestamp": tr.timestamp.isoformat() if tr.timestamp else None,
                    }
                    for tr in order.tracking
                ]
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/order/internal/confirm")
async def confirm_order_internal(
    data: OrderConfirmInternalRequest,
    db: Session = Depends(get_db),
):
    """Internal endpoint called by payment-service upon verified payment signature."""
    try:
        order = await finalize_order_payment(db, data.order_id, data.razorpay_payment_id)
        return JSONResponse(status_code=200, content={"message": "Order finalized and confirmed", "order_id": order.id})
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/order/internal/fail")
async def fail_order_internal(
    data: dict,
    db: Session = Depends(get_db),
):
    """Internal endpoint called by payment-service upon failed payment webhook."""
    try:
        order = await fail_order_payment(db, data.get("order_id"), data.get("reason", "Payment failed"))
        return JSONResponse(status_code=200, content={"message": "Order payment marked failed", "order_id": order.id})
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# =========================================================================
# SELLER & ADMIN 5% PROFIT ENGINE & DASHBOARD ANALYTICS ENDPOINTS
# =========================================================================

@router.get("/order/seller/analytics")
@router.get("/seller/analytics")
async def get_seller_analytics(
    seller_id: str = Query(...),
    db: Session = Depends(get_db),
):
    """Seller Dashboard KPI Analytics & 5% Platform Fee Breakdown."""
    try:
        items = db.query(OrderItem).filter(OrderItem.seller_id == seller_id).all()
        
        gross_sales = sum(float(i.total_price) for i in items)
        platform_fees = sum(float(i.platform_fee or 0.0) for i in items)
        net_earnings = sum(float(i.seller_payout or 0.0) for i in items)
        units_sold = sum(i.quantity for i in items)

        # Unique orders
        order_ids = list(set(i.order_id for i in items))
        total_orders = len(order_ids)

        # Recent seller orders
        recent_orders_query = (
            db.query(Order)
            .join(OrderItem, Order.id == OrderItem.order_id)
            .filter(OrderItem.seller_id == seller_id)
            .order_by(Order.created_at.desc())
            .limit(10)
            .all()
        )

        recent_orders = [
            {
                "id": o.id,
                "order_number": o.order_number,
                "status": o.status,
                "payment_status": o.payment_status,
                "created_at": o.created_at.isoformat() if o.created_at else None,
                "items": [
                    {
                        "product_name": it.product_name,
                        "quantity": it.quantity,
                        "unit_price": float(it.unit_price),
                        "total_price": float(it.total_price),
                        "platform_fee": float(it.platform_fee or 0.0),
                        "seller_payout": float(it.seller_payout or 0.0),
                    }
                    for it in o.items if it.seller_id == seller_id
                ]
            }
            for o in recent_orders_query
        ]

        return JSONResponse(
            status_code=200,
            content={
                "seller_id": seller_id,
                "gross_sales": round(gross_sales, 2),
                "platform_fees_deducted": round(platform_fees, 2),
                "net_earnings": round(net_earnings, 2),
                "total_orders": total_orders,
                "units_sold": units_sold,
                "commission_rate_percent": 5.0,
                "recent_orders": recent_orders,
            }
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/order/seller/orders")
@router.get("/seller/orders")
async def get_seller_orders(
    seller_id: str = Query(...),
    db: Session = Depends(get_db),
):
    """Fetch all orders containing items from this seller with line item details."""
    try:
        orders = (
            db.query(Order)
            .join(OrderItem, Order.id == OrderItem.order_id)
            .filter(OrderItem.seller_id == seller_id)
            .order_by(Order.created_at.desc())
            .all()
        )

        res = []
        for o in orders:
            seller_items = [it for it in o.items if it.seller_id == seller_id]
            seller_gross = sum(float(it.total_price) for it in seller_items)
            seller_fee = sum(float(it.platform_fee or 0.0) for it in seller_items)
            seller_payout = sum(float(it.seller_payout or 0.0) for it in seller_items)

            res.append({
                "id": o.id,
                "order_number": o.order_number,
                "user_id": o.user_id,
                "status": o.status,
                "payment_status": o.payment_status,
                "payment_method": o.payment_method,
                "shipping_address": o.shipping_address,
                "created_at": o.created_at.isoformat() if o.created_at else None,
                "seller_gross_total": round(seller_gross, 2),
                "platform_fee_5pct": round(seller_fee, 2),
                "seller_net_payout": round(seller_payout, 2),
                "items": [
                    {
                        "id": it.id,
                        "product_id": it.product_id,
                        "product_name": it.product_name,
                        "unit_price": float(it.unit_price),
                        "quantity": it.quantity,
                        "total_price": float(it.total_price),
                        "platform_fee": float(it.platform_fee or 0.0),
                        "seller_payout": float(it.seller_payout or 0.0),
                        "image_url": it.image_url,
                    }
                    for it in seller_items
                ]
            })

        return JSONResponse(status_code=200, content=res)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/order/seller/{order_id}/status")
async def update_seller_order_status(
    order_id: str,
    data: dict,
    db: Session = Depends(get_db),
):
    """Seller updates order fulfillment status (PROCESSING, SHIPPED, DELIVERED)."""
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        new_status = data.get("status", "PROCESSING").upper()
        order.status = new_status

        # Append tracking event
        tracking = OrderTracking(
            order_id=order.id,
            status=new_status,
            message=data.get("message", f"Order status updated to {new_status} by Seller."),
        )
        db.add(tracking)
        db.commit()
        return JSONResponse(status_code=200, content={"message": f"Order status updated to {new_status}", "order_id": order.id, "status": order.status})
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/order/admin/profits")
@router.get("/admin/profits")
async def get_admin_profit_ledger(
    db: Session = Depends(get_db),
):
    """
    Platform Admin 5% Profit Engine & Order-by-Order Particular Sale Breakdown.
    """
    try:
        all_order_items = db.query(OrderItem).order_by(OrderItem.id.desc()).all()
        all_orders = db.query(Order).order_by(Order.created_at.desc()).all()

        total_gmv = sum(float(it.total_price) for it in all_order_items)
        total_platform_profit_5pct = sum(float(it.platform_fee or 0.0) for it in all_order_items)
        total_seller_payouts_95pct = sum(float(it.seller_payout or 0.0) for it in all_order_items)

        # Unique sellers
        seller_ids = list(set(it.seller_id for it in all_order_items if it.seller_id))

        # Order map for fast lookup
        order_map = {o.id: o for o in all_orders}

        # Particular sale breakdown list
        sales_breakdown = []
        for it in all_order_items:
            parent_order = order_map.get(it.order_id)
            gross = float(it.total_price)
            fee = float(it.platform_fee or (gross * 0.05))
            payout = float(it.seller_payout or (gross - fee))

            sales_breakdown.append({
                "item_id": it.id,
                "order_id": it.order_id,
                "order_number": parent_order.order_number if parent_order else "N/A",
                "customer_user_id": parent_order.user_id if parent_order else "N/A",
                "item_name": it.product_name,
                "seller_id": it.seller_id or "seller_default",
                "shop_name": it.shop_name or "ShopMate Direct",
                "quantity": it.quantity,
                "unit_price": float(it.unit_price),
                "gross_sale_amount": round(gross, 2),
                "platform_profit_5pct": round(fee, 2),
                "seller_payout_95pct": round(payout, 2),
                "order_status": parent_order.status if parent_order else "PENDING",
                "payment_status": parent_order.payment_status if parent_order else "UNPAID",
                "created_at": parent_order.created_at.isoformat() if parent_order and parent_order.created_at else None,
            })

        return JSONResponse(
            status_code=200,
            content={
                "summary": {
                    "total_gmv": round(total_gmv, 2),
                    "total_platform_profit_5pct": round(total_platform_profit_5pct, 2),
                    "total_seller_payouts_95pct": round(total_seller_payouts_95pct, 2),
                    "total_orders": len(all_orders),
                    "total_items_sold": len(all_order_items),
                    "total_active_sellers": len(seller_ids),
                    "platform_commission_rate": "5%",
                },
                "sales_breakdown": sales_breakdown,
            }
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/order/admin/sellers-summary")
@router.get("/admin/sellers-summary")
async def get_admin_sellers_summary(
    db: Session = Depends(get_db),
):
    """Admin summary of sales, orders, and 5% profit earned from each specific seller."""
    try:
        all_order_items = db.query(OrderItem).all()
        seller_data = {}

        for it in all_order_items:
            sid = it.seller_id or "seller_default"
            if sid not in seller_data:
                seller_data[sid] = {
                    "seller_id": sid,
                    "shop_name": it.shop_name or "ShopMate Direct",
                    "gross_sales": 0.0,
                    "platform_profit_5pct": 0.0,
                    "seller_payout_95pct": 0.0,
                    "units_sold": 0,
                    "order_ids": set(),
                }
            
            gross = float(it.total_price)
            fee = float(it.platform_fee or (gross * 0.05))
            payout = float(it.seller_payout or (gross - fee))

            seller_data[sid]["gross_sales"] += gross
            seller_data[sid]["platform_profit_5pct"] += fee
            seller_data[sid]["seller_payout_95pct"] += payout
            seller_data[sid]["units_sold"] += it.quantity
            seller_data[sid]["order_ids"].add(it.order_id)

        result = [
            {
                "seller_id": v["seller_id"],
                "shop_name": v["shop_name"],
                "gross_sales": round(v["gross_sales"], 2),
                "platform_profit_5pct": round(v["platform_profit_5pct"], 2),
                "seller_payout_95pct": round(v["seller_payout_95pct"], 2),
                "units_sold": v["units_sold"],
                "total_orders": len(v["order_ids"]),
            }
            for v in seller_data.values()
        ]
        return JSONResponse(status_code=200, content=result)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

