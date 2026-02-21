import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
import { getTaskChangeHistoryById } from "../controllers/taskChangeHistory.ctrl";

// GET change history for a specific task
router.get("/:id", authenticateJWT, getTaskChangeHistoryById);

export default router;
