import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { portalApi } from '../api/client';
import { 
  Users, 
  Store, 
  Search, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Percent,
  Power
} from 'lucide-react';

export const AdminSellersPage = () => {
  const { adminToken } = useAuth();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadSellers = async () => {
    try {
      setLoading(true);
      const data = await portalApi.getAdminSellersList(adminToken);
      setSellers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load sellers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
  }, []);

  const handleToggleStatus = async (sellerId) => {
    try {
      setActionLoading(sellerId);
      setError('');
      setSuccess('');
      const res = await portalApi.toggleSellerStatus(sellerId, adminToken);
      setSuccess(res.message || 'Seller status updated');
      await loadSellers();
    } catch (err) {
      setError(err.message || 'Failed to toggle status');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredSellers = sellers.filter((s) =>
    s.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.seller_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-purple-600" />
            <span>Merchant Directory & KYC Audit</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Audit registered shops, review GST & bank settlement accounts, and manage store access
          </p>
        </div>

        <button
          onClick={loadSellers}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white border border-slate-200/80 p-4 rounded-3xl shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Shop Name, Owner, Email, Seller ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 font-medium"
          />
        </div>

        <div className="text-xs font-bold text-slate-500">
          Total Registered Merchants: <strong className="text-slate-900 font-bold">{sellers.length}</strong>
        </div>
      </div>

      {/* Sellers Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-slate-400">Loading merchant records...</p>
        </div>
      ) : filteredSellers.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-[1.5]" />
          <h3 className="text-sm font-bold text-slate-700">No sellers registered</h3>
          <p className="text-xs text-slate-400 mt-1">Register a new seller account on the Seller Hub to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSellers.map((seller) => (
            <div
              key={seller.id}
              className="bg-white border border-slate-200/80 hover:border-purple-300 hover:shadow-lg rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-all"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">{seller.shop_name}</h3>
                      <div className="text-[11px] font-mono text-slate-400">ID: {seller.seller_id || seller.id}</div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                    seller.is_active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {seller.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {seller.is_active ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="text-slate-400 w-24 font-semibold">Owner:</span>
                    <strong className="text-slate-900 font-bold">{seller.owner_name}</strong>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-700 font-medium">{seller.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-700 font-medium">{seller.phone}</span>
                  </div>

                  {seller.address && (
                    <div className="flex items-start gap-2 text-slate-500 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{seller.address}, {seller.city} {seller.pincode}</span>
                    </div>
                  )}

                  {/* Bank & Tax Details */}
                  <div className="mt-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-500">
                      <span>GSTIN:</span>
                      <span className="font-mono font-bold text-slate-700">{seller.gst_number || 'Unregistered'}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Bank A/C:</span>
                      <span className="font-mono font-bold text-slate-700">{seller.bank_account_number || 'Pending'}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>IFSC Code:</span>
                      <span className="font-mono font-bold text-slate-700">{seller.ifsc_code || 'Pending'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                  Commission: 5.0% Flat
                </span>

                <button
                  disabled={actionLoading === seller.id}
                  onClick={() => handleToggleStatus(seller.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    seller.is_active
                      ? 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{seller.is_active ? 'Suspend Merchant' : 'Activate Merchant'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
