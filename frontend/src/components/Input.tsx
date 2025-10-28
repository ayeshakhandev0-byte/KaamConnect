import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export default function Input(props: InputProps) {
  return (
    <input
      {...props}
      style={{
        padding: 8,
        borderRadius: 6,
        border: "1px solid #ccc",
        width: "100%",
      }}
    />
  );
}
