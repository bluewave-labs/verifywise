import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
import { getVendorChangeHistoryById } from "../controllers/vendorChangeHistory.ctrl";

// GET change history for a specific vendor
router.get("/:id", authenticateJWT, getVendorChangeHistoryById);

export default router;
