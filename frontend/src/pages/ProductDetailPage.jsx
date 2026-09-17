import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Heart, 
  Star, 
  CheckCircle, 
  Loader2, 
  Check, 
  ShoppingCart, 
  Zap, 
  Truck, 
  RotateCcw, 
  ShieldCheck, 
  CreditCard,
  Package
} from 'lucide-react';
import { api } from '../api/client';

export default function ProductDetailPage({ 
  onAddToCart, 
  onToggleWishlist, 
  addingToCartId, 
  recentlyAddedId, 
  togglingWishlistId, 
  wishlist, 
  cart 
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await api.getProductDetails(id);
        const data = res?.data || res;
        if (data && (data.unique_id || data.id)) {
          setProduct(data);
        }
      } catch (e) {
        console.error('Failed to load product detail:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center items-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-black text-gray-900">Product Not Found</h2>
        <p className="text-xs text-gray-500">The product you are looking for does not exist or has been removed.</p>
        <Link to="/products" className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-bold">
          Browse Products
        </Link>
      </div>
    );
  }

  const pid = product.unique_id || product.id;
  const isWishlisted = wishlist.some(w => (w.product_id || w.id) === pid);
  const isAdding = addingToCartId === pid;
  const isJustAdded = recentlyAddedId === pid;
  const isTogglingWishlist = togglingWishlistId === pid;

  const discountVal = product.discount_percentage || product.discount_percent || 0;
  const reviewsVal = product.rating_count || product.reviews_count || 128;
  const stockVal = product.stock || product.stock_quantity || 45;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <Link to="/" className="hover:text-orange-600 transition">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <Link to="/products" className="hover:text-orange-600 transition">Products</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-900 font-bold truncate max-w-xs">{product.name}</span>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Left: Product Image */}
        <div className="space-y-4">
          <div className="aspect-square bg-gradient-to-b from-gray-50 to-orange-50/20 rounded-3xl overflow-hidden relative border border-gray-100 flex items-center justify-center p-8 group">
            {/* Shimmer loader */}
            {!imgLoaded && !imgError && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200/50 to-gray-100 animate-pulse" />
            )}

            {/* Fallback UI */}
            {imgError || !product.image_url ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50/40 to-orange-100/30 rounded-2xl p-6 text-center select-none">
                <div className="w-20 h-20 rounded-3xl bg-white shadow-sm border border-orange-100 flex items-center justify-center text-orange-500 mb-3 group-hover:scale-105 transition-transform">
                  <Package className="w-10 h-10 stroke-[1.5]" />
                </div>
                <span className="text-base font-bold text-gray-800">
                  {product.brand || 'ShopMate Verified'}
                </span>
                <span className="text-xs font-black text-orange-600 uppercase tracking-wider mt-1">
                  15-Min Quick Commerce
                </span>
              </div>
            ) : (
              <img
                src={product.image_url}
                alt=""
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                className={`w-full h-full object-contain group-hover:scale-105 transition-all duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
            )}
            {discountVal > 0 && (
              <span className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-md">
                {discountVal}% OFF
              </span>
            )}
            <button
              onClick={(e) => onToggleWishlist(product, e)}
              className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-md text-gray-400 hover:text-rose-500 transition cursor-pointer"
            >
              <Heart className={`w-5 h-5 transition-transform ${isWishlisted ? 'text-rose-500 fill-rose-500' : ''} ${isTogglingWishlist ? 'scale-125 animate-ping' : ''}`} />
            </button>

            {/* Quick ETA Badge */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-xs border border-gray-100 flex items-center gap-1.5 text-xs font-black text-gray-800">
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>⚡ Delivery in 10-15 mins</span>
            </div>
          </div>
        </div>

        {/* Right: Product Details */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {product.brand || 'ShopMate Official'}
              </span>
              <span className="text-xs text-gray-400 font-medium">Authentic & Verified</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-2 tracking-tight">{product.name}</h1>
            
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-1 rounded-xl text-xs font-black shadow-xs">
                <Star className="w-3.5 h-3.5 fill-white text-white" />
                {product.rating ? Number(product.rating).toFixed(1) : '4.8'}
              </div>
              <span className="text-xs text-gray-500 font-semibold">({reviewsVal} ratings & reviews)</span>
              <span className="text-gray-300">•</span>
              <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> In Stock ({stockVal} left)
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 bg-gradient-to-r from-orange-50/50 to-amber-50/30 rounded-2xl border border-orange-100/60 flex items-baseline gap-3">
            <span className="text-3xl font-black text-gray-900">₹{Number(product.price).toLocaleString('en-IN')}</span>
            {product.original_price && (
              <span className="text-sm font-semibold text-gray-400 line-through">₹{Number(product.original_price).toLocaleString('en-IN')}</span>
            )}
            {discountVal > 0 && (
              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                Save {discountVal}%
              </span>
            )}
          </div>

          <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
            {product.description || 'High quality certified product crafted with premium grade materials. Superfast delivery guaranteed by ShopMate Instant.'}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <button
              onClick={(e) => onAddToCart(product, e)}
              disabled={isAdding}
              className={`flex-1 py-4 rounded-2xl text-xs md:text-sm font-black transition shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
                isJustAdded 
                  ? 'bg-emerald-600 text-white shadow-emerald-200'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200'
              }`}
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Adding...
                </>
              ) : isJustAdded ? (
                <>
                  <Check className="w-4 h-4" /> Added to Cart!
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" /> Add to Cart
                </>
              )}
            </button>

            <button
              onClick={async (e) => {
                await onAddToCart(product, e);
                navigate('/cart');
              }}
              className="flex-1 py-4 bg-gray-950 hover:bg-black text-white rounded-2xl text-xs md:text-sm font-black shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" /> Instant Checkout
            </button>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 text-xs text-gray-600 font-medium">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-orange-500" /> 10-15 Min Express Delivery
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-600" /> Instant 7-day returns
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" /> 100% Original Guarantee
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600" /> Razorpay & Cash On Delivery
            </div>
          </div>

        </div>

      </div>

      {/* Sticky Mobile Bottom Bar (< md) */}
      <div className="fixed bottom-0 left-0 right-0 p-3.5 bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-2xl flex items-center justify-between gap-3 md:hidden z-40">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">Total Price</span>
          <span className="text-base font-black text-gray-900 mt-0.5">₹{Number(product.price).toLocaleString('en-IN')}</span>
        </div>
        <button
          onClick={(e) => onAddToCart(product, e)}
          disabled={isAdding}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
            isJustAdded 
              ? 'bg-emerald-600 text-white shadow-emerald-200' 
              : 'bg-orange-600 text-white active:bg-orange-700 shadow-orange-200'
          }`}
        >
          {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isJustAdded ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
          <span>{isJustAdded ? 'Added to Cart!' : 'Add to Cart'}</span>
        </button>
      </div>

    </div>
  );
}
