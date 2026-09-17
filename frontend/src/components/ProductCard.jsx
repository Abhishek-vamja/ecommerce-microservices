import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Star, Plus, Minus, Loader2, Zap, Package } from 'lucide-react';

export default function ProductCard({ 
  product, 
  onAddToCart, 
  onUpdateCartQty,
  onToggleWishlist, 
  addingToCartId, 
  cartQty = 0,
  togglingWishlistId, 
  isWishlisted
}) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const pid = product.unique_id || product.id;
  const isAdding = addingToCartId === pid;
  const isToggling = togglingWishlistId === pid;

  const discountVal = product.discount_percentage || product.discount_percent || 0;
  const reviewsVal = product.rating_count || product.reviews_count || 48;

  return (
    <div 
      onClick={() => navigate(`/product/${pid}`)}
      className="group rounded-3xl p-3.5 sm:p-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between relative bg-white border border-gray-100 text-gray-900 shadow-xs hover:border-orange-300"
    >
      {/* Top Image Container */}
      <div className="relative aspect-square rounded-2xl bg-gradient-to-b from-gray-50/90 to-gray-100/50 overflow-hidden mb-3 border border-gray-100 flex items-center justify-center p-3">
        {/* Shimmer loader while image loads */}
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200/50 to-gray-100 animate-pulse" />
        )}

        {/* Fallback UI if image fails */}
        {imgError || !product.image_url ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-50/80 via-amber-50/40 to-orange-100/30 rounded-xl p-3 text-center select-none">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-orange-100 flex items-center justify-center text-orange-500 mb-1.5 group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6 stroke-[1.8]" />
            </div>
            <span className="text-[11px] font-bold text-gray-700 line-clamp-1 max-w-[90%]">
              {product.brand || 'ShopMate Fresh'}
            </span>
            <span className="text-[9px] font-black text-orange-600/90 uppercase tracking-wider">
              15 Min Delivery
            </span>
          </div>
        ) : (
          <img
            src={product.image_url}
            alt=""
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-contain group-hover:scale-108 transition-all duration-400 ease-out ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
          />
        )}

        {/* Delivery ETA Badge (Swiggy / Blinkit style) */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-lg shadow-xs border border-gray-100 pointer-events-none z-10">
          <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span className="text-[10px] font-black text-gray-800 tracking-tight">15 MINS</span>
        </div>

        {/* Wishlist Heart Icon with Spring Pop */}
        <button
          onClick={(e) => onToggleWishlist(product, e)}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs text-gray-400 hover:text-rose-500 hover:bg-white transition flex items-center justify-center cursor-pointer shadow-xs z-10"
        >
          <Heart className={`w-4 h-4 transition-all duration-200 ${isWishlisted ? 'text-rose-500 fill-rose-500 scale-110' : ''} ${isToggling ? 'scale-130 animate-ping' : ''}`} />
        </button>

        {/* Discount Tag */}
        {discountVal > 0 && (
          <div className="absolute bottom-2 left-2.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider z-10 pointer-events-none">
            {discountVal}% OFF
          </div>
        )}
      </div>

      {/* Product Information */}
      <div className="space-y-2 flex-1 flex flex-col justify-between">
        <div>
          {product.brand && (
            <div className="text-[10px] font-black uppercase tracking-wider text-orange-600">
              {product.brand}
            </div>
          )}
          <h3 className="text-xs sm:text-sm font-bold line-clamp-2 leading-snug mt-0.5 text-gray-900 group-hover:text-orange-600 transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Rating & Review Count */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <div className="flex items-center gap-0.5 bg-emerald-600 text-white px-1.5 py-0.5 rounded-md text-[10px] font-black shadow-2xs">
            <span>★</span>
            <span>{product.rating ? Number(product.rating).toFixed(1) : '4.5'}</span>
          </div>
          <span className="text-[10px] font-medium text-gray-400">
            ({reviewsVal} ratings)
          </span>
        </div>

        {/* Pricing & Add to Cart Stepper */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100/80">
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-black text-gray-900 leading-tight">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </span>
            {product.original_price && (
              <span className="text-[11px] line-through font-medium leading-none text-gray-400">
                ₹{Number(product.original_price).toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Signature Swiggy / Blinkit "+ ADD" -> "- [qty] +" Morphing Stepper */}
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            {cartQty > 0 ? (
              <div className="flex items-center bg-orange-50 border-2 border-orange-500 rounded-xl px-2 py-1 shadow-sm gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onUpdateCartQty) onUpdateCartQty(pid, cartQty - 1, e);
                  }}
                  disabled={isAdding}
                  className="w-5 h-5 flex items-center justify-center text-orange-600 hover:bg-orange-200/60 rounded-md transition font-black cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <span className="text-xs font-black text-orange-700 min-w-3 text-center">
                  {isAdding ? <Loader2 className="w-3 h-3 animate-spin inline" /> : cartQty}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onUpdateCartQty) onUpdateCartQty(pid, cartQty + 1, e);
                  }}
                  disabled={isAdding}
                  className="w-5 h-5 flex items-center justify-center text-orange-600 hover:bg-orange-200/60 rounded-md transition font-black cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => onAddToCart(product, e)}
                disabled={isAdding}
                className="px-4 py-1.5 bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white rounded-xl text-xs font-black transition-all shadow-2xs hover:shadow-md cursor-pointer flex items-center gap-1 active:scale-95"
              >
                {isAdding ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 stroke-[3]" /> ADD
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
