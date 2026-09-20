import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useStore } from "../context/StoreContext";
import { ShieldCheck, Mail, Lock, Loader2, AlertTriangle, ExternalLink } from "lucide-react";

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [providerErrorType, setProviderErrorType] = useState<"email" | "google" | null>(null);

  // Auto redirect to dashboard if already verified as administrator
  React.useEffect(() => {
    if (user && (profile?.role === "admin" || user.email === "edgemartstores.site@gmail.com")) {
      navigate("/admin/dashboard");
    }
  }, [user, profile, navigate]);

  const safeWriteAdminLog = async (logId: string, payload: {
    id: string;
    email: string;
    eventType: string;
    details: string;
    timestamp: string;
  }) => {
    try {
      await setDoc(doc(db, "admin_logs", logId), payload);
    } catch (logErr: any) {
      // Diagnostic warning instead of fatal console.error
      console.warn("[SECURITY AUDIT] Notice: Could not sync admin_log event to remote DB:", logErr?.message || logErr);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setErrorMessage(null);
    setProviderErrorType(null);
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const authenticatedEmail = result.user.email?.toLowerCase().trim() || "";

      if (authenticatedEmail !== "edgemartstores.site@gmail.com") {
        await signOut(auth);
        setErrorMessage(`Access Denied: The Google account (${authenticatedEmail}) is not authorized for administrative access.`);
        await safeWriteAdminLog(`log_${Date.now()}_failed`, {
          id: `log_${Date.now()}_failed`,
          email: authenticatedEmail,
          eventType: "login_failed",
          details: `Google authentication rejected: ${authenticatedEmail} is not in authorized admin list.`,
          timestamp: new Date().toISOString()
        });
        setGoogleLoading(false);
        return;
      }

      // Record successful admin authentication
      await safeWriteAdminLog(`log_${Date.now()}_success`, {
        id: `log_${Date.now()}_success`,
        email: authenticatedEmail,
        eventType: "login_success",
        details: "Admin successfully authenticated via Google OAuth.",
        timestamp: new Date().toISOString()
      });

      // Ensure profile in users collection has admin role
      try {
        await setDoc(doc(db, "users", result.user.uid), {
          id: result.user.uid,
          name: result.user.displayName || "Edge Mart Administrator",
          email: authenticatedEmail,
          role: "admin",
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (profileErr) {
        console.warn("Could not sync admin profile document:", profileErr);
      }

      setGoogleLoading(false);
      navigate("/admin/dashboard");
    } catch (err: any) {
      setGoogleLoading(false);
      console.warn("Google Admin login error:", err);
      if (err.code === "auth/operation-not-allowed" || err.message?.includes("operation-not-allowed")) {
        setProviderErrorType("google");
        setErrorMessage("Google Sign-In is not yet enabled in the Firebase Authentication console for this project.");
      } else {
        setErrorMessage(err.message || "Google authentication failed or was cancelled.");
      }
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setProviderErrorType(null);

    // Filter non-admin address attempts early on client-side
    const sanitizedEmail = email.trim().toLowerCase();
    const allowedAdmins = [
      "edgemartstores.site@gmail.com"
    ];

    if (!allowedAdmins.includes(sanitizedEmail)) {
      setErrorMessage("Access Denied: The email address is not registered in the administrative list.");
      
      // Log failed login attempt in admin_logs safely
      await safeWriteAdminLog(`log_${Date.now()}_failed`, {
        id: `log_${Date.now()}_failed`,
        email: sanitizedEmail,
        eventType: "login_failed",
        details: "Early client-side rejection: unauthorized email address.",
        timestamp: new Date().toISOString()
      });
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      // Log successful login attempt
      await safeWriteAdminLog(`log_${Date.now()}_success`, {
        id: `log_${Date.now()}_success`,
        email: sanitizedEmail,
        eventType: "login_success",
        details: "Admin successfully authenticated via Firebase Auth credentials.",
        timestamp: new Date().toISOString()
      });
      
      setLoading(false);
      navigate("/admin/dashboard");
    } catch (err: any) {
      setLoading(false);
      console.warn("Email/Password Admin login error:", err);
      
      if (err.code === "auth/operation-not-allowed" || err.message?.includes("operation-not-allowed")) {
        setProviderErrorType("email");
        setErrorMessage("Email/Password Sign-In is not enabled in Firebase Console. Please enable it in the console or use the Google Sign-In option below.");
      } else {
        setErrorMessage(err.message || "Failed to authenticate structural staff credentials.");
      }
      
      // Log credential failure safely
      await safeWriteAdminLog(`log_${Date.now()}_failed`, {
        id: `log_${Date.now()}_failed`,
        email: sanitizedEmail,
        eventType: "login_failed",
        details: `Firebase credentials auth failed: ${err.message}`,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-24 flex flex-col justify-center items-center">
      
      <div className="w-full bg-zinc-950 text-white rounded-3xl border border-zinc-800 p-8 shadow-2xl relative overflow-hidden font-sans font-medium">
        
        {/* Visual glow overlay */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-600/10 rounded-full filter blur-xl pointer-events-none" />

        <div className="text-center mb-8">
          <ShieldCheck size={40} className="mx-auto text-red-650 mb-3" />
          <h1 className="text-2xl font-black font-display text-white tracking-widest uppercase">
            EDGE MART
          </h1>
          <p className="text-[10px] font-bold text-red-500 font-mono tracking-widest uppercase mt-0.5">
            // Administrative Portal
          </p>
          <p className="text-zinc-500 text-xs mt-3 leading-relaxed">
            Restricted environment for authorized personnel (<code className="text-zinc-300 font-mono text-[11px]">edgemartstores.site@gmail.com</code>).
          </p>
        </div>

        {/* Primary One-Click Google Admin Sign-In */}
        <button
          type="button"
          onClick={handleGoogleAdminLogin}
          disabled={googleLoading}
          className="w-full py-3 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center space-x-2.5 cursor-pointer transition shadow-md border border-red-650 mb-6"
        >
          {googleLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Verifying Google Identity...</span>
            </>
          ) : (
            <span>🔐 Staff Sign In with Google</span>
          )}
        </button>

        <div className="relative my-6 text-center">
          <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-white/10" />
          <span className="relative bg-zinc-950 font-bold text-[10px] font-mono text-zinc-500 uppercase px-3">
            or sign in with password
          </span>
        </div>

        {errorMessage && (
          <div className="bg-red-950/40 border border-red-800/60 text-red-300 text-xs rounded-xl p-4 mb-6 leading-relaxed">
            {providerErrorType ? (
              <div className="space-y-2.5">
                <div className="flex items-center space-x-2 font-bold text-red-400">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>Firebase Authentication Setup Required</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  {providerErrorType === "email" 
                    ? "The Email/Password provider is not yet enabled in the Firebase Authentication console for your project."
                    : "The Google Sign-In provider is not yet enabled in the Firebase Authentication console for your project."}
                </p>
                <div className="bg-black/60 border border-white/5 rounded-lg p-3 text-[11px] text-zinc-300 space-y-1">
                  <p className="font-bold text-white text-[11px]">How to enable in Firebase Console:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-zinc-400 text-[10px] mt-1">
                    <li>Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-red-400 underline inline-flex items-center gap-0.5">Firebase Console <ExternalLink size={10} /></a></li>
                    <li>Navigate to <strong>Authentication &gt; Sign-in method</strong></li>
                    <li>Click <strong>Add new provider</strong> &gt; Select <strong>{providerErrorType === "email" ? "Email/Password" : "Google"}</strong></li>
                    <li>Toggle <strong>Enable</strong> and click <strong>Save</strong></li>
                  </ol>
                </div>
                {providerErrorType === "email" && (
                  <p className="text-[11px] text-zinc-400">
                    💡 <em>Tip: You can also click the red <strong>Staff Sign In with Google</strong> button above to log in with your admin Google account.</em>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-center">{errorMessage}</p>
            )}
          </div>
        )}

        <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Staff Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="edgemartstores.site@gmail.com"
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 text-sm text-white rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Password Key</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 text-sm text-white rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer border border-white/10"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Decrypting credentials...</span>
              </>
            ) : (
              <span>Unlock with Password</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
