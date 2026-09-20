import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Truck, Landmark, RefreshCw } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-16 border-t border-zinc-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Core Value Props Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 pb-12 border-b border-zinc-800">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-zinc-900 rounded-xl text-red-500 border border-zinc-800">
              <Landmark size={24} />
            </div>
            <div>
              <p className="font-bold text-sm uppercase tracking-wider font-display">Category Budgets</p>
              <p className="text-xs text-zinc-400">Strictly enforced category spending control.</p>
            </div>
          </div>
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-zinc-900 rounded-xl text-red-500 border border-zinc-800">
              <Truck size={24} />
            </div>
            <div>
              <p className="font-bold text-sm uppercase tracking-wider font-display">Bulk Logistics</p>
              <p className="text-xs text-zinc-400">Scheduled wholesale fleet distribution.</p>
            </div>
          </div>
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-zinc-900 rounded-xl text-red-500 border border-zinc-800">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="font-bold text-sm uppercase tracking-wider font-display">Zero Trust Auth</p>
              <p className="text-xs text-zinc-400">Fully secured through Firebase rules.</p>
            </div>
          </div>
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-zinc-900 rounded-xl text-red-500 border border-zinc-800">
              <RefreshCw size={24} />
            </div>
            <div>
              <p className="font-bold text-sm uppercase tracking-wider font-display">State Persistence</p>
              <p className="text-xs text-zinc-400">Real-time Cloud Firestore syncing.</p>
            </div>
          </div>
        </div>

        {/* Brand Information and Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-zinc-400 text-sm mb-12">
          
          {/* Brand Col */}
          <div>
            <div className="flex items-center space-x-2.5 mb-4">
              <div className="h-6 w-1 bg-red-650"></div>
              <h3 className="text-xl font-black text-white tracking-tighter font-display uppercase">
                EDGE<span className="text-red-650">MART</span>
              </h3>
            </div>
            <p className="leading-relaxed mb-4">
              Edge Mart is the world's leading enterprise bulk grocery marketplace. We provide powerful category-level budget tracking and control, ensuring large-scale food procurement remains perfectly aligned with corporate dynamic balance allowances.
            </p>
            <p className="text-xs text-red-500 font-semibold tracking-wider uppercase">
              ● PROVISIONED ENTERPRISE MODE
            </p>
          </div>

          {/* Quick Browse Col */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-widest font-display mb-4 text-sm">
              Quick Directory
            </h4>
            <ul className="space-y-3 font-medium">
              <li>
                <Link to="/" className="hover:text-red-500 transition">Storefront Landing</Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-red-500 transition">Explore Budgets & Categories</Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-red-500 transition">Shopping Bag</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-red-500 transition">My Order History</Link>
              </li>
            </ul>
          </div>

          {/* Support and System col */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-widest font-display mb-4 text-sm">
              Secured Operations
            </h4>
            <p className="mb-4">
              Our bulk payment gateways, client-side budget verification hooks, and database access are strictly secured against identity spoofing and privilege escalation.
            </p>
            <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-xl text-xs text-zinc-500 leading-relaxed font-mono">
              <span className="text-zinc-350">Region:</span> europe-west2<br/>
              <span className="text-zinc-350">Persist:</span> Cloud Firestore Enterprise<br/>
              <span className="text-zinc-350">Service:</span> Secure Audit Invoice Dispatch
            </div>
          </div>

        </div>

        {/* Bottom copyright bar */}
        <div className="border-t border-zinc-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-zinc-600 text-xs text-center sm:text-left">
          <p>© 2026 Edge Mart Procurement Ltd. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 sm:mt-0">
            <a href="#rules" className="hover:text-zinc-400 transition">Security Rules</a>
            <span className="text-zinc-800">|</span>
            <a href="#budget" className="hover:text-zinc-400 transition">Budget Thresholds</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
