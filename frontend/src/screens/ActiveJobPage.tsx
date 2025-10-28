// src/screens/ActiveJobPage.tsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, collection, onSnapshot, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useTasks } from "../contexts/TasksContext";

export default function ActiveJobPage() {
  const { id } = useParams<{ id: string }>();
  const { currentUserId } = useTasks();

  const [task, setTask] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Subscribe to task document
  useEffect(() => {
    if (!id) return;
    const taskRef = doc(db, "task", id);
    const unsubscribe = onSnapshot(taskRef, (snapshot) => {
      if (snapshot.exists()) {
        setTask({ id: snapshot.id, ...snapshot.data() });
      } else {
        setTask(null);
      }
    });
    return unsubscribe;
  }, [id]);

  // Subscribe to messages
  useEffect(() => {
    if (!id) return;
    const messagesRef = collection(db, "task", id, "messages");
    const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
      const msgs: any[] = [];
      snapshot.forEach((doc) => msgs.push({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
    return unsubscribe;
  }, [id]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    const messagesRef = collection(db, "task", id!, "messages");
    await addDoc(messagesRef, {
      senderId: currentUserId,
      content: newMessage.trim(),
      createdAt: serverTimestamp(),
    });

    // Update task's updatedAt
    const taskRef = doc(db, "task", id!);
    await updateDoc(taskRef, { updatedAt: serverTimestamp() });

    setNewMessage("");
  };

  if (!currentUserId) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", color: "#fff", padding: "2rem" }}>
        <h3>Please login to view task details.</h3>
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", color: "#fff", padding: "2rem" }}>
        <h3>Task not found.</h3>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#fff", padding: "2rem" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>{task.title}</h1>

      {/* Task Details */}
      <section style={{ background: "#1e293b", borderRadius: "12px", padding: "1.5rem", marginBottom: "2rem" }}>
        <h2 style={{ marginBottom: "0.5rem" }}>Task Details</h2>
        <p><strong>Description:</strong> {task.description}</p>
        <p><strong>Status:</strong> {task.status}</p>
        <p><strong>Deadline:</strong> {task.deadline?.toDate ? task.deadline.toDate().toDateString() : task.deadline}</p>
        <p><strong>Category:</strong> {task.category}</p>
        <p><strong>Creator:</strong> {task.creatorId}</p>
      </section>

      {/* Chat Section */}
      <section style={{ background: "#1e293b", borderRadius: "12px", padding: "1.5rem" }}>
        <h2 style={{ marginBottom: "0.5rem" }}>Updates & Chat</h2>

        <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "1rem", padding: "0.5rem", background: "#0f172a", borderRadius: "8px" }}>
          {messages.length === 0 && <p style={{ color: "#94a3b8" }}>No messages yet...</p>}
          {messages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: "0.5rem" }}>
              <span style={{ fontWeight: 600, color: msg.senderId === currentUserId ? "#3b82f6" : "#10b981" }}>
                {msg.senderId === currentUserId ? "You:" : msg.senderId} 
              </span> {msg.content}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message or update..."
            style={{
              flex: 1,
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid #64748b",
              outline: "none",
              background: "#0f172a",
              color: "#fff",
            }}
          />
          <button
            onClick={sendMessage}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              border: "none",
              background: "#3b82f6",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Send
          </button>
        </div>
      </section>
    </div>
  );
}
