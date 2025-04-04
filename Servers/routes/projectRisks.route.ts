import express from "express";
const router = express.Router();

import {
  getProjectRiskById,
  getAllProjectRisks,
  createProjectRisk,
  updateProjectRiskById,
  deleteProjectRiskById,
} from "../controllers/projectRisks.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/by-projid/:id", authenticateJWT, getAllProjectRisks);
router.get("/:id", authenticateJWT, getProjectRiskById);

// POST, PUT, DELETE requests
router.post("/", authenticateJWT, createProjectRisk);
router.put("/:id", authenticateJWT, updateProjectRiskById);
router.delete("/:id", authenticateJWT, deleteProjectRiskById);

export default router;
