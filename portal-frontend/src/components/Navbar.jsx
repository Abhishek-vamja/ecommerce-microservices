import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingBag, 
  Store, 
  ShieldCheck, 
  LogOut, 
  ExternalLink, 
  Package, 
  Layers,
  Sparkles,
  TrendingUp
} from 'lucide-react';

export const Navbar = () => {
  const { seller, isSellerAuth, sellerLogout, isAdminAuth, adminLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSellerRoute = location.pathname.startsWith('/seller');
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Portal Switcher */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 select-none group">
              <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 leading-tight flex items-center gap-1.5">
                  Shop<span className="text-blue-600">Mate</span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                    Partner Hub
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-gray-400">
                  Seller Portal & 5% Platform Administration
                </div>
              </div>
            </Link>

            {/* Portal Switcher Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <Link
                to="/seller"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  isSellerRoute
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Store className="w-4 h-4 text-blue-600" />
                Seller Center
              </Link>
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  isAdminRoute
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Admin Suite (5% Engine)
              </Link>
            </nav>
          </div>

          {/* Quick Actions & Profile */}
          <div className="flex items-center gap-3">
            {/* Storefront Link */}
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200/70 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
              <span>Customer Storefront</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* Seller Logged In Menu */}
            {isSellerRoute && isSellerAuth && (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-bold text-slate-900">{seller?.shop_name || 'My Store'}</div>
                  <div className="text-[11px] text-blue-600 font-medium">{seller?.email}</div>
                </div>
                <button
                  onClick={() => {
                    sellerLogout();
                    navigate('/seller/login');
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 hover:border-red-200 px-3 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer"
                  title="Logout Seller"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}

            {/* Admin Logged In Menu */}
            {isAdminRoute && isAdminAuth && (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-bold text-purple-700">Platform Super Admin</div>
                  <div className="text-[11px] text-slate-500 font-medium">5% Commission Ledger</div>
                </div>
                <button
                  onClick={() => {
                    adminLogout();
                    navigate('/admin/login');
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 hover:border-red-200 px-3 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer"
                  title="Logout Admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
