import React, { useEffect, useState } from "react";
import { Award, TrendingDown } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { expenseApi } from "../api/index.js";
import ExpenseTable from "../components/ExpenseTable.jsx";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { formatCurrencyFull, getCategoryColor } from "../utils/format.js";
import { monthLabel } from "../utils/dateHelpers.js";

export default function Analytics() {
  const { user } = useAuth();
  const [data, setData]         = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [tab, setTab]           = useState("overview");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      expenseApi.getAnalytics(6),
      expenseApi.list({ anomaly_only: true, limit: 20 }),
      expenseApi.list({ limit: 50 }),
    ]).then(([aRes, anoRes, expRes]) => {
      setData(aRes.data);
      setAnomalies(anoRes.data.expenses || []);
      setExpenses(expRes.data.expenses || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    await expenseApi.delete(id);
    setExpenses((p) => p.filter((e) => e._id !== id));
    setAnomalies((p) => p.filter((e) => e._id !== id));
  };

  if (loading) return (
    <div className="page-content fade-in" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  const summaries = data?.summaries || [];
  const monthlyChart = summaries.map((s) => ({
    month: monthLabel(s.month),
    spent: Math.round(s.monthly_total),
    budget: user?.monthly_budget || 0,
    savings: s.savings_rate,
  })).reverse();

  const catDrift = (data?.categoryDrift || []).slice(0, 6);

  // Category breakdown from most recent summary
  const catData = summaries[0]?.total_by_category
    ? Object.entries(Object.fromEntries(summaries[0].total_by_category))
        .map(([name, value]) => ({ name, value: Math.round(value) }))
        .sort((a, b) => b.value - a.value)
    : [];

  const TABS = [
    { id: "overview",  label: "Overview" },
    { id: "anomalies", label: `Anomalies (${anomalies.length})` },
    { id: "history",   label: "All Expenses" },
  ];

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">6-month spending history & anomaly intelligence</p>
        </div>

        {/* Best/worst month badges */}
        {data?.best_month && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ textAlign: "right" }}>
              <div className="badge badge-success" style={{ marginBottom: 4 }}>
                <Award size={10} /> Best: {monthLabel(data.best_month.month)}
              </div>
              <div className="badge badge-danger">
                <TrendingDown size={10} /> Worst: {data.worst_month ? monthLabel(data.worst_month.month) : "—"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "10px 18px", fontSize: "0.88rem", fontWeight: 500,
            color: tab === t.id ? "var(--accent)" : "var(--text-secondary)",
            borderBottom: `2px solid ${tab === t.id ? "var(--accent)" : "transparent"}`,
            marginBottom: -1, transition: "all 0.15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Monthly spend vs budget */}
          <div className="card">
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 20 }}>Monthly Spend vs Budget</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyChart} barGap={4}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => formatCurrencyFull(v, user?.currency)} tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} width={70} />
                <Tooltip
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v, n) => [formatCurrencyFull(v, user?.currency), n === "spent" ? "Spent" : "Budget"]}
                />
                <Bar dataKey="budget" fill="var(--bg-elevated)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="spent" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid-2">
            {/* Savings rate trend */}
            <div className="card">
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>Savings Rate Trend</div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={monthlyChart}>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v?.toFixed(1)}%`, "Savings"]} />
                  <Line type="monotone" dataKey="savings" stroke="var(--accent)" strokeWidth={2} dot={{ fill: "var(--accent)", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Category breakdown */}
            <div className="card">
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>Category Breakdown</div>
              {catData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={catData} cx="40%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {catData.map((entry, i) => (
                        <Cell key={i} fill={getCategoryColor(entry.name)} />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(value) => <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{value}</span>}
                    />
                    <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v) => [formatCurrencyFull(v, user?.currency), ""]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state" style={{ padding: "20px" }}>No data yet</div>
              )}
            </div>
          </div>

          {/* Category drift */}
          {catDrift.length > 0 && (
            <div className="card">
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>Category Drift (vs last month)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {catDrift.map((c) => (
                  <div key={c.category} style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", alignItems: "center", gap: 14 }}>
                    <span style={{ fontSize: "0.85rem", textTransform: "capitalize", color: "var(--text-secondary)" }}>{c.category}</span>
                    <div style={{ height: 6, background: "var(--bg-elevated)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 99,
                        width: `${Math.min(Math.abs(c.change_pct || 0), 100)}%`,
                        background: c.change_pct > 20 ? "var(--danger)" : c.change_pct < -15 ? "var(--success)" : "var(--accent)",
                        transition: "width 0.6s",
                      }} />
                    </div>
                    <span style={{
                      fontSize: "0.8rem", fontWeight: 700, minWidth: 50, textAlign: "right",
                      color: c.change_pct > 0 ? "var(--danger)" : c.change_pct < 0 ? "var(--success)" : "var(--text-muted)",
                    }}>
                      {c.change_pct != null ? `${c.change_pct > 0 ? "+" : ""}${c.change_pct}%` : "New"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "anomalies" && (
        <div className="card">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 4 }}>Flagged Expenses</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 20 }}>All unusual expenses detected by the AI engine</div>
          <ExpenseTable expenses={anomalies} currency={user?.currency} onDelete={handleDelete} />
        </div>
      )}

      {tab === "history" && (
        <div className="card">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 4 }}>All Expenses</div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 20 }}>Last 50 transactions</div>
          <ExpenseTable expenses={expenses} currency={user?.currency} onDelete={handleDelete} />
        </div>
      )}
    </div>
  );
}