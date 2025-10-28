// src/screens/CreateTask.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useTasks } from "../contexts/TasksContext";

export default function CreateTaskPage() {
  const wallet = useWallet();
  const navigate = useNavigate();
  const { addTask } = useTasks();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [deadline, setDeadline] = useState(""); // ISO date string input
  const [saving, setSaving] = useState(false);

  const currentUserId = wallet.publicKey?.toBase58();

  const handleCreate = async () => {
    if (!currentUserId) {
      alert("Connect wallet first.");
      return;
    }
    if (!title.trim()) {
      alert("Enter a title.");
      return;
    }
    try {
      setSaving(true);
      const id = await addTask({
        title,
        description,
        category,
        deadline: deadline ? new Date(deadline) : null,
        creatorId: currentUserId,
      });
      // go to dashboard or the task page
      navigate(`/task/${id}`);
    } catch (err: any) {
      console.error("create task error", err);
      alert("Failed to create task: " + (err?.message ?? String(err)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#fff", padding: "2rem" }}>
      <h1>Create Task</h1>

      <div style={{ maxWidth: 720, marginTop: 12 }}>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #333", background: "#071029", color: "#fff" }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the task" rows={5} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #333", background: "#071029", color: "#fff" }} />
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", marginBottom: 6 }}>Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #333", background: "#071029", color: "#fff" }} />
          </div>

          <div style={{ width: 220 }}>
            <label style={{ display: "block", marginBottom: 6 }}>Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #333", background: "#071029", color: "#fff" }} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleCreate} disabled={saving} style={{ padding: "0.6rem 1rem", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", cursor: "pointer" }}>
            {saving ? "Creating..." : "Create Task"}
          </button>

          <button onClick={() => navigate(-1)} style={{ padding: "0.6rem 1rem", borderRadius: 8, border: "none", background: "#374151", color: "#fff", cursor: "pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
