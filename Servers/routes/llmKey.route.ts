import express from "express";
const router = express.Router();

import authenticateJWT from "../middleware/auth.middleware";
import { createLLMKey, updateLLMKey, deleteLLMKey, getLLMKey, getLLMKeys } from "../controllers/llmKey.ctrl";

router.get("/", authenticateJWT, getLLMKeys);
router.get("/:name", authenticateJWT, getLLMKey);
router.post("/", authenticateJWT, createLLMKey);
router.patch("/:id", authenticateJWT, updateLLMKey);
router.delete("/:id", authenticateJWT, deleteLLMKey);

export default router;
