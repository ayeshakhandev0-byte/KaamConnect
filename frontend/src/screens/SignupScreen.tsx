// src/screens/SignupScreen.tsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth, db, functions } from "../firebase";
import { httpsCallable } from "firebase/functions";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useAuthInit } from "../hooks/useAuthInit";
import { Wallet, UserRole } from "../types";

export default function SignupScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const signupType = (location.state as any)?.type || "national";

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: signupType === "diaspora" ? "" : undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // this hook ensures auth + wallet creation flows are available in app lifecycle.
  // we still perform explicit wallet creation here to avoid race conditions.
  const { user: authUser, loading: authLoading } = useAuthInit();

  // If hook reports user+ready, navigate (safe fallback)
  useEffect(() => {
    if (!authLoading && authUser) {
      navigate("/explore");
    }
  }, [authLoading, authUser, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const createUserDocWithWallet = async (uid: string, displayName?: string | null, email?: string | null) => {
    const userRef = doc(db, "users", uid);

    // create or merge base user doc
    await setDoc(
      userRef,
      {
        name: displayName ?? form.fullName ?? email?.split("@")[0] ?? "",
        email: email ?? form.email ?? "",
        role: (signupType === "diaspora" ? "diaspora" : "local") as UserRole,
        country: form.country ?? null,
        externalWallets: [],
        reviews: [],
        reputation: 0,
        kycStatus: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Call backend to generate native wallet (idempotent on backend)
    try {
      const generateWalletFn = httpsCallable(functions, "generateWallet");
      const walletResult = await generateWalletFn({});
      const payload = walletResult?.data ?? {};

      // accept either pubkey or walletAddress returned by backend
      const pubkey = payload.walletAddress ?? payload.pubkey ?? payload.address ?? null;
      const passphrase = payload.passphrase ?? null;
      const balance = payload.balance ?? 0;

      if (pubkey) {
        const nativeWallet: Wallet = {
          pubkey,
          passphrase: passphrase ?? undefined,
          balance,
          isNative: true,
        };

        // write nativeWallet into user doc (merge)
        await setDoc(
          userRef,
          {
            nativeWallet,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        console.warn("generateWallet returned no pubkey/walletAddress:", payload);
      }
    } catch (err: any) {
      console.error("generateWallet error:", err?.message ?? err);
      // do not throw — we still want to allow signup to complete; backend may be temporarily failing
      throw err;
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // create auth user
      const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);

      // update auth profile displayName if provided
      if (form.fullName) {
        try {
          await updateProfile(userCred.user, { displayName: form.fullName });
        } catch (err) {
          console.warn("updateProfile failed:", err);
        }
      }

      // create Firestore doc + native wallet (explicit, avoids races)
      await createUserDocWithWallet(userCred.user.uid, userCred.user.displayName, userCred.user.email);

      // navigate after successful setup
      navigate("/explore");
    } catch (err: any) {
      console.error("Email signup error:", err);
      // prefer readable firebase message if available
      setError(err?.message ?? "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // ensure user doc exists and has native wallet
      const userRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        // create doc + wallet
        await createUserDocWithWallet(firebaseUser.uid, firebaseUser.displayName, firebaseUser.email);
      } else {
        // If doc exists but no nativeWallet, create it
        const data = snap.data() as any;
        if (!data?.nativeWallet) {
          await createUserDocWithWallet(firebaseUser.uid, firebaseUser.displayName, firebaseUser.email);
        }
      }

      navigate("/explore");
    } catch (err: any) {
      console.error("Google signup error:", err);
      setError(err?.message ?? "Google signup failed");
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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "1.5rem" }}>
        {signupType === "diaspora" ? "Join as Diaspora" : "Join as National"}
      </h1>

      <form
        onSubmit={handleEmailSignup}
        style={{
          background: "rgba(30,41,59,0.85)",
          padding: "2rem",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          minWidth: "300px",
          maxWidth: "400px",
          width: "100%",
        }}
      >
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={form.fullName}
          onChange={handleChange}
          required
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(15,23,42,0.6)",
            color: "#fff",
            outline: "none",
          }}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(15,23,42,0.6)",
            color: "#fff",
            outline: "none",
          }}
        />

        {signupType === "diaspora" && (
          <input
            type="text"
            name="country"
            placeholder="Country of Residence"
            value={form.country}
            onChange={handleChange}
            required
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(15,23,42,0.6)",
              color: "#fff",
              outline: "none",
            }}
          />
        )}

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(15,23,42,0.6)",
            color: "#fff",
            outline: "none",
          }}
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          required
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(15,23,42,0.6)",
            color: "#fff",
            outline: "none",
          }}
        />

        {error && <div style={{ color: "#f87171", fontSize: 13 }}>{error}</div>}

        <button
          type="submit"
          disabled={loading || authLoading}
          style={{
            padding: "1rem 2rem",
            borderRadius: "10px",
            backgroundColor: loading || authLoading ? "rgba(59,130,246,0.5)" : "#3b82f6",
            color: "#fff",
            border: "none",
            fontWeight: 600,
            fontSize: "1rem",
            cursor: loading || authLoading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Signing up…" : "Sign Up"}
        </button>

        <button
          type="button"
          disabled={loading || authLoading}
          onClick={handleGoogleSignup}
          style={{
            padding: "0.9rem 1rem",
            borderRadius: 10,
            border: "none",
            backgroundColor: "#ea4335",
            color: "#fff",
            fontWeight: 600,
            cursor: loading || authLoading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Please wait…" : "Sign Up with Google"}
        </button>

        <div style={{ marginTop: 12, fontSize: 14, textAlign: "center" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#93c5fd" }}>
            Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}
