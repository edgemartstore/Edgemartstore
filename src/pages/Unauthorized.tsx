import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Landmark } from "lucide-react";

export const Unauthorized: React.FC = () => {
  return (
    <div className="bg-[#050505] text-[#FFFFFF] min-h-screen flex flex-col justify-center items-center px-4 font-sans select-none">
      <div className="max-w-md w-full bg-[#111111] border border-white/5 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-650" />
        
        {/* Glow */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-red-600/10 rounded-full filter blur-xl pointer-events-none" />

        <ShieldAlert size={48} className="text-red-650 mx-auto mb-4" />
        
        <h1 className="text-xl font-black font-display uppercase tracking-widest text-white">
          ACCESS BLOCKED
        </h1>
        
        <p className="text-[10px] font-mono tracking-widest text-red-500 font-bold uppercase mt-1">
          // ZERO-TRUST PERMISSION VIOLATION
        </p>

        <p className="text-zinc-500 text-xs mt-4 leading-relaxed font-medium">
          The requested administrative directory is restricted to authorized executive staff. 
          Your digital profile is not listed in the immutable ledger. 
          All unauthorized access logs are automatically archived for compliance audits.
        </p>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col space-y-3">
          <Link
            to="/login"
            className="w-full bg-red-650 hover:bg-zinc-900 border border-red-650 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl transition duration-150 flex items-center justify-center space-x-2"
          >
            <span>Authenticate Session</span>
          </Link>
          
          <Link
            to="/"
            className="w-full bg-[#161616] hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl transition duration-150 flex items-center justify-center space-x-2"
          >
            <ArrowLeft size={12} />
            <span>Return to Edge Mart</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
