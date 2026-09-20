import React, { useState } from "react";
import { useStore } from "../context/StoreContext";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Calendar, Box, DollarSign, ArrowRight, UserCheck, ShieldAlert, CreditCard, Clock, CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

export const UserDashboard: React.FC = () => {
  const { user, profile, orders } = useStore();
  const navigate = useNavigate();
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<string | null>(null);

  // Protected route redirect
  React.useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleToggleOrderDetails = (orderId: string) => {
    if (selectedOrderDetails === orderId) {
      setSelectedOrderDetails(null);
    } else {
      setSelectedOrderDetails(orderId);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-[#050505] text-[#FFFFFF] min-h-screen py-12 select-none font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Header */}
        <div className="border-b border-white/5 pb-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display uppercase">
              BUYER <span className="text-[#E11D2E] font-light font-sans">DASHBOARD</span>
            </h1>
            <p className="text-[#B3B3B3] text-xs mt-2">
              Explore your active wholesale procurement registry log, upload transfer screenshots, and edit accounts.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {profile?.role === "admin" && (
              <Link
                to="/admin/dashboard"
                className="px-5 py-3 bg-[#E11D2E] hover:bg-neutral-900 border border-[#E11D2E] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
              >
                Go to Admin verification
              </Link>
            )}
            <Link
              to="/shop"
              className="px-5 py-3 border border-white/10 hover:border-white/25 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition"
            >
              Order more stock
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          
          {/* Left column: Profile card (1 span) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[#161616] rounded-3xl border border-white/5 p-6 space-y-4 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#E11D2E]" />
              
              <div className="flex items-center space-x-3 pb-3 border-b border-white/5">
                <div className="p-2.5 bg-[#0F0F0F] border border-white/5 rounded-xl text-[#E11D2E] shrink-0">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-white uppercase text-sm font-display leading-tight">{profile?.name || "Purchaser"}</h3>
                  <p className="text-[9px] text-zinc-500 uppercase font-mono font-bold tracking-widest mt-0.5">{profile?.role || "Member Store"}</p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-[#B3B3B3] leading-relaxed font-mono">
                <div>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Store Domain</p>
                  <p className="text-white font-semibold mt-0.5 max-w-full truncate">{profile?.email || user.email}</p>
                </div>

                <div>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold font-mono">Security Registry</p>
                  <p className="text-white font-semibold mt-0.5">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "June 11, 2026"}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Ledger Transactions</p>
                  <p className="text-white font-extrabold mt-0.5">{orders.length} orders safely stored</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Orders list (3 span) */}
          <div className="lg:col-span-3 space-y-6">
            <h2 className="text-base font-black font-display text-white uppercase pb-3 border-b border-white/5">
              Wholesale Ledger Records
            </h2>

            {orders.length === 0 ? (
              <div className="bg-[#161616] rounded-3xl border border-white/5 p-16 text-center shadow-xl">
                <div className="p-4 bg-[#0F0F0F] rounded-full w-14 h-14 flex items-center justify-center mx-auto border border-white/5 mb-4 text-zinc-500">
                  <FileText size={24} />
                </div>
                <p className="text-white font-bold font-display uppercase tracking-wider text-sm mb-1">No active procurement bills</p>
                <p className="text-xs text-[#B3B3B3] mb-6">Create structural orders to populate records log.</p>
                <Link to="/shop" className="px-5 py-3.5 bg-[#E11D2E] hover:bg-neutral-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition border border-[#E11D2E]">
                  Browse catalog categories
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => {
                  const itemsCount = ord.items.reduce((sum, item) => sum + item.quantity, 0);
                  const isExpanded = selectedOrderDetails === ord.id;
                  
                  // Get status properties
                  const currentStatus = ord.status || "pending";
                  
                  return (
                    <div
                      key={ord.id}
                      className="bg-[#161616] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all duration-300 shadow-lg"
                    >
                      {/* Header item */}
                      <div
                        onClick={() => handleToggleOrderDetails(ord.id)}
                        className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-[#161616]/75 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-extrabold text-sm uppercase text-white font-display tracking-tight">
                              Invoice Statement
                            </span>
                            <span className="text-[10px] font-bold text-[#E11D2E] bg-red-950/20 border border-[#E11D2E]/30 px-2 py-0.5 rounded font-mono">
                              #{ord.id.slice(-8).toUpperCase()}
                            </span>

                            {/* Status label rendering */}
                            {currentStatus === "approved" ? (
                              <span className="inline-flex items-center space-x-1 bg-emerald-950/30 border border-emerald-500/20 px-2 py-0.5 rounded text-emerald-400 font-mono text-[9px] uppercase font-bold">
                                <CheckCircle2 size={11} />
                                <span>CLEARED FOR DEPOT</span>
                              </span>
                            ) : currentStatus === "rejected" ? (
                              <span className="inline-flex items-center space-x-1 bg-red-950/30 border border-[#E11D2E]/20 px-2 py-0.5 rounded text-[#E11D2E] font-mono text-[9px] uppercase font-bold">
                                <AlertTriangle size={11} />
                                <span>AUDIT DECLINED</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 bg-amber-950/30 border border-amber-500/20 px-2 py-0.5 rounded text-amber-400 font-mono text-[9px] uppercase font-bold">
                                <Clock size={11} />
                                <span>AWAITING RECEIPT VERIFICATION</span>
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-zinc-500 font-mono flex items-center space-x-1">
                            <Calendar size={12} />
                            <span>{new Date(ord.createdAt).toLocaleString()}</span>
                            <span>•</span>
                            <span>{itemsCount} individual packs</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-6 self-end sm:self-center">
                          <div className="text-right">
                            <p className="text-[9px] text-zinc-500 uppercase font-mono">Total committed value</p>
                            <p className="text-base font-black text-white font-mono">${ord.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          </div>
                          <span className="text-[11px] text-[#E11D2E] font-extrabold uppercase tracking-widest leading-none">
                            {isExpanded ? "Collapse ▲" : "inspect ▼"}
                          </span>
                        </div>
                      </div>

                      {/* Expand breakdown specs details */}
                      {isExpanded && (
                        <div className="p-6 bg-[#0F0F0F] border-t border-white/5 space-y-6">
                          
                          {/* Alert rejection reason if exist */}
                          {currentStatus === "rejected" && ord.rejectionReason && (
                            <div className="bg-red-950/20 border border-[#E11D2E] p-4 rounded-xl flex items-start space-x-2.5 text-xs text-[#E11D2E] font-sans leading-relaxed">
                              <AlertCircle size={18} className="text-[#E11D2E] shrink-0 mt-0.5" />
                              <div>
                                <p className="font-extrabold text-[#E11D2E] uppercase tracking-wider mb-1">Reason for Audit Overrule</p>
                                <p className="text-zinc-200">{ord.rejectionReason}</p>
                                <p className="text-zinc-400 text-[10px] mt-2">Please upload replacement transaction sheets using the complete payment gateway below.</p>
                              </div>
                            </div>
                          )}

                          {currentStatus !== "approved" && (
                            <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-[#161616] border border-white/5 rounded-xl gap-4">
                              <div className="space-y-0.5 text-left">
                                <p className="text-xs text-white font-bold uppercase tracking-wider flex items-center">
                                  <CreditCard size={14} className="mr-1.5 text-[#E11D2E]" /> Complete Payment Settlement
                                </p>
                                <p className="text-[10px] text-zinc-400">Attach bank transfer receipt screenshots to notify administrative reviewers immediately.</p>
                              </div>
                              <Link
                                to={`/payment/${ord.id}`}
                                className="px-4 py-2 bg-[#E11D2E] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition"
                              >
                                Upload receipts & settle
                              </Link>
                            </div>
                          )}

                          {/* Items listed */}
                          <div className="space-y-3">
                            <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest font-mono">
                              Items procured in this block
                            </p>
                            <div className="bg-[#161616] border border-white/5 rounded-xl divide-y divide-white/5 overflow-hidden font-mono">
                              {ord.items.map((item) => (
                                <div key={item.id} className="p-4 flex justify-between items-center text-xs">
                                  <div>
                                    <p className="font-bold text-white uppercase">{item.name}</p>
                                    <p className="text-[9px] text-[#E11D2E] font-black uppercase tracking-wider mt-1">
                                      {item.category.replace("-", " ")}
                                    </p>
                                  </div>
                                  <div className="text-right font-mono text-xs">
                                    <p className="font-bold text-white">${(item.price * item.quantity).toFixed(2)}</p>
                                    <p className="text-[10px] text-zinc-500">{item.quantity} packs x ${item.price.toFixed(2)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Category breakdown details */}
                          <div className="space-y-2.5">
                            <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest font-mono">
                              Audit ledger allocation debits
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              {Object.entries(ord.categoryBreakdown).map(([catId, amount]) => (
                                <div key={catId} className="bg-[#161616] p-3 border border-white/5 rounded-xl flex items-center justify-between text-xs font-mono">
                                  <span className="font-semibold text-zinc-500 uppercase">{catId.replace("-", " ")}</span>
                                  <span className="font-bold text-[#E11D2E]">${Number(amount).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
