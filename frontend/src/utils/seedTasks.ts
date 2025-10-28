// src/utils/seedTasks.ts
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; // make sure the path points to your initialized Firebase

async function seedTasks() {
  const demoTasks = [
    {
      title: "Design Landing Page for Web3 Startup",
      description: "Create a modern, responsive landing page using Tailwind and Next.js.",
      category: "Design",
      creatorId: "demo_creator_1",
      status: "open",
      deposit: 0.5,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      title: "Smart Contract Audit",
      description: "Perform a quick security audit for a Solana escrow contract.",
      category: "Tech",
      creatorId: "demo_creator_2",
      status: "open",
      deposit: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      title: "Write Blog Article on DeFi Trends",
      description: "Research and write a 1500-word article on current DeFi market insights.",
      category: "Marketing",
      creatorId: "demo_creator_3",
      status: "open",
      deposit: 0.3,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  ];

  for (const t of demoTasks) {
    const ref = await addDoc(collection(db, "tasks"), t);
    console.log("Seeded task:", ref.id);
  }
  console.log("✅ All tasks seeded!");
}

seedTasks().catch(console.error);
