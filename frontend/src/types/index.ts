export type UserRole = "diaspora" | "local";

export interface Review {
  positive: boolean;
  comment?: string;
  images?: string[];
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  walletPubkey: string;
  reviews: Review[];
  reputation?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  amount: number;
  giver: User;
  receiver?: User;
  status: "active" | "completed";
  reviews?: Review[];
}
