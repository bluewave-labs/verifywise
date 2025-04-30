import express from "express";
const router = express.Router();
import { getProjectRiskReports } from "../controllers/reporting.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// POST request
router.post("/generate-report", authenticateJWT, getProjectRiskReports);

export default router;