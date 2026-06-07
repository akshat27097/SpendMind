import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Zap, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout" style={{ minHeight: "100vh", display: "flex" }}>
      {/* Left panel — branding */}
      <div style={{
        flex: "0 0 45%",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "60px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Background decoration */}
        <div style={{
          position: "absolute", top: "15%", left: "10%",
          width: 300, height: 300,
          background: "radial-gradient(circle, rgba(0,229,160,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "5%",
          width: 200, height: 200,
          background: "radial-gradient(circle, rgba(77,159,255,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ textAlign: "center", position: "relative" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: "var(--accent)", display: "flex",
            alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px", boxShadow: "0 0 40px var(--accent-glow)",
          }}>
            <Zap size={30} color="#0a0b0e" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: "2.4rem", marginBottom: 12 }}>
            Spend<span style={{ color: "var(--accent)" }}>Mind</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: 1.7, maxWidth: 320 }}>
            AI-powered anomaly detection and spending intelligence for modern finances.
          </p>

          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Anomaly Detection", desc: "Flags unusual spending instantly" },
              { label: "Smart Forecasting", desc: "Predicts month-end spend accurately" },
              { label: "AI Coach", desc: "Personalised financial insights" },
            ].map((f) => (
              <div key={f.label} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)", borderRadius: 10,
                padding: "10px 14px", textAlign: "left",
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{f.label}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "60px",
      }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <h2 style={{ fontSize: "1.8rem", marginBottom: 6 }}>Welcome back</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 32 }}>
            Sign in to your SpendMind account
          </p>

          {error && (
            <div style={{
              background: "var(--danger-dim)", border: "1px solid rgba(255,77,109,0.2)",
              borderRadius: 8, padding: "10px 14px", marginBottom: 20,
              fontSize: "0.85rem", color: "var(--danger)",
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="form-input"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
                }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</> : "Sign In"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: "0.88rem", color: "var(--text-secondary)" }}>
            Don't have an account?{" "}
            <Link to="/signup" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}