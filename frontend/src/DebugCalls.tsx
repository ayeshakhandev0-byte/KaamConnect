// DebugCalls.tsx - Comprehensive Debug Component
import React, { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions, db, auth } from "./firebase";
import { doc, getDoc, enableNetwork } from "firebase/firestore";

export default function DebugCalls() {
  const [genResult, setGenResult] = useState<any>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [fetchResult, setFetchResult] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [readResult, setReadResult] = useState<any>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const callGenerate = async () => {
    setGenError(null);
    setGenResult(null);
    setBusy(true);
    console.log("Calling generateWallet...");
    
    try {
      const fn = httpsCallable(functions, "generateWallet");
      const res = await fn({});
      setGenResult(res.data ?? res);
      console.log("generateWallet result:", res.data);
      alert("generateWallet OK — check console and result below");
    } catch (err: any) {
      console.error("generateWallet error (full):", err);
      // Firebase callable errors often have code/details
      console.log("err.code:", err.code);
      console.log("err.details:", err.details);
      console.log("err.message:", err.message);
      try {
        console.log("err.toJSON:", err.toJSON ? err.toJSON() : null);
      } catch {}
      setGenError(String(err?.message ?? err));
      alert("generateWallet error — see console for code/details");
    } finally {
      setBusy(false);
    }
  };

  const callFetchBalances = async () => {
    setFetchError(null);
    setFetchResult(null);
    setBusy(true);
    console.log("Calling fetchBalances...");
    
    try {
      const fn = httpsCallable(functions, "fetchBalances");
      const res = await fn({});
      setFetchResult(res.data ?? res);
      console.log("fetchBalances result:", res.data);
      alert("fetchBalances OK — check console and result below");
    } catch (err: any) {
      console.error("fetchBalances error:", err);
      console.log("err.code:", err.code, "err.details:", err.details);
      setFetchError(String(err?.message ?? err));
      alert("fetchBalances error — see console for details");
    } finally {
      setBusy(false);
    }
  };

  const readUserDoc = async () => {
    setReadError(null);
    setReadResult(null);
    setBusy(true);
    
    try {
      if (!auth.currentUser) {
        throw new Error("No auth.currentUser (not signed in)");
      }
      
      const uid = auth.currentUser.uid;
      const ref = doc(db, "users", uid);
      console.log("Attempting getDoc users/" + uid);
      
      const snap = await getDoc(ref);
      const data = snap.exists() ? snap.data() : "no-doc";
      
      console.log("getDoc snap.exists:", snap.exists(), "data:", data);
      setReadResult(data);
      alert("Got user doc — check console and result below");
    } catch (err: any) {
      console.error("read error:", err);
      setReadError(String(err?.message ?? err));
      alert("Read failed: " + (err.message ?? String(err)));
    } finally {
      setBusy(false);
    }
  };

  const tryEnableNetwork = async () => {
    setBusy(true);
    try {
      console.log("Attempting to enable Firestore network...");
      await enableNetwork(db);
      alert("enableNetwork() called — see console. Try reading doc again.");
      console.log("enableNetwork() succeeded");
    } catch (err) {
      console.error("enableNetwork failed:", err);
      alert("enableNetwork failed — see console");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        padding: 20,
        background: "#0b1220",
        borderRadius: 8,
        color: "white",
        maxWidth: 860,
      }}
    >
      <h3 style={{ marginTop: 0 }}>Debug - Cloud Functions & Firestore</h3>
      
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <button
          onClick={callGenerate}
          disabled={busy}
          style={{ padding: "8px 12px", cursor: busy ? "not-allowed" : "pointer" }}
        >
          {busy ? "..." : "Call generateWallet"}
        </button>
        <button
          onClick={callFetchBalances}
          disabled={busy}
          style={{ padding: "8px 12px", cursor: busy ? "not-allowed" : "pointer" }}
        >
          {busy ? "..." : "Call fetchBalances"}
        </button>
        <button
          onClick={readUserDoc}
          disabled={busy}
          style={{ padding: "8px 12px", cursor: busy ? "not-allowed" : "pointer" }}
        >
          {busy ? "..." : `Read users/${auth.currentUser?.uid ?? "??"}`}
        </button>
        <button
          onClick={tryEnableNetwork}
          disabled={busy}
          style={{ padding: "8px 12px", cursor: busy ? "not-allowed" : "pointer" }}
        >
          {busy ? "..." : "enableNetwork()"}
        </button>
      </div>

      <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
        Open DevTools Network and Functions logs (Firebase console). After running, check console output/errors.
      </p>

      <div style={{ fontSize: 13 }}>
        <div style={{ marginBottom: 12 }}>
          <strong>generateWallet result / error:</strong>
          <div
            style={{
              marginTop: 6,
              whiteSpace: "pre-wrap",
              maxHeight: 220,
              overflow: "auto",
              background: "#071021",
              padding: 8,
              borderRadius: 6,
            }}
          >
            {genResult ? (
              <pre style={{ margin: 0 }}>{JSON.stringify(genResult, null, 2)}</pre>
            ) : genError ? (
              <span style={{ color: "#ff6b6b" }}>{genError}</span>
            ) : (
              "—"
            )}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <strong>fetchBalances result / error:</strong>
          <div
            style={{
              marginTop: 6,
              whiteSpace: "pre-wrap",
              maxHeight: 220,
              overflow: "auto",
              background: "#071021",
              padding: 8,
              borderRadius: 6,
            }}
          >
            {fetchResult ? (
              <pre style={{ margin: 0 }}>{JSON.stringify(fetchResult, null, 2)}</pre>
            ) : fetchError ? (
              <span style={{ color: "#ff6b6b" }}>{fetchError}</span>
            ) : (
              "—"
            )}
          </div>
        </div>

        <div>
          <strong>user doc read / error:</strong>
          <div
            style={{
              marginTop: 6,
              whiteSpace: "pre-wrap",
              maxHeight: 220,
              overflow: "auto",
              background: "#071021",
              padding: 8,
              borderRadius: 6,
            }}
          >
            {readResult ? (
              <pre style={{ margin: 0 }}>{JSON.stringify(readResult, null, 2)}</pre>
            ) : readError ? (
              <span style={{ color: "#ff6b6b" }}>{readError}</span>
            ) : (
              "—"
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
