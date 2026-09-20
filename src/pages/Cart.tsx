import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight, ShieldCheck, AlertCircle, Sparkles, HelpCircle, BarChart, Settings, CheckCircle } from "lucide-react";
import { Image } from "../components/Image";
import { Product, CartItem } from "../types";

export const Cart: React.FC = () => {
  const { cart, categories, products, setCart, updateCartQuantity, removeFromCart, clearCart, getCartCategoryTotal, getCategoryRemainingBudget } = useStore();
  const navigate = useNavigate();

  // 1. Core pricing calculations
  const totalCartSum = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  // 2. Identify in-cart categories
  const activeCartCategories = useMemo(() => {
    const list = new Set<string>();
    cart.forEach((item) => list.add(item.product.category));
    return Array.from(list).map((id) => categories.find((c) => c.id === id)).filter(Boolean) as typeof categories;
  }, [cart, categories]);

  // 3. Pre-checkout budget audit validator
  const budgetValidation = useMemo(() => {
    const issuesMap: { catName: string; excess: number }[] = [];
    let isExceeded = false;

    activeCartCategories.forEach((cat) => {
      const activeSpentDB = cat.spent || 0;
      const cartPendingAmt = getCartCategoryTotal(cat.id);
      const predictedNewSpent = activeSpentDB + cartPendingAmt;
      
      if (predictedNewSpent > cat.budget) {
        isExceeded = true;
        issuesMap.push({
          catName: cat.name,
          excess: predictedNewSpent - cat.budget
        });
      }
    });

    return { isValid: !isExceeded, issues: issuesMap };
  }, [activeCartCategories, getCartCategoryTotal]);

  const handleUpdateQty = (productId: string, newQty: number) => {
    const res = updateCartQuantity(productId, newQty);
    if (!res.success) {
      alert(`Allowance Denied:\n${res.error}`);
    }
  };

  // --- SMART BULK ORDER GENERATOR ENGINE ---
  const [targetBudget, setTargetBudget] = useState<number>(5000);
  const [strategy, setStrategy] = useState<"conservative" | "balanced" | "aggressive">("balanced");
  const [generatedProposal, setGeneratedProposal] = useState<CartItem[] | null>(null);
  const [reports, setReports] = useState<{
    categoryBudgetSummary: { name: string; allocated: number; remainingBefore: number; spentInProposal: number }[];
    totalProposalCost: number;
    totalStockUnitsSelected: number;
  } | null>(null);

  const handleGenerateBulkOrder = () => {
    if (isNaN(targetBudget) || targetBudget <= 0) {
      alert("Please enter a valid procurement budget allocation quantity.");
      return;
    }

    // 1. Group products by category and calculate remaining allowance
    const eligibleProducts = products.filter(p => p.stock > 0);
    const categoryBalancesMap: Record<string, number> = {};
    categories.forEach(c => {
      categoryBalancesMap[c.id] = getCategoryRemainingBudget(c.id);
    });

    // 2. Calculate category weights based on their relative size / budget capacity
    const totalRemainingCaps = categories.reduce((sum, c) => sum + Math.max(0, categoryBalancesMap[c.id]), 0);
    if (totalRemainingCaps <= 0) {
      alert("Critical Alert: All category allocations are exhausted! Admin overrides are required.");
      return;
    }

    const proposalItems: CartItem[] = [];
    let cumulativeSumAllocated = 0;
    let computedStockUnits = 0;

    const catSummaries: typeof reports extends null ? any : any[] = [];

    // Let's allot budget category-wise
    categories.forEach(cat => {
      const remainingAllowance = categoryBalancesMap[cat.id];
      if (remainingAllowance <= 0) return;

      // Category Weight factor
      const weight = remainingAllowance / totalRemainingCaps;
      let catBudgetFloor = targetBudget * weight;

      // Bound category target budget limit by options coefficient
      let strategyCoeff = 0.70; // balanced default
      if (strategy === "conservative") strategyCoeff = 0.40;
      if (strategy === "aggressive") strategyCoeff = 0.95;

      catBudgetFloor = Math.min(catBudgetFloor, remainingAllowance * strategyCoeff);

      // Locate product listings under this category
      const catProducts = eligibleProducts.filter(p => p.category === cat.id);
      if (catProducts.length === 0) return;

      let catProposalSum = 0;

      // Distribute category target limit across products inside this specific category
      const targetAllocationPerProd = catBudgetFloor / catProducts.length;

      catProducts.forEach(prod => {
        if (catProposalSum >= catBudgetFloor) return;

        // Calculate quantity recommended
        let recommendedQty = Math.floor(targetAllocationPerProd / prod.price);
        
        // Cap by physical stock
        recommendedQty = Math.min(recommendedQty, prod.stock);

        // Cap to ensure we don't blow past this sector's allowance limit
        while (recommendedQty > 0 && (catProposalSum + (recommendedQty * prod.price)) > remainingAllowance) {
          recommendedQty--;
        }

        if (recommendedQty > 0) {
          const cost = recommendedQty * prod.price;
          catProposalSum += cost;
          computedStockUnits += recommendedQty;
          proposalItems.push({
            product: prod,
            quantity: recommendedQty
          });
        }
      });

      if (catProposalSum > 0) {
        cumulativeSumAllocated += catProposalSum;
        catSummaries.push({
          name: cat.name,
          allocated: cat.budget,
          remainingBefore: remainingAllowance,
          spentInProposal: catProposalSum
        });
      }
    });

    if (proposalItems.length === 0) {
      alert("Audit Blocked: The system could not balance appropriate quantities. Refine budget volume.");
      return;
    }

    setGeneratedProposal(proposalItems);
    setReports({
      categoryBudgetSummary: catSummaries,
      totalProposalCost: cumulativeSumAllocated,
      totalStockUnitsSelected: computedStockUnits
    });
  };

  const handleApplyProposal = (mode: "override" | "merge" | "checkout") => {
    if (!generatedProposal || !reports) return;

    if (mode === "override") {
      setCart(generatedProposal);
    } else if (mode === "merge") {
      // Merge elements
      const merged = [...cart];
      generatedProposal.forEach(item => {
        const existing = merged.find(i => i.product.id === item.product.id);
        if (existing) {
          existing.quantity = Math.min(item.product.stock, existing.quantity + item.quantity);
        } else {
          merged.push(item);
        }
      });
      setCart(merged);
    } else if (mode === "checkout") {
      setCart(generatedProposal);
      navigate("/checkout");
    }

    // Reset generator
    setGeneratedProposal(null);
    setReports(null);
    alert("Smart bulk allocation parameters loaded into transaction state successfully!");
  };

  return (
    <div className="bg-[#050505] text-[#FFFFFF] min-h-screen py-12 font-sans select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Tag */}
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display uppercase mb-12 border-b border-white/5 pb-8">
          PROCUREMENT <span className="text-[#E11D2E] font-light font-sans">PORTFOLIO</span>
        </h1>

        {/* ACTIVE SMART GENERATOR INTERFACE PORTAL */}
        <div className="bg-[#161616] border border-white/5 rounded-3xl p-6 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#E11D2E]/5 rounded-full filter blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6 mb-6">
            <div className="space-y-1">
              <span className="inline-flex items-center space-x-1 bg-[#E11D2E]/10 border border-[#E11D2E]/20 text-[#E11D2E] text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded">
                <Sparkles size={11} className="animate-pulse" />
                <span>AI SMART BULK GENERATOR</span>
              </span>
              <h2 className="text-lg font-extrabold text-white uppercase tracking-tight font-display">Auto-Weigh Custom procurement Orders</h2>
              <p className="text-[11px] text-zinc-400">
                Input your bulk purchasing limit. Our engine distributes capital proportionately across remaining category allocations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col">
                <label className="text-[9px] text-zinc-500 uppercase font-mono mb-1">Target Budget Allowance</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#E11D2E] font-mono">$</span>
                  <input
                    type="number"
                    value={targetBudget}
                    onChange={(e) => setTargetBudget(parseInt(e.target.value) || 0)}
                    className="pl-7 pr-4 py-2 w-32 bg-[#0F0F0F] border border-white/5 rounded-xl text-xs text-white placeholder-zinc-500 font-mono font-bold focus:outline-none focus:border-[#E11D2E]"
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-[9px] text-zinc-500 uppercase font-mono mb-1">Distribution intensity</label>
                <select
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value as any)}
                  className="px-3 py-2 bg-[#0F0F0F] border border-white/5 rounded-xl text-xs text-white font-bold focus:outline-none focus:border-[#E11D2E]"
                >
                  <option value="conservative">Conservative (40% max capacity)</option>
                  <option value="balanced">Balanced Allocation (70%)</option>
                  <option value="aggressive">Aggressive Stocking (95%)</option>
                </select>
              </div>

              <button
                onClick={handleGenerateBulkOrder}
                className="px-5 py-2.5 bg-[#E11D2E] hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer self-end"
              >
                Synthesize Order
              </button>
            </div>
          </div>

          {/* If Proposal is ready, display allocation spreadsheet summary */}
          {generatedProposal && reports && (
            <div className="bg-[#0F0F0F] border border-white/5 rounded-2xl p-6 space-y-6">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[#E11D2E] font-bold uppercase tracking-widest flex items-center">
                  <CheckCircle size={14} className="mr-1" /> Recommendation Report Available
                </span>
                <span className="text-zinc-500">Proposed Cost: <strong>${reports.totalProposalCost.toLocaleString()}</strong> ({reports.totalStockUnitsSelected} packs)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wide font-mono mb-3">Sector Spending Allocation Cap</h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                    {reports.categoryBudgetSummary.map((sum, idx) => {
                      const balanceAfter = sum.remainingBefore - sum.spentInProposal;
                      return (
                        <div key={idx} className="p-3 bg-[#161616] rounded-xl border border-white/5 text-[11px] space-y-1">
                          <div className="flex justify-between text-white font-bold uppercase">
                            <span>{sum.name}</span>
                            <span className="text-[#E11D2E]">+${sum.spentInProposal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                            <span>Allowed bal before: ${sum.remainingBefore.toLocaleString()}</span>
                            <span>Audit safe post-balance: ${balanceAfter.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wide font-mono mb-3">Proposed Asset Quantities Staged</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {generatedProposal.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px] font-mono p-2 bg-[#161616] rounded border border-white/5">
                        <span className="text-white truncate max-w-[170px]">{item.product.name}</span>
                        <span className="text-[#E11D2E] font-extrabold">{item.quantity} packs • <strong className="text-zinc-500 font-normal">${(item.product.price * item.quantity).toFixed(2)}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex flex-wrap gap-4 justify-end">
                <button
                  onClick={() => setGeneratedProposal(null)}
                  className="px-4 py-2 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white rounded-xl text-xs uppercase font-extrabold tracking-wider transition"
                >
                  Discard
                </button>
                <button
                  onClick={() => handleApplyProposal("merge")}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs uppercase font-extrabold tracking-wider transition"
                >
                  Merge into existing bag
                </button>
                <button
                  onClick={() => handleApplyProposal("override")}
                  className="px-4 py-2 bg-[#E11D2E]/10 hover:bg-[#E11D2E]/20 text-[#E11D2E] border border-[#E11D2E]/30 rounded-xl text-xs uppercase font-extrabold tracking-wider transition"
                >
                  Accept & Replace Portfolio
                </button>
                <button
                  onClick={() => handleApplyProposal("checkout")}
                  className="px-5 py-2 bg-[#E11D2E] hover:bg-red-700 text-white rounded-xl text-xs uppercase font-extrabold tracking-wider transition flex items-center space-x-1"
                >
                  <span>Lock portfolio & Checkout</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* STANDARD MANUAL LISTINGS IN BASKET */}
        {cart.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-20 px-4">
            <div className="p-4 bg-[#161616] rounded-full w-16 h-16 flex items-center justify-center mx-auto text-zinc-500 border border-white/5 mb-4">
              <ShoppingBag size={32} />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-wider text-white mb-2">No Reserves Staged Manually</h2>
            <p className="text-[#B3B3B3] text-xs mb-6 max-w-sm mx-auto leading-relaxed">
              Your session basket is currently empty. Initialize selection manually from coordinates or configure the budget allocator above.
            </p>
            <Link
              to="/shop"
              className="bg-[#E11D2E] hover:bg-red-700 text-white font-bold text-xs uppercase px-6 py-3.5 rounded-lg tracking-widest transition-all block text-center max-w-[200px] mx-auto"
            >
              Explore Sectors
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fade-in">
            
            {/* Left Side: Cart Items List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center text-xs font-mono border-b border-white/5 pb-3">
                <span className="text-zinc-500 uppercase">Allocating reserves ({cart.reduce((s, i) => s + i.quantity, 0)} packages)</span>
                <button onClick={clearCart} className="text-zinc-400 hover:text-red-500 transition cursor-pointer font-bold uppercase">
                  Clear Portfolio
                </button>
              </div>

              <div className="space-y-4">
                {cart.map((item) => {
                  const catName = categories.find((c) => c.id === item.product.category)?.name || item.product.category;
                  return (
                    <div
                      key={item.product.id}
                      className="bg-[#161616] border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-white/10 transition-all duration-300"
                    >
                      <div className="flex items-center space-x-4 w-full sm:w-auto">
                        {/* Thumbnail utilizing of custom image loader */}
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-16 h-16 rounded-xl object-cover bg-black shrink-0 border border-white/5"
                        />
                        <div>
                          <h3 className="font-extrabold text-sm uppercase text-white font-display leading-tight line-clamp-1">
                            {item.product.name}
                          </h3>
                          <p className="text-[9px] text-[#E11D2E] font-black uppercase tracking-widest mt-1">{catName}</p>
                          <p className="text-[11px] text-zinc-500 font-mono mt-0.5">${item.product.price.toFixed(2)} each</p>
                        </div>
                      </div>

                      {/* Quantity and subtotal controls */}
                      <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto">
                        <div className="flex items-center space-x-2 border border-white/5 rounded-lg bg-[#0F0F0F] p-1">
                          <button
                            onClick={() => handleUpdateQty(item.product.id, item.quantity - 1)}
                            className="p-1 hover:bg-[#161616] rounded text-zinc-500 transition cursor-pointer"
                            title="Reduce"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-white font-mono">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQty(item.product.id, item.quantity + 1)}
                            className="p-1 hover:bg-[#161616] rounded text-zinc-500 transition cursor-pointer"
                            title="Increase"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="text-right min-w-[80px]">
                          <p className="text-[9px] text-zinc-500 font-mono uppercase">Cost Sub</p>
                          <p className="font-bold text-white text-xs font-mono">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-2 text-zinc-500 hover:text-[#E11D2E] rounded transition cursor-pointer"
                          title="Remove product"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Side: Procurement Auditor Compliance Panel */}
            <div className="space-y-6">
              <div className="bg-[#161616] text-white p-6 rounded-2xl border border-white/5 shadow-xl font-sans">
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-[#B3B3B3] mb-6 flex items-center justify-between border-b border-white/5 pb-3">
                  <span>Procurement auditor checks</span>
                  <ShieldCheck size={16} className="text-[#E11D2E]" />
                </h3>

                {/* In-basket categories progress summary */}
                <div className="space-y-4 mb-6">
                  <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest font-mono">Committed Allowances</p>
                  
                  {activeCartCategories.map((cat) => {
                    const dbSpent = cat.spent || 0;
                    const pendingAmt = getCartCategoryTotal(cat.id);
                    const projectedVal = dbSpent + pendingAmt;
                    const percentVal = cat.budget > 0 ? (projectedVal / cat.budget) * 100 : 0;
                    const isOver = projectedVal > cat.budget;

                    return (
                      <div key={cat.id} className="space-y-1.5 p-3 rounded-xl bg-[#0F0F0F] border border-white/5 text-xs text-zinc-300 font-mono">
                        <div className="flex justify-between font-bold uppercase text-[11px]">
                          <span className="truncate max-w-[120px] text-white">{cat.name}</span>
                          <span className={isOver ? "text-[#E11D2E]" : "text-emerald-400"}>
                            ${projectedVal.toLocaleString()} / ${cat.budget.toLocaleString()}
                          </span>
                        </div>

                        <div className="h-1.5 w-full bg-[#161616] rounded-full overflow-hidden relative">
                          {/* Already spent in DB */}
                          <div
                            className="h-full bg-zinc-700 absolute top-0 left-0"
                            style={{ width: `${Math.min(100, (dbSpent / cat.budget) * 100)}%` }}
                          />
                          {/* Pending in current cart additions */}
                          <div
                            className={`h-full ${isOver ? "bg-[#E11D2E]" : "bg-emerald-500"} absolute top-0`}
                            style={{
                              left: `${Math.min(100, (dbSpent / cat.budget) * 100)}%`,
                              width: `${Math.min(100, (pendingAmt / cat.budget) * 100)}%`
                            }}
                          />
                        </div>
                        
                        <div className="flex justify-between text-[9px] text-zinc-500 uppercase">
                          <span>Portfolio Weight: ${pendingAmt.toLocaleString()}</span>
                          <span>{percentVal.toFixed(1)}% consumed</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total recap */}
                <div className="border-t border-white/5 pt-5 space-y-4 font-mono">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono">Total Debited Capital</span>
                    <span className="text-2xl font-black text-white">${totalCartSum.toFixed(2)}</span>
                  </div>

                  {/* Compliance Alerts */}
                  {!budgetValidation.isValid ? (
                    <div className="bg-red-950/40 border border-[#E11D2E] p-4 rounded-xl flex items-start space-x-2.5 text-xs text-[#E11D2E] font-sans leading-relaxed">
                      <AlertCircle size={18} className="text-[#E11D2E] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-extrabold text-[#E11D2E] uppercase tracking-wider mb-1">Limit Overdrawn Check</p>
                        <p className="text-zinc-300 text-[11px]">The staged quantity overrides are beyond allowance boundaries:</p>
                        <ul className="list-disc pl-4 mt-1 font-semibold space-y-1 text-zinc-200 text-[10px]">
                          {budgetValidation.issues.map((issue, idx) => (
                            <li key={idx}>
                              {issue.catName} is limited by <strong className="text-[#E11D2E]">${issue.excess.toLocaleString()}</strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-950/30 border border-emerald-550/45 p-3.5 rounded-xl flex items-start space-x-2.5 text-xs text-emerald-400 font-sans leading-relaxed">
                      <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-emerald-400 uppercase tracking-wider">ALLOWANCE AUDIT SAFE</p>
                        <p className="text-zinc-300 text-[10px]">This basket merges beautifully with all active category allowances. Checkout gate clears.</p>
                      </div>
                    </div>
                  )}

                  {/* Direct Checkout Link */}
                  {budgetValidation.isValid ? (
                    <Link
                      to="/checkout"
                      className="w-full bg-[#E11D2E] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest py-4 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer font-sans"
                    >
                      <span>Forward to settlement Checkout</span>
                      <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-neutral-900 text-zinc-550 font-bold text-xs uppercase tracking-widest py-4 rounded-xl cursor-not-allowed font-sans border border-neutral-850"
                    >
                      OVERDUE ALLOCATIONS BLOCK CHECKS
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
