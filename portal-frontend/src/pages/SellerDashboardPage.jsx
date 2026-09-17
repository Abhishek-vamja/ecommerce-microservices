import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { portalApi } from '../api/client';
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  Percent, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  Truck, 
  AlertCircle,
  PlusCircle,
  Store,
  Layers,
  Sparkles
} from 'lucide-react';

export const SellerDashboardPage = () => {
  const { seller, sellerToken } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    if (!seller?.id) return;
    try {
      setLoading(true);
      const data = await portalApi.getSellerAnalytics(seller.id, sellerToken);
      setAnalytics(data);
    } catch (err) {
      setError(err.message || 'Failed to load seller performance metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [seller?.id]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Loading Seller Dashboard...</p>
        </div>
      </div>
    );
  }

  const grossSales = analytics?.gross_sales || 0;
  const platformFee = analytics?.platform_fees_deducted || (grossSales * 0.05);
  const netEarnings = analytics?.net_earnings || (grossSales - platformFee);

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Verified ShopMate Merchant
            </span>
            <span className="text-xs font-mono text-slate-400">ID: {seller?.id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>{seller?.shop_name || 'My Store'}</span>
            <Store className="w-6 h-6 text-blue-600 inline" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Owner: <strong className="text-slate-700 font-semibold">{seller?.owner_name}</strong> • Category: <strong className="text-slate-700 font-semibold">{seller?.category || 'Retail'}</strong> • Model: <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">5% Platform Fee / 95% Payout</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/seller/products"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md shadow-blue-200 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manage Products</span>
          </Link>
          <Link
            to="/seller/orders"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs sm:text-sm transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <span>View Orders</span>
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
        
        {/* Gross Sales */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gross Sales (GMV)</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              ₹{grossSales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total revenue generated</p>
          </div>
        </div>

        {/* 5% Platform Deduction */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">5% Platform Fee</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-amber-600">
              ₹{platformFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Deducted for gateway & hosting</p>
          </div>
        </div>

        {/* 95% Net Payout */}
        <div className="bg-gradient-to-br from-white to-emerald-50/40 border-2 border-emerald-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Net Payouts (95%)</span>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">
              ₹{netEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-emerald-600 mt-1 font-medium">Direct merchant bank settlement</p>
          </div>
        </div>

        {/* Orders Count */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Orders & Items</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {analytics?.total_orders || 0}{' '}
              <span className="text-sm font-semibold text-slate-400">orders</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{analytics?.units_sold || 0} total units dispatched</p>
          </div>
        </div>

      </div>

      {/* Recent Orders Overview */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Recent Store Orders</h2>
            <p className="text-xs text-slate-500 mt-0.5">Live feed of orders containing items from your store</p>
          </div>
          <Link
            to="/seller/orders"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group cursor-pointer"
          >
            <span>View All Orders</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {(!analytics?.recent_orders || analytics.recent_orders.length === 0) ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-[1.5]" />
            <h3 className="text-sm font-bold text-slate-700">No orders placed yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Add attractive products with competitive pricing to start receiving customer orders on ShopMate!
            </p>
            <Link
              to="/seller/products"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Products
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Order Number</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Items Purchased</th>
                  <th className="py-3 px-3 text-right">Gross Total</th>
                  <th className="py-3 px-3 text-right text-amber-600">5% Platform Fee</th>
                  <th className="py-3 px-3 text-right text-emerald-600 font-bold">Your Net Payout</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(analytics.recent_orders || []).map((o) => {
                  const orderGross = (o.items || []).reduce((s, it) => s + Number(it.total_price || 0), 0);
                  const orderFee = (o.items || []).reduce((s, it) => s + Number(it.platform_fee || 0), 0);
                  const orderPayout = (o.items || []).reduce((s, it) => s + Number(it.seller_payout || 0), 0);

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900">{o.order_number}</td>
                      <td className="py-3.5 px-3 text-slate-500">
                        {o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-700 font-medium">
                        <div className="flex flex-col gap-0.5">
                          {(o.items || []).map((it, idx) => (
                            <span key={idx} className="truncate max-w-xs">
                              {it.quantity}x {it.product_name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                        ₹{orderGross.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold text-amber-600">
                        -₹{orderFee.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-emerald-700">
                        ₹{orderPayout.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          o.status === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : o.status === 'SHIPPED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
