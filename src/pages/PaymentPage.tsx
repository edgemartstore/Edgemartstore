import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { doc, getDoc, collection, query, where, getDocs, addDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Order, PaymentMethod } from "../types";
import { Landmark, ArrowLeft, Upload, Loader2, CheckCircle2, ShieldCheck, CreditCard, AlertCircle } from "lucide-react";
import { Image } from "../components/Image";

export const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, profile } = useStore();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(true);
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch target purchase order from Firestore
  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const orderDoc = await getDoc(doc(db, "orders", orderId));
        if (orderDoc.exists()) {
          setOrder({ id: orderDoc.id, ...orderDoc.data() } as Order);
        }
      } catch (err) {
        console.error("Error reading order record:", err);
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // Fetch enabled payment methods
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const q = query(collection(db, "paymentMethods"), where("enabled", "==", true));
        const snap = await getDocs(q);
        const list: PaymentMethod[] = [];
        snap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as PaymentMethod);
        });

        // Set default list if empty
        if (list.length === 0) {
          const defaults: PaymentMethod[] = [
            {
              id: "zelle-default",
              type: "zelle",
              name: "Zelle Enterprise Transfer",
              details: "Email: treasury@edgemartbilling.com | Receipient: Edge Mart LLC",
              enabled: true,
              createdAt: new Date().toISOString()
            },
            {
              id: "btc-default",
              type: "crypto",
              name: "Bitcoin Corporate Multi-Sig Wallet",
              details: "BTC Address: bc1q8vj5q22p56u4eajwsn97p39s894q2990shj8rt",
              enabled: true,
              createdAt: new Date().toISOString()
            },
            {
              id: "wire-default",
              type: "wire",
              name: "Chase Treasury Wire Account",
              details: "Bank: Chase Manhattan Bank | Routing: 021000021 | Acct#: 90123456789 | Name: Edge Mart Wholesale LLC",
              enabled: true,
              createdAt: new Date().toISOString()
            }
          ];
          setPaymentMethods(defaults);
        } else {
          setPaymentMethods(list);
          setSelectedMethod(list[0]);
        }
      } catch (err) {
        console.error("Error standardizing payment list:", err);
      } finally {
        setLoadingMethods(false);
      }
    };

    fetchMethods();
  }, []);

  // Set default selected method once methods load
  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedMethod) {
      setSelectedMethod(paymentMethods[0]);
    }
  }, [paymentMethods, selectedMethod]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Content = reader.result as string;

        // Post payload to our Cloudinary backend proxy endpoint
        const response = await fetch("/api/upload-cloudinary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64Content }),
        });

        if (!response.ok) {
          throw new Error("Transacting server declined mock payload.");
        }

        const data = await response.json();
        setReceiptUrl(data.url);
        setIsUploading(false);
      };
    } catch (err: any) {
      console.error("Proof submission failure:", err);
      setUploadError("Underlying Cloudinary upload faulted. Please retry.");
      setIsUploading(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!order || !selectedMethod || !receiptUrl) return;

    try {
      // 1. Create paymentReceipt in Firestore
      const recId = `receipt_${order.id}`;
      await setDoc(doc(db, "paymentReceipts", recId), {
        id: recId,
        userId: user?.uid || "unauthenticated_guest",
        userName: profile?.name || user?.email?.split("@")[0] || "Customer",
        userEmail: user?.email || "treasury@support.edgemart.com",
        orderId: order.id,
        totalAmount: order.totalAmount,
        paymentMethodId: selectedMethod.id,
        paymentMethodName: selectedMethod.name,
        receiptUrl: receiptUrl,
        createdAt: new Date().toISOString(),
        status: "pending"
      });

      // 2. Set order status as pending review
      await setDoc(doc(db, "orders", order.id), {
        status: "pending"
      }, { merge: true });

      // 3. Create a Dashboard notification for customer
      const notId = `not_${Date.now()}`;
      await setDoc(doc(db, "notifications", notId), {
        id: notId,
        userId: user?.uid || "unauthenticated_guest",
        title: "Receipt Received",
        message: `Your payment proof for Order ${order.id.slice(-6).toUpperCase()} has been logged for corporate underwriting audit clearance.`,
        read: false,
        createdAt: new Date().toISOString()
      });

      setIsSuccess(true);
    } catch (err) {
      console.error("Receipt writing faulted:", err);
      setUploadError("Asset writing failed standard Firestore rule verification check.");
    }
  };

  if (loadingOrder) {
    return (
      <div className="bg-[#050505] text-white min-h-screen flex items-center justify-center font-sans">
        <div className="text-center space-y-3.5">
          <Loader2 size={36} className="animate-spin text-[#E11D2E] mx-auto" />
          <p className="text-sm font-semibold uppercase tracking-widest text-[#B3B3B3]">Retrieving Ledger Assets...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-[#050505] text-white min-h-screen py-24 select-none font-sans flex flex-col items-center justify-center text-center px-4">
        <AlertCircle size={48} className="text-[#E11D2E] mb-4" />
        <h2 className="text-xl font-bold uppercase tracking-wider mb-2">Invalid Invoice ID</h2>
        <p className="text-[#B3B3B3] text-xs max-w-sm mb-6 leading-relaxed">
          The requested wholesale checkout receipt order was either deleted, audited out, or never finalized.
        </p>
        <Link to="/" className="bg-[#E11D2E] hover:bg-red-700 text-white font-bold text-xs uppercase px-6 py-3 tracking-widest rounded-lg">
          Back to landing
        </Link>
      </div>
    );
  }

  const orderShortId = order.id.slice(-6).toUpperCase();

  return (
    <div className="bg-[#050505] text-[#FFFFFF] min-h-screen py-12 font-sans select-none">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header Breadcrumb */}
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center space-x-2 text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-wider mb-8 transition cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Exit to marketplace</span>
        </button>

        {isSuccess ? (
          <div className="bg-[#161616] border border-white/5 rounded-3xl p-8 md:p-12 text-center space-y-6 max-w-2xl mx-auto">
            <div className="p-4 bg-emerald-950/40 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-emerald-400 border border-emerald-800/40">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black font-display text-white uppercase tracking-tight">PROOF UNDER AUDIT STATUS</h1>
              <p className="text-xs text-[#B3B3B3] leading-relaxed max-w-md mx-auto">
                Thank you. Your receipt proof for Invoice <strong className="text-white">#{orderShortId}</strong> was logged successfully inside the cloud ledger tracking center. Our corporate desk will review compliance within 2 to 4 business hours.
              </p>
            </div>
            <div className="p-4 bg-[#0F0F0F] rounded-xl border border-white/5 max-w-sm mx-auto flex items-center space-x-3 text-left">
              <ShieldCheck size={20} className="text-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-white uppercase tracking-wider">Secured Verification</p>
                <p className="text-[9px] text-[#B3B3B3]">Rules verification checking complete. DB state sync confirmed.</p>
              </div>
            </div>
            <div className="pt-4 flex justify-center space-x-4">
              <Link
                to="/dashboard"
                className="px-6 py-3 bg-[#E11D2E] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest rounded-lg transition"
              >
                Go to Dashboard
              </Link>
              <Link
                to="/"
                className="px-6 py-3 bg-[#0F0F0F] hover:bg-zinc-800 border border-white/5 text-zinc-300 font-bold text-xs uppercase tracking-widest rounded-lg transition"
              >
                Marketplace Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Invoice summary info (2 cols on lg) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#161616] p-6 rounded-2xl border border-white/5 space-y-4">
                <div>
                  <span className="text-[8px] font-extrabold uppercase tracking-widest bg-[#E11D2E]/10 text-[#E11D2E] px-2.5 py-1 rounded">
                    WHolesale Invoice
                  </span>
                  <h2 className="text-xl font-black font-display uppercase tracking-tight text-white mt-3">ORDER #{orderShortId}</h2>
                  <p className="text-[9px] text-zinc-500 font-mono mt-1">UUID: {order.id}</p>
                </div>

                <div className="border-t border-b border-white/5 py-4 space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] font-mono">
                      <span className="text-zinc-400 line-clamp-1 max-w-[120px]">{item.name} <strong className="text-white font-normal">x{item.quantity}</strong></span>
                      <span className="text-white">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-baseline pt-2">
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider font-mono">Total Debited:</span>
                  <span className="text-2xl font-black text-white font-mono">${order.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 bg-[#0F0F0F] rounded-xl border border-white/5 space-y-2 text-zinc-500 leading-normal text-[11px]">
                <p className="font-extrabold uppercase text-white tracking-wider flex items-center font-mono">
                  <ShieldCheck size={14} className="text-[#E11D2E] mr-1" />
                  Corporate Clear Rule
                </p>
                <p className="font-normal font-sans">
                  Edge Mart requires that a valid receipt screenshot be attached for bank audits before products can clear logistical delivery depots.
                </p>
              </div>
            </div>

            {/* Payment Method selectors (3 cols on lg) */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-[#161616] p-6 rounded-2xl border border-white/5 space-y-6">
                <div>
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-display">CHOOSE CORPORATE ROUTING NODE</h3>
                  <p className="text-[10px] text-zinc-400 mt-1">Select an active administrative settlement node to retrieve credentials.</p>
                </div>

                <div className="space-y-3">
                  {paymentMethods.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedMethod(m);
                        setReceiptUrl(null);
                        setUploadError(null);
                      }}
                      className={`p-3 rounded-xl border transition cursor-pointer text-left ${
                        selectedMethod?.id === m.id
                          ? "border-[#E11D2E] bg-[#0F0F0F]"
                          : "border-white/5 bg-[#050505] hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center space-x-3 col-span-2">
                        <div className={`p-2 rounded-lg ${selectedMethod?.id === m.id ? "bg-[#E11D2E]/10 text-[#E11D2E]" : "bg-zinc-900 text-zinc-500"}`}>
                          <Landmark size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-wider font-display">{m.name}</p>
                          <p className="text-[9px] text-zinc-500 uppercase font-mono mt-0.5">TYPE: {m.type}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Routing info Details */}
                {selectedMethod && (
                  <div className="bg-[#0F0F0F] rounded-xl p-4 border border-white/5 space-y-2">
                    <p className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider">routing details for settlement</p>
                    <p className="text-xs text-white font-mono select-text break-all p-2 bg-black/40 rounded border border-white/5">
                      {selectedMethod.details}
                    </p>
                    <p className="text-[9px] text-zinc-400 font-semibold tracking-wide uppercase italic">
                      ⚠ Reference your Invoice #{orderShortId} in structural payment memos.
                    </p>
                  </div>
                )}

                {/* Proof Uploader block */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">ATTACH DEPOSIT RECEIPT PROOF</h4>
                    <p className="text-[10px] text-zinc-400 mt-1">Upload JPEG, PNG image or PDF proof received from your dynamic client.</p>
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                      receiptUrl
                        ? "border-emerald-500/40 bg-emerald-950/10"
                        : "border-white/10 hover:border-[#E11D2E]/40 hover:bg-white/5"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    {isUploading ? (
                      <div className="space-y-2">
                        <Loader2 size={24} className="animate-spin text-[#E11D2E] mx-auto" />
                        <p className="text-[10px] text-[#B3B3B3] font-mono">UPLOADING RECEIPT PROOF SECURELY...</p>
                      </div>
                    ) : receiptUrl ? (
                      <div className="space-y-2">
                        <div className="max-h-24 mx-auto overflow-hidden rounded border border-emerald-500/30 max-w-[120px]">
                          <img src={receiptUrl} alt="Receipt proof preview" className="object-cover h-16 w-full" />
                        </div>
                        <p className="text-[10px] text-emerald-400 font-Mono font-bold uppercase tracking-wider flex items-center justify-center">
                          <ShieldCheck size={12} className="mr-1" />
                          Proof Upload Verified
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload size={24} className="text-zinc-650 mx-auto" />
                        <p className="text-xs text-white font-semibold">Click to select receipt proof screenshot</p>
                        <p className="text-[9px] text-zinc-500 uppercase font-mono">PNG, JPG formats supported</p>
                      </div>
                    )}
                  </div>

                  {uploadError && (
                    <div className="bg-red-950/30 border border-red-800/40 p-3 rounded-lg flex items-start space-x-2 text-[10px] text-red-300">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleSubmitProof}
                    disabled={!receiptUrl || isUploading}
                    className="w-full bg-[#E11D2E] hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-[#E11D2E] text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-lg transition shrink-0 cursor-pointer"
                  >
                    SUBMIT TRANSACTION PROOF FOR REVIEW
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
