// functions/src/escrow.ts
import * as functions from "firebase-functions";
import { getFirestore } from "firebase-admin/firestore";
import { PublicKey, Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";

const db = getFirestore();
const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

// load escrow keypair (for now, simulated or hardcoded)
const ESCROW_SECRET = process.env.ESCROW_SECRET;
let escrowKeypair: Keypair | null = null;
if (ESCROW_SECRET) {
  escrowKeypair = Keypair.fromSecretKey(bs58.decode(ESCROW_SECRET));
}

export const depositToEscrow = functions.https.onCall(async (data, context) => {
  const { fromPubkey, amountSOL, taskId } = data;
  if (!fromPubkey || !amountSOL || !taskId) throw new functions.https.HttpsError("invalid-argument", "Missing params");

  // for MVP, we simulate the transfer
  const txSignature = `SIMULATED_DEPOSIT_${Date.now()}`;

  // store transaction ref
  await db.collection("tasks").doc(taskId).update({
    escrowStatus: "funded",
    escrowTxId: txSignature,
    escrowAmount: amountSOL,
  });

  return { txSignature, message: "Deposit simulated successfully" };
});

export const releaseEscrow = functions.https.onCall(async (data, context) => {
  const { taskId, toPubkey } = data;
  if (!taskId || !toPubkey) throw new functions.https.HttpsError("invalid-argument", "Missing params");

  const taskRef = db.collection("tasks").doc(taskId);
  const taskSnap = await taskRef.get();
  if (!taskSnap.exists) throw new functions.https.HttpsError("not-found", "Task not found");

  const task = taskSnap.data();
  if (task?.escrowStatus !== "funded")
    throw new functions.https.HttpsError("failed-precondition", "No funds to release");

  const txSignature = `SIMULATED_RELEASE_${Date.now()}`;

  await taskRef.update({
    escrowStatus: "released",
    payoutTxId: txSignature,
  });

  return { txSignature, message: "Funds released successfully" };
});
