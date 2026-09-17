import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('shopmate_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('shopmate_user') || 'null'));
  const [currentScreen, setCurrentScreen] = useState('home'); // home, products, details, cart, wishlist, checkout, orders, tracking, profile
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState({ items: [], subtotal: 0, item_count: 0 });
  const [wishlist, setWishlist] = useState([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [locationPincode, setLocationPincode] = useState('Ahmedabad 380001');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (token) {
      fetchUserData();
      fetchCartData();
      fetchWishlistData();
    }
  }, [token]);

  const fetchUserData = async () => {
    try {
      const res = await api.getProfile(token);
      if (res.unique_id) {
        setUser(res);
        if (res.default_pincode) {
          setLocationPincode(`Ahmedabad ${res.default_pincode}`);
        }
      }
    } catch (e) {
      console.warn('Profile fetch failed:', e);
    }
  };

  const fetchCartData = async () => {
    if (!token) return;
    try {
      const res = await api.getCart(token);
      if (res.items) {
        setCart(res);
      }
    } catch (e) {
      console.warn('Cart fetch failed:', e);
    }
  };

  const fetchWishlistData = async () => {
    if (!token) return;
    try {
      const res = await api.getWishlist(token);
      if (Array.isArray(res)) {
        setWishlist(res);
      }
    } catch (e) {
      console.warn('Wishlist fetch failed:', e);
    }
  };

  const loginUser = (authToken, userData) => {
    setToken(authToken);
    setUser(userData);
    localStorage.setItem('shopmate_token', authToken);
    localStorage.setItem('shopmate_user', JSON.stringify(userData));
    setIsAuthOpen(false);
    showToast(`Welcome back, ${userData?.name || 'Customer'}!`);
  };

  const logoutUser = () => {
    setToken('');
    setUser(null);
    setCart({ items: [], subtotal: 0, item_count: 0 });
    setWishlist([]);
    localStorage.removeItem('shopmate_token');
    localStorage.removeItem('shopmate_user');
    setCurrentScreen('home');
    showToast('Logged out successfully');
  };

  const addToCart = async (product) => {
    if (!token) {
      setIsAuthOpen(true);
      return;
    }
    try {
      await api.addToCart(token, {
        product_id: product.unique_id || product.id,
        product_name: product.name,
        unit_price: product.price,
        image_url: product.image_url,
        quantity: 1,
        seller_id: product.seller_id || 'seller_technova_elec',
        shop_name: product.shop_name || 'TechNova Electronics',
      });
      await fetchCartData();
      showToast(`${product.name} added to cart!`);
    } catch (e) {
      showToast('Failed to add item to cart');
    }
  };

  const toggleWishlist = async (product) => {
    if (!token) {
      setIsAuthOpen(true);
      return;
    }
    try {
      const res = await api.toggleWishlist(token, {
        product_id: product.unique_id || product.id,
        product_name: product.name,
        unit_price: product.price,
        image_url: product.image_url,
      });
      await fetchWishlistData();
      showToast(res.action === 'added' ? 'Added to wishlist!' : 'Removed from wishlist');
    } catch (e) {
      showToast('Wishlist update failed');
    }
  };

  const navigateToProduct = (productId) => {
    setSelectedProductId(productId);
    setCurrentScreen('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToTracking = (orderId) => {
    setSelectedTrackingOrderId(orderId);
    setCurrentScreen('tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider
      value={{
        token,
        user,
        currentScreen,
        setCurrentScreen,
        selectedProductId,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        cart,
        wishlist,
        isAuthOpen,
        setIsAuthOpen,
        locationPincode,
        setLocationPincode,
        toastMessage,
        showToast,
        loginUser,
        logoutUser,
        addToCart,
        toggleWishlist,
        fetchCartData,
        fetchWishlistData,
        navigateToProduct,
        navigateToTracking,
        selectedTrackingOrderId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
