// src/utils/walletHelpers.ts
// Lightweight wallet helpers for local fallback generation & balance checks.
// WARNING: This file is intended for dev/demo fallback only.
// Never persist private keys/secrets in Firestore or any remote DB in production.

import { Keypair, Connection, clusterApiUrl } from "@solana/web3.js";
import bs58 from "bs58";

/**
 * Generate a local Solana keypair and return a small portable record.
 * - pubkey: base58 string (public key)
 * - secretKeyBase58: base58-encoded secretKey (Uint8Array) — for demo fallback only
 *
 * IMPORTANT: If you show secretKeyBase58 to a user, do so immediately (modal) and instruct them to store it
 * securely. Do NOT write this secret to Firestore or any remote storage in production.
 */
export function makeLocalSolanaWallet() {
  const kp = Keypair.generate();

  // kp.secretKey is already a Uint8Array — no Buffer wrapper needed
  const secretKeyBase58 = bs58.encode(kp.secretKey);

  return {
    pubkey: kp.publicKey.toBase58(),
    secretKeyBase58,
  };
}

/**
 * Convert base58-encoded secret back into a Keypair.
 * Accepts either Buffer-encoded strings or plain base58.
 */
export function keypairFromBase58(secretBase58: string) {
  // bs58.decode returns a Uint8Array suitable for Keypair.fromSecretKey
  const secretUint8 = bs58.decode(secretBase58);
  return Keypair.fromSecretKey(secretUint8);
}

/**
 * Get SOL balance for a given base58 pubkey.
 * Uses the RPC endpoint from VITE_SOLANA_RPC if present, else devnet.
 * Returns balance as SOL (number).
 */
export async function getWalletBalance(pubkeyBase58: string): Promise<number> {
  try {
    const endpoint = (import.meta.env.VITE_SOLANA_RPC as string) || clusterApiUrl("devnet");
    const conn = new Connection(endpoint);
    const { PublicKey } = await import("@solana/web3.js");
    const key = new PublicKey(pubkeyBase58);
    const lamports = await conn.getBalance(key);
    return lamports / 1e9;
  } catch (err) {
    console.warn("getWalletBalance error:", err);
    return 0;
  }
}
