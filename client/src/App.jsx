import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import Navbar from "./components/Navbar.jsx";

import Login     from "./pages/Login.jsx";
import Signup    from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AddExpense from "./pages/AddExpense.jsx";
import Analytics from "./pages/Analytics.jsx";
import AICoach   from "./pages/AICoach.jsx";
import Settings  from "./pages/Settings.jsx";

function ProtectedLayout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={
            
              <ProtectedLayout><Dashboard /></ProtectedLayout>
            
          } />
          <Route path="/add" element={
            
              <ProtectedLayout><AddExpense /></ProtectedLayout>
            
          } />
          <Route path="/analytics" element={
            
              <ProtectedLayout><Analytics /></ProtectedLayout>
           
          } />
          <Route path="/ai-coach" element={
            
              <ProtectedLayout><AICoach /></ProtectedLayout>
            
          } />
          <Route path="/settings" element={
            
              <ProtectedLayout><Settings /></ProtectedLayout>
            
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}