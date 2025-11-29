import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
import { getModelInventoryChangeHistoryById } from "../controllers/modelInventoryChangeHistory.ctrl";

// GET change history for a specific model inventory
router.get("/:id", authenticateJWT, getModelInventoryChangeHistoryById);

export default router;
