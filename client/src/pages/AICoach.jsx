import React, { useEffect, useState } from "react";
import { Brain, RefreshCw } from "lucide-react";
import { coachApi } from "../api/index.js";
import ChatBubble from "../components/ChatBubble.jsx";

export default function AICoach() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await coachApi.getInsights();
      setData(res.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Coach</h1>
          <p className="page-subtitle">Personalised financial intelligence — powered by your own data</p>
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* Coach header card */}
      <div className="card" style={{
        background: "linear-gradient(135deg, var(--bg-card) 0%, rgba(0,229,160,0.05) 100%)",
        border: "1px solid rgba(0,229,160,0.12)",
        marginBottom: 24,
        display: "flex", alignItems: "center", gap: 20,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: "var(--accent-dim)", border: "1px solid rgba(0,229,160,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Brain size={26} color="var(--accent)" />
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", marginBottom: 4 }}>
            SpendMind AI Coach
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Your coach analyzes anomaly patterns, budget utilization, savings rates, and month-over-month trends
            to generate personalized financial guidance — no external AI, just your data.
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ height: 80, opacity: 0.4, animation: "pulse 1.5s ease infinite" }} />
          ))}
        </div>
      )}

      {!loading && data && (
        <div>
          {!data.summary_available && (
            <div style={{
              textAlign: "center", padding: "40px",
              background: "var(--bg-card)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)", marginBottom: 24,
            }}>
              <div style={{ fontSize: "2rem", marginBottom: 12 }}>📊</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 8 }}>No data for this month yet</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                Add some expenses and your AI coach will start generating insights automatically.
              </div>
            </div>
          )}

          {data.messages?.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.messages.map((msg, i) => (
                <ChatBubble key={i} {...msg} />
              ))}
            </div>
          )}

          {data.messages?.length === 0 && data.summary_available && (
            <div style={{
              textAlign: "center", padding: "60px",
              color: "var(--text-muted)", fontSize: "0.9rem",
            }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>✅</div>
              Everything looks healthy — no alerts this month!
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.6} }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}