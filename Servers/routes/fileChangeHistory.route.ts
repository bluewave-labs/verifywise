import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
import { getFileChangeHistoryById } from "../controllers/fileChangeHistory.ctrl";

// GET change history for a specific file
router.get("/:id", authenticateJWT, getFileChangeHistoryById);

export default router;
