// src/screens/Dashboard.tsx
import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Link, useNavigate } from "react-router-dom";
import { useTasks } from "../contexts/TasksContext";
import { useAuthInit } from "../hooks/useAuthInit";
import { createTask, depositToTaskEscrow } from "../utils/taskActions";

export default function Dashboard() {
  const wallet = useWallet();
  const navigate = useNavigate();
  const { tasks, refreshTasks } = useTasks();
  const { user, connectExternalWallet } = useAuthInit();
  const [view, setView] = useState<"giver" | "receiver">("giver");

  // New state for task creation
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("Tech");
  const [newTaskDeposit, setNewTaskDeposit] = useState<number>(0);
  const [creating, setCreating] = useState(false);

  if (!wallet.connected) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", color: "#fff", padding: "2rem" }}>
        <h3>Please connect your wallet to view the dashboard.</h3>
      </div>
    );
  }

  const currentUserId = wallet.publicKey?.toBase58() || user?.uid || "";

  const giverTasks = tasks.filter((t) => t.creatorId === currentUserId);
  const receiverTasks = tasks.filter((t) => t.assignedTo === currentUserId);

  const handleCreateTask = async () => {
    if (!currentUserId) return alert("Wallet or user not available.");
    if (!newTaskTitle || !newTaskDesc) return alert("Title and description required.");
    if (newTaskDeposit <= 0) return alert("Deposit amount must be greater than 0.");

    setCreating(true);
    try {
      // 1️⃣ Create task in Firestore
      const task = await createTask({
        title: newTaskTitle,
        description: newTaskDesc,
        category: newTaskCategory,
        creatorId: currentUserId,
        deposit: newTaskDeposit,
        status: "Open",
      });

      // 2️⃣ Deposit SOL/assets from user's wallet to task escrow/native wallet
      await depositToTaskEscrow({
        taskId: task.id,
        amount: newTaskDeposit,
        userPubkey: wallet.publicKey!.toBase58(),
      });

      // 3️⃣ Refresh tasks to update UI
      await refreshTasks();

      // Reset form
      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskCategory("Tech");
      setNewTaskDeposit(0);

      alert("Task created and deposit made!");
    } catch (err) {
      console.error("Failed to create task or deposit:", err);
      alert("Failed to create task or deposit. See console.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#fff", padding: "2rem" }}>
      <h1 style={{ marginBottom: "2rem" }}>Dashboard</h1>

      {/* Toggle Buttons */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <button
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            background: view === "giver" ? "#3b82f6" : "#1e293b",
            color: "#fff",
            fontWeight: 600,
          }}
          onClick={() => setView("giver")}
        >
          Task Giver View
        </button>
        <button
          style={{
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            background: view === "receiver" ? "#3b82f6" : "#1e293b",
            color: "#fff",
            fontWeight: 600,
          }}
          onClick={() => setView("receiver")}
        >
          Task Receiver View
        </button>
      </div>

      {view === "giver" && (
        <div style={{ marginBottom: "2rem", padding: "1rem", background: "#1e293b", borderRadius: 12 }}>
          <h3>Create New Task</h3>
          <input
            type="text"
            placeholder="Title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            style={{ width: "100%", marginBottom: 8, padding: 6, borderRadius: 6 }}
          />
          <textarea
            placeholder="Description"
            value={newTaskDesc}
            onChange={(e) => setNewTaskDesc(e.target.value)}
            style={{ width: "100%", marginBottom: 8, padding: 6, borderRadius: 6 }}
          />
          <select
            value={newTaskCategory}
            onChange={(e) => setNewTaskCategory(e.target.value)}
            style={{ width: "100%", marginBottom: 8, padding: 6, borderRadius: 6 }}
          >
            {["Legal", "Tech", "Construction", "Healthcare", "Design", "Marketing"].map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Deposit Amount (SOL)"
            value={newTaskDeposit}
            onChange={(e) => setNewTaskDeposit(Number(e.target.value))}
            style={{ width: "100%", marginBottom: 8, padding: 6, borderRadius: 6 }}
          />
          <button
            onClick={handleCreateTask}
            disabled={creating}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: 8,
              border: "none",
              background: "#10b981",
              color: "#fff",
              cursor: creating ? "not-allowed" : "pointer",
            }}
          >
            {creating ? "Creating..." : "Create Task & Deposit"}
          </button>
        </div>
      )}

      {/* Tasks List */}
      <div style={{ background: "#1e293b", borderRadius: "12px", padding: "1.5rem" }}>
        {view === "giver" ? (
          <>
            <h3>Tasks You Gave</h3>
            {giverTasks.length === 0 ? (
              <p>No tasks created yet.</p>
            ) : (
              <ul>
                {giverTasks.map((task) => (
                  <li key={task.id} style={{ marginBottom: "0.5rem" }}>
                    <Link to={`/task/${task.id}`} style={{ color: "#3b82f6" }}>
                      {task.title}
                    </Link>
                    {task.assignedTo && (
                      <button
                        onClick={() => navigate(`/task/${task.id}`)}
                        style={{
                          marginLeft: "1rem",
                          padding: "0.25rem 0.5rem",
                          borderRadius: 6,
                          background: "#3b82f6",
                          color: "#fff",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        View Active
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <h3>Tasks You Received</h3>
            {receiverTasks.length === 0 ? (
              <p>No accepted tasks yet.</p>
            ) : (
              <ul>
                {receiverTasks.map((task) => (
                  <li key={task.id} style={{ marginBottom: "0.5rem" }}>
                    {task.title}
                    <button
                      onClick={() => navigate(`/task/${task.id}`)}
                      style={{
                        marginLeft: "1rem",
                        padding: "0.25rem 0.5rem",
                        borderRadius: 6,
                        background: "#3b82f6",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Continue Task
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
