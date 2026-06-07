import React from "react";
import { AlertTriangle, X } from "lucide-react";

export default function AnomalyBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(255,77,109,0.12), rgba(245,166,35,0.08))",
      border: "1px solid rgba(255,77,109,0.25)",
      borderRadius: "var(--radius-md)",
      padding: "12px 16px",
      display: "flex", alignItems: "flex-start", gap: 10,
      animation: "fadeIn 0.3s ease",
    }}>
      <AlertTriangle size={16} color="var(--danger)" style={{ marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--danger)", marginBottom: 2 }}>
          Unusual Expense Detected
        </div>
        <div style={{ fontSize: "0.83rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{message}</div>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 2 }}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}