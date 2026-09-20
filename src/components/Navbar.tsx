import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { ShoppingCart, User, ShieldAlert, LogOut, Menu, X, Landmark } from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, profile, cart, logout } = useStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-black text-white border-b border-zinc-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="h-7 w-1 bg-red-600"></div>
              <span className="text-2xl font-black tracking-tighter font-display text-white">
                EDGE<span className="text-red-600">MART</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-sm font-semibold tracking-wider hover:text-red-500 uppercase transition">
              Home
            </Link>
            <Link to="/shop" className="text-sm font-semibold tracking-wider hover:text-red-500 uppercase transition">
              Shop Categories
            </Link>
            
            {profile?.role === "admin" && (
              <Link
                to="/admin/dashboard"
                className="flex items-center space-x-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-full uppercase tracking-wider transition"
              >
                <ShieldAlert size={14} className="text-white" />
                <span>Admin Console</span>
              </Link>
            )}

            {user && (
              <Link to="/dashboard" className="text-sm font-semibold tracking-wider hover:text-red-500 uppercase transition flex items-center space-x-1">
                <User size={15} />
                <span>Dashboard</span>
              </Link>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Cart Link with Badge */}
            <Link to="/cart" className="relative p-2.5 bg-zinc-900 border border-zinc-800 rounded-full text-white hover:text-red-500 hover:bg-zinc-850 transition">
              <ShoppingCart size={20} />
              {cartTotalItems > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-red-600 text-white font-bold text-xs w-5.5 h-5.5 rounded-full flex items-center justify-center border-2 border-black animate-pulse">
                  {cartTotalItems}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center space-x-3.5 pl-2 border-l border-zinc-800">
                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-300 max-w-[120px] truncate">{profile?.name || user.email}</p>
                  <p className="text-[10px] text-zinc-500 capitalize">{profile?.role || "Customer"}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-500 rounded-xl transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-white hover:bg-red-600 text-black hover:text-white font-bold text-xs px-5 py-2.5 rounded-lg uppercase tracking-wider transition"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile hamburger icon */}
          <div className="flex md:hidden items-center space-x-2">
            <Link to="/cart" className="relative p-2 text-white hover:text-red-500 transition mr-2">
              <ShoppingCart size={22} />
              {cartTotalItems > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                  {cartTotalItems}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg transition"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-zinc-950 border-t border-zinc-900 px-4 pt-2 pb-6 space-y-3.5">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="block text-zinc-200 hover:text-red-500 font-semibold tracking-wider py-1.5 transition uppercase"
          >
            Home
          </Link>
          <Link
            to="/shop"
            onClick={() => setMobileOpen(false)}
            className="block text-zinc-200 hover:text-red-500 font-semibold tracking-wider py-1.5 transition uppercase"
          >
            Shop Categories
          </Link>
          
          {profile?.role === "admin" && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileOpen(false)}
              className="block text-red-500 font-bold py-1.5 transition uppercase"
            >
              ★ Admin Dashboard
            </Link>
          )}

          {user && (
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="block text-zinc-200 hover:text-red-500 font-semibold py-1.5 transition uppercase"
            >
              My Dashboard
            </Link>
          )}

          <div className="pt-3 border-t border-zinc-900 flex items-center justify-between">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="text-sm font-bold text-white truncate max-w-[170px]">{profile?.name || user.email}</p>
                  <p className="text-xs text-zinc-500 capitalize">{profile?.role || "Customer"}</p>
                </div>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center space-x-1 bg-red-950/40 text-red-500 px-3.5 py-2 rounded-lg text-xs font-bold"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center bg-white text-black py-2.5 rounded-lg font-bold text-sm block"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
