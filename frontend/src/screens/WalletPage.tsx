// src/screens/WalletPage.tsx
import React, { useEffect, useState } from "react";
import { useAuthInit } from "../hooks/useAuthInit";
import { auth, db, functions } from "../firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { Wallet } from "../types";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  User as FirebaseUser,
} from "firebase/auth";

/**
 * WalletPage (refined)
 * - Uses backend callables:
 *   - generateWallet (handled elsewhere / useAuthInit)
 *   - connectExternalWallet (called on user action)
 *   - fetchBalances (called on mount and on demand) — prefer this for UI updates
 *
 * - Fallbacks to on-chain getBalance when callable is unavailable
 * - Updates users/{uid}.externalWallets with arrayUnion({ pubkey })
 */

export default function WalletPage() {
  // ensure user + native wallet initialization
  const { user, loading: authLoading } = useAuthInit();

  const [nativeWallet, setNativeWallet] = useState<Wallet | null>(null);
  const [externalWallets, setExternalWallets] = useState<Wallet[]>([]);
  const [showPassphrase, setShowPassphrase] = useState(false);

  // confirmation modal states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [loadingExternal, setLoadingExternal] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const uid = auth.currentUser?.uid ?? user?.uid ?? null;

  // Solana connection (devnet here)
  const connection = new Connection(clusterApiUrl("devnet"));

  // helper: fetch SOL balance on-chain
  const fetchSolBalanceOnChain = async (pubkey: string) => {
    try {
      const key = new PublicKey(pubkey);
      const lamports = await connection.getBalance(key);
      return lamports / 1e9;
    } catch (err) {
      console.error("Error fetching balance on-chain for", pubkey, err);
      return 0;
    }
  };

  // Try to use fetchBalances callable to get latest balances; fallback to local on-chain checks
  const callFetchBalances = async () => {
    if (!uid) return null;
    try {
      const fetchFn = httpsCallable(functions, "fetchBalances");
      const res = await fetchFn({});
      const payload = res?.data ?? null;
      if (!payload) return null;

      // payload expected: { nativeWallet: { pubkey, balance, passphrase? }, externalWallets: [{ pubkey, balance }, ...] }
      const native = payload.nativeWallet
        ? ({
            pubkey: payload.nativeWallet.pubkey,
            passphrase: payload.nativeWallet.passphrase ?? payload.nativeWallet.passphrase ?? null,
            balance: payload.nativeWallet.balance ?? 0,
            isNative: true,
          } as Wallet)
        : null;

      const externals: Wallet[] = Array.isArray(payload.externalWallets)
        ? payload.externalWallets.map((w: any) => ({
            pubkey: w.pubkey,
            passphrase: w.passphrase ?? null,
            balance: w.balance ?? 0,
            isNative: false,
          }))
        : [];

      return { native, externals };
    } catch (err) {
      console.warn("fetchBalances callable failed:", err);
      return null;
    }
  };

  // load wallets: prefer callable; fallback to direct Firestore read + on-chain balances
  useEffect(() => {
    let mounted = true;
    const loadWallets = async () => {
      setLoadingPage(true);
      setError(null);

      if (!uid) {
        setNativeWallet(null);
        setExternalWallets([]);
        setLoadingPage(false);
        return;
      }

      try {
        // First, try to call the backend fetchBalances callable
        const fetched = await callFetchBalances();
        if (fetched) {
          if (mounted) {
            setNativeWallet(fetched.native ?? null);
            setExternalWallets(fetched.externals ?? []);
            setLoadingPage(false);
          }
          return;
        }

        // Callable unavailable or errored — fallback to Firestore + on-chain fetch
        const userRef = doc(db, "users", uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          setNativeWallet(null);
          setExternalWallets([]);
          setLoadingPage(false);
          return;
        }

        const data = snap.data() as any;

        // native wallet
        if (data.nativeWallet?.pubkey) {
          const pub = data.nativeWallet.pubkey;
          const pass = data.nativeWallet.passphrase ?? null;
          const bal = await fetchSolBalanceOnChain(pub);
          if (mounted) setNativeWallet({ pubkey: pub, passphrase: pass, balance: bal, isNative: true });
        } else {
          if (mounted) setNativeWallet(null);
        }

        // externals
        if (Array.isArray(data.externalWallets) && data.externalWallets.length > 0) {
          const resolved = await Promise.all(
            data.externalWallets.map(async (w: any) => {
              const pub = w.pubkey ?? w;
              const bal = await fetchSolBalanceOnChain(pub);
              return { pubkey: pub, passphrase: null, balance: bal, isNative: false } as Wallet;
            })
          );
          if (mounted) setExternalWallets(resolved);
        } else {
          if (mounted) setExternalWallets([]);
        }
      } catch (err: any) {
        console.error("Error loading wallets:", err);
        if (mounted) setError(String(err?.message ?? err));
      } finally {
        if (mounted) setLoadingPage(false);
      }
    };

    loadWallets();
    return () => {
      mounted = false;
    };
  }, [uid]);

  // reveal passphrase: open modal to confirm password
  const openRevealConfirmation = () => {
    setConfirmError(null);
    setConfirmPassword("");
    setConfirmOpen(true);
  };

  // actual confirmation handler: reauthenticate and call reveal function
  const handleConfirmReveal = async () => {
    setConfirmError(null);
    if (!auth.currentUser) {
      setConfirmError("No authenticated user.");
      return;
    }

    const email = auth.currentUser.email;
    if (!email) {
      setConfirmError("No email on file. Please reauthenticate with your provider (e.g. Google).");
      return;
    }

    if (!confirmPassword) {
      setConfirmError("Please enter your account password to confirm.");
      return;
    }

    setConfirmLoading(true);

    try {
      // Reauthenticate with provided password
      const cred = EmailAuthProvider.credential(email, confirmPassword);
      // reauthenticateWithCredential expects FirebaseUser
      await reauthenticateWithCredential(auth.currentUser as FirebaseUser, cred);

      // Call backend to reveal passphrase (callable must verify context.auth.uid server-side)
      const revealFn = httpsCallable(functions, "revealNativePassphrase");
      const res = await revealFn({});
      const passphrase = res.data?.passphrase ?? null;

      // update native wallet local state with passphrase (we do not persist passphrase to client storage)
      setNativeWallet((prev) => (prev ? { ...prev, passphrase } : prev));
      setShowPassphrase(true);
      setConfirmOpen(false);
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Reauth / reveal error:", err);
      const msg = err?.message ?? String(err);
      setConfirmError(msg.includes("auth/wrong-password") ? "Incorrect password." : msg);
    } finally {
      setConfirmLoading(false);
    }
  };

  // connect external wallet via callable and update Firestore (arrayUnion) + refresh balances via fetchBalances
  const handleConnectExternal = async () => {
    if (!uid) return;
    setLoadingExternal(true);
    setError(null);

    try {
      // call connectExternalWallet callable (backend will return the pubkey and balance)
      const connectFn = httpsCallable(functions, "connectExternalWallet");
      const res = await connectFn({});
      const pubkey = res.data?.pubkey ?? res.data?.walletAddress ?? null;
      if (!pubkey) throw new Error("No pubkey returned from function");

      // Update Firestore externalWallets - store object with pubkey (balance will be updated by fetchBalances)
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        externalWallets: arrayUnion({ pubkey }),
      });

      // Prefer to call fetchBalances callable to get updated balances (backend should also write to Firestore)
      const fresh = await callFetchBalances();
      if (fresh) {
        setNativeWallet(fresh.native ?? null);
        setExternalWallets(fresh.externals ?? []);
      } else {
        // fallback: compute on-chain balances for new wallet and append
        const bal = await fetchSolBalanceOnChain(pubkey);
        setExternalWallets((prev) => [...prev, { pubkey, passphrase: null, balance: bal, isNative: false }]);
      }
    } catch (err: any) {
      console.error("Error connecting external wallet:", err);
      setError(err?.message ?? "Failed to connect external wallet");
    } finally {
      setLoadingExternal(false);
    }
  };

  // refresh balances using fetchBalances callable; fallback to on-chain refresh
  const refreshBalances = async () => {
    if (!uid) return;

    setLoadingPage(true);
    setError(null);

    try {
      const fresh = await callFetchBalances();
      if (fresh) {
        setNativeWallet(fresh.native ?? null);
        setExternalWallets(fresh.externals ?? []);
        setLoadingPage(false);
        return;
      }

      // fallback: re-fetch on-chain
      const refreshedNative = nativeWallet
        ? { ...nativeWallet, balance: await fetchSolBalanceOnChain(nativeWallet.pubkey) }
        : null;

      const refreshedExternals = await Promise.all(
        externalWallets.map(async (w) => ({ ...w, balance: await fetchSolBalanceOnChain(w.pubkey) }))
      );

      setNativeWallet(refreshedNative);
      setExternalWallets(refreshedExternals);
    } catch (err: any) {
      console.error("Error refreshing balances:", err);
      setError(String(err?.message ?? err));
    } finally {
      setLoadingPage(false);
    }
  };

  if (authLoading || loadingPage) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", color: "#fff", padding: "2rem" }}>
        <h1 style={{ fontSize: "1.25rem" }}>Wallets</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", color: "#fff", padding: "2rem" }}>
        <h1 style={{ fontSize: "1.25rem" }}>Wallets</h1>
        <p>Please sign in to manage your wallets.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#fff", fontFamily: "sans-serif", padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Wallets</h1>

      {error && (
        <div style={{ marginBottom: 12, color: "#f87171", background: "rgba(255,255,255,0.03)", padding: 8, borderRadius: 6 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button
          onClick={refreshBalances}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
            background: "#374151",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Refresh balances
        </button>
        <button
          onClick={() => {
            setShowPassphrase(false);
            setNativeWallet(null);
            setExternalWallets([]);
          }}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
            background: "#1f2937",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Clear view
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 800 }}>
        {/* Native Wallet */}
        <div style={{ background: "rgba(30,41,59,0.95)", padding: "1.5rem", borderRadius: 12 }}>
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>Native Wallet (platform)</h2>

          {!nativeWallet ? (
            <div>
              <p style={{ color: "#94a3b8" }}>No native wallet found — this should be auto-created at signup.</p>
              <p style={{ marginTop: 8 }}>
                If you signed up recently and don't see a native wallet, try signing out/in or check cloud function logs.
              </p>
            </div>
          ) : (
            <div>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>Address:</strong> <span style={{ color: "#cbd5e1" }}>{nativeWallet.pubkey}</span>
              </p>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>Balance:</strong>{" "}
                <span style={{ color: "#cbd5e1" }}>{(nativeWallet.balance ?? 0).toFixed(4)} SOL</span>
              </p>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>Passphrase:</strong>{" "}
                {showPassphrase ? (
                  <span style={{ wordBreak: "break-all", color: "#f8fafc" }}>{nativeWallet.passphrase ?? "—"}</span>
                ) : (
                  <span style={{ color: "#94a3b8" }}>Hidden</span>
                )}
              </p>

              {!showPassphrase ? (
                <button
                  onClick={openRevealConfirmation}
                  style={{
                    marginTop: 12,
                    padding: "0.6rem 1rem",
                    borderRadius: 8,
                    background: "#10b981",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Reveal Passphrase (secure)
                </button>
              ) : (
                <button
                  onClick={() => setShowPassphrase(false)}
                  style={{
                    marginTop: 12,
                    padding: "0.6rem 1rem",
                    borderRadius: 8,
                    background: "#374151",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Hide Passphrase
                </button>
              )}
            </div>
          )}
        </div>

        {/* External Wallets */}
        <div style={{ background: "rgba(30,41,59,0.95)", padding: "1.5rem", borderRadius: 12 }}>
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>External Wallets</h2>

          {externalWallets.length === 0 ? (
            <p style={{ color: "#94a3b8", marginBottom: 8 }}>No external wallets connected.</p>
          ) : (
            externalWallets.map((w, i) => (
              <div key={i} style={{ padding: "0.75rem", marginBottom: 8, background: "rgba(15,23,42,0.6)", borderRadius: 8 }}>
                <p style={{ margin: 0 }}>
                  <strong>Address:</strong> <span style={{ color: "#cbd5e1" }}>{w.pubkey}</span>
                </p>
                <p style={{ margin: 0 }}>
                  <strong>Balance:</strong> <span style={{ color: "#cbd5e1" }}>{(w.balance ?? 0).toFixed(4)} SOL</span>
                </p>
              </div>
            ))
          )}

          <div style={{ marginTop: 12 }}>
            <button
              onClick={handleConnectExternal}
              disabled={loadingExternal}
              style={{
                padding: "0.6rem 1rem",
                borderRadius: 8,
                background: "#8b5cf6",
                color: "#fff",
                border: "none",
                cursor: loadingExternal ? "not-allowed" : "pointer",
              }}
            >
              {loadingExternal ? "Connecting..." : "Connect External Wallet"}
            </button>
            <div style={{ marginTop: 8, color: "#94a3b8", fontSize: 13 }}>
              Connect an external wallet (public key only). Your platform balance will include connected wallets.
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Reveal Passphrase */}
      {confirmOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
            padding: 16,
          }}
          onClick={() => setConfirmOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 420,
              maxWidth: "100%",
              background: "#1e293b",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Confirm Reveal Passphrase</h3>
            <p style={{ color: "#cbd5e1" }}>
              This action will display your native wallet passphrase. <strong>Please keep it secret.</strong>
            </p>
            <ul style={{ color: "#94a3b8", paddingLeft: 18 }}>
              <li>If you lose this passphrase, we cannot recover it for you.</li>
              <li>Do not share this passphrase with anyone — we will never ask for it.</li>
              <li>Only reveal it in a private, secure environment.</li>
            </ul>

            <label style={{ display: "block", marginTop: 12, color: "#cbd5e1" }}>
              Enter your account password to confirm
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Account password"
              style={{
                marginTop: 8,
                width: "100%",
                padding: "0.6rem 0.75rem",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(15,23,42,0.6)",
                color: "#fff",
              }}
            />
            {confirmError && <div style={{ color: "#f87171", marginTop: 8 }}>{confirmError}</div>}

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={confirmLoading}
                style={{
                  flex: 1,
                  padding: "0.6rem 0.75rem",
                  borderRadius: 8,
                  background: "#374151",
                  color: "#fff",
                  border: "none",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmReveal}
                disabled={confirmLoading}
                style={{
                  flex: 1,
                  padding: "0.6rem 0.75rem",
                  borderRadius: 8,
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                }}
              >
                {confirmLoading ? "Verifying…" : "Reveal Passphrase"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
