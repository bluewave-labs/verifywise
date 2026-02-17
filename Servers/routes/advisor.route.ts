import express from "express";
const router = express.Router();
import authenticateJWT from "../middleware/auth.middleware";
import {
  runAdvisor,
  streamAdvisor,
  getConversation,
  saveConversation,
} from "../controllers/advisor.ctrl";

// Run advisor query
router.post("/", authenticateJWT, runAdvisor);

// Streaming advisor query
router.post("/stream", authenticateJWT, streamAdvisor);

// Conversation persistence endpoints
router.get("/conversations/:domain", authenticateJWT, getConversation);
router.post("/conversations/:domain", authenticateJWT, saveConversation);

export default router;
