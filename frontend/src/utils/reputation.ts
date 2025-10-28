import { Review } from "../types";

export function calculateReputation(reviews: Review[]) {
  if (!reviews || reviews.length === 0) return { score: 0, color: "gray" };
  const positive = reviews.filter(r => r.positive).length;
  const negative = reviews.filter(r => !r.positive).length;
  const score = positive / reviews.length;

  let color = "gray"; // default
  if (score >= 0.7) color = "green";
  else if (score <= 0.3) color = "red";

  return { score, color };
}
