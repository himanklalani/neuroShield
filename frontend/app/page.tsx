"use client";
import { useState } from "react";
import Login from "@/components/Login";
import Dashboard from "@/components/Dashboard";

export type Hospital = {
  id: string;
  name: string;
  color: string;
};

export default function Home() {
  const [hospital, setHospital] = useState<Hospital | null>(null);

  if (!hospital) {
    return <Login onLogin={setHospital} />;
  }
  return <Dashboard hospital={hospital} onLogout={() => setHospital(null)} />;
}