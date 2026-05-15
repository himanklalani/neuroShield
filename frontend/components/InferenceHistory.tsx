"use client";
import { useEffect, useState } from "react";
import { ClockCounterClockwise, MagnifyingGlass } from "@phosphor-icons/react";

export interface HistoryItem {
  id: string;
  patientId: string;
  referringDoc?: string;
  timestamp: number;
  volumes: { NCR: number; ED: number; ET: number; total: number };
  result?: {
    slice_pngs: { axial: string[]; coronal: string[]; sagittal: string[] };
    shape: number[];
  };
}

// 1x1 standard PNG base64 string for lightweight demonstration rendering support
const DEMO_SLICE = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const DEMO_SLICES = {
  axial: Array(10).fill(DEMO_SLICE),
  coronal: Array(10).fill(DEMO_SLICE),
  sagittal: Array(10).fill(DEMO_SLICE),
};

const INITIAL_CASES: HistoryItem[] = [
  {
    id: "case-1",
    patientId: "BraTS_2026_089",
    referringDoc: "Dr. Aris Thorne",
    timestamp: Date.now() - 3600000 * 3, // 3h ago
    volumes: { NCR: 12.4, ED: 45.2, ET: 28.1, total: 85.7 },
    result: { slice_pngs: DEMO_SLICES, shape: [240, 240, 155] },
  },
  {
    id: "case-2",
    patientId: "UWCP_GLIOMA_412",
    referringDoc: "Dr. Elena Rostova",
    timestamp: Date.now() - 86400000 * 2, // 2d ago
    volumes: { NCR: 4.1, ED: 18.5, ET: 11.2, total: 33.8 },
    result: { slice_pngs: DEMO_SLICES, shape: [240, 240, 155] },
  },
];

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function InferenceHistory({ onSelect }: { onSelect?: (item: HistoryItem) => void }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadHistory = () => {
      try {
        const saved = localStorage.getItem("uwcp_history");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.length > 0) {
            setHistory(parsed);
            return;
          }
        }
        // Prefill premium demonstration records if blank
        localStorage.setItem("uwcp_history", JSON.stringify(INITIAL_CASES));
        setHistory(INITIAL_CASES);
      } catch {}
    };

    loadHistory();
    window.addEventListener("uwcp_history_updated", loadHistory);
    return () => window.removeEventListener("uwcp_history_updated", loadHistory);
  }, []);

  const filtered = history.filter(item => {
    if (!search) return true;
    const q = search.toLowerCase();
    const matchId = item.patientId.toLowerCase().includes(q);
    const matchDoc = item.referringDoc?.toLowerCase().includes(q);
    return matchId || matchDoc;
  });

  if (history.length === 0) return null;

  return (
    <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 20 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <h3 className="flex items-center" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", gap: 6 }}>
          <ClockCounterClockwise size={14} color="var(--text-tertiary)" />
          Recent Cases
        </h3>
        <span className="font-mono" style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
          {filtered.length} stored
        </span>
      </div>

      {/* ─── Fully Functional Live Search Bar ─────────────── */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search patient or doc..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field"
          style={{ padding: "8px 12px 8px 32px", minHeight: 36, fontSize: 13 }}
        />
        <MagnifyingGlass
          size={14}
          color="var(--text-tertiary)"
          style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        />
      </div>

      {/* ─── Case List ───────────────────────────────────── */}
      <div className="flex flex-col" style={{ gap: 8, maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
        {filtered.map(item => (
          <button
            key={item.id}
            onClick={() => onSelect?.(item)}
            className="w-full text-left card"
            style={{
              padding: "12px 14px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.01)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div className="flex justify-between items-center w-full">
              <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                {item.patientId}
              </span>
              <span className="font-mono" style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                {timeAgo(item.timestamp)}
              </span>
            </div>

            {item.referringDoc && (
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Doc: <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{item.referringDoc}</span>
              </div>
            )}

            <div className="flex items-center justify-between" style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>
              <span>Volumetric sum:</span>
              <span className="font-mono" style={{ color: "var(--accent)", fontWeight: 700 }}>
                {item.volumes.total.toFixed(1)} cm³
              </span>
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", textAlign: "center", padding: "16px 0" }}>
            No matching cases found.
          </p>
        )}
      </div>
    </div>
  );
}

export function saveToHistory(item: HistoryItem) {
  let history: HistoryItem[] = [];
  try {
    const saved = localStorage.getItem("uwcp_history");
    if (saved) history = JSON.parse(saved);
  } catch {}
  history = [item, ...history.filter(h => h.id !== item.id)].slice(0, 15);
  localStorage.setItem("uwcp_history", JSON.stringify(history));
  window.dispatchEvent(new Event("uwcp_history_updated"));
}
