import express from "express";
const router = express.Router();

import {
  createAssessmentTracker,
  deleteAssessmentTrackerById,
  getAllAssessmentTrackers,
  getAssessmentTrackerById,
  updateAssessmentTrackerById
} from "../controllers/assessmentTracker.ctrl"

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllAssessmentTrackers);
router.get("/:id", authenticateJWT, getAssessmentTrackerById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createAssessmentTracker);
router.put("/:id", authenticateJWT, updateAssessmentTrackerById);
router.delete("/:id", authenticateJWT, deleteAssessmentTrackerById);


export default router;