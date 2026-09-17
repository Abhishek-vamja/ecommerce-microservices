import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Store, 
  ShieldCheck, 
  Percent, 
  TrendingUp, 
  DollarSign, 
  Package, 
  ArrowRight, 
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Zap,
  Lock
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-[calc(100vh-5rem)] py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col justify-center">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-4 shadow-xs">
          <Sparkles className="w-4 h-4 text-blue-600" />
          ShopMate Marketplace & Partner Ecosystem
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Grow Your Business with <span className="text-blue-600">ShopMate</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 mt-4 leading-relaxed">
          The all-in-one merchant portal. List products, track live customer orders, enjoy <strong className="text-slate-900">transparent 5% flat platform fee</strong>, and receive direct <strong className="text-emerald-600">95% bank settlements</strong>.
        </p>
      </div>

      {/* Main Choice Cards: Seller vs Admin */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto w-full">
        
        {/* Card 1: Merchant & Seller Hub */}
        <div className="bg-white border-2 border-slate-200/80 hover:border-blue-500 rounded-3xl p-8 sm:p-10 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-100/60 transition-all"></div>

          <div>
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 mb-6 group-hover:scale-105 transition-transform">
              <Store className="w-7 h-7 stroke-[2.5]" />
            </div>

            <span className="text-xs font-black uppercase tracking-wider text-blue-600">For Merchants & Stores</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">ShopMate Seller Hub</h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Register your shop, manage products, fulfill customer deliveries, and retain <strong className="text-emerald-600 font-bold">95% of every single sale</strong> with zero hidden fees.
            </p>

            <div className="mt-6 space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Self-serve Shop Registration with GST & Bank details</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Real-time Order Fulfillment & Stage Tracking</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Transparent 5% Platform Fee & 95% Bank Payouts</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
            <Link
              to="/seller/login"
              className="w-full sm:w-auto flex-1 py-3.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all cursor-pointer"
            >
              <span>Seller Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/seller/register"
              className="w-full sm:w-auto py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs flex items-center justify-center transition-colors cursor-pointer"
            >
              <span>Register New Shop</span>
            </Link>
          </div>
        </div>

        {/* Card 2: Platform Administrator */}
        <div className="bg-white border-2 border-slate-200/80 hover:border-purple-500 rounded-3xl p-8 sm:p-10 shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-50 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-100/60 transition-all"></div>

          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-200 mb-6 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
            </div>

            <span className="text-xs font-black uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
              <span>Platform Owner (Admin)</span>
              <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">Login Only</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Admin 5% Profit Engine</h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Dedicated suite for the platform owner to audit all store transactions, 5% revenue commissions, and oversee merchant KYC accounts.
            </p>

            <div className="mt-6 space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Order-by-Order & Particular Sale 5% Profit Ledger</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Merchant Directory & Account Status Controls</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Macro GMV, 5% Profit & Disbursed Payout Analytics</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <Link
              to="/admin/login"
              className="w-full py-3.5 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-200 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Admin Login (Owner Access)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

      {/* Trust Highlights */}
      <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 text-center max-w-4xl mx-auto">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xl font-black text-blue-600">5.0%</div>
          <div className="text-xs font-medium text-slate-500 mt-0.5">Flat Transparent Commission</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xl font-black text-emerald-600">95.0%</div>
          <div className="text-xs font-medium text-slate-500 mt-0.5">Net Seller Bank Settlement</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xl font-black text-purple-600">₹0</div>
          <div className="text-xs font-medium text-slate-500 mt-0.5">Zero Product Listing Fee</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-xl font-black text-amber-600">Real-time</div>
          <div className="text-xs font-medium text-slate-500 mt-0.5">Instant Order Fulfillment</div>
        </div>
      </div>
    </div>
  );
};
