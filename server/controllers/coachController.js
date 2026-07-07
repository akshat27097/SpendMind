import Expense from "../models/Expense.js";
import MonthlySummary from "../models/MonthlySummary.js";

// Simple rule-based AI coach using stored summary data
// (No external LLM needed — powered by SpendMind's own insights)

export const getCoachInsights = async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [currentSummary, pastSummaries, recentAnomalies] = await Promise.all([
      MonthlySummary.findOne({ user_id: user._id, month }),
      MonthlySummary.find({ user_id: user._id }).sort({ month: -1 }).limit(6),
      Expense.find({ user_id: user._id, is_anomaly: true }).sort({ date: -1 }).limit(5),
    ]);

    const messages = [];

    // Budget status
    if (currentSummary?.budget_utilization !== null) {
      const util = currentSummary.budget_utilization;
      if (util > 100) {
        messages.push({
          type: "danger",
          icon: "🔴",
          title: "Over Budget",
          body: `You've spent ${util.toFixed(1)}% of your monthly budget. Consider pausing non-essential purchases.`,
        });
      } else if (util > 80) {
        messages.push({
          type: "warning",
          icon: "🟡",
          title: "Budget Alert",
          body: `${util.toFixed(1)}% of your budget is used. You're on track but watch your spending in the coming days.`,
        });
      } else {
        messages.push({
          type: "success",
          icon: "🟢",
          title: "Budget on Track",
          body: `Only ${util.toFixed(1)}% used this month — great discipline so far!`,
        });
      }
    }

    // Savings rate
    if (currentSummary?.savings_rate !== null && currentSummary?.savings_rate !== undefined) {
      const rate = currentSummary.savings_rate;
      if (rate >= 30) {
        messages.push({
          type: "success",
          icon: "💰",
          title: "Excellent Savings",
          body: `You're saving ${rate}% of income this month — that's exceptional. The 30% rule says you're financially thriving.`,
        });
      } else if (rate < 10 && rate >= 0) {
        messages.push({
          type: "warning",
          icon: "📉",
          title: "Low Savings Rate",
          body: `Saving only ${rate}% this month. Target at least 20% for financial security.`,
        });
      } else if (rate < 0) {
        messages.push({
          type: "danger",
          icon: "⚠️",
          title: "Spending Exceeds Income",
          body: `You're spending more than you earn this month. Review your largest categories immediately.`,
        });
      }
    }

    // Anomaly coach
    if (recentAnomalies.length > 0) {
      const categories = [...new Set(recentAnomalies.map((e) => e.category))];
      messages.push({
        type: "info",
        icon: "🔍",
        title: "Unusual Spending Detected",
        body: `${recentAnomalies.length} unusual expense${recentAnomalies.length > 1 ? "s" : ""} flagged recently in: ${categories.join(", ")}. Review to ensure accuracy.`,
        expenses: recentAnomalies.map((e) => ({
          amount: e.amount,
          category: e.category,
          date: e.date,
          message: e.anomaly_message,
        })),
      });
    }

    // Month-over-month trend
    if (pastSummaries.length >= 2) {
      const [curr, prev] = pastSummaries;
      if (curr && prev && prev.monthly_total > 0) {
        const change = ((curr.monthly_total - prev.monthly_total) / prev.monthly_total) * 100;
        if (change > 20) {
          messages.push({
            type: "warning",
            icon: "📈",
            title: "Spending Increased",
            body: `This month's spending is up ${change.toFixed(0)}% vs last month. Identify what's driving the increase.`,
          });
        } else if (change < -15) {
          messages.push({
            type: "success",
            icon: "📉",
            title: "Great Improvement",
            body: `You've reduced spending by ${Math.abs(change).toFixed(0)}% compared to last month. Keep it up!`,
          });
        }
      }
    }

    // Top category insight
    if (currentSummary?.total_by_category) {
      const cats = Object.fromEntries(currentSummary.total_by_category);
      const top = Object.entries(cats).sort(([, a], [, b]) => b - a)[0];
      if (top) {
        const pct = Math.round((top[1] / currentSummary.monthly_total) * 100);
        if (pct > 40) {
          messages.push({
            type: "info",
            icon: "📊",
            title: `High ${top[0].charAt(0).toUpperCase() + top[0].slice(1)} Spend`,
            body: `${top[0].charAt(0).toUpperCase() + top[0].slice(1)} accounts for ${pct}% of your total spend this month. Is that intentional?`,
          });
        }
      }
    }

    res.json({
      messages: messages.slice(0, 5),
      summary_available: !!currentSummary,
      month,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};