import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-base)",
      }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}