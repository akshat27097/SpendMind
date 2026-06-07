import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Zap } from "lucide-react";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "SGD", "AED", "CAD", "AUD"];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    monthly_budget: "", monthly_income: "", currency: "INR",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await signup({
        ...form,
        monthly_budget: parseFloat(form.monthly_budget),
        monthly_income: parseFloat(form.monthly_income),
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex",
      flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "40px 20px",
      background: "var(--bg-base)",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: "var(--accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Zap size={20} color="#0a0b0e" strokeWidth={2.5} />
        </div>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.3rem" }}>
          Spend<span style={{ color: "var(--accent)" }}>Mind</span>
        </span>
      </div>

      <div style={{
        width: "100%", maxWidth: 460,
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: "36px",
      }}>
        {/* Step indicator */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {[1, 2].map((s) => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 99,
              background: s <= step ? "var(--accent)" : "var(--border)",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        <h2 style={{ fontSize: "1.5rem", marginBottom: 4 }}>
          {step === 1 ? "Create account" : "Set your budget"}
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: 24 }}>
          {step === 1 ? "Start your AI finance journey" : "SpendMind uses this to detect anomalies accurately"}
        </p>

        {error && (
          <div style={{
            background: "var(--danger-dim)", border: "1px solid rgba(255,77,109,0.2)",
            borderRadius: 8, padding: "10px 14px", marginBottom: 16,
            fontSize: "0.85rem", color: "var(--danger)",
          }}>{error}</div>
        )}

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit}>
          {step === 1 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" placeholder="Jane Doe"
                  value={form.name} onChange={(e) => set("name", e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" placeholder="you@example.com"
                  value={form.email} onChange={(e) => set("email", e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" placeholder="Min 6 characters"
                  value={form.password} onChange={(e) => set("password", e.target.value)}
                  minLength={6} required />
              </div>
              <button type="submit" className="btn btn-primary btn-lg btn-full" style={{ marginTop: 4 }}>
                Continue →
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-input" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Income</label>
                <input className="form-input" type="number" min="1" placeholder="e.g. 60000"
                  value={form.monthly_income} onChange={(e) => set("monthly_income", e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Monthly Budget</label>
                <input className="form-input" type="number" min="1" placeholder="e.g. 30000"
                  value={form.monthly_budget} onChange={(e) => set("monthly_budget", e.target.value)} required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginTop: 4 }}>
                <button type="button" className="btn btn-ghost btn-lg" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Creating…</> : "Create Account"}
                </button>
              </div>
            </div>
          )}
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}