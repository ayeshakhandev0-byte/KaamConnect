// src/screens/ExplorePage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTasks, Task } from "../contexts/TasksContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuthInit } from "../hooks/useAuthInit";
import { acceptTask } from "../utils/taskActions";

export default function ExplorePage() {
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const wallet = useWallet();
  const { user } = useAuthInit(); // returns { user, loading, ... }

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

  // prefer authenticated uid, fallback to wallet pubkey
  const currentUserId = user?.uid ?? wallet.publicKey?.toBase58() ?? "";

  // debug: check tasks & user
  useEffect(() => {
    console.debug("ExplorePage tasks:", tasks);
    console.debug("ExplorePage currentUserId:", currentUserId);
  }, [tasks, currentUserId]);

  const categories = ["All", "Legal", "Tech", "Construction", "Healthcare", "Design", "Marketing"];

  // normalize status for consistent comparisons
  const normalizedTasks = tasks.map((t) => ({
    ...t,
    statusNormalized: (t.status || "").toString().toLowerCase(),
  }));

  const filteredTasks = normalizedTasks.filter(
    (t) =>
      (category === "All" || t.category === category) &&
      (t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description || "").toLowerCase().includes(search.toLowerCase()))
  );

  const handleAccept = async (taskId: string) => {
    if (!currentUserId) {
      alert("You must be signed in to accept tasks.");
      return;
    }
    setLoadingTaskId(taskId);
    try {
      await acceptTask(taskId, currentUserId);
      alert("Task accepted!");
    } catch (err) {
      console.error("acceptTask error:", err);
      alert("Failed to accept task. See console.");
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleApply = async (task: Task) => {
    if (!wallet.publicKey && !user?.uid) {
      alert("Please connect a wallet or sign in to apply.");
      return;
    }
    setLoadingTaskId(task.id);
    try {
      await acceptTask(task.id, currentUserId);
      setSelectedTask(null);
    } catch (err) {
      console.error("Failed to accept task", err);
      alert("Failed to accept task. See console.");
    } finally {
      setLoadingTaskId(null);
    }
  };

  const formatDeadline = (d?: any) => {
    if (!d) return "N/A";
    try {
      return d.toDate ? d.toDate().toLocaleDateString() : new Date(d).toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#fff", padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Explore Tasks</h1>

      {/* Search & Filter */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          style={{
            flex: 1,
            minWidth: "250px",
            padding: "0.75rem 1rem",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(15,23,42,0.6)",
            color: "#fff",
            outline: "none",
          }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            padding: "0.75rem 1rem",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(15,23,42,0.6)",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Tasks Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            onClick={() => setSelectedTask(task)}
            style={{
              background: "rgba(30,41,59,0.95)",
              padding: "1.5rem",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-5px)";
              e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)";
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 6 }}>{task.title}</h3>
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
              Creator: {task.creatorId} · Deadline: {formatDeadline(task.deadline)}
            </p>
            <p style={{ marginTop: "0.5rem", fontSize: 14, color: "#cbd5e1" }}>{task.description}</p>

            {/* Accept Task button */}
            {task.statusNormalized === "open" && (
              <div style={{ marginTop: "0.75rem" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAccept(task.id);
                  }}
                  disabled={loadingTaskId === task.id}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: 8,
                    border: "none",
                    background: "#2563eb",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  {loadingTaskId === task.id ? "Accepting..." : "Accept Task"}
                </button>
              </div>
            )}
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <p style={{ gridColumn: "1/-1", textAlign: "center", color: "#f87171" }}>No tasks found.</p>
        )}
      </div>

      {/* Modal */}
      {selectedTask && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setSelectedTask(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1e293b",
              borderRadius: 12,
              padding: "2rem",
              width: "400px",
              maxWidth: "90%",
            }}
          >
            <h2 style={{ marginTop: 0 }}>{selectedTask.title}</h2>
            <p>{selectedTask.description}</p>
            <p>Status: {selectedTask.status}</p>
            <p>Deadline: {formatDeadline(selectedTask.deadline)}</p>

            {/* Apply button */}
            {selectedTask.statusNormalized === "open" && selectedTask.creatorId !== currentUserId && (
              <button
                onClick={() => handleApply(selectedTask)}
                disabled={loadingTaskId === selectedTask.id}
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem 1.5rem",
                  borderRadius: 8,
                  border: "none",
                  background: "#3b82f6",
                  color: "#fff",
                  cursor: loadingTaskId === selectedTask.id ? "not-allowed" : "pointer",
                }}
              >
                {loadingTaskId === selectedTask.id ? "Applying..." : "Apply / Start Task"}
              </button>
            )}

            {/* Continue button */}
            {selectedTask.statusNormalized === "accepted" && selectedTask.assignedTo === currentUserId && (
              <button
                onClick={() => navigate(`/task/${selectedTask.id}`)}
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem 1.5rem",
                  borderRadius: 8,
                  border: "none",
                  background: "#10b981",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Continue Task
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
