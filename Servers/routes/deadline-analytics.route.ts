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
import {
  getDeadlineSummary,
  getDeadlineDetails,
  getDeadlineConfig
} from "../controllers/deadline-analytics.ctrl";
import authenticateJWT from "../middleware/auth.middleware";

const router = express.Router();

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
 *
 * Example:
 * GET /api/deadline-analytics/summary?entityType=tasks
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "tasks": {
 *       "overdue": 3,
 *       "dueSoon": 5,
 *       "threshold": 14
 *     }
 *   },
 *   "message": "OK",
 *   "timestamp": "2025-01-02T10:30:00.000Z",
 *   "performance": {
 *     "queryTime": 45,
 *     "cached": false
 *   }
 * }
 */
router.get("/summary", authenticateJWT, getDeadlineSummary);

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
 *
 * Example:
 * GET /api/deadline-analytics/details?entityType=tasks&category=overdue&page=1&limit=10
 *
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": 123,
 *       "title": "Complete project documentation",
 *       "description": "Write comprehensive documentation for the new feature",
 *       "due_date": "2024-12-25T00:00:00.000Z",
 *       "priority": "high",
 *       "status": "inProgress",
 *       "creator": {
 *         "name": "John Doe",
 *         "email": "john@example.com"
 *       },
 *       "created_at": "2024-12-01T10:00:00.000Z",
 *       "updated_at": "2024-12-20T15:30:00.000Z"
 *     }
 *   ],
 *   "message": "OK",
 *   "timestamp": "2025-01-02T10:30:00.000Z",
 *   "performance": {
 *     "queryTime": 67,
 *     "cached": false
 *   },
 *   "pagination": {
 *     "page": 1,
 *     "limit": 10,
 *     "total": 3,
 *     "hasMore": false
 *   }
 * }
 */
router.get("/details", authenticateJWT, getDeadlineDetails);

/**
 * GET /api/deadline-analytics/config
 *
 * Get the current configuration for the deadline warning system.
 * Returns thresholds and completed status definitions.
 *
 * Authentication: Required (JWT)
 *
 * Example:
 * GET /api/deadline-analytics/config
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "dueSoonThresholdDays": 14,
 *     "completedStatuses": ["COMPLETED", "DELETED"]
 *   },
 *   "message": "OK",
 *   "timestamp": "2025-01-02T10:30:00.000Z"
 * }
 */
router.get("/config", authenticateJWT, getDeadlineConfig);

export default router;