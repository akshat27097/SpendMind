import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function MetricCard({ title, value, subtitle, trend, trendLabel, accent, icon: Icon }) {
  const trendUp = trend > 0;
  const trendNeutral = trend == null;

  return (
    <div className="card" style={{ position: "relative", overflow: "hidden" }}>
      {/* Accent glow */}
      {accent && (
        <div style={{
          position: "absolute", top: -30, right: -30,
          width: 100, height: 100,
          background: `radial-gradient(circle, ${accent}20 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {title}
        </div>
        {Icon && (
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: accent ? `${accent}15` : "var(--bg-elevated)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={16} color={accent || "var(--text-secondary)"} />
          </div>
        )}
      </div>

      <div style={{
        fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 700,
        color: accent || "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1,
        marginBottom: 8,
      }}>
        {value ?? "—"}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {!trendNeutral && (
          <div style={{ display: "flex", alignItems: "center", gap: 3, color: trendUp ? "var(--danger)" : "var(--success)" }}>
            {trendUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
        {subtitle && <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{subtitle}</span>}
        {trendLabel && <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{trendLabel}</span>}
      </div>
    </div>
  );
}