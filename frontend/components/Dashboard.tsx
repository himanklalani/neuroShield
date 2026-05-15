"use client";
import { useState, useEffect } from "react";
import { Hospital } from "@/app/page";
import Inference from "@/components/Inference";
import Training from "@/components/Training";
import axios from "axios";
import { API_BASE } from "@/lib/api";
import { Brain, Flask, Barbell, SignOut } from "@phosphor-icons/react";
import Dock from "@/components/ui/dock";
import { Activity, Cpu as LucideCpu, BookOpen, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface ModelInfo {
  model_type: string;
  num_folds: number;
  best_dice: number;
  roi_size: number[];
  device: string;
  training_round: number;
}

export default function Dashboard({ hospital, onLogout }: { hospital: Hospital; onLogout: () => void }) {
  const [tab, setTab] = useState<"inference" | "training">("inference");
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchModelInfo = async () => {
      try {
        const res = await axios.get(`${API_BASE}/model-info`);
        setModelInfo(res.data);
      } catch {}
    };
    fetchModelInfo();
    const iv = setInterval(fetchModelInfo, 30000);
    return () => clearInterval(iv);
  }, []);

  const tabs = [
    { id: "inference" as const, label: "Patient Inference", Icon: Flask },
    { id: "training"  as const, label: "Federated Training", Icon: Barbell },
  ];

  const dockItems = [
    { icon: Activity, label: "Patient Inference", onClick: () => setTab("inference") },
    { icon: LucideCpu, label: "Federated Training", onClick: () => setTab("training") },
    { icon: BookOpen, label: "Brain Tumors & AI", onClick: () => router.push("/info") },
    { icon: LogOut, label: "Logout Session", onClick: onLogout },
  ];

  return (
    <div className="flex flex-col relative pb-28" style={{ minHeight: "100dvh", background: "var(--bg-primary)" }}>
      {/* ─── Top Bar ─────────────────────────────────────── */}
      <header
        style={{
          borderBottom: "1px solid var(--border-color)",
          background: "rgba(247, 246, 242, 0.85)",
          backdropFilter: "blur(16px)",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div className="flex items-center justify-between" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 32px", height: 56 }}>
          {/* Left */}
          <div className="flex items-center" style={{ gap: 10 }}>
            <Brain size={22} weight="duotone" color="var(--accent)" />
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>UWCP</span>

            {modelInfo && (
              <div className="hidden md:flex items-center" style={{ gap: 12, marginLeft: 16 }}>
                <span style={{ width: 1, height: 20, background: "var(--border-color)" }} />
                <div className="pill">
                  <span style={{ color: "var(--text-tertiary)", fontWeight: 500, fontSize: 12 }}>{modelInfo.model_type}</span>
                  <span style={{ color: "var(--border-hover)" }}>|</span>
                  <span className="font-mono" style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 12 }}>
                    Dice {modelInfo.best_dice.toFixed(3)}
                  </span>
                  <span style={{ color: "var(--border-hover)" }}>|</span>
                  <span className="flex items-center" style={{ gap: 4 }}>
                    <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)" }} />
                    <span className="font-mono" style={{ color: "var(--success)", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>
                      {modelInfo.device === "cuda" ? "GPU" : "CPU"}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center" style={{ gap: 10 }}>
            <div className="pill">
              <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
              <span className="hidden sm:inline" style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{hospital.name}</span>
            </div>
            <button onClick={onLogout} className="btn-secondary" style={{ padding: "6px 10px", fontSize: 12, gap: 4 }}>
              <SignOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Tabs ────────────────────────────────────────── */}
      <div style={{ borderBottom: "1px solid var(--border-color)" }}>
        <div className="flex" style={{ maxWidth: 1400, margin: "0 auto", padding: "0 32px", gap: 2 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center"
              style={{
                gap: 8, padding: "14px 20px",
                fontSize: 14, fontWeight: tab === t.id ? 600 : 500,
                color: tab === t.id ? "var(--text-primary)" : "var(--text-tertiary)",
                background: "transparent", border: "none",
                borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
                cursor: "pointer", transition: "all 0.15s ease",
                marginBottom: -1,
              }}
            >
              <t.Icon size={18} weight={tab === t.id ? "fill" : "regular"} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Content ─────────────────────────────────────── */}
      <main style={{ flex: 1, maxWidth: 1400, margin: "0 auto", width: "100%", padding: 32 }}>
        {tab === "inference"
          ? <Inference hospital={hospital} />
          : <Training hospital={hospital} />
        }
      </main>

      {/* ─── Persistent Bottom Dock Navigation ───────────── */}
      <Dock
        items={dockItems}
        className="fixed bottom-4 left-0 right-0 z-50 pointer-events-none"
      />
    </div>
  );
}