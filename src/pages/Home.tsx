import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { ArrowRight, Check, Bookmark, ShoppingBag, Plus, Sparkles, TrendingUp, DollarSign } from "lucide-react";
import { Image } from "../components/Image";

export const Home: React.FC = () => {
  const { products, categories, addToCart } = useStore();
  const navigate = useNavigate();

  // Curate featured products
  const featuredProducts = useMemo(() => {
    if (!products.length) return [];
    const items = [];
    const addedCats = new Set();
    for (const p of products) {
      if (!addedCats.has(p.category)) {
        items.push(p);
        addedCats.add(p.category);
      }
      if (items.length >= 8) break;
    }
    return items;
  }, [products]);

  const handleQuickAdd = (p: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = addToCart(p, 1);
    if (res.success) {
      alert(`Asset Reservation Success: 1 pack of "${p.name}" loaded under your ${categories.find(c => c.id === p.category)?.name || p.category} balance list.`);
    } else {
      alert(`Category Budget Check Alert:\n${res.error}`);
    }
  };

  return (
    <div className="bg-[#050505] text-[#FFFFFF] min-h-screen">
      
      {/* 1. Hero Banner */}
      <div className="relative bg-[#0F0F0F] text-white overflow-hidden py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-b border-white/5 flex flex-col items-center justify-center text-center">
        {/* Subtle matrix gridding */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        {/* Radiant premium crimson glow is aligned with our luxury brand styling */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E11D2E] rounded-full filter blur-[150px] opacity-15 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto z-10 flex flex-col items-center">
          <div className="inline-flex items-center space-x-2 bg-[#E11D2E]/10 border border-[#E11D2E]/20 text-[#E11D2E] font-black text-[10px] px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
            <Sparkles size={12} className="animate-pulse" />
            <span>ENTERPRISE PROCUREMENT PLATFORM</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black font-display text-white tracking-tight mb-6">
            EDGE <span className="text-[#E11D2E]">MART</span>
          </h1>
          
          <p className="text-sm sm:text-xl text-[#B3B3B3] font-light max-w-2xl leading-relaxed mb-10 font-sans">
            Streamlining wholesale grocery supply lines under strict, automated budgetary limits. Engineered with zero-trust persistence for commercial operations.
          </p>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full justify-center">
            <Link
              to="/shop"
              className="px-8 py-4 bg-[#E11D2E] hover:bg-[#E11D2E]/90 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-all shadow-lg hover:shadow-[#E11D2E]/20 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Explore Active Categories</span>
              <ArrowRight size={14} />
            </Link>
            <a
              href="#featured"
              className="px-8 py-4 bg-[#161616] hover:bg-zinc-800 border border-white/5 text-zinc-350 text-xs font-bold uppercase tracking-widest rounded-lg transition flex items-center justify-center"
            >
              Quick Catalogs
            </a>
          </div>
        </div>
      </div>

      {/* 2. Visual Trust Metrics */}
      <div className="bg-[#050505] border-b border-white/5 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div className="border-b sm:border-b-0 sm:border-r border-white/5 pb-6 sm:pb-0">
            <p className="text-4xl font-extrabold text-[#E11D2E] font-display">$295,000</p>
            <p className="text-[10px] text-[#B3B3B3] uppercase tracking-wider mt-1.5 font-semibold">Allocated Corporate Budget</p>
          </div>
          <div className="border-b sm:border-b-0 sm:border-r border-white/5 pb-6 sm:pb-0">
            <p className="text-4xl font-extrabold text-white font-display">13</p>
            <p className="text-[10px] text-[#B3B3B3] uppercase tracking-wider mt-1.5 font-semibold">Active Supply Sectors</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold text-white font-display">200+</p>
            <p className="text-[10px] text-[#B3B3B3] uppercase tracking-wider mt-1.5 font-semibold">Fully Managed Wholesale Goods</p>
          </div>
        </div>
      </div>

      {/* 3. Budget Categories Preview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center md:text-left mb-12 flex flex-col md:flex-row items-center md:items-end justify-between">
          <div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display uppercase">
              PROCUREMENT <span className="text-[#E11D2E]">CHANNELS</span>
            </h2>
            <p className="text-[#B3B3B3] text-xs sm:text-sm mt-3 max-w-xl">
              Each food procurement vertical operates within tightly restricted spending caps. Real-time balance calculations automatically safe-guard your orders.
            </p>
          </div>
          <Link to="/shop" className="text-[#E11D2E] hover:text-white font-bold text-xs tracking-wider uppercase flex items-center space-x-1.5 mt-4 md:mt-0 transition">
            <span>BROWSE GENERAL CATALOG</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.slice(0, 6).map((cat) => {
            const spentPercent = cat.budget > 0 ? (cat.spent / cat.budget) * 100 : 0;
            return (
              <div
                key={cat.id}
                onClick={() => navigate(`/categories/${cat.id}`)}
                className="bg-[#161616] p-6 rounded-2xl border border-white/5 hover:border-[#E11D2E] cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-extrabold text-base text-white font-tracking uppercase font-display">
                      {cat.name}
                    </h3>
                    <span className="text-[9px] uppercase bg-white/5 border border-white/5 px-2 py-0.5 rounded font-bold text-zinc-400 font-mono">
                      LOCK ACTIVE
                    </span>
                  </div>

                  <p className="text-xs text-[#B3B3B3] line-clamp-2 mb-6">
                    Commercial quantity listings sourced from regional farming networks to serve culinary operations.
                  </p>
                </div>

                <div>
                  {/* Budget bar meters */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500 font-bold uppercase font-mono">CAP LIMIT:</span>
                      <span className="text-white font-black font-mono">${cat.budget.toLocaleString()}</span>
                    </div>

                    <div className="h-1.5 w-full bg-[#0F0F0F] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#E11D2E]"
                        style={{ width: `${Math.min(100, spentPercent)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] font-semibold pt-1 font-mono">
                      <span className="text-zinc-500">DEBITED: ${cat.spent.toLocaleString()}</span>
                      <span className="text-[#E11D2E]">{spentPercent.toFixed(1)}% CONSUMED</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Curated Featured Products Grid */}
      <section id="featured" className="bg-[#0F0F0F] border-t border-b border-white/5 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display mb-4 uppercase">
              FEATURED <span className="text-[#E11D2E]">ITEMS</span>
            </h2>
            <p className="text-[#B3B3B3] text-xs sm:text-sm">
              Pre-qualified stock. Real-time logistical reservation applied instantaneously upon confirmation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => {
              const catName = categories.find((c) => c.id === p.category)?.name || p.category;
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/products/${p.id}`)}
                  className="bg-[#161616] border border-white/5 rounded-xl overflow-hidden shadow-lg hover:border-[#E11D2E] transition-all flex flex-col cursor-pointer group"
                >
                  {/* Thumbnail using our high performance Image Component */}
                  <div className="h-56 relative overflow-hidden bg-black">
                    <Image
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    
                    <span className="absolute top-3 left-3 bg-[#E11D2E] text-white text-[8px] tracking-widest uppercase font-black px-2 py-1 rounded">
                      {catName}
                    </span>

                    {p.stock <= 10 && (
                      <span className="absolute bottom-3 right-3 bg-amber-500 text-black text-[8px] tracking-widest uppercase font-black px-2 py-1 rounded">
                        ONLY {p.stock} PACKS LEFT
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-white mb-2 line-clamp-1 group-hover:text-[#E11D2E] transition font-display uppercase">
                        {p.name}
                      </h3>
                      <p className="text-xs text-[#B3B3B3] line-clamp-2 leading-relaxed mb-4">
                        {p.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-zinc-500 text-[9px] uppercase font-mono tracking-wider">Bulk Lot</span>
                        <span className="text-base font-bold text-white font-mono">${p.price.toFixed(2)}</span>
                      </div>

                      <button
                        onClick={(e) => handleQuickAdd(p, e)}
                        className="p-2.5 bg-[#E11D2E] hover:bg-[#E11D2E]/90 text-white rounded-lg transition cursor-pointer"
                        title="Add 1 to Cart"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/shop"
              className="inline-flex items-center space-x-2 px-6 py-3 border border-white/10 hover:border-[#E11D2E] text-xs font-bold uppercase tracking-widest rounded-lg transition"
            >
              <span>EXPLORE BULK CATALOGS (200+ ITEMS)</span>
              <ArrowRight size={12} />
            </Link>
          </div>

        </div>
      </section>

      {/* 5. Informational Feature / Callout Section */}
      <div className="bg-[#050505] py-20 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <Bookmark size={36} className="mx-auto text-[#E11D2E] mb-6" />
          <h2 className="text-xl sm:text-2xl font-black font-display text-white uppercase tracking-tight mb-4">
            INSTITUTIONAL BALANCE INTEGRATOR
          </h2>
          <p className="text-[#B3B3B3] text-xs sm:text-sm max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Our transaction gateways integrate client-side and server-side budget checks. If any checkout pushes you beyond a category allocation limit, items lock, maintaining institutional fiscal health autonomously.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-3xl mx-auto font-sans">
            <div className="p-5 bg-[#161616] rounded-xl border border-white/5 flex items-start space-x-3">
              <Check size={16} className="text-[#E11D2E] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs uppercase text-white font-display">Automatic Ledger Sync</p>
                <p className="text-[10px] text-[#B3B3B3] mt-1 font-normal">Saves debit ledger changes direct to Firestore on payment success.</p>
              </div>
            </div>
            <div className="p-5 bg-[#161616] rounded-xl border border-white/5 flex items-start space-x-3">
              <Check size={16} className="text-[#E11D2E] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs uppercase text-white font-display">Logistics Lock</p>
                <p className="text-[10px] text-[#B3B3B3] mt-1 font-normal">Decrements product stock levels directly to prevent overallocation issues.</p>
              </div>
            </div>
            <div className="p-5 bg-[#161616] rounded-xl border border-white/5 flex items-start space-x-3">
              <Check size={16} className="text-[#E11D2E] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs uppercase text-white font-display">Automated Invoicing</p>
                <p className="text-[10px] text-[#B3B3B3] mt-1 font-normal">Prepares verified order receipt records and dispatches immediately upon authorization.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
