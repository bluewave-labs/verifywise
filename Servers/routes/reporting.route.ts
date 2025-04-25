import express from "express";
const router = express.Router();
import { getProjectRiskReports } from "../controllers/reporting.ctrl";

// GET request
router.get("/generate-report/:id", getProjectRiskReports)

export default router;