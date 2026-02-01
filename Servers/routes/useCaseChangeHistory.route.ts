import express from "express";
import { getUseCaseHistory } from "../controllers/useCaseChangeHistory.ctrl";
import authenticateJWT from "../middleware/auth.middleware";

const router = express.Router();

router.get("/:useCaseId", authenticateJWT, getUseCaseHistory);

export default router;
