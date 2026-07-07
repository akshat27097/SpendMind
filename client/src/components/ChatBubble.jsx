import React from "react";

const severityStyle = {
  success: { bg: "var(--success-dim)", border: "rgba(0,229,160,0.15)", icon: "✅" },
  warning: { bg: "var(--warning-dim)", border: "rgba(245,166,35,0.15)", icon: "⚠️" },
  danger:  { bg: "var(--danger-dim)",  border: "rgba(255,77,109,0.15)", icon: "🔴" },
  info:    { bg: "var(--info-dim)",    border: "rgba(77,159,255,0.15)",  icon: "ℹ️" },
};

export default function ChatBubble({ type = "info", icon, title, body, expenses }) {
  const s = severityStyle[type] || severityStyle.info;

  return (
    <div style={{
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: "var(--radius-md)",
      padding: "16px",
      animation: "fadeIn 0.3s ease",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: "1.1rem", lineHeight: 1.3 }}>{icon || s.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: 4, fontFamily: "var(--font-display)" }}>
            {title}
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{body}</div>

          {expenses && expenses.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {expenses.map((e, i) => (
                <div key={i} style={{
                  background: "var(--bg-card)", borderRadius: 8, padding: "8px 12px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  border: "1px solid var(--border)",
                }}>
                  <div>
                    <span style={{ fontSize: "0.82rem", fontWeight: 500, textTransform: "capitalize" }}>{e.category}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: 8 }}>{e.date}</span>
                  </div>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--danger)", fontFamily: "var(--font-display)" }}>
                    ₹{e.amount?.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}