import express from "express";
const router = express.Router();
const multer = require("multer");
const upload = multer({ Storage: multer.memoryStorage() });

import {
  createAssessment,
  deleteAssessmentById,
  getAllAssessments,
  getAssessmentById,
  updateAssessmentById,
} from "../controllers/assessment.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", /*authenticateJWT, */ getAllAssessments);
router.get("/:id", /*authenticateJWT, */ getAssessmentById);

// POST, PUT, DELETE requests
router.post("/", /*authenticateJWT, */ upload.any("files"), createAssessment);
router.put("/:id", /*authenticateJWT, */ updateAssessmentById);
router.delete("/:id", /*authenticateJWT, */ deleteAssessmentById);

export default router;
