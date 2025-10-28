// src/services/walletService.ts
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";
import { Connection, PublicKey } from "@solana/web3.js";

// Replace with your cluster endpoint
const SOLANA_RPC_ENDPOINT = "https://api.mainnet-beta.solana.com"; // or devnet
const connection = new Connection(SOLANA_RPC_ENDPOINT);

/**
 * Fetch the native wallet info for the logged-in user
 */
export async function getNativeWallet(): Promise<{ address: string; passphrase: string }> {
  try {
    const getWallet = httpsCallable(functions, "getNativeWallet");
    const result = await getWallet();
    // Expected result: { address: string, passphrase: string }
    return result.data;
  } catch (err) {
    console.error("Error fetching native wallet:", err);
    throw err;
  }
}

/**
 * Get SOL balance for a given wallet address
 */
export async function getWalletBalance(address: string): Promise<number> {
  try {
    const publicKey = new PublicKey(address);
    const lamports = await connection.getBalance(publicKey);
    const sol = lamports / 1e9; // convert lamports to SOL
    return sol;
  } catch (err) {
    console.error("Error fetching wallet balance:", err);
    return 0;
  }
}

/**
 * Optional: Store an external wallet for the user in backend (Firestore or your DB)
 */
export async function addExternalWallet(address: string) {
  try {
    const addWallet = httpsCallable(functions, "addExternalWallet");
    const result = await addWallet({ address });
    return result.data;
  } catch (err) {
    console.error("Error adding external wallet:", err);
    throw err;
  }
}

/**
 * Optional: Fetch external wallets stored for user
 */
export async function getExternalWallets(): Promise<{ address: string }[]> {
  try {
    const fetchWallets = httpsCallable(functions, "getExternalWallets");
    const result = await fetchWallets();
    return result.data.wallets || [];
  } catch (err) {
    console.error("Error fetching external wallets:", err);
    return [];
  }
}
