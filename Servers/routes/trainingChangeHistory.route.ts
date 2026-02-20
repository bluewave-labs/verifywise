import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
import { getTrainingChangeHistoryById } from "../controllers/trainingChangeHistory.ctrl";

// GET change history for a specific training
router.get("/:id", authenticateJWT, getTrainingChangeHistoryById);

export default router;
