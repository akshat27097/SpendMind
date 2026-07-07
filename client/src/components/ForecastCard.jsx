import React from "react";
import { TrendingUp, TrendingDown, Target } from "lucide-react";
import { formatCurrencyFull, formatPct } from "../utils/format.js";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const methodLabel = { budget: "Budget-Based", bayesian: "Bayesian Blend", prophet: "AI Prophet" };

export default function ForecastCard({ forecast, currency = "INR", loading }) {
  if (loading) return (
    <div className="card" style={{ textAlign: "center", padding: "40px" }}>
      <div className="spinner" style={{ margin: "0 auto 12px" }} />
      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Forecasting your spend…</div>
    </div>
  );

  if (!forecast) return null;

  const { predicted_month_end, lower_bound, upper_bound, on_track, budget_remaining, method, forecast: days } = forecast;

  const chartData = (days || []).map((d) => ({
    date: d.ds?.slice(5),
    predicted: Math.round(d.yhat),
    lower: Math.round(d.yhat_lower),
    upper: Math.round(d.yhat_upper),
  }));

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Month-End Forecast
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, color: on_track ? "var(--accent)" : "var(--danger)", letterSpacing: "-0.03em" }}>
            {formatCurrencyFull(predicted_month_end, currency)}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>
            Range: {formatCurrencyFull(lower_bound, currency)} – {formatCurrencyFull(upper_bound, currency)}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <span className={`badge ${on_track ? "badge-success" : "badge-danger"}`}>
            {on_track ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
            {on_track ? "On Track" : "Over Budget"}
          </span>
          <span className="badge badge-neutral" style={{ fontSize: "0.68rem" }}>
            {methodLabel[method] || method}
          </span>
        </div>
      </div>

      {budget_remaining != null && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: budget_remaining >= 0 ? "var(--success-dim)" : "var(--danger-dim)",
          border: `1px solid ${budget_remaining >= 0 ? "rgba(0,229,160,0.15)" : "rgba(255,77,109,0.15)"}`,
          borderRadius: "var(--radius-sm)", padding: "8px 12px", marginBottom: 20,
        }}>
          <Target size={14} color={budget_remaining >= 0 ? "var(--success)" : "var(--danger)"} />
          <span style={{ fontSize: "0.82rem", color: budget_remaining >= 0 ? "var(--success)" : "var(--danger)" }}>
            {budget_remaining >= 0
              ? `${formatCurrencyFull(budget_remaining, currency)} projected to remain`
              : `${formatCurrencyFull(Math.abs(budget_remaining), currency)} projected over budget`}
          </span>
        </div>
      )}

      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
              formatter={(v) => [formatCurrencyFull(v, currency), ""]}
            />
            <Area type="monotone" dataKey="upper" stroke="none" fill="var(--bg-elevated)" fillOpacity={0.4} />
            <Area type="monotone" dataKey="predicted" stroke="var(--accent)" strokeWidth={2} fill="url(#fcGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}