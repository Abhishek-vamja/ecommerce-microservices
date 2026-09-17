from google.protobuf.internal import containers as _containers
from google.protobuf import descriptor as _descriptor
from google.protobuf import message as _message
from collections.abc import Iterable as _Iterable, Mapping as _Mapping
from typing import ClassVar as _ClassVar, Optional as _Optional, Union as _Union

DESCRIPTOR: _descriptor.FileDescriptor

class ProductItem(_message.Message):
    __slots__ = ("id", "name", "description", "price", "stock", "category_id", "brand", "image_url", "images", "is_active", "is_deal", "discount_percentage", "rating", "reviews_count", "seller_id", "shop_name", "created_at", "updated_at")
    ID_FIELD_NUMBER: _ClassVar[int]
    NAME_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    PRICE_FIELD_NUMBER: _ClassVar[int]
    STOCK_FIELD_NUMBER: _ClassVar[int]
    CATEGORY_ID_FIELD_NUMBER: _ClassVar[int]
    BRAND_FIELD_NUMBER: _ClassVar[int]
    IMAGE_URL_FIELD_NUMBER: _ClassVar[int]
    IMAGES_FIELD_NUMBER: _ClassVar[int]
    IS_ACTIVE_FIELD_NUMBER: _ClassVar[int]
    IS_DEAL_FIELD_NUMBER: _ClassVar[int]
    DISCOUNT_PERCENTAGE_FIELD_NUMBER: _ClassVar[int]
    RATING_FIELD_NUMBER: _ClassVar[int]
    REVIEWS_COUNT_FIELD_NUMBER: _ClassVar[int]
    SELLER_ID_FIELD_NUMBER: _ClassVar[int]
    SHOP_NAME_FIELD_NUMBER: _ClassVar[int]
    CREATED_AT_FIELD_NUMBER: _ClassVar[int]
    UPDATED_AT_FIELD_NUMBER: _ClassVar[int]
    id: str
    name: str
    description: str
    price: float
    stock: int
    category_id: str
    brand: str
    image_url: str
    images: _containers.RepeatedScalarFieldContainer[str]
    is_active: bool
    is_deal: bool
    discount_percentage: float
    rating: float
    reviews_count: int
    seller_id: str
    shop_name: str
    created_at: str
    updated_at: str
    def __init__(self, id: _Optional[str] = ..., name: _Optional[str] = ..., description: _Optional[str] = ..., price: _Optional[float] = ..., stock: _Optional[int] = ..., category_id: _Optional[str] = ..., brand: _Optional[str] = ..., image_url: _Optional[str] = ..., images: _Optional[_Iterable[str]] = ..., is_active: _Optional[bool] = ..., is_deal: _Optional[bool] = ..., discount_percentage: _Optional[float] = ..., rating: _Optional[float] = ..., reviews_count: _Optional[int] = ..., seller_id: _Optional[str] = ..., shop_name: _Optional[str] = ..., created_at: _Optional[str] = ..., updated_at: _Optional[str] = ...) -> None: ...

class ProductListRequest(_message.Message):
    __slots__ = ("page", "page_size", "search", "category_id", "brand", "has_is_deal", "is_deal", "has_min_price", "min_price", "has_max_price", "max_price", "has_min_rating", "min_rating", "seller_id", "sort_by")
    PAGE_FIELD_NUMBER: _ClassVar[int]
    PAGE_SIZE_FIELD_NUMBER: _ClassVar[int]
    SEARCH_FIELD_NUMBER: _ClassVar[int]
    CATEGORY_ID_FIELD_NUMBER: _ClassVar[int]
    BRAND_FIELD_NUMBER: _ClassVar[int]
    HAS_IS_DEAL_FIELD_NUMBER: _ClassVar[int]
    IS_DEAL_FIELD_NUMBER: _ClassVar[int]
    HAS_MIN_PRICE_FIELD_NUMBER: _ClassVar[int]
    MIN_PRICE_FIELD_NUMBER: _ClassVar[int]
    HAS_MAX_PRICE_FIELD_NUMBER: _ClassVar[int]
    MAX_PRICE_FIELD_NUMBER: _ClassVar[int]
    HAS_MIN_RATING_FIELD_NUMBER: _ClassVar[int]
    MIN_RATING_FIELD_NUMBER: _ClassVar[int]
    SELLER_ID_FIELD_NUMBER: _ClassVar[int]
    SORT_BY_FIELD_NUMBER: _ClassVar[int]
    page: int
    page_size: int
    search: str
    category_id: str
    brand: str
    has_is_deal: bool
    is_deal: bool
    has_min_price: bool
    min_price: float
    has_max_price: bool
    max_price: float
    has_min_rating: bool
    min_rating: float
    seller_id: str
    sort_by: str
    def __init__(self, page: _Optional[int] = ..., page_size: _Optional[int] = ..., search: _Optional[str] = ..., category_id: _Optional[str] = ..., brand: _Optional[str] = ..., has_is_deal: _Optional[bool] = ..., is_deal: _Optional[bool] = ..., has_min_price: _Optional[bool] = ..., min_price: _Optional[float] = ..., has_max_price: _Optional[bool] = ..., max_price: _Optional[float] = ..., has_min_rating: _Optional[bool] = ..., min_rating: _Optional[float] = ..., seller_id: _Optional[str] = ..., sort_by: _Optional[str] = ...) -> None: ...

