// src/main.tsx
import "./testFirebase";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import App from "./App";
import "./index.css";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";

import { AppProvider } from "./contexts/AppContext"; // global app state
import { TasksProvider } from "./contexts/TasksContext";
import { useAuthInit } from "./hooks/useAuthInit"; // Auth + wallet hook

import "@solana/wallet-adapter-react-ui/styles.css";

// Use your RPC endpoint from env or fallback to localhost dev validator
const endpoint = import.meta.env.VITE_SOLANA_RPC || "http://127.0.0.1:8899";
const wallets = [new PhantomWalletAdapter()];

function AuthInitWrapper({ children }: { children: React.ReactNode }) {
  // useAuthInit must return { user, loading } as implemented in the hook
  const { loading } = useAuthInit();

  // While auth initialization (and wallet generation) is in progress,
  // show a minimal loading state so we don't render the rest of the app too early.
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2 style={{ margin: 0 }}>KaamConnect</h2>
          <p style={{ marginTop: 8 }}>Initializing authentication and wallet…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function Main() {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AppProvider>
            <TasksProvider>
              <AuthInitWrapper>
                <Router>
                  <App />
                </Router>
              </AuthInitWrapper>
            </TasksProvider>
          </AppProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
