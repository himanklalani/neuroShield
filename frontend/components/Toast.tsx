"use client";
import { useEffect, useState } from "react";
import { CheckCircle, WarningCircle, Info, X } from "@phosphor-icons/react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: { border: "rgba(52,211,153,0.2)",  color: "var(--accent)",  bg: "rgba(52,211,153,0.06)",  Icon: CheckCircle },
    error:   { border: "rgba(248,113,113,0.2)",  color: "var(--danger)",  bg: "rgba(248,113,113,0.06)", Icon: WarningCircle },
    info:    { border: "rgba(96,165,250,0.2)",   color: "#60a5fa",        bg: "rgba(96,165,250,0.06)",  Icon: Info },
  };

  const c = config[type];

  return (
    <div
      style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 200,
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px", borderRadius: 8,
        border: `1px solid ${c.border}`,
        background: c.bg,
        backdropFilter: "blur(16px)",
        transform: visible ? "translateY(0)" : "translateY(12px)",
        opacity: visible ? 1 : 0,
        transition: "all 0.3s ease",
      }}
    >
      <c.Icon size={16} weight="fill" color={c.color} />
      <p style={{ fontSize: 13, fontWeight: 500, color: c.color }}>{message}</p>
      <button
        onClick={() => { setVisible(false); setTimeout(onClose, 200); }}
        style={{ marginLeft: 4, background: "none", border: "none", cursor: "pointer", display: "flex", opacity: 0.4 }}
      >
        <X size={12} color={c.color} />
      </button>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType; key: number } | null>(null);

  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type, key: Date.now() });
  };

  const ToastComponent = toast ? (
    <Toast key={toast.key} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
  ) : null;

  return { showToast, ToastComponent };
}
