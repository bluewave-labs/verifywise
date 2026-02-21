import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
import {
  runAdvisor,
  streamAdvisor,
  streamAdvisorV2,
  getConversation,
  saveConversation,
} from "../controllers/advisor.ctrl";

// Run advisor query
router.post("/", authenticateJWT, runAdvisor);

// Streaming advisor query (legacy SSE protocol)
router.post("/stream", authenticateJWT, streamAdvisor);

// AI SDK streaming endpoint (native UI message stream protocol for useChat)
router.post("/chat", authenticateJWT, streamAdvisorV2);

// Conversation persistence endpoints
router.get("/conversations/:domain", authenticateJWT, getConversation);
router.post("/conversations/:domain", authenticateJWT, saveConversation);

export default router;
