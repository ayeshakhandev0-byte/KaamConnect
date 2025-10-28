import { User } from "../types";

export async function fetchUser(walletPubkey: string): Promise<User> {
  // mock API call
  return {
    id: walletPubkey,
    name: "John Doe",
    role: "local",
    walletPubkey,
    reviews: [],
  };
}
