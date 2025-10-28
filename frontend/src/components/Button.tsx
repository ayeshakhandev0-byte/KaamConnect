import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export default function Button({ label, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        padding: "8px 16px",
        borderRadius: 6,
        backgroundColor: "#0f172a",
        color: "#fff",
        border: "none",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
