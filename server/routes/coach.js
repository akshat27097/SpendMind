import { Router } from "express";
import { getCoachInsights } from "../controllers/coachController.js";
import auth from "../middleware/auth.js";

const router = Router();

router.get("/insights", auth, getCoachInsights);

export default router;