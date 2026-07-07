import api from "./axios.js";

// Auth
export const authApi = {
  signup: (data) => api.post("/auth/signup", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  updateSettings: (data) => api.patch("/auth/settings", data),
};

// Expenses
export const expenseApi = {
  add: (data) => api.post("/expenses", data),
  list: (params) => api.get("/expenses", { params }),
  delete: (id) => api.delete(`/expenses/${id}`),
  getForecast: () => api.get("/expenses/forecast"),
  getCurrentSummary: () => api.get("/expenses/summary/current"),
  getSummaryHistory: (months = 6) => api.get("/expenses/summary/history", { params: { months } }),
  getAnalytics: (months = 6) => api.get("/expenses/analytics", { params: { months } }),
};

// Coach
export const coachApi = {
  getInsights: () => api.get("/coach/insights"),
  sendChat: (data) => api.post("/coach/insights", data)
};