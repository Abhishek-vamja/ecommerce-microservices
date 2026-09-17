import asyncio
import random
import re
import traceback
import logging
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.model.user import User, Address, UserRole, SellerShop
from app.schema.register_user import RegisterRequest as RegisterReqSchema, AddressCreate
from app.service import (
    get_or_create_user,
    get_user_by_unique_id,
    get_user_role,
    add_user_address,
    get_user_addresses,
    delete_user_address,
    create_access_token,
    create_refresh_token,
)
from app.utils.email_service import send_otp_email
from app.core.rate_limiter import redis_client
from app.grpc_gen import user_pb2, user_pb2_grpc

logger = logging.getLogger(__name__)

ADMIN_EMAILS = {"admin@shopmate.com", "admin@shopmate.internal", "owner@shopmate.com"}


def _serialize_seller(shop: SellerShop) -> user_pb2.SellerItem:
    return user_pb2.SellerItem(
        id=str(shop.id or ""),
        user_id=str(shop.user_id or ""),
        shop_name=str(shop.shop_name or ""),
        shop_slug=str(shop.shop_slug or ""),
        owner_name=str(shop.owner_name or ""),
        email=str(shop.email or ""),
        phone=str(shop.phone or ""),
        category=str(shop.category or ""),
        description=str(shop.description or ""),
        logo_url=str(shop.logo_url or ""),
        banner_url=str(shop.banner_url or ""),
        address_line=str(shop.address_line or ""),
        city=str(shop.city or ""),
        state=str(shop.state or ""),
        pincode=str(shop.pincode or ""),
        gst_number=str(shop.gst_number or ""),
        pan_number=str(shop.pan_number or ""),
        bank_account_number=str(shop.bank_account_number or ""),
        ifsc_code=str(shop.ifsc_code or ""),
        commission_percentage=str(shop.commission_percentage or "5.0"),
        is_verified=bool(shop.is_verified),
        is_active=bool(shop.is_active),
        created_at=shop.created_at.isoformat() if shop.created_at else "",
    )


def _serialize_address(addr: Address) -> user_pb2.AddressItem:
    return user_pb2.AddressItem(
        id=str(addr.id or ""),
        recipient_name=str(addr.recipient_name or ""),
        phone=str(addr.phone or ""),
        address_line1=str(addr.address_line1 or ""),
        address_line2=str(addr.address_line2 or ""),
        city=str(addr.city or ""),
        state=str(addr.state or ""),
        pincode=str(addr.pincode or ""),
        is_default=bool(addr.is_default),
    )


