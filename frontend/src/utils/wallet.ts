// src/utils/wallet.ts
import { httpsCallable } from "firebase/functions";
import { functions, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

export async function callGenerateWallet() {
  const fn = httpsCallable(functions, "generateWallet");
  const res = await fn();
  return res.data; // { walletAddress, passphrase, balance }
}

export async function callConnectExternal(pubkey: string) {
  const fn = httpsCallable(functions, "connectExternalWallet");
  const res = await fn({ pubkey });
  return res.data; // { pubkey, balance, isNative: false }
}

export async function callFetchBalances() {
  const fn = httpsCallable(functions, "fetchBalances");
  const res = await fn();
  return res.data; // { nativeWallet, externalWallets }
}

// optional helper to persist returned wallet in users/{uid} (only if you want frontend to write)
export async function saveNativeToUser(uid: string, wallet: any) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { nativeWallet: wallet });
}
