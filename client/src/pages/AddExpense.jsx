import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, History } from "lucide-react";
import { expenseApi } from "../api/index.js";
import { useAuth } from "../context/AuthContext.jsx";
import ExpenseForm from "../components/ExpenseForm.jsx";
import ExpenseTable from "../components/ExpenseTable.jsx";
import { currentMonth } from "../utils/dateHelpers.js";
import { useEffect } from "react";

export default function AddExpense() {
  const { user } = useAuth();
  const [loading, setLoading]     = useState(false);
  const [lastAI, setLastAI]       = useState(null);
  const [recentExp, setRecentExp] = useState([]);
  const [expLoading, setExpLoading] = useState(true);

  const loadRecent = useCallback(async () => {
    try {
      const res = await expenseApi.list({ month: currentMonth(), limit: 10 });
      setRecentExp(res.data.expenses || []);
    } catch {}
    finally { setExpLoading(false); }
  }, []);

  useEffect(() => { loadRecent(); }, [loadRecent]);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setLastAI(null);
    try {
      const { data } = await expenseApi.add(formData);
      setLastAI(data.ai);
      loadRecent();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await expenseApi.delete(id);
    loadRecent();
  };

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <Link to="/dashboard" className="btn btn-ghost btn-sm" style={{ marginBottom: 12 }}>
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <h1 className="page-title">Add Expense</h1>
          <p className="page-subtitle">Every expense is analyzed by the AI engine in real time</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 24, alignItems: "start" }}>
        {/* Form */}
        <div className="card" style={{ position: "sticky", top: 24 }}>
          <div style={{
            fontSize: "0.74rem", fontWeight: 600, color: "var(--text-muted)",
            textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 20,
          }}>
            New Expense
          </div>
          <ExpenseForm onSubmit={handleSubmit} loading={loading} lastAI={lastAI} />

          {/* Engine status */}
          <div style={{
            marginTop: 20, padding: "10px 14px",
            background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)",
            fontSize: "0.76rem", color: "var(--text-muted)",
          }}>
            {(user?.total_expense_count || 0) >= 10
              ? `🧠 ML model active · ${user?.total_expense_count} expenses trained`
              : `📊 Cold-start mode · ${user?.total_expense_count || 0}/10 needed for ML`}
          </div>
        </div>

        {/* Recent expenses */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <History size={16} color="var(--text-muted)" />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem" }}>This Month</span>
          </div>
          <ExpenseTable
            expenses={recentExp}
            currency={user?.currency}
            onDelete={handleDelete}
            loading={expLoading}
          />
        </div>
      </div>
    </div>
  );
}