import React, { useState } from 'react';
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
  Store
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Header = () => {
  const { 
    user, 
    cart, 
    wishlist, 
    setCurrentScreen, 
    setIsAuthOpen, 
    logoutUser, 
    locationPincode,
    searchQuery,
    setSearchQuery,
    setSelectedCategory
  } = useApp();

  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCurrentScreen('products');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs border-b border-gray-100">
      {/* Top Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo */}
          <div 
            onClick={() => { setCurrentScreen('home'); setSelectedCategory(null); }}
            className="flex items-center gap-3 cursor-pointer shrink-0 select-none"
          >
            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight text-gray-900 leading-tight">
                Shop<span className="text-blue-600">Mate</span>
              </div>
              <div className="text-[11px] font-medium text-gray-500 tracking-wide">
                Good Products. Better You.
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-2xl mx-4">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, brands and more..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-transparent focus:border-blue-500 rounded-2xl text-sm font-medium text-gray-800 placeholder-gray-400 transition-all outline-hidden focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-6 shrink-0">
            
            {/* Delivery Location */}
            <div className="hidden md:flex items-center gap-2.5 px-3.5 py-2 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="text-left">
                <div className="text-[11px] text-gray-400 leading-none font-medium">Deliver to</div>
                <div className="text-xs font-bold text-gray-800 flex items-center gap-1 mt-0.5">
                  {locationPincode}
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </div>
              </div>
            </div>

            {/* User Account / Login */}
            <div className="relative">
              {user ? (
                <div 
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="flex items-center gap-2 cursor-pointer p-1.5 rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-200">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-[11px] text-gray-400 leading-none">Hi, {user.name?.split(' ')[0] || 'User'}</div>
                    <div className="text-xs font-bold text-gray-800 flex items-center gap-1 mt-0.5">
                      Account
                      <ChevronDown className="w-3 h-3 text-gray-500" />
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-200 transition"
                >
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              )}

              {/* Account Dropdown Menu */}
              {isAccountMenuOpen && user && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-xs text-gray-500 font-medium">Signed in as</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                  </div>
                  
                  <button 
                    onClick={() => { setCurrentScreen('profile'); setIsAccountMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    My Profile & Addresses
                  </button>

                  <button 
                    onClick={() => { setCurrentScreen('orders'); setIsAccountMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition"
                  >
                    <Package className="w-4 h-4 text-gray-400" />
                    Order History
                  </button>

                  <div className="border-t border-gray-100 my-1"></div>

                  <button 
                    onClick={() => { logoutUser(); setIsAccountMenuOpen(false); }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Wishlist */}
            <div 
              onClick={() => setCurrentScreen('wishlist')}
              className="relative flex items-center gap-1.5 cursor-pointer p-2 rounded-xl hover:bg-gray-50 transition text-gray-700 hover:text-red-500"
            >
              <Heart className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-bold">Wishlist</span>
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </div>

            {/* Cart */}
            <div 
              onClick={() => setCurrentScreen('cart')}
              className="relative flex items-center gap-1.5 cursor-pointer p-2 px-3 bg-gray-900 text-white hover:bg-gray-800 rounded-xl transition shadow-xs"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4 text-white" />
                {cart.item_count > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cart.item_count}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold">Cart</span>
            </div>

          </div>
        </div>
      </div>

      {/* Sub-Navigation Bar */}
      <div className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8 h-11 text-xs font-bold text-gray-600 overflow-x-auto no-scrollbar">
            
            <button 
              onClick={() => setCurrentScreen('products')}
              className="flex items-center gap-1.5 text-gray-900 hover:text-blue-600 transition shrink-0"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Categories
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            <button 
              onClick={() => { setSelectedCategory(null); setCurrentScreen('products'); }}
              className="hover:text-blue-600 transition shrink-0"
            >
              Deals
            </button>

            <button 
              onClick={() => { setSelectedCategory(null); setCurrentScreen('products'); }}
              className="hover:text-blue-600 transition shrink-0"
            >
              New Arrivals
            </button>

            <button 
              onClick={() => { setSelectedCategory(null); setCurrentScreen('products'); }}
              className="hover:text-blue-600 transition shrink-0"
            >
              Best Sellers
            </button>

            <button 
              onClick={() => { setCurrentScreen('home'); }}
              className="text-red-500 hover:text-red-600 transition shrink-0 flex items-center gap-1"
            >
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              Today's Deal
            </button>

            {/* Link to Seller Hub & Admin Suite */}
            <a
              href="http://localhost:5174"
              target="_blank"
              rel="noreferrer"
              className="ml-auto text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/80 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0 border border-amber-200 shadow-xs"
            >
              <Store className="w-3.5 h-3.5 text-amber-600" />
              <span>Seller Hub & 5% Admin Portal</span>
            </a>


          </div>
        </div>
      </div>
    </header>
  );
};
