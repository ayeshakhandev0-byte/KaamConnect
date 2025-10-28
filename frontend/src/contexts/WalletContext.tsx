import React, { createContext, useContext } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

interface WalletContextValue {
  wallet: ReturnType<typeof useWallet>;
  connection: any;
  program?: Program<Idl>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export const WalletProviderWrapper: React.FC<{ children: React.ReactNode, idl: Idl, programId: string }> = ({ children, idl, programId }) => {
  const wallet = useWallet();
  const { connection } = useConnection();

  const provider = new AnchorProvider(connection, wallet as any, { preflightCommitment: "processed" });
  const program = new Program(idl, new PublicKey(programId), provider);

  return (
    <WalletContext.Provider value={{ wallet, connection, program }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("WalletContext must be used within WalletProviderWrapper");
  return ctx;
};
