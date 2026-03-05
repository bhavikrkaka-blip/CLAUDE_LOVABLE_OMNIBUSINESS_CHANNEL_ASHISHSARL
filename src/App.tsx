import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CustomerAuthProvider } from "@/contexts/CustomerAuthContext";
import SessionTracker from "@/components/analytics/SessionTracker";
import AppAnalytics from "@/components/analytics/AppAnalytics";
import AIChatBot from "@/components/customer/AIChatBot";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCreateProduct from "./pages/AdminCreateProduct";
import AdminInventory from "./pages/AdminInventory";
import AdminERPDashboard from "./pages/AdminERPDashboard";
import AdminSales from "./pages/AdminSales";
import SalesAuditLog from "./pages/SalesAuditLog";
import SalesSummary from "./pages/SalesSummary";
import AdminImportProducts from "./pages/AdminImportProducts";
import AdminNewPurchase from "./pages/AdminNewPurchase";
import AdminImageSearch from "./pages/AdminImageSearch";
import AdminImageIntake from "./pages/AdminImageIntake";
import AdminAccounting from "./pages/AdminAccounting";
import POS from "./pages/POS";
import AdminLayout from "@/components/admin/AdminLayout";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerProfile from "./pages/CustomerProfile";
import CustomerOrders from "./pages/CustomerOrders";
import CustomerFavorites from "./pages/CustomerFavorites";
import CustomerSettings from "./pages/CustomerSettings";
import CheckoutPage from "./pages/CheckoutPage";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CustomerAuthProvider>
          <LanguageProvider>
            <TooltipProvider>
              <SessionTracker />
              <AppAnalytics />
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:productId" element={<ProductDetail />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogPost />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  
                  {/* Customer Dashboard Routes */}
                  <Route path="/my-account" element={<CustomerDashboard />}>
                    <Route index element={<CustomerProfile />} />
                    <Route path="orders" element={<CustomerOrders />} />
                    <Route path="favorites" element={<CustomerFavorites />} />
                    <Route path="settings" element={<CustomerSettings />} />
                  </Route>

                  {/* Auth Routes */}
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/dashboard" element={<AdminERPDashboard />} />
                    <Route path="/admin/inventory" element={<AdminInventory />} />
                    <Route path="/admin/create-product" element={<AdminCreateProduct />} />
                    <Route path="/admin/sales" element={<AdminSales />} />
                    <Route path="/admin/sales/audit-log" element={<SalesAuditLog />} />
                    <Route path="/admin/sales-summary" element={<SalesSummary />} />
                    <Route path="/admin/import-products" element={<AdminImportProducts />} />
                    <Route path="/admin/purchases/new" element={<AdminNewPurchase />} />
                    <Route path="/admin/image-search" element={<AdminImageSearch />} />
                    <Route path="/admin/image-intake" element={<AdminImageIntake />} />
                    <Route path="/admin/accounting" element={<AdminAccounting />} />
                    <Route path="/pos" element={<POS />} />
                  </Route>
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <AIChatBot />
              </BrowserRouter>
            </TooltipProvider>
          </LanguageProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
