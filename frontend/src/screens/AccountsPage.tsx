// src/screens/AccountsPage.tsx
import React, { useState } from "react";

export default function AccountsPage() {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [phone, setPhone] = useState("+92 300 0000000");
  const [kycStatus, setKycStatus] = useState("Not Verified"); // placeholder
  const [reputation, setReputation] = useState(4.5); // out of 5

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#fff", fontFamily: "sans-serif", padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>Account Details</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem" }}>
        {/* Profile Info */}
        <div style={{ flex: "1 1 350px", background: "rgba(30,41,59,0.95)", padding: "2rem", borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.4)" }}>
          <h2 style={{ marginBottom: "1rem" }}>Profile</h2>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", marginBottom: "1rem", background: "rgba(15,23,42,0.6)", color: "#fff" }}
          />

          <label style={{ display: "block", marginBottom: "0.5rem" }}>Email</label>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", marginBottom: "1rem", background: "rgba(15,23,42,0.6)", color: "#fff" }}
          />

          <label style={{ display: "block", marginBottom: "0.5rem" }}>Phone</label>
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            style={{ width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", marginBottom: "1.5rem", background: "rgba(15,23,42,0.6)", color: "#fff" }}
          />

          <button
            style={{
              padding: "0.75rem 2rem",
              borderRadius: 10,
              border: "none",
              background: "#3b82f6",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#2563eb"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#3b82f6"; }}
          >
            Save Changes
          </button>
        </div>

        {/* KYC & Reputation */}
        <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* KYC Status */}
          <div style={{ background: "rgba(30,41,59,0.95)", padding: "1.5rem", borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.4)" }}>
            <h2 style={{ marginBottom: "1rem" }}>KYC Verification</h2>
            <p>Status: <strong>{kycStatus}</strong></p>
            <button
              style={{
                marginTop: "1rem",
                padding: "0.75rem 2rem",
                borderRadius: 10,
                border: "none",
                background: "#10b981",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onClick={() => setKycStatus("Pending")}
              onMouseEnter={e => { e.currentTarget.style.background = "#059669"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#10b981"; }}
            >
              Start Verification
            </button>
          </div>

          {/* Reputation */}
          <div style={{ background: "rgba(30,41,59,0.95)", padding: "1.5rem", borderRadius: 12, boxShadow: "0 6px 20px rgba(0,0,0,0.4)" }}>
            <h2 style={{ marginBottom: "1rem" }}>Reputation</h2>
            <p>Average Rating: <strong>{reputation} / 5</strong></p>
            <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.5rem" }}>
              {[...Array(5)].map((_, i) => (
                <span key={i} style={{ color: i < Math.floor(reputation) ? "#facc15" : "#64748b", fontSize: "1.25rem" }}>★</span>
              ))}
            </div>
            <p style={{ marginTop: "0.5rem", color: "#94a3b8" }}>Your reputation is based on completed tasks and client reviews.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
