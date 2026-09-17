import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { portalApi } from '../api/client';
import { 
  ShieldCheck, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Users, 
  ShoppingBag, 
  Package, 
  ArrowUpRight, 
  FileText, 
  Layers, 
  AlertCircle,
  Sparkles
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const { adminToken } = useAuth();
  const [profitData, setProfitData] = useState(null);
  const [sellersSummary, setSellersSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAdminMetrics = async () => {
    try {
      setLoading(true);
      const [profits, summary] = await Promise.all([
        portalApi.getAdminProfits(adminToken),
        portalApi.getAdminSellersSummary(adminToken),
      ]);
      setProfitData(profits);
      setSellersSummary(summary || []);
    } catch (err) {
      setError(err.message || 'Failed to load platform analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminMetrics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading Platform 5% Profit Engine...</p>
        </div>
      </div>
    );
  }

  const summary = profitData?.summary || {
    total_gmv: 0,
    total_platform_profit_5pct: 0,
    total_seller_payouts_95pct: 0,
    total_orders: 0,
    total_items_sold: 0,
    total_active_sellers: 0,
    platform_commission_rate: '5%',
  };

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Super Admin Portal
            </span>
            <span className="text-xs font-semibold text-slate-400">• Commission Engine: <strong className="text-amber-600 font-bold">5.0% Flat</strong></span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Platform Financial & Commission Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time audit of marketplace transactions, 5% revenue cut, and merchant settlement logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/profits"
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-purple-200 transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Particular Sale Profit Ledger</span>
          </Link>
          <Link
            to="/admin/sellers"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs sm:text-sm transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-purple-600" />
            <span>Sellers Directory</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total GMV */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Marketplace GMV</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              ₹{summary.total_gmv.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total transaction volume across all stores</p>
          </div>
        </div>

        {/* 5% Platform Profit */}
        <div className="bg-gradient-to-br from-white to-amber-50/50 border-2 border-amber-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Platform 5% Profit</span>
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-amber-700">
              ₹{summary.total_platform_profit_5pct.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-amber-600 font-medium mt-1">Pure platform revenue from 5% commission</p>
          </div>
        </div>

        {/* 95% Seller Payouts */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Seller Payouts (95%)</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">
              ₹{summary.total_seller_payouts_95pct.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Disbursed directly to merchant bank accounts</p>
          </div>
        </div>

        {/* Orders & Merchants */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Orders & Merchants</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {summary.total_orders}{' '}
              <span className="text-sm font-semibold text-slate-400">orders</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {summary.total_active_sellers} Active Sellers • {summary.total_items_sold} Items Sold
            </p>
          </div>
        </div>

      </div>

      {/* Seller Profit Contribution Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Merchant Profit Contribution Summary</h2>
            <p className="text-xs text-slate-500 mt-0.5">Summary of gross revenue and 5% platform fees earned per merchant</p>
          </div>
          <Link
            to="/admin/profits"
            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 group cursor-pointer"
          >
            <span>View Full Sale-by-Sale Breakdown</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {sellersSummary.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            No seller sales recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Merchant Shop</th>
                  <th className="py-3 px-3">Seller ID</th>
                  <th className="py-3 px-3 text-center">Orders Fulfilled</th>
                  <th className="py-3 px-3 text-center">Units Sold</th>
                  <th className="py-3 px-3 text-right">Gross GMV</th>
                  <th className="py-3 px-3 text-right text-amber-600 font-bold">Platform 5% Profit</th>
                  <th className="py-3 px-3 text-right text-emerald-600 font-bold">Seller Payout (95%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sellersSummary.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-slate-900">{s.shop_name}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-400">{s.seller_id}</td>
                    <td className="py-3.5 px-3 text-center text-slate-700 font-semibold">{s.total_orders}</td>
                    <td className="py-3.5 px-3 text-center text-slate-700 font-semibold">{s.units_sold}</td>
                    <td className="py-3.5 px-3 text-right font-black text-slate-900">₹{s.gross_sales.toFixed(2)}</td>
                    <td className="py-3.5 px-3 text-right font-black text-amber-600 bg-amber-50/40">₹{s.platform_profit_5pct.toFixed(2)}</td>
                    <td className="py-3.5 px-3 text-right font-black text-emerald-700 bg-emerald-50/40">₹{s.seller_payout_95pct.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
