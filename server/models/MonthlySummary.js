import mongoose from "mongoose";

const summaryInsightSchema = new mongoose.Schema(
  {
    type: String,
    message: String,
    severity: String,
  },
  { _id: false }
);

const monthlySummarySchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    month: { type: String, required: true }, // "YYYY-MM"
    total_by_category: { type: Map, of: Number, default: {} },
    monthly_total: { type: Number, default: 0 },
    highest_expense: { type: Number, default: 0 },
    most_frequent_category: { type: String, default: "" },
    anomaly_count: { type: Number, default: 0 },
    daily_average: { type: Number, default: 0 },
    savings_rate: { type: Number, default: null },
    budget_utilization: { type: Number, default: null },
    insights: { type: [summaryInsightSchema], default: [] },
    over_budget_categories: { type: [String], default: [] },
    generated_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

monthlySummarySchema.index({ user_id: 1, month: -1 });

export default mongoose.model("MonthlySummary", monthlySummarySchema);