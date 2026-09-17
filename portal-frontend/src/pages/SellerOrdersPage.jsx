import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { portalApi } from '../api/client';
import { 
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  AlertCircle, 
  RefreshCw, 
  ChevronDown,
  DollarSign,
  Package,
  Calendar
} from 'lucide-react';

export const SellerOrdersPage = () => {
  const { seller, sellerToken } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadOrders = async () => {
    if (!seller?.id) return;
    try {
      setLoading(true);
      const data = await portalApi.getSellerOrders(seller.id, sellerToken);
      setOrders(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load seller orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [seller?.id]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      setError('');
      setSuccess('');
      await portalApi.updateOrderStatus(
        orderId, 
        newStatus, 
        `Order status updated to ${newStatus} by seller (${seller?.shop_name}).`, 
        sellerToken
      );
      setSuccess(`Order #${orderId.slice(0, 8)} status updated to ${newStatus}`);
      await loadOrders();
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'ALL') return true;
    return o.status === filter;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-blue-600" />
            <span>Store Orders & Fulfillment</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track customer purchases, update delivery progress, and monitor 95% settlement payouts
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['ALL', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filter === status
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {status === 'ALL' ? 'All Orders' : status}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-slate-400">Fetching customer orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-[1.5]" />
          <h3 className="text-sm font-bold text-slate-700">No matching orders</h3>
          <p className="text-xs text-slate-400 mt-1">There are no orders with status "{filter}".</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              {/* Top Row: ID, Date, Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs sm:text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
                    {order.order_number}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{order.created_at ? new Date(order.created_at).toLocaleString('en-IN') : 'N/A'}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    order.payment_status === 'PAID'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    Payment: {order.payment_status} ({order.payment_method})
                  </span>
                </div>

                {/* Fulfillment Status Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 hidden md:inline">Fulfillment Stage:</span>
                  <select
                    disabled={updatingId === order.id}
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-blue-700 focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50 font-medium"
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PROCESSING">PROCESSING</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="DELIVERED">DELIVERED</option>
                  </select>
                </div>
              </div>

              {/* Items & Financial Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                
                {/* Items Purchased */}
                <div className="lg:col-span-2 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Store Items Purchased</h4>
                  <div className="space-y-2">
                    {(order.items || []).map((item) => (
                      <div key={item.id || item.product_id} className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            <img src={item.image_url} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{item.product_name}</div>
                            <div className="text-slate-500 text-[11px] font-medium">
                              Qty: {item.quantity || 1} × ₹{Number(item.unit_price || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-slate-900">₹{Number(item.total_price || 0).toFixed(2)}</div>
                          <div className="text-[10px] text-amber-600 font-medium">
                            Fee (5%): -₹{Number(item.platform_fee || 0).toFixed(2)}
                          </div>
                          <div className="text-[11px] text-emerald-700 font-bold">
                            Payout: ₹{Number(item.seller_payout || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.shipping_address && (
                    <div className="text-[11px] text-slate-600 flex items-start gap-1.5 mt-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Shipping Destination:</strong>{' '}
                        {typeof order.shipping_address === 'object'
                          ? `${order.shipping_address.recipient_name || ''} (${order.shipping_address.phone || ''}) - ${order.shipping_address.address_line1 || ''}, ${order.shipping_address.city || ''}, ${order.shipping_address.state || ''} ${order.shipping_address.pincode || ''}`
                          : String(order.shipping_address)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Settlement Card for this Order */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Order Settlement</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Items Gross Total:</span>
                        <span className="font-bold text-slate-900">₹{Number(order.seller_gross_total || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-amber-600 font-medium">
                        <span>ShopMate Commission (5%):</span>
                        <span>-₹{Number(order.platform_fee_5pct || 0).toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex justify-between text-emerald-700 font-black text-sm">
                        <span>Your Net Payout (95%):</span>
                        <span>₹{Number(order.seller_net_payout || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 text-[11px] text-slate-400 font-medium">
                    Settlement automatically credited to bank account on file.
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
