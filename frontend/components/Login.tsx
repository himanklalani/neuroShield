"use client";
import { useState, useEffect } from "react";
import { Hospital } from "@/app/page";
import { Brain, Buildings, Hospital as HospitalIcon, FirstAid, ArrowRight, ShieldCheck } from "@phosphor-icons/react";

const HOSPITALS = [
  { id: "H001", name: "Apollo Hospital Mumbai",   password: "apollo123",  city: "Mumbai",    Icon: HospitalIcon },
  { id: "H002", name: "AIIMS New Delhi",           password: "aiims123",   city: "Delhi",     Icon: Buildings },
  { id: "H003", name: "Fortis Hospital Bangalore", password: "fortis123",  city: "Bangalore", Icon: FirstAid },
];

export default function Login({ onLogin }: { onLogin: (h: Hospital) => void }) {
  const [selected, setSelected] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handle = () => {
    const hosp = HOSPITALS.find(h => h.id === selected);
    if (!hosp) { setError("Select an institution first"); return; }
    if (hosp.password !== password) {
      setError("Authentication failed");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      onLogin({ id: hosp.id, name: hosp.name, color: "#34d399" });
    }, 500);
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: "100dvh", background: "var(--bg-primary)" }}>
      <div
        className={`w-full transition-all duration-500 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}
        style={{ maxWidth: 480, padding: "0 24px" }}
      >
        <div className="card" style={{ padding: 48 }}>
          {/* Header */}
          <div className="flex flex-col items-center" style={{ marginBottom: 32 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 64, height: 64, borderRadius: 16,
                background: "var(--accent-muted)",
                border: "1px solid rgba(52, 211, 153, 0.15)",
                marginBottom: 24,
              }}
            >
              <Brain size={32} weight="duotone" color="var(--accent)" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
              UWCP System
            </h1>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-tertiary)", marginTop: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Federated Brain Tumor Segmentation
            </p>
          </div>

          {/* Institution List */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Select Institution
            </label>
            <div className="flex flex-col" style={{ gap: 6 }}>
              {HOSPITALS.map(h => {
                const active = selected === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => { setSelected(h.id); setError(""); }}
                    className="flex items-center text-left w-full"
                    style={{
                      height: 68,
                      padding: "0 16px",
                      borderRadius: 8,
                      border: active ? "1px solid rgba(52,211,153,0.25)" : "1px solid var(--border-color)",
                      background: active ? "var(--accent-muted)" : "transparent",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      gap: 14,
                    }}
                  >
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 40, height: 40, borderRadius: 8,
                        background: active ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.03)",
                      }}
                    >
                      <h.Icon size={20} weight={active ? "fill" : "regular"} color={active ? "var(--accent)" : "var(--text-tertiary)"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 14, fontWeight: 600, color: active ? "var(--text-primary)" : "var(--text-secondary)" }}>
                        {h.name}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 1 }}>{h.city}</p>
                    </div>
                    <div
                      style={{
                        width: 16, height: 16, borderRadius: "50%",
                        border: active ? "none" : "2px solid var(--text-tertiary)",
                        background: active ? "var(--accent)" : "transparent",
                        transition: "all 0.15s ease",
                        flexShrink: 0,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Security Passphrase
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handle()}
              placeholder="Enter institutional key"
              className="input-field"
              style={{ height: 48 }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              className="animate-shake"
              style={{
                marginBottom: 24, padding: "10px 16px", borderRadius: 8,
                background: "rgba(248, 113, 113, 0.08)",
                border: "1px solid rgba(248, 113, 113, 0.18)",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--danger)" }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button onClick={handle} disabled={loading} className="btn-primary" style={{ height: 48, fontSize: 14 }}>
            {loading ? (
              <span className="animate-spin inline-block" style={{ width: 16, height: 16, border: "2px solid rgba(12,18,32,0.3)", borderTopColor: "var(--bg-primary)", borderRadius: "50%" }} />
            ) : (
              <ArrowRight size={16} weight="bold" />
            )}
            {loading ? "Connecting..." : "Initialize Connection"}
          </button>

          {/* Credentials hint */}
          <div
            style={{
              marginTop: 32, padding: 16, borderRadius: 8,
              borderTop: "1px solid var(--border-color)",
            }}
          >
            <div className="flex items-center" style={{ gap: 6, marginBottom: 8 }}>
              <ShieldCheck size={14} color="var(--text-tertiary)" />
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Test Credentials
              </p>
            </div>
            <div className="flex flex-wrap font-mono" style={{ gap: "6px 20px", fontSize: 12 }}>
              {HOSPITALS.map(h => (
                <span key={h.id} style={{ color: "var(--text-tertiary)" }}>
                  {h.city}:{" "}
                  <span style={{ color: "var(--text-secondary)" }}>{h.password}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Secure Medical AI Protocol v2.5
        </p>
      </div>
    </div>
  );
}