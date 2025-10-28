// src/screens/LoginScreen.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db, functions } from "../firebase";
import { httpsCallable } from "firebase/functions";
import { useAuthInit } from "../hooks/useAuthInit";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Wallet, UserRole } from "../types";

export default function LoginScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuthInit();

  // If the auth hook reports ready & user present — ensure we land on explore.
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/explore");
    }
  }, [authLoading, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const createWalletIfMissing = async (uid: string, emailOrDisplay?: string | null) => {
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);

      // If user doc doesn't exist, create base doc first
      if (!snap.exists()) {
        const role: UserRole = "local";
        await setDoc(
          userRef,
          {
            name: emailOrDisplay ? (emailOrDisplay.split?.("@") ? emailOrDisplay.split("@")[0] : emailOrDisplay) : "",
            email: emailOrDisplay ?? "",
            role,
            kycStatus: "pending",
            externalWallets: [],
            reviews: [],
            reputation: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      // Refresh snapshot
      const freshSnap = await getDoc(userRef);
      const data = freshSnap.exists() ? freshSnap.data() : {};

      // If nativeWallet missing, call backend to generate one and write to Firestore
      if (!data?.nativeWallet) {
        const generateWalletFn = httpsCallable(functions, "generateWallet");
        const walletResult = await generateWalletFn({});
        const payload = walletResult?.data ?? {};

        const pubkey = payload.walletAddress ?? payload.pubkey ?? payload.address ?? null;
        const passphrase = payload.passphrase ?? null;
        const balance = payload.balance ?? 0;

        if (!pubkey) {
          console.warn("generateWallet returned no pubkey/walletAddress:", payload);
          return;
        }

        const nativeWallet: Wallet = {
          pubkey,
          passphrase: passphrase ?? undefined,
          balance,
          isNative: true,
        };

        await setDoc(
          userRef,
          {
            nativeWallet,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (err: any) {
      console.error("createWalletIfMissing error:", err?.message ?? err);
      throw err;
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.email || !form.password) {
      setError("Please fill in both fields.");
      return;
    }

    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, form.email, form.password);
      const uid = userCred.user.uid;
      const email = userCred.user.email ?? form.email;

      await createWalletIfMissing(uid, email);

      // navigate after ensuring wallet/doc present
      navigate("/explore");
    } catch (err: any) {
      console.error("Email login error:", err);
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      const uid = firebaseUser.uid;
      const emailOrDisplay = firebaseUser.email ?? firebaseUser.displayName ?? "";

      await createWalletIfMissing(uid, emailOrDisplay);

      navigate("/explore");
    } catch (err: any) {
      console.error("Google login error:", err);
      setError(err?.message ?? "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(30,41,59,0.95)",
          padding: "2rem",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <h1 style={{ margin: 0, marginBottom: "1rem", fontSize: "1.6rem" }}>Welcome back</h1>
        <p style={{ marginTop: 0, marginBottom: "1.25rem", color: "#cbd5e1" }}>
          Sign in to continue to KaamConnect
        </p>

        <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            style={{
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(15,23,42,0.6)",
              color: "#fff",
              outline: "none",
            }}
            autoComplete="username"
          />
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            style={{
              padding: "0.75rem 1rem",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(15,23,42,0.6)",
              color: "#fff",
              outline: "none",
            }}
            autoComplete="current-password"
          />

          {error && <div style={{ color: "#f87171", fontSize: 13 }}>{error}</div>}

          <button
            type="submit"
            disabled={loading || authLoading}
            style={{
              padding: "0.9rem 1rem",
              borderRadius: 10,
              border: "none",
              background: loading || authLoading ? "rgba(59,130,246,0.5)" : "#3b82f6",
              color: "#fff",
              fontWeight: 600,
              cursor: loading || authLoading ? "not-allowed" : "pointer",
              marginTop: 4,
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || authLoading}
          style={{
            padding: "0.9rem 1rem",
            borderRadius: 10,
            border: "none",
            backgroundColor: "#ea4335",
            color: "#fff",
            fontWeight: 600,
            cursor: loading || authLoading ? "not-allowed" : "pointer",
            marginTop: 4,
          }}
        >
          {loading ? "Please wait…" : "Sign In with Google"}
        </button>

        <div style={{ marginTop: 12, fontSize: 14, textAlign: "center" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "#93c5fd" }}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
