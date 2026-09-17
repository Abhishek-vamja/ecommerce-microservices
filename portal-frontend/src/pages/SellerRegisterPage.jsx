import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { portalApi } from '../api/client';
import { 
  Store, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  MapPin, 
  CreditCard, 
  ArrowRight, 
  AlertCircle,
  Percent,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const SellerRegisterPage = () => {
  const [formData, setFormData] = useState({
    shop_name: '',
    owner_name: '',
    email: '',
    phone: '',
    password: '',
    category: 'Electronics',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    pan: '',
    bank_account_number: '',
    ifsc_code: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { sellerLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await portalApi.registerSeller(formData);
      sellerLogin(data.token, data.seller);
      navigate('/seller/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-3">
              <Percent className="w-3.5 h-3.5" />
              Flat 5% Platform Fee • 95% Direct Bank Payouts
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Join as a <span className="text-blue-600">ShopMate Merchant</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Register your store, upload products, and reach thousands of customers.
            </p>
          </div>
          <Link
            to="/seller/login"
            className="text-xs font-bold text-slate-700 hover:text-blue-600 bg-slate-100 px-4 py-2.5 rounded-2xl border border-slate-200 self-start md:self-auto transition-colors cursor-pointer"
          >
            Already a Seller? <span className="text-blue-600 font-bold">Sign In</span>
          </Link>
        </div>

        {error && (
          <div className="my-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          
          {/* Section 1: Shop & Account Basics */}
          <div>
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Store className="w-4 h-4" /> 1. Shop & Owner Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Shop / Store Name *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    name="shop_name"
                    value={formData.shop_name}
                    onChange={handleChange}
                    placeholder="e.g. Apex Tech Store"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Owner Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleChange}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Business Email *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="rajesh@apextech.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Primary Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium cursor-pointer"
                >
                  <option value="Electronics">Electronics & Gadgets</option>
                  <option value="Fashion">Fashion & Apparel</option>
                  <option value="Grocery">Groceries & Snacks</option>
                  <option value="Home & Kitchen">Home & Kitchen</option>
                  <option value="Beauty">Beauty & Personal Care</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Store / Warehouse Address */}
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4" /> 2. Store / Warehouse Address
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Street Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Shop No. 42, Commercial Center, MG Road"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Bengaluru"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Karnataka"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="560001"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Tax & Bank Payout Details */}
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-wider flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4" /> 3. Banking & Payout Settlement (95% Direct Credit)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">GSTIN (Optional)</label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  placeholder="29ABCDE1234F1Z5"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">PAN Number (Optional)</label>
                <input
                  type="text"
                  name="pan"
                  value={formData.pan}
                  onChange={handleChange}
                  placeholder="ABCDE1234F"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Bank Account Number (Payouts)</label>
                <input
                  type="text"
                  name="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={handleChange}
                  placeholder="91823719283719"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Bank IFSC Code</label>
                <input
                  type="text"
                  name="ifsc_code"
                  value={formData.ifsc_code}
                  onChange={handleChange}
                  placeholder="HDFC0001234"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-200 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Create Merchant Account & Launch Shop</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
