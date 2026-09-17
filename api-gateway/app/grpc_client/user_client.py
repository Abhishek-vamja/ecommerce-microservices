import os
import logging
from typing import Optional, Dict, Any, List
import grpc
from google.protobuf.json_format import MessageToDict

from app.grpc_gen import user_pb2, user_pb2_grpc

logger = logging.getLogger(__name__)

GRPC_USER_HOST = os.getenv("GRPC_USER_HOST", "localhost:50052")

_channel = None
_stub = None


def get_user_grpc_stub() -> user_pb2_grpc.UserGrpcServiceStub:
    global _channel, _stub
    if _channel is None or _stub is None:
        _channel = grpc.aio.insecure_channel(
            GRPC_USER_HOST,
            options=[
                ("grpc.max_receive_message_length", 16 * 1024 * 1024),
                ("grpc.max_send_message_length", 16 * 1024 * 1024),
                ("grpc.keepalive_time_ms", 30000),
                ("grpc.keepalive_timeout_ms", 10000),
            ]
        )
        _stub = user_pb2_grpc.UserGrpcServiceStub(_channel)
    return _stub


async def close_user_grpc_channel():
    global _channel, _stub
    if _channel:
        await _channel.close()
        _channel = None
        _stub = None


class UserGrpcClient:

    @staticmethod
    async def register_or_login(email: str, role: str = "enduser") -> Dict[str, Any]:
        stub = get_user_grpc_stub()
        req = user_pb2.RegisterRequest(email=email, role=role)
        resp = await stub.RegisterOrLogin(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def verify_otp(user_id: str, otp: int) -> Dict[str, Any]:
        stub = get_user_grpc_stub()
        req = user_pb2.VerifyOTPRequest(user_id=user_id, otp=otp)
        resp = await stub.VerifyOTP(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
        stub = get_user_grpc_stub()
        req = user_pb2.UserProfileRequest(user_id=user_id)
        resp = await stub.GetUserProfile(req, timeout=4.0)
        if not resp.exists:
            return None
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def update_user_profile(user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        stub = get_user_grpc_stub()
        req = user_pb2.UserUpdateRequest(
            user_id=user_id,
            name=payload.get("name", ""),
            phone=payload.get("phone", ""),
            avatar_url=payload.get("avatar_url", ""),
        )
        resp = await stub.UpdateUserProfile(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def get_addresses(user_id: str) -> List[Dict[str, Any]]:
        stub = get_user_grpc_stub()
        req = user_pb2.AddressListRequest(user_id=user_id)
        resp = await stub.GetAddresses(req, timeout=4.0)
        data = MessageToDict(resp, preserving_proto_field_name=True)
        return data.get("addresses", [])

    @staticmethod
    async def add_address(user_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        stub = get_user_grpc_stub()
        req = user_pb2.AddAddressRequest(
            user_id=user_id,
            recipient_name=payload.get("recipient_name", ""),
            phone=payload.get("phone", ""),
            address_line1=payload.get("address_line1") or payload.get("street") or "",
            address_line2=payload.get("address_line2", ""),
            city=payload.get("city", ""),
            state=payload.get("state", ""),
            pincode=payload.get("pincode", ""),
            is_default=bool(payload.get("is_default", False)),
        )
        resp = await stub.AddAddress(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def delete_address(user_id: str, address_id: str) -> Dict[str, Any]:
        stub = get_user_grpc_stub()
        req = user_pb2.DeleteAddressRequest(user_id=user_id, address_id=address_id)
        resp = await stub.DeleteAddress(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def register_seller(payload: Dict[str, Any]) -> Dict[str, Any]:
        stub = get_user_grpc_stub()
        req = user_pb2.SellerRegisterRequest(
            owner_name=payload.get("owner_name", ""),
            email=payload.get("email", ""),
            phone=payload.get("phone", ""),
            shop_name=payload.get("shop_name", ""),
            category=payload.get("category", ""),
            description=payload.get("description", ""),
            logo_url=payload.get("logo_url", ""),
            address=payload.get("address") or payload.get("address_line") or "",
            city=payload.get("city", ""),
            state=payload.get("state", ""),
            pincode=payload.get("pincode", ""),
            gstin=payload.get("gstin") or payload.get("gst_number") or "",
            pan=payload.get("pan") or payload.get("pan_number") or "",
            bank_account_number=payload.get("bank_account_number", ""),
            ifsc_code=payload.get("ifsc_code", ""),
        )
        resp = await stub.RegisterSeller(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def seller_auth_otp(email: str) -> Dict[str, Any]:
        stub = get_user_grpc_stub()
        req = user_pb2.SellerAuthOTPRequest(email=email)
        resp = await stub.SellerAuthOTP(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def seller_verify_otp(user_id: str, otp: int) -> Dict[str, Any]:
        stub = get_user_grpc_stub()
        req = user_pb2.VerifyOTPRequest(user_id=user_id, otp=otp)
        resp = await stub.SellerVerifyOTP(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def admin_auth_otp(email: str) -> Dict[str, Any]:
        stub = get_user_grpc_stub()
        req = user_pb2.AdminAuthOTPRequest(email=email)
        resp = await stub.AdminAuthOTP(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def admin_verify_otp(user_id: str, otp: int) -> Dict[str, Any]:
        stub = get_user_grpc_stub()
        req = user_pb2.VerifyOTPRequest(user_id=user_id, otp=otp)
        resp = await stub.AdminVerifyOTP(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)

    @staticmethod
    async def get_seller_profile(user_id: str) -> Optional[Dict[str, Any]]:
        stub = get_user_grpc_stub()
        req = user_pb2.SellerProfileRequest(user_id=user_id)
        resp = await stub.GetSellerProfile(req, timeout=4.0)
        if not resp.exists:
            return None
        data = MessageToDict(resp, preserving_proto_field_name=True)
        return data.get("seller")

    @staticmethod
    async def get_all_sellers_for_admin() -> List[Dict[str, Any]]:
        stub = get_user_grpc_stub()
        req = user_pb2.EmptyUserRequest()
        resp = await stub.GetAllSellersForAdmin(req, timeout=4.0)
        data = MessageToDict(resp, preserving_proto_field_name=True)
        return data.get("sellers", [])

    @staticmethod
    async def toggle_seller_status(seller_id: str) -> Dict[str, Any]:
        stub = get_user_grpc_stub()
        req = user_pb2.ToggleSellerRequest(seller_id=seller_id)
        resp = await stub.ToggleSellerStatus(req, timeout=4.0)
        return MessageToDict(resp, preserving_proto_field_name=True)
