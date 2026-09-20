import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { ShoppingBag, ArrowLeft, Landmark, ShieldCheck, Mail, Loader2, PartyPopper } from "lucide-react";

export const Checkout: React.FC = () => {
  const { cart, profile, user, categories, isCheckingOut, checkoutCart } = useStore();
  const navigate = useNavigate();

  // Controlled customer details form
  const [customerName, setCustomerName] = useState(profile?.name || "");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [procureNotes, setProcureNotes] = useState("");
  
  // Post-purchase confirmation state
  const [orderFinalizedId, setOrderFinalizedId] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Sync profile name when profile details load asynchronously
  useEffect(() => {
    if (profile?.name && !customerName) {
      setCustomerName(profile.name);
    }
  }, [profile, customerName]);

  // Math sum
  const grandTotalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(null);

    if (!customerName.trim()) {
      setErrorStatus("Billing Customer Name is required for audits.");
      return;
    }

    console.log("[CHECKOUT PAGE] Submitting procurement checkout inputs with custom logistics payload:", {
      registrar: customerName,
      address: deliveryAddress,
      notesSize: procureNotes.length
    });

    const res = await checkoutCart(customerName, deliveryAddress, procureNotes);
    
    if (res.success && res.orderId) {
      setOrderFinalizedId(res.orderId);
    } else {
      setErrorStatus(res.error || "An unexpected error aborted your transaction.");
    }
  };

  // 1. Render Success State
  if (orderFinalizedId) {
    return (
      <div className="bg-[#050505] text-[#FFFFFF] min-h-screen py-24 select-none font-sans">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-[#161616] rounded-3xl border border-white/5 p-12 shadow-2xl flex flex-col items-center">
            
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/25 rounded-full text-emerald-400 mb-6">
              <PartyPopper size={48} className="animate-bounce" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display uppercase tracking-tight mb-2">
              Procurement Confirmed
            </h1>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest text-[#E11D2E] font-bold mb-6">
              Receipt ID: {orderFinalizedId}
            </p>

            <p className="text-sm text-[#B3B3B3] max-w-md leading-relaxed mb-8">
              Excellent! Your wholesale grocery order has been successfully locked in. Stock reservations are deducted, and category spending allocations are debited from the store ledger.
            </p>

            {user?.email && (
              <div className="bg-[#0F0F0F] border border-white/5 rounded-xl p-4 w-full mb-8 flex items-center space-x-3.5 text-left text-xs text-[#B3B3B3] leading-relaxed font-sans">
                <Mail size={16} className="text-[#E11D2E] shrink-0" />
                <div>
                  <p className="font-bold text-white uppercase text-[10px] tracking-wider mb-0.5">Verification Invoice Dispatched</p>
                  <p>We've sent a detailed copy of the Order Receipt to <strong className="text-white">{user.email}</strong> for your records.</p>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 w-full justify-center">
              <Link
                to="/dashboard"
                className="px-6 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition"
              >
                My Order History
              </Link>
              <Link
                to={`/payment/${orderFinalizedId}`}
                className="px-6 py-3.5 bg-[#E11D2E] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition flex items-center justify-center space-x-1"
              >
                <span>COMPLETE PAYMENT NOW</span>
              </Link>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // 2. Render normal empty check
  if (cart.length === 0) {
    return (
      <div className="bg-[#050505] text-[#FFFFFF] min-h-screen py-24 select-none font-sans">
        <div className="max-w-md mx-auto text-center px-4">
          <ShoppingBag size={48} className="mx-auto text-zinc-550 mb-4" />
          <h2 className="text-2xl font-black text-white font-display uppercase mb-4">No Items to Check Out</h2>
          <Link to="/shop" className="bg-[#E11D2E] hover:bg-red-700 px-6 py-3 text-white text-xs font-bold uppercase rounded-lg">
            Browse items
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#050505] text-[#FFFFFF] min-h-screen py-12 select-none font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back navigation */}
        <Link to="/cart" className="inline-flex items-center space-x-2 text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider mb-8 transition">
          <ArrowLeft size={14} />
          <span>Return to active bag</span>
        </Link>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display uppercase mb-12 border-b border-white/5 pb-8">
          PROCUREMENT <span className="text-[#E11D2E] font-light font-sans">CHECKOUT</span>
        </h1>

        {errorStatus && (
          <div className="bg-red-950/40 text-[#E11D2E] border border-[#E11D2E] p-4 rounded-xl text-sm mb-8 font-mono">
            System Denied: {errorStatus}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          
          {/* Left Form (Column 1-3) */}
          <form onSubmit={handleCheckoutSubmit} className="lg:col-span-3 space-y-6">
            <div className="bg-[#161616] rounded-2xl p-6 border border-white/5 shadow-2xl space-y-4">
              <h2 className="text-base font-black font-display text-white uppercase mb-4 pb-2 border-b border-white/5">
                Procurement Officer & Billing Details
              </h2>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 tracking-wider mb-1.5 font-mono">
                  Author name / Registrar *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter authorized manager or buyer full name"
                  className="w-full px-4 py-3 bg-[#0F0F0F] border border-white/5 text-sm text-white rounded-xl focus:outline-none focus:border-[#E11D2E] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 tracking-wider mb-1.5 font-mono">
                  Logistics Destination Address *
                </label>
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Ex: Wholesale Dock 4, 100 Port Authority Blvd"
                  className="w-full px-4 py-3 bg-[#0F0F0F] border border-white/5 text-sm text-white rounded-xl focus:outline-none focus:border-[#E11D2E] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 tracking-wider mb-1.5 font-mono">
                  Audit/Delivery instructions
                </label>
                <textarea
                  value={procureNotes}
                  onChange={(e) => setProcureNotes(e.target.value)}
                  rows={4}
                  placeholder="Specify temperature adjustments or warehouse gate codes"
                  className="w-full px-4 py-3 bg-[#0F0F0F] border border-white/5 text-sm text-white rounded-xl focus:outline-none focus:border-[#E11D2E] transition resize-none"
                />
              </div>
            </div>

            {/* Secure lock terms */}
            <div className="p-4 bg-[#161616] border border-white/5 rounded-xl text-xs text-[#B3B3B3] flex items-start space-x-2.5 font-mono">
              <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[10px] uppercase tracking-wide">
                By submitting this procurement statement, you recognize that spending totals are deducted atomically from selected sector allowance buckets. Transactions are encrypted and saved as immutable records.
              </p>
            </div>

            <button
              type="submit"
              disabled={isCheckingOut}
              className="w-full bg-[#E11D2E] hover:bg-red-700 text-white font-bold tracking-widest text-xs uppercase py-4 rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>Auditing active allowances...</span>
                </>
              ) : (
                <>
                  <Landmark size={14} className="text-white" />
                  <span>Transmit Procurement Checkout</span>
                </>
              )}
            </button>
          </form>

          {/* Right breakdown (Column 4-5) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#161616] text-[#FFFFFF] p-6 rounded-2xl border border-white/5 shadow-2xl font-sans">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 mb-4 pb-3 border-b border-white/5">
                Procurement Contents
              </h3>

              {/* List products short form */}
              <div className="max-h-[220px] overflow-y-auto pr-2 divide-y divide-white/5 mb-6">
                {cart.map((item) => (
                  <div key={item.product.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white uppercase truncate max-w-[175px]">{item.product.name}</p>
                      <p className="text-[9px] text-[#B3B3B3] font-mono uppercase mt-0.5">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-mono text-white font-semibold">${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t border-white/5 pt-4 flex justify-between items-baseline font-mono text-sm">
                <span className="text-zinc-500 uppercase text-[10px]">Tandem value</span>
                <span className="text-2xl font-black text-[#E11D2E]">${grandTotalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
