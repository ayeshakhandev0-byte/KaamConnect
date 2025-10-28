// src/App.tsx
import React, { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Routes, Route, Link } from "react-router-dom";

import HomePage from "./screens/HomePage";
import PreSignupScreen from "./screens/PreSignupScreen";
import SignupScreen from "./screens/SignupScreen";
import LoginScreen from "./screens/LoginScreen";
import ExplorePage from "./screens/ExplorePage";
import AccountsPage from "./screens/AccountsPage";
import WalletPage from "./screens/WalletPage";
import Dashboard from "./screens/Dashboard";
import ActiveJobPage from "./screens/ActiveJobPage";
import CreateTaskPage from "./screens/CreateTask";
import DebugCalls from "./DebugCalls";

import { UserProvider } from "./contexts/UserContext";
import { TasksProvider } from "./contexts/TasksContext";

import { useAuthInit } from "./hooks/useAuthInit"; // initializes Firebase auth + wallet

type RpcEntry = {
  name: string;
  accounts?: Array<{ name: string; isMut?: boolean; isSigner?: boolean }>;
  args?: Array<{ name: string; type: any }>;
};

export default function App() {
  // initialize firebase auth; useAuthInit returns { user, loading } in your hook
  const { user, loading: authLoading } = useAuthInit();

  const { connection } = useConnection();
  const wallet = useWallet();

  const [idl, setIdl] = useState<Idl | null>(null);
  const [program, setProgram] = useState<Program | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [rpcList, setRpcList] = useState<RpcEntry[]>([]);
  const [selected, setSelected] = useState<RpcEntry | null>(null);
  const [argInputs, setArgInputs] = useState<Record<string, string>>({});

  const envProgramId = import.meta.env.VITE_PROGRAM_ID ?? "";

  // Load IDL
  useEffect(() => {
    (async () => {
      try {
        setStatus("Loading IDL...");
        const res = await fetch("/idl/kaam_connect.json");
        if (!res.ok) throw new Error(`Failed to fetch IDL: ${res.status}`);
        const json = await res.json();
        setIdl(json);

        const rpcs = (json.instructions || []).map((r: any) => ({
          name: r.name,
          accounts: (r.accounts || []).map((a: any) => ({
            name: a.name,
            isMut: a.writable ?? false,
            isSigner: a.signer ?? false,
          })),
          args: r.args || [],
        }));

        setRpcList(rpcs);
        setStatus("IDL loaded");
      } catch (err: any) {
        setStatus(`IDL error: ${err.message ?? String(err)}`);
      }
    })();
  }, []);

  // Init program when wallet + idl present
  useEffect(() => {
    if (!idl || !wallet || !wallet.publicKey) return;
    try {
      const programIdStr = envProgramId || (idl as any)?.metadata?.address;
      if (!programIdStr) {
        setStatus("PROGRAM_ID not set in .env or in IDL metadata");
        return;
      }
      const provider = new AnchorProvider(connection, wallet as any, {
        preflightCommitment: "processed",
      });
      const p = new Program(idl as Idl, new PublicKey(programIdStr), provider);
      setProgram(p);
      setStatus(`Program ready: ${programIdStr}`);
    } catch (err: any) {
      setStatus(`Program init error: ${err.message ?? String(err)}`);
    }
  }, [idl, wallet, connection, envProgramId]);

  // Initialize arg inputs when selecting method
  useEffect(() => {
    if (!selected) return;
    const initial: Record<string, string> = {};
    (selected.args || []).forEach((a) => {
      initial[a.name] = "";
    });
    (selected.accounts || []).forEach((a) => {
      initial[`account:${a.name}`] = "";
    });
    setArgInputs(initial);
  }, [selected]);

  const deriveFallbackPDA = async (name: string, programId: PublicKey) => {
    try {
      const seed = Buffer.from(name);
      const [pda] = await PublicKey.findProgramAddress(
        [seed, wallet.publicKey!.toBuffer()],
        programId
      );
      return pda;
    } catch {
      return null;
    }
  };

  const previewAccounts = async (rpc: RpcEntry) => {
    if (!program) return {};
    const mapping: Record<string, string> = {};
    const programId = program.programId;
    for (const acc of rpc.accounts || []) {
      const name = acc.name;
      if (["user", "authority", "payer"].includes(name)) {
        mapping[name] = wallet.publicKey!.toBase58();
        continue;
      }
      if (name === "systemProgram") {
        mapping[name] = PublicKey.default.toBase58();
        continue;
      }
      const pda = await deriveFallbackPDA(name, programId);
      mapping[name] = pda ? pda.toBase58() : "<derive-failed>";
    }
    return mapping;
  };

  const callRpc = async (rpc: RpcEntry) => {
    if (!program) return setStatus("Program not ready");
    if (!wallet.publicKey) return setStatus("Connect wallet first");

    setStatus(`Preparing call: ${rpc.name}`);
    try {
      const accounts: Record<string, PublicKey> = {};
      for (const acc of rpc.accounts || []) {
        const name = acc.name;
        if (["user", "authority", "payer"].includes(name)) {
          accounts[name] = wallet.publicKey!;
          continue;
        }
        if (name === "systemProgram") {
          accounts[name] = PublicKey.default;
          continue;
        }
        if (argInputs[`account:${name}`]) {
          try {
            accounts[name] = new PublicKey(argInputs[`account:${name}`]);
            continue;
          } catch {}
        }
        const pda = await PublicKey.findProgramAddress(
          [Buffer.from(name), wallet.publicKey!.toBuffer()],
          program.programId
        );
        accounts[name] = pda[0];
      }

      const args: any[] = [];
      for (const a of rpc.args || []) {
        const raw = argInputs[a.name] ?? "";
        if (raw.trim() === "") throw new Error(`Missing arg: ${a.name}`);
        try {
          args.push(JSON.parse(raw));
        } catch {
          args.push(raw);
        }
      }

      setStatus(`Sending tx: ${rpc.name} ...`);
      const res = await (program.rpc as any)[rpc.name](...args, { accounts });
      setStatus(`TX success: ${String(res)}`);
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      setStatus(`RPC error: ${msg}`);
    }
  };

  // NAV visibility logic:
  // show navigation if (1) firebase user exists (user created / signed-in) OR (2) wallet adapter is connected.
  // This makes nav appear after signup/login even if user hasn't connected an external wallet adapter.
  const showNav = !!user || wallet.connected;

  return (
    <UserProvider>
      <TasksProvider>
        <div style={{ minHeight: "100vh", background: "#0f172a", color: "white" }}>
          <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
            {/* Header */}
            <header
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <h2 style={{ margin: 0 }}>KaamConnect</h2>
              <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                {showNav && (
                  <>
                    <Link to="/explore" style={{ color: "#fff" }}>Explore</Link>
                    <Link to="/accounts" style={{ color: "#fff" }}>Accounts</Link>
                    <Link to="/wallet" style={{ color: "#fff" }}>Wallet</Link>
                    <Link to="/dashboard" style={{ color: "#fff" }}>Dashboard</Link>
                  </>
                )}
                <WalletMultiButton />
              </nav>
            </header>

            {/* Main routes */}
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/pre-signup" element={<PreSignupScreen />} />
              <Route path="/signup" element={<SignupScreen />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/task/:id" element={<ActiveJobPage />} />
              <Route path="/task/create" element={<CreateTaskPage />} />
              <Route path="/debug" element={<DebugCalls />} />
            </Routes>
          </div>
        </div>
      </TasksProvider>
    </UserProvider>
  );
}
