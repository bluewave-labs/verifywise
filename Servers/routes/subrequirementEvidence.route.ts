import express from "express";
const router = express.Router();

import {
  createSubrequirementEvidence,
  deleteSubrequirementEvidenceById,
  getAllSubrequirementEvidences,
  getSubrequirementEvidenceById,
  updateSubrequirementEvidenceById,
} from "../controllers/subrequirementEvidence.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllSubrequirementEvidences);
router.get("/:id", authenticateJWT, getSubrequirementEvidenceById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createSubrequirementEvidence);
router.put("/:id", authenticateJWT, updateSubrequirementEvidenceById);
router.delete("/:id", authenticateJWT, deleteSubrequirementEvidenceById);

export default router;
