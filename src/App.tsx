import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StoreProvider } from "./context/StoreContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";

// Page imports
import { Home } from "./pages/Home";
import { Shop } from "./pages/Shop";
import { CategoryProducts } from "./pages/CategoryProducts";
import { ProductDetails } from "./pages/ProductDetails";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { UserDashboard } from "./pages/UserDashboard";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminDashboard } from "./pages/AdminDashboard";
import { PaymentPage } from "./pages/PaymentPage";
import { SupportChat } from "./components/SupportChat";
import { Unauthorized } from "./pages/Unauthorized";

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <div id="root-app-container" className="min-h-screen bg-[#050505] text-[#FFFFFF] flex flex-col font-sans leading-normal selection:bg-red-950">
          
          {/* Main Top Header Navbar */}
          <Navbar />

          {/* Core App View Container */}
          <main id="main-route-display" className="flex-grow">
            <Routes>
              
              {/* Storefront Path */}
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Navigate to="/" replace />} />

              {/* Browse Catalog Directory */}
              <Route path="/shop" element={<Shop />} />
              
              {/* Individual procurement category products */}
              <Route path="/categories/:slug" element={<CategoryProducts />} />

              {/* Single item specifications panel */}
              <Route path="/products/:id" element={<ProductDetails />} />

              {/* Active cart auditor bag */}
              <Route path="/cart" element={<Cart />} />

              {/* Procurement transacting form */}
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/payment/:orderId" element={<PaymentPage />} />

              {/* Customer authentications */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<UserDashboard />} />

              {/* Unauthorized landing */}
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Private administrative backdoors */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />

              {/* Fallback route redirection */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </main>

          {/* Real-Time Live Support floating helpdesk widget */}
          <SupportChat />

          {/* Global Branding footer element */}
          <Footer />

        </div>
      </BrowserRouter>
    </StoreProvider>
  );
}
