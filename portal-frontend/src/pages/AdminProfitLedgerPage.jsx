import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { portalApi } from '../api/client';
import { 
  FileText, 
  Search, 
  Percent, 
  DollarSign, 
  Calendar, 
  Store, 
  RefreshCw, 
  AlertCircle,
  TrendingUp,
  Package,
  Layers,
  CheckCircle2,
  Download
} from 'lucide-react';

export const AdminProfitLedgerPage = () => {
  const { adminToken } = useAuth();
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState('');

  const loadLedger = async () => {
    try {
      setLoading(true);
      const data = await portalApi.getAdminProfits(adminToken);
      setLedgerData(data);
    } catch (err) {
      setError(err.message || 'Failed to load platform profit ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const salesBreakdown = ledgerData?.sales_breakdown || [];

  const filteredSales = salesBreakdown.filter((item) => {
    const matchesSearch =
      item.item_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      item.seller_id?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || item.order_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredGross = filteredSales.reduce((acc, it) => acc + it.gross_sale_amount, 0);
  const filteredProfit = filteredSales.reduce((acc, it) => acc + it.platform_profit_5pct, 0);
  const filteredPayout = filteredSales.reduce((acc, it) => acc + it.seller_payout_95pct, 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold mb-2">
            <Percent className="w-3.5 h-3.5 text-purple-600" />
            Itemized 5% Commission Engine
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-purple-600" />
            <span>Particular Sale Profit Breakdown</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Exact 5% platform commission and 95% merchant payout calculated for every single item sold
          </p>
        </div>

        <button
          onClick={loadLedger}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Filtered KPIs Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-slate-400 uppercase font-bold">Total Gross Volume</span>
            <div className="text-xl font-black text-slate-900 mt-1">₹{filteredGross.toFixed(2)}</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-amber-50/50 border-2 border-amber-200 rounded-3xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-amber-700 uppercase font-bold">Platform 5% Profit</span>
            <div className="text-xl font-black text-amber-700 mt-1">₹{filteredProfit.toFixed(2)}</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-emerald-700 uppercase font-bold">Seller 95% Payouts</span>
            <div className="text-xl font-black text-emerald-700 mt-1">₹{filteredPayout.toFixed(2)}</div>
          </div>
          <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order #, Item, Shop Name, Seller ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-400">Calculating itemized profit ledger...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-[1.5]" />
            <h3 className="text-sm font-bold text-slate-700">No transactions recorded</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Place orders on the customer storefront (Port 5173) to watch the live 5% platform profit ledger populate!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Order Number & Date</th>
                  <th className="py-3.5 px-4">Sold Item / Product</th>
                  <th className="py-3.5 px-4">Merchant Shop</th>
                  <th className="py-3.5 px-4 text-center">Qty × Unit Price</th>
                  <th className="py-3.5 px-4 text-right">Gross Price</th>
                  <th className="py-3.5 px-4 text-right bg-amber-50/70 text-amber-700 font-black">
                    Platform 5% Profit
                  </th>
                  <th className="py-3.5 px-4 text-right bg-emerald-50/70 text-emerald-700 font-black">
                    Seller 95% Payout
                  </th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900">{sale.order_number}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{sale.created_at ? new Date(sale.created_at).toLocaleDateString('en-IN') : 'N/A'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 max-w-xs truncate">{sale.item_name}</div>
                      <div className="text-[10px] font-mono text-slate-400">ID: #{sale.item_id}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-bold text-slate-800">{sale.shop_name}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">{sale.seller_id}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center text-slate-600 font-medium">
                      {sale.quantity} × ₹{sale.unit_price.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      ₹{sale.gross_sale_amount.toFixed(2)}
                    </td>

                    {/* Platform 5% Profit from this sale */}
                    <td className="py-3.5 px-4 text-right font-black text-amber-700 bg-amber-50/50">
                      +₹{sale.platform_profit_5pct.toFixed(2)}
                    </td>

                    {/* Seller 95% payout */}
                    <td className="py-3.5 px-4 text-right font-black text-emerald-700 bg-emerald-50/50">
                      ₹{sale.seller_payout_95pct.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        sale.order_status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : sale.order_status === 'SHIPPED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {sale.order_status}
                      </span>
                    </td>
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
