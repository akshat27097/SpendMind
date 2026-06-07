import React from "react";
import { formatCurrencyFull } from "../utils/format.js";

export default function BudgetBar({ spent, budget, currency = "INR" }) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const overBudget = spent > budget;
  const color = overBudget ? "var(--danger)" : pct > 80 ? "var(--warning)" : "var(--accent)";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <div>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, color }}>
            {formatCurrencyFull(spent, currency)}
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}> of {formatCurrencyFull(budget, currency)}</span>
        </div>
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color }}>{pct.toFixed(1)}%</span>
      </div>

      {/* Bar track */}
      <div style={{
        height: 6, background: "var(--bg-elevated)", borderRadius: 99, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 99,
          background: overBudget
            ? "linear-gradient(90deg, var(--warning), var(--danger))"
            : pct > 80
            ? "linear-gradient(90deg, var(--accent), var(--warning))"
            : "var(--accent)",
          transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: "0.75rem", color: "var(--text-muted)" }}>
        <span>Remaining: {formatCurrencyFull(Math.max(budget - spent, 0), currency)}</span>
        {overBudget && <span style={{ color: "var(--danger)" }}>Over by {formatCurrencyFull(spent - budget, currency)}</span>}
      </div>
    </div>
  );
}