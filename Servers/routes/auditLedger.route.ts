import express from "express";
import authenticateJWT from "../middleware/auth.middleware";
import authorize from "../middleware/accessControl.middleware";
import { getAuditLedger, verifyAuditLedger } from "../controllers/auditLedger.ctrl";

const router = express.Router();

router.use(authenticateJWT);

// All authenticated users can view the ledger
router.get("/", getAuditLedger);

// Only admins can verify chain integrity
router.get("/verify", authorize(["Admin"]), verifyAuditLedger);

export default router;
