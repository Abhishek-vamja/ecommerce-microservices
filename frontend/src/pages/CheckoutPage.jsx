import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, Truck, CheckCircle2, Loader2, Plus, Phone, Check, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';

export default function CheckoutPage({ 
  cart, 
  token, 
  user, 
  loadCart, 
  showToast, 
  setIsAuthOpen,
  setActiveRazorpayOrderId,
  setActiveInternalOrderId,
  setPayableAmount,
  setShowRazorpayModal
}) {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('ONLINE'); // 'ONLINE' or 'COD'
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddNewAddress, setShowAddNewAddress] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Address form fields
  const [recipientName, setRecipientName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '9265781891');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('Ahmedabad');
  const [state, setState] = useState('Gujarat');
  const [pincode, setPincode] = useState('380001');

  const fetchAddresses = async () => {
    if (!token) {
      setLoadingAddresses(false);
      return;
    }
    try {
      const res = await api.getAddresses(token);
      let list = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (res && Array.isArray(res.addresses)) {
        list = res.addresses;
      }

      setAddresses(list);
      if (list.length > 0) {
        const defaultAddr = list.find(a => a.is_default) || list[0];
        setSelectedAddressId(defaultAddr.id || defaultAddr.unique_id || '0');
      } else {
        setShowAddNewAddress(true);
      }
    } catch (e) {
      console.error('Failed to load addresses:', e);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
    if (user) {
      if (user.name) setRecipientName(user.name);
      if (user.phone) setPhone(user.phone);
    }
  }, [token, user]);

  const handleSaveAndSelectAddress = async (e) => {
    e.preventDefault();
    if (!addressLine1.trim()) {
      showToast('Please enter your street address');
      return;
    }

    try {
      const payload = {
        recipient_name: recipientName.trim() || user?.name || 'Primary Recipient',
        phone: phone.trim() || '9265781891',
        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim() || null,
        street: addressLine1.trim(),
        city: city.trim() || 'Ahmedabad',
        state: state.trim() || 'Gujarat',
        pincode: pincode.trim() || '380001',
        is_default: addresses.length === 0,
      };

      const res = await api.addAddress(token, payload);
      showToast('Address saved & selected!');
      setShowAddNewAddress(false);
      await fetchAddresses();
      if (res && (res.id || res.unique_id)) {
        setSelectedAddressId(res.id || res.unique_id);
      }
    } catch (err) {
      console.error(err);
      showToast('Could not save address. Please verify details.');
    }
  };

  const handlePlaceOrder = async () => {
    if (!token) {
      setIsAuthOpen(true);
      return;
    }
    if (!cart.items || cart.items.length === 0) {
      showToast('Your cart is empty');
      navigate('/cart');
      return;
    }

    let activeAddress = null;
    if (addresses.length > 0 && selectedAddressId) {
      activeAddress = addresses.find(a => (a.id || a.unique_id) === selectedAddressId);
    }

    if (!activeAddress) {
      if (!addressLine1.trim()) {
        showToast('Please select or enter a delivery address');
        setShowAddNewAddress(true);
        return;
      }
      activeAddress = {
        recipient_name: recipientName || user?.name || 'Customer',
        phone: phone || '9265781891',
        address_line1: addressLine1,
        address_line2: addressLine2,
        street: addressLine1,
        city,
        state,
        pincode,
      };
    }

    setIsPlacingOrder(true);
    try {
      const orderRes = await api.checkout(token, {
        shipping_address: activeAddress,
        payment_method: paymentMethod,
      });

      if (paymentMethod === 'COD') {
        await loadCart();
        showToast('🎉 Order confirmed via Cash on Delivery!');
        navigate(`/tracking/${orderRes.order_id}`);
      } else {
        const payRes = await api.createPaymentOrder(token, {
          order_id: orderRes.order_id,
          amount: orderRes.net_amount,
        });

        setActiveRazorpayOrderId(payRes.razorpay_order_id);
        setActiveInternalOrderId(orderRes.order_id);
        setPayableAmount(orderRes.net_amount);

        // Launch Official Razorpay Standard Checkout SDK
        if (typeof window !== 'undefined' && window.Razorpay) {
          try {
            const options = {
              key: payRes.key_id || 'rzp_test_shopmate_demo',
              amount: Math.round(orderRes.net_amount * 100),
              currency: payRes.currency || 'INR',
              name: 'ShopMate Store',
              description: `Payment for Order #${orderRes.order_number || orderRes.order_id}`,
              image: 'https://cdn-icons-png.flaticon.com/512/3081/3081559.png',
              order_id: payRes.razorpay_order_id?.startsWith('order_') && !payRes.razorpay_order_id?.startsWith('order_demo') ? payRes.razorpay_order_id : undefined,
              prefill: {
                name: activeAddress.recipient_name || user?.name || '',
                email: user?.email || '',
                contact: activeAddress.phone || user?.phone || '',
              },
              theme: {
                color: '#FF5200',
              },
              handler: async function (response) {
                try {
                  await api.verifyPayment(token, {
                    order_id: orderRes.order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                  });
                  await loadCart();
                  showToast('🎉 Payment captured! Order placed successfully.');
                  navigate(`/tracking/${orderRes.order_id}`);
                } catch (vErr) {
                  console.error('Verification error:', vErr);
                  navigate(`/tracking/${orderRes.order_id}`);
                }
              },
              modal: {
                ondismiss: function () {
                  showToast('Payment window closed. You can track or complete payment from orders.');
                  navigate(`/tracking/${orderRes.order_id}`);
                },
              },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
              showToast(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
            });
            rzp.open();
          } catch (err) {
            console.warn('Razorpay SDK init failed, falling back to sandbox simulator:', err);
            setShowRazorpayModal(true);
          }
        } else {
          setShowRazorpayModal(true);
        }
      }
    } catch (e) {
      showToast('Failed to initiate order placement');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Secure Checkout</h1>
        <p className="text-xs text-gray-500 font-medium">⚡ Instant 10-15 Min Express Delivery Guaranteed</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Address & Payment Method */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Delivery Address */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-wide">
                <MapPin className="w-4 h-4 text-orange-600" /> 1. Select Delivery Address
              </div>
              {addresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAddNewAddress(!showAddNewAddress)}
                  className="px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> {showAddNewAddress ? 'Choose Saved' : 'Add New Address'}
                </button>
              )}
            </div>

            {/* Existing Addresses Selection */}
            {!showAddNewAddress && addresses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr) => {
                  const addrId = addr.id || addr.unique_id;
                  const isSelected = selectedAddressId === addrId;
                  return (
                    <div
                      key={addrId}
                      onClick={() => setSelectedAddressId(addrId)}
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer relative space-y-2 ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50/40 shadow-xs' 
                          : 'border-gray-200 hover:border-orange-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-900 text-xs">{addr.recipient_name || user?.name || 'Primary Recipient'}</span>
                          {addr.is_default && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </div>
                      </div>

                      <div className="text-xs text-gray-600 leading-snug">
                        <div className="font-semibold text-gray-800">{addr.address_line1 || addr.street}</div>
                        {addr.address_line2 && <div>{addr.address_line2}</div>}
                        <div className="text-gray-500 font-medium">{addr.city}, {addr.state} - <span className="font-bold text-gray-900">{addr.pincode}</span></div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-gray-500 pt-1 border-t border-gray-100">
                        <Phone className="w-3 h-3 text-orange-500" />
                        <span>{addr.phone || '9265781891'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add New Address Form (inline) */}
            {(showAddNewAddress || addresses.length === 0) && (
              <form onSubmit={handleSaveAndSelectAddress} className="p-5 bg-gradient-to-br from-orange-50/40 to-amber-50/20 rounded-2xl border border-orange-100 space-y-3">
                <div className="text-xs font-black text-gray-900 uppercase">Enter Delivery Location</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Abhishek Vamja"
                      value={recipientName}
                      onChange={e => setRecipientName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9265781891"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Flat / House No / Building / Street Address</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 402, Sunset Heights, CG Road"
                    value={addressLine1}
                    onChange={e => setAddressLine1(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Landmark / Area (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Navrangpura Police Station"
                    value={addressLine2}
                    onChange={e => setAddressLine2(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={e => setState(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Pincode</label>
                    <input
                      type="text"
                      required
                      value={pincode}
                      onChange={e => setPincode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl cursor-pointer shadow-md transition"
                  >
                    Save & Use Address
                  </button>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAddNewAddress(false)}
                      className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl cursor-pointer border border-gray-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* 2. Payment Option */}
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-wide">
              <CreditCard className="w-4 h-4 text-orange-600" /> 2. Payment Method
            </div>

            <div className="space-y-3">
              <label 
                onClick={() => setPaymentMethod('ONLINE')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
                  paymentMethod === 'ONLINE' ? 'border-orange-500 bg-orange-50/40 shadow-xs' : 'border-gray-200 hover:border-orange-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-gray-900">Online Payment (Razorpay Official)</div>
                    <div className="text-[11px] text-gray-500">UPI (GPay / PhonePe / Paytm), Cards, NetBanking</div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  paymentMethod === 'ONLINE' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                }`}>
                  {paymentMethod === 'ONLINE' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </div>
              </label>

              <label 
                onClick={() => setPaymentMethod('COD')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
                  paymentMethod === 'COD' ? 'border-orange-500 bg-orange-50/40 shadow-xs' : 'border-gray-200 hover:border-orange-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-gray-900">Cash on Delivery (COD)</div>
                    <div className="text-[11px] text-gray-500">Pay when your order arrives at your doorstep</div>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  paymentMethod === 'COD' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                }`}>
                  {paymentMethod === 'COD' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Right: Checkout Order Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 space-y-4">
            <h2 className="text-base font-black text-gray-900 border-b border-gray-100 pb-3">Bill Breakdown</h2>

            <div className="space-y-2.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Items ({cart.item_count})</span>
                <span className="font-bold text-gray-900">₹{cart.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Delivery Partner Fee</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-gray-400">
                <span>Estimated Delivery</span>
                <span className="font-bold text-orange-600">⚡ 10-15 Mins</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-100 text-sm font-black text-gray-900 items-baseline">
                <span>Total Payable</span>
                <span className="text-lg text-orange-600">₹{cart.subtotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-black rounded-2xl text-xs shadow-xl shadow-orange-200 transition transform active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing Order...
                </>
              ) : paymentMethod === 'ONLINE' ? (
                <>
                  <CreditCard className="w-4 h-4" /> Pay with Razorpay ₹{cart.subtotal.toLocaleString('en-IN')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Confirm Cash on Delivery
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Safe & Secure Payments</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
