import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
import { getModelRiskChangeHistoryById } from "../controllers/modelRiskChangeHistory.ctrl";

// GET change history for a specific model risk
router.get("/:id", authenticateJWT, getModelRiskChangeHistoryById);

export default router;
