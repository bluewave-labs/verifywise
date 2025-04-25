import express from "express";
const router = express.Router();
import { getProjectRiskReports } from "../controllers/reporting.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET request
router.get("/generate-report/:id", authenticateJWT, getProjectRiskReports)

export default router;