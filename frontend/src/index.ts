// src/types/index.ts

// --- USER RELATED TYPES ---

export type UserRole = "diaspora" | "local";
export type KycStatus = "pending" | "approved" | "rejected";

export interface Review {
  positive: boolean;
  comment?: string;
  images?: string[];
}

export interface Wallet {
  pubkey: string;
  passphrase?: string; // only for native wallet
  balance?: number; // optional balance tracking
  isNative: boolean; // true for native wallet, false for external
}

export interface User {
  uid: string; // Firestore doc id / Firebase Auth uid
  name: string;
  email: string;
  role: UserRole;
  kycStatus: KycStatus;
  nativeWallet: Wallet; // automatically created at registration
  externalWallets?: Wallet[]; // optional connected wallets
  reviews: Review[];
  reputation?: number; // optional score based on reviews
  socialLinks?: string[]; // optional social links
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
}

// --- TASK RELATED TYPES ---

export type TaskStatus = "active" | "completed" | "open" | "accepted";

export interface Task {
  id: string;
  title: string;
  description: string;
  amount: number;
  category?: string; // optional for filtering
  giver: User;
  receiver?: User;
  assignedTo?: string; // uid of user who accepted the task
  status: TaskStatus;
  reviews?: Review[];
  deadline?: any; // Firestore Timestamp or Date
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
}

// --- ESCROW RELATED EXPORTS ---
export { depositToEscrow, releaseEscrow } from "./escrow";
