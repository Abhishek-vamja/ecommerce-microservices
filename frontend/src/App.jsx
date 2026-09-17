import React, { useState, useEffect } from 'react';
import { 
  Routes, 
  Route, 
  useNavigate, 
  useLocation, 
  Link 
} from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  MapPin, 
  User, 
  Heart, 
  ShoppingCart, 
  ChevronDown, 
  LogOut,
  Package,
  Layers,
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  Tv,
  Shirt,
  Sparkles,
  Footprints,
  Home,
  Utensils,
  BookOpen,
  Grid,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Truck,
  RotateCcw,
  Award,
  X,
  Mail,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { api } from './api/client';
import HomePage from './pages/HomePage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import TrackingPage from './pages/TrackingPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Global App States
  const [token, setToken] = useState(localStorage.getItem('shopmate_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('shopmate_user') || 'null'));
  const [authRedirectIntent, setAuthRedirectIntent] = useState(null);

  // Helper for guest cart storage
  const getGuestCart = () => {
    try {
      const raw = localStorage.getItem('shopmate_guest_cart');
      return raw ? JSON.parse(raw) : { items: [], subtotal: 0, item_count: 0 };
    } catch (e) {
      return { items: [], subtotal: 0, item_count: 0 };
    }
  };

  const saveGuestCart = (newCart) => {
    localStorage.setItem('shopmate_guest_cart', JSON.stringify(newCart));
    setCart(newCart);
  };

  const [cart, setCart] = useState(() => {
    const savedToken = localStorage.getItem('shopmate_token');
    if (!savedToken) {
      try {
        const raw = localStorage.getItem('shopmate_guest_cart');
        return raw ? JSON.parse(raw) : { items: [], subtotal: 0, item_count: 0 };
      } catch (e) {
        return { items: [], subtotal: 0, item_count: 0 };
      }
    }
    return { items: [], subtotal: 0, item_count: 0 };
  });

  const [wishlist, setWishlist] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterMeta, setFilterMeta] = useState({ brands: [], price_range: { min: 0, max: 100000 }, categories: [] });
  
  // UI Interactive States
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [locationPincode, setLocationPincode] = useState('Ahmedabad 380001');
  const [toastMessage, setToastMessage] = useState(null);
  const [headerSearch, setHeaderSearch] = useState('');

  // Button Action Loaders & Animations
  const [addingToCartId, setAddingToCartId] = useState(null);
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);
  const [togglingWishlistId, setTogglingWishlistId] = useState(null);

  // Auth Modal States
  const [authStep, setAuthStep] = useState(1);
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [authUserId, setAuthUserId] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState(null);
  const [authCountdown, setAuthCountdown] = useState(60);

  // Razorpay Checkout Modal States
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [activeRazorpayOrderId, setActiveRazorpayOrderId] = useState('');
  const [activeInternalOrderId, setActiveInternalOrderId] = useState('');
  const [payableAmount, setPayableAmount] = useState(0);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Toast notification helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial load
  useEffect(() => {
    loadCategories();
    loadFilterMeta();
    if (token) {
      loadProfile();
      loadCart(token);
      loadWishlist();
    } else {
      setCart(getGuestCart());
    }
  }, [token]);

  // Auth countdown
  useEffect(() => {
    let timer;
    if (authStep === 2 && authCountdown > 0) {
      timer = setInterval(() => setAuthCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [authStep, authCountdown]);

  const loadCategories = async () => {
    try {
      const res = await api.getCategories();
      if (Array.isArray(res)) setCategories(res);
    } catch (e) {}
  };

  const loadFilterMeta = async () => {
    try {
      const res = await api.getFilterMeta();
      if (res && res.brands) setFilterMeta(res);
    } catch (e) {}
  };

  const isUnauthorized = (res) => {
    if (!res) return false;
    if (res.status_code === 401 || res.status === 401) return true;
    if (typeof res.detail === 'string') {
      const lower = res.detail.toLowerCase();
      return lower.includes('token expired') || lower.includes('could not validate credentials') || lower.includes('unauthorized');
    }
    return false;
  };

  const handleInvalidToken = () => {
    setToken('');
    setUser(null);
    setCart(getGuestCart());
    setWishlist([]);
    localStorage.removeItem('shopmate_token');
    localStorage.removeItem('shopmate_user');
  };

  const loadProfile = async () => {
    if (!token) return;
    try {
      const res = await api.getProfile(token);
      if (res && res.unique_id) {
        setUser(res);
        if (res.default_pincode) setLocationPincode(`Ahmedabad ${res.default_pincode}`);
      } else if (isUnauthorized(res)) {
        handleInvalidToken();
      }
    } catch (e) {
      console.warn('Profile fetch warning:', e);
    }
  };

  const loadCart = async (activeToken = token) => {
    if (!activeToken) {
      setCart(getGuestCart());
      return;
    }
    try {
      const res = await api.getCart(activeToken);
      if (res && res.items) {
        setCart(res);
      } else if (isUnauthorized(res)) {
        handleInvalidToken();
      }
    } catch (e) {
      console.warn('Cart load warning:', e);
    }
  };

  const loadWishlist = async () => {
    if (!token) return;
    try {
      const res = await api.getWishlist(token);
      if (Array.isArray(res)) {
        setWishlist(res);
      } else if (isUnauthorized(res)) {
        handleInvalidToken();
      }
    } catch (e) {
      console.warn('Wishlist load warning:', e);
    }
  };

  // Auth Handlers
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!authEmail) return;
    setAuthLoading(true);
    try {
      const res = await api.sendOtp(authEmail, authName);
      if (res.user_unique_id) {
        setAuthUserId(res.user_unique_id);
        setAuthStep(2);
        setAuthCountdown(60);
        showToast('OTP sent successfully to your email!');
      } else {
        showToast(res.message || 'Failed to send OTP.');
      }
    } catch (err) {
      showToast('Network error while requesting OTP.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!authOtp || authOtp.length < 6) {
      showToast('Please enter the 6-digit OTP.');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await api.verifyOtp(authUserId, authOtp);
      if (res.access_token) {
        const userToken = res.access_token;
        setToken(userToken);
        setUser(res.user);
        localStorage.setItem('shopmate_token', userToken);
        localStorage.setItem('shopmate_user', JSON.stringify(res.user));
        setIsAuthOpen(false);
        setAuthStep(1);
        setAuthEmail('');
        setAuthOtp('');

        // --- GUEST CART TO USER CART AUTO-MERGE ---
        const guestCart = getGuestCart();
        if (guestCart.items && guestCart.items.length > 0) {
          showToast('Syncing your cart items...');
          for (const item of guestCart.items) {
            try {
              await api.addToCart(userToken, {
                product_id: item.product_id,
                product_name: item.product_name,
                unit_price: item.unit_price,
                image_url: item.image_url,
                quantity: item.quantity || 1,
              });
            } catch (mergeErr) {
              console.warn('Cart item merge error:', mergeErr);
            }
          }
          localStorage.removeItem('shopmate_guest_cart');
        }

        await loadCart(userToken);
        showToast(`Welcome, ${res.user.name || 'Shopper'}!`);

        // If user was trying to checkout, resume checkout flow immediately
        if (authRedirectIntent) {
          const target = authRedirectIntent;
          setAuthRedirectIntent(null);
          navigate(target);
        }
      } else {
        showToast(res.message || 'Invalid OTP code.');
      }
    } catch (err) {
      showToast('Network error verifying OTP.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    setCart({ items: [], subtotal: 0, item_count: 0 });
    setWishlist([]);
    localStorage.removeItem('shopmate_token');
    localStorage.removeItem('shopmate_user');
    localStorage.removeItem('shopmate_guest_cart');
    navigate('/');
    showToast('Logged out successfully');
  };

  // Add to cart with interactive spinner animation (Guest + Auth support)
  const handleAddToCart = async (product, e) => {
    if (e) e.stopPropagation();
    const pid = product.unique_id || product.id;
    setAddingToCartId(pid);

    if (!token) {
      // Guest mode: update local storage cart
      const current = getGuestCart();
      const existingIdx = current.items.findIndex(i => i.product_id === pid);
      let updatedItems = [...current.items];

      if (existingIdx >= 0) {
        updatedItems[existingIdx].quantity += 1;
        updatedItems[existingIdx].item_total = updatedItems[existingIdx].quantity * Number(product.price);
      } else {
        updatedItems.push({
          id: `guest_${pid}`,
          product_id: pid,
          product_name: product.name,
          unit_price: Number(product.price),
          image_url: product.image_url,
          quantity: 1,
          item_total: Number(product.price),
        });
      }

      const newSubtotal = updatedItems.reduce((acc, curr) => acc + (Number(curr.unit_price) * curr.quantity), 0);
      const newItemCount = updatedItems.reduce((acc, curr) => acc + curr.quantity, 0);
      saveGuestCart({ items: updatedItems, subtotal: newSubtotal, item_count: newItemCount });

      setRecentlyAddedId(pid);
      showToast(`✓ ${product.name} added to cart!`);
      setTimeout(() => setRecentlyAddedId(null), 1800);
      setAddingToCartId(null);
      return;
    }

    // Authenticated user: call microservice
    try {
      await api.addToCart(token, {
        product_id: pid,
        product_name: product.name,
        unit_price: product.price,
        image_url: product.image_url,
        quantity: 1,
      });
      await loadCart();
      setRecentlyAddedId(pid);
      showToast(`✓ ${product.name} added to cart!`);
      setTimeout(() => setRecentlyAddedId(null), 1800);
    } catch (e) {
      showToast('Could not add item to cart');
    } finally {
      setAddingToCartId(null);
    }
  };

  // Wishlist toggle with animation
  const handleToggleWishlist = async (product, e) => {
    if (e) e.stopPropagation();
    if (!token) {
      showToast('Please sign in to save items to wishlist');
      setIsAuthOpen(true);
      return;
    }
    const pid = product.unique_id || product.id;
    setTogglingWishlistId(pid);
    try {
      const res = await api.toggleWishlist(token, {
        product_id: pid,
        product_name: product.name,
        unit_price: product.price,
        image_url: product.image_url,
      });
      await loadWishlist();
      showToast(res.action === 'added' ? 'Added to wishlist!' : 'Removed from wishlist');
    } catch (e) {
      showToast('Wishlist update failed');
    } finally {
      setTogglingWishlistId(null);
    }
  };

  // Direct quantity updater for + ADD / - steppers across app (Guest + Auth support)
  const handleUpdateCartQty = async (productId, newQty, e) => {
    if (e) e.stopPropagation();
    setAddingToCartId(productId);

    if (!token) {
      // Guest mode
      const current = getGuestCart();
      let updatedItems = [];

      if (newQty <= 0) {
        updatedItems = current.items.filter(i => i.product_id !== productId);
        showToast('Item removed from cart');
      } else {
        const existingIdx = current.items.findIndex(i => i.product_id === productId);
        if (existingIdx >= 0) {
          updatedItems = [...current.items];
          updatedItems[existingIdx].quantity = newQty;
          updatedItems[existingIdx].item_total = newQty * Number(updatedItems[existingIdx].unit_price);
        }
      }

      const newSubtotal = updatedItems.reduce((acc, curr) => acc + (Number(curr.unit_price) * curr.quantity), 0);
      const newItemCount = updatedItems.reduce((acc, curr) => acc + curr.quantity, 0);
      saveGuestCart({ items: updatedItems, subtotal: newSubtotal, item_count: newItemCount });
      setAddingToCartId(null);
      return;
    }

    // Authenticated user
    const existingItem = cart.items?.find(i => i.product_id === productId);
    try {
      if (newQty <= 0 && existingItem) {
        await api.deleteCartItem(token, existingItem.id);
        showToast('Item removed from cart');
      } else if (existingItem) {
        await api.updateCartQty(token, existingItem.id, newQty);
      }
      await loadCart();
    } catch (err) {
      showToast('Could not update cart quantity');
    } finally {
      setAddingToCartId(null);
    }
  };

  const handleSimulateRazorpaySuccess = async () => {
    setIsProcessingCheckout(true);
    try {
      const verifyRes = await api.verifyPayment({
        order_id: activeInternalOrderId,
        razorpay_order_id: activeRazorpayOrderId,
        razorpay_payment_id: `pay_test_${Date.now()}`,
        razorpay_signature: 'test_signature_valid',
      });

      if (verifyRes.status === 'SUCCESS') {
        setShowRazorpayModal(false);
        await loadCart();
        showToast('Payment successful & Order confirmed!');
        navigate(`/tracking/${activeInternalOrderId}`);
      } else {
        showToast('Payment verification failed');
      }
    } catch (e) {
      showToast('Payment processing error');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // 14 Circular Category Icons matching the screenshot
  const circularCategories = [
    { name: 'Mobiles', icon: Smartphone, bg: 'bg-indigo-50 text-indigo-600', slug: 'electronics' },
    { name: 'Laptops', icon: Laptop, bg: 'bg-blue-50 text-blue-600', slug: 'electronics' },
    { name: 'Headphones', icon: Headphones, bg: 'bg-violet-50 text-violet-600', slug: 'electronics' },
    { name: 'Smart Watch', icon: Watch, bg: 'bg-emerald-50 text-emerald-600', slug: 'electronics' },
    { name: 'TVs', icon: Tv, bg: 'bg-sky-50 text-sky-600', slug: 'electronics' },
    { name: 'Men Fashion', icon: Shirt, bg: 'bg-amber-50 text-amber-600', slug: 'fashion' },
    { name: 'Women Fashion', icon: Sparkles, bg: 'bg-pink-50 text-pink-600', slug: 'fashion' },
    { name: 'Footwear', icon: Footprints, bg: 'bg-orange-50 text-orange-600', slug: 'fashion' },
    { name: 'Home Decor', icon: Home, bg: 'bg-teal-50 text-teal-600', slug: 'home-living' },
    { name: 'Kitchen', icon: Utensils, bg: 'bg-red-50 text-red-600', slug: 'home-living' },
    { name: 'Beauty', icon: Sparkles, bg: 'bg-rose-50 text-rose-600', slug: 'beauty' },
    { name: 'Toys & Games', icon: ShoppingBag, bg: 'bg-purple-50 text-purple-600', slug: 'toys-games' },
    { name: 'Books', icon: BookOpen, bg: 'bg-cyan-50 text-cyan-600', slug: 'books' },
    { name: 'More', icon: Grid, bg: 'bg-gray-100 text-gray-700', slug: '' },
  ];

  const trendingSearchChips = [
    { label: '🔥 iPhone 15', q: 'iPhone' },
    { label: '⚡ Under ₹999', q: 'boAt' },
    { label: '👟 Sneakers', q: 'Nike' },
    { label: '⌚ Smartwatch', q: 'Fossil' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] text-gray-900 selection:bg-orange-500 selection:text-white">
      
      {/* TOAST POPUP */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold border border-gray-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
          {toastMessage}
        </div>
      )}

      {/* 1. TOP HEADER / NAVBAR (Swiggy / Zomato Modern 2026 Style) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-2xs border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 cursor-pointer shrink-0 select-none">
              <div className="w-10 h-10 bg-gradient-to-tr from-orange-600 to-amber-500 rounded-2xl flex items-center justify-center shadow-md shadow-orange-200">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-black tracking-tight text-gray-900 leading-tight">
                  Shop<span className="text-orange-600">Mate</span>
                </div>
                <div className="text-[10px] font-black text-orange-600/90 uppercase tracking-wider flex items-center gap-1">
                  <span>⚡ 15 MINS DELIVERY</span>
                </div>
              </div>
            </Link>

            {/* Delivery Location Selector */}
            <div className="hidden md:flex items-center gap-2.5 px-3.5 py-2 bg-gray-50/90 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition shrink-0">
              <MapPin className="w-4 h-4 text-orange-600 shrink-0" />
              <div className="text-left">
                <div className="text-[10px] text-gray-400 leading-none font-bold uppercase tracking-wider">Delivery in 15 mins</div>
                <div className="text-xs font-black text-gray-900 flex items-center gap-1 mt-0.5">
                  {locationPincode}
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </div>
              </div>
            </div>

            {/* Modern Search Bar */}
            <div className="flex-1 max-w-xl mx-2 hidden sm:block">
              <form 
                onSubmit={(e) => { 
                  e.preventDefault(); 
                  if (headerSearch.trim()) {
                    navigate(`/products?q=${encodeURIComponent(headerSearch.trim())}`);
                  }
                }}
              >
                <div className="relative flex items-center">
                  <Search className="absolute left-4 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={headerSearch}
                    onChange={(e) => setHeaderSearch(e.target.value)}
                    placeholder="Search for 'iPhone 15', 'Nike Shoes', 'boAt'..."
                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200/70 focus:border-orange-500 rounded-2xl text-xs font-bold text-gray-800 placeholder-gray-400 transition-all outline-hidden focus:ring-3 focus:ring-orange-100"
                  />
                </div>
              </form>
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0">
              
              {/* Account Dropdown */}
              <div className="relative">
                {user ? (
                  <div 
                    onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                    className="flex items-center gap-2 cursor-pointer p-1.5 rounded-2xl hover:bg-gray-50 transition"
                  >
                    <div className="w-9 h-9 rounded-2xl bg-orange-100 text-orange-700 font-black flex items-center justify-center text-xs border border-orange-200 shadow-2xs">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="text-left hidden lg:block">
                      <div className="text-[10px] text-gray-400 leading-none font-bold">Hi, {user.name?.split(' ')[0] || 'User'}</div>
                      <div className="text-xs font-black text-gray-800 flex items-center gap-1 mt-0.5">
                        Account
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-xs font-black shadow-md shadow-orange-200 transition cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" /> Sign In
                  </button>
                )}

                {isAccountMenuOpen && user && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-[11px] text-gray-400 font-bold">Signed in as</p>
                      <p className="text-xs font-black text-gray-900 truncate">{user.email}</p>
                    </div>
                    <Link 
                      to="/profile"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 transition"
                    >
                      <User className="w-4 h-4 text-gray-400" /> My Profile & Addresses
                    </Link>
                    <Link 
                      to="/orders"
                      onClick={() => setIsAccountMenuOpen(false)}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2.5 transition"
                    >
                      <Package className="w-4 h-4 text-gray-400" /> Order History
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button 
                      onClick={() => { handleLogout(); setIsAccountMenuOpen(false); }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" /> Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Wishlist */}
              <Link 
                to="/wishlist"
                className="relative flex items-center gap-1.5 cursor-pointer p-2 rounded-2xl hover:bg-gray-50 transition text-gray-700 hover:text-rose-600"
              >
                <Heart className="w-5 h-5" />
                <span className="hidden sm:inline text-xs font-bold">Wishlist</span>
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart Pill */}
              <Link 
                to="/cart"
                className="relative flex items-center gap-2.5 cursor-pointer py-2 px-3.5 bg-gradient-to-r from-orange-600 to-rose-600 text-white hover:opacity-95 rounded-2xl transition shadow-md shadow-orange-200"
              >
                <div className="relative">
                  <ShoppingCart className="w-4 h-4 text-white" />
                  {cart.item_count > 0 && (
                    <span className="absolute -top-2.5 -right-2.5 bg-gray-900 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                      {cart.item_count}
                    </span>
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-[10px] font-bold text-orange-100 uppercase leading-none">Cart</div>
                  <div className="text-xs font-black">₹{cart.subtotal.toLocaleString('en-IN')}</div>
                </div>
              </Link>

            </div>
          </div>
        </div>

        {/* Sub-Navigation Bar with Trending Search Chips */}
        <div className="border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-11 text-xs font-bold text-gray-600">
              
              <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
                <Link to="/products" className="flex items-center gap-1.5 text-gray-900 hover:text-orange-600 transition shrink-0 font-black">
                  <Layers className="w-3.5 h-3.5 text-orange-600" /> All Categories <ChevronDown className="w-3 h-3 text-gray-400" />
                </Link>
                <Link to="/products?deal=true" className="hover:text-orange-600 transition shrink-0 flex items-center gap-1 text-rose-600">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                  Crazy Deals
                </Link>
                <Link to="/products?sort=newest" className="hover:text-orange-600 transition shrink-0">New Arrivals</Link>
                <Link to="/products?sort=rating_desc" className="hover:text-orange-600 transition shrink-0">Top Rated</Link>
              </div>

              {/* Trending Quick Search Chips */}
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase">Trending:</span>
                {trendingSearchChips.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(`/products?q=${encodeURIComponent(chip.q)}`)}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-50 hover:bg-orange-50 hover:text-orange-700 transition cursor-pointer border border-gray-100"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* Mobile Search Bar for Phones (< sm) */}
        <div className="block sm:hidden px-4 py-2.5 bg-white border-t border-gray-100 shadow-2xs">
          <form 
            onSubmit={(e) => { 
              e.preventDefault(); 
              if (headerSearch.trim()) {
                navigate(`/products?q=${encodeURIComponent(headerSearch.trim())}`);
              }
            }}
          >
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                placeholder="Search iPhone, Nike, Maggi, Snacks..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200/80 focus:border-orange-500 rounded-xl text-xs font-bold text-gray-800 placeholder-gray-400 transition-all outline-hidden"
              />
            </div>
          </form>
        </div>
      </header>

      {/* 2. ROUTED PAGES */}
      <main className="flex-1">
        <Routes>
          <Route 
            path="/" 
            element={
              <HomePage 
                categories={categories}
                circularCategories={circularCategories}
                cart={cart}
                onAddToCart={handleAddToCart}
                onUpdateCartQty={handleUpdateCartQty}
                onToggleWishlist={handleToggleWishlist}
                addingToCartId={addingToCartId}
                togglingWishlistId={togglingWishlistId}
                wishlist={wishlist}
              />
            } 
          />
          <Route 
            path="/products" 
            element={
              <ProductListPage 
                filterMeta={filterMeta}
                categories={categories}
                cart={cart}
                onAddToCart={handleAddToCart}
                onUpdateCartQty={handleUpdateCartQty}
                onToggleWishlist={handleToggleWishlist}
                addingToCartId={addingToCartId}
                togglingWishlistId={togglingWishlistId}
                wishlist={wishlist}
              />
            } 
          />
          <Route 
            path="/product/:id" 
            element={
              <ProductDetailPage 
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
                addingToCartId={addingToCartId}
                togglingWishlistId={togglingWishlistId}
                wishlist={wishlist}
                token={token}
                setIsAuthOpen={setIsAuthOpen}
              />
            } 
          />
          <Route 
            path="/cart" 
            element={
              <CartPage 
                cart={cart}
                loadCart={loadCart}
                token={token}
                setIsAuthOpen={setIsAuthOpen}
                showToast={showToast}
                onUpdateCartQty={handleUpdateCartQty}
                setAuthRedirectIntent={setAuthRedirectIntent}
              />
            } 
          />
          <Route 
            path="/wishlist" 
            element={
              <WishlistPage 
                wishlist={wishlist}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
                addingToCartId={addingToCartId}
                togglingWishlistId={togglingWishlistId}
                token={token}
                setIsAuthOpen={setIsAuthOpen}
              />
            } 
          />
          <Route 
            path="/checkout" 
            element={
              <CheckoutPage 
                cart={cart}
                token={token}
                user={user}
                loadCart={loadCart}
                showToast={showToast}
                setIsAuthOpen={setIsAuthOpen}
                setActiveRazorpayOrderId={setActiveRazorpayOrderId}
                setActiveInternalOrderId={setActiveInternalOrderId}
                setPayableAmount={setPayableAmount}
                setShowRazorpayModal={setShowRazorpayModal}
              />
            } 
          />
          <Route 
            path="/orders" 
            element={
              <OrdersPage 
                token={token}
                setIsAuthOpen={setIsAuthOpen}
              />
            } 
          />
          <Route 
            path="/tracking/:orderId" 
            element={
              <TrackingPage showToast={showToast} />
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProfilePage 
                token={token}
                user={user}
                setUser={setUser}
                showToast={showToast}
                setIsAuthOpen={setIsAuthOpen}
                loadProfile={loadProfile}
              />
            } 
          />
        </Routes>
      </main>

      {/* FLOATING STICKY BOTTOM CART BAR (Swiggy Signature) */}
      {cart.item_count > 0 && !['/cart', '/checkout'].includes(location.pathname) && (
        <div 
          onClick={() => navigate('/cart')}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-lg bg-gradient-to-r from-orange-600 via-orange-500 to-rose-500 text-white rounded-3xl p-4 shadow-2xl flex items-center justify-between cursor-pointer hover:shadow-orange-300 transition-all transform hover:-translate-y-0.5 active:scale-98 animate-in slide-in-from-bottom-5 duration-300 border border-white/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-black tracking-wide uppercase text-orange-100 flex items-center gap-1.5">
                <span>{cart.item_count} {cart.item_count === 1 ? 'ITEM' : 'ITEMS'} IN CART</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
              </div>
              <div className="text-sm font-black text-white">
                ₹{cart.subtotal.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-black bg-white text-orange-600 px-4 py-2 rounded-2xl shadow-sm">
            <span>View Cart</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* 3. RAZORPAY SANDBOX MODAL */}
      {showRazorpayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-gray-100 space-y-6 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <CreditCard className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">Razorpay Sandbox Gateway</h3>
              <p className="text-xs text-gray-500 mt-1">Order ID: <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{activeRazorpayOrderId}</code></p>
              <div className="text-2xl font-black text-blue-600 mt-3">₹{payableAmount.toLocaleString('en-IN')}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-left text-xs space-y-1 text-gray-600">
              <p className="font-bold text-gray-900">💳 Test Sandbox Simulation:</p>
              <p>• UPI: <code className="text-blue-600 font-mono">success@razorpay</code></p>
              <p>• Card: <code className="text-blue-600 font-mono">4111 2222 3333 4444</code></p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowRazorpayModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl text-xs cursor-pointer">Cancel</button>
              <button onClick={handleSimulateRazorpaySuccess} disabled={isProcessingCheckout} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Pay & Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. AUTH MODAL (Email-only + 6-digit OTP) */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative border border-gray-100">
            <button onClick={() => setIsAuthOpen(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black text-2xl">
                {authStep === 1 ? <Mail className="w-7 h-7" /> : <KeyRound className="w-7 h-7" />}
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">{authStep === 1 ? 'Sign in with Email' : 'Enter Verification Code'}</h3>
              <p className="text-xs text-gray-500 mt-1.5">{authStep === 1 ? 'Enter your email address to receive a secure 6-digit OTP.' : `We sent an OTP code to ${authEmail}`}</p>
            </div>

            {authStep === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Address</label>
                  <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="name@example.com" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-2xl text-sm font-medium outline-hidden" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Name (Optional)</label>
                  <input type="text" value={authName} onChange={(e) => setAuthName(e.target.value)} placeholder="Abhishek Patel" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-2xl text-sm font-medium outline-hidden" />
                </div>
                <button type="submit" disabled={authLoading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-blue-200 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer">
                  {authLoading ? 'Sending OTP...' : 'Send OTP via Email'} <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">6-Digit Code</label>
                  <input type="text" maxLength={6} required autoFocus value={authOtp} onChange={(e) => setAuthOtp(e.target.value.replace(/\D/g, ''))} placeholder="123456" className="w-full text-center tracking-[12px] text-2xl font-black py-3 bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-2xl outline-hidden" />
                </div>

                <button type="submit" disabled={authLoading} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer">
                  {authLoading ? 'Verifying...' : 'Verify & Continue'} <CheckCircle2 className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 5. FOOTER */}
      <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center md:text-left">
            <div className="flex items-center gap-3.5 justify-center md:justify-start">
              <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><Truck className="w-5 h-5" /></div>
              <div><div className="text-xs font-bold text-gray-900">Free Delivery</div><div className="text-[11px] text-gray-500">On orders above ₹499</div></div>
            </div>
            <div className="flex items-center gap-3.5 justify-center md:justify-start">
              <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0"><RotateCcw className="w-5 h-5" /></div>
              <div><div className="text-xs font-bold text-gray-900">Easy Returns</div><div className="text-[11px] text-gray-500">7-day return policy</div></div>
            </div>
            <div className="flex items-center gap-3.5 justify-center md:justify-start">
              <div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0"><ShieldCheck className="w-5 h-5" /></div>
              <div><div className="text-xs font-bold text-gray-900">Secure Payments</div><div className="text-[11px] text-gray-500">100% safe & secure</div></div>
            </div>
            <div className="flex items-center gap-3.5 justify-center md:justify-start">
              <div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0"><Award className="w-5 h-5" /></div>
              <div><div className="text-xs font-bold text-gray-900">Genuine Products</div><div className="text-[11px] text-gray-500">Direct from brands</div></div>
            </div>
            <div className="flex items-center gap-3.5 justify-center md:justify-start col-span-2 md:col-span-1">
              <div className="w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shrink-0"><Headphones className="w-5 h-5" /></div>
              <div><div className="text-xs font-bold text-gray-900">Need Help?</div><div className="text-[11px] text-gray-500">24/7 customer support</div></div>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 py-6 bg-gray-50 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} ShopMate E-Commerce Microservices. All rights reserved.
        </div>
      </footer>

    </div>
  );
}
