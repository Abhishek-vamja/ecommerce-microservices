import React, { useState, useEffect } from 'react';
import { X, Mail, KeyRound, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { api } from '../api/client';
import { useApp } from '../context/AppContext';

export const AuthModal = () => {
  const { isAuthOpen, setIsAuthOpen, loginUser, showToast } = useApp();
  const [step, setStep] = useState(1); // 1: Email input, 2: OTP input
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState(null);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isAuthOpen) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await api.sendOtp(email, name);
      if (res.user_unique_id) {
        setUserId(res.user_unique_id);
        setStep(2);
        setCountdown(60);
        showToast('OTP sent successfully! Please check your inbox.');
      } else {
        showToast(res.message || 'Authentication request failed.');
      }
    } catch (err) {
      showToast('Network error while requesting OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      showToast('Please enter the full 6-digit OTP code.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.verifyOtp(userId, otp);
      if (res.access_token) {
        loginUser(res.access_token, res.user);
        setIsAuthOpen(false);
        setStep(1);
        setEmail('');
        setOtp('');
      } else {
        showToast(res.message || 'Invalid or expired OTP.');
      }
    } catch (err) {
      showToast('Network error while verifying OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative border border-gray-100">
        
        {/* Close button */}
        <button
          onClick={() => setIsAuthOpen(false)}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black text-2xl shadow-inner">
            {step === 1 ? <Mail className="w-7 h-7" /> : <KeyRound className="w-7 h-7" />}
          </div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">
            {step === 1 ? 'Sign in with Email' : 'Enter Verification Code'}
          </h3>
          <p className="text-xs text-gray-500 mt-1.5">
            {step === 1
              ? 'Enter your email address to receive a secure 6-digit login OTP.'
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        {/* Step 1: Email Form */}
        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-2xl text-sm font-medium focus:bg-white outline-hidden focus:ring-4 focus:ring-blue-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Name (Optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Abhishek Patel"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-2xl text-sm font-medium focus:bg-white outline-hidden focus:ring-4 focus:ring-blue-100 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-blue-200 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? 'Sending OTP...' : 'Send OTP via Email'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Step 2: OTP Verification Form */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">6-Digit OTP</label>
              <input
                type="text"
                maxLength={6}
                required
                autoFocus
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center tracking-[12px] text-2xl font-black py-3 bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-2xl focus:bg-white outline-hidden focus:ring-4 focus:ring-blue-100 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm shadow-md shadow-blue-200 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
              <CheckCircle className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-gray-500 hover:text-gray-900 font-semibold cursor-pointer"
              >
                Change Email
              </button>

              {countdown > 0 ? (
                <span className="text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Resend in {countdown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
