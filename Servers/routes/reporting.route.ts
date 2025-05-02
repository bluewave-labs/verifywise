import express from "express";
const router = express.Router();
import { generateReports } from "../controllers/reporting.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// POST request
router.post("/generate-report", authenticateJWT, generateReports);

export default router;