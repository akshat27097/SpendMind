import React, { useState } from "react";
import { Trash2, AlertTriangle, ChevronDown } from "lucide-react";
import { formatCurrencyFull, getCategoryColor } from "../utils/format.js";
import { relativeDate } from "../utils/dateHelpers.js";

export default function ExpenseTable({ expenses = [], currency = "INR", onDelete, loading }) {
  const [expanded, setExpanded] = useState(null);

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div className="spinner" style={{ margin: "0 auto" }} />
      </div>
    );
  }

  if (!expenses.length) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📊</div>
        <h3>No expenses yet</h3>
        <p style={{ fontSize: "0.85rem" }}>Add your first expense to get started</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {expenses.map((e) => {
        const catColor = getCategoryColor(e.category);
        const isExpanded = expanded === e._id;

        return (
          <div key={e._id} style={{
            background: "var(--bg-card)",
            border: `1px solid ${e.is_anomaly ? "rgba(255,77,109,0.2)" : "var(--border)"}`,
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            transition: "border-color 0.15s",
          }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto auto",
                alignItems: "center",
                gap: 14,
                padding: "12px 16px",
                cursor: "pointer",
              }}
              onClick={() => setExpanded(isExpanded ? null : e._id)}
            >
              {/* Category dot */}
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: catColor, flexShrink: 0,
                boxShadow: `0 0 6px ${catColor}80`,
              }} />

              {/* Main info */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 500, textTransform: "capitalize" }}>
                    {e.category}
                  </span>
                  {e.is_anomaly && (
                    <span className="badge badge-danger" style={{ fontSize: "0.68rem", padding: "2px 7px" }}>
                      <AlertTriangle size={9} /> Unusual
                    </span>
                  )}
                  {e.note && <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>· {e.note}</span>}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
                  {relativeDate(e.date)} · {e.detection_method?.replace("_", " ") || "analyzed"}
                </div>
              </div>

              {/* Amount */}
              <div style={{
                fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 700,
                color: e.is_anomaly ? "var(--danger)" : "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}>
                {formatCurrencyFull(e.amount, currency)}
              </div>

              <ChevronDown
                size={15}
                color="var(--text-muted)"
                style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
              />
            </div>

            {/* Expanded anomaly detail */}
            {isExpanded && e.is_anomaly && e.anomaly_message && (
              <div style={{
                padding: "10px 16px 14px",
                borderTop: "1px solid var(--border)",
                background: "var(--danger-dim)",
              }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  <strong style={{ color: "var(--danger)" }}>Why flagged:</strong> {e.anomaly_message}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: "0.74rem", color: "var(--text-muted)" }}>
                  <span>Confidence: <strong style={{ color: "var(--text-secondary)" }}>{e.confidence}</strong></span>
                  {e.anomaly_score && <span>Score: <strong style={{ color: "var(--text-secondary)" }}>{e.anomaly_score.toFixed(3)}</strong></span>}
                </div>
                {onDelete && (
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ marginTop: 10 }}
                    onClick={(ev) => { ev.stopPropagation(); onDelete(e._id); }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                )}
              </div>
            )}

            {isExpanded && !e.is_anomaly && onDelete && (
              <div style={{ padding: "10px 16px 14px", borderTop: "1px solid var(--border)" }}>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={(ev) => { ev.stopPropagation(); onDelete(e._id); }}
                >
                  <Trash2 size={13} /> Delete expense
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}