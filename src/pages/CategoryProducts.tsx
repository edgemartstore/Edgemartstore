import React, { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { ArrowLeft, Search, SlidersHorizontal, ShoppingCart, Sparkles, Bookmark } from "lucide-react";
import { Image } from "../components/Image";

export const CategoryProducts: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { products, categories, addToCart, getCategoryRemainingBudget, getCartCategoryTotal } = useStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // 1. Locate selected Category metadata
  const category = useMemo(() => {
    return categories.find((c) => c.id === slug);
  }, [categories, slug]);

  // If category is not found, direct to custom 404
  if (!category) {
    return (
      <div className="max-w-md mx-auto px-4 py-32 text-center bg-[#050505] text-white">
        <h2 className="text-2xl font-black font-display text-white uppercase mb-4">Category Not Found</h2>
        <p className="text-[#B3B3B3] text-sm mb-6">The category identifier "{slug}" is not registered in our system.</p>
        <Link to="/shop" className="bg-[#E11D2E] hover:bg-[#E11D2E]/90 px-6 py-3 text-white text-xs font-bold uppercase rounded-lg">
          Return to directory
        </Link>
      </div>
    );
  }

  // 2. Filter products in this category
  const filteredProducts = useMemo(() => {
    const list = products.filter((p) => p.category === category.id);
    if (!searchQuery.trim()) return list;
    return list.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, category, searchQuery]);

  // 3. Dynamic Budget Indicators
  const remainingBudget = getCategoryRemainingBudget(category.id);
  const cartAmountForCategory = getCartCategoryTotal(category.id);
  const spentPct = category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
  
  // Total pending percentage if cart triggers checkout
  const projectedPct = category.budget > 0 ? ((category.spent + cartAmountForCategory) / category.budget) * 100 : 0;

  // Manage Cart adding
  const handleQuantityChange = (prodId: string, value: number) => {
    setQuantities({ ...quantities, [prodId]: Math.max(1, value) });
  };

  const handleAdd = (prod: any) => {
    const qty = quantities[prod.id] || 1;
    const res = addToCart(prod, qty);
    
    if (res.success) {
      alert(`Asset Added: ${qty} packs of "${prod.name}" staged under your active portfolio.`);
      setQuantities({ ...quantities, [prod.id]: 1 });
    } else {
      alert(`Limit Exceeded Warning:\n${res.error}`);
    }
  };

  return (
    <div className="bg-[#050505] text-[#FFFFFF] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back to Shop */}
        <Link to="/shop" className="inline-flex items-center space-x-2 text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider mb-6 transition">
          <ArrowLeft size={14} />
          <span>Back to procurement sectors</span>
        </Link>

        {/* Grid Layout: Category Details & Live Budget Progress card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Title details */}
          <div className="lg:col-span-2 flex flex-col justify-center">
            <div className="inline-flex items-center space-x-1.5 text-[#E11D2E] font-extrabold text-[10px] uppercase tracking-wider mb-2 font-mono">
              <Sparkles size={11} className="animate-spin" />
              <span>ACTIVE PROCUREMENT BOARD</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display uppercase leading-tight">
              {category.name}
            </h1>
            <p className="text-[#B3B3B3] text-xs sm:text-sm leading-relaxed mt-4 max-w-xl">
              Ethically sourced, bulk catalog products categorized for streamlined commercial kitchens. Configure quantities and check real-time spending controls.
            </p>
          </div>

          {/* Live Budget card details */}
          <div className="bg-[#161616] text-white rounded-2xl p-6 border border-white/5 shadow-xl font-sans relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#E11D2E]/5 rounded-full filter blur-xl pointer-events-none" />

            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-4 flex items-center justify-between font-mono">
              <span>Sector Budget Control</span>
              <Bookmark size={14} className="text-[#E11D2E]" />
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-5 border-b border-white/5 pb-4 text-xs font-mono">
              <div>
                <p className="text-zinc-500 uppercase">Limit Pool: </p>
                <p className="text-base font-bold text-white">${category.budget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-zinc-500 uppercase">Consumed: </p>
                <p className="text-base font-bold text-[#E11D2E]">${category.spent.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Progress indicators */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                  <span>Projected Spent (In Cart)</span>
                  <span className="font-bold text-[#E11D2E]">{projectedPct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#0F0F0F] rounded-full overflow-hidden relative">
                  {/* Commited spent */}
                  <div
                    className="h-full bg-emerald-500 absolute left-0 top-0 transition-all duration-500"
                    style={{ width: `${Math.min(100, spentPct)}%` }}
                  />
                  {/* Pending in cart */}
                  <div
                    className="h-full bg-[#E11D2E] absolute top-0 transition-all duration-500"
                    style={{
                      left: `${Math.min(100, spentPct)}%`,
                      width: `${Math.min(100 - spentPct, (cartAmountForCategory / category.budget) * 100)}%`
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono py-1.5 bg-[#0F0F0F] px-3.5 rounded-lg border border-white/5">
                <span className="text-zinc-500 uppercase">Available Cap Limit:</span>
                <span className="font-bold text-emerald-400">${remainingBudget.toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Filters & Product Search */}
        <div className="bg-[#161616] rounded-2xl p-4 border border-white/5 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          
          {/* Search Input Box */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder={`Search items in ${category.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#0F0F0F] border border-white/5 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E11D2E] transition font-medium"
            />
          </div>

          {/* Action summaries */}
          <div className="text-[10px] text-zinc-500 font-extrabold font-mono tracking-wide">
            RECORDS: {filteredProducts.length} OF {products.filter((p) => p.category === category.id).length} CATALOGED
          </div>
        </div>

        {/* Grid: Selected sector products */}
        {filteredProducts.length === 0 ? (
          <div className="bg-[#161616] rounded-2xl border border-white/5 p-16 text-center shadow-sm">
            <SlidersHorizontal size={36} className="mx-auto text-zinc-600 mb-4" />
            <p className="text-white font-extrabold font-display uppercase tracking-wider text-xs">No matching supplies located</p>
            <p className="text-[10px] text-zinc-400 mt-1">Configure your procurement filters or browse another kitchen sector.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p) => {
              const currentQtyInput = quantities[p.id] || 1;
              return (
                <div
                  key={p.id}
                  className="bg-[#161616] border border-white/5 rounded-2xl overflow-hidden shadow-sm hover:border-[#E11D2E]/30 transition-all flex flex-col justify-between group relative"
                >
                  {/* Thumbnail */}
                  <div
                    className="h-52 relative overflow-hidden bg-black flex items-center justify-center cursor-pointer"
                    onClick={() => navigate(`/products/${p.id}`)}
                  >
                    <Image
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    
                    {/* Stock tag */}
                    <span className={`absolute bottom-3 left-3 text-[8px] uppercase font-bold tracking-widest px-2.5 py-1 rounded shadow-md ${p.stock <= 10 ? "bg-[#E11D2E] text-white animate-pulse" : "bg-black text-white"}`}>
                      STOCK: {p.stock} UNITS
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div onClick={() => navigate(`/products/${p.id}`)} className="cursor-pointer">
                      <h3 className="font-extrabold text-sm text-white mb-2 line-clamp-1 group-hover:text-[#E11D2E] transition uppercase font-display">
                        {p.name}
                      </h3>
                      <p className="text-xs text-[#B3B3B3] line-clamp-2 leading-relaxed mb-4 font-normal">
                        {p.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <div className="flex justify-between items-baseline mb-4 font-mono">
                        <span className="text-[9px] text-zinc-500 uppercase">Unit Lot Price</span>
                        <span className="text-base font-bold text-white">${p.price.toFixed(2)}</span>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max={p.stock}
                          value={currentQtyInput}
                          onChange={(e) => handleQuantityChange(p.id, parseInt(e.target.value) || 1)}
                          className="w-16 text-center border border-white/5 bg-[#0F0F0F] rounded-lg py-2 text-xs text-white focus:outline-none focus:border-[#E11D2E] font-mono font-bold"
                          title="Enter quantity"
                        />
                        
                        <button
                          onClick={() => handleAdd(p)}
                          className="flex-1 bg-[#E11D2E] hover:bg-[#E11D2E]/90 text-white font-bold text-[10px] py-2.5 rounded-lg uppercase tracking-widest transition cursor-pointer flex items-center justify-center space-x-1"
                        >
                          <ShoppingCart size={12} />
                          <span>STAGED DEBIT</span>
                        </button>
                      </div>

                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
