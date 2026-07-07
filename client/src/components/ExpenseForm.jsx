import React, { useState } from "react";
import { CATEGORIES } from "../utils/format.js";
import { todayISO } from "../utils/dateHelpers.js";
import AnomalyBanner from "./AnomalyBanner.jsx";
import { CheckCircle } from "lucide-react";

export default function ExpenseForm({ onSubmit, loading, lastAI }) {
  const [form, setForm] = useState({
    amount: "", category: "food", date: todayISO(), note: "",
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || isNaN(+form.amount)) return;
    await onSubmit({ ...form, amount: parseFloat(form.amount) });
    setForm({ amount: "", category: "food", date: todayISO(), note: "" });
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Amount</label>
            <input
              className="form-input"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              required
              style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600 }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-input"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} style={{ textTransform: "capitalize" }}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              className="form-input"
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Note <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Team lunch"
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
          {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Analyzing…</> : "Add & Analyze"}
        </button>
      </form>

      {/* AI Result */}
      {lastAI && (
        <div style={{ marginTop: 16 }}>
          {lastAI.is_anomaly
            ? <AnomalyBanner message={lastAI.message} />
            : (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "var(--success-dim)",
                border: "1px solid rgba(0,229,160,0.15)",
                borderRadius: "var(--radius-md)", padding: "12px 16px",
              }}>
                <CheckCircle size={16} color="var(--success)" />
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{lastAI.message}</span>
                <span className="badge badge-neutral" style={{ marginLeft: "auto", fontSize: "0.68rem" }}>
                  {lastAI.confidence} confidence
                </span>
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}