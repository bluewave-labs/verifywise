import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
import { getDatasetChangeHistoryById } from "../controllers/datasetChangeHistory.ctrl";

// GET change history for a specific dataset
router.get("/:id", authenticateJWT, getDatasetChangeHistoryById);

export default router;
