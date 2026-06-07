import { Router } from "express";
import {
  addExpense, getExpenses, deleteExpense,
  getForecast, getMonthlySummaries, getCurrentSummary, getAnalytics,
} from "../controllers/expenseController.js";
import auth from "../middleware/auth.js";

const router = Router();

router.use(auth);

router.post("/", addExpense);
router.get("/", getExpenses);
router.delete("/:id", deleteExpense);
router.get("/forecast", getForecast);
router.get("/summary/current", getCurrentSummary);
router.get("/summary/history", getMonthlySummaries);
router.get("/analytics", getAnalytics);

export default router;