class UserGrpcService(user_pb2_grpc.UserGrpcServiceServicer):

    async def RegisterOrLogin(self, request: user_pb2.RegisterRequest, context):
        db: Session = SessionLocal()
        try:
            schema_req = RegisterReqSchema(email=request.email, role=request.role or "enduser")
            user = get_or_create_user(db, schema_req)
            if not user:
                return user_pb2.RegisterResponse(
                    success=False,
                    message="User authentication failed. Please try again."
                )

            user_unique_id = str(user.unique_id)
            otp = random.randint(100000, 999999)
            redis_client.set(f"otp:{user_unique_id}", otp, ex=300)

            # Send OTP email non-blocking in background
            asyncio.create_task(asyncio.to_thread(send_otp_email, user.email, otp))

            return user_pb2.RegisterResponse(
                success=True,
                message="Verification OTP sent to your email.",
                user_unique_id=user_unique_id,
                email=user.email,
            )
        except Exception as e:
            traceback.print_exc()
            logger.error(f"[gRPC RegisterOrLogin Error]: {e}")
            return user_pb2.RegisterResponse(
                success=False,
                message=f"Registration error: {str(e)}"
            )
        finally:
            db.close()

    async def VerifyOTP(self, request: user_pb2.VerifyOTPRequest, context):
        db: Session = SessionLocal()
        try:
            stored_otp = redis_client.get(f"otp:{request.user_id}")
            if stored_otp is None:
                return user_pb2.VerifyOTPResponse(
                    success=False,
                    message="OTP expired or not found. Please request a new code."
                )

            if int(stored_otp) == request.otp:
                redis_client.delete(f"otp:{request.user_id}")
                user_role = get_user_role(db, request.user_id) or "enduser"
                token_payload = {"user_id": request.user_id, "role": user_role}

                access_token, refresh_token = await asyncio.gather(
                    create_access_token(data=token_payload),
                    create_refresh_token(data=token_payload),
                )

                user = get_user_by_unique_id(db, request.user_id)
                user_item = user_pb2.UserItem(
                    unique_id=request.user_id,
                    name=user.name if user else "",
                    email=user.email if user else "",
                    role=user_role,
                )

                return user_pb2.VerifyOTPResponse(
                    success=True,
                    message="Authentication successful.",
                    access_token=access_token,
                    refresh_token=refresh_token,
                    user=user_item,
                )

            return user_pb2.VerifyOTPResponse(
                success=False,
                message="Invalid OTP code. Please check and retry."
            )
        except Exception as e:
            traceback.print_exc()
            logger.error(f"[gRPC VerifyOTP Error]: {e}")
            return user_pb2.VerifyOTPResponse(
                success=False,
                message=f"OTP verification error: {str(e)}"
            )
        finally:
            db.close()

    async def GetUserProfile(self, request: user_pb2.UserProfileRequest, context):
        db: Session = SessionLocal()
        try:
            user = get_user_by_unique_id(db, request.user_id)
            if not user:
                return user_pb2.UserProfileResponse(exists=False, error_message="User not found")

            addresses = get_user_addresses(db, request.user_id)
            default_pincode = "380001"
            for addr in addresses:
                if addr.is_default:
                    default_pincode = addr.pincode
                    break
            if not default_pincode and addresses:
                default_pincode = addresses[0].pincode

            return user_pb2.UserProfileResponse(
                exists=True,
                unique_id=str(user.unique_id),
                name=user.name or "",
                email=user.email or "",
                phone=user.phone or "",
                role=user.role if isinstance(user.role, str) else user.role.value if hasattr(user.role, 'value') else str(user.role),
                avatar_url=user.avatar_url or "",
                default_pincode=default_pincode or "380001",
                addresses=[_serialize_address(a) for a in addresses],
            )
        except Exception as e:
            traceback.print_exc()
            return user_pb2.UserProfileResponse(exists=False, error_message=str(e))
        finally:
            db.close()

    async def UpdateUserProfile(self, request: user_pb2.UserUpdateRequest, context):
        db: Session = SessionLocal()
        try:
            user = get_user_by_unique_id(db, request.user_id)
            if not user:
                return user_pb2.UserUpdateResponse(success=False, message="User not found")

            if request.name:
                user.name = request.name
            if request.phone:
                user.phone = request.phone
            if request.avatar_url:
                user.avatar_url = request.avatar_url

            db.commit()
            return user_pb2.UserUpdateResponse(success=True, message="Profile updated successfully")
        except Exception as e:
            db.rollback()
            return user_pb2.UserUpdateResponse(success=False, message=str(e))
        finally:
            db.close()

    async def GetAddresses(self, request: user_pb2.AddressListRequest, context):
        db: Session = SessionLocal()
        try:
            addresses = get_user_addresses(db, request.user_id)
            return user_pb2.AddressListResponse(
                addresses=[_serialize_address(a) for a in addresses]
            )
        except Exception as e:
            traceback.print_exc()
            return user_pb2.AddressListResponse(addresses=[])
        finally:
            db.close()

    async def AddAddress(self, request: user_pb2.AddAddressRequest, context):
        db: Session = SessionLocal()
        try:
            addr_create = AddressCreate(
                recipient_name=request.recipient_name,
                phone=request.phone,
                address_line1=request.address_line1,
                address_line2=request.address_line2,
                city=request.city,
                state=request.state,
                pincode=request.pincode,
                is_default=request.is_default,
            )
            addr = add_user_address(db, request.user_id, addr_create)
            return user_pb2.AddressItemResponse(
                success=True,
                message="Address saved successfully",
                address=_serialize_address(addr),
            )
        except Exception as e:
            traceback.print_exc()
            return user_pb2.AddressItemResponse(success=False, message=str(e))
        finally:
            db.close()

    async def DeleteAddress(self, request: user_pb2.DeleteAddressRequest, context):
        db: Session = SessionLocal()
        try:
            success = delete_user_address(db, request.user_id, request.address_id)
            return user_pb2.DeleteAddressResponse(
                success=success,
                message="Address deleted successfully" if success else "Address not found",
            )
        except Exception as e:
            traceback.print_exc()
            return user_pb2.DeleteAddressResponse(success=False, message=str(e))
        finally:
            db.close()

    async def RegisterSeller(self, request: user_pb2.SellerRegisterRequest, context):
        db: Session = SessionLocal()
        try:
            user = db.query(User).filter(User.email == request.email).first()
            if not user:
                user = User(
                    name=request.owner_name,
                    email=request.email,
                    phone=request.phone,
                    role=UserRole.SELLER,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            else:
                user.role = UserRole.SELLER
                user.phone = request.phone or user.phone
                db.commit()

            user_unique_id = str(user.unique_id)
            existing_shop = db.query(SellerShop).filter(SellerShop.user_id == user_unique_id).first()
            if existing_shop:
                token = await create_access_token(data={"sub": user_unique_id, "role": "seller"})
                return user_pb2.SellerAuthResponse(
                    success=True,
                    message="Seller shop already registered",
                    token=token,
                    seller=_serialize_seller(existing_shop),
                )

            slug_base = re.sub(r'[^a-zA-Z0-9]', '-', request.shop_name.lower()).strip('-')
            shop_slug = f"{slug_base}-{user_unique_id[:6]}"

            shop = SellerShop(
                user_id=user_unique_id,
                shop_name=request.shop_name,
                shop_slug=shop_slug,
                owner_name=request.owner_name,
                email=request.email,
                phone=request.phone,
                category=request.category or "Snacks & Groceries",
                description=request.description or "",
                logo_url=request.logo_url or "",
                address_line=request.address or "",
                city=request.city or "Ahmedabad",
                state=request.state or "Gujarat",
                pincode=request.pincode or "380001",
                gst_number=request.gstin or "",
                pan_number=request.pan or "",
                bank_account_number=request.bank_account_number or "",
                ifsc_code=request.ifsc_code or "",
                commission_percentage="5.0",
                is_verified=True,
                is_active=True,
            )
            db.add(shop)
            db.commit()
            db.refresh(shop)

            token = await create_access_token(data={"sub": user_unique_id, "role": "seller"})
            return user_pb2.SellerAuthResponse(
                success=True,
                message="Seller shop registered successfully!",
                token=token,
                seller=_serialize_seller(shop),
            )
        except Exception as e:
            traceback.print_exc()
            return user_pb2.SellerAuthResponse(success=False, message=str(e))
        finally:
            db.close()

    async def SellerAuthOTP(self, request: user_pb2.SellerAuthOTPRequest, context):
        db: Session = SessionLocal()
        try:
            user = db.query(User).filter(User.email == request.email).first()
            if not user:
                return user_pb2.SellerAuthOTPResponse(
                    success=False,
                    message="No seller account found with this email. Please register your shop first."
                )

            shop = db.query(SellerShop).filter(SellerShop.user_id == str(user.unique_id)).first()
            if not shop:
                return user_pb2.SellerAuthOTPResponse(
                    success=False,
                    message="No registered shop profile found for this email. Please complete shop registration."
                )

            user_unique_id = str(user.unique_id)
            otp = random.randint(100000, 999999)
            redis_client.set(f"otp:{user_unique_id}", otp, ex=300)
            asyncio.create_task(asyncio.to_thread(send_otp_email, user.email, otp))

            return user_pb2.SellerAuthOTPResponse(
                success=True,
                message=f"Verification code sent to {user.email}",
                user_id=user_unique_id,
                email=user.email,
                shop_name=shop.shop_name,
            )
        except Exception as e:
            traceback.print_exc()
            return user_pb2.SellerAuthOTPResponse(success=False, message=str(e))
        finally:
            db.close()

    async def SellerVerifyOTP(self, request: user_pb2.VerifyOTPRequest, context):
        db: Session = SessionLocal()
        try:
            stored_otp = redis_client.get(f"otp:{request.user_id}")
            if stored_otp is None:
                return user_pb2.SellerAuthResponse(
                    success=False,
                    message="OTP expired or not found. Please request a new code."
                )

            if int(stored_otp) == request.otp:
                redis_client.delete(f"otp:{request.user_id}")
                shop = db.query(SellerShop).filter(SellerShop.user_id == request.user_id).first()
                if not shop:
                    return user_pb2.SellerAuthResponse(success=False, message="Seller shop not found")

                token = await create_access_token(data={"sub": request.user_id, "user_id": request.user_id, "role": "seller"})
                return user_pb2.SellerAuthResponse(
                    success=True,
                    message="Seller authenticated successfully",
                    token=token,
                    seller=_serialize_seller(shop),
                )

            return user_pb2.SellerAuthResponse(success=False, message="Invalid verification code. Please check and retry.")
        except Exception as e:
            traceback.print_exc()
            return user_pb2.SellerAuthResponse(success=False, message=str(e))
        finally:
            db.close()

    async def AdminAuthOTP(self, request: user_pb2.AdminAuthOTPRequest, context):
        db: Session = SessionLocal()
        try:
            req_email = request.email.strip().lower()
            user = db.query(User).filter(User.email == req_email).first()

            if req_email not in ADMIN_EMAILS and (not user or user.role != UserRole.ADMIN):
                return user_pb2.AdminAuthOTPResponse(
                    success=False,
                    message="Access Denied: This email is not registered as a Platform Administrator."
                )

            if not user:
                user = User(
                    name="Platform Super Admin",
                    email=req_email,
                    role=UserRole.ADMIN,
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            user_unique_id = str(user.unique_id)
            otp = random.randint(100000, 999999)
            redis_client.set(f"otp:{user_unique_id}", otp, ex=300)
            asyncio.create_task(asyncio.to_thread(send_otp_email, user.email, otp))

            return user_pb2.AdminAuthOTPResponse(
                success=True,
                message=f"Admin passkey code sent to {user.email}",
                user_id=user_unique_id,
                email=user.email,
                role="admin",
            )
        except Exception as e:
            traceback.print_exc()
            return user_pb2.AdminAuthOTPResponse(success=False, message=str(e))
        finally:
            db.close()

    async def AdminVerifyOTP(self, request: user_pb2.VerifyOTPRequest, context):
        db: Session = SessionLocal()
        try:
            stored_otp = redis_client.get(f"otp:{request.user_id}")
            if stored_otp is None:
                return user_pb2.AdminVerifyResponse(
                    success=False,
                    message="OTP expired or not found. Please request a new code."
                )

            if int(stored_otp) == request.otp:
                redis_client.delete(f"otp:{request.user_id}")
                user = get_user_by_unique_id(db, request.user_id)
                token = await create_access_token(data={"sub": request.user_id, "user_id": request.user_id, "role": "admin"})

                admin_info = user_pb2.AdminInfo(
                    role="Platform Super Admin",
                    email=user.email if user else "admin@shopmate.com",
                    permissions=["ALL_ACCESS", "FINANCIAL_LEDGER", "MERCHANT_AUDIT"],
                )

                return user_pb2.AdminVerifyResponse(
                    success=True,
                    message="Admin authenticated successfully",
                    token=token,
                    admin=admin_info,
                )

            return user_pb2.AdminVerifyResponse(success=False, message="Invalid verification code. Please check and retry.")
        except Exception as e:
            traceback.print_exc()
            return user_pb2.AdminVerifyResponse(success=False, message=str(e))
        finally:
            db.close()

    async def GetSellerProfile(self, request: user_pb2.SellerProfileRequest, context):
        db: Session = SessionLocal()
        try:
            shop = db.query(SellerShop).filter(SellerShop.user_id == request.user_id).first()
            if not shop:
                return user_pb2.SellerProfileResponse(exists=False, error_message="Seller shop not found")

            return user_pb2.SellerProfileResponse(
                exists=True,
                seller=_serialize_seller(shop),
            )
        except Exception as e:
            traceback.print_exc()
            return user_pb2.SellerProfileResponse(exists=False, error_message=str(e))
        finally:
            db.close()

    async def GetAllSellersForAdmin(self, request: user_pb2.EmptyUserRequest, context):
        db: Session = SessionLocal()
        try:
            shops = db.query(SellerShop).order_by(SellerShop.created_at.desc()).all()
            return user_pb2.SellerListResponse(
                sellers=[_serialize_seller(s) for s in shops]
            )
        except Exception as e:
            traceback.print_exc()
            return user_pb2.SellerListResponse(sellers=[])
        finally:
            db.close()

    async def ToggleSellerStatus(self, request: user_pb2.ToggleSellerRequest, context):
        db: Session = SessionLocal()
        try:
            shop = db.query(SellerShop).filter(SellerShop.id == request.seller_id).first()
            if not shop:
                return user_pb2.ToggleSellerResponse(success=False, message="Seller shop not found")

            shop.is_active = not shop.is_active
            db.commit()
            return user_pb2.ToggleSellerResponse(
                success=True,
                message=f"Seller shop {'activated' if shop.is_active else 'suspended'} successfully",
                is_active=shop.is_active,
            )
        except Exception as e:
            db.rollback()
            return user_pb2.ToggleSellerResponse(success=False, message=str(e))
        finally:
            db.close()
