import axios from "axios";
import Expense from "../models/Expense.js";
import MonthlySummary from "../models/MonthlySummary.js";
import User from "../models/User.js";

const AI = () => axios.create({ baseURL: process.env.AI_ENGINE_URL || "http://localhost:8000", timeout: 15000 });

// ── helpers ──────────────────────────────────────────────────────────────────

const toEngineExpense = (e) => ({ amount: e.amount, category: e.category, date: e.date });

async function refreshMonthlySummary(user, month) {
  const expenses = await Expense.find({
    user_id: user._id,
    date: { $regex: `^${month}` },
  });
  if (!expenses.length) return;

  const anomalyCount = expenses.filter((e) => e.is_anomaly).length;
  try {
    const { data } = await AI().post("/summary", {
      user_id: user._id.toString(),
      expenses: expenses.map(toEngineExpense),
      anomaly_count: anomalyCount,
      monthly_budget: user.monthly_budget,
      monthly_income: user.monthly_income,
      currency: user.currency || "INR",
    });
    await MonthlySummary.findOneAndUpdate(
      { user_id: user._id, month },
      { ...data, anomaly_count: anomalyCount, generated_at: new Date() },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("Summary refresh failed:", err.message);
  }
}

async function maybeTrainModel(user) {
  const count = user.total_expense_count;
  if (count < 10) return;
  if (!user.model_trained && count >= 10) {
    await triggerTraining(user);
  } else if (count % 50 === 0) {
    await triggerTraining(user);
  }
}

async function triggerTraining(user) {
  try {
    const expenses = await Expense.find({ user_id: user._id }).sort({ date: 1 });
    if (expenses.length < 10) return;
    await AI().post("/train", {
      user_id: user._id.toString(),
      expenses: expenses.map(toEngineExpense),
      monthly_budget: user.monthly_budget,
      monthly_income: user.monthly_income,
      category_budgets: Object.fromEntries(user.category_budgets || new Map()),
      currency: user.currency || "INR",
    });
    await User.findByIdAndUpdate(user._id, { model_trained: true });
  } catch (err) {
    console.error("Training failed:", err.message);
  }
}

// ── controllers ───────────────────────────────────────────────────────────────

export const addExpense = async (req, res) => {
  try {
    const { amount, category, date, note } = req.body;
    const user = req.user;

    // Fetch recent history for cold-start context
    const history = await Expense.find({ user_id: user._id })
      .sort({ date: -1 })
      .limit(50);

    // Call AI engine
    let aiResult = { is_anomaly: false, score: null, message: "", method: "cold_start_budget", confidence: "low" };
    try {
      const { data } = await AI().post("/analyze", {
        user_id: user._id.toString(),
        expense: { amount, category, date },
        history: history.map(toEngineExpense),
        monthly_budget: user.monthly_budget,
        monthly_income: user.monthly_income,
        category_budgets: Object.fromEntries(user.category_budgets || new Map()),
        total_expense_count: user.total_expense_count,
        currency: user.currency || "INR",
      });
      aiResult = data;
    } catch (err) {
      console.error("AI analyze failed:", err.message);
    }

    const expense = await Expense.create({
      user_id: user._id,
      amount,
      category: category.toLowerCase().trim(),
      date,
      note: note || "",
      is_anomaly: aiResult.is_anomaly,
      anomaly_score: aiResult.score,
      anomaly_message: aiResult.message,
      detection_method: aiResult.method,
      confidence: aiResult.confidence,
    });

    // Update user expense count
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $inc: { total_expense_count: 1 } },
      { new: true }
    );

    // Async: refresh monthly summary + maybe train
    const month = date.slice(0, 7);
    refreshMonthlySummary(updatedUser, month).catch(console.error);
    maybeTrainModel(updatedUser).catch(console.error);

    res.status(201).json({ expense, ai: aiResult });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const { month, category, anomaly_only, limit = 100, page = 1 } = req.query;
    const filter = { user_id: req.user._id };
    if (month) filter.date = { $regex: `^${month}` };
    if (category) filter.category = category.toLowerCase();
    if (anomaly_only === "true") filter.is_anomaly = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Expense.countDocuments(filter),
    ]);

    res.json({ expenses, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user_id: req.user._id });
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    await expense.deleteOne();
    await User.findByIdAndUpdate(req.user._id, { $inc: { total_expense_count: -1 } });

    const month = expense.date.slice(0, 7);
    const updatedUser = await User.findById(req.user._id);
    refreshMonthlySummary(updatedUser, month).catch(console.error);

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getForecast = async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const expenses = await Expense.find({
      user_id: user._id,
      date: { $regex: `^${month}` },
    });

    // Build daily_totals
    const daily = {};
    for (const e of expenses) {
      daily[e.date] = (daily[e.date] || 0) + e.amount;
    }
    const daily_totals = Object.entries(daily).map(([ds, y]) => ({ ds, y }));

    const { data } = await AI().post("/forecast", {
      user_id: user._id.toString(),
      daily_totals,
      monthly_budget: user.monthly_budget,
      monthly_income: user.monthly_income,
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMonthlySummaries = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const summaries = await MonthlySummary.find({ user_id: req.user._id })
      .sort({ month: -1 })
      .limit(parseInt(months));
    res.json(summaries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getCurrentSummary = async (req, res) => {
  try {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    let summary = await MonthlySummary.findOne({ user_id: req.user._id, month });

    if (!summary) {
      // Generate on demand
      await refreshMonthlySummary(req.user, month);
      summary = await MonthlySummary.findOne({ user_id: req.user._id, month });
    }

    res.json(summary || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const summaries = await MonthlySummary.find({ user_id: req.user._id })
      .sort({ month: -1 })
      .limit(parseInt(months));

    const user = req.user;
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Anomaly history
    const anomalies = await Expense.find({ user_id: user._id, is_anomaly: true })
      .sort({ date: -1 })
      .limit(20);

    // Category drift: compare current month vs last month
    const [current, previous] = summaries;
    let categoryDrift = [];
    if (current && previous) {
      const cur = Object.fromEntries(current.total_by_category || new Map());
      const prev = Object.fromEntries(previous.total_by_category || new Map());
      categoryDrift = Object.keys(cur).map((cat) => ({
        category: cat,
        current: cur[cat] || 0,
        previous: prev[cat] || 0,
        change_pct: prev[cat] ? Math.round(((cur[cat] - prev[cat]) / prev[cat]) * 100) : null,
      })).sort((a, b) => Math.abs(b.change_pct || 0) - Math.abs(a.change_pct || 0));
    }

    res.json({
      summaries,
      anomalies,
      categoryDrift,
      best_month: summaries.reduce((best, s) => (!best || s.budget_utilization < best.budget_utilization ? s : best), null),
      worst_month: summaries.reduce((worst, s) => (!worst || s.budget_utilization > worst.budget_utilization ? s : worst), null),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};