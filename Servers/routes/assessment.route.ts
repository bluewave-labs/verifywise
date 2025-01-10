import express from "express";
const router = express.Router();

import {
  createAssessment,
  deleteAssessmentById,
  getAllAssessments,
  getAssessmentById,
  saveAnswers,
  updateAnswers,
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
router.put("/updateAnswers/:id", /*authenticateJWT, */ updateAnswers);

// DELETEs
router.delete("/:id", /*authenticateJWT, */ deleteAssessmentById);

export default router;
