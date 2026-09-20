import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, onSnapshot, setDoc, query, orderBy } from "firebase/firestore";
import { db, OperationType, handleFirestoreError } from "../lib/firebase";
import { Product, Category, UserProfile, Order, PaymentReceipt, SupportConversation, SupportMessage } from "../types";
import {
  ShieldCheck, LayoutDashboard, Package, Tags, Receipt, Settings,
  Plus, Edit2, Trash2, Upload, Coins, ClipboardList, CheckCircle2,
  Users, DollarSign, Wallet, ArrowUpRight, Loader2, RefreshCw, Layers,
  CheckCircle, XCircle, Eye, MessageSquare, Check, Send, AlertTriangle, Image as ImageIcon
} from "lucide-react";
import { Image } from "../components/Image";

export const AdminDashboard: React.FC = () => {
  const { user, profile, products, categories, orders } = useStore();
  const navigate = useNavigate();

  // Active sub-navigation tabs
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "categories" | "orders" | "reviews" | "chats" | "settings">("overview");

  // Core data registries
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Payment receipts administration
  const [receiptsList, setReceiptsList] = useState<PaymentReceipt[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [activeRejectionInputId, setActiveRejectionInputId] = useState<string | null>(null);

  // Live support chats administration
  const [conversationsList, setConversationsList] = useState<SupportConversation[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<SupportMessage[]>([]);
  const [adminChatReplyText, setAdminChatReplyText] = useState("");
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Product addition upload base64 states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editProductImage, setEditProductImage] = useState("");

  // Product Form states
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [prodFormName, setProdFormName] = useState("");
  const [prodFormPrice, setProdFormPrice] = useState("");
  const [prodFormStock, setProdFormStock] = useState("");
  const [prodFormCategory, setProdFormCategory] = useState("fresh-produce");
  const [prodFormDesc, setProdFormDesc] = useState("");
  
  // Category Form states
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [catFormName, setCatFormName] = useState("");
  const [catFormBudget, setCatFormBudget] = useState("");

  // Brand Dynamic Favicon Settings
  const [faviconUrl, setFaviconUrl] = useState("https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=100&auto=format&fit=crop");

  // Zero-Trust Administrative Security Shield gate checks
  useEffect(() => {
    if (!user) {
      navigate("/admin/login");
      return;
    }
    if (user && user.email !== "edgemartstores.site@gmail.com") {
      console.warn(`[SECURITY WARN] Unauthorized admin panel entry attempt blocked for user: ${user.email}`);
      navigate("/unauthorized");
      return;
    }
    if (profile && profile.role !== "admin") {
      console.warn(`[SECURITY WARN] User with email ${user.email} lacks administrative database roles. Redirection dispatched.`);
      navigate("/unauthorized");
    }
  }, [user, profile, navigate]);

  // 1. Snapshot Listener for Registered Customers
  useEffect(() => {
    if (profile?.role !== "admin") return;

    setLoadingUsers(true);
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const uList: UserProfile[] = [];
      snap.forEach((docSnap) => {
        uList.push(docSnap.data() as UserProfile);
      });
      setUsersList(uList);
      setLoadingUsers(false);
    }, (err) => {
      console.warn("User fetch bypassed due to rules validation", err);
      setLoadingUsers(false);
    });

    return () => unsubUsers();
  }, [profile]);

  // 2. Snapshot Listener for uploaded Payment Receipts
  useEffect(() => {
    if (profile?.role !== "admin") return;

    setLoadingReceipts(true);
    const receiptsRef = collection(db, "paymentReceipts");
    const q = query(receiptsRef, orderBy("submittedAt", "desc"));
    
    const unsubReceipts = onSnapshot(q, (snap) => {
      const rList: PaymentReceipt[] = [];
      snap.forEach((docSnap) => {
        rList.push(docSnap.data() as PaymentReceipt);
      });
      setReceiptsList(rList);
      setLoadingReceipts(false);
    }, (err) => {
      console.error("Failed to load receipts list:", err);
      setLoadingReceipts(false);
    });

    return () => unsubReceipts();
  }, [profile]);

  // 3. Snapshot Listener for Live Chat Conversations
  useEffect(() => {
    if (profile?.role !== "admin") return;

    setLoadingConvos(true);
    const convosRef = collection(db, "support_conversations");
    const q = query(convosRef, orderBy("lastMessageAt", "desc"));
    
    const unsubConvos = onSnapshot(q, (snap) => {
      const cList: SupportConversation[] = [];
      snap.forEach((docSnap) => {
        cList.push(docSnap.data() as SupportConversation);
      });
      setConversationsList(cList);
      setLoadingConvos(false);
    }, (err) => {
      console.error("Failed to load support threads:", err);
      setLoadingConvos(false);
    });

    return () => unsubConvos();
  }, [profile]);

  // 4. Snapshot Listener for messages inside a selected support thread
  useEffect(() => {
    if (!selectedConvoId || profile?.role !== "admin") return;

    const messagesRef = collection(db, "support_conversations", selectedConvoId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubMessages = onSnapshot(q, (snap) => {
      const mList: SupportMessage[] = [];
      snap.forEach((docSnap) => {
        mList.push(docSnap.data() as SupportMessage);
      });
      setActiveMessages(mList);
      // Scroll to chat base
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubMessages();
  }, [selectedConvoId, profile]);

  // Core business financials
  const stats = React.useMemo(() => {
    const totalTransactions = orders.length;
    const grossRevenue = orders.reduce((sum, ord) => sum + ord.totalAmount, 0);
    const totalAssignedBudget = categories.reduce((sum, c) => sum + c.budget, 0);
    const totalSpentInDB = categories.reduce((sum, c) => sum + c.spent, 0);
    
    return {
      totalTransactions,
      grossRevenue,
      totalAssignedBudget,
      totalSpentInDB
    };
  }, [orders, categories]);

  // Approve order and settlement receipt
  const handleApproveReceipt = async (receipt: PaymentReceipt) => {
    try {
      if (!window.confirm("Approve this payment screenshot? This will dispatch an automated receipt status email to the buyer.")) return;

      // Update receipt in Firestore
      await updateDoc(doc(db, "paymentReceipts", receipt.id), {
        status: "approved"
      });

      // Update Order document state
      await updateDoc(doc(db, "orders", receipt.orderId), {
        status: "approved"
      });

      // Locate user object for matching email address
      const associatedUser = usersList.find(u => u.id === receipt.userId);
      const targetEmail = associatedUser?.email || "customer@edgemart-purchaser.com";

      // Call backend api proxy to send success approval email
      await fetch("/api/send-approval-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: targetEmail,
          orderId: receipt.orderId,
          approvedDate: new Date().toLocaleString(),
          deliveryInfo: "Cleared accounting verification. Scheduled for temperature-controlled priority shipment dispatch."
        })
      });

      // Inject system notifications in Firestore
      const notifId = `notif_${Date.now()}`;
      await setDoc(doc(db, "notifications", notifId), {
        id: notifId,
        userId: receipt.userId,
        title: "Dispatched & Cleared",
        text: `Your bulk order #${receipt.orderId.slice(-6).toUpperCase()} has cleared financial checks. Shipping logistics active.`,
        createdAt: new Date().toISOString(),
        read: false
      });

      alert("Cleared! Order successfully approved and invoice notifications dispatched.");
    } catch (err: any) {
      alert("Verification update failed: " + err.message);
    }
  };

  // Reject order and settlement receipt
  const handleRejectReceipt = async (receipt: PaymentReceipt) => {
    const reasonValue = rejectionReasons[receipt.id];
    if (!reasonValue || !reasonValue.trim()) {
      alert("Compliance Overrule requires specifying a formal rejection justification.");
      return;
    }

    try {
      // Update receipt document
      await updateDoc(doc(db, "paymentReceipts", receipt.id), {
        status: "rejected",
        rejectionReason: reasonValue
      });

      // Update Order document
      await updateDoc(doc(db, "orders", receipt.orderId), {
        status: "rejected",
        rejectionReason: reasonValue
      });

      // Find user matching receipt userId
      const associatedUser = usersList.find(u => u.id === receipt.userId);
      const targetEmail = associatedUser?.email || "customer@edgemart-purchaser.com";

      // Call backend api proxy to transmit rejection notice
      await fetch("/api/send-rejection-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: targetEmail,
          orderId: receipt.orderId,
          rejectionReason: reasonValue
        })
      });

      // Create notification
      const notifId = `notif_${Date.now()}`;
      await setDoc(doc(db, "notifications", notifId), {
        id: notifId,
        userId: receipt.userId,
        title: "Compliance Overruled",
        text: `Receipt upload failed validation bounds check. Reason: ${reasonValue}`,
        createdAt: new Date().toISOString(),
        read: false
      });

      // Flush fields
      setActiveRejectionInputId(null);
      alert("Ledger logs updated. Rejection emails successfully dispatched to purchaser.");
    } catch (err: any) {
      alert("Decline failed: " + err.message);
    }
  };

  // Admin reply Chat Submit
  const handleAdminChatReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvoId || !adminChatReplyText.trim()) return;

    try {
      const msgId = `msg_${Date.now()}`;
      const msgRef = doc(db, "support_conversations", selectedConvoId, "messages", msgId);

      // Create message payload
      const msgPayload = {
        id: msgId,
        senderId: "admin",
        senderName: "Edge Mart Admin",
        text: adminChatReplyText,
        createdAt: new Date().toISOString()
      };

      await setDoc(msgRef, msgPayload);

      // Update thread timestamp
      await updateDoc(doc(db, "support_conversations", selectedConvoId), {
        lastMessage: adminChatReplyText,
        lastMessageAt: new Date().toISOString(),
        status: "active"
      });

      setAdminChatReplyText("");
    } catch (err: any) {
      console.error(err);
      alert("Message failed to dispatch: " + err.message);
    }
  };

  // Mark customer support conversation resolved
  const handleMarkThreadResolved = async (convoId: string, statsVal: "resolved" | "active") => {
    try {
      await updateDoc(doc(db, "support_conversations", convoId), {
        status: statsVal
      });
      alert(`Conversation status changed to ${statsVal}.`);
    } catch (err: any) {
      alert("State update stalled: " + err.message);
    }
  };

  // Product actions
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prodFormName.trim() || !prodFormPrice || !prodFormStock) {
      alert("Input details are missing.");
      return;
    }

    const price = parseFloat(prodFormPrice);
    const stock = parseInt(prodFormStock);

    if (isNaN(price) || price <= 0) {
      alert("Price must be a positive number.");
      return;
    }
    if (isNaN(stock) || stock < 0) {
      alert("Stock capacity must be equal or greater than 0.");
      return;
    }

    const productPayload: Omit<Product, "id"> = {
      name: prodFormName,
      price,
      stock,
      category: prodFormCategory,
      description: prodFormDesc || "Premium delicious corporate wholesale listing.",
      image: editProductImage || "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=500&auto=format&fit=crop"
    };

    try {
      if (editProductId) {
        await updateDoc(doc(db, "products", editProductId), { ...productPayload, id: editProductId });
        alert("Firestore dynamic database synchronized successfully.");
      } else {
        const customId = `${prodFormCategory}-${Date.now()}`;
        await setDoc(doc(db, "products", customId), { ...productPayload, id: customId });
        alert("Dynamic catalog updated inside Cloud Firestore.");
      }

      handleCloseProductForm();
    } catch (err: any) {
      alert("Transaction failed: " + err.message);
    }
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditProductId(prod.id);
    setProdFormName(prod.name);
    setProdFormPrice(prod.price.toString());
    setProdFormStock(prod.stock.toString());
    setProdFormCategory(prod.category);
    setProdFormDesc(prod.description);
    setEditProductImage(prod.image);
    setProductFormOpen(true);
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!window.confirm("Caution: Delete this asset entirely from general catalog registries?")) return;
    try {
      await deleteDoc(doc(db, "products", prodId));
      alert("Asset deleted.");
    } catch (err: any) {
      alert("Action overruled by security rules: " + err.message);
    }
  };

  const handleCloseProductForm = () => {
    setEditProductId(null);
    setProdFormName("");
    setProdFormPrice("");
    setProdFormStock("");
    setProdFormCategory("fresh-produce");
    setProdFormDesc("");
    setEditProductImage("");
    setProductFormOpen(false);
  };

  // Upload Photo to Cloudinary inside admin
  const handleProductImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;

        const res = await fetch("/api/upload-cloudinary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64data })
        });

        if (!res.ok) throw new Error("Local upload proxy failed.");

        const data = await res.json();
        setEditProductImage(data.url);
        setUploadingImage(false);
        alert("Item resource published on Cloudinary CDN!");
      };
    } catch (err: any) {
      setUploadingImage(false);
      alert("CDN upload failed: " + err.message);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const res = await fetch("/api/upload-cloudinary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64data })
        });

        if (!res.ok) throw new Error("Vite backend server rejected the payload.");
        
        const data = await res.json();
        setFaviconUrl(data.url);

        const link = (document.querySelector("link[rel~='icon']") as HTMLLinkElement) || document.createElement("link");
        link.type = "image/x-icon";
        link.rel = "shortcut icon";
        link.href = data.url;
        document.getElementsByTagName("head")[0].appendChild(link);

        alert("Branding favicon injected in master DOM header successfully!");
      };
    } catch (err: any) {
      alert("Favicon setup bypassed: " + err.message);
    }
  };

  // Category change
  const handleEditCategoryOpen = (cat: Category) => {
    setEditCategoryId(cat.id);
    setCatFormName(cat.name);
    setCatFormBudget(cat.budget.toString());
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategoryId || !catFormName.trim() || !catFormBudget) return;

    const budget = parseFloat(catFormBudget);
    if (isNaN(budget) || budget < 0) {
      alert("Sector Allowance Limit must be a valid positive budget value.");
      return;
    }

    try {
      await updateDoc(doc(db, "categories", editCategoryId), {
        name: catFormName,
        budget
      });
      setEditCategoryId(null);
      alert(`${catFormName} allowance revised.`);
    } catch (err: any) {
      alert("Revision failed: " + err.message);
    }
  };

  return (
    <div className="bg-[#050505] text-[#FFFFFF] min-h-screen py-12 select-none font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Branding Panel */}
        <div className="border-b border-white/5 pb-8 mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck size={26} className="text-[#E11D2E] shrink-0" />
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display uppercase leading-none">
                ADMIN <span className="text-[#E11D2E] font-light font-sans">CONSOLE</span>
              </h1>
            </div>
            <p className="text-zinc-500 mt-2 text-xs">
              Review and audit accounts. Clear client transactions, reply to live conversations, modify budgets, and update inventory.
            </p>
          </div>
          
          {/* Sub Navigation Bar Tab Pill Selector */}
          <div className="bg-[#0F0F0F] p-1.5 rounded-2xl flex flex-wrap gap-1 border border-white/5 shadow-inner">
            {[
              { id: "overview", label: "Overview" },
              { id: "products", label: "Inventory" },
              { id: "categories", label: "Budgets" },
              { id: "orders", label: "Ledger Logs" },
              { id: "reviews", label: "Receipt Reviews" },
              { id: "chats", label: "Customer Chats" },
              { id: "settings", label: "Brand Settings" }
            ].map((tabItem) => (
              <button
                key={tabItem.id}
                onClick={() => setActiveTab(tabItem.id as any)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition cursor-pointer ${activeTab === tabItem.id ? "bg-[#E11D2E] text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"}`}
              >
                {tabItem.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB 1: EXECUTIVE OVERVIEW PANELS */}
        {activeTab === "overview" && (
          <div className="space-y-10 animate-fade-in">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-mono text-xs">
              
              <div className="bg-[#161616] border border-white/5 p-6 rounded-2xl shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest font-mono">Gross Debited Capital</p>
                  <p className="text-2xl font-black text-white mt-1 font-sans">${stats.grossRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="p-3 bg-red-950/20 text-[#E11D2E] rounded-xl border border-[#E11D2E]/20 shrink-0">
                  <Coins size={20} />
                </div>
              </div>

              <div className="bg-[#161616] border border-white/5 p-6 rounded-2xl shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest font-mono">Ledger Transacts</p>
                  <p className="text-2xl font-black text-white mt-1 font-sans">{stats.totalTransactions}</p>
                </div>
                <div className="p-3 bg-zinc-900 border border-white/5 text-white rounded-xl shrink-0">
                  <ClipboardList size={20} />
                </div>
              </div>

              <div className="bg-[#161616] border border-white/5 p-6 rounded-2xl shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest font-mono">Active Members</p>
                  <p className="text-2xl font-black text-white mt-1 font-sans">
                    {loadingUsers ? "..." : usersList.length}
                  </p>
                </div>
                <div className="p-3 bg-zinc-900 border border-white/5 text-white rounded-xl shrink-0">
                  <Users size={20} />
                </div>
              </div>

              <div className="bg-[#161616] border border-white/5 p-6 rounded-2xl shadow-xl flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-widest font-mono">Budget Consumption</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1 font-sans">
                    {stats.totalAssignedBudget > 0 ? ((stats.totalSpentInDB / stats.totalAssignedBudget) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
                  <Wallet size={20} />
                </div>
              </div>

            </div>

            {/* User Registration list */}
            <div className="bg-[#161616] rounded-3xl border border-white/5 p-6 space-y-4">
              <h3 className="font-extrabold text-sm text-white uppercase font-display border-b border-white/5 pb-3">User Authorization Matrix</h3>
              {loadingUsers ? (
                <p className="text-xs text-zinc-500 animate-pulse font-mono uppercase tracking-wider">Loading user files safely...</p>
              ) : usersList.length === 0 ? (
                <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">No customer files available inside ledger.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0F0F0F] text-zinc-500 font-bold uppercase tracking-wider border-b border-white/5">
                        <th className="p-3 font-mono">ID Target</th>
                        <th className="p-3">Audit Name</th>
                        <th className="p-3">Official Email</th>
                        <th className="p-3">Security Level</th>
                        <th className="p-3">Cleared Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[11px] text-[#B3B3B3]">
                      {usersList.map((usr) => (
                        <tr key={usr.id} className="hover:bg-white/5">
                          <td className="p-3 text-zinc-500 text-[10px]">{usr.id}</td>
                          <td className="p-3 font-black text-white uppercase font-sans text-xs">{usr.name || "UNNAMED RETAILER"}</td>
                          <td className="p-3">{usr.email}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${usr.role === "admin" ? "bg-red-950/30 text-[#E11D2E] border border-[#E11D2E]/20" : "bg-zinc-900 text-zinc-400 border border-zinc-800"}`}>
                              {usr.role || "buyer"}
                            </span>
                          </td>
                          <td className="p-3 text-zinc-500">
                            {usr.createdAt ? new Date(usr.createdAt).toLocaleDateString() : "June 11, 2026"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: BULK ASSETS MANAGER */}
        {activeTab === "products" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <h2 className="text-lg font-black font-display text-white uppercase">Wholesale Catalog Registry</h2>
              <button
                onClick={() => setProductFormOpen(true)}
                className="px-4 py-2 bg-[#E11D2E] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition flex items-center space-x-1 cursor-pointer"
              >
                <Plus size={14} />
                <span>Publish Item</span>
              </button>
            </div>

            {/* Add product modal form */}
            {productFormOpen && (
              <div className="bg-[#161616] border border-white/5 rounded-3xl p-6 shadow-2xl space-y-4">
                <h3 className="font-extrabold text-sm text-white uppercase font-display border-b border-white/5 pb-2">
                  {editProductId ? "Revose asset details" : "Publish fresh wholesale asset"}
                </h3>

                <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#B3B3B3]">
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1.5">Asset Listing Title *</label>
                      <input
                        type="text"
                        required
                        value={prodFormName}
                        onChange={(e) => setProdFormName(e.target.value)}
                        placeholder="Ex: Wholesale Organic Red Apples Case"
                        className="w-full px-3 py-2 bg-[#0F0F0F] border border-white/5 rounded-xl text-white focus:outline-none focus:border-[#E11D2E]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1.5">Commercial price *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={prodFormPrice}
                          onChange={(e) => setProdFormPrice(e.target.value)}
                          placeholder="Ex: 14.50"
                          className="w-full px-3 py-2 bg-[#0F0F0F] border border-white/5 rounded-xl text-white focus:outline-none focus:border-[#E11D2E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1.5">Available Ware stock *</label>
                        <input
                          type="number"
                          required
                          value={prodFormStock}
                          onChange={(e) => setProdFormStock(e.target.value)}
                          placeholder="Ex: 50"
                          className="w-full px-3 py-2 bg-[#0F0F0F] border border-white/5 rounded-xl text-white focus:outline-none focus:border-[#E11D2E]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1.5">Asset Sector Category *</label>
                      <select
                        value={prodFormCategory}
                        onChange={(e) => setProdFormCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-[#0F0F0F] border border-white/5 rounded-xl text-white font-extrabold focus:outline-none focus:border-[#E11D2E]"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-1.5">Packaging Details & Specs</label>
                      <textarea
                        value={prodFormDesc}
                        onChange={(e) => setProdFormDesc(e.target.value)}
                        rows={3}
                        placeholder="Explain logistics case weight, storage conditions, unit content details..."
                        className="w-full px-3 py-2 bg-[#0F0F0F] border border-white/5 rounded-xl text-white resize-none focus:outline-none focus:border-[#E11D2E]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col justify-between space-y-4">
                    <div>
                      <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono mb-3">Product Media Photo Uploader</label>
                      
                      <div className="border border-dashed border-white/5 rounded-2xl p-6 text-center bg-[#0F0F0F] space-y-3 flex flex-col items-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProductImageSelect}
                          className="hidden"
                          id="product-image-uploader-select"
                        />
                        <label
                          htmlFor="product-image-uploader-select"
                          className="px-4 py-2 bg-[#161616] hover:bg-[#161616]/80 text-white rounded-xl border border-white/5 font-extrabold text-[10px] uppercase tracking-wider cursor-pointer"
                        >
                          Select Image File
                        </label>
                        <p className="text-[10px] text-zinc-500">Attach photos straight to high-speed Cloudinary storage CDN.</p>
                        
                        {uploadingImage && (
                          <p className="text-[10px] text-amber-400 animate-pulse font-mono uppercase tracking-wider">Sending binary to CDN...</p>
                        )}
                      </div>

                      {editProductImage && (
                        <div className="mt-4 p-2.5 bg-[#0F0F0F] border border-white/5 rounded-xl flex items-center justify-between text-[11px] font-mono">
                          <span className="truncate flex-1 max-w-[170px] text-zinc-400">{editProductImage}</span>
                          <img src={editProductImage} alt="Preview" className="w-10 h-10 object-cover rounded border border-white/5 bg-black" />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                      <button
                        type="button"
                        onClick={handleCloseProductForm}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs uppercase font-extrabold tracking-wider"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#E11D2E] hover:bg-red-700 text-white rounded-xl text-xs uppercase font-extrabold tracking-wider"
                      >
                        SAVE ASSET LISTING
                      </button>
                    </div>
                  </div>

                </form>
              </div>
            )}

            {/* Asset lists list table layout */}
            <div className="bg-[#161616] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0F0F0F] text-zinc-500 font-bold uppercase tracking-wider border-b border-white/5">
                      <th className="p-3">Reference Photo</th>
                      <th className="p-3">Asset Description</th>
                      <th className="p-3">Procurement Sector</th>
                      <th className="p-3">Price Code</th>
                      <th className="p-3">Ware Stock balance</th>
                      <th className="p-3 text-right">Admin commands</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[#B3B3B3] font-sans">
                    {products.map((p) => {
                      const catTitle = categories.find((c) => c.id === p.category)?.name || p.category;
                      return (
                        <tr key={p.id} className="hover:bg-white/5">
                          <td className="p-3">
                            <Image src={p.image} className="w-10 h-10 object-cover rounded-xl border border-white/5 bg-black shrink-0" />
                          </td>
                          <td className="p-3 font-extrabold text-white uppercase">{p.name}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[9px] uppercase tracking-wider text-zinc-400 font-mono font-bold">
                              {catTitle}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-white">${p.price.toFixed(2)}</td>
                          <td className="p-3 font-mono">
                            <span className={`px-2 py-0.5 border rounded font-black ${p.stock <= 10 ? "bg-amber-950/25 border-amber-500/20 text-amber-400 animate-pulse" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}>
                              {p.stock} units
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="p-1.5 bg-[#0F0F0F] hover:bg-[#E11D2E] hover:text-white text-zinc-400 border border-white/5 rounded transition cursor-pointer"
                              title="Edit record"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 bg-[#0F0F0F] hover:bg-[#E11D2E] hover:text-white text-zinc-400 border border-white/5 rounded transition cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: CATEGORY BUDGET ALLOCATORS */}
        {activeTab === "categories" && (
          <div className="space-y-6 animate-fade-in">
            <div className="pb-4 border-b border-white/5">
              <h2 className="text-lg font-black font-display text-white uppercase">Sector Spending allowances</h2>
              <p className="text-zinc-500 text-xs mt-1">Directly govern sector capital bounds. Overriding client allowances triggers live validation changes.</p>
            </div>

            {/* Editing Category box */}
            {editCategoryId && (
              <form onSubmit={handleCategorySubmit} className="bg-[#161616] border border-white/5 p-6 rounded-2xl max-w-xl text-xs space-y-4">
                <h3 className="font-extrabold text-white uppercase font-display border-b border-white/5 pb-2">
                  Configure Sector Allowance Limit: {categories.find(c => c.id === editCategoryId)?.name.toUpperCase()}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase font-mono tracking-widest mb-1.5">Sector display Name</label>
                    <input
                      type="text"
                      required
                      value={catFormName}
                      onChange={(e) => setCatFormName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0F0F0F] border border-white/5 rounded-xl text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase font-mono tracking-widest mb-1.5">Monetary allowance sum ($)</label>
                    <input
                      type="number"
                      required
                      value={catFormBudget}
                      onChange={(e) => setCatFormBudget(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0F0F0F] border border-white/5 rounded-xl text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setEditCategoryId(null)}
                    className="px-4 py-2 bg-zinc-800 text-white rounded-xl text-[10px] uppercase font-bold tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#E11D2E] text-white rounded-xl text-[10px] uppercase font-bold tracking-wider"
                  >
                    APPLY ALLOWANCE CAP
                  </button>
                </div>
              </form>
            )}

            {/* table categoriels list */}
            <div className="bg-[#161616] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0F0F0F] text-zinc-500 font-bold uppercase tracking-wider border-b border-white/5">
                      <th className="p-3 font-mono">Reference Key</th>
                      <th className="p-3">Sector Title</th>
                      <th className="p-3">Committed Budget bounds</th>
                      <th className="p-3">Consumed Balance</th>
                      <th className="p-3">Exhaustion Rate</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-[#B3B3B3] font-mono">
                    {categories.map((c) => {
                      const consumedPct = c.budget > 0 ? (c.spent / c.budget) * 100 : 0;
                      return (
                        <tr key={c.id} className="hover:bg-white/5">
                          <td className="p-3 text-zinc-500 font-mono text-[10px]">{c.id}</td>
                          <td className="p-3 font-black text-white font-sans uppercase text-xs">{c.name}</td>
                          <td className="p-3 font-bold text-white">${c.budget.toLocaleString()}</td>
                          <td className="p-3 font-bold text-[#E11D2E]">${(c.spent || 0).toLocaleString()}</td>
                          <td className="p-3">
                            <div className="space-y-1 w-32 font-mono text-[9px]">
                              <div className="h-1.5 w-full bg-[#0F0F0F] rounded-full overflow-hidden border border-white/5 relative">
                                <div
                                  className={`h-full ${consumedPct >= 95 ? "bg-[#E11D2E]" : consumedPct >= 75 ? "bg-amber-500" : "bg-emerald-500"}`}
                                  style={{ width: `${Math.min(100, consumedPct)}%` }}
                                />
                              </div>
                              <span className="font-bold text-zinc-500 uppercase">{consumedPct.toFixed(1)}% consumed</span>
                            </div>
                          </td>
                          <td className="p-3 text-right shrink-0">
                            <button
                              onClick={() => handleEditCategoryOpen(c)}
                              className="p-1.5 bg-[#0F0F0F] hover:bg-[#E11D2E] text-zinc-400 border border-white/5 rounded transition cursor-pointer"
                              title="Edit budget allowance"
                            >
                              <Edit2 size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: IMMUTABLE LEDGER MATRIX */}
        {activeTab === "orders" && (
          <div className="space-y-6 animate-fade-in">
            <div className="pb-4 border-b border-white/5">
              <h2 className="text-lg font-black font-display text-white uppercase font-sans">Corporate General Ledger</h2>
              <p className="text-zinc-500 text-xs mt-1">Secure, cloud-encrypted ledger history statements stored in immutable Firestore repositories.</p>
            </div>

            {orders.length === 0 ? (
              <p className="p-12 text-center text-xs font-mono uppercase text-zinc-500">No active client bills archived currently.</p>
            ) : (
              <div className="bg-[#161616] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0F0F0F] text-zinc-500 font-bold uppercase tracking-wider border-b border-white/5">
                        <th className="p-3">Cleared Timestamp</th>
                        <th className="p-3">Invoice receipt Reference</th>
                        <th className="p-3">Buyer ID Hash</th>
                        <th className="p-3">Package Cargo load</th>
                        <th className="p-3">Total Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-400 font-mono text-[11px]">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-white/5">
                          <td className="p-3 text-zinc-500">{new Date(ord.createdAt).toLocaleString()}</td>
                          <td className="p-3 font-semibold text-white">#{ord.id}</td>
                          <td className="p-3 text-zinc-500 max-w-[120px] truncate" title={ord.userId}>{ord.userId}</td>
                          <td className="p-3 text-zinc-300 font-sans text-xs uppercase font-semibold">
                            {ord.items.length} dynamic lines ({ord.items.reduce((s,i) => s + i.quantity, 0)} packs)
                          </td>
                          <td className="p-3 font-extrabold text-[#E11D2E]">${ord.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: ACTIVE TRANSACTION CLEARING CENTRE */}
        {activeTab === "reviews" && (
          <div className="space-y-6 animate-fade-in">
            <div className="pb-4 border-b border-white/5">
              <h2 className="text-lg font-black font-display text-white uppercase flex items-center">
                <Eye size={20} className="mr-2 text-[#E11D2E]" /> Payment Receipt Verification Center
              </h2>
              <p className="text-zinc-500 text-xs mt-1">
                Directly audit submitted bank wire reference files, gift voucher pins, or mobile screenshots.
              </p>
            </div>

            {loadingReceipts ? (
              <p className="text-xs text-zinc-500 animate-pulse uppercase tracking-widest font-mono">Loading active customer uploads dataset...</p>
            ) : receiptsList.length === 0 ? (
              <div className="bg-[#161616] rounded-3xl border border-white/5 p-16 text-center">
                <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">No receipts currently submitted for review checks.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 animate-slide-in">
                {receiptsList.map((rec) => {
                  const associatedUserObj = usersList.find(u => u.id === rec.userId);
                  const isPending = rec.status === "pending" || !rec.status;
                  const isRejected = rec.status === "rejected";
                  const isApproved = rec.status === "approved";

                  return (
                    <div key={rec.id} className="bg-[#161616] p-6 rounded-3xl border border-white/5 grid grid-cols-1 lg:grid-cols-3 gap-6 shadow-xl relative">
                      
                      {/* Left: Metadata details */}
                      <div className="space-y-4 text-xs font-mono">
                        <span className="inline-flex items-center space-x-1 uppercase text-[8px] tracking-widest font-extrabold font-mono border border-white/5 bg-[#0F0F0F] rounded px-2.5 py-1 text-zinc-400">
                          ID: {rec.id.slice(-8).toUpperCase()}
                        </span>

                        <div className="space-y-2">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Registrar / Billing Store</p>
                          <p className="text-white font-sans text-xs font-extrabold uppercase">{associatedUserObj?.name || "Member Store ID #"+rec.userId.slice(0, 6)}</p>
                          <p className="text-zinc-400 font-mono text-[11px]">{associatedUserObj?.email || "Pending query..."}</p>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Order Receipt</p>
                          <p className="text-[#E11D2E] font-bold">#{rec.orderId.slice(-8).toUpperCase()}</p>
                          <p className="text-zinc-500 font-mono text-[10px]">{new Date(rec.submittedAt).toLocaleString()}</p>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-white/5 text-[10px]">
                          <p className="text-zinc-500 uppercase tracking-widest">Selected Settlement channel</p>
                          <p className="text-white font-bold uppercase">{rec.paymentMethodId.replace("_", " ")}</p>
                        </div>

                        <div className="pt-2 border-t border-white/5 flex flex-wrap gap-2 items-center">
                          {isPending && (
                            <span className="px-2 py-0.5 bg-amber-950/20 text-amber-400 border border-amber-500/20 text-[9px] uppercase font-bold rounded">
                              Pending Review
                            </span>
                          )}
                          {isApproved && (
                            <span className="px-2 py-0.5 bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 text-[9px] uppercase font-bold rounded">
                              Approved & Cleared
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2 py-0.5 bg-red-950/20 text-[#E11D2E] border border-[#E11D2E]/20 text-[9px] uppercase font-bold rounded">
                              Overruled / Declined
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Cloudinary transaction proof file */}
                      <div className="space-y-2">
                        <p className="text-[9px] font-bold uppercase text-zinc-500 font-mono tracking-widest">Uploaded Document</p>
                        <div className="bg-[#0F0F0F] border border-white/5 rounded-2xl overflow-hidden h-44 relative group">
                          <Image src={rec.receiptUrl} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                          <a
                            href={rec.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-3 right-3 p-2 bg-[#161616]/90 hover:bg-[#E11D2E] text-white border border-white/5 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center shadow-lg transition"
                          >
                            <Eye size={11} className="mr-1" /> Original File
                          </a>
                        </div>
                      </div>

                      {/* Right: Verification control panel */}
                      <div className="flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <p className="text-[9px] font-bold uppercase text-zinc-500 font-mono tracking-widest animate-pulse">Compliance Resolution Actions</p>

                          {isPending && (
                            <div className="space-y-4">
                              <button
                                onClick={() => handleApproveReceipt(rec)}
                                className="w-full py-3 bg-[#E11D2E] hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition flex items-center justify-center space-x-2 shadow-lg"
                              >
                                <CheckCircle size={14} />
                                <span>APPROVE & CLEAR TRANS</span>
                              </button>

                              <div className="space-y-2 border-t border-white/5 pt-3">
                                {activeRejectionInputId !== rec.id ? (
                                  <button
                                    onClick={() => setActiveRejectionInputId(rec.id)}
                                    className="w-full py-2.5 bg-zinc-800 hover:bg-neutral-800 border border-white/5 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center space-x-1"
                                  >
                                    <XCircle size={13} />
                                    <span>Decline Transaction</span>
                                  </button>
                                ) : (
                                  <div className="space-y-2 animate-slide-in">
                                    <input
                                      type="text"
                                      value={rejectionReasons[rec.id] || ""}
                                      onChange={(e) => setRejectionReasons({ ...rejectionReasons, [rec.id]: e.target.value })}
                                      placeholder="Ex: Bank check bounced or illegible proof receipt."
                                      className="w-full px-3 py-2 bg-[#0F0F0F] rounded-xl border border-white/5 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-[#E11D2E]"
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => setActiveRejectionInputId(null)}
                                        className="px-3 py-1.5 bg-zinc-800 text-[#B3B3B3] rounded font-bold uppercase text-[9px]"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleRejectReceipt(rec)}
                                        className="flex-1 py-1.5 bg-[#E11D2E] text-white rounded font-bold uppercase text-[9px] tracking-wider"
                                      >
                                        TRANSIT DECREE TO DECLINE
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {!isPending && (
                            <div className="p-4 bg-[#0F0F0F] border border-white/5 rounded-2xl text-[11px] leading-relaxed text-[#B3B3B3]">
                              <p className="font-extrabold text-white uppercase tracking-wider mb-1">Audit status: Resolved</p>
                              <p>This verification statement was finalized. No pending controls required.</p>
                              {isRejected && rec.rejectionReason && (
                                <p className="text-[#E11D2E] font-bold mt-2 uppercase text-[10px] tracking-wider font-mono">Decline reason: {rec.rejectionReason}</p>
                              )}
                            </div>
                          )}
                        </div>

                        <p className="text-[10px] text-zinc-500 font-mono uppercase text-right tracking-tight">Safeguarded verification gateway.</p>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: SUPPORT LIVE DESK DASHBOARD */}
        {activeTab === "chats" && (
          <div className="space-y-6 animate-fade-in">
            <div className="pb-4 border-b border-white/5">
              <h2 className="text-lg font-black font-display text-white uppercase flex items-center">
                <MessageSquare size={20} className="mr-2 text-[#E11D2E]" /> Customer Live Chat Inbox Dashboard
              </h2>
              <p className="text-zinc-500 text-xs mt-1">
                Real-time support engine powered by Firestore Listeners. Provide instantaneous shipping coordination replies here.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[480px]">
              
              {/* Inbox lists (1 cols) */}
              <div className="lg:col-span-1 bg-[#161616] border border-white/5 rounded-3xl overflow-hidden flex flex-col">
                <div className="p-4 bg-[#0F0F0F] text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest border-b border-white/5">
                  Inbox Threads List ({conversationsList.length})
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-white/5 max-h-[420px]">
                  {loadingConvos ? (
                    <p className="p-6 text-xs text-zinc-500 animate-pulse font-mono uppercase text-center mt-6">Loading channels list...</p>
                  ) : conversationsList.length === 0 ? (
                    <p className="p-6 text-xs text-zinc-500 font-mono uppercase text-center mt-6">Inbox is empty</p>
                  ) : (
                    conversationsList.map((convo) => {
                      const isActive = convo.id === selectedConvoId;
                      return (
                        <div
                          key={convo.id}
                          onClick={() => setSelectedConvoId(convo.id)}
                          className={`p-4 cursor-pointer text-xs font-mono transition-all duration-200 ${isActive ? "bg-[#0F0F0F] border-l-4 border-[#E11D2E]" : "hover:bg-white/5"}`}
                        >
                          <div className="flex justify-between items-center mb-1 text-[11px]">
                            <span className="font-extrabold text-white uppercase truncate max-w-[120px] font-sans">
                              {convo.userName || convo.userEmail?.split("@")[0] || "Buyer"}
                            </span>
                            <span className="text-[9px] text-zinc-500">
                              {convo.lastMessageAt ? new Date(convo.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "June 11"}
                            </span>
                          </div>

                          <p className="text-[#B3B3B3] line-clamp-1 text-[11px] mb-2 font-light">
                            {convo.lastMessage || "Awaiting support interaction..."}
                          </p>

                          <div className="flex justify-between items-center text-[9px] pr-1">
                            <span className={convo.status === "resolved" ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold uppercase animate-pulse"}>
                              {convo.status === "resolved" ? "RESOLVED" : "ACTIVE CHAT"}
                            </span>
                            {convo.status !== "resolved" ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkThreadResolved(convo.id, "resolved");
                                }}
                                className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 hover:bg-emerald-950 text-zinc-400 hover:text-emerald-400 rounded transition font-bold"
                              >
                                Mark Ready
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkThreadResolved(convo.id, "active");
                                }}
                                className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 hover:bg-amber-950 text-zinc-400 hover:text-amber-400 rounded transition font-bold"
                              >
                                Reopen
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Thread chat display panel (2 cols) */}
              <div className="lg:col-span-2 bg-[#161616] border border-white/5 rounded-3xl overflow-hidden flex flex-col h-full">
                
                {selectedConvoId ? (
                  <div className="flex flex-col h-full overflow-hidden">
                    
                    {/* Header bar */}
                    <div className="p-4 bg-[#0F0F0F] border-b border-white/5 flex justify-between items-center text-xs">
                      <div className="space-y-0.5 text-left">
                        <p className="text-white font-extrabold uppercase font-sans">
                          {conversationsList.find(c => c.id === selectedConvoId)?.userName || "Active purchasing channel"}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {conversationsList.find(c => c.id === selectedConvoId)?.userEmail}
                        </p>
                      </div>

                      <span className="inline-flex items-center bg-[#E11D2E]/10 border border-[#E11D2E]/20 text-[#E11D2E] text-[10px] font-black px-2 py-0.5 rounded font-mono uppercase animate-pulse">
                        LIVE TERMINAL CONNECTED
                      </span>
                    </div>

                    {/* Chat messages stream */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#0F0F0F] max-h-[300px]">
                      {activeMessages.map((msg) => {
                        const isAdmin = msg.senderId === "admin";
                        return (
                          <div key={msg.id} className={`flex flex-col max-w-[80%] ${isAdmin ? "ml-auto text-right" : "text-left"}`}>
                            <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono font-bold mb-1">
                              {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            
                            <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-full ${isAdmin ? "bg-[#E11D2E] text-white rounded-tr-none text-left" : "bg-[#161616] text-[#B3B3B3] border border-white/5 rounded-tl-none font-sans"}`}>
                              {msg.text}
                              {msg.imageUrl && (
                                <div className="mt-2.5 rounded-xl overflow-hidden max-h-32 border border-white/10 relative">
                                  <Image src={msg.imageUrl} />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Chat reply footer submission */}
                    <form onSubmit={handleAdminChatReplySubmit} className="p-4 bg-[#161616] border-t border-white/5 flex gap-2">
                      <input
                        type="text"
                        value={adminChatReplyText}
                        onChange={(e) => setAdminChatReplyText(e.target.value)}
                        placeholder="Type wholesale dispatch comments or clearance guidelines here..."
                        className="flex-1 px-4 py-3 bg-[#0F0F0F] text-xs text-white placeholder-zinc-500 border border-white/5 rounded-xl focus:outline-none focus:border-[#E11D2E]"
                      />
                      <button
                        type="submit"
                        className="p-3 bg-[#E11D2E] hover:bg-red-700 text-white rounded-xl transition cursor-pointer"
                        title="Transmit comments"
                      >
                        <Send size={15} />
                      </button>
                    </form>

                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-12 space-y-4">
                    <div className="p-3 bg-[#0F0F0F] rounded-full border border-white/5 text-zinc-500">
                      <MessageSquare size={32} />
                    </div>
                    <p className="text-zinc-500 font-mono uppercase text-xs tracking-widest">Select an active client convo thread to open support terminal.</p>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

        {/* TAB 7: BRAND FAVICON LAUNCHER */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-fade-in">
            <div className="pb-4 border-b border-white/5">
              <h2 className="text-lg font-black font-display text-white uppercase flex items-center">
                <Settings size={20} className="mr-2 text-[#E11D2E]" /> Favicon dynamic launcher configs
              </h2>
              <p className="text-zinc-500 text-xs mt-1">Dynamic launcher parameters configure active headers session favicons instantly inside client browsers.</p>
            </div>

            <div className="bg-[#161616] border border-white/5 p-6 rounded-3xl max-w-xl space-y-6 shadow-xl">
              <div className="space-y-3">
                <label className="block text-[9px] font-bold text-zinc-500 uppercase font-mono tracking-widest">Dynamice Launcher favicon Icon</label>
                
                <div className="border border-dashed border-white/5 rounded-2xl p-8 text-center bg-[#0F0F0F] space-y-4 flex flex-col items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFaviconUpload}
                    className="hidden"
                    id="brand-settings-favicon-select"
                  />
                  <label
                    htmlFor="brand-settings-favicon-select"
                    className="px-4 py-2.5 bg-[#161616] hover:bg-neutral-800 text-white rounded-xl border border-white/5 font-extrabold text-[10px] uppercase tracking-wider cursor-pointer flex items-center space-x-1"
                  >
                    <Upload size={12} className="text-zinc-400" />
                    <span>Upload Dynamic design favicon</span>
                  </label>
                  <p className="text-[10px] text-zinc-500">Secures selected branding photos in High-Speed Cloudinary servers.</p>
                </div>

                {faviconUrl && (
                  <div className="p-4 bg-[#0F0F0F] border border-white/5 rounded-2xl flex items-center space-x-4 text-xs">
                    <div className="p-2.5 bg-[#161616] border border-white/5 rounded-lg shrink-0">
                      <img src={faviconUrl} alt="Favicon preview" className="w-8 h-8 object-cover rounded" />
                    </div>
                    <div className="truncate flex-1 font-mono text-[10px] text-zinc-500">
                      <p className="font-bold text-white uppercase text-[9px] mb-0.5">Assigned header favicon url (Cloudinary CDN):</p>
                      <p className="truncate text-[#E11D2E] font-semibold">{faviconUrl}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 rounded-2xl text-[10px] font-bold uppercase tracking-wider flex items-center space-x-2.5">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span>Launcher parameters locked in active browser DOM environments.</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
