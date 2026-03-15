/**
 * Virtual Key Proxy Routes
 *
 * OpenAI-compatible /v1/* endpoints authenticated via virtual keys.
 * No JWT required. No CORS (server-to-server only).
 */

import express from "express";
import authenticateVirtualKey from "../middleware/virtualKeyAuth.middleware";
import { chatCompletions, embeddings } from "../controllers/virtualKeyProxy.ctrl";

const router = express.Router();

// All routes require virtual key authentication
router.use(authenticateVirtualKey);

// OpenAI-compatible endpoints
router.post("/chat/completions", chatCompletions);
router.post("/embeddings", embeddings);

export default router;
