import express from "express";
const router = express.Router();

import {
  createAssessment,
  deleteAssessmentById,
  getAllAssessments,
  getAssessmentById,
  saveAnswers,
  updateAssessmentById,
} from "../controllers/assessment.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", /*authenticateJWT, */ getAllAssessments);
router.get("/:id", /*authenticateJWT, */ getAssessmentById);

// POSTs
router.post("/", /*authenticateJWT, */ createAssessment);
router.post("/saveAnswers", /*authenticateJWT, */ saveAnswers);

// PUTs
router.put("/:id", /*authenticateJWT, */ updateAssessmentById);

// DELETEs
router.delete("/:id", /*authenticateJWT, */ deleteAssessmentById);

export default router;
