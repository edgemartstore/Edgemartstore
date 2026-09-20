import React, { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { ShoppingCart, ArrowLeft, ShieldAlert, Sparkles } from "lucide-react";
import { Image } from "../components/Image";

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { products, categories, addToCart, getCategoryRemainingBudget } = useStore();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  // Locate the product matching dynamic ID parameter
  const product = useMemo(() => {
    return products.find((p) => p.id === id);
  }, [products, id]);

  const category = useMemo(() => {
    if (!product) return null;
    return categories.find((c) => c.id === product.category);
  }, [categories, product]);

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-32 text-center bg-[#050505] text-white">
        <h2 className="text-2xl font-black font-display text-white uppercase mb-4">Product Not Found</h2>
        <p className="text-[#B3B3B3] text-sm mb-6">This item is not registered in our warehouse directories.</p>
        <Link to="/shop" className="bg-[#E11D2E] px-6 py-3 text-white text-xs font-bold uppercase rounded-lg">
          Browse Categories
        </Link>
      </div>
    );
  }

  const remainingBudget = category ? getCategoryRemainingBudget(category.id) : 0;

  const handleAdd = () => {
    const res = addToCart(product, quantity);
    if (res.success) {
      alert(`Asset Added: ${quantity} units of "${product.name}" booked into your active session cart.`);
      setQuantity(1);
    } else {
      alert(`Procurement Check Blocked:\n${res.error}`);
    }
  };

  return (
    <div className="bg-[#050505] text-[#FFFFFF] min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back CTA */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider mb-8 transition cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to catalog</span>
        </button>

        {/* Main product configuration container */}
        <div className="bg-[#161616] rounded-3xl border border-white/5 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-12 p-8 md:p-12">
          
          {/* Left column: image panel */}
          <div className="relative h-96 md:h-[450px] bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-white/5">
            <Image
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover animate-fade-in"
            />
            
            {category && (
              <span className="absolute top-4 left-4 bg-[#E11D2E] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded">
                Sectors / {category.name}
              </span>
            )}

            {product.stock <= 10 && (
              <span className="absolute bottom-4 right-4 bg-amber-500 text-black text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded font-mono">
                CRITICALLY LOW STOCK ({product.stock} LEFT)
              </span>
            )}
          </div>

          {/* Right column: specifications panel */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center space-x-1 text-[#E11D2E] font-black text-[9px] uppercase tracking-widest font-mono mb-2">
                <Sparkles size={11} />
                <span>QUALIFIED BULK ASSET</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono block">
                SKU ID: {product.id}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display uppercase tracking-tight mt-1 mb-4 leading-none">
                {product.name}
              </h1>

              {/* Price badge line */}
              <div className="mb-6 pb-6 border-b border-white/5 flex items-center justify-between font-mono">
                <div>
                  <p className="text-[9px] text-zinc-500 uppercase">Unit Lot Procure Rate</p>
                  <p className="text-3xl font-black text-white">${product.price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-zinc-500 uppercase">Available Supply</p>
                  <p className={`text-base font-bold ${product.stock < 15 ? "text-amber-500" : "text-white"}`}>
                    {product.stock} Packs
                  </p>
                </div>
              </div>

              {/* Description list */}
              <div className="space-y-4 mb-8">
                <p className="text-xs text-[#B3B3B3] leading-relaxed font-normal">
                  {product.description}
                </p>
                
                <div className="p-4 bg-[#0F0F0F] border border-white/5 rounded-xl space-y-2">
                  <p className="text-xs font-bold text-white uppercase tracking-wider flex items-center font-mono">
                    <ShieldAlert size={14} className="text-[#E11D2E] mr-1.5 shrink-0" />
                    BUDGET OVERRIDE ENFORCEMENT
                  </p>
                  <p className="text-[11px] text-[#B3B3B3]">
                    Spending ledger: <strong className="text-white font-semibold">{category?.name}</strong>. Zero-trust check gates actively monitor this allocation pool.
                  </p>
                  <div className="flex justify-between text-xs font-mono pt-2 text-zinc-500 border-t border-white/5 mt-1">
                    <span>Remaining Sector Balance:</span>
                    <span className="font-bold text-emerald-400">${remainingBudget.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t border-white/5">
              <div className="flex items-center space-x-4">
                <div className="flex flex-col">
                  <label className="text-[10px] text-zinc-500 uppercase font-mono mb-1">Lot Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(product.stock, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-24 text-center border border-white/5 bg-[#0F0F0F] rounded-lg py-3 font-mono font-bold text-white focus:outline-none focus:border-[#E11D2E]"
                    title="Configure quantity"
                  />
                </div>

                <div className="flex-1 flex flex-col justify-end">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono mb-1 invisible">Submit</span>
                  <button
                    onClick={handleAdd}
                    className="w-full bg-[#E11D2E] hover:bg-[#E11D2E]/90 text-white font-bold text-xs py-3.5 rounded-lg uppercase tracking-widest transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <ShoppingCart size={14} />
                    <span>Stage Wholesale Debit</span>
                  </button>
                </div>
              </div>
              
              <p className="text-[10px] text-zinc-500 text-center mt-3 font-mono">
                Note: Budget reservations are locked in at check-out time.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
