import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { portalApi } from '../api/client';
import { Store, Mail, KeyRound, ArrowRight, AlertCircle, Sparkles, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react';

export const SellerLoginPage = () => {
  const [step, setStep] = useState('EMAIL'); // 'EMAIL' | 'OTP'
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { sellerLogin } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your registered merchant email');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await portalApi.sendSellerOtp(email.trim().toLowerCase());
      setUserId(res.user_id);
      setStep('OTP');
    } catch (err) {
      setError(err.message || 'Failed to send OTP code. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await portalApi.verifySellerOtp(userId, otp.trim());
      sellerLogin(data.token, data.seller);
      navigate('/seller/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail) => {
    setError('');
    setEmail(demoEmail);
    setLoading(true);
    try {
      const res = await portalApi.sendSellerOtp(demoEmail);
      setUserId(res.user_id);
      if (res.otp) {
        setDevOtp(String(res.otp));
        setOtp(String(res.otp));
        // Auto-verify demo accounts immediately for seamless testing
        const verifyRes = await portalApi.verifySellerOtp(res.user_id, res.otp);
        sellerLogin(verifyRes.token, verifyRes.seller);
        navigate('/seller/dashboard');
        return;
      }
      setStep('OTP');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
        
        {/* Top Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto bg-blue-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-200 mb-4">
            <Store className="w-7 h-7 text-white" />
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            Shop<span className="text-blue-600">Mate</span> <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Seller Hub</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {step === 'EMAIL' ? 'Passwordless Email + OTP Login for Merchants' : `Verification code sent to ${email}`}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <div>{error}</div>
          </div>
        )}

        {/* STEP 1: EMAIL INPUT */}
        {step === 'EMAIL' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Registered Merchant Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seller@yourstore.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Send 6-Digit Login Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  6-Digit OTP Code
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep('EMAIL');
                    setOtp('');
                    setError('');
                  }}
                  className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" /> Change email
                </button>
              </div>

              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 tracking-widest text-center text-lg font-bold text-slate-900 border border-slate-200 focus:border-blue-500 rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full mt-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify & Access Seller Dashboard</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleSendOtp}
                className="text-xs text-slate-500 hover:text-blue-600 font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Resend verification code
              </button>
            </div>
          </form>
        )}

        {/* 1-Click Demo Sellers */}
        <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 text-center flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>1-Click Test Merchant Logins</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('seller@technova.com')}
              className="p-2.5 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-2xl text-left transition-all cursor-pointer group shadow-2xs"
            >
              <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600">⚡ TechNova</div>
              <div className="text-[10px] text-slate-500">43 Items</div>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('seller@freshbasket.com')}
              className="p-2.5 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-2xl text-left transition-all cursor-pointer group shadow-2xs"
            >
              <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-600">🥗 FreshBasket</div>
              <div className="text-[10px] text-slate-500">11 Snacks</div>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('seller@urbanstyle.com')}
              className="p-2.5 bg-slate-50 hover:bg-purple-50/70 border border-slate-200 hover:border-purple-300 rounded-2xl text-left transition-all cursor-pointer group shadow-2xs"
            >
              <div className="text-xs font-bold text-slate-800 group-hover:text-purple-600">👟 UrbanStyle</div>
              <div className="text-[10px] text-slate-500">Fashion</div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Want to start selling on ShopMate?{' '}
            <Link to="/seller/register" className="text-blue-600 hover:text-blue-700 font-bold hover:underline">
              Register Shop
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};

