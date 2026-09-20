import React, { useState, useEffect, useRef } from "react";
import { useStore } from "../context/StoreContext";
import { collection, onSnapshot, doc, setDoc, addDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { SupportMessage, SupportConversation } from "../types";
import { MessageSquare, Send, X, Camera, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const SupportChat: React.FC = () => {
  const { user, profile } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [activeConv, setActiveConv] = useState<SupportConversation | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Subscribe to real-time conversation message stream
  useEffect(() => {
    if (!user || !isOpen) return;

    // Create/listen to conversation reference
    const convRef = doc(db, "support_conversations", user.uid);
    
    // Subscribe to chat list
    const q = query(
      collection(db, "support_conversations", user.uid, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubMessages = onSnapshot(q, (snap) => {
      const list: SupportMessage[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as SupportMessage);
      });
      setMessages(list);
    }, (error) => {
      console.warn("Support messages query denied (will auto-adjust rules later):", error);
    });

    // Fetch conversation shell info
    const unsubConv = onSnapshot(convRef, (snap) => {
      if (snap.exists()) {
        setActiveConv(snap.data() as SupportConversation);
      }
    }, (error) => {
      console.warn("Support conversation fetching denied (will auto-adjust rules later):", error);
    });

    return () => {
      unsubMessages();
      unsubConv();
    };
  }, [user, isOpen]);

  // If user is Admin, they shouldn't see client floating widget (they operate in dashboard inbox)
  if (profile?.role === "admin") return null;

  const handleSendMessage = async (textToSend = inputText, imageUrl = "") => {
    if (!textToSend.trim() && !imageUrl) return;
    if (!user) {
      setChatError("Please login to initiate an authenticated chat with agents.");
      return;
    }

    try {
      setChatError(null);
      const conversationId = user.uid;

      // 1. Set or update the Chat Conversation Thread Shell in firestore
      const convRef = doc(db, "support_conversations", conversationId);
      await setDoc(convRef, {
        id: conversationId,
        userId: user.uid,
        userName: profile?.name || user.email?.split("@")[0] || "Customer",
        userEmail: user.email || "",
        status: "active",
        createdAt: activeConv?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessageText: textToSend || "Attachment Image"
      }, { merge: true });

      // 2. Add subcollection message
      const messagesRef = collection(db, "support_conversations", conversationId, "messages");
      await addDoc(messagesRef, {
        conversationId,
        senderId: user.uid,
        senderName: profile?.name || user.email?.split("@")[0] || "Customer",
        senderRole: "user",
        text: textToSend,
        image: imageUrl || null,
        createdAt: serverTimestamp()
      });

      setInputText("");
    } catch (err: any) {
      console.error("Failed to append support message:", err);
      setChatError("Message transmission faulted. Verify connectivity.");
    }
  };

  // Image upload trigger
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setChatError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Content = reader.result as string;
        
        // Post base64 payload to custom Cloudinary Proxy endpoint
        const res = await fetch("/api/upload-cloudinary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64Content }),
        });

        if (!res.ok) {
          throw new Error("Cloudinary engine rejected payload file.");
        }

        const data = await res.json();
        await handleSendMessage("", data.url);
        setIsUploading(false);
      };
    } catch (err: any) {
      console.error("Upload error client side:", err);
      setChatError("Receipt attachment upload failed.");
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-45 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            className="w-80 md:w-96 h-[500px] bg-[#161616] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 mr-0"
          >
            {/* Header */}
            <div className="p-4 bg-[#0F0F0F] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <div>
                  <h4 className="font-extrabold text-xs tracking-wider uppercase text-white font-display">EDGE SUPPORT HOST</h4>
                  <p className="text-[10px] text-zinc-400">Live Agent Help Desk</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat screen */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#050505]">
              {chatError && (
                <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-3 text-[11px] text-red-300 flex items-start space-x-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{chatError}</span>
                </div>
              )}

              {!user ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-4">
                  <div className="p-3 bg-[#161616] border border-white/5 rounded-full text-zinc-500">
                    <MessageSquare size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-xs text-white uppercase tracking-wider">Access Restrained</p>
                    <p className="text-[10px] text-zinc-400">Please authenticate with an account first to verify security rules connection.</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3.5">
                  <Sparkles size={24} className="text-red-500 animate-bounce" />
                  <p className="text-xs font-bold text-white uppercase tracking-widest">Active Connection</p>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Welcome to Edge Mart Corporate Desk. Introduce your supply request, budget override concerns, or logistics questions below.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isAdmin = msg.senderRole === "admin";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                    >
                      <div className="flex items-center space-x-1.5 mb-1">
                        <span className="text-[10px] text-zinc-500 font-bold font-mono">
                          {isAdmin ? "AGENT • " + msg.senderName : "ME"}
                        </span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                          isAdmin
                            ? "bg-[#161616] text-white border border-white/5 rounded-tl-none"
                            : "bg-red-600 text-white rounded-tr-none"
                        }`}
                      >
                        {msg.text && <p className="break-words">{msg.text}</p>}
                        {msg.image && (
                          <div className="mt-1 rounded-lg overflow-hidden border border-black/10 max-h-36">
                            <img src={msg.image} alt="Attachment" className="object-contain max-h-36" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input fields */}
            {user && (
              <div className="p-3 bg-[#0F0F0F] border-t border-white/5 flex items-center space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2 hover:bg-white/5 rounded-xl text-zinc-400 hover:text-white transition cursor-pointer"
                  title="Attach file image screenshot"
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin text-red-500" /> : <Camera size={16} />}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask for custom budget overrides..."
                  className="flex-1 bg-[#161616] border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-medium"
                />

                <button
                  onClick={() => handleSendMessage()}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition cursor-pointer"
                >
                  <Send size={15} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-red-600 hover:bg-red-700 hover:scale-105 hover:shadow-red-600/35 border border-white/5 text-white rounded-full flex items-center justify-center shadow-xl cursor-pointer transition-all duration-300"
      >
        <MessageSquare size={24} />
      </button>
    </div>
  );
};
