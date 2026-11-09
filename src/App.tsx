import { Suspense, lazy, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";

import { ThemeProvider } from "@/context/ThemeContext";
import { DesignSettingsProvider } from "@/hooks/useDesignSettings";
import Index from "./pages/Index";
import ScrollToTop from "./components/ScrollToTop";
import WhatsAppFab from "./components/WhatsAppFab";
import MobileBottomNav from "./components/MobileBottomNav";
import AnalyticsLoader from "./components/AnalyticsLoader";
import { LoadingScreen } from "./components/LoadingScreen";

const Auth = lazy(() => import("./pages/Auth"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));

const Shop = lazy(() => import("./pages/Shop"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Profile = lazy(() => import("./pages/Profile"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const ReturnPolicy = lazy(() => import("./pages/ReturnPolicy"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Customize = lazy(() => import("./pages/Customize"));
const AdminDashboard = lazy(() => import("./pages/admin").then(m => ({ default: m.AdminDashboard })));
const NotFound = lazy(() => import("./pages/NotFound"));
const Forbidden = lazy(() => import("./pages/Forbidden"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));
const OrderFailed = lazy(() => import("./pages/OrderFailed"));
const UserNotifications = lazy(() => import("./pages/UserNotifications"));

const WhatsAppFabWrapper = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  if (isAdmin) return null;
  return <WhatsAppFab />;
};

const MobileBottomNavWrapper = () => {
  const location = useLocation();
  const hide =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/auth") ||
    location.pathname.startsWith("/checkout");
  if (hide) return null;
  return <MobileBottomNav />;
};

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <DesignSettingsProvider>
            
            
              <TooltipProvider>
                <Toaster />
                <Sonner />

                <BrowserRouter>
                  <ScrollToTop />
                  <AnalyticsLoader />
                  <Suspense fallback={<LoadingScreen />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      
                      <Route path="/shop" element={<Shop />} />
                      <Route path="/category/:slug" element={<Shop />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/return-policy" element={<ReturnPolicy />} />
                      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                      <Route path="/terms-conditions" element={<TermsConditions />} />
                      <Route path="/customize" element={<Customize />} />
                      <Route path="/admin/*" element={<AdminDashboard />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/order-tracking" element={<OrderTracking />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/order-success" element={<OrderSuccess />} />
                      <Route path="/order-failed" element={<OrderFailed />} />
                      <Route path="/403" element={<Forbidden />} />
                      <Route path="/forbidden" element={<Forbidden />} />
                      <Route path="/notifications" element={<UserNotifications />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  <WhatsAppFabWrapper />
                  <MobileBottomNavWrapper />
                </BrowserRouter>
              </TooltipProvider>
            </DesignSettingsProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;