import express from "express";
const router = express.Router();

import authenticateJWT from "../middleware/auth.middleware";
import {
  // API Keys
  getApiKeys,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  // Endpoints
  getEndpoints,
  getEndpoint,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  // Spend
  getSpendSummary,
  getSpendByEndpoint,
  getSpendByUser,
  // Budget
  getBudget,
  upsertBudget,
  // Proxy
  chatCompletion,
  chatCompletionStream,
  embeddingProxy,
  // Providers
  getProviders,
  // Guardrails
  getGuardrails,
  createGuardrail,
  updateGuardrail,
  deleteGuardrail,
  getGuardrailSettings,
  updateGuardrailSettings,
  testGuardrails,
  getGuardrailLogs,
  getGuardrailStats,
  purgeGuardrailLogs,
} from "../controllers/aiGateway.ctrl";

// All routes require authentication
router.use(authenticateJWT);

// API Key management
router.get("/keys", getApiKeys);
router.post("/keys", createApiKey);
router.patch("/keys/:id", updateApiKey);
router.delete("/keys/:id", deleteApiKey);

// Endpoint management
router.get("/endpoints", getEndpoints);
router.get("/endpoints/:id", getEndpoint);
router.post("/endpoints", createEndpoint);
router.patch("/endpoints/:id", updateEndpoint);
router.delete("/endpoints/:id", deleteEndpoint);

// Spend analytics
router.get("/spend", getSpendSummary);
router.get("/spend/by-endpoint", getSpendByEndpoint);
router.get("/spend/by-user", getSpendByUser);

// Budget management
router.get("/budget", getBudget);
router.put("/budget", upsertBudget);

// Utility
router.get("/providers", getProviders);

// Guardrail settings (specific routes BEFORE parameterized :id)
router.get("/guardrails/settings", getGuardrailSettings);
router.put("/guardrails/settings", updateGuardrailSettings);
router.post("/guardrails/test", testGuardrails);
router.get("/guardrails/logs", getGuardrailLogs);
router.get("/guardrails/stats", getGuardrailStats);
router.post("/guardrails/logs/purge", purgeGuardrailLogs);

// Guardrail rule CRUD
router.get("/guardrails", getGuardrails);
router.post("/guardrails", createGuardrail);
router.patch("/guardrails/:id", updateGuardrail);
router.delete("/guardrails/:id", deleteGuardrail);

// Proxy endpoints
router.post("/chat", chatCompletion);
router.post("/chat/stream", chatCompletionStream);
router.post("/embeddings", embeddingProxy);

export default router;
