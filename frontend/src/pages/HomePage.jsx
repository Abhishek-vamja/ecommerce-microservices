import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ChevronRight, Zap, Clock, ShieldCheck, Truck, RotateCcw, Award } from 'lucide-react';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';

export default function HomePage({ 
  categories, 
  circularCategories, 
  cart,
  onAddToCart, 
  onUpdateCartQty,
  onToggleWishlist, 
  addingToCartId, 
  togglingWishlistId, 
  wishlist 
}) {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [dealProducts, setDealProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [dealCountdown, setDealCountdown] = useState({ hours: 14, minutes: 22, seconds: 45 });

  const banners = [
    {
      title: 'Grand Electronics & Gadget Fest',
      subtitle: 'Up to 65% Off Smartphones, Laptops & Audio',
      badge: '⚡ FLASH SALE 2026',
      bgGradient: 'from-orange-500 via-rose-500 to-red-600',
      tag: '🔥 65% OFF',
      category: 'electronics'
    },
    {
      title: 'Trending Men & Women Fashion',
      subtitle: 'Flat 45% Off Premium Summer Collections',
      badge: '✨ NEW COLLECTION',
      bgGradient: 'from-purple-600 via-pink-500 to-rose-500',
      tag: '👗 BEST DEALS',
      category: 'fashion'
    },
    {
      title: 'Home & Kitchen Essentials in 15 Mins',
      subtitle: 'Top Rated Living, Decor & Kitchenware',
      badge: '🚚 FAST DELIVERY',
      bgGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      tag: '⚡ 15 MIN DELIVERY',
      category: 'home-living'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    const dealTimer = setInterval(() => {
      setDealCountdown((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(dealTimer);
  }, []);

  useEffect(() => {
    const loadHomeProducts = async () => {
      setLoading(true);
      try {
        const [featRes, dealRes] = await Promise.all([
          api.getProducts({ page_size: 8, sort_by: 'rating' }),
          api.getProducts({ page_size: 4, is_deal: true })
        ]);

        const featItems = featRes?.data || featRes?.items || (Array.isArray(featRes) ? featRes : []);
        let dealItems = dealRes?.data || dealRes?.items || (Array.isArray(dealRes) ? dealRes : []);

        if (dealItems.length === 0 && featItems.length > 0) {
          dealItems = featItems.filter(p => (p.discount_percentage || p.discount_percent || 0) > 0).slice(0, 4);
          if (dealItems.length === 0) dealItems = featItems.slice(0, 4);
        }

        setFeaturedProducts(featItems);
        setDealProducts(dealItems);
      } catch (e) {
        console.error('Failed to load home products:', e);
      } finally {
        setLoading(false);
      }
    };
    loadHomeProducts();
  }, []);

  const getProductCartQty = (pid) => {
    const item = cart?.items?.find(i => i.product_id === pid);
    return item ? item.quantity : 0;
  };

  const topBrands = [
    { name: 'Apple', logo: '🍎', desc: 'iPhones, Macs & Watches', count: '12+ items' },
    { name: 'Nike', logo: '👟', desc: 'Air Jordan & Running', count: '8+ items' },
    { name: 'boAt', logo: '🎧', desc: 'Airdopes & Speakers', count: '15+ items' },
    { name: 'Fossil', logo: '⌚', desc: 'Leather & Smartwatches', count: '6+ items' },
  ];

  return (
    <div className="space-y-8 pb-16">
      
      {/* 1. INSTAGRAM / SWIGGY STORY CATEGORY CAROUSEL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-white rounded-3xl p-5 shadow-2xs border border-gray-100/90">
          <div className="flex items-center justify-between mb-4 px-1">
            <div>
              <h2 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-1.5">
                <span>What are you looking for today?</span>
              </h2>
              <p className="text-[11px] text-gray-500 font-medium">Explore handpicked categories with 15-min delivery</p>
            </div>
            <Link to="/products" className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition">
              See All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Story Rings Grid */}
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-2 px-1">
            {circularCategories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div
                  key={idx}
                  onClick={() => navigate(cat.slug ? `/products?category=${cat.slug}` : '/products')}
                  className="group flex flex-col items-center gap-2 cursor-pointer shrink-0 transition-transform active:scale-95"
                >
                  <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-500 group-hover:scale-108 transition-transform duration-300 shadow-sm">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white flex items-center justify-center p-2.5">
                      <div className={`w-full h-full rounded-full flex items-center justify-center ${cat.bg}`}>
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-gray-800 group-hover:text-orange-600 transition text-center max-w-[70px] truncate">
                    {cat.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. HERO PROMOTIONAL BENTO BANNER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`relative rounded-3xl overflow-hidden shadow-xl bg-gradient-to-r ${banners[currentSlide].bgGradient} min-h-[320px] md:min-h-[380px] flex items-center text-white p-8 md:p-14 transition-all duration-700`}>
          
          {/* Background Decorative Rings */}
          <div className="absolute right-0 top-0 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <div className="absolute left-1/3 bottom-0 w-64 h-64 rounded-full bg-black/10 blur-2xl pointer-events-none"></div>

          <div className="relative z-10 max-w-xl space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black tracking-wider uppercase shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              {banners[currentSlide].badge}
            </span>
            <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight">
              {banners[currentSlide].title}
            </h1>
            <p className="text-sm md:text-base text-white/90 font-medium">
              {banners[currentSlide].subtitle}
            </p>
            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={() => navigate(`/products?category=${banners[currentSlide].category}`)}
                className="px-6 py-3.5 bg-white text-gray-900 font-black rounded-2xl shadow-xl hover:bg-gray-50 transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center gap-2 text-xs sm:text-sm"
              >
                Order Now <ArrowRight className="w-4 h-4 text-orange-600" />
              </button>
            </div>
          </div>

          {/* Slide Indicator Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx ? 'w-8 bg-white' : 'w-2 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 3. TODAY'S FLASH DEALS WITH COUNTDOWN */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-b from-orange-50/60 via-white to-white rounded-3xl p-6 md:p-8 border border-orange-100 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-md shadow-orange-200">
                <Zap className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Crazy Flash Deals</h2>
                  <span className="px-2.5 py-0.5 bg-rose-50 text-rose-600 text-[11px] font-black rounded-full border border-rose-100 animate-pulse">
                    🔥 HOT DEALS
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Limited-time super savings on trending gadgets & lifestyle</p>
              </div>
            </div>

            {/* Countdown Clock */}
            <div className="flex items-center gap-2.5 bg-gray-900 text-white px-4 py-2.5 rounded-2xl border border-gray-800 self-start md:self-auto shadow-md">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <span className="text-xs font-bold text-gray-300">Offer ends in:</span>
              <div className="flex items-center gap-1 font-mono font-black text-xs text-white">
                <span className="bg-gray-800 border border-gray-700 px-2 py-1 rounded-lg text-amber-400">{String(dealCountdown.hours).padStart(2, '0')}</span>
                <span className="text-gray-500 font-bold">:</span>
                <span className="bg-gray-800 border border-gray-700 px-2 py-1 rounded-lg text-amber-400">{String(dealCountdown.minutes).padStart(2, '0')}</span>
                <span className="text-gray-500 font-bold">:</span>
                <span className="bg-gray-800 border border-gray-700 px-2 py-1 rounded-lg text-amber-400">{String(dealCountdown.seconds).padStart(2, '0')}</span>
              </div>
            </div>
          </div>

          {/* Deal Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {loading ? (
              [1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-gray-50 rounded-3xl p-6 h-80 animate-pulse border border-gray-100"></div>
              ))
            ) : dealProducts.length > 0 ? (
              dealProducts.map((p) => {
                const pid = p.unique_id || p.id;
                return (
                  <ProductCard
                    key={pid}
                    product={p}
                    cartQty={getProductCartQty(pid)}
                    onAddToCart={onAddToCart}
                    onUpdateCartQty={onUpdateCartQty}
                    onToggleWishlist={onToggleWishlist}
                    addingToCartId={addingToCartId}
                    togglingWishlistId={togglingWishlistId}
                    isWishlisted={wishlist.some((w) => (w.product_id || w.id) === pid)}
                  />
                );
              })
            ) : (
              <div className="col-span-4 text-center py-12 text-gray-400 font-bold text-sm bg-gray-50 rounded-2xl border border-gray-100">
                No active flash deals available. Check back soon!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. BRAND SPOTLIGHT (Apple, Nike, boAt, Fossil) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Top Brand Spotlights</h2>
            <p className="text-xs text-gray-500 font-medium">100% Genuine products straight from official stores</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topBrands.map((b) => (
            <div
              key={b.name}
              onClick={() => navigate(`/products?brand=${encodeURIComponent(b.name)}`)}
              className="bg-white rounded-3xl p-5 border border-gray-100 hover:border-orange-300 shadow-2xs hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center gap-4 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                {b.logo}
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                  {b.name}
                </h3>
                <p className="text-[11px] text-gray-500 line-clamp-1">{b.desc}</p>
                <span className="text-[10px] font-bold text-orange-600 mt-1 inline-block">{b.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. POPULAR RIGHT NOW (Trending Products) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
              Popular Right Now
            </h2>
            <p className="text-xs text-gray-500 font-medium">Handpicked essentials delivered in 15 minutes</p>
          </div>
          <Link
            to="/products"
            className="text-xs font-black text-orange-600 hover:text-orange-700 flex items-center gap-1.5 transition"
          >
            Explore All Catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {loading ? (
            [1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-6 h-80 animate-pulse border border-gray-100"></div>
            ))
          ) : featuredProducts.length > 0 ? (
            featuredProducts.map((p) => {
              const pid = p.unique_id || p.id;
              return (
                <ProductCard
                  key={pid}
                  product={p}
                  cartQty={getProductCartQty(pid)}
                  onAddToCart={onAddToCart}
                  onUpdateCartQty={onUpdateCartQty}
                  onToggleWishlist={onToggleWishlist}
                  addingToCartId={addingToCartId}
                  togglingWishlistId={togglingWishlistId}
                  isWishlisted={wishlist.some((w) => (w.product_id || w.id) === pid)}
                />
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 bg-white rounded-3xl border border-gray-100">
              <p className="text-sm font-bold text-gray-500">No products available at the moment.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
