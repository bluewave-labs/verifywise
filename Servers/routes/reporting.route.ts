import express from "express";
const router = express.Router();
import { 
  generateReports, 
  getAllGeneratedReports,
  deleteGeneratedReportById
} from "../controllers/reporting.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// POST, PUT, DELETE requests
router.post("/generate-report", authenticateJWT, generateReports);
router.delete("/:id", authenticateJWT, deleteGeneratedReportById);

// GET request
router.get("/generate-report", authenticateJWT, getAllGeneratedReports);

export default router;