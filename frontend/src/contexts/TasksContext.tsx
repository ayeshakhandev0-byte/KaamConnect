// src/contexts/TasksContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db, auth } from "../firebase";

export type TaskStatus = "Open" | "Accepted" | "In Progress" | "Completed";

export interface Task {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  assignedTo?: string;
  status: TaskStatus;
  deadline?: any; // Firestore Timestamp
  messages: string[]; // stored as array
  category?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface TasksContextType {
  tasks: Task[];
  loading: boolean;
  addTask: (taskData: Omit<Task, "id" | "messages" | "status" | "createdAt" | "updatedAt" | "creatorId">) => Promise<string>;
  acceptTask: (taskId: string, userId: string) => Promise<void>;
  addMessage: (taskId: string, message: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  refetch: () => void;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export const useTasks = () => {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within TasksProvider");
  return ctx;
};

export const TasksProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Real-time listener
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "task"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const out: Task[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          out.push({
            id: d.id,
            title: data.title ?? "",
            description: data.description ?? "",
            creatorId: data.creatorId ?? "",
            assignedTo: data.assignedTo ?? undefined,
            status: (data.status as TaskStatus) ?? "Open",
            deadline: data.deadline ?? undefined,
            messages: Array.isArray(data.messages) ? data.messages : [],
            category: data.category ?? undefined,
            createdAt: data.createdAt ?? undefined,
            updatedAt: data.updatedAt ?? undefined,
          });
        });
        setTasks(out);
        setLoading(false);
      },
      (err) => {
        console.error("Tasks onSnapshot error", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // Add new task with automatic creatorId from Firebase Auth
  const addTask = async (taskData: Omit<Task, "id" | "messages" | "status" | "createdAt" | "updatedAt" | "creatorId">) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("User not logged in");

    const docRef = await addDoc(collection(db, "task"), {
      ...taskData,
      creatorId: currentUser.uid,
      messages: [],
      status: "Open",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  };

  const acceptTask = async (taskId: string, userId: string) => {
    const ref = doc(db, "task", taskId);
    await updateDoc(ref, {
      assignedTo: userId,
      status: "Accepted",
      updatedAt: serverTimestamp(),
    });
  };

  const addMessage = async (taskId: string, message: string) => {
    const ref = doc(db, "task", taskId);
    await updateDoc(ref, {
      messages: arrayUnion(message),
      updatedAt: serverTimestamp(),
    });
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    const ref = doc(db, "task", taskId);
    await updateDoc(ref, { status, updatedAt: serverTimestamp() });
  };

  const refetch = async () => {
    setLoading(true);
    const q = query(collection(db, "task"), orderBy("createdAt", "desc"));
    const snap = await (await import("firebase/firestore")).getDocs(q);
    const out: Task[] = [];
    snap.forEach((d: any) => {
      const data = d.data();
      out.push({
        id: d.id,
        title: data.title ?? "",
        description: data.description ?? "",
        creatorId: data.creatorId ?? "",
        assignedTo: data.assignedTo ?? undefined,
        status: (data.status as TaskStatus) ?? "Open",
        deadline: data.deadline ?? undefined,
        messages: Array.isArray(data.messages) ? data.messages : [],
        category: data.category ?? undefined,
        createdAt: data.createdAt ?? undefined,
        updatedAt: data.updatedAt ?? undefined,
      });
    });
    setTasks(out);
    setLoading(false);
  };

  return (
    <TasksContext.Provider
      value={{ tasks, loading, addTask, acceptTask, addMessage, updateTaskStatus, refetch }}
    >
      {children}
    </TasksContext.Provider>
  );
};
