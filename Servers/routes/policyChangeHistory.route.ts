import { Router } from "express";
import { getPolicyChangeHistoryById } from "../controllers/policyChangeHistory.ctrl";
import authenticateJWT from "../middleware/auth.middleware";

const router = Router();

router.get("/:id", authenticateJWT, getPolicyChangeHistoryById);

export default router;
