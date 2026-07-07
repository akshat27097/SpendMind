import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, PlusCircle, BarChart3, Brain,
  Settings, LogOut, Zap, TrendingUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { resolveSymbol } from "../utils/format.js";

const NAV = [
  { to: "/dashboard",   icon: LayoutDashboard, label: "Dashboard" },
  { to: "/add",         icon: PlusCircle,       label: "Add Expense" },
  { to: "/analytics",   icon: BarChart3,         label: "Analytics" },
  { to: "/ai-coach",    icon: Brain,             label: "AI Coach" },
  { to: "/settings",    icon: Settings,          label: "Settings" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <nav style={{
      width: "var(--nav-width)",
      height: "100vh",
      position: "fixed",
      top: 0, left: 0,
      background: "var(--bg-surface)",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      padding: "0",
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: "28px 24px 20px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={18} color="#0a0b0e" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.03em" }}>
              Spend<span style={{ color: "var(--accent)" }}>Mind</span>
            </div>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>AI Finance</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: "flex", alignItems: "center", gap: "10px",
            padding: "10px 14px",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
            fontSize: "0.88rem",
            fontWeight: 500,
            transition: "all 0.15s",
            color: isActive ? "var(--accent)" : "var(--text-secondary)",
            background: isActive ? "var(--accent-dim)" : "transparent",
            border: isActive ? "1px solid rgba(0,229,160,0.15)" : "1px solid transparent",
          })}>
            {({ isActive }) => (
              <>
                <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* User card */}
      <div style={{ padding: "16px", borderTop: "1px solid var(--border)" }}>
        <div style={{
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-md)",
          padding: "12px",
          marginBottom: "10px",
        }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
            {user?.name || "User"}
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
            Budget: {resolveSymbol(user?.currency)}{((user?.monthly_budget || 0) / 1000).toFixed(0)}K/mo
          </div>
          {user?.total_expense_count >= 10 && (
            <div style={{
              marginTop: 6, display: "flex", alignItems: "center", gap: 4,
              fontSize: "0.7rem", color: "var(--accent)",
            }}>
              <TrendingUp size={11} />
              ML Model Active
            </div>
          )}
        </div>
        <button onClick={handleLogout} className="btn btn-ghost btn-sm btn-full" style={{ justifyContent: "center" }}>
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </nav>
  );
}