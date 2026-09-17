import React, { createContext, useContext, useState, useEffect } from 'react';
import { portalApi } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [sellerToken, setSellerToken] = useState(
    () => localStorage.getItem('shopmate_seller_token') || localStorage.getItem('nexora_seller_token') || ''
  );
  const [seller, setSeller] = useState(() => {
    const saved = localStorage.getItem('shopmate_seller_info') || localStorage.getItem('nexora_seller_info');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [adminToken, setAdminToken] = useState(
    () => localStorage.getItem('shopmate_admin_token') || localStorage.getItem('nexora_admin_token') || ''
  );
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('shopmate_admin_info') || localStorage.getItem('nexora_admin_info');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Re-verify profile once on initial mount if token already present
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('shopmate_seller_token') || localStorage.getItem('nexora_seller_token');
      if (token) {
        try {
          const profile = await portalApi.getSellerProfile(token);
          if (profile) {
            setSeller(profile);
            localStorage.setItem('shopmate_seller_info', JSON.stringify(profile));
          }
        } catch (err) {
          if (err.message && (err.message.includes('401') || err.message.includes('Unauthorized') || err.message.includes('Invalid authentication token'))) {
            sellerLogout();
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const sellerLogin = (token, sellerData) => {
    setSellerToken(token);
    setSeller(sellerData);
    localStorage.setItem('shopmate_seller_token', token);
    localStorage.setItem('shopmate_seller_info', JSON.stringify(sellerData));
  };

  const sellerLogout = () => {
    setSellerToken('');
    setSeller(null);
    localStorage.removeItem('shopmate_seller_token');
    localStorage.removeItem('shopmate_seller_info');
    localStorage.removeItem('nexora_seller_token');
    localStorage.removeItem('nexora_seller_info');
  };

  const adminLogin = (key, info = { role: 'Platform Super Admin', email: 'admin@shopmate.com' }) => {
    setAdminToken(key);
    setAdminUser(info);
    localStorage.setItem('shopmate_admin_token', key);
    localStorage.setItem('shopmate_admin_info', JSON.stringify(info));
  };

  const adminLogout = () => {
    setAdminToken('');
    setAdminUser(null);
    localStorage.removeItem('shopmate_admin_token');
    localStorage.removeItem('shopmate_admin_info');
    localStorage.removeItem('nexora_admin_token');
    localStorage.removeItem('nexora_admin_info');
  };

  return (
    <AuthContext.Provider
      value={{
        sellerToken,
        seller,
        isSellerAuth: Boolean(sellerToken && seller),
        sellerLogin,
        sellerLogout,
        adminToken,
        adminUser,
        isAdminAuth: Boolean(adminToken),
        adminLogin,
        adminLogout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
