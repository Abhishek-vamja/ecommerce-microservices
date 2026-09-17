import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  CheckCircle2, 
  Clock, 
  Truck, 
  CheckCheck, 
  ShieldCheck, 
  Radio, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { api } from '../api/client';

export default function TrackingPage({ showToast }) {
  const { orderId } = useParams();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [latestEvent, setLatestEvent] = useState(null);

  const fetchTrackingData = async () => {
    if (!orderId) return;
    try {
      const res = await api.getTracking(orderId);
      if (res && res.order_id) {
        setTracking(res);
      }
    } catch (e) {
      console.warn('Failed to load tracking data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, [orderId]);

  // Real-time WebSocket connection
  useEffect(() => {
    if (!orderId) return;

    let ws;
    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
      ws = new WebSocket(`${wsProtocol}//${wsHost}/ws/order/${orderId}`);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLatestEvent(data);
          if (data.type === 'PAYMENT_STATUS_UPDATE' || data.event === 'payment.captured') {
            if (showToast) {
              showToast(`⚡ Live Update: ${data.message || 'Payment confirmed!'}`);
            }
            fetchTrackingData();
          }
        } catch (err) {
          console.warn('Error parsing WebSocket event:', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
      };

      ws.onerror = () => {
        setWsConnected(false);
      };
    } catch (err) {
      console.warn('WebSocket connection error:', err);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [orderId]);

  const stages = [
    { key: 'ORDER_PLACED', label: 'Order Placed', desc: 'Order received & initialized', icon: Clock },
    { key: 'CONFIRMED', label: 'Payment Confirmed', desc: 'Verified via Razorpay / COD', icon: ShieldCheck },
    { key: 'PROCESSING', label: 'Processing & Packed', desc: 'Packed at fulfillment center', icon: Package },
    { key: 'SHIPPED', label: 'Shipped', desc: 'In transit with courier', icon: Truck },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'Arriving today at your doorstep', icon: Sparkles },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Package handed over safely', icon: CheckCheck },
  ];

  const currentStatus = tracking?.current_status?.toUpperCase() || 'ORDER_PLACED';

  const getStageIndex = (status) => {
    if (['PAYMENT_CONFIRMED', 'CONFIRMED', 'PAID'].includes(status)) return 1;
    if (['PROCESSING', 'PACKED'].includes(status)) return 2;
    if (['SHIPPED', 'IN_TRANSIT'].includes(status)) return 3;
    if (['OUT_FOR_DELIVERY'].includes(status)) return 4;
    if (['DELIVERED', 'COMPLETED'].includes(status)) return 5;
    if (['PAYMENT_FAILED', 'CANCELLED'].includes(status)) return -1;
    return 0; // ORDER_PLACED
  };

  const activeIndex = getStageIndex(currentStatus);
  const isFailed = currentStatus === 'PAYMENT_FAILED' || currentStatus === 'CANCELLED';

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-bold text-gray-600">Connecting to live order tracking...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/orders" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition">
          <ArrowLeft className="w-4 h-4" /> Back to All Orders
        </Link>
        <div className="flex items-center gap-2 text-[11px] font-bold px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-2xs">
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
          <span className="text-gray-700">{wsConnected ? 'Live WebSocket Connected' : 'Polling Sync'}</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-xs border border-gray-100 space-y-8">
        
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider ${
                isFailed 
                  ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                  : activeIndex >= 1 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {currentStatus.replace('_', ' ')}
              </span>
              {activeIndex >= 1 && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-gray-900 mt-2">
              Order #{tracking?.order_number || orderId}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Placed on {tracking?.created_at ? new Date(tracking.created_at).toLocaleString() : 'Today'}
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-gray-500 bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
            <div>Courier Partner: <strong className="text-gray-900 font-bold">BlueDart Express</strong></div>
            <div className="mt-1">Tracking AWB: <code className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">BD-{orderId?.slice(0, 8).toUpperCase()}</code></div>
          </div>
        </div>

        {/* Real-Time Status Notification Banner */}
        {latestEvent && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 animate-in fade-in">
            <Radio className="w-5 h-5 text-blue-600 animate-pulse shrink-0" />
            <div className="text-xs text-blue-900">
              <strong className="font-bold">Real-time Webhook Event:</strong> {latestEvent.message || `Payment status ${latestEvent.status}`}
            </div>
          </div>
        )}

        {/* Interactive Milestone Stepper */}
        <div className="relative pl-6 space-y-8 border-l-2 border-gray-100 ml-4">
          {stages.map((stage, idx) => {
            const isCompleted = activeIndex >= idx;
            const isCurrent = activeIndex === idx;
            const IconComponent = stage.icon;

            return (
              <div key={stage.key} className="relative group">
                <span className={`absolute -left-[33px] top-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                  isCompleted 
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm' 
                    : 'bg-gray-100 text-gray-400 ring-4 ring-white'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <IconComponent className="w-3 h-3" />}
                </span>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={`text-sm font-black flex items-center gap-2 ${
                      isCompleted ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {stage.label}
                      {isCurrent && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full animate-pulse">
                          Current Status
                        </span>
                      )}
                    </div>
                    <div className={`text-xs mt-0.5 ${isCompleted ? 'text-gray-500' : 'text-gray-400'}`}>
                      {stage.desc}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Audit Log / Milestone History */}
        {tracking?.history && tracking.history.length > 0 && (
          <div className="pt-6 border-t border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Milestone Activity Log</h3>
            <div className="space-y-2.5">
              {tracking.history.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-xs p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="font-bold text-gray-800">{h.message || h.status}</span>
                  </div>
                  <span className="text-gray-400 font-medium">
                    {h.timestamp ? new Date(h.timestamp).toLocaleTimeString() : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
