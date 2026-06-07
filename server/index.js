import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import expenseRoutes from "./routes/expenses.js";
import coachRoutes from "./routes/coach.js";

connectDB();

const app = express();

const rawOrigins = process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000";
const allowedOrigins = rawOrigins.split(",").map((o) => o.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/coach", coachRoutes);

app.get("/", (_, res) => res.json({ status: "ok", service: "SpendMind Backend", version: "2.0.0" }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 SpendMind backend running on :${PORT}`));