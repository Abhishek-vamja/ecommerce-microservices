import React, { useState, useEffect } from 'react';
import { User, MapPin, Trash2, CheckCircle2, Plus, Phone } from 'lucide-react';
import { api } from '../api/client';

export default function ProfilePage({ token, user, setUser, showToast, setIsAuthOpen, loadProfile }) {
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);

  // Form states
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('Ahmedabad');
  const [state, setState] = useState('Gujarat');
  const [pincode, setPincode] = useState('380001');

  const fetchAddresses = async () => {
    if (!token) return;
    setLoadingAddresses(true);
    try {
      const res = await api.getAddresses(token);
      if (Array.isArray(res)) {
        setAddresses(res);
      } else if (res && Array.isArray(res.addresses)) {
        setAddresses(res.addresses);
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
      setRecipientName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [token, user]);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!addressLine1.trim()) {
      showToast('Please enter your street / address line');
      return;
    }

    try {
      const payload = {
        recipient_name: recipientName.trim() || user?.name || 'Primary Recipient',
        phone: phone.trim() || '9999999999',
        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim() || null,
        street: addressLine1.trim(),
        city: city.trim() || 'Ahmedabad',
        state: state.trim() || 'Gujarat',
        pincode: pincode.trim() || '380001',
        is_default: addresses.length === 0,
      };

      await api.addAddress(token, payload);
      showToast('🎉 Delivery address saved successfully!');
      setShowAddAddress(false);
      setAddressLine1('');
      setAddressLine2('');
      await fetchAddresses();
      if (loadProfile) loadProfile();
    } catch (err) {
      console.error(err);
      showToast('Could not save address. Please check details.');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.deleteAddress(token, addressId);
      showToast('Address deleted');
      await fetchAddresses();
    } catch (err) {
      showToast('Could not delete address');
    }
  };

  if (!token) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <User className="w-12 h-12 text-gray-400 mx-auto" />
        <h2 className="text-2xl font-black text-gray-900">Sign in to view your profile</h2>
        <button onClick={() => setIsAuthOpen(true)} className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-xs cursor-pointer shadow-md">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Profile & Preferences</h1>
        <p className="text-xs text-gray-500 font-medium">Manage your delivery addresses and account information</p>
      </div>

      {/* Account Info Card */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 space-y-4">
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider text-orange-600">Account Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-gray-400 text-[11px] font-semibold">Customer Name</span>
            <div className="font-black text-gray-900 text-sm mt-0.5">{user?.name || 'ShopMate Member'}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <span className="text-gray-400 text-[11px] font-semibold">Registered Email</span>
            <div className="font-black text-gray-900 text-sm mt-0.5">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Saved Addresses Card */}
      <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-100 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider text-orange-600">Saved Delivery Addresses</h2>
            <p className="text-xs text-gray-400 mt-0.5">Used for 10-15 minute express delivery and automatic checkout</p>
          </div>
          <button
            onClick={() => setShowAddAddress(!showAddAddress)}
            className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Address
          </button>
        </div>

        {/* Address Form Modal/Accordion */}
        {showAddAddress && (
          <form onSubmit={handleAddAddress} className="p-6 bg-gradient-to-br from-orange-50/50 to-amber-50/30 rounded-3xl border border-orange-100 space-y-4">
            <div className="text-xs font-black text-gray-900 uppercase tracking-wider">New Delivery Address</div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Recipient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Abhishek Vamja"
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9265781891"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Flat / House No / Building / Street</label>
              <input
                type="text"
                required
                placeholder="e.g. 402, Sunset Heights, CG Road"
                value={addressLine1}
                onChange={e => setAddressLine1(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Landmark / Area (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Near Navrangpura Police Station"
                value={addressLine2}
                onChange={e => setAddressLine2(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">State</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Pincode</label>
                <input
                  type="text"
                  required
                  value={pincode}
                  onChange={e => setPincode(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl cursor-pointer shadow-md transition"
              >
                Save Delivery Address
              </button>
              <button
                type="button"
                onClick={() => setShowAddAddress(false)}
                className="px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl cursor-pointer border border-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Addresses List or Empty State */}
        {addresses.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-gray-50 border border-dashed border-gray-200 space-y-3">
            <MapPin className="w-10 h-10 text-gray-300 mx-auto" />
            <div>
              <div className="text-sm font-black text-gray-900">No saved delivery addresses</div>
              <p className="text-xs text-gray-500 mt-1">Add your primary address to enable 10-15 min express delivery.</p>
            </div>
            {!showAddAddress && (
              <button
                onClick={() => setShowAddAddress(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Address Now
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id || addr.unique_id}
                className="p-5 rounded-2xl bg-white border border-gray-200 hover:border-orange-300 transition shadow-xs space-y-3 relative group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-900 text-sm">{addr.recipient_name || user?.name || 'Primary Recipient'}</span>
                    {addr.is_default && (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Default
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteAddress(addr.id || addr.unique_id)}
                    className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition cursor-pointer"
                    title="Delete address"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-xs text-gray-600 space-y-0.5">
                  <div className="font-semibold text-gray-800">{addr.address_line1 || addr.street}</div>
                  {addr.address_line2 && <div className="text-gray-500">{addr.address_line2}</div>}
                  <div className="text-gray-500">{addr.city}, {addr.state} - <span className="font-bold text-gray-900">{addr.pincode}</span></div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  <Phone className="w-3.5 h-3.5 text-orange-500" />
                  <span>{addr.phone || '9265781891'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
