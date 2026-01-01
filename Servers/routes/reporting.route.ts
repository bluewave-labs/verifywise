import express from "express";
const router = express.Router();
import {
  generateReports,
  generateReportsV2,
  getAllGeneratedReports,
  deleteGeneratedReportById,
} from "../controllers/reporting.ctrl";

import authenticateJWT from "../middleware/auth.middleware";
import { validateId } from "../domain.layer/validations/id.valid";

// POST, PUT, DELETE requests

// Legacy endpoint (markdown-based, DOCX only)
router.post(
  "/generate-report",
  authenticateJWT,
  validateId("projectId"),
  validateId("frameworkId"),
  validateId("projectFrameworkId"),
  generateReports
);

// New v2 endpoint (HTML/EJS-based, supports PDF and DOCX)
router.post(
  "/v2/generate-report",
  authenticateJWT,
  validateId("projectId"),
  validateId("frameworkId"),
  validateId("projectFrameworkId"),
  generateReportsV2
);

router.delete("/:id", authenticateJWT, deleteGeneratedReportById);

// GET request
router.get("/generate-report", authenticateJWT, getAllGeneratedReports);

export default router;
