import traceback
import logging
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.order import Cart, CartItem, WishlistItem, Order, OrderItem, OrderTracking
from app.schema.order import CartItemAdd, CheckoutRequest
from app.service import (
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
from app.grpc_gen import order_pb2, order_pb2_grpc

logger = logging.getLogger(__name__)


def _serialize_order_item(it: OrderItem) -> order_pb2.OrderItemDetail:
    return order_pb2.OrderItemDetail(
        id=str(it.id or ""),
        product_id=str(it.product_id or ""),
        product_name=str(it.product_name or ""),
        unit_price=float(it.unit_price or 0.0),
        quantity=int(it.quantity or 0),
        total_price=float(it.total_price or 0.0),
        image_url=str(it.image_url or ""),
        platform_fee=float(it.platform_fee or 0.0),
        seller_payout=float(it.seller_payout or 0.0),
        seller_id=str(it.seller_id or ""),
        shop_name=str(it.shop_name or ""),
    )


def _serialize_order(ord: Order) -> order_pb2.OrderDetailItem:
    return order_pb2.OrderDetailItem(
        id=str(ord.id or ""),
        order_number=str(ord.order_number or ""),
        user_id=str(ord.user_id or ""),
        total_amount=float(ord.total_amount or 0.0),
        discount_amount=float(ord.discount_amount or 0.0),
        shipping_fee=float(ord.shipping_fee or 0.0),
        net_amount=float(ord.net_amount or 0.0),
        status=str(ord.status or ""),
        payment_method=str(ord.payment_method or ""),
        payment_status=str(ord.payment_status or ""),
        shipping_address=str(ord.shipping_address or ""),
        created_at=ord.created_at.isoformat() if ord.created_at else "",
        item_count=len(ord.items) if ord.items else 0,
        items=[_serialize_order_item(i) for i in (ord.items or [])],
        tracking=[
            order_pb2.OrderTrackingEvent(
                status=str(t.status or ""),
                message=str(t.message or ""),
                timestamp=t.timestamp.isoformat() if t.timestamp else "",
            )
            for t in (ord.tracking or [])
        ],
    )


class OrderGrpcService(order_pb2_grpc.OrderGrpcServiceServicer):

    # --- CART RPCS ---

    async def GetCart(self, request: order_pb2.CartRequest, context):
        db: Session = SessionLocal()
        try:
            cart = get_or_create_cart(db, request.user_id)
            items = []
            for item in (cart.items or []):
                items.append(
                    order_pb2.CartItemMessage(
                        id=str(item.id),
                        product_id=str(item.product_id),
                        product_name=str(item.product_name),
                        unit_price=float(item.unit_price),
                        image_url=str(item.image_url or ""),
                        quantity=int(item.quantity),
                        item_total=float(item.unit_price) * item.quantity,
                        seller_id=str(item.seller_id or ""),
                        shop_name=str(item.shop_name or ""),
                    )
                )
            subtotal = sum(i.item_total for i in items)
            item_count = sum(i.quantity for i in items)

            return order_pb2.CartResponse(
                id=str(cart.id),
                user_id=str(cart.user_id),
                items=items,
                subtotal=subtotal,
                item_count=item_count,
            )
        except Exception as e:
            traceback.print_exc()
            return order_pb2.CartResponse(user_id=request.user_id, items=[])
        finally:
            db.close()

    async def AddToCart(self, request: order_pb2.AddToCartRequest, context):
        db: Session = SessionLocal()
        try:
            cart_data = CartItemAdd(
                product_id=request.product_id,
                product_name=request.product_name,
                unit_price=request.unit_price,
                image_url=request.image_url,
                quantity=request.quantity,
                seller_id=request.seller_id,
                shop_name=request.shop_name,
            )
            cart = add_item_to_cart(db, request.user_id, cart_data)
            return order_pb2.CartActionResponse(
                success=True,
                message="Item added to cart",
                cart_id=str(cart.id),
            )
        except Exception as e:
            traceback.print_exc()
            return order_pb2.CartActionResponse(success=False, message=str(e))
        finally:
            db.close()

    async def UpdateCartItem(self, request: order_pb2.UpdateCartItemRequest, context):
        db: Session = SessionLocal()
        try:
            update_cart_item_qty(db, request.user_id, request.item_id, request.quantity)
            return order_pb2.CartActionResponse(success=True, message="Cart updated")
        except Exception as e:
            traceback.print_exc()
            return order_pb2.CartActionResponse(success=False, message=str(e))
        finally:
            db.close()

    async def DeleteCartItem(self, request: order_pb2.DeleteCartItemRequest, context):
        db: Session = SessionLocal()
        try:
            remove_cart_item(db, request.user_id, request.item_id)
            return order_pb2.CartActionResponse(success=True, message="Item removed from cart")
        except Exception as e:
            traceback.print_exc()
            return order_pb2.CartActionResponse(success=False, message=str(e))
        finally:
            db.close()

    async def ClearCart(self, request: order_pb2.CartRequest, context):
        db: Session = SessionLocal()
        try:
            clear_user_cart(db, request.user_id)
            return order_pb2.CartActionResponse(success=True, message="Cart cleared")
        except Exception as e:
            traceback.print_exc()
            return order_pb2.CartActionResponse(success=False, message=str(e))
        finally:
            db.close()

    # --- WISHLIST RPCS ---

    async def GetWishlist(self, request: order_pb2.WishlistRequest, context):
        db: Session = SessionLocal()
        try:
            items = db.query(WishlistItem).filter(WishlistItem.user_id == request.user_id).all()
            return order_pb2.WishlistResponse(
                items=[
                    order_pb2.WishlistItemMessage(
                        id=str(w.id),
                        product_id=str(w.product_id),
                        product_name=str(w.product_name),
                        unit_price=float(w.unit_price),
                        image_url=str(w.image_url or ""),
                        created_at=w.created_at.isoformat() if w.created_at else "",
                    )
                    for w in items
                ]
            )
        except Exception as e:
            traceback.print_exc()
            return order_pb2.WishlistResponse(items=[])
        finally:
            db.close()

    async def ToggleWishlist(self, request: order_pb2.ToggleWishlistRequest, context):
        db: Session = SessionLocal()
        try:
            res = toggle_wishlist_item(
                db,
                request.user_id,
                request.product_id,
                request.product_name,
                request.unit_price,
                request.image_url,
            )
            return order_pb2.ToggleWishlistResponse(
                success=True,
                action=res.get("action", "toggled"),
                product_id=request.product_id,
            )
        except Exception as e:
            traceback.print_exc()
            return order_pb2.ToggleWishlistResponse(success=False, product_id=request.product_id)
        finally:
            db.close()

    async def MoveWishlistToCart(self, request: order_pb2.MoveWishlistRequest, context):
        db: Session = SessionLocal()
        try:
            res = move_wishlist_to_cart(db, request.user_id, request.product_id)
            return order_pb2.CartActionResponse(
                success=True,
                message=res.get("message", "Moved to cart successfully"),
            )
        except Exception as e:
            traceback.print_exc()
            return order_pb2.CartActionResponse(success=False, message=str(e))
        finally:
            db.close()

    # --- CHECKOUT & ORDERS ---

    async def CheckoutOrder(self, request: order_pb2.CheckoutGrpcRequest, context):
        db: Session = SessionLocal()
        try:
            schema_req = CheckoutRequest(
                shipping_address=request.shipping_address,
                payment_method=request.payment_method,
                coupon_code=request.coupon_code if request.coupon_code else None,
            )
            order = await checkout_order(db, request.user_id, schema_req)
            return order_pb2.CheckoutGrpcResponse(
                success=True,
                message="Order initiated successfully",
                order_id=str(order.id),
                order_number=str(order.order_number),
                total_amount=float(order.total_amount),
                discount_amount=float(order.discount_amount),
                shipping_fee=float(order.shipping_fee),
                net_amount=float(order.net_amount),
                status=str(order.status),
                payment_method=str(order.payment_method),
            )
        except Exception as e:
            traceback.print_exc()
            return order_pb2.CheckoutGrpcResponse(
                success=False,
                error_message=str(e),
            )
        finally:
            db.close()

    async def GetMyOrders(self, request: order_pb2.MyOrdersRequest, context):
        db: Session = SessionLocal()
        try:
            orders = db.query(Order).filter(Order.user_id == request.user_id).order_by(Order.created_at.desc()).all()
            return order_pb2.OrderListResponse(
                orders=[_serialize_order(o) for o in orders]
            )
        except Exception as e:
            traceback.print_exc()
            return order_pb2.OrderListResponse(orders=[])
        finally:
            db.close()

    async def GetOrderById(self, request: order_pb2.OrderDetailRequest, context):
        db: Session = SessionLocal()
        try:
            query = db.query(Order).filter(Order.id == request.order_id)
            if request.user_id:
                query = query.filter(Order.user_id == request.user_id)
            order = query.first()
            if not order:
                return order_pb2.OrderDetailResponse(exists=False, error_message="Order not found")

            return order_pb2.OrderDetailResponse(
                exists=True,
                order=_serialize_order(order),
            )
        except Exception as e:
            traceback.print_exc()
            return order_pb2.OrderDetailResponse(exists=False, error_message=str(e))
        finally:
            db.close()

    async def GetOrderTracking(self, request: order_pb2.OrderTrackingRequest, context):
        db: Session = SessionLocal()
        try:
            order = db.query(Order).filter(Order.id == request.order_id).first()
            if not order:
                return order_pb2.OrderTrackingResponse(exists=False, error_message="Order not found")

            stages = ["ORDER_PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"]
            return order_pb2.OrderTrackingResponse(
                exists=True,
                order_id=str(order.id),
                order_number=str(order.order_number),
                current_status=str(order.status),
                created_at=order.created_at.isoformat() if order.created_at else "",
                stages=stages,
                history=[
                    order_pb2.OrderTrackingEvent(
                        status=str(tr.status or ""),
                        message=str(tr.message or ""),
                        timestamp=tr.timestamp.isoformat() if tr.timestamp else "",
                    )
                    for tr in (order.tracking or [])
                ]
            )
        except Exception as e:
            traceback.print_exc()
            return order_pb2.OrderTrackingResponse(exists=False, error_message=str(e))
        finally:
            db.close()

    # --- INTERNAL RPCS ---

    async def ConfirmOrderInternal(self, request: order_pb2.ConfirmOrderInternalRequest, context):
        db: Session = SessionLocal()
        try:
            order = await finalize_order_payment(db, request.order_id, request.razorpay_payment_id)
            return order_pb2.ConfirmOrderResponse(
                success=True,
                message="Order finalized and confirmed",
                order_id=str(order.id),
            )
        except Exception as e:
            traceback.print_exc()
            return order_pb2.ConfirmOrderResponse(success=False, message=str(e), order_id=request.order_id)
        finally:
            db.close()

    async def FailOrderInternal(self, request: order_pb2.FailOrderInternalRequest, context):
        db: Session = SessionLocal()
        try:
            order = await fail_order_payment(db, request.order_id, request.reason)
            return order_pb2.FailOrderResponse(
                success=True,
                message="Order payment marked failed",
                order_id=str(order.id),
            )
        except Exception as e:
            traceback.print_exc()
            return order_pb2.FailOrderResponse(success=False, message=str(e), order_id=request.order_id)
        finally:
            db.close()

    # --- SELLER & ADMIN RPCS ---

    async def GetSellerAnalytics(self, request: order_pb2.SellerAnalyticsRequest, context):
        db: Session = SessionLocal()
        try:
            items = db.query(OrderItem).filter(OrderItem.seller_id == request.seller_id).all()
            gross_sales = sum(float(i.total_price) for i in items)
            platform_fees = sum(float(i.platform_fee or 0.0) for i in items)
            net_earnings = sum(float(i.seller_payout or 0.0) for i in items)
            units_sold = sum(i.quantity for i in items)
            order_ids = list(set(i.order_id for i in items))
            total_orders = len(order_ids)

            recent_orders_query = (
                db.query(Order)
                .join(OrderItem, Order.id == OrderItem.order_id)
                .filter(OrderItem.seller_id == request.seller_id)
                .order_by(Order.created_at.desc())
                .limit(10)
                .all()
            )

            return order_pb2.SellerAnalyticsResponse(
                seller_id=request.seller_id,
                gross_sales=round(gross_sales, 2),
                platform_fees_deducted=round(platform_fees, 2),
                net_earnings=round(net_earnings, 2),
                total_orders=total_orders,
                units_sold=units_sold,
                commission_rate_percent=5.0,
                recent_orders=[_serialize_order(o) for o in recent_orders_query],
            )
        except Exception as e:
            traceback.print_exc()
            return order_pb2.SellerAnalyticsResponse(seller_id=request.seller_id)
        finally:
            db.close()

    async def GetSellerOrders(self, request: order_pb2.SellerOrdersRequest, context):
        db: Session = SessionLocal()
        try:
            orders = (
                db.query(Order)
                .join(OrderItem, Order.id == OrderItem.order_id)
                .filter(OrderItem.seller_id == request.seller_id)
                .order_by(Order.created_at.desc())
                .all()
            )

            res = []
            for o in orders:
                seller_items = [it for it in o.items if it.seller_id == request.seller_id]
                seller_gross = sum(float(it.total_price) for it in seller_items)
                seller_fee = sum(float(it.platform_fee or 0.0) for it in seller_items)
                seller_payout = sum(float(it.seller_payout or 0.0) for it in seller_items)

                res.append(
                    order_pb2.SellerOrderItemData(
                        id=str(o.id),
                        order_number=str(o.order_number),
                        user_id=str(o.user_id),
                        status=str(o.status),
                        payment_status=str(o.payment_status),
                        payment_method=str(o.payment_method),
                        shipping_address=str(o.shipping_address or ""),
                        created_at=o.created_at.isoformat() if o.created_at else "",
                        seller_gross_total=round(seller_gross, 2),
                        platform_fee_5pct=round(seller_fee, 2),
                        seller_net_payout=round(seller_payout, 2),
                        items=[_serialize_order_item(it) for it in seller_items],
                    )
                )

            return order_pb2.SellerOrderListResponse(orders=res)
        except Exception as e:
            traceback.print_exc()
            return order_pb2.SellerOrderListResponse(orders=[])
        finally:
            db.close()

    async def UpdateSellerOrderStatus(self, request: order_pb2.UpdateOrderStatusRequest, context):
        db: Session = SessionLocal()
        try:
            order = db.query(Order).filter(Order.id == request.order_id).first()
            if not order:
                return order_pb2.UpdateOrderStatusResponse(success=False, message="Order not found")

            new_status = request.status.upper()
            order.status = new_status
            msg = request.message or f"Order status updated to {new_status} by Seller."

            tracking = OrderTracking(
                order_id=order.id,
                status=new_status,
                message=msg,
            )
            db.add(tracking)
            db.commit()

            return order_pb2.UpdateOrderStatusResponse(
                success=True,
                message=f"Order status updated to {new_status}",
                order_id=str(order.id),
                status=order.status,
            )
        except Exception as e:
            db.rollback()
            return order_pb2.UpdateOrderStatusResponse(success=False, message=str(e))
        finally:
            db.close()

    async def GetAdminProfits(self, request: order_pb2.EmptyOrderRequest, context):
        db: Session = SessionLocal()
        try:
            all_order_items = db.query(OrderItem).order_by(OrderItem.id.desc()).all()
            all_orders = db.query(Order).order_by(Order.created_at.desc()).all()

            total_gmv = sum(float(it.total_price) for it in all_order_items)
            total_platform_profit_5pct = sum(float(it.platform_fee or 0.0) for it in all_order_items)
            total_seller_payouts_95pct = sum(float(it.seller_payout or 0.0) for it in all_order_items)
            seller_ids = list(set(it.seller_id for it in all_order_items if it.seller_id))
            order_map = {o.id: o for o in all_orders}

            sales_breakdown = []
            for it in all_order_items:
                parent = order_map.get(it.order_id)
                gross = float(it.total_price)
                fee = float(it.platform_fee or (gross * 0.05))
                payout = float(it.seller_payout or (gross - fee))

                sales_breakdown.append(
                    order_pb2.SaleBreakdownItem(
                        item_id=str(it.id),
                        order_id=str(it.order_id),
                        order_number=parent.order_number if parent else "N/A",
                        customer_user_id=parent.user_id if parent else "N/A",
                        item_name=str(it.product_name),
                        seller_id=str(it.seller_id or "seller_default"),
                        shop_name=str(it.shop_name or "ShopMate Direct"),
                        quantity=int(it.quantity),
                        unit_price=float(it.unit_price),
                        gross_sale_amount=round(gross, 2),
                        platform_profit_5pct=round(fee, 2),
                        seller_payout_95pct=round(payout, 2),
                        order_status=parent.status if parent else "PENDING",
                        payment_status=parent.payment_status if parent else "UNPAID",
                        created_at=parent.created_at.isoformat() if parent and parent.created_at else "",
                    )
                )

            summary = order_pb2.ProfitSummary(
                total_gmv=round(total_gmv, 2),
                total_platform_profit_5pct=round(total_platform_profit_5pct, 2),
                total_seller_payouts_95pct=round(total_seller_payouts_95pct, 2),
                total_orders=len(all_orders),
                total_items_sold=len(all_order_items),
                total_active_sellers=len(seller_ids),
                platform_commission_rate="5%",
            )

            return order_pb2.AdminProfitsResponse(
                summary=summary,
                sales_breakdown=sales_breakdown,
            )
        except Exception as e:
            traceback.print_exc()
            return order_pb2.AdminProfitsResponse()
        finally:
            db.close()

    async def GetAdminSellersSummary(self, request: order_pb2.EmptyOrderRequest, context):
        db: Session = SessionLocal()
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

            sellers = [
                order_pb2.AdminSellerSummaryItem(
                    seller_id=v["seller_id"],
                    shop_name=v["shop_name"],
                    gross_sales=round(v["gross_sales"], 2),
                    platform_profit_5pct=round(v["platform_profit_5pct"], 2),
                    seller_payout_95pct=round(v["seller_payout_95pct"], 2),
                    units_sold=v["units_sold"],
                    total_orders=len(v["order_ids"]),
                )
                for v in seller_data.values()
            ]

            return order_pb2.AdminSellersSummaryResponse(sellers=sellers)
        except Exception as e:
            traceback.print_exc()
            return order_pb2.AdminSellersSummaryResponse(sellers=[])
        finally:
            db.close()
