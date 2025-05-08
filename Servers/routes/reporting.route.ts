import express from "express";
const router = express.Router();
import { generateReports, getAllGeneratedReports } from "../controllers/reporting.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// POST request
router.post("/generate-report", authenticateJWT, generateReports);

// GET request
router.get("/generate-report", authenticateJWT, getAllGeneratedReports);

export default router;