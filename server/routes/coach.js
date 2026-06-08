import { Router } from "express";
import { getCoachInsights } from "../controllers/coachController.js";
import auth from "../middleware/auth.js";

const router = Router();

// Allow both GET and POST to use the same controller logic
router.get("/insights", auth, getCoachInsights);
router.post("/insights", auth, getCoachInsights);

export default router;