class ProductListResponse(_message.Message):
    __slots__ = ("items", "total", "page", "page_size", "total_pages")
    ITEMS_FIELD_NUMBER: _ClassVar[int]
    TOTAL_FIELD_NUMBER: _ClassVar[int]
    PAGE_FIELD_NUMBER: _ClassVar[int]
    PAGE_SIZE_FIELD_NUMBER: _ClassVar[int]
    TOTAL_PAGES_FIELD_NUMBER: _ClassVar[int]
    items: _containers.RepeatedCompositeFieldContainer[ProductItem]
    total: int
    page: int
    page_size: int
    total_pages: int
    def __init__(self, items: _Optional[_Iterable[_Union[ProductItem, _Mapping]]] = ..., total: _Optional[int] = ..., page: _Optional[int] = ..., page_size: _Optional[int] = ..., total_pages: _Optional[int] = ...) -> None: ...

class ProductDetailRequest(_message.Message):
    __slots__ = ("id",)
    ID_FIELD_NUMBER: _ClassVar[int]
    id: str
    def __init__(self, id: _Optional[str] = ...) -> None: ...

class ProductDetailResponse(_message.Message):
    __slots__ = ("product", "exists", "error_message")
    PRODUCT_FIELD_NUMBER: _ClassVar[int]
    EXISTS_FIELD_NUMBER: _ClassVar[int]
    ERROR_MESSAGE_FIELD_NUMBER: _ClassVar[int]
    product: ProductItem
    exists: bool
    error_message: str
    def __init__(self, product: _Optional[_Union[ProductItem, _Mapping]] = ..., exists: _Optional[bool] = ..., error_message: _Optional[str] = ...) -> None: ...

class SellerProductsRequest(_message.Message):
    __slots__ = ("seller_id", "page", "page_size")
    SELLER_ID_FIELD_NUMBER: _ClassVar[int]
    PAGE_FIELD_NUMBER: _ClassVar[int]
    PAGE_SIZE_FIELD_NUMBER: _ClassVar[int]
    seller_id: str
    page: int
    page_size: int
    def __init__(self, seller_id: _Optional[str] = ..., page: _Optional[int] = ..., page_size: _Optional[int] = ...) -> None: ...

class CategoryItem(_message.Message):
    __slots__ = ("id", "name", "slug", "icon", "image_url", "is_active", "display_order")
    ID_FIELD_NUMBER: _ClassVar[int]
    NAME_FIELD_NUMBER: _ClassVar[int]
    SLUG_FIELD_NUMBER: _ClassVar[int]
    ICON_FIELD_NUMBER: _ClassVar[int]
    IMAGE_URL_FIELD_NUMBER: _ClassVar[int]
    IS_ACTIVE_FIELD_NUMBER: _ClassVar[int]
    DISPLAY_ORDER_FIELD_NUMBER: _ClassVar[int]
    id: str
    name: str
    slug: str
    icon: str
    image_url: str
    is_active: bool
    display_order: int
    def __init__(self, id: _Optional[str] = ..., name: _Optional[str] = ..., slug: _Optional[str] = ..., icon: _Optional[str] = ..., image_url: _Optional[str] = ..., is_active: _Optional[bool] = ..., display_order: _Optional[int] = ...) -> None: ...

