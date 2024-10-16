import express from "express";
const router = express.Router();

import {
  createComplianceTracker,
  deleteComplianceTrackerById,
  getAllComplianceTrackers,
  getComplianceTrackerById,
  updateComplianceTrackerById
} from "../controllers/complianceTracker.ctrl"

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllComplianceTrackers);
router.get("/:id", authenticateJWT, getComplianceTrackerById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createComplianceTracker);
router.put("/:id", authenticateJWT, updateComplianceTrackerById);
router.delete("/:id", authenticateJWT, deleteComplianceTrackerById);


export default router;