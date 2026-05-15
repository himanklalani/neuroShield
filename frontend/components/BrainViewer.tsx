"use client";
import { useState, useEffect, useCallback } from "react";
import { Minus, Plus, ArrowsOut, ArrowsIn, DownloadSimple, Eye, EyeSlash } from "@phosphor-icons/react";

type Props = {
  slices: {
    axial: string[];
    coronal: string[];
    sagittal: string[];
  };
};

export default function BrainViewer({ slices }: Props) {
  const [view, setView]       = useState<"axial"|"coronal"|"sagittal">("axial");
  const [idx, setIdx]         = useState(Math.floor(slices.axial.length / 2));
  const [overlay, setOverlay] = useState(true);
  const [zoom, setZoom]       = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast]     = useState(100);

  const current = slices[view];
  const max     = current.length - 1;

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowLeft")       setIdx(i => Math.max(0, i - 1));
    if (e.key === "ArrowRight")      setIdx(i => Math.min(max, i + 1));
    if (e.key.toLowerCase() === "v") setOverlay(o => !o);
    if (e.key === "Escape")          setFullscreen(false);
  }, [max]);

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  const downloadSlice = () => {
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${current[idx]}`;
    a.download = `${view}_slice_${idx + 1}.png`;
    a.click();
  };

  const VIEWS = ["axial", "coronal", "sagittal"] as const;
  const LEGEND = [
    { label: "NCR", color: "#f87171", desc: "Necrotic Core" },
    { label: "ED",  color: "#fbbf24", desc: "Edema" },
    { label: "ET",  color: "#34d399", desc: "Enhancing" },
  ];

  return (
    <div className={`flex flex-col ${fullscreen ? "fixed inset-0 z-50 p-6" : "h-full"}`} style={{ background: fullscreen ? "var(--bg-primary)" : undefined }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Multi-Planar Viewer</h2>
          <p className="font-mono" style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
            Arrow keys: navigate | V: toggle overlay | ESC: exit
          </p>
        </div>
        <div className="flex items-center" style={{ gap: 4 }}>
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="btn-secondary" style={{ width: 32, height: 32, padding: 0 }}>
            <Minus size={14} />
          </button>
          <span className="font-mono" style={{ fontSize: 12, color: "var(--text-tertiary)", width: 40, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="btn-secondary" style={{ width: 32, height: 32, padding: 0 }}>
            <Plus size={14} />
          </button>
          <span style={{ width: 1, height: 20, background: "var(--border-color)", margin: "0 4px" }} />
          <button onClick={() => setFullscreen(!fullscreen)} className="btn-secondary" style={{ width: 32, height: 32, padding: 0 }}>
            {fullscreen ? <ArrowsIn size={14} /> : <ArrowsOut size={14} />}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_72px]" style={{ gap: 12 }}>
        <div className="flex flex-col" style={{ gap: 12 }}>
          {/* Image */}
          <div className="relative flex-1 overflow-hidden" style={{ background: "#080e18", borderRadius: 8, border: "1px solid var(--border-color)", minHeight: 350 }}>
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <img
                src={`data:image/png;base64,${current[idx]}`}
                alt={`${view} slice ${idx + 1}`}
                style={{
                  maxWidth: "100%", maxHeight: "100%", objectFit: "contain",
                  transform: `scale(${zoom})`,
                  filter: `brightness(${brightness}%) contrast(${contrast}%) ${overlay ? "" : "grayscale(100%)"}`,
                  transition: "transform 0.15s ease",
                }}
              />
            </div>

            {/* HUD */}
            <div className="absolute font-mono" style={{ top: 8, left: 8, padding: "4px 10px", borderRadius: 6, background: "rgba(0,0,0,0.7)", fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase" }}>
              {view} | {idx + 1}/{max + 1}
            </div>

            <div className="absolute flex" style={{ top: 8, right: 8, gap: 4 }}>
              <button
                onClick={() => setOverlay(!overlay)}
                style={{
                  padding: "4px 8px", borderRadius: 6,
                  background: overlay ? "rgba(52,211,153,0.12)" : "rgba(0,0,0,0.7)",
                  color: overlay ? "var(--accent)" : "var(--text-tertiary)",
                  border: overlay ? "1px solid rgba(52,211,153,0.2)" : "1px solid rgba(255,255,255,0.08)",
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                {overlay ? <Eye size={12} /> : <EyeSlash size={12} />}
                Seg
              </button>
              <button
                onClick={downloadSlice}
                style={{
                  padding: "4px 8px", borderRadius: 6,
                  background: "rgba(0,0,0,0.7)",
                  color: "var(--text-secondary)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <DownloadSimple size={12} /> Save
              </button>
            </div>

            {/* Legend */}
            <div className="absolute" style={{ bottom: 8, right: 8, padding: 8, borderRadius: 6, background: "rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {LEGEND.map(l => (
                <div key={l.label} className="flex items-center" style={{ gap: 6, marginTop: l.label !== "NCR" ? 4 : 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                  <span className="font-mono" style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center" style={{ gap: 16, padding: 12, borderRadius: 8, border: "1px solid var(--border-color)" }}>
            {/* View switcher */}
            <div className="flex" style={{ gap: 2, padding: 2, borderRadius: 6, background: "rgba(0,0,0,0.3)", border: "1px solid var(--border-color)" }}>
              {VIEWS.map(v => (
                <button
                  key={v}
                  onClick={() => { setView(v); setIdx(Math.floor(slices[v].length / 2)); }}
                  className="font-mono"
                  style={{
                    padding: "6px 12px", borderRadius: 4,
                    fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                    background: view === v ? "var(--accent)" : "transparent",
                    color: view === v ? "var(--bg-primary)" : "var(--text-tertiary)",
                    border: "none", cursor: "pointer", transition: "all 0.15s ease",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>

            {/* Slice */}
            <div className="flex-1 flex items-center" style={{ gap: 8 }}>
              <span className="font-mono" style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap" }}>Slice</span>
              <input type="range" min={0} max={max} value={idx} onChange={e => setIdx(Number(e.target.value))} style={{ flex: 1 }} />
            </div>

            {/* Window/Level */}
            <div className="hidden md:flex items-center" style={{ gap: 12, paddingLeft: 12, borderLeft: "1px solid var(--border-color)" }}>
              <div className="flex items-center" style={{ gap: 4 }}>
                <span className="font-mono" style={{ fontSize: 10, color: "var(--text-tertiary)", fontWeight: 600 }}>W</span>
                <input type="range" min={50} max={200} value={brightness} onChange={e => setBrightness(Number(e.target.value))} style={{ width: 56 }} />
              </div>
              <div className="flex items-center" style={{ gap: 4 }}>
                <span className="font-mono" style={{ fontSize: 10, color: "var(--text-tertiary)", fontWeight: 600 }}>L</span>
                <input type="range" min={50} max={200} value={contrast} onChange={e => setContrast(Number(e.target.value))} style={{ width: 56 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnails */}
        <div className="flex flex-row lg:flex-col overflow-auto" style={{ gap: 4, paddingBottom: 4 }}>
          {current.map((s, i) => (
            <div
              key={i}
              onClick={() => setIdx(i)}
              className="shrink-0 overflow-hidden"
              style={{
                width: 60, height: 60, borderRadius: 6,
                border: i === idx ? `2px solid var(--accent)` : "2px solid transparent",
                cursor: "pointer", transition: "border-color 0.15s ease",
              }}
            >
              <img src={`data:image/png;base64,${s}`} alt={`${i + 1}`}
                   style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}