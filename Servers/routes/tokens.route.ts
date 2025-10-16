import express from "express";
const router = express.Router();

import authenticateJWT from "../middleware/auth.middleware";
import { validateTokenCreation, validateTokenDeletion } from "../middleware/tokens.middleware";
import { createApiToken, deleteApiToken, getApiTokens } from "../controllers/tokens.ctrl";

router.get("/", authenticateJWT, getApiTokens);
router.post("/", authenticateJWT, validateTokenCreation, createApiToken);
router.delete("/:id", authenticateJWT, validateTokenDeletion, deleteApiToken);

export default router;
