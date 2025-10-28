import React from "react";
import { Review } from "../types";
import { calculateReputation } from "../utils/reputation";

export default function ReputationCircle({ reviews }: { reviews: Review[] }) {
  const { color } = calculateReputation(reviews);
  return (
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: "50%",
        backgroundColor: color,
        border: "2px solid #fff",
      }}
      title={`Reputation: ${color}`}
    />
  );
}
