import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useStore } from "../context/StoreContext";
import { Mail, Lock, UserPlus, Loader2, User } from "lucide-react";
import { UserProfile } from "../types";

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleGoogleSignUp = async () => {
    setErrorMessage(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/operation-not-allowed" || err.message?.includes("operation-not-allowed")) {
        setErrorMessage(
          "GOOGLE_PROVIDER_NOT_ENABLED: The Google Auth signup provider is not yet enabled in the Firebase Console."
        );
      } else {
        setErrorMessage("Google authorization bypassed or rejected: " + err.message);
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Full Audit Name is required.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Credentials mismatch: Confirmation password does not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Security restriction: Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // 1. Create Creds in Firebase Auth
      const creds = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile name
      await updateProfile(creds.user, { displayName: name });

      // 2. Publish profile document inside Firestore 'users' collection
      const userRef = doc(db, "users", creds.user.uid);
      
      // Auto promotion for specific bootstrapped admin emails
      const isAdminEmail =
        email === "edgemartstores.site@gmail.com";

      const newProfile: UserProfile = {
        id: creds.user.uid,
        name: name,
        email: email,
        role: isAdminEmail ? "admin" : "user",
        createdAt: new Date().toISOString()
      };

      await setDoc(userRef, newProfile);
      
      setLoading(false);
      navigate("/dashboard");

    } catch (err: any) {
      setLoading(false);
      console.warn("Register error:", err);
      if (err.code === "auth/operation-not-allowed" || err.message?.includes("operation-not-allowed")) {
        setErrorMessage("EMAIL_PROVIDER_NOT_ENABLED: Email/Password registration is not enabled in the Firebase Console.");
      } else {
        setErrorMessage(err.message || "Failed to finalize registration.");
      }
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-24 flex flex-col items-center">
      
      <div className="w-full bg-[#111111] rounded-2xl border border-white/5 p-8 shadow-xl flex flex-col justify-between relative overflow-hidden text-white font-sans font-medium">
        {/* Subtle accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-650" />
        
        <div className="text-center mb-8">
          <Link to="/" className="inline-block text-xl font-black font-display tracking-widest text-white uppercase mb-3">
            EDGE <span className="text-white bg-red-650 px-2 py-0.5 rounded">MART</span>
          </Link>
          <h2 className="text-2xl font-black font-display uppercase text-white tracking-wider">Buyer Registration</h2>
          <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed">Register your corporate dynamic grocery budget allowance profile</p>
        </div>

        {errorMessage && (
          <div className="bg-red-950/20 text-red-400 text-xs border border-red-900/50 rounded-xl p-4 mb-6 leading-relaxed font-semibold">
            {errorMessage.includes("GOOGLE_PROVIDER_NOT_ENABLED") ? (
              <div className="text-left space-y-2">
                <p className="font-bold text-red-500 flex items-center">
                  ⚠️ Google Sign-In Needs Activation
                </p>
                <p className="text-zinc-400 font-normal">
                  The Google authentication provider is not yet enabled for the Firebase database associated with this application.
                </p>
                <div className="bg-[#161616] border border-white/5 rounded-lg p-3 text-[11px] text-zinc-300 space-y-1.5 font-normal leading-relaxed">
                  <p className="font-bold text-white">Enable Google Sign-In in Firebase Console:</p>
                  <ol className="list-decimal pl-4 space-y-1 mt-1 font-mono text-[10px] text-zinc-400">
                    <li>Open <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-red-500 underline hover:text-red-400 font-semibold">Firebase Console</a></li>
                    <li>Select the active project for this application</li>
                    <li>Go to <strong>Authentication &gt; Sign-in method</strong></li>
                    <li>Click <strong>Add new provider &gt; Choose Google</strong></li>
                    <li>Turn on <strong>Enable</strong> &gt; Click <strong>Save</strong></li>
                  </ol>
                </div>
              </div>
            ) : errorMessage.includes("EMAIL_PROVIDER_NOT_ENABLED") ? (
              <div className="text-left space-y-2">
                <p className="font-bold text-red-500 flex items-center">
                  ⚠️ Email/Password Provider Needs Activation
                </p>
                <p className="text-zinc-400 font-normal">
                  The Email/Password authentication provider is not yet enabled for the Firebase database associated with this application.
                </p>
                <div className="bg-[#161616] border border-white/5 rounded-lg p-3 text-[11px] text-zinc-300 space-y-1.5 font-normal leading-relaxed">
                  <p className="font-bold text-white">Enable Email/Password in Firebase Console:</p>
                  <ol className="list-decimal pl-4 space-y-1 mt-1 font-mono text-[10px] text-zinc-400">
                    <li>Open <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-red-500 underline hover:text-red-400 font-semibold">Firebase Console</a></li>
                    <li>Select the active project for this application</li>
                    <li>Go to <strong>Authentication &gt; Sign-in method</strong></li>
                    <li>Click <strong>Add new provider &gt; Choose Email/Password</strong></li>
                    <li>Turn on <strong>Enable</strong> &gt; Click <strong>Save</strong></li>
                  </ol>
                </div>
                <p className="text-[11px] text-zinc-400 font-normal">
                  💡 <em>You can also click <strong>Sign Up with Google</strong> below if Google authentication is configured.</em>
                </p>
              </div>
            ) : (
              <p className="text-center">{errorMessage}</p>
            )}
          </div>
        )}

        {/* Google registration button */}
        <button
          onClick={handleGoogleSignUp}
          className="w-full py-3 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center space-x-2.5 cursor-pointer transition shadow-md border border-red-650"
        >
          <span>🔐 Sign Up with Google</span>
        </button>

        <div className="relative my-6 text-center">
          <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-white/5" />
          <span className="relative bg-[#111111] font-bold text-[10px] font-mono text-zinc-500 uppercase px-3">
            or register with email
          </span>
        </div>

        {/* Signup form */}
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Full Audit Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <User size={16} />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: John Harrison"
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 text-sm text-white rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: buyer@corporate.com"
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 text-sm text-white rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 6 chars)"
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 text-sm text-white rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">Confirm Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 text-sm text-white rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#161616] hover:bg-zinc-800 border border-white/5 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <UserPlus size={14} />
                <span>Create Corporate Account</span>
              </>
            )}
          </button>
        </form>

        <p className="text-zinc-500 text-xs text-center mt-6">
          Already registered?{" "}
          <Link to="/login" className="text-red-500 font-extrabold hover:underline">
            Login
          </Link>
        </p>

      </div>
    </div>
  );
};
