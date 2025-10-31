import express from "express";
import rateLimit from "express-rate-limit";
const router = express.Router();

import authenticateJWT from "../middleware/auth.middleware";
import {
  getEvidentlyConfig,
  saveEvidentlyConfig,
  removeEvidentlyConfig,
  testConnection,
  listMonitoredModels,
  getCacheStatistics,
  invalidateProjectCache,
  cleanupOldCache,
} from "../controllers/evidentlyConfig.ctrl";

// Rate limiting for configuration endpoints
const configLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: "Too many configuration requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for connection tests (external API calls)
const testLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: "Too many connection test requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Configuration CRUD
router.get("/config", configLimiter, authenticateJWT, getEvidentlyConfig);
router.post("/config", configLimiter, authenticateJWT, saveEvidentlyConfig);
router.put("/config", configLimiter, authenticateJWT, saveEvidentlyConfig); // Same handler for PUT and POST
router.delete("/config", configLimiter, authenticateJWT, removeEvidentlyConfig);

// Test connection (without saving)
router.post("/config/test", testLimiter, authenticateJWT, testConnection);

// Get monitored models
router.get("/models", configLimiter, authenticateJWT, listMonitoredModels);

// Cache management
router.get("/cache/stats", configLimiter, authenticateJWT, getCacheStatistics);
router.delete("/cache/:projectId", configLimiter, authenticateJWT, invalidateProjectCache);
router.post("/cache/cleanup", configLimiter, authenticateJWT, cleanupOldCache);

export default router;
