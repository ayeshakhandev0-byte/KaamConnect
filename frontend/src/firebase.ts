// src/firebase.ts (small tweak)
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyDaWDBFV2GONZ1A66miu6pkeTNH0F-AHo8",
  authDomain: "kaamconnectbased.firebaseapp.com",
  projectId: "kaamconnectbased",
  storageBucket: "kaamconnectbased.firebasestorage.app",
  messagingSenderId: "434582147159",
  appId: "1:434582147159:web:675f46b0a7b1ef05679312",
  measurementId: "G-B15ETPBF5V",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// explicitly use us-central1 so callable functions default to that region
export const functions = getFunctions(app, "us-central1");
