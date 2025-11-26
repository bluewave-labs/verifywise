import express from "express";
const router = express.Router();

import authenticateJWT from "../middleware/auth.middleware";
import { validateTokenCreation, validateTokenDeletion } from "../middleware/tokens.middleware";
import { createLLMKey, updateLLMKey, deleteLLMKey, getLLMKey, getLLMKeys } from "../controllers/llmKey.ctrl";

router.get("/", authenticateJWT, getLLMKeys);
router.get("/:name", authenticateJWT, getLLMKey);
router.post("/", authenticateJWT, validateTokenCreation, createLLMKey);
router.patch("/:id", authenticateJWT, validateTokenCreation, updateLLMKey);
router.delete("/:id", authenticateJWT, validateTokenDeletion, deleteLLMKey);

export default router;
