import express from "express";
const router = express.Router();
import {
  generateReports,
  getAllGeneratedReports,
  deleteGeneratedReportById,
} from "../controllers/reporting.ctrl";

import authenticateJWT from "../middleware/auth.middleware";
import { validateId } from "../domain.layer/validations/id.valid";

// POST, PUT, DELETE requests
router.post(
  "/generate-report",
  authenticateJWT,
  validateId("projectId"),
  validateId("frameworkId"),
  validateId("projectFrameworkId"),
  generateReports
);
router.delete("/:id", authenticateJWT, deleteGeneratedReportById);

// GET request
router.get("/generate-report", authenticateJWT, getAllGeneratedReports);

export default router;
