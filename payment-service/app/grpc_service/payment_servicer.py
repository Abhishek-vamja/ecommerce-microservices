import json
import traceback
import logging
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.config import settings
from app.schema.payment import CreatePaymentOrderRequest, VerifyPaymentRequest
from app.service import create_payment_record, verify_and_capture_payment, handle_razorpay_webhook
from app.grpc_gen import payment_pb2, payment_pb2_grpc

logger = logging.getLogger(__name__)


class PaymentGrpcService(payment_pb2_grpc.PaymentGrpcServiceServicer):

    async def CreatePaymentOrder(self, request: payment_pb2.CreatePaymentOrderGrpcRequest, context):
        db: Session = SessionLocal()
        try:
            schema_data = CreatePaymentOrderRequest(
                order_id=request.order_id,
                amount=request.amount,
                currency=request.currency or "INR",
            )
            tx = await create_payment_record(db, request.user_id, schema_data)
            return payment_pb2.CreatePaymentOrderGrpcResponse(
                success=True,
                order_id=str(tx.order_id),
                razorpay_order_id=str(tx.razorpay_order_id or ""),
                amount=float(tx.amount),
                currency=str(tx.currency or "INR"),
                key_id=str(settings.RAZORPAY_KEY_ID),
            )
        except Exception as e:
            traceback.print_exc()
            return payment_pb2.CreatePaymentOrderGrpcResponse(
                success=False,
                order_id=request.order_id,
                error_message=str(e),
            )
        finally:
            db.close()

    async def VerifyPayment(self, request: payment_pb2.VerifyPaymentGrpcRequest, context):
        db: Session = SessionLocal()
        try:
            schema_data = VerifyPaymentRequest(
                razorpay_order_id=request.razorpay_order_id,
                razorpay_payment_id=request.razorpay_payment_id,
                razorpay_signature=request.razorpay_signature,
            )
            tx = await verify_and_capture_payment(db, schema_data)
            return payment_pb2.VerifyPaymentGrpcResponse(
                success=True,
                message="Payment verified and captured successfully",
                status=str(tx.status),
                order_id=str(tx.order_id),
                payment_id=str(tx.razorpay_payment_id or ""),
            )
        except Exception as e:
            traceback.print_exc()
            return payment_pb2.VerifyPaymentGrpcResponse(
                success=False,
                error_message=str(e),
            )
        finally:
            db.close()

    async def HandleWebhook(self, request: payment_pb2.HandleWebhookGrpcRequest, context):
        db: Session = SessionLocal()
        try:
            raw_bytes = request.payload_json.encode('utf-8')
            body = json.loads(request.payload_json)
            result = await handle_razorpay_webhook(db, body, raw_bytes, request.signature if request.signature else None)
            return payment_pb2.HandleWebhookGrpcResponse(
                success=True,
                status="received",
                result=json.dumps(result),
            )
        except Exception as e:
            traceback.print_exc()
            return payment_pb2.HandleWebhookGrpcResponse(
                success=False,
                status="error_logged",
                error_message=str(e),
            )
        finally:
            db.close()
