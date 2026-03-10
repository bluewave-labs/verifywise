import express from "express";
import authenticateJWT from "../middleware/auth.middleware";
import authorize from "../middleware/accessControl.middleware";
import { getAuditLedger, verifyAuditLedger } from "../controllers/auditLedger.ctrl";

const router = express.Router();

router.use(authenticateJWT);

// Only admins can view and verify the ledger
router.get("/", authorize(["Admin"]), getAuditLedger);
router.get("/verify", authorize(["Admin"]), verifyAuditLedger);

export default router;
