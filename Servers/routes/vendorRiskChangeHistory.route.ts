import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
import { getVendorRiskChangeHistoryById } from "../controllers/vendorRiskChangeHistory.ctrl";

// GET change history for a specific vendor risk
router.get("/:id", authenticateJWT, getVendorRiskChangeHistoryById);

export default router;
