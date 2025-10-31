import express from "express";
import rateLimit from "express-rate-limit";
const router = express.Router();

import authenticateJWT from "../middleware/auth.middleware";
import evidentlyAuthMiddleware from "../middleware/evidentlyAuth.middleware";
import {
  listEvidentlyProjects,
  getEvidentlyProject,
  getDriftMetrics,
  getPerformanceMetrics,
  getFairnessMetrics,
  bulkSyncMetrics,
} from "../controllers/evidently.ctrl";

// Rate limiting for Evidently endpoints
// Standard rate limit: 100 requests per 15 minutes per IP
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests to Evidently API. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for bulk operations: 10 requests per 15 minutes per IP
const bulkOperationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many bulk sync requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply both authentication middleware to all routes
// 1. authenticateJWT - verifies JWT token
// 2. evidentlyAuthMiddleware - retrieves and decrypts Evidently credentials from DB

// Projects - using GET as these are read operations
router.get(
  "/projects",
  standardLimiter,
  authenticateJWT,
  evidentlyAuthMiddleware,
  listEvidentlyProjects
);
router.get(
  "/projects/:projectId",
  standardLimiter,
  authenticateJWT,
  evidentlyAuthMiddleware,
  getEvidentlyProject
);

// Metrics endpoints - using GET as these are read operations
router.get(
  "/metrics/drift/:projectId",
  standardLimiter,
  authenticateJWT,
  evidentlyAuthMiddleware,
  getDriftMetrics
);
router.get(
  "/metrics/performance/:projectId",
  standardLimiter,
  authenticateJWT,
  evidentlyAuthMiddleware,
  getPerformanceMetrics
);
router.get(
  "/metrics/fairness/:projectId",
  standardLimiter,
  authenticateJWT,
  evidentlyAuthMiddleware,
  getFairnessMetrics
);

// Bulk sync - using POST as this modifies state
router.post(
  "/sync/:projectId",
  bulkOperationLimiter,
  authenticateJWT,
  evidentlyAuthMiddleware,
  bulkSyncMetrics
);

export default router;
