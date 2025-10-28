import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import {
  Keypair,
  Connection,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
// Imports for future use:
// import {Transaction, SystemProgram, sendAndConfirmTransaction}
import * as bip39 from "bip39";

admin.initializeApp();
const db = admin.firestore();

// Use devnet for testing, mainnet later
const connection = new Connection(clusterApiUrl("devnet"));

// ------------------------
// Helper: Create Native Wallet
// ------------------------
async function createNativeWallet(uid: string) {
  const keypair = Keypair.generate();
  const mnemonic = bip39.entropyToMnemonic(
    Buffer.from(keypair.secretKey).toString("hex").slice(0, 32)
  );

  const walletData = {
    pubkey: keypair.publicKey.toBase58(),
    passphrase: mnemonic,
    balance: 0,
    isNative: true,
  };

  const userRef = db.collection("users").doc(uid);
  const docSnap = await userRef.get();

  if (!docSnap.exists || !docSnap.data()?.nativeWallet) {
    await userRef.set({nativeWallet: walletData}, {merge: true});
  }

  return walletData;
}

// ------------------------
// Callable Function: Generate Native Wallet
// ------------------------
export const generateWallet = functions.https.onCall(
  async (_data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const uid = context.auth.uid;
    const walletData = await createNativeWallet(uid);
    return walletData;
  }
);

// ------------------------
// Callable Function: Connect External Wallet
// ------------------------
export const connectExternalWallet = functions.https.onCall(
  async (
    data: {pubkey: string},
    context: functions.https.CallableContext
  ) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const uid = context.auth.uid;
    const {pubkey} = data;

    let balance = 0;
    try {
      const pubKeyInstance = new PublicKey(pubkey);
      const lamports = await connection.getBalance(pubKeyInstance);
      balance = lamports / LAMPORTS_PER_SOL;
    } catch (err) {
      console.warn("Invalid external wallet:", err);
    }

    const walletData = {pubkey, balance, isNative: false};
    const userRef = db.collection("users").doc(uid);

    await userRef.set(
      {
        externalWallets: admin.firestore.FieldValue.arrayUnion(walletData),
      },
      {merge: true}
    );

    return walletData;
  }
);

// ------------------------
// Callable Function: Fetch All Wallet Balances
// ------------------------
export const fetchBalances = functions.https.onCall(
  async (_data: unknown, context: functions.https.CallableContext) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const uid = context.auth.uid;
    const userRef = db.collection("users").doc(uid);
    const docSnap = await userRef.get();

    if (!docSnap.exists) {
      throw new functions.https.HttpsError("not-found", "User not found");
    }

    const userData = docSnap.data();
    const nativeWallet = userData?.nativeWallet || null;
    const externalWallets = userData?.externalWallets || [];

    if (nativeWallet) {
      try {
        const pubKeyInstance = new PublicKey(nativeWallet.pubkey);
        const lamports = await connection.getBalance(pubKeyInstance);
        nativeWallet.balance = lamports / LAMPORTS_PER_SOL;
      } catch (err) {
        console.warn("Error fetching native wallet balance:", err);
      }
    }

    for (const wallet of externalWallets) {
      try {
        const pubKeyInstance = new PublicKey(wallet.pubkey);
        const lamports = await connection.getBalance(pubKeyInstance);
        wallet.balance = lamports / LAMPORTS_PER_SOL;
      } catch (err) {
        console.warn("Error fetching external wallet balance:", err);
        wallet.balance = 0;
      }
    }

    return {nativeWallet, externalWallets};
  }
);

// ------------------------
// Callable Function: Deposit to Escrow
// ------------------------
export const depositToEscrow = functions.https.onCall(
  async (
    data: {taskId: string; fromPubkey: string; amountSOL: number},
    context: functions.https.CallableContext
  ) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const {taskId, fromPubkey, amountSOL} = data;
    const uid = context.auth.uid;

    const taskRef = db.collection("tasks").doc(taskId);
    const taskSnap = await taskRef.get();

    if (!taskSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Task not found");
    }

    const task = taskSnap.data();
    if (!task || task.escrow) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Escrow already exists"
      );
    }

    // TODO: implement actual transfer using private key management
    // For demo, we just record escrow in Firestore
    const escrow = {
      txId: "demo-tx-" + Date.now(),
      from: fromPubkey,
      to: uid,
      amount: amountSOL,
    };
    await taskRef.set({escrow}, {merge: true});

    return {success: true, txId: escrow.txId, newBalance: 0};
  }
);

// ------------------------
// Callable Function: Transfer For Task
// ------------------------
export const transferForTask = functions.https.onCall(
  async (
    data: {taskId: string},
    context: functions.https.CallableContext
  ) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const {taskId} = data;
    const taskRef = db.collection("tasks").doc(taskId);
    const taskSnap = await taskRef.get();

    if (!taskSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Task not found");
    }

    const task = taskSnap.data();
    if (!task?.escrow) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "No escrow to transfer"
      );
    }

    // TODO: implement actual transfer using private key management
    // For demo, mark as transferred
    await taskRef.set({status: "Completed"}, {merge: true});

    return {success: true, txId: task.escrow.txId};
  }
);

// ------------------------
// Optional: Release Escrow (for testing/demo)
// ------------------------
export const releaseEscrow = functions.https.onCall(
  async (
    data: {taskId: string},
    context: functions.https.CallableContext
  ) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated"
      );
    }

    const {taskId} = data;
    // Note: toPubkey from data will be used when implementing actual transfers
    const taskRef = db.collection("tasks").doc(taskId);
    const taskSnap = await taskRef.get();

    if (!taskSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Task not found");
    }

    const task = taskSnap.data();
    if (!task?.escrow) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "No escrow to release"
      );
    }

    // TODO: implement actual transfer using private key management
    // For demo, mark as released
    await taskRef.set({status: "Released"}, {merge: true});

    return {success: true, txId: task.escrow.txId};
  }
);
