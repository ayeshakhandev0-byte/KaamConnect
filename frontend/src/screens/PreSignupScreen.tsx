// src/screens/PreSignupScreen.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PreSignupScreen() {
  const [selected, setSelected] = useState<"diaspora" | "national" | null>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!selected) return;
    // Navigate to Signup page with state indicating choice
    navigate("/signup", { state: { type: selected } });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "2rem", textAlign: "center" }}>
        Welcome! Choose your path
      </h1>

      <div
        style={{
          display: "flex",
          gap: "2rem",
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: "2rem",
        }}
      >
        {["diaspora", "national"].map((type) => (
          <div
            key={type}
            onClick={() => setSelected(type as "diaspora" | "national")}
            style={{
              cursor: "pointer",
              padding: "2rem 3rem",
              borderRadius: "16px",
              border: selected === type ? "3px solid #3b82f6" : "2px solid rgba(255,255,255,0.2)",
              background: "rgba(30,41,59,0.85)",
              minWidth: "180px",
              textAlign: "center",
              transition: "all 0.3s ease",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem", textTransform: "capitalize" }}>
              {type}
            </h2>
            <p style={{ color: "#cbd5e1" }}>
              {type === "diaspora"
                ? "Access local talent from abroad"
                : "Hire or work locally across Pakistan"}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={handleContinue}
        disabled={!selected}
        style={{
          padding: "1rem 2.5rem",
          borderRadius: "12px",
          background: selected ? "#3b82f6" : "rgba(59,130,246,0.5)",
          color: "#fff",
          border: "none",
          fontWeight: 600,
          fontSize: "1.1rem",
          cursor: selected ? "pointer" : "not-allowed",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          if (selected) {
            e.currentTarget.style.background = "#2563eb";
            e.currentTarget.style.transform = "translateY(-2px)";
          }
        }}
        onMouseLeave={(e) => {
          if (selected) {
            e.currentTarget.style.background = "#3b82f6";
            e.currentTarget.style.transform = "translateY(0)";
          }
        }}
      >
        Continue
      </button>
    </div>
  );
}