class CategoriesRequest(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class CategoriesResponse(_message.Message):
    __slots__ = ("categories",)
    CATEGORIES_FIELD_NUMBER: _ClassVar[int]
    categories: _containers.RepeatedCompositeFieldContainer[CategoryItem]
    def __init__(self, categories: _Optional[_Iterable[_Union[CategoryItem, _Mapping]]] = ...) -> None: ...

class FilterMetaRequest(_message.Message):
    __slots__ = ()
    def __init__(self) -> None: ...

class PriceRange(_message.Message):
    __slots__ = ("min", "max")
    MIN_FIELD_NUMBER: _ClassVar[int]
    MAX_FIELD_NUMBER: _ClassVar[int]
    min: float
    max: float
    def __init__(self, min: _Optional[float] = ..., max: _Optional[float] = ...) -> None: ...

class FilterMetaResponse(_message.Message):
    __slots__ = ("brands", "categories", "price_range")
    BRANDS_FIELD_NUMBER: _ClassVar[int]
    CATEGORIES_FIELD_NUMBER: _ClassVar[int]
    PRICE_RANGE_FIELD_NUMBER: _ClassVar[int]
    brands: _containers.RepeatedScalarFieldContainer[str]
    categories: _containers.RepeatedCompositeFieldContainer[CategoryItem]
    price_range: PriceRange
    def __init__(self, brands: _Optional[_Iterable[str]] = ..., categories: _Optional[_Iterable[_Union[CategoryItem, _Mapping]]] = ..., price_range: _Optional[_Union[PriceRange, _Mapping]] = ...) -> None: ...

class CreateProductGrpcRequest(_message.Message):
    __slots__ = ("name", "description", "price", "stock", "category_id", "brand", "image_url", "seller_id", "shop_name", "discount_percentage")
    NAME_FIELD_NUMBER: _ClassVar[int]
    DESCRIPTION_FIELD_NUMBER: _ClassVar[int]
    PRICE_FIELD_NUMBER: _ClassVar[int]
    STOCK_FIELD_NUMBER: _ClassVar[int]
    CATEGORY_ID_FIELD_NUMBER: _ClassVar[int]
    BRAND_FIELD_NUMBER: _ClassVar[int]
    IMAGE_URL_FIELD_NUMBER: _ClassVar[int]
    SELLER_ID_FIELD_NUMBER: _ClassVar[int]
    SHOP_NAME_FIELD_NUMBER: _ClassVar[int]
    DISCOUNT_PERCENTAGE_FIELD_NUMBER: _ClassVar[int]
    name: str
    description: str
    price: float
    stock: int
    category_id: str
    brand: str
    image_url: str
    seller_id: str
    shop_name: str
    discount_percentage: float
    def __init__(self, name: _Optional[str] = ..., description: _Optional[str] = ..., price: _Optional[float] = ..., stock: _Optional[int] = ..., category_id: _Optional[str] = ..., brand: _Optional[str] = ..., image_url: _Optional[str] = ..., seller_id: _Optional[str] = ..., shop_name: _Optional[str] = ..., discount_percentage: _Optional[float] = ...) -> None: ...

class DeductStockGrpcRequest(_message.Message):
    __slots__ = ("product_id", "quantity")
    PRODUCT_ID_FIELD_NUMBER: _ClassVar[int]
    QUANTITY_FIELD_NUMBER: _ClassVar[int]
    product_id: str
    quantity: int
    def __init__(self, product_id: _Optional[str] = ..., quantity: _Optional[int] = ...) -> None: ...

class DeductStockGrpcResponse(_message.Message):
    __slots__ = ("success", "remaining_stock", "error_message")
    SUCCESS_FIELD_NUMBER: _ClassVar[int]
    REMAINING_STOCK_FIELD_NUMBER: _ClassVar[int]
    ERROR_MESSAGE_FIELD_NUMBER: _ClassVar[int]
    success: bool
    remaining_stock: int
    error_message: str
    def __init__(self, success: _Optional[bool] = ..., remaining_stock: _Optional[int] = ..., error_message: _Optional[str] = ...) -> None: ...
