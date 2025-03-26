import express from "express";
const router = express.Router();
const multer = require("multer");
const upload = multer({ Storage: multer.memoryStorage() });

import {
  createAssessment,
  deleteAssessmentById,
  getAllAssessments,
  getAnswers,
  getAssessmentById,
  getAssessmentByProjectId,
  // saveAnswers,
  updateAssessmentById,
} from "../controllers/assessment.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllAssessments);
router.get("/getAnswers/:id", authenticateJWT, getAnswers);
router.get("/:id", authenticateJWT, getAssessmentById);
router.get("/project/byid/:id", authenticateJWT, getAssessmentByProjectId);

// POSTs
router.post("/", authenticateJWT, createAssessment);
// router.post("/saveAnswers", authenticateJWT, upload.any("files"), saveAnswers);

// PUTs
router.put("/:id", authenticateJWT, updateAssessmentById);
// router.put("/updateAnswers/:id", authenticateJWT, updateAnswers);

// DELETEs
router.delete("/:id", authenticateJWT, deleteAssessmentById);

export default router;
