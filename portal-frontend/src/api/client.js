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

async function safeApiFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg =
        (data && (data.detail || data.message || (typeof data.content === 'string' ? data.content : data.content?.message))) ||
        `Request failed with status ${res.status}`;
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
      throw new Error(
        'Unable to connect to the backend server (http://localhost:8000). Please check that the API Gateway and microservices are running.'
      );
    }
    throw err;
  }
}

export const portalApi = {
  // --- SELLER AUTH (OTP BASED) ---
  async registerSeller(payload) {
    return safeApiFetch(`${API_BASE}/user/seller/register`, {
      method: 'POST',
      headers: reqHeaders(),
      body: JSON.stringify(payload),
    });
  },

  async sendSellerOtp(email) {
    return safeApiFetch(`${API_BASE}/user/seller/auth`, {
      method: 'POST',
      headers: reqHeaders(),
      body: JSON.stringify({ email }),
    });
  },

  async verifySellerOtp(userId, otp) {
    return safeApiFetch(`${API_BASE}/user/seller/verify`, {
      method: 'POST',
      headers: reqHeaders(),
      body: JSON.stringify({ user_id: userId, otp: Number(otp) }),
    });
  },

  // --- ADMIN AUTH (OTP BASED - LOGIN ONLY) ---
  async sendAdminOtp(email) {
    return safeApiFetch(`${API_BASE}/user/admin/auth`, {
      method: 'POST',
      headers: reqHeaders(),
      body: JSON.stringify({ email }),
    });
  },

  async verifyAdminOtp(userId, otp) {
    return safeApiFetch(`${API_BASE}/user/admin/verify`, {
      method: 'POST',
      headers: reqHeaders(),
      body: JSON.stringify({ user_id: userId, otp: Number(otp) }),
    });
  },


  async getSellerProfile(token) {
    return safeApiFetch(`${API_BASE}/user/seller/me`, {
      headers: reqHeaders(token),
    });
  },

  // --- SELLER PRODUCTS ---
  async getMyProducts(token, sellerId) {
    try {
      const res = await safeApiFetch(`${API_BASE}/product/seller/my-products?seller_id=${sellerId}`, {
        headers: reqHeaders(token),
      });
      if (Array.isArray(res)) return res;
      if (res?.data && Array.isArray(res.data)) return res.data;
      if (res?.items && Array.isArray(res.items)) return res.items;
      return [];
    } catch {
      const res = await safeApiFetch(`${API_BASE}/product/?seller_id=${sellerId}&limit=100`, {
        headers: reqHeaders(token),
      });
      if (Array.isArray(res)) return res;
      if (res?.data && Array.isArray(res.data)) return res.data;
      if (res?.items && Array.isArray(res.items)) return res.items;
      return [];
    }
  },

  async createProduct(token, productData) {
    return safeApiFetch(`${API_BASE}/product/seller/add`, {
      method: 'POST',
      headers: reqHeaders(token),
      body: JSON.stringify(productData),
    });
  },

  async updateProduct(token, productId, productData) {
    return safeApiFetch(`${API_BASE}/product/seller/${productId}`, {
      method: 'PUT',
      headers: reqHeaders(token),
      body: JSON.stringify(productData),
    });
  },

  async deleteProduct(token, productId) {
    return safeApiFetch(`${API_BASE}/product/seller/${productId}`, {
      method: 'DELETE',
      headers: reqHeaders(token),
    });
  },

  async getCategories() {
    return safeApiFetch(`${API_BASE}/categories`, {
      headers: reqHeaders(),
    });
  },

  // --- SELLER ORDERS & 5% DEDUCTION ANALYTICS ---
  async getSellerAnalytics(sellerId, token) {
    return safeApiFetch(`${API_BASE}/order/seller/analytics?seller_id=${sellerId}`, {
      headers: reqHeaders(token),
    });
  },

  async getSellerOrders(sellerId, token) {
    return safeApiFetch(`${API_BASE}/order/seller/orders?seller_id=${sellerId}`, {
      headers: reqHeaders(token),
    });
  },

  async updateOrderStatus(orderId, status, message, token) {
    return safeApiFetch(`${API_BASE}/order/seller/${orderId}/status`, {
      method: 'PUT',
      headers: reqHeaders(token),
      body: JSON.stringify({ status, message }),
    });
  },

  // --- ADMIN PORTAL & 5% COMMISSION PROFIT LEDGER ---
  async getAdminProfits(adminToken) {
    return safeApiFetch(`${API_BASE}/order/admin/profits`, {
      headers: reqHeaders(adminToken),
    });
  },

  async getAdminSellersSummary(adminToken) {
    return safeApiFetch(`${API_BASE}/order/admin/sellers-summary`, {
      headers: reqHeaders(adminToken),
    });
  },

  async getAdminSellersList(adminToken) {
    return safeApiFetch(`${API_BASE}/user/admin/sellers`, {
      headers: reqHeaders(adminToken),
    });
  },

  async toggleSellerStatus(sellerId, adminToken) {
    return safeApiFetch(`${API_BASE}/user/admin/sellers/${sellerId}/toggle-status`, {
      method: 'PUT',
      headers: reqHeaders(adminToken),
    });
  },
};

