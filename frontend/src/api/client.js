const getApiBase = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return 'http://localhost:8000/api';
};

export const API_BASE = getApiBase();

const reqHeaders = (token, extra = {}) => ({
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
  ...extra,
});

export const api = {
  // Auth & User
  async sendOtp(email, name = '') {
    const res = await fetch(`${API_BASE}/user/auth`, {
      method: 'POST',
      headers: reqHeaders(),
      body: JSON.stringify({ email, name }),
    });
    return res.json();
  },

  async verifyOtp(userId, otp) {
    const res = await fetch(`${API_BASE}/user/verify`, {
      method: 'POST',
      headers: reqHeaders(),
      body: JSON.stringify({ user_id: userId, otp: parseInt(otp) }),
    });
    return res.json();
  },

  async getProfile(token) {
    const res = await fetch(`${API_BASE}/user/me`, {
      headers: reqHeaders(token),
    });
    return res.json();
  },

  async getAddresses(token) {
    const res = await fetch(`${API_BASE}/user/addresses`, {
      headers: reqHeaders(token),
    });
    return res.json();
  },

  async addAddress(token, address) {
    const res = await fetch(`${API_BASE}/user/addresses`, {
      method: 'POST',
      headers: reqHeaders(token),
      body: JSON.stringify(address),
    });
    return res.json();
  },

  async deleteAddress(token, addressId) {
    const res = await fetch(`${API_BASE}/user/addresses/${addressId}`, {
      method: 'DELETE',
      headers: reqHeaders(token),
    });
    return res.json();
  },

  // Products & Categories
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/product/?${query}`, {
      headers: reqHeaders(),
    });
    return res.json();
  },

  async getProductDetails(id) {
    const res = await fetch(`${API_BASE}/product/${id}`, {
      headers: reqHeaders(),
    });
    return res.json();
  },

  async getCategories() {
    const res = await fetch(`${API_BASE}/categories`, {
      headers: reqHeaders(),
    });
    return res.json();
  },

  async getFilterMeta() {
    const res = await fetch(`${API_BASE}/filter-meta`, {
      headers: reqHeaders(),
    });
    return res.json();
  },

  async getBanners(placement) {
    const q = placement ? `?placement=${placement}` : '';
    const res = await fetch(`${API_BASE}/promotions/banners${q}`, {
      headers: reqHeaders(),
    });
    return res.json();
  },

  // Cart
  async getCart(token) {
    const res = await fetch(`${API_BASE}/cart`, {
      headers: reqHeaders(token),
    });
    return res.json();
  },

  async addToCart(token, item) {
    const res = await fetch(`${API_BASE}/cart/items`, {
      method: 'POST',
      headers: reqHeaders(token),
      body: JSON.stringify(item),
    });
    return res.json();
  },

  async updateCartQty(token, itemId, quantity) {
    const res = await fetch(`${API_BASE}/cart/items/${itemId}`, {
      method: 'PUT',
      headers: reqHeaders(token),
      body: JSON.stringify({ quantity }),
    });
    return res.json();
  },

  async deleteCartItem(token, itemId) {
    const res = await fetch(`${API_BASE}/cart/items/${itemId}`, {
      method: 'DELETE',
      headers: reqHeaders(token),
    });
    return res.json();
  },

  // Wishlist
  async getWishlist(token) {
    const res = await fetch(`${API_BASE}/wishlist`, {
      headers: reqHeaders(token),
    });
    return res.json();
  },

  async toggleWishlist(token, item) {
    const res = await fetch(`${API_BASE}/wishlist/toggle`, {
      method: 'POST',
      headers: reqHeaders(token),
      body: JSON.stringify(item),
    });
    return res.json();
  },

  // Orders
  async checkout(token, payload) {
    const res = await fetch(`${API_BASE}/order/checkout`, {
      method: 'POST',
      headers: reqHeaders(token),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getMyOrders(token) {
    const res = await fetch(`${API_BASE}/order/my-orders`, {
      headers: reqHeaders(token),
    });
    return res.json();
  },

  async getTracking(orderId) {
    const res = await fetch(`${API_BASE}/order/${orderId}/tracking`, {
      headers: reqHeaders(),
    });
    return res.json();
  },

  // Payment
  async createPaymentOrder(token, payload) {
    const res = await fetch(`${API_BASE}/payment/create-order`, {
      method: 'POST',
      headers: reqHeaders(token),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async verifyPayment(payload) {
    const res = await fetch(`${API_BASE}/payment/verify`, {
      method: 'POST',
      headers: reqHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};

