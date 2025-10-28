// src/utils/taskActions.ts
import { collection, addDoc, doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, functions } from "../firebase";
import { httpsCallable } from "firebase/functions";

interface CreateTaskParams {
  title: string;
  description: string;
  category: string;
  creatorId: string;
  deposit: number; // amount in SOL
}

// ---------------------
// Create Task + Escrow Deposit
// ---------------------
export async function createTask({ title, description, category, creatorId, deposit }: CreateTaskParams) {
  const ref = await addDoc(collection(db, "tasks"), {
    title,
    description,
    category,
    creatorId,
    deposit,
    status: "Open",
    assignedTo: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Return full task object
  return { id: ref.id, title, description, category, creatorId, deposit };
}

// ---------------------
// Accept Task
// ---------------------
export async function acceptTask(taskId: string, receiverUid: string) {
  const ref = doc(db, "tasks", taskId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Task not found");

  const data = snap.data();
  if (data.status !== "Open") throw new Error("Task not open");

  await updateDoc(ref, {
    assignedTo: receiverUid,
    status: "Accepted",
    updatedAt: serverTimestamp(),
  });
}

// ---------------------
// Finalize Task & Transfer
// ---------------------
export async function finalizeTask(taskId: string, finalizerUid: string) {
  const ref = doc(db, "tasks", taskId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Task not found");

  // mark as finalized first
  await updateDoc(ref, {
    status: "Finalized",
    updatedAt: serverTimestamp(),
  });

  try {
    // Try backend transfer (to task assignee/native wallet)
    const transferFn = httpsCallable(functions, "transferForTask");
    const res = await transferFn({ taskId });
    await updateDoc(ref, {
      status: "Completed",
      escrow: res.data ?? {},
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    // fallback: simulate transfer
    await updateDoc(ref, {
      status: "Completed",
      escrow: { simulated: true },
      updatedAt: serverTimestamp(),
    });
  }
}

// ---------------------
// Deposit SOL/Assets to Task Escrow
// ---------------------
export async function depositToTaskEscrow({ taskId, userPubkey, amount }: { taskId: string; userPubkey: string; amount: number }) {
  try {
    const depositFn = httpsCallable(functions, "depositToEscrow");
    const res = await depositFn({ taskId, fromPubkey: userPubkey, amountSOL: amount });
    console.log("Deposit result:", res.data);
    return res.data;
  } catch (err) {
    console.error("Deposit failed:", err);
    throw err;
  }
}

// ---------------------
// Release from Escrow (if needed separately)
// ---------------------
export async function releaseEscrow(taskId: string, toPubkey: string) {
  try {
    const releaseFn = httpsCallable(functions, "releaseEscrow");
    const res = await releaseFn({ taskId, toPubkey });
    console.log("Release result:", res.data);
    return res.data;
  } catch (err) {
    console.error("Release failed:", err);
    throw err;
  }
}
