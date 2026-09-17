import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Heart, 
  ShoppingCart, 
  Star, 
  Zap, 
  ArrowRight,
  Cpu,
  Monitor,
  BatteryCharging,
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
  Car,
  Activity,
  ShoppingBag
} from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';

export const HomeScreen = () => {
  const { addToCart, toggleWishlist, wishlist, navigateToProduct, setCurrentScreen, setSelectedCategory } = useApp();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Countdown timer for Deal of the Day
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 34, seconds: 56 });

  useEffect(() => {
    fetchHomeData();

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.getProducts({ page_size: 6 }),
        api.getCategories(),
      ]);

      if (prodRes.data) setProducts(prodRes.data);
      if (Array.isArray(catRes)) setCategories(catRes);
    } catch (e) {
      console.warn('Home fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const isItemInWishlist = (productId) => {
    return wishlist.some(w => w.product_id === productId);
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
    { name: 'More', icon: Grid, bg: 'bg-gray-100 text-gray-700', slug: null },
  ];

  // Left sidebar category list
  const sidebarCategories = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Fashion', slug: 'fashion' },
    { name: 'Home & Living', slug: 'home-living' },
    { name: 'Beauty & Personal Care', slug: 'beauty' },
    { name: 'Sports & Fitness', slug: 'sports' },
    { name: 'Toys & Games', slug: 'toys-games' },
    { name: 'Books & Stationery', slug: 'books' },
    { name: 'Health & Wellness', slug: 'health' },
    { name: 'Automotive', slug: 'automotive' },
    { name: 'Grocery & Essentials', slug: 'grocery' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      
      {/* 1. TOP HERO SECTION (Sidebar + Main Carousel + Right Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Category Sidebar */}
        <div className="hidden lg:block lg:col-span-3 bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 mb-3 px-2 flex items-center justify-between">
            Shop by Category
          </h3>
          <div className="space-y-0.5">
            {sidebarCategories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => { setSelectedCategory(cat.slug); setCurrentScreen('products'); }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50/60 transition group cursor-pointer"
              >
                <span>{cat.name}</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-600 transition group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>

        {/* Center Hero Banner Carousel */}
        <div className="lg:col-span-6 bg-linear-to-r from-gray-950 via-gray-900 to-gray-800 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden flex flex-col justify-between shadow-xl min-h-[360px]">
          {/* Subtle background glow */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Carousel Arrows */}
          <button className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition cursor-pointer text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition cursor-pointer text-white">
            <ChevronRight className="w-5 h-5" />
          </button>

          <div>
            <span className="inline-block text-[10px] tracking-widest font-extrabold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full uppercase border border-blue-500/20 mb-4">
              THE NEXT GENERATION
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              MacBook Pro
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 font-medium mt-2 max-w-sm">
              Supercharged for pros.
            </p>

            {/* Spec tags */}
            <div className="flex flex-wrap items-center gap-3 mt-5 text-[11px] font-semibold text-gray-300">
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                <Cpu className="w-3.5 h-3.5 text-blue-400" /> M3 chip
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                <Monitor className="w-3.5 h-3.5 text-purple-400" /> Liquid Retina XDR
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> Up to 22-hour battery
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button 
              onClick={() => { setSelectedCategory('electronics'); setCurrentScreen('products'); }}
              className="px-6 py-3 bg-white text-gray-950 font-bold rounded-2xl text-xs hover:bg-gray-100 transition shadow-lg flex items-center gap-2 cursor-pointer"
            >
              Shop Now <ArrowRight className="w-4 h-4" />
            </button>

            {/* Carousel dots */}
            <div className="flex items-center gap-1.5">
              <span className="w-6 h-2 bg-white rounded-full transition-all"></span>
              <span className="w-2 h-2 bg-white/40 rounded-full"></span>
              <span className="w-2 h-2 bg-white/40 rounded-full"></span>
              <span className="w-2 h-2 bg-white/40 rounded-full"></span>
            </div>
          </div>
        </div>

        {/* Right 2 Side Promo Cards */}
        <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col gap-6 justify-between">
          
          {/* Card 1: Bose */}
          <div className="flex-1 bg-gray-900 rounded-3xl p-6 text-white relative overflow-hidden flex flex-col justify-between min-h-[170px] group shadow-sm">
            <div className="relative z-10">
              <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">BOSE</span>
              <h4 className="text-lg font-black leading-tight mt-1 text-white">Feel Every Detail</h4>
              <p className="text-[11px] text-gray-400 mt-1">Premium Sound for a Better You</p>
            </div>
            <button 
              onClick={() => { setSelectedCategory('electronics'); setCurrentScreen('products'); }}
              className="relative z-10 mt-4 self-start text-[11px] font-bold text-white flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-lg hover:bg-white/25 transition cursor-pointer"
            >
              Shop Now <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Card 2: Skincare */}
          <div className="flex-1 bg-rose-50 rounded-3xl p-6 text-gray-900 relative overflow-hidden flex flex-col justify-between min-h-[170px] border border-rose-100 group shadow-sm">
            <div className="relative z-10">
              <span className="text-[10px] font-black tracking-widest text-rose-500 uppercase">PREMIUM CARE</span>
              <h4 className="text-lg font-black leading-tight mt-1 text-gray-900">Skincare That Cares</h4>
              <p className="text-[11px] text-gray-600 mt-1">Beauty for every you</p>
            </div>
            <button 
              onClick={() => { setSelectedCategory('beauty'); setCurrentScreen('products'); }}
              className="relative z-10 mt-4 self-start text-[11px] font-bold text-gray-900 flex items-center gap-1.5 bg-rose-200/60 px-3 py-1.5 rounded-lg hover:bg-rose-200 transition cursor-pointer"
            >
              Shop Now <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        </div>

      </div>

      {/* 2. CIRCULAR CATEGORY QUICK NAVIGATION BAR */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs">
        <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-14 gap-4 text-center">
          {circularCategories.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                onClick={() => { setSelectedCategory(item.slug); setCurrentScreen('products'); }}
                className="flex flex-col items-center gap-2 cursor-pointer group select-none"
              >
                <div className={w-14 h-14 rounded-full  flex items-center justify-center transition-all duration-200 group-hover:scale-110 shadow-xs}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-gray-700 group-hover:text-blue-600 transition truncate w-full">
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. DEAL OF THE DAY SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
        
        {/* Header with Flash Icon & Countdown Timer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-xs shadow-red-200">
                <Zap className="w-4 h-4 fill-white" />
              </div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Deal of the Day</h2>
            </div>

            {/* Live Countdown Clock */}
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
              <span>Ends in</span>
              <div className="flex items-center gap-1 font-mono text-red-600 font-black">
                <span className="bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => { setSelectedCategory(null); setCurrentScreen('products'); }}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group cursor-pointer"
          >
            View All Deals <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </button>
        </div>

        {/* 6 Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {products.map((product) => {
            const inWishlist = isItemInWishlist(product.unique_id);
            return (
              <div 
                key={product.unique_id}
                className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200 flex flex-col justify-between relative group"
              >
                {/* Wishlist button */}
                <button
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white shadow-xs border border-gray-100 transition z-10 cursor-pointer"
                >
                  <Heart className={w-4 h-4 } />
                </button>

                {/* Product Image */}
                <div 
                  onClick={() => navigateToProduct(product.unique_id)}
                  className="w-full h-36 bg-gray-50 rounded-xl mb-3 flex items-center justify-center p-2 cursor-pointer overflow-hidden"
                >
                  <img
                    src={product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300'}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                  />
                </div>

                {/* Product Info */}
                <div className="space-y-1.5">
                  <h3 
                    onClick={() => navigateToProduct(product.unique_id)}
                    className="text-xs font-bold text-gray-900 truncate hover:text-blue-600 cursor-pointer"
                  >
                    {product.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{product.rating}</span>
                    </div>
                    <span className="text-gray-400">({product.rating_count ? ${(product.rating_count / 1000).toFixed(1)}K : '2.4K'})</span>
                  </div>

                  {/* Price & Discount */}
                  <div className="flex items-baseline gap-1.5 flex-wrap pt-1">
                    <span className="text-sm font-black text-gray-900">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    {product.original_price && (
                      <span className="text-[11px] text-gray-400 line-through">
                        ₹{product.original_price.toLocaleString('en-IN')}
                      </span>
                    )}
                    {product.discount_percentage > 0 && (
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {product.discount_percentage}% OFF
                      </span>
                    )}
                  </div>
                </div>

                {/* Add to Cart CTA */}
                <button
                  onClick={() => addToCart(product)}
                  className="w-full mt-4 py-2.5 bg-gray-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                </button>
              </div>
            );
          })}
        </div>

      </div>

      {/* 4. THREE BOTTOM PROMOTIONAL BANNERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Banner 1: Men's Fashion */}
        <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex flex-col justify-between min-h-[160px] shadow-xs">
          <div>
            <h4 className="text-base font-black text-gray-900">Men's Fashion</h4>
            <p className="text-xs text-gray-600 mt-0.5">Style for every story</p>
            <div className="text-sm font-extrabold text-amber-700 mt-2">Min. 40% Off</div>
          </div>
          <button 
            onClick={() => { setSelectedCategory('fashion'); setCurrentScreen('products'); }}
            className="mt-4 self-start text-xs font-bold text-gray-900 bg-amber-200/70 hover:bg-amber-200 px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            Shop Now <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Banner 2: Home Essentials */}
        <div className="bg-teal-50 rounded-3xl p-6 border border-teal-100 flex flex-col justify-between min-h-[160px] shadow-xs">
          <div>
            <h4 className="text-base font-black text-gray-900">Home Essentials</h4>
            <p className="text-xs text-gray-600 mt-0.5">Make your space happier</p>
            <div className="text-sm font-extrabold text-teal-700 mt-2">Upto 60% Off</div>
          </div>
          <button 
            onClick={() => { setSelectedCategory('home-living'); setCurrentScreen('products'); }}
            className="mt-4 self-start text-xs font-bold text-gray-900 bg-teal-200/70 hover:bg-teal-200 px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            Shop Now <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Banner 3: Mobiles & Accessories */}
        <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100 flex flex-col justify-between min-h-[160px] shadow-xs">
          <div>
            <h4 className="text-base font-black text-gray-900">Mobiles & Accessories</h4>
            <p className="text-xs text-gray-600 mt-0.5">Stay connected, always</p>
            <div className="text-sm font-extrabold text-blue-700 mt-2">Upto 50% Off</div>
          </div>
          <button 
            onClick={() => { setSelectedCategory('electronics'); setCurrentScreen('products'); }}
            className="mt-4 self-start text-xs font-bold text-gray-900 bg-blue-200/70 hover:bg-blue-200 px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            Shop Now <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
