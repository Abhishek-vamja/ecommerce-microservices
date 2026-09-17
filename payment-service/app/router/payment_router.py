import traceback
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.db.session import get_db
from app.schema.payment import CreatePaymentOrderRequest, VerifyPaymentRequest
from app.service import get_current_user, create_payment_record, verify_and_capture_payment, handle_razorpay_webhook
from app.core.rate_limiter import rate_limit

router = APIRouter(tags=["Payment Service"])


@router.post("/payment/create-order", dependencies=[Depends(rate_limit(max_requests=10, window_seconds=60, key_prefix="rl:pay_create"))])
async def create_razorpay_order(
    data: CreatePaymentOrderRequest,
    current_user: dict = Depends(get_current_user()),
    db: Session = Depends(get_db),
):
    """Generate a Razorpay Order ID for checkout modal."""
    try:
        user_id = current_user.get("user_id")
        tx = await create_payment_record(db, user_id, data)
        return JSONResponse(
            status_code=200,
            content={
                "order_id": tx.order_id,
                "razorpay_order_id": tx.razorpay_order_id,
                "amount": float(tx.amount),
                "currency": tx.currency,
                "key_id": settings.RAZORPAY_KEY_ID,
            }
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/payment/verify", dependencies=[Depends(rate_limit(max_requests=10, window_seconds=60, key_prefix="rl:pay_verify"))])
async def verify_payment(
    data: VerifyPaymentRequest,
    db: Session = Depends(get_db),
):
    """Verify payment signature from Razorpay modal and confirm order."""
    try:
        tx = await verify_and_capture_payment(db, data)
        return JSONResponse(
            status_code=200,
            content={
                "message": "Payment verified and captured successfully",
                "status": tx.status,
                "order_id": tx.order_id,
                "payment_id": tx.razorpay_payment_id,
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/payment/webhook")
async def razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """Razorpay server-to-server webhook callback listener."""
    try:
        raw_body = await request.body()
        body = await request.json()
        sig_header = request.headers.get("X-Razorpay-Signature") or request.headers.get("x-razorpay-signature")
        result = await handle_razorpay_webhook(db, body, raw_body, sig_header)
        return JSONResponse(status_code=200, content={"status": "received", "result": result})
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        return JSONResponse(status_code=200, content={"status": "error_logged", "error": str(e)})
