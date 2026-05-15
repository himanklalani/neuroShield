"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Brain, ShieldCheck, Microscope, Activity, Cpu, 
  BookOpen, LogOut, CheckCircle2, Network, Layers, FileText 
} from "lucide-react";
import Dock from "@/components/ui/dock";

export default function InfoPage() {
  const router = useRouter();

  const dockItems = [
    { icon: Activity, label: "Patient Inference", onClick: () => router.push("/") },
    { icon: Cpu, label: "Federated Training", onClick: () => router.push("/") },
    { icon: BookOpen, label: "Brain Tumors & AI", onClick: () => {} },
    { icon: LogOut, label: "Exit Protocol", onClick: () => router.push("/") },
  ];

  const MODALITIES = [
    {
      name: "FLAIR",
      seq: "Fluid Attenuated Inversion Recovery",
      desc: "Suppresses free water signals to cleanly highlight peritumoral edema infiltration zones.",
      voxel: "T2 Fluid Suppression",
      color: "#34d399",
    },
    {
      name: "T1-Weighted",
      seq: "Native Structural T1 Imaging",
      desc: "Maps basic anatomical gray/white matter contrast and captures core hypointense necrotic regions.",
      voxel: "Pre-Contrast Base Mapping",
      color: "#60a5fa",
    },
    {
      name: "T1CE",
      seq: "T1 Contrast-Enhanced (Gadolinium)",
      desc: "Isolates active microvascular proliferation and broken blood-brain barrier margins.",
      voxel: "Hyperintense Margins",
      color: "#fbbf24",
    },
    {
      name: "T2-Weighted",
      seq: "Standard T2 Relaxation",
      desc: "Demonstrates maximal fluid retention signals to trace the complete overarching bounds of the whole mass.",
      voxel: "High Fluid Sensitivity",
      color: "#f87171",
    },
  ];

  return (
    <div className="flex flex-col relative" style={{ minHeight: "100dvh", background: "var(--bg-primary)", paddingBottom: 140 }}>
      
      {/* ─── Header matching Dashboard.tsx exactly ─────────── */}
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
          <button
            onClick={() => router.push("/")}
            className="btn-secondary"
            style={{ padding: "6px 12px", fontSize: 12, gap: 6, background: "transparent", border: "none" }}
          >
            <ArrowLeft size={14} color="var(--accent)" />
            <span style={{ fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.05em" }}>BACK TO DASHBOARD</span>
          </button>
          
          <div className="flex items-center" style={{ gap: 8 }}>
            <Brain size={18} color="var(--accent)" />
            <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", letterSpacing: "0.05em" }}>
              UWCP KNOWLEDGE PROTOCOL
            </span>
          </div>
        </div>
      </header>

      {/* ─── Main Content Area matching application widths ─── */}
      <main style={{ maxWidth: 1400, margin: "0 auto", width: "100%", padding: "48px 32px" }} className="flex flex-col gap-16">
        
        {/* Title Block */}
        <div className="flex flex-col" style={{ gap: 16, maxWidth: 900 }}>
          <div className="pill" style={{ background: "var(--accent-muted)", border: "1px solid rgba(52, 211, 153, 0.2)", alignSelf: "flex-start" }}>
            <Microscope size={14} color="var(--accent)" />
            <span style={{ color: "var(--accent)", fontWeight: 700, letterSpacing: "0.05em" }}>VOLUMETRIC SPECIFICATION v2.5</span>
          </div>

          <h1 style={{ fontSize: 40, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Multi-Planar AI Segmentation & Glioma Sub-Regions.
          </h1>
          
          <p style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            A standard reference manual mapping multi-parametric MRI sequences, biological sub-region boundaries, and deep convolutional SegResNet telemetry settings across clinical distributed networks.
          </p>
        </div>

        {/* ─── Parameter Metrics Stream (High Contrast Cards) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 16 }}>
          {[
            { label: "TARGET TENSOR", val: "240 × 240 × 155", sub: "Isotropic Input Grid" },
            { label: "SPATIAL SCALE", val: "1.0 mm³ Voxel", sub: "Standardized Resampling" },
            { label: "INFERENCE MODEL", val: "SegResNet Core", sub: "3D Residual Convolutions" },
            { label: "NETWORK PROTOCOL", val: "FedAvg Serialization", sub: "Zero-PHI Client Merge" },
          ].map((metric) => (
            <div key={metric.label} className="card" style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 12 }}>
              <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>
                {metric.label}
              </span>
              <div>
                <span className="font-mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", display: "block" }}>
                  {metric.val}
                </span>
                <span style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginTop: 2 }}>
                  {metric.sub}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ─── SECTION 1: Structural Boundaries ──────────────── */}
        <section className="flex flex-col" style={{ gap: 20 }}>
          <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: 12 }}>
            <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>
              01 / PATHOPHYSIOLOGY TARGETS
            </span>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
              Malignant Tumor Microenvironments
            </h2>
          </div>

          <div className="grid grid-cols-1" style={{ gap: 16 }}>
            {[
              { 
                tag: "NCR / NET", 
                title: "Necrotic & Non-Enhancing Core", 
                color: "#f87171", 
                desc: "Represents the central hypointense region of dead tissue debris resulting from severe hypoxia and nutrient depletion inside aggressive malignant masses." 
              },
              { 
                tag: "ED", 
                title: "Peritumoral Edema", 
                color: "#fbbf24", 
                desc: "Surrounding hyperintense vasogenic fluid swelling and localized inflammatory cascades infiltrating peripheral healthy white matter pathways." 
              },
              { 
                tag: "ET", 
                title: "Enhancing Margins", 
                color: "#34d399", 
                desc: "Highly active neoplastic cellular margins showing intense contrast uptake due to broken blood-brain barrier vascular permeability." 
              },
            ].map((item) => (
              <div key={item.tag} className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="flex items-center flex-wrap" style={{ gap: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: item.color }} />
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{item.title}</h3>
                  <span className="pill font-mono" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                    {item.tag}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── SECTION 2: Multi-Modal Channels ───────────────── */}
        <section className="flex flex-col" style={{ gap: 20 }}>
          <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: 12 }}>
            <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>
              02 / ACQUISITION CHANNELS
            </span>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
              Multi-Parametric Input Tensor
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 16 }}>
            {MODALITIES.map((mod) => (
              <div key={mod.name} className="card" style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16 }}>
                <div className="flex flex-col" style={{ gap: 8 }}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: mod.color }}>
                      {mod.name}
                    </span>
                    <CheckCircle2 size={16} color={mod.color} />
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{mod.seq}</h3>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{mod.desc}</p>
                </div>

                <div style={{ paddingTop: 12, borderTop: "1px solid var(--border-color)" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", display: "block", textTransform: "uppercase" }}>
                    Target Feature
                  </span>
                  <span className="font-mono" style={{ fontSize: 12, color: "var(--text-primary)", display: "block", marginTop: 2 }}>
                    {mod.voxel}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── SECTION 3: Inference Architecture ─────────────── */}
        <section className="flex flex-col" style={{ gap: 20 }}>
          <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: 12 }}>
            <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>
              03 / COMPUTATIONAL TOPOLOGY
            </span>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
              SegResNet 3D Convolutions
            </h2>
          </div>

          <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              The runtime engine bypasses 2D slice projections completely, executing multi-scale localized kernels across direct 4D input matrices. Skip connections pass structural features past downsampling bottlenecks to retain pristine border contours during output upsampling layers.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 16, paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
              {[
                { phase: "01", name: "Z-Score Extraction", desc: "Independent per-channel standardization mapping uniform volumetric intensity distributions." },
                { phase: "02", name: "Residual Encoders", desc: "Progressive pooling layers learning robust spatial multi-scale context parameters." },
                { phase: "03", name: "Softmax Masking", desc: "Dice cross-entropy activation rendering native multi-class segmentation arrays." },
              ].map((stage) => (
                <div key={stage.phase} className="flex flex-col" style={{ gap: 6 }}>
                  <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>
                    PHASE {stage.phase}
                  </span>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{stage.name}</h4>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{stage.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SECTION 4: Federated Execution ────────────────── */}
        <section className="flex flex-col" style={{ gap: 20 }}>
          <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: 12 }}>
            <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", letterSpacing: "0.05em", display: "block", marginBottom: 4 }}>
              04 / PRIVACY GOVERNANCE
            </span>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
              Federated Averaging Protocols
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 16 }}>
            {[
              { num: "01", title: "Private Edge Processing", desc: "Patient volumes remain strictly within client infrastructure. Backpropagation processes fully on localized hardware node targets." },
              { num: "02", title: "Weight Serialization", desc: "Only isolated model weight updates are securely extracted and encrypted during scheduled synchronization pipelines." },
              { num: "03", title: "Centralized Merging", desc: "Global layer matrices merge client deltas to produce enhanced robust models across multi-scanner demographic sources." },
            ].map((step) => (
              <div key={step.num} className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="flex items-center justify-between">
                  <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)" }}>
                    STEP {step.num}
                  </span>
                  <Network size={16} color="var(--accent)" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <footer style={{ paddingTop: 24, borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>HIPAA COMPLIANT TELEMETRY</span>
          <span className="font-mono" style={{ fontSize: 12, color: "var(--text-tertiary)" }}>UWCP ENGINE v2.5</span>
        </footer>

      </main>

      {/* ─── Persistent Bottom Dock Navigation ───────────── */}
      <Dock
        items={dockItems}
        className="fixed bottom-4 left-0 right-0 z-50 pointer-events-none"
      />
    </div>
  );
}
