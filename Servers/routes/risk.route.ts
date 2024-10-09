import express from "express";
const router = express.Router();

import {
  createRisk,
  deleteRiskById,
  getAllRisks,
  getRiskById,
  updateRiskById
} from "../controllers/risk.ctrl"

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllRisks);
router.get("/:id", authenticateJWT, getRiskById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createRisk);
router.put("/:id", authenticateJWT, updateRiskById);
router.delete("/:id", authenticateJWT, deleteRiskById);


export default router;