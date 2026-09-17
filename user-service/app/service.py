import os
from datetime import datetime, timedelta
from typing import Optional, List

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.model.user import User, Address
from app.schema.register_user import RegisterRequest, AddressCreate, UserUpdateRequest

security = HTTPBearer()


def get_user_by_email(
    db: Session,
    email: str
) -> User | None:
    """Retrieve a user by email from the database."""
    return db.query(User).filter(User.email == email).first()


def get_user_by_unique_id(
    db: Session,
    unique_id: str
) -> User | None:
    """Retrieve a user by unique_id from the database."""
    return db.query(User).filter(User.unique_id == unique_id).first()


def get_or_create_user(
    db: Session, 
    user: RegisterRequest
) -> User:
    """Create a new user in the database or retrieve existing."""
    if existing_user := get_user_by_email(db, user.email):
        return existing_user
    
    # Auto-generate name from email prefix if not provided
    display_name = user.name.strip() if user.name and user.name.strip() else user.email.split("@")[0].capitalize()

    new_user = User(
        name=display_name,
        email=user.email,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def get_user_role(
    db: Session,
    user_id: str
) -> Optional[str]:
    """Retrieve the role of a user by their unique ID."""
    user = db.query(User).filter(User.unique_id == user_id).first()
    return user.role if user else None


async def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


async def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generate a signed JWT refresh token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=30))
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def get_current_user(role: list = None):
    """FastAPI dependency to extract and validate authenticated user from JWT bearer."""
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
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication token",
                )

            if role is not None and (_role is None or _role.lower() not in [r.lower() for r in role]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied for this role",
                )

            return {
                "user_id": user_id,
                "role": _role,
            }
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

    return _get_current_user


def add_user_address(db: Session, user_id: str, data: AddressCreate) -> Address:
    """Add a new delivery address for user."""
    # If set as default, reset existing defaults
    if data.is_default:
        db.query(Address).filter(Address.user_id == user_id).update({"is_default": False})

    line1 = data.address_line1 or data.street or "Address Line 1"
    recipient = data.recipient_name or "Primary Recipient"
    phone_val = data.phone or "9999999999"

    address = Address(
        user_id=user_id,
        recipient_name=recipient,
        phone=phone_val,
        address_line1=line1,
        address_line2=data.address_line2,
        city=data.city,
        state=data.state,
        pincode=data.pincode,
        is_default=data.is_default,
    )
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


def get_user_addresses(db: Session, user_id: str) -> List[Address]:
    """Get all saved delivery addresses for a user."""
    return db.query(Address).filter(Address.user_id == user_id).order_by(Address.is_default.desc(), Address.created_at.desc()).all()


def delete_user_address(db: Session, user_id: str, address_id: str) -> bool:
    """Delete a user delivery address."""
    addr = db.query(Address).filter(Address.id == address_id, Address.user_id == user_id).first()
    if not addr:
        return False
    db.delete(addr)
    db.commit()
    return True

