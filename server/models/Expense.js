import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, lowercase: true, trim: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    note: { type: String, trim: true, default: "" },

    // AI Engine results
    is_anomaly: { type: Boolean, default: false },
    anomaly_score: { type: Number, default: null },
    anomaly_message: { type: String, default: "" },
    detection_method: { type: String, default: "cold_start_budget" },
    confidence: { type: String, default: "low" },
  },
  { timestamps: true }
);

expenseSchema.index({ user_id: 1, date: -1 });
expenseSchema.index({ user_id: 1, is_anomaly: 1 });

export default mongoose.model("Expense", expenseSchema);