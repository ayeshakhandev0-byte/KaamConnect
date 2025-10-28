// src/context/AppContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";
import { PublicKey } from "@solana/web3.js";

// ---------- Types ----------
export type UserType = "diaspora" | "national";

export type ReputationColor = "green" | "grey" | "red";

export interface UserProfile {
  name: string;
  location?: string;
  role?: string;
  education?: string;
  experience?: string;
  connectedAccounts?: string[];
  reputation: {
    positive: number;
    negative: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: "active" | "completed" | "applied";
  giver: PublicKey;
  receiver?: PublicKey;
}

// ---------- Context Interface ----------
interface AppContextProps {
  userType: UserType | null;
  setUserType: (t: UserType) => void;
  profile: UserProfile | null;
  setProfile: (p: UserProfile) => void;
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTaskStatus: (taskId: string, status: Task["status"]) => void;
  calculateReputationColor: (profile: UserProfile) => ReputationColor;
}

// ---------- Context ----------
const AppContext = createContext<AppContextProps | undefined>(undefined);

// ---------- Provider ----------
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [userType, setUserType] = useState<UserType | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  const addTask = (task: Task) => setTasks((prev) => [...prev, task]);

  const updateTaskStatus = (taskId: string, status: Task["status"]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );
  };

  // simple reputation color calculator
  const calculateReputationColor = (profile: UserProfile): ReputationColor => {
    const { positive, negative } = profile.reputation;
    if (negative > positive) return "grey";
    if (positive === 0 && negative === 0) return "red"; // new/untrusted
    return "green";
  };

  return (
    <AppContext.Provider
      value={{
        userType,
        setUserType,
        profile,
        setProfile,
        tasks,
        setTasks,
        addTask,
        updateTaskStatus,
        calculateReputationColor,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// ---------- Hook ----------
export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppProvider");
  return ctx;
};
