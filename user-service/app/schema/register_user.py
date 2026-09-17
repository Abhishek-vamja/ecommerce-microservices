from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: str = "enduser"


class VerifyOTPRequest(BaseModel):
    user_id: str
    otp: int


class AddressCreate(BaseModel):
    recipient_name: Optional[str] = "Primary Recipient"
    phone: Optional[str] = "9999999999"
    address_line1: Optional[str] = None
    street: Optional[str] = None
    address_line2: Optional[str] = None
    city: str = "Ahmedabad"
    state: str = "Gujarat"
    pincode: str = "380001"
    is_default: bool = False


class AddressResponse(BaseModel):
    id: str
    user_id: str
    recipient_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    pincode: str
    is_default: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class UserProfileResponse(BaseModel):
    unique_id: str
    name: str
    email: str
    phone: Optional[str] = None
    role: str
    avatar_url: Optional[str] = None
    class Config:
        from_attributes = True


class SellerRegisterRequest(BaseModel):
    shop_name: str
    owner_name: str
    email: EmailStr
    phone: str
    password: Optional[str] = None
    category: Optional[str] = "Snacks & Groceries"
    description: Optional[str] = ""
    address_line: Optional[str] = ""
    address: Optional[str] = None
    city: Optional[str] = "Ahmedabad"
    state: Optional[str] = "Gujarat"
    pincode: Optional[str] = "380001"
    gst_number: Optional[str] = ""
    gstin: Optional[str] = None
    pan_number: Optional[str] = ""
    pan: Optional[str] = None
    bank_account_number: Optional[str] = ""
    ifsc_code: Optional[str] = ""
    logo_url: Optional[str] = ""


class SellerUpdateRequest(BaseModel):
    shop_name: Optional[str] = None
    owner_name: Optional[str] = None
    phone: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    address_line: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    bank_account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    logo_url: Optional[str] = None


class SellerResponse(BaseModel):
    id: str
    user_id: str
    shop_name: str
    shop_slug: str
    owner_name: str
    email: str
    phone: str
    category: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    address_line: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    bank_account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    commission_percentage: str = "5.0"
    is_verified: bool = True
    is_active: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True