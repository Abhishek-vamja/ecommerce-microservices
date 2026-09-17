import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { DashboardLayout } from './components/DashboardLayout';
import { LandingPage } from './pages/LandingPage';
import { SellerLoginPage } from './pages/SellerLoginPage';
import { SellerRegisterPage } from './pages/SellerRegisterPage';
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { SellerProductsPage } from './pages/SellerProductsPage';
import { SellerOrdersPage } from './pages/SellerOrdersPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminProfitLedgerPage } from './pages/AdminProfitLedgerPage';
import { AdminSellersPage } from './pages/AdminSellersPage';

// Public Layout with Top Header
const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar />
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
    </div>
  );
};

// Protected Seller Dashboard Layout with Sidebar
const ProtectedSellerLayout = () => {
  const { isSellerAuth, loading } = useAuth();
  if (loading) return null;
  if (!isSellerAuth) return <Navigate to="/seller/login" replace />;

  return (
    <DashboardLayout role="seller">
      <Outlet />
    </DashboardLayout>
  );
};

// Protected Admin Dashboard Layout with Sidebar
const ProtectedAdminLayout = () => {
  const { isAdminAuth, loading } = useAuth();
  if (loading) return null;
  if (!isAdminAuth) return <Navigate to="/admin/login" replace />;

  return (
    <DashboardLayout role="admin">
      <Outlet />
    </DashboardLayout>
  );
};

const SellerIndex = () => {
  const { isSellerAuth } = useAuth();
  return <Navigate to={isSellerAuth ? "/seller/dashboard" : "/seller/login"} replace />;
};

const AdminIndex = () => {
  const { isAdminAuth } = useAuth();
  return <Navigate to={isAdminAuth ? "/admin/dashboard" : "/admin/login"} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public / Auth Pages */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/seller" element={<SellerIndex />} />
            <Route path="/seller/login" element={<SellerLoginPage />} />
            <Route path="/seller/register" element={<SellerRegisterPage />} />
            <Route path="/admin" element={<AdminIndex />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
          </Route>

          {/* Seller Authenticated Portal (Sidebar Layout) */}
          <Route element={<ProtectedSellerLayout />}>
            <Route path="/seller/dashboard" element={<SellerDashboardPage />} />
            <Route path="/seller/products" element={<SellerProductsPage />} />
            <Route path="/seller/orders" element={<SellerOrdersPage />} />
          </Route>

          {/* Admin Authenticated Portal (Sidebar Layout) */}
          <Route element={<ProtectedAdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/profits" element={<AdminProfitLedgerPage />} />
            <Route path="/admin/sellers" element={<AdminSellersPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

