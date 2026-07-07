const SYMBOLS = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£",
  JPY: "¥", CNY: "¥", AED: "د.إ", SGD: "S$",
  CAD: "CA$", AUD: "A$",
};

export function resolveSymbol(currency = "INR") {
  return SYMBOLS[currency?.toUpperCase()] || currency || "₹";
}

export function formatCurrency(amount, currency = "INR") {
  const symbol = resolveSymbol(currency);
  if (amount >= 100000) return `${symbol}${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(1)}K`;
  return `${symbol}${Math.round(amount).toLocaleString("en-IN")}`;
}

export function formatCurrencyFull(amount, currency = "INR") {
  const symbol = resolveSymbol(currency);
  return `${symbol}${Math.round(amount).toLocaleString("en-IN")}`;
}

export function formatPct(val, decimals = 1) {
  if (val == null) return "—";
  return `${val.toFixed(decimals)}%`;
}

export const CATEGORIES = [
  "food", "transport", "shopping", "entertainment",
  "health", "utilities", "education", "other",
];

export const CATEGORY_COLORS = {
  food: "#00e5a0",
  transport: "#4d9fff",
  shopping: "#f5a623",
  entertainment: "#b97dff",
  health: "#ff6b9d",
  utilities: "#00d4e5",
  education: "#ffd166",
  other: "#8b93a7",
};

export function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat?.toLowerCase()] || CATEGORY_COLORS.other;
}