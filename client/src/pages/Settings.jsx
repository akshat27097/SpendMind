import React, { useState } from "react";
import { Save, Plus, Trash2, Settings as SettingsIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { authApi } from "../api/index.js";
import { CATEGORIES, resolveSymbol } from "../utils/format.js";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "SGD", "AED", "CAD", "AUD", "JPY"];

export default function Settings() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "",
    monthly_budget: user?.monthly_budget || "",
    monthly_income: user?.monthly_income || "",
    currency: user?.currency || "INR",
  });

  const [catBudgets, setCatBudgets] = useState(
    user?.category_budgets
      ? Object.entries(user.category_budgets instanceof Map
          ? Object.fromEntries(user.category_budgets)
          : user.category_budgets)
      : []
  );

  const [loading, setLoading] = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const addCatBudget = () => {
    const unused = CATEGORIES.find((c) => !catBudgets.find(([k]) => k === c));
    if (unused) setCatBudgets((p) => [...p, [unused, ""]]);
  };

  const removeCat = (idx) => setCatBudgets((p) => p.filter((_, i) => i !== idx));
  const setCatVal = (idx, k, v) =>
    setCatBudgets((p) => p.map((entry, i) => i === idx ? [k, v] : entry));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const category_budgets = Object.fromEntries(
        catBudgets.filter(([, v]) => v !== "").map(([k, v]) => [k, parseFloat(v)])
      );
      const payload = {
        name: form.name,
        monthly_budget: parseFloat(form.monthly_budget),
        monthly_income: parseFloat(form.monthly_income),
        currency: form.currency,
        category_budgets,
      };
      const { data } = await authApi.updateSettings(payload);
      updateUser(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const sym = resolveSymbol(form.currency);

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Budget configuration and profile preferences</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

          {/* Profile */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <SettingsIcon size={16} color="var(--accent)" />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Profile & Currency</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" type="text" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-input" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Income ({sym})</label>
                <input className="form-input" type="number" min="1" value={form.monthly_income}
                  onChange={(e) => set("monthly_income", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Budget ({sym})</label>
                <input className="form-input" type="number" min="1" value={form.monthly_budget}
                  onChange={(e) => set("monthly_budget", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Category budgets */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>Category Budgets</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addCatBudget}
                disabled={catBudgets.length >= CATEGORIES.length}>
                <Plus size={14} /> Add
              </button>
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.5 }}>
              Per-category monthly caps improve cold-start anomaly detection before the ML model has enough data.
            </div>

            {catBudgets.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                No category budgets set
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {catBudgets.map(([cat, val], idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, alignItems: "center" }}>
                  <select
                    className="form-input"
                    value={cat}
                    onChange={(e) => setCatVal(idx, e.target.value, val)}
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    placeholder={`${sym}0`}
                    value={val}
                    onChange={(e) => setCatVal(idx, cat, e.target.value)}
                  />
                  <button type="button" onClick={() => removeCat(idx)} className="btn btn-danger btn-sm" style={{ padding: "8px 10px" }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Engine info */}
        <div className="card" style={{ marginTop: 24, background: "var(--bg-elevated)" }}>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Expenses</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.2rem", marginTop: 2 }}>{user?.total_expense_count || 0}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Engine Status</div>
              <div style={{ marginTop: 4 }}>
                {(user?.total_expense_count || 0) >= 10
                  ? <span className="badge badge-success">ML Active</span>
                  : <span className="badge badge-warning">{10 - (user?.total_expense_count || 0)} more needed</span>}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Detection Mode</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", marginTop: 4 }}>
                {(user?.total_expense_count || 0) >= 10 ? "IsolationForest" : "Bayesian Cold-Start"}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            background: "var(--danger-dim)", border: "1px solid rgba(255,77,109,0.2)",
            borderRadius: 8, padding: "10px 14px", marginTop: 16,
            fontSize: "0.85rem", color: "var(--danger)",
          }}>{error}</div>
        )}

        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {saved
              ? <><span>✓</span> Saved!</>
              : loading
              ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Saving…</>
              : <><Save size={16} /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}