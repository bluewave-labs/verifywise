import express from "express";
const router = express.Router();

import {
  createEvidence,
  deleteEvidenceById,
  getAllEvidences,
  getEvidenceById,
  updateEvidenceById
} from "../controllers/evidence.ctrl"

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllEvidences);
router.get("/:id", authenticateJWT, getEvidenceById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createEvidence);
router.put("/:id", authenticateJWT, updateEvidenceById);
router.delete("/:id", authenticateJWT, deleteEvidenceById);


export default router;