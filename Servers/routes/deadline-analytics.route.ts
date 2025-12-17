/**
 * @fileoverview Deadline Analytics Routes
 *
 * Defines the API routes for the deadline warning system analytics.
 * All routes require JWT authentication and provide access to deadline
 * metrics for tasks and other entities in the VerifyWise platform.
 *
 * Routes:
 * - GET /summary - Get aggregated deadline counts
 * - GET /details - Get detailed deadline items
 * - GET /config - Get service configuration
 *
 * Performance:
 * - All routes target <200ms response time
 * - Uses optimized database queries with proper indexing
 * - Includes performance metrics in responses
 */

import express from "express";
import rateLimit from "express-rate-limit";
import {
  getDeadlineSummary,
  getDeadlineDetails,
  getDeadlineConfig
} from "../controllers/deadline-analytics.ctrl";
import authenticateJWT from "../middleware/auth.middleware";

const router = express.Router();

/**
 * Rate limiting configuration for deadline analytics endpoints
 * Uses user ID for key generation to properly limit per user, not per IP
 */
const deadlineRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each user to 60 requests per windowMs
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: 60
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use user ID for authenticated users (guaranteed by auth middleware)
    return String(req.userId);
  },
  // Skip successful requests from rate limiting
  skipSuccessfulRequests: false,
  // Only count failed requests towards rate limit
  skipFailedRequests: false,
});

// Apply authentication middleware FIRST (must be before rate limiter)
router.use(authenticateJWT);

// Apply rate limiting after authentication
router.use(deadlineRateLimiter);

/**
 * GET /api/deadline-analytics/summary
 *
 * Get aggregated deadline counts for a user and organization.
 * Returns overdue and due-soon counts for quick display in UI badges.
 *
 * Query Parameters:
 * - entityType (optional): 'tasks' | 'vendors' | 'policies' | 'risks' (default: 'tasks')
 *
 * Authentication: Required (JWT)
 */
router.get("/summary", getDeadlineSummary);

/**
 * GET /api/deadline-analytics/details
 *
 * Get detailed deadline items with optional filtering.
 * Used when users click on deadline badges to see actual items.
 *
 * Query Parameters:
 * - entityType (optional): 'tasks' | 'vendors' | 'policies' | 'risks' (default: 'tasks')
 * - category (optional): 'overdue' | 'dueSoon' (returns all if not specified)
 * - page (optional): Page number for pagination (default: 1)
 * - limit (optional): Items per page (default: 20, max: 100)
 *
 * Authentication: Required (JWT)
 */
router.get("/details", getDeadlineDetails);

/**
 * GET /api/deadline-analytics/config
 *
 * Get the current configuration for the deadline warning system.
 * Returns thresholds and completed status definitions.
 *
 * Authentication: Required (JWT)
 */
router.get("/config", getDeadlineConfig);

export default router;