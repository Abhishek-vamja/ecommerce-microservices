import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShoppingBag, 
  Store, 
  ShieldCheck, 
  LayoutDashboard, 
  Package, 
  Receipt, 
  Users, 
  LogOut, 
  ExternalLink, 
  Menu, 
  X, 
  ChevronRight, 
  TrendingUp, 
  Sparkles, 
  CircleDot,
  Plus,
  Building2,
  DollarSign
} from 'lucide-react';

export const DashboardLayout = ({ children, role = 'seller' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { seller, sellerLogout, adminLogout } = useAuth();

  const isAdmin = role === 'admin';

  const adminNavItems = [
    {
      name: 'Platform Overview',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      name: '5% Profit Ledger',
      path: '/admin/profits',
      icon: Receipt,
      badge: '5% Cut',
    },
    {
      name: 'Merchants & KYC',
      path: '/admin/sellers',
      icon: Users,
    },
  ];

  const sellerNavItems = [
    {
      name: 'Store Dashboard',
      path: '/seller/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Products & Inventory',
      path: '/seller/products',
      icon: Package,
    },
    {
      name: 'Customer Orders',
      path: '/seller/orders',
      icon: Receipt,
      badge: '95% Payout',
    },
  ];

  const navItems = isAdmin ? adminNavItems : sellerNavItems;

  const handleLogout = () => {
    if (isAdmin) {
      adminLogout();
      navigate('/admin/login');
    } else {
      sellerLogout();
      navigate('/seller/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Branding */}
        <div>
          <div className="h-20 px-6 flex items-center justify-between border-b border-slate-100">
            <Link to="/" className="flex items-center gap-3 select-none group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105 ${
                isAdmin ? 'bg-purple-600 shadow-purple-200' : 'bg-blue-600 shadow-blue-200'
              }`}>
                {isAdmin ? <ShieldCheck className="w-5 h-5 text-white" /> : <Store className="w-5 h-5 text-white" />}
              </div>
              <div>
                <div className="text-lg font-black tracking-tight text-slate-900 leading-none flex items-center gap-1.5">
                  Shop<span className={isAdmin ? 'text-purple-600' : 'text-blue-600'}>Mate</span>
                </div>
                <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                  {isAdmin ? 'Super Admin Engine' : 'Seller Hub'}
                </div>
              </div>
            </Link>

            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User / Store Card in Sidebar */}
          <div className="p-4 mx-4 my-4 rounded-2xl bg-slate-50 border border-slate-200/70">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {isAdmin ? '👑' : '🏪'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {isAdmin ? 'Platform Super Admin' : (seller?.shop_name || 'My Store')}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {isAdmin ? 'admin@shopmate.com' : (seller?.email || 'seller@store.com')}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <CircleDot className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
                Verified & Active
              </span>
              <span className={`px-2 py-0.5 rounded-full font-bold ${
                isAdmin ? 'bg-purple-100/80 text-purple-800' : 'bg-blue-100/80 text-blue-800'
              }`}>
                {isAdmin ? '5.0% Platform Fee' : '95% Payout Rate'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-4 space-y-1.5">
            <div className="px-3 pb-2 text-[10px] uppercase tracking-wider font-bold text-slate-400">
              Navigation Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? isAdmin
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                        : 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Footer */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          {/* Storefront Link */}
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 border border-slate-200 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>Customer Storefront</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
          </a>

          {/* Switch Hub Link */}
          <Link
            to={isAdmin ? "/seller/login" : "/admin/login"}
            className="flex items-center justify-between px-3.5 py-2 text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
          >
            <span>{isAdmin ? 'Go to Seller Center' : 'Go to Admin Suite'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:border-red-200 border border-transparent transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>ShopMate Partner Hub</span>
                <span>/</span>
                <span className={isAdmin ? 'text-purple-600 font-bold' : 'text-blue-600 font-bold'}>
                  {isAdmin ? 'Platform Super Admin' : (seller?.shop_name || 'Seller Center')}
                </span>
              </div>
              <div className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                {isAdmin ? '5% Commission & Platform Governance' : 'Store Management & 95% Payout Ledger'}
              </div>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Tag */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{isAdmin ? 'Commission: 5.0%' : 'Platform Fee: 5.0%'}</span>
            </div>

            {/* View Storefront */}
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
              <span>Live Store</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* Logout button in top bar */}
            <button
              onClick={handleLogout}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
