import express from "express";
const router = express.Router();

import {
  getRiskById,
  getAllRisks,
  createRisk,
  updateRiskById,
  deleteRiskById,
  getRisksByProject,
  getRisksByFramework,
} from "../controllers/risks.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllRisks);
router.get("/by-projid/:id", authenticateJWT, getRisksByProject);
router.get("/by-frameworkid/:id", authenticateJWT, getRisksByFramework);
router.get("/:id", authenticateJWT, getRiskById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createRisk);
router.put("/:id", authenticateJWT, updateRiskById);
router.delete("/:id", authenticateJWT, deleteRiskById);

export default router;
