import { GoogleGenAI } from "@google/genai";
import Expense from "../models/Expense.js";
import MonthlySummary from "../models/MonthlySummary.js";

const GEMINI_MODEL = "gemini-2.5-flash";

export const getCoachInsights = async (req, res) => {
  try {
    const user = req.user; 
    const { chatMessage, chatHistory = [] } = req.body || {}; 
    
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // 1. Gather Database Info (This rarely fails)
    const [currentSummaryDoc, pastSummaries, recentAnomalies] = await Promise.all([
      MonthlySummary.findOne({ user_id: user._id, month }),
      MonthlySummary.find({ user_id: user._id }).sort({ month: -1 }).limit(3),
      Expense.find({ user_id: user._id, is_anomaly: true }).sort({ date: -1 }).limit(5),
    ]);

    const currentSummary = currentSummaryDoc ? currentSummaryDoc.toObject() : null;
    const categoryTotals = currentSummary?.total_by_category || {};

    const financeContext = {
      userProfile: {
        name: user.name,
        currency: user.currency || "INR",
        monthlyIncome: user.monthly_income,
        monthlyBudget: user.monthly_budget,
      },
      currentMonthPerformance: currentSummary ? {
        month: currentSummary.month,
        totalSpent: currentSummary.monthly_total,
        budgetUtilizationPct: currentSummary.budget_utilization ? currentSummary.budget_utilization.toFixed(1) + "%" : "0%",
        savingsRatePct: currentSummary.savings_rate ? currentSummary.savings_rate.toFixed(1) + "%" : "0%",
        topCategoryTotals: categoryTotals,
      } : "No recorded metrics for this current month yet.",
      recentFlaggedAnomalies: recentAnomalies.map(e => ({
        amount: e.amount,
        category: e.category,
        date: e.date,
        reasonFlagged: e.anomaly_message
      }))
    };

    const systemInstruction = `
      You are an expert AI Financial Coach for the SpendMind app.
      
      CONTEXT:
      ${JSON.stringify(financeContext, null, 2)}

      OUTPUT RULES (CRITICAL):
      1. STYLE: Professional, friendly, and concise.
      2. FORMATTING: Use Markdown strictly. 
         - Use **Bold** for all key metrics and financial advice.
         - Use "- " for every bullet point.
         - You MUST include a double line break (\\n\\n) after every bullet point and between paragraphs for readability.
      3. BREVITY: Keep all responses under 150 words.
      4. GUARDRAILS: Only answer personal finance/budgeting questions.
      5. PERSONALIZATION: Address the user as ${user.name}.
    `;

    // 2. Safely Initialize the AI SDK 
    let ai;
    try {
      if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing from your .env file.");
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (initErr) {
      console.error("AI Configuration Error:", initErr.message);
      // Return a 200 OK, but send the error to the UI
      if (chatMessage) return res.json({ reply: `⚠️ System Error: ${initErr.message}` });
      return res.json({ 
        messages: [{ type: "danger", icon: "⚠️", title: "Configuration Error", body: initErr.message }],
        summary_available: !!currentSummary, month 
      });
    }

    // 3. Attempt the API Call to Google
    try {
      if (chatMessage) {
        // Chatbot Mode
        const formattedHistory = chatHistory.map(msg => ({
            role: msg.role === "model" ? "model" : "user",
            parts: [{ text: msg.text || "" }]
        }));

        const chat = ai.chats.create({
          model: GEMINI_MODEL,
          config: { systemInstruction }
        });
        
        if (formattedHistory.length > 0) chat.history = formattedHistory; 

        const response = await chat.sendMessage({ message: chatMessage });
        return res.json({ reply: response.text });
      } 
      else {
        // Initial Dashboard Page Load Mode
        const prompt = "Analyze my current metrics provided in your profile context and deliver a short 3-bullet point update regarding my budget health, savings velocity, and anomalies.";
        
        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: { systemInstruction }
        });

        return res.json({ 
          messages: [{ type: "info", icon: "🧠", title: "SpendMind Analysis", body: response.text }],
          summary_available: !!currentSummary, month
        });
      }
    } catch (aiErr) {
      // 🚨 If Gemini rejects the request (e.g. invalid key, quota exceeded), catch it here!
      console.error("Gemini API Error details logged to server:", aiErr.message);
      
      if (chatMessage) return res.json({ reply: `⚠️ AI Connection Error: ${aiErr.message}` });
      return res.json({ 
        messages: [{ type: "danger", icon: "🔌", title: "AI Connection Error", body: `Failed to reach Google Gemini: ${aiErr.message}` }],
        summary_available: !!currentSummary, month
      });
    }

  } catch (dbErr) {
    // Only throw a real 500 if the MongoDB Database itself crashes
    console.error("Database Error:", dbErr);
    res.status(500).json({ message: "Fatal database error: " + dbErr.message });
  }
};