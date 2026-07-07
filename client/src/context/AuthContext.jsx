import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../api/index.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("sm_token");
    if (!token) { setLoading(false); return; }
    authApi.getMe()
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem("sm_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    localStorage.setItem("sm_token", data.token);
    setUser(data.user);
    return data;
  }, []);

  const signup = useCallback(async (credentials) => {
    const { data } = await authApi.signup(credentials);
    localStorage.setItem("sm_token", data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("sm_token");
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);