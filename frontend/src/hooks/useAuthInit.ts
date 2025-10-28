import { useEffect, useState, useCallback } from "react";
import { auth, db, functions } from "../firebase";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { Wallet, UserRole } from "../types";
import { makeLocalSolanaWallet, getWalletBalance } from "../utils/walletHelpers";

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  connectExternalWallet: (pubkey?: string) => Promise<Wallet | null>;
  refreshBalances: () => Promise<{ nativeWallet?: Wallet | null; externalWallets?: Wallet[] } | null>;
}

export const useAuthInit = (): AuthState => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // ≡ƒöä Refresh balances helper
  // -----------------------------
  const refreshBalances = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      console.warn("refreshBalances: no authenticated user");
      return null;
    }

    try {
      const fetchBalancesFn = httpsCallable(functions, "fetchBalances");
      const res = await fetchBalancesFn({});
      const data = res.data ?? {};

      const nativeWallet = data.nativeWallet ?? null;
      const externalWallets = Array.isArray(data.externalWallets) ? data.externalWallets : [];

      // Write balances to Firestore (non-destructive)
      const userRef = doc(db, "users", firebaseUser.uid);
      try {
        await updateDoc(userRef, {
          ...(nativeWallet ? { nativeWallet } : {}),
          ...(externalWallets.length > 0 ? { externalWallets } : {}),
          updatedAt: serverTimestamp(),
        });
      } catch (werr) {
        console.warn("refreshBalances: failed to write balances to Firestore:", werr);
      }

      console.log("Γ£à refreshBalances: got data from cloud function");
      return { nativeWallet, externalWallets };
    } catch (err: any) {
      console.warn("refreshBalances Cloud Function failed, trying local fallback:", err?.message ?? err);

      // Local fallback: read stored user doc and fetch balances locally
      try {
        const firebaseUserRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(firebaseUserRef);
        if (!snap.exists()) return null;

        const userData = snap.data() as any;
        const nativeWallet = userData.nativeWallet ?? null;
        const externalWallets = Array.isArray(userData.externalWallets) ? userData.externalWallets : [];

        // Fetch native wallet balance locally
        if (nativeWallet?.pubkey) {
          try {
            const bal = await getWalletBalance(nativeWallet.pubkey);
            nativeWallet.balance = bal;
          } catch (bErr) {
            console.warn("refreshBalances: failed to fetch native balance locally:", bErr);
          }
        }

        // Fetch external wallet balances locally
        const updatedExternalWallets = await Promise.all(
          externalWallets.map(async (w: Wallet) => {
            if (!w?.pubkey) return w;
            try {
              const bal = await getWalletBalance(w.pubkey);
              return { ...w, balance: bal };
            } catch {
              return w;
            }
          })
        );

        // Update Firestore with new balances (best-effort)
        try {
          await updateDoc(firebaseUserRef, {
            ...(nativeWallet ? { nativeWallet } : {}),
            ...(updatedExternalWallets.length > 0 ? { externalWallets: updatedExternalWallets } : {}),
            updatedAt: serverTimestamp(),
          });
        } catch (werr2) {
          console.warn("refreshBalances fallback: failed to write balances to Firestore:", werr2);
        }

        console.log("Γ£à refreshBalances: completed local fallback");
        return { nativeWallet, externalWallets: updatedExternalWallets };
      } catch (localErr: any) {
        console.error("refreshBalances: local fallback also failed:", localErr?.message ?? localErr);
        return null;
      }
    }
  }, []);

  // -----------------------------
  // ≡ƒöù Connect external wallet helper
  // -----------------------------
  const connectExternalWallet = useCallback(async (pubkey?: string) => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("Not authenticated");

    try {
      const connectFn = httpsCallable(functions, "connectExternalWallet");
      const res = await connectFn({ pubkey });
      const data = res.data ?? {};

      const newWallet: Wallet = {
        pubkey: data.pubkey ?? data.walletAddress ?? "",
        passphrase: undefined, // never persist/show passphrase for external wallets
        balance: data.balance ?? 0,
        isNative: false,
      };

      // Append to Firestore array (best-effort)
      const userRef = doc(db, "users", firebaseUser.uid);
      try {
        await updateDoc(userRef, {
          externalWallets: arrayUnion({ pubkey: newWallet.pubkey }),
          updatedAt: serverTimestamp(),
        });
      } catch (wErr) {
        console.warn("connectExternalWallet: unable to update Firestore, continuing locally:", wErr);
      }

      console.log("Γ£à connectExternalWallet via Cloud Function succeeded");
      return newWallet;
    } catch (err: any) {
      console.warn("connectExternalWallet Cloud Function failed, attempting local fallback:", err?.message ?? err);

      // Local fallback: only allowed when pubkey provided
      if (!pubkey) throw err;

      try {
        const bal = await getWalletBalance(pubkey);
        const newWallet: Wallet = {
          pubkey,
          passphrase: undefined,
          balance: bal,
          isNative: false,
        };

        const userRef = doc(db, "users", firebaseUser.uid);
        try {
          await updateDoc(userRef, {
            externalWallets: arrayUnion({ pubkey }),
            updatedAt: serverTimestamp(),
          });
        } catch (wErr) {
          console.warn("connectExternalWallet fallback: Firestore update failed:", wErr);
        }

        console.log("Γ£à connectExternalWallet connected locally (fallback)");
        return newWallet;
      } catch (localErr: any) {
        console.error("connectExternalWallet fallback failed:", localErr?.message ?? localErr);
        throw localErr;
      }
    }
  }, []);

  // -----------------------------
  // ≡ƒöÉ Auth listener + init
  // -----------------------------
  useEffect(() => {
    console.log("≡ƒöä useAuthInit mounted ΓÇö waiting for Firebase Auth...");

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("onAuthStateChanged:", firebaseUser?.uid ?? "no-user");
      setLoading(true);

      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      const userRef = doc(db, "users", firebaseUser.uid);

      try {
        let snap = await getDoc(userRef);

        // Create base user doc if missing
        if (!snap.exists()) {
          const role: UserRole = "local";
          const base = {
            name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "",
            email: firebaseUser.email || "",
            role,
            kycStatus: "pending",
            reviews: [],
            reputation: 0,
            externalWallets: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          try {
            await setDoc(userRef, base, { merge: true });
            console.log("≡ƒô¥ Created base user doc");
            snap = await getDoc(userRef);
          } catch (wErr) {
            console.error("Failed to create user doc:", wErr);
            // continue ΓÇö user exists in Auth, but Firestore write failed
          }
        }

        const userData = snap.exists() ? (snap.data() as any) : {};

        // If native wallet missing, try cloud function then fallback to local
        if (!userData?.nativeWallet) {
          console.log("≡ƒöæ native wallet missing ΓÇö attempting generation...");

          // Try cloud function first
          try {
            const generateWalletFn = httpsCallable(functions, "generateWallet");
            const result = await generateWalletFn({ uid: firebaseUser.uid });
            const payload = result.data ?? {};
            const pubkey = payload.pubkey ?? payload.walletAddress ?? null;
            const balance = payload.balance ?? 0;

            if (!pubkey) throw new Error("generateWallet returned no pubkey");

            const wallet: Wallet = {
              pubkey,
              // DO NOT persist passphrase in Firestore. Server-side may return passphrase to client only.
              passphrase: undefined,
              balance,
              isNative: true,
            };

            try {
              await updateDoc(userRef, { nativeWallet: wallet, updatedAt: serverTimestamp() });
              console.log("Γ£à Native wallet recorded in Firestore (cloud function).");
            } catch (wErr) {
              console.warn("Native wallet created but failed to write to Firestore:", wErr);
            }

            // Attempt to refresh balances (best-effort)
            try {
              await refreshBalances();
            } catch (fbErr) {
              console.warn("refreshBalances after generateWallet failed:", fbErr);
            }
          } catch (genErr: any) {
            // REPLACED: fallback behavior when cloud function fails.
            // The user requested the catch block here be replaced with a local-generation fallback
            // that logs a warning, creates a local keypair, and writes a nativeWallet to Firestore
            // including the passphrase. NOTE: storing private keys/passphrases in Firestore is
            // generally insecure — see the warning after this file in the editor.

            console.warn("⚠️ Cloud Function failed, generating wallet locally:", genErr?.message ?? genErr);

            try {
              const local = makeLocalSolanaWallet();
              const balance = 0; // skip RPC call for speed

              const wallet: Wallet = {
                pubkey: local.pubkey,
                passphrase: local.secretKeyBase58,
                balance,
                isNative: true,
              };

              await updateDoc(userRef, {
                nativeWallet: wallet,
                updatedAt: serverTimestamp(),
              });

              console.log("✅ Native wallet created locally (fallback):", wallet.pubkey);
            } catch (localErr: any) {
              console.error("Local wallet generation failed:", localErr?.message ?? localErr);
            }
          }
        } else {
          // native wallet present ΓÇö attempt to sync balances
          try {
            await refreshBalances();
          } catch (syncErr) {
            console.warn("Failed to refresh balances for existing native wallet:", syncErr);
          }
        }
      } catch (err: any) {
        console.error("useAuthInit (main) error:", err?.message ?? err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
    // callbacks are stable (wrapped in useCallback), so include them in deps
  }, [connectExternalWallet, refreshBalances]);

  return { user, loading, connectExternalWallet, refreshBalances };
};
