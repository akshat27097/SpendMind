import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, AlertTriangle, Wallet, TrendingUp, Percent, Calendar } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { expenseApi } from "../api/index.js";
import MetricCard from "../components/MetricCard.jsx";
import BudgetBar from "../components/BudgetBar.jsx";
import ForecastCard from "../components/ForecastCard.jsx";
import ExpenseTable from "../components/ExpenseTable.jsx";
import { formatCurrencyFull, formatPct } from "../utils/format.js";
import { currentMonth } from "../utils/dateHelpers.js";

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary]     = useState(null);
  const [forecast, setForecast]   = useState(null);
  const [expenses, setExpenses]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [fcLoading, setFcLoading] = useState(true);

  const month = currentMonth();

  const load = useCallback(async () => {
    try {
      const [sumRes, expRes] = await Promise.all([
        expenseApi.getCurrentSummary(),
        expenseApi.list({ month, limit: 8 }),
      ]);
      setSummary(sumRes.data);
      setExpenses(expRes.data.expenses || []);
    } catch {}
    finally { setLoading(false); }

    try {
      const fcRes = await expenseApi.getForecast();
      setForecast(fcRes.data);
    } catch {}
    finally { setFcLoading(false); }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    await expenseApi.delete(id);
    setExpenses((prev) => prev.filter((e) => e._id !== id));
    load();
  };

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link to="/add" className="btn btn-primary">
          <PlusCircle size={16} /> Add Expense
        </Link>
      </div>

      {/* Metric cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <MetricCard
          title="Monthly Spend"
          value={summary ? formatCurrencyFull(summary.monthly_total, user?.currency) : "—"}
          subtitle={`of ${formatCurrencyFull(user?.monthly_budget, user?.currency)} budget`}
          accent="var(--accent)"
          icon={Wallet}
        />
        <MetricCard
          title="Savings Rate"
          value={summary?.savings_rate != null ? formatPct(summary.savings_rate) : "—"}
          subtitle={summary?.savings_rate >= 20 ? "On target" : summary?.savings_rate < 0 ? "Negative!" : "Below 20% goal"}
          accent={summary?.savings_rate >= 20 ? "var(--success)" : summary?.savings_rate < 0 ? "var(--danger)" : "var(--warning)"}
          icon={Percent}
        />
        <MetricCard
          title="Daily Average"
          value={summary ? formatCurrencyFull(summary.daily_average, user?.currency) : "—"}
          subtitle="this month"
          accent="var(--info)"
          icon={Calendar}
        />
        <MetricCard
          title="Anomalies"
          value={summary?.anomaly_count ?? "—"}
          subtitle={summary?.anomaly_count > 0 ? "unusual expenses" : "all normal"}
          accent={summary?.anomaly_count > 0 ? "var(--danger)" : "var(--success)"}
          icon={AlertTriangle}
        />
      </div>

      {/* Budget bar + Forecast */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
            Budget Utilization
          </div>
          {!loading && (
            <BudgetBar
              spent={summary?.monthly_total || 0}
              budget={user?.monthly_budget || 1}
              currency={user?.currency}
            />
          )}
          {loading && <div className="spinner" />}

          {/* Insights preview */}
          {summary?.insights?.length > 0 && (
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
              {summary.insights.slice(0, 2).map((ins, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  padding: "8px 0",
                  borderTop: "1px solid var(--border)",
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%", marginTop: 6, flexShrink: 0,
                    background: ins.severity === "danger" ? "var(--danger)" : ins.severity === "warning" ? "var(--warning)" : "var(--success)",
                  }} />
                  <span style={{ fontSize: "0.81rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{ins.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <ForecastCard forecast={forecast} currency={user?.currency} loading={fcLoading} />
      </div>

      {/* Recent expenses */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem" }}>Recent Expenses</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 2 }}>This month · click to expand</div>
          </div>
          <Link to="/analytics" className="btn btn-ghost btn-sm">
            <TrendingUp size={14} /> View All
          </Link>
        </div>
        <ExpenseTable
          expenses={expenses}
          currency={user?.currency}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>
    </div>
  );
}