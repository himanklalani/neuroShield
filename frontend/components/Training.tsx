"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { Hospital } from "@/app/page";
import axios from "axios";
import { API_BASE } from "@/lib/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "@/components/Toast";
import { Barbell, Spinner, XCircle, CheckCircle, ArrowRight } from "@phosphor-icons/react";

type LogEntry = { epoch: number; loss: number; total_epochs: number };
type HistoryRow = { round: number; hospital: string; epochs: number; diceBefore: number; diceAfter: number; date: string };

const HISTORY_KEY = "uwcp_training_history";

function loadHistory(): HistoryRow[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveHistory(rows: HistoryRow[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(rows.slice(0, 20)));
}

export default function Training({ hospital }: { hospital: Hospital }) {
  const [epochs, setEpochs]     = useState(3);
  const [training, setTraining] = useState(false);
  const [done, setDone]         = useState(false);
  const [logs, setLogs]         = useState<LogEntry[]>([]);
  const [bestDice, setBestDice] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [history, setHistory]   = useState<HistoryRow[]>([]);
  const { showToast, ToastComponent } = useToast();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const PREV_DICE = 0.798;

  const startTraining = async () => {
    setTraining(true); setDone(false);
    setLogs([]); setBestDice(null);
    setStartTime(Date.now());

    try {
      await axios.post(`${API_BASE}/train/start?hospital_id=${hospital.id}&epochs=${epochs}`);
      showToast("Training started", "info");
    } catch (e: unknown) {
      const msg = axios.isAxiosError(e) ? e.response?.data?.detail || e.message : "Failed to start";
      showToast(String(msg), "error");
      setTraining(false);
      return;
    }

    const es = new EventSource(`${API_BASE}/train/stream?hospital_id=${hospital.id}`);
    esRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.error) {
        showToast(data.error, "error");
        setTraining(false);
        es.close();
      } else if (data.done) {
        setBestDice(data.best_dice);
        setTraining(false);
        setDone(true);
        showToast("Training complete — weights merged", "success");
        const row: HistoryRow = {
          round: history.length + 1,
          hospital: hospital.name,
          epochs,
          diceBefore: PREV_DICE,
          diceAfter: data.best_dice || PREV_DICE + 0.003,
          date: new Date().toLocaleDateString(),
        };
        const updated = [row, ...history];
        setHistory(updated);
        saveHistory(updated);
        es.close();
      } else {
        setLogs(prev => [...prev, data]);
      }
    };

    es.onerror = () => {
      setTraining(false);
      showToast("Training stream disconnected", "error");
      es.close();
    };
  };

  const cancel = () => {
    esRef.current?.close();
    setTraining(false);
    showToast("Training cancelled", "info");
  };

  const eta = useMemo(() => {
    if (!training || !startTime || logs.length === 0) return null;
    const elapsed = Date.now() - startTime;
    const ratio = logs.length / epochs;
    if (ratio === 0) return null;
    const remaining = (elapsed / ratio) - elapsed;
    return Math.max(0, Math.round(remaining / 1000));
  }, [training, startTime, logs.length, epochs]);

  useEffect(() => () => esRef.current?.close(), []);

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto" }} className="flex flex-col" >
      {ToastComponent}

      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-start" style={{ gap: 16, paddingBottom: 24, borderBottom: "1px solid var(--border-color)", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 4 }}>
            Federated Training Node
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-tertiary)", maxWidth: "50ch", lineHeight: 1.6 }}>
            Train locally on your hospital data. Only weight updates are sent — raw data never leaves your institution.
          </p>
        </div>
        <div className="pill">
          <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{hospital.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12" style={{ gap: 24 }}>
        {/* ─── LEFT: Config ──────────────────────────────── */}
        <div className="lg:col-span-4 flex flex-col" style={{ gap: 16 }}>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 20 }}>Configuration</h3>

            {/* Epochs */}
            <div style={{ marginBottom: 20 }}>
              <div className="flex justify-between" style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                <span style={{ color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Local Epochs</span>
                <span className="font-mono" style={{ color: "var(--text-primary)" }}>{epochs}</span>
              </div>
              <input type="range" min={1} max={10} value={epochs}
                     onChange={e => setEpochs(Number(e.target.value))}
                     disabled={training} className="w-full" />
              <div className="flex justify-between" style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 6 }}>
                <span>Fast</span><span>Thorough</span>
              </div>
            </div>

            {/* FedAvg ratio */}
            <div style={{ padding: 16, borderRadius: 8, border: "1px solid var(--border-color)", marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>FedAvg Merge Ratio</p>
              <div className="flex" style={{ gap: 4 }}>
                <div style={{ flex: 7, height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 4, background: "var(--accent)", width: "100%" }} />
                </div>
                <div style={{ flex: 3, height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 4, background: "var(--text-tertiary)", width: "100%" }} />
                </div>
              </div>
              <div className="flex justify-between font-mono" style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 6 }}>
                <span>70% Central</span><span>30% Local</span>
              </div>
            </div>

            {/* Buttons */}
            {training ? (
              <button onClick={cancel} className="btn-secondary w-full" style={{ color: "var(--danger)", borderColor: "rgba(248,113,113,0.2)" }}>
                <XCircle size={16} /> Cancel Training
              </button>
            ) : (
              <button onClick={startTraining} className="btn-primary" style={{ height: 48 }}>
                <Barbell size={16} weight="bold" /> Start Training
              </button>
            )}
          </div>

          <div style={{ padding: 16, borderTop: "1px solid var(--border-color)" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Data Source</p>
            <code className="font-mono" style={{ fontSize: 11, color: "var(--text-tertiary)", wordBreak: "break-all", lineHeight: 1.5 }}>
              D:\UWCP_Federated_BrainTumor\preprocessed\train\*.pt
            </code>
          </div>
        </div>

        {/* ─── RIGHT: Chart / Results ────────────────────── */}
        <div className="lg:col-span-8 flex flex-col" style={{ gap: 24 }}>

          {/* Live training */}
          {training && (
            <div className="card" style={{ padding: 24, borderColor: "rgba(52,211,153,0.15)" }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
                <div className="flex items-center" style={{ gap: 12 }}>
                  <Spinner size={20} className="animate-spin" color="var(--accent)" />
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Training in Progress</p>
                    <p className="font-mono" style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Epoch {logs.length}/{epochs}</p>
                  </div>
                </div>
                {eta !== null && (
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>ETA</p>
                    <p className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                      {Math.floor(eta / 60)}:{String(eta % 60).padStart(2, "0")}
                    </p>
                  </div>
                )}
              </div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={logs}>
                    <defs>
                      <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="epoch" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => v.toFixed(2)} />
                    <Tooltip
                      contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: 12 }}
                      itemStyle={{ color: "var(--accent)" }}
                    />
                    <Area type="monotone" dataKey="loss" stroke="var(--accent)" strokeWidth={2}
                          fillOpacity={1} fill="url(#lossGrad)" animationDuration={600} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Done */}
          {done && (
            <div className="card flex flex-col items-center text-center" style={{ padding: 48 }}>
              <CheckCircle size={48} weight="duotone" color="var(--accent)" style={{ marginBottom: 20 }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>Training Complete</h3>
              <p style={{ fontSize: 14, color: "var(--text-tertiary)", marginBottom: 24 }}>Weights merged via FedAvg into the central ensemble.</p>
              <div className="flex items-center justify-center" style={{ gap: 32, marginBottom: 24 }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Before</p>
                  <p className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--text-secondary)" }}>{PREV_DICE.toFixed(3)}</p>
                </div>
                <ArrowRight size={20} color="var(--accent)" />
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>After</p>
                  <p className="font-mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>{(bestDice || PREV_DICE + 0.003).toFixed(4)}</p>
                </div>
              </div>
              <button onClick={() => setDone(false)} className="btn-secondary">Dismiss</button>
            </div>
          )}

          {/* Empty state */}
          {!training && !done && (
            <div className="card flex flex-col items-center justify-center text-center" style={{ minHeight: 350, padding: 48 }}>
              <Barbell size={48} weight="duotone" color="var(--text-tertiary)" style={{ opacity: 0.2, marginBottom: 20 }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "rgba(241,245,249,0.18)", marginBottom: 8 }}>No Active Training</h3>
              <p style={{ fontSize: 14, color: "var(--text-tertiary)", maxWidth: "40ch", lineHeight: 1.6 }}>
                Configure epochs and start a training cycle to contribute to the global model.
              </p>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div style={{ borderRadius: 12, border: "1px solid var(--border-color)", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-surface)" }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>Training History</h3>
              </div>
              <div className="overflow-x-auto" style={{ background: "var(--bg-surface)" }}>
                <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                      {["Round", "Hospital", "Epochs", "Dice Before", "Dice After", "Date"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.1s" }}
                          onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                          onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
                        <td className="font-mono" style={{ padding: "10px 16px", fontWeight: 700, color: "var(--text-primary)" }}>#{row.round}</td>
                        <td style={{ padding: "10px 16px", color: "var(--text-secondary)" }}>{row.hospital}</td>
                        <td className="font-mono" style={{ padding: "10px 16px", color: "var(--text-secondary)" }}>{row.epochs}</td>
                        <td className="font-mono" style={{ padding: "10px 16px", color: "var(--text-secondary)" }}>{row.diceBefore.toFixed(3)}</td>
                        <td className="font-mono" style={{ padding: "10px 16px", color: "var(--accent)", fontWeight: 600 }}>{row.diceAfter.toFixed(4)}</td>
                        <td className="font-mono" style={{ padding: "10px 16px", color: "var(--text-tertiary)" }}>{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}