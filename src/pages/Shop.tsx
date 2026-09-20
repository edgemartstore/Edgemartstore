import React from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { BarChart3, ArrowUpRight, Shield } from "lucide-react";

export const Shop: React.FC = () => {
  const { categories } = useStore();
  const navigate = useNavigate();

  // Sum up overall store indicators
  const totalAllocated = categories.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  const totalRemaining = totalAllocated - totalSpent;
  const spentPercent = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  return (
    <div className="bg-[#050505] text-[#FFFFFF] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Title Header */}
        <div className="border-b border-white/5 pb-8 mb-12 text-center sm:text-left flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-display uppercase">
              PROCUREMENT <span className="text-[#E11D2E] font-light font-sans">BUDGETS</span>
            </h1>
            <p className="text-[#B3B3B3] text-xs sm:text-sm mt-3 max-w-xl leading-relaxed">
              Real-time balance monitoring across corporate grocery sectors. Budget limits are checked globally and per-category during catalog checkouts.
            </p>
          </div>
          
          {/* Global Store Spends Badge */}
          <div className="bg-[#161616] text-white rounded-2xl p-5 border border-white/5 shadow-lg min-w-[280px] font-sans">
            <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <BarChart3 size={14} className="text-[#E11D2E]" />
              GLOBAL SPEND TRACKER
            </p>
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-2xl font-black font-mono text-[#E11D2E]">${totalSpent.toLocaleString()}</span>
              <span className="text-xs text-zinc-400 font-mono">of ${totalAllocated.toLocaleString()} Limit</span>
            </div>

            <div className="h-1.5 w-full bg-[#0F0F0F] rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-[#E11D2E] transition-all duration-500"
                style={{ width: `${Math.min(100, spentPercent)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>Remaining: ${totalRemaining.toLocaleString()}</span>
              <span>{spentPercent.toFixed(1)}% Used</span>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat) => {
            const spentRef = cat.spent || 0;
            const remainingValue = cat.budget - spentRef;
            const progressPct = cat.budget > 0 ? (spentRef / cat.budget) * 100 : 0;

            // Compute status flag alerts
            let indicatorColor = "bg-[#E11D2E]";
            let textColor = "text-[#E11D2E]";
            let alertLabel = "Secure Limit";
            if (progressPct >= 90) {
              indicatorColor = "bg-[#E11D2E]";
              textColor = "text-[#E11D2E] font-black";
              alertLabel = "CRITICALLY EXHAUSTED";
            } else if (progressPct >= 70) {
              indicatorColor = "bg-amber-500";
              textColor = "text-amber-500 font-semibold";
              alertLabel = "NEARING CEILING";
            } else {
              indicatorColor = "bg-emerald-500";
              textColor = "text-emerald-500";
              alertLabel = "OPERATIONAL STATUS";
            }

            return (
              <div
                key={cat.id}
                onClick={() => navigate(`/categories/${cat.id}`)}
                className="bg-[#161616] rounded-2xl border border-white/5 hover:border-[#E11D2E]/40 transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1 relative overflow-hidden"
              >
                {/* Visual Accent Red status edge border */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${progressPct >= 90 ? "bg-[#E11D2E]" : "bg-white/10"}`} />

                {/* Head Meta */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="font-extrabold text-lg text-white font-display uppercase tracking-tight group-hover:text-[#E11D2E] transition leading-tight mt-1">
                        {cat.name}
                      </h2>
                      <span className="text-[9px] text-[#B3B3B3] font-bold uppercase tracking-widest font-mono">
                        ID: {cat.id}
                      </span>
                    </div>

                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded font-mono bg-white/5 border border-white/5 ${textColor}`}>
                       {alertLabel}
                    </span>
                  </div>

                  <p className="text-[#B3B3B3] text-xs leading-relaxed mb-6 font-normal">
                    Assigned fiscal bounds for bulk procurement of {cat.name} goods. Verified by real-time double-spend ledger checks on checkout.
                  </p>

                  {/* Spends Ledger block */}
                  <div className="bg-[#0F0F0F] rounded-xl p-4 border border-white/5 space-y-3 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 uppercase">Limit Cap:</span>
                      <span className="text-white font-bold">${cat.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 uppercase">Debited Spent:</span>
                      <span className="text-[#E11D2E] font-bold">${spentRef.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-white/5 pt-2 flex justify-between">
                      <span className="text-zinc-500 uppercase">Unused Balance:</span>
                      <span className={`font-bold ${remainingValue <= 1500 ? "text-[#E11D2E] animate-pulse font-black" : "text-white"}`}>
                        ${remainingValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live progress meter */}
                <div className="px-6 pb-6 pt-2 border-t border-white/5">
                  <div className="space-y-1.5 mb-4 pt-2">
                    <div className="flex justify-between text-[10px] font-medium text-zinc-500 font-mono">
                      <span>Logistical Allocation Spent</span>
                      <span className={`font-bold ${textColor}`}>{progressPct.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#0F0F0F] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${progressPct >= 90 ? "bg-[#E11D2E]" : progressPct >= 70 ? "bg-amber-500" : "bg-emerald-500"} transition-all duration-500`}
                        style={{ width: `${Math.min(100, progressPct)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#E11D2E] group-hover:text-white uppercase tracking-wider transition">
                      <span>Browse Sector Items</span>
                      <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
