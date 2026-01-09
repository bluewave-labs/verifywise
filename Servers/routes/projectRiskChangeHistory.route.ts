import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
import { getProjectRiskChangeHistoryByRiskId } from "../controllers/projectRiskChangeHistory.ctrl";

// GET change history for a specific project risk
router.get("/:projectRiskId", authenticateJWT, getProjectRiskChangeHistoryByRiskId);

export default router;
