import { Routes, Route, Navigate } from "react-router-dom";

import POS from "./pages/pos/POSPage";
import LoginPage from "./pages/LoginPage";

import AdminLayout from "./layout/AdminLayout";

import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Sales from "./pages/admin/Sales";
import Stock from "./pages/admin/Stock";
import Reports from "./pages/admin/Reports";
import Staff from "./pages/admin/Staff";
import Settings from "./pages/admin/Settings";
import Profile from "./pages/admin/Profile";
import SupplierPage from "./pages/admin/Supplier";
import PurchasePage from "./pages/admin/Purchase";
import PurchaseHistory from "./pages/admin/PurchaseHistory";
import CustomerPage from "./pages/admin/Customer";
import DailyReport from "./pages/admin/DailyReport";
import GSTReport from "./pages/admin/GSTReport";

import AuthGate from "./context/AuthGate";
import SignupPage from "./pages/SignUpPage";
import ProtectedRoute from "./context/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      {/* LOGIN */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* ROOT */}
      <Route
        path="/"
        element={
          <AuthGate>
            <Navigate to="/pos" />
          </AuthGate>
        }
      />

      {/* POS */}
      <Route
        path="/pos"
        element={
          <AuthGate>
            <POS />
          </AuthGate>
        }
      />

      {/* ADMIN */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["owner", "manager"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="sales" element={<Sales />} />
        <Route path="customer" element={<CustomerPage />} />
        <Route path="stock" element={<Stock />} />
        <Route path="reports" element={<Reports />} />
        <Route path="supplier" element={<SupplierPage />} />
        <Route path="purchase" element={<PurchasePage />} />
        <Route path="purchases" element={<PurchaseHistory />} />
        <Route path="staff" element={<Staff />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
        <Route path="/admin/daily-report" element={<DailyReport />} />
        <Route path="/admin/gst-report" element={<GSTReport />} />
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}