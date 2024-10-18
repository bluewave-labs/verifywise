import express from "express";
const router = express.Router();

import {
  createQuestionEvidence,
  deleteQuestionEvidenceById,
  getAllQuestionEvidences,
  getQuestionEvidenceById,
  updateQuestionEvidenceById,
} from "../controllers/questionEvidence.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllQuestionEvidences);
router.get("/:id", authenticateJWT, getQuestionEvidenceById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createQuestionEvidence);
router.put("/:id", authenticateJWT, updateQuestionEvidenceById);
router.delete("/:id", authenticateJWT, deleteQuestionEvidenceById);

export default router;
