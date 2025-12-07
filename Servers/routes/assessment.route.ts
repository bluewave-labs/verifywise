import express from "express";
const router = express.Router();

import {
  getAllAssessments,
  getAnswers,
  getAssessmentById,
  getAssessmentByProjectId,
} from "../controllers/assessment.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllAssessments);
router.get("/getAnswers/:id", authenticateJWT, getAnswers);
router.get("/:id", authenticateJWT, getAssessmentById);
router.get("/project/byid/:id", authenticateJWT, getAssessmentByProjectId);

// POSTs
// router.post("/", authenticateJWT, createAssessment);
// router.post("/saveAnswers", authenticateJWT, upload.any("files"), saveAnswers);

// PUTs
// router.put("/:id", authenticateJWT, updateAssessmentById);
// router.put("/updateAnswers/:id", authenticateJWT, updateAnswers);

// DELETEs
// router.delete("/:id", authenticateJWT, deleteAssessmentById);

export default router;
