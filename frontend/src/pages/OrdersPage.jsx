import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, Truck, Loader2 } from 'lucide-react';
import { api } from '../api/client';

export default function OrdersPage({ token, setIsAuthOpen }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.getMyOrders(token).then((res) => {
        if (Array.isArray(res)) setOrders(res);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [token]);

  if (!token) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <Package className="w-12 h-12 text-gray-400 mx-auto" />
        <h2 className="text-2xl font-black text-gray-900">Sign in to view orders</h2>
        <button onClick={() => setIsAuthOpen(true)} className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-xs cursor-pointer shadow-md">
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Your Orders</h1>
          <p className="text-xs text-gray-500 font-medium">Track your instant delivery shipments & order receipts</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs space-y-4">
          <Package className="w-16 h-16 text-gray-300 mx-auto" />
          <h2 className="text-lg font-black text-gray-900">No orders placed yet</h2>
          <p className="text-xs text-gray-500">Your placed orders will show up here along with live shipment tracking.</p>
          <Link to="/products" className="inline-block px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-bold shadow-md">
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.order_id || order.id} className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 hover:border-orange-200 transition space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <div className="text-xs text-gray-400">Order ID: <code className="font-mono text-gray-900 font-bold">{order.order_id || order.id}</code></div>
                  <div className="text-xs text-gray-500 mt-0.5">{order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Recent'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs font-black rounded-full uppercase ${
                    (order.status === 'FAILED' || order.status === 'CANCELLED') 
                      ? 'bg-red-50 text-red-600' 
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {order.status || 'CONFIRMED'}
                  </span>
                  <button
                    onClick={() => navigate(`/tracking/${order.order_id || order.id}`)}
                    className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" /> Track Live
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="text-gray-600">
                  Payment: <span className="font-bold text-gray-900">{order.payment_method || 'ONLINE'}</span>
                </div>
                <div className="text-sm font-black text-gray-900">
                  Total: ₹{Number(order.net_amount || order.total_amount || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
