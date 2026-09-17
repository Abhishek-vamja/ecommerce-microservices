import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Trash2, 
  Minus, 
  Plus, 
  ArrowRight, 
  Tag, 
  ShieldCheck, 
  Truck, 
  Heart, 
  Zap, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { api } from '../api/client';

export default function CartPage({ 
  cart, 
  loadCart, 
  token, 
  setIsAuthOpen, 
  showToast,
  onUpdateCartQty,
  setAuthRedirectIntent 
}) {
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [tipAmount, setTipAmount] = useState(0);

  const handleUpdateQty = async (item, qty) => {
    const pid = item.product_id || item.id;
    if (onUpdateCartQty) {
      await onUpdateCartQty(pid, qty);
      return;
    }
    if (qty < 1) {
      handleDeleteItem(item);
      return;
    }
    try {
      if (token) {
        await api.updateCartQty(token, item.id, qty);
        await loadCart();
      }
    } catch (e) {
      showToast('Could not update quantity');
    }
  };

  const handleDeleteItem = async (item) => {
    const pid = item.product_id || item.id;
    if (onUpdateCartQty) {
      await onUpdateCartQty(pid, 0);
      showToast('Item removed from cart');
      return;
    }
    try {
      if (token) {
        await api.deleteCartItem(token, item.id);
        await loadCart();
      }
      showToast('Item removed from cart');
    } catch (e) {
      showToast('Could not remove item');
    }
  };

  const handleApplyCoupon = (codeToApply) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (code === 'SHOPMATE10') {
      const disc = Math.round((cart.subtotal || 0) * 0.10);
      setDiscount(disc);
      setAppliedCoupon('SHOPMATE10');
      showToast('🎉 Coupon SHOPMATE10 applied! (10% instant savings)');
    } else {
      showToast('Invalid coupon code. Try SHOPMATE10');
    }
  };

  const handleRemoveCoupon = () => {
    setDiscount(0);
    setAppliedCoupon(null);
    setCouponCode('');
    showToast('Coupon removed');
  };

  const handleProceedToCheckout = () => {
    if (!token) {
      if (setAuthRedirectIntent) setAuthRedirectIntent('/checkout');
      setIsAuthOpen(true);
      showToast('⚡ Please enter email to complete checkout');
      return;
    }
    navigate('/checkout');
  };

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-24 h-24 bg-gradient-to-tr from-orange-50 to-amber-50 text-orange-500 rounded-3xl flex items-center justify-center mx-auto border border-orange-100/60 shadow-xs">
          <ShoppingCart className="w-12 h-12" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Your cart is empty</h2>
          <p className="text-xs text-gray-500 mt-1">Good items are waiting for you in the catalog!</p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl text-xs shadow-lg shadow-orange-200 transition"
        >
          Browse Products <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const deliveryFee = 0; // Free delivery above 499
  const originalDeliveryFee = 40;
  const platformFee = 0; // Waived
  const totalSavings = discount + originalDeliveryFee;
  const grandTotal = Math.max(0, (cart.subtotal || 0) - discount + deliveryFee + tipAmount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner: Fast Delivery Indicator */}
      <div className="bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 text-white rounded-3xl p-4 sm:p-5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight flex items-center gap-1.5">
              <span>Delivery in 10-15 minutes</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">SUPERFAST</span>
            </div>
            <div className="text-xs text-orange-100 font-medium">Shipment directly from local dark store</div>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-xs font-bold text-white/90">Items in Cart</div>
          <div className="text-lg font-black">{cart.item_count} items</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Cart Items List & Delivery Preferences */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Cart Items List */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xs border border-gray-100/90 space-y-4">
            <h2 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3">
              Review Items ({cart.item_count})
            </h2>

            <div className="divide-y divide-gray-100">
              {cart.items.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300'}
                      alt=""
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300';
                      }}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-2xl bg-gray-50/80 p-2 shrink-0 border border-gray-100"
                    />
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                        {item.product_name}
                      </h3>
                      <div className="text-xs text-gray-500 font-medium">
                        ₹{Number(item.unit_price).toLocaleString('en-IN')} / unit
                      </div>
                      <div className="text-sm font-black text-orange-600 sm:hidden">
                        ₹{(Number(item.unit_price) * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper (Swiggy / Blinkit style) */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center bg-orange-50 border-2 border-orange-500 rounded-xl px-2 py-1 gap-2 shadow-2xs">
                      <button
                        onClick={() => handleUpdateQty(item, item.quantity - 1)}
                        className="w-5 h-5 flex items-center justify-center text-orange-600 hover:bg-orange-200/60 rounded-md transition font-black cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <span className="text-xs font-black text-orange-700 min-w-3 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item, item.quantity + 1)}
                        className="w-5 h-5 flex items-center justify-center text-orange-600 hover:bg-orange-200/60 rounded-md transition font-black cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>

                    <div className="hidden sm:block text-right min-w-20">
                      <div className="text-sm font-black text-gray-900">
                        ₹{(Number(item.unit_price) * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="p-1.5 text-gray-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Partner Tip (Swiggy/Zomato Feature) */}
          <div className="bg-white rounded-3xl p-5 shadow-2xs border border-gray-100/90 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                  <span>Tip your delivery partner</span>
                  <span className="text-[10px] text-gray-400 font-medium">(Optional)</span>
                </h3>
                <p className="text-[11px] text-gray-500">100% of the tip goes directly to your delivery hero</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              {[20, 30, 50].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTipAmount(tipAmount === amt ? 0 : amt)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                    tipAmount === amt
                      ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-2xs'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>₹{amt}</span>
                  {tipAmount === amt && <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />}
                </button>
              ))}
              {tipAmount > 0 && (
                <button
                  onClick={() => setTipAmount(0)}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Clear Tip
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Promo Code & Bill Breakdown */}
        <div className="space-y-4">
          
          {/* Promo Code Card */}
          <div className="bg-white rounded-3xl p-6 shadow-2xs border border-gray-100/90 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-gray-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-600" />
                <span>Offers & Coupons</span>
              </h3>
            </div>

            {appliedCoupon ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>'{appliedCoupon}' applied</span>
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold">
                    You saved ₹{discount.toLocaleString('en-IN')} with this coupon
                  </div>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer uppercase"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleApplyCoupon();
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter code (SHOPMATE10)"
                    className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 focus:border-orange-500 rounded-2xl text-xs font-bold uppercase outline-hidden"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-xs font-black cursor-pointer transition shadow-2xs"
                  >
                    Apply
                  </button>
                </form>

                {/* Quick Tap Coupon Suggestion */}
                <div 
                  onClick={() => handleApplyCoupon('SHOPMATE10')}
                  className="p-2.5 bg-orange-50/70 border border-orange-200/80 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-orange-100/70 transition"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-black text-orange-700 bg-orange-200/70 px-2 py-0.5 rounded-md">SHOPMATE10</span>
                    <span className="text-[11px] text-gray-600 font-medium">Get 10% instant discount</span>
                  </div>
                  <span className="text-xs font-black text-orange-600">TAP TO APPLY</span>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Bill Summary Card */}
          <div className="bg-white rounded-3xl p-6 shadow-2xs border border-gray-100/90 space-y-4">
            <h2 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3">
              Bill Summary
            </h2>

            <div className="space-y-2.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Item Total</span>
                <span className="font-bold text-gray-900">₹{cart.subtotal.toLocaleString('en-IN')}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount ({appliedCoupon})</span>
                  <span>- ₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  Delivery Fee <span className="text-[10px] text-gray-400">(Free above ₹499)</span>
                </span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="line-through text-gray-400">₹{originalDeliveryFee}</span>
                  <span className="text-emerald-600">FREE</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span>Platform Fee</span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="line-through text-gray-400">₹5</span>
                  <span className="text-emerald-600">FREE</span>
                </div>
              </div>

              {tipAmount > 0 && (
                <div className="flex justify-between font-bold text-orange-600">
                  <span>Delivery Partner Tip</span>
                  <span>₹{tipAmount}</span>
                </div>
              )}

              <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline text-sm font-black text-gray-900">
                <span>To Pay</span>
                <span className="text-base sm:text-lg text-orange-600">₹{grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Savings Pill (Swiggy / Zomato Highlight) */}
            {totalSavings > 0 && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-xs font-black text-emerald-800">
                🎉 Yay! You saved ₹{totalSavings.toLocaleString('en-IN')} on this order
              </div>
            )}

            <button
              onClick={handleProceedToCheckout}
              className="w-full py-4 bg-gradient-to-r from-orange-600 via-orange-500 to-rose-500 hover:from-orange-700 hover:to-rose-600 text-white font-black rounded-2xl text-sm shadow-xl shadow-orange-200 transition transform active:scale-98 cursor-pointer flex items-center justify-between px-6"
            >
              <span>Proceed to Checkout</span>
              <div className="flex items-center gap-2">
                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
