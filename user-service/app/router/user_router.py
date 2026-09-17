import asyncio
import random
import traceback
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.exception import error_response
from app.model.user import User, UserRole, SellerShop
from app.schema.register_user import (
    RegisterRequest,
    VerifyOTPRequest,
    AddressCreate,
    AddressResponse,
    UserUpdateRequest,
    UserProfileResponse,
    SellerRegisterRequest,
    SellerUpdateRequest,
    SellerResponse,
)
from app.service import (
    create_access_token,
    create_refresh_token,
    get_or_create_user,
    get_user_by_unique_id,
    get_user_role,
    get_current_user,
    add_user_address,
    get_user_addresses,
    delete_user_address,
)
from app.utils.email_service import send_otp_email
from app.core.rate_limiter import rate_limit, redis_client

router = APIRouter(tags=["User Service"])


@router.post("/auth", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60, key_prefix="rl:auth"))])
@router.post("/user/auth", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60, key_prefix="rl:auth"))])
@router.post("/api/user/auth", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60, key_prefix="rl:auth"))])
@router.post("/api/v1/user/auth", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60, key_prefix="rl:auth"))])
@router.post("/register", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60, key_prefix="rl:auth"))])
@router.post("/user/register", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60, key_prefix="rl:auth"))])
@router.post("/api/user/register", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60, key_prefix="rl:auth"))])
@router.post("/api/v1/user/register", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60, key_prefix="rl:auth"))])
@router.post("/login", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60, key_prefix="rl:auth"))])
@router.post("/user/login", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60, key_prefix="rl:auth"))])
@router.post("/api/user/login", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60, key_prefix="rl:auth"))])
@router.post("/api/v1/user/login", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=60, key_prefix="rl:auth"))])
async def register_or_login_user(
    data: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Register or Login with Email.
    Generates OTP in Redis and dispatches verification email in background task.
    """
    try:
        user = get_or_create_user(db, data)
        if not user:
            return JSONResponse(
                status_code=400,
                content={"message": "User authentication failed. Please try again."}
            )

        user_unique_id = str(user.unique_id)
        otp = random.randint(100000, 999999)

        # Store OTP for 5 minutes (300 seconds)
        redis_client.set(f"otp:{user_unique_id}", otp, ex=300)

        # Enqueue background task to send OTP email
        background_tasks.add_task(send_otp_email, user.email, otp)

        return JSONResponse(
            status_code=200,
            content={
                "message": "Verification OTP sent to your email.",
                "user_unique_id": user_unique_id,
                "email": user.email,
            }
        )
    except Exception as e:
        traceback.print_exc()
        print(f"\nError during user registration/login: {e}")
        return error_response()


@router.post("/verify", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=300, key_prefix="rl:verify"))])
@router.post("/user/verify", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=300, key_prefix="rl:verify"))])
@router.post("/api/user/verify", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=300, key_prefix="rl:verify"))])
@router.post("/api/v1/user/verify", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=300, key_prefix="rl:verify"))])
@router.post("/verify-otp", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=300, key_prefix="rl:verify"))])
@router.post("/user/verify-otp", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=300, key_prefix="rl:verify"))])
@router.post("/api/user/verify-otp", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=300, key_prefix="rl:verify"))])
@router.post("/api/v1/user/verify-otp", dependencies=[Depends(rate_limit(max_requests=20, window_seconds=300, key_prefix="rl:verify"))])
async def verify_otp(
    data: VerifyOTPRequest,
    db: Session = Depends(get_db),
):
    """
    Verify the 6-digit OTP and issue JWT access and refresh tokens.
    """
    try:
        stored_otp = redis_client.get(f"otp:{data.user_id}")
        if stored_otp is None:
            return JSONResponse(
                status_code=400,
                content={"message": "OTP expired or not found. Please request a new code."}
            )
        
        if int(stored_otp) == data.otp:
            # Delete OTP upon successful verification
            redis_client.delete(f"otp:{data.user_id}")
            
            user_role = get_user_role(db, data.user_id) or "enduser"
            token_payload = {
                "user_id": data.user_id,
                "role": user_role,
            }

            access_token, refresh_token = await asyncio.gather(
                create_access_token(data=token_payload),
                create_refresh_token(data=token_payload),
            )

            user = get_user_by_unique_id(db, data.user_id)

            return JSONResponse(
                status_code=200,
                content={
                    "message": "Authentication successful.",
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "user": {
                        "unique_id": data.user_id,
                        "name": user.name if user else "",
                        "email": user.email if user else "",
                        "role": user_role,
                    }
                }
            )

        return JSONResponse(
            status_code=400,
            content={"message": "Invalid OTP code. Please check and retry."}
        )
    except Exception as e:
        traceback.print_exc()
        print(f"\nError during OTP verification: {e}")
        return error_response()


@router.get("/me")
@router.get("/user/me")
@router.get("/api/user/me")
@router.get("/api/v1/user/me")
async def get_user_profile(
    current_user: dict = Depends(get_current_user()),
    db: Session = Depends(get_db),
):
    """
    Get authenticated user profile and default delivery pincode.
    """
    try:
        user_id = current_user.get("user_id")
        user = get_user_by_unique_id(db, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        addresses = get_user_addresses(db, user_id)
        default_pincode = None
        for addr in addresses:
            if addr.is_default:
                default_pincode = addr.pincode
                break
        if not default_pincode and addresses:
            default_pincode = addresses[0].pincode

        return JSONResponse(
            status_code=200,
            content={
                "unique_id": user.unique_id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role,
                "avatar_url": user.avatar_url,
                "default_pincode": default_pincode or "380001",
                "addresses": [
                    {
                        "id": addr.id,
                        "recipient_name": addr.recipient_name,
                        "phone": addr.phone,
                        "address_line1": addr.address_line1,
                        "address_line2": addr.address_line2,
                        "city": addr.city,
                        "state": addr.state,
                        "pincode": addr.pincode,
                        "is_default": addr.is_default,
                    }
                    for addr in addresses
                ]
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        return error_response()


@router.put("/me")
@router.put("/user/me")
@router.put("/api/user/me")
@router.put("/api/v1/user/me")
async def update_user_profile(
    data: UserUpdateRequest,
    current_user: dict = Depends(get_current_user()),
    db: Session = Depends(get_db),
):
    """Update profile details (name, phone, avatar)."""
    try:
        user_id = current_user.get("user_id")
        user = get_user_by_unique_id(db, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        if data.name:
            user.name = data.name
        if data.phone:
            user.phone = data.phone
        if data.avatar_url:
            user.avatar_url = data.avatar_url

        db.commit()
        db.refresh(user)

        return JSONResponse(
            status_code=200,
            content={"message": "Profile updated successfully"}
        )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        return error_response()


@router.get("/addresses")
@router.get("/user/addresses")
@router.get("/api/user/addresses")
@router.get("/api/v1/user/addresses")
async def list_addresses(
    current_user: dict = Depends(get_current_user()),
    db: Session = Depends(get_db),
):
    """List all saved shipping addresses for authenticated user."""
    try:
        user_id = current_user.get("user_id")
        addresses = get_user_addresses(db, user_id)
        return JSONResponse(
            status_code=200,
            content=[
                {
                    "id": addr.id,
                    "recipient_name": addr.recipient_name,
                    "phone": addr.phone,
                    "address_line1": addr.address_line1,
                    "address_line2": addr.address_line2,
                    "city": addr.city,
                    "state": addr.state,
                    "pincode": addr.pincode,
                    "is_default": addr.is_default,
                }
                for addr in addresses
            ]
        )
    except Exception as e:
        traceback.print_exc()
        return error_response()


@router.post("/addresses")
@router.post("/user/addresses")
@router.post("/api/user/addresses")
@router.post("/api/v1/user/addresses")
async def create_address(
    data: AddressCreate,
    current_user: dict = Depends(get_current_user()),
    db: Session = Depends(get_db),
):
    """Save a new delivery address."""
    try:
        user_id = current_user.get("user_id")
        addr = add_user_address(db, user_id, data)
        return JSONResponse(
            status_code=201,
            content={
                "message": "Address saved successfully",
                "address": {
                    "id": addr.id,
                    "recipient_name": addr.recipient_name,
                    "phone": addr.phone,
                    "address_line1": addr.address_line1,
                    "address_line2": addr.address_line2,
                    "city": addr.city,
                    "state": addr.state,
                    "pincode": addr.pincode,
                    "is_default": addr.is_default,
                }
            }
        )
    except Exception as e:
        traceback.print_exc()
        return error_response()


@router.delete("/addresses/{address_id}")
@router.delete("/user/addresses/{address_id}")
@router.delete("/api/user/addresses/{address_id}")
@router.delete("/api/v1/user/addresses/{address_id}")
async def remove_address(
    address_id: str,
    current_user: dict = Depends(get_current_user()),
    db: Session = Depends(get_db),
):
    """Delete a saved delivery address."""
    try:
        user_id = current_user.get("user_id")
        success = delete_user_address(db, user_id, address_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
        return JSONResponse(status_code=200, content={"message": "Address deleted successfully"})
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        return error_response()


# =========================================================================
# SELLER & ADMIN MULTI-VENDOR MANAGEMENT ENDPOINTS
# =========================================================================

@router.post("/seller/register")
@router.post("/user/seller/register")
@router.post("/api/user/seller/register")
@router.post("/api/v1/user/seller/register")
async def register_seller(
    data: SellerRegisterRequest,
    db: Session = Depends(get_db),
):
    """Register a new Seller Shop."""
    try:
        # 1. Find or create user with SELLER role
        user = db.query(User).filter(User.email == data.email).first()
        if not user:
            user = User(
                name=data.owner_name,
                email=data.email,
                phone=data.phone,
                role=UserRole.SELLER,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.role = UserRole.SELLER
            user.phone = data.phone or user.phone
            db.commit()

        user_unique_id = str(user.unique_id)

        # 2. Check if shop already registered for this user
        existing_shop = db.query(SellerShop).filter(SellerShop.user_id == user_unique_id).first()
        if existing_shop:
            # Generate Token
            token = await create_access_token(data={"sub": user_unique_id, "role": user.role.value if hasattr(user.role, 'value') else str(user.role)})
            return JSONResponse(
                status_code=200,
                content={
                    "message": "Seller shop already registered",
                    "token": token,
                    "seller": {
                        "id": existing_shop.id,
                        "shop_name": existing_shop.shop_name,
                        "owner_name": existing_shop.owner_name,
                        "email": existing_shop.email,
                        "phone": existing_shop.phone,
                        "category": existing_shop.category,
                        "is_verified": existing_shop.is_verified,
                        "commission_percentage": existing_shop.commission_percentage,
                    }
                }
            )

        # 3. Create Slug
        import re
        slug_base = re.sub(r'[^a-zA-Z0-9]', '-', data.shop_name.lower()).strip('-')
        shop_slug = f"{slug_base}-{user_unique_id[:6]}"

        shop = SellerShop(
            user_id=user_unique_id,
            shop_name=data.shop_name,
            shop_slug=shop_slug,
            owner_name=data.owner_name,
            email=data.email,
            phone=data.phone,
            category=data.category or "Snacks & Groceries",
            description=data.description or "",
            logo_url=data.logo_url or "",
            address_line=data.address or data.address_line or "",
            city=data.city or "Ahmedabad",
            state=data.state or "Gujarat",
            pincode=data.pincode or "380001",
            gst_number=data.gstin or data.gst_number or "",
            pan_number=data.pan or data.pan_number or "",
            bank_account_number=data.bank_account_number or "",
            ifsc_code=data.ifsc_code or "",
            commission_percentage="5.0",
            is_verified=True,
            is_active=True,
        )
        db.add(shop)
        db.commit()
        db.refresh(shop)

        token = await create_access_token(data={"sub": user_unique_id, "role": "seller"})

        return JSONResponse(
            status_code=201,
            content={
                "message": "Seller shop registered successfully!",
                "token": token,
                "seller": {
                    "id": shop.id,
                    "shop_name": shop.shop_name,
                    "shop_slug": shop.shop_slug,
                    "owner_name": shop.owner_name,
                    "email": shop.email,
                    "phone": shop.phone,
                    "category": shop.category,
                    "is_verified": shop.is_verified,
                    "commission_percentage": shop.commission_percentage,
                }
            }
        )
    except Exception as e:
        traceback.print_exc()
        return error_response()


@router.post("/seller/auth")
@router.post("/user/seller/auth")
@router.post("/api/user/seller/auth")
@router.post("/api/v1/user/seller/auth")
@router.post("/seller/login")
@router.post("/user/seller/login")
@router.post("/api/user/seller/login")
@router.post("/api/v1/user/seller/login")
async def seller_auth_otp(
    data: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Send 6-digit OTP to Seller's registered email."""
    try:
        user = db.query(User).filter(User.email == data.email).first()
        if not user:
            return JSONResponse(
                status_code=404,
                content={"message": "No seller account found with this email. Please register your shop first."}
            )

        shop = db.query(SellerShop).filter(SellerShop.user_id == str(user.unique_id)).first()
        if not shop:
            return JSONResponse(
                status_code=404,
                content={"message": "No registered shop profile found for this email. Please complete shop registration."}
            )

        user_unique_id = str(user.unique_id)
        otp = random.randint(100000, 999999)
        redis_client.set(f"otp:{user_unique_id}", otp, ex=300)
        background_tasks.add_task(send_otp_email, user.email, otp)

        return JSONResponse(
            status_code=200,
            content={
                "message": f"Verification code sent to {user.email}",
                "user_id": user_unique_id,
                "email": user.email,
                "shop_name": shop.shop_name,
            }
        )
    except Exception as e:
        traceback.print_exc()
        return error_response()


@router.post("/seller/verify")
@router.post("/user/seller/verify")
@router.post("/api/user/seller/verify")
@router.post("/api/v1/user/seller/verify")
async def seller_verify_otp(
    data: VerifyOTPRequest,
    db: Session = Depends(get_db),
):
    """Verify Seller 6-digit OTP and issue JWT access token."""
    try:
        stored_otp = redis_client.get(f"otp:{data.user_id}")
        if stored_otp is None:
            return JSONResponse(
                status_code=400,
                content={"message": "OTP expired or not found. Please request a new code."}
            )

        if int(stored_otp) == data.otp:
            redis_client.delete(f"otp:{data.user_id}")
            shop = db.query(SellerShop).filter(SellerShop.user_id == data.user_id).first()
            if not shop:
                return JSONResponse(status_code=404, content={"message": "Seller shop not found"})

            token = await create_access_token(data={"sub": data.user_id, "user_id": data.user_id, "role": "seller"})
            return JSONResponse(
                status_code=200,
                content={
                    "message": "Seller authenticated successfully",
                    "token": token,
                    "access_token": token,
                    "seller": {
                        "id": shop.id,
                        "shop_name": shop.shop_name,
                        "owner_name": shop.owner_name,
                        "email": shop.email,
                        "phone": shop.phone,
                        "category": shop.category,
                        "is_verified": shop.is_verified,
                        "commission_percentage": shop.commission_percentage,
                    }
                }
            )

        return JSONResponse(status_code=400, content={"message": "Invalid verification code. Please check and retry."})
    except Exception as e:
        traceback.print_exc()
        return error_response()


# --- ADMIN EMAIL + OTP AUTHENTICATION ---

ADMIN_EMAILS = {"admin@shopmate.com", "admin@shopmate.internal", "owner@shopmate.com"}

@router.post("/admin/auth")
@router.post("/user/admin/auth")
@router.post("/api/user/admin/auth")
@router.post("/api/v1/user/admin/auth")
@router.post("/admin/login")
@router.post("/user/admin/login")
async def admin_auth_otp(
    data: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Send 6-digit OTP to Platform Admin / Owner."""
    try:
        req_email = data.email.strip().lower()
        user = db.query(User).filter(User.email == req_email).first()

        # Authorize only platform owner / admin emails
        if req_email not in ADMIN_EMAILS and (not user or user.role != UserRole.ADMIN):
            return JSONResponse(
                status_code=403,
                content={"message": "Access Denied: This email is not registered as a Platform Administrator."}
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
        background_tasks.add_task(send_otp_email, user.email, otp)

        return JSONResponse(
            status_code=200,
            content={
                "message": f"Admin passkey code sent to {user.email}",
                "user_id": user_unique_id,
                "email": user.email,
                "role": "admin",
            }
        )
    except Exception as e:
        traceback.print_exc()
        return error_response()


@router.post("/admin/verify")
@router.post("/user/admin/verify")
@router.post("/api/user/admin/verify")
@router.post("/api/v1/user/admin/verify")
async def admin_verify_otp(
    data: VerifyOTPRequest,
    db: Session = Depends(get_db),
):
    """Verify Admin 6-digit OTP and issue Super Admin Token."""
    try:
        stored_otp = redis_client.get(f"otp:{data.user_id}")
        if stored_otp is None:
            return JSONResponse(
                status_code=400,
                content={"message": "OTP expired or not found. Please request a new code."}
            )

        if int(stored_otp) == data.otp:
            redis_client.delete(f"otp:{data.user_id}")
            user = get_user_by_unique_id(db, data.user_id)
            token = await create_access_token(data={"sub": data.user_id, "user_id": data.user_id, "role": "admin"})

            return JSONResponse(
                status_code=200,
                content={
                    "message": "Admin authenticated successfully",
                    "token": token,
                    "access_token": token,
                    "admin": {
                        "role": "Platform Super Admin",
                        "email": user.email if user else "admin@shopmate.com",
                        "permissions": ["ALL_ACCESS", "FINANCIAL_LEDGER", "MERCHANT_AUDIT"],
                    }
                }
            )

        return JSONResponse(status_code=400, content={"message": "Invalid verification code. Please check and retry."})
    except Exception as e:
        traceback.print_exc()
        return error_response()



@router.get("/seller/me")
@router.get("/user/seller/me")
@router.get("/api/user/seller/me")
@router.get("/api/v1/user/seller/me")
async def get_seller_profile(
    current_user: dict = Depends(get_current_user()),
    db: Session = Depends(get_db),
):
    """Get profile of current logged-in seller."""
    try:
        user_id = current_user.get("user_id")
        shop = db.query(SellerShop).filter(SellerShop.user_id == user_id).first()
        if not shop:
            raise HTTPException(status_code=404, detail="Seller shop not found")

        return JSONResponse(
            status_code=200,
            content={
                "id": shop.id,
                "user_id": shop.user_id,
                "shop_name": shop.shop_name,
                "shop_slug": shop.shop_slug,
                "owner_name": shop.owner_name,
                "email": shop.email,
                "phone": shop.phone,
                "category": shop.category,
                "description": shop.description,
                "logo_url": shop.logo_url,
                "banner_url": shop.banner_url,
                "address_line": shop.address_line,
                "city": shop.city,
                "state": shop.state,
                "pincode": shop.pincode,
                "gst_number": shop.gst_number,
                "pan_number": shop.pan_number,
                "bank_account_number": shop.bank_account_number,
                "ifsc_code": shop.ifsc_code,
                "commission_percentage": shop.commission_percentage,
                "is_verified": shop.is_verified,
                "is_active": shop.is_active,
                "created_at": shop.created_at.isoformat() if shop.created_at else None,
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        return error_response()


@router.get("/admin/sellers")
@router.get("/user/admin/sellers")
@router.get("/api/user/admin/sellers")
@router.get("/api/v1/user/admin/sellers")
async def get_all_sellers_for_admin(
    db: Session = Depends(get_db),
):
    """List all registered seller shops for platform admin."""
    try:
        shops = db.query(SellerShop).order_by(SellerShop.created_at.desc()).all()
        return JSONResponse(
            status_code=200,
            content=[
                {
                    "id": s.id,
                    "user_id": s.user_id,
                    "shop_name": s.shop_name,
                    "owner_name": s.owner_name,
                    "email": s.email,
                    "phone": s.phone,
                    "category": s.category,
                    "city": s.city,
                    "gst_number": s.gst_number,
                    "commission_percentage": s.commission_percentage,
                    "is_verified": s.is_verified,
                    "is_active": s.is_active,
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                }
                for s in shops
            ]
        )
    except Exception as e:
        traceback.print_exc()
        return error_response()


@router.put("/admin/sellers/{seller_id}/toggle-status")
@router.put("/user/admin/sellers/{seller_id}/toggle-status")
@router.put("/api/user/admin/sellers/{seller_id}/toggle-status")
@router.put("/api/v1/user/admin/sellers/{seller_id}/toggle-status")
async def toggle_seller_status(
    seller_id: str,
    db: Session = Depends(get_db),
):
    """Admin toggles active status of a seller shop."""
    try:
        shop = db.query(SellerShop).filter(SellerShop.id == seller_id).first()
        if not shop:
            raise HTTPException(status_code=404, detail="Seller shop not found")
        shop.is_active = not shop.is_active
        db.commit()
        return JSONResponse(
            status_code=200,
            content={
                "message": f"Seller shop {'activated' if shop.is_active else 'suspended'} successfully",
                "is_active": shop.is_active
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        return error_response()

