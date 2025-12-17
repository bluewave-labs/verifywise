/**
 * @fileoverview Deadline Analytics Controller
 *
 * Handles HTTP requests for the deadline warning system analytics API.
 * Provides endpoints for retrieving overdue and due-soon task counts,
 * detailed deadline information, and configuration management.
 *
 * Performance:
 * - Target response time: <200ms (95th percentile)
 * - Uses existing DeadlineService with optimized database queries
 * - Includes performance metrics in responses for monitoring
 *
 * Security:
 * - Uses existing JWT authentication middleware
 * - Implements multi-tenant access control via DeadlineService
 * - Validates user permissions for organization data access
 */

import { Request, Response } from "express";
import { DeadlineService } from "../services/deadline.service";
import { logFailure, logProcessing, logSuccess } from "../utils/logger/logHelper";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  IDeadlineSummaryResponse,
  IDeadlineDetailsResponse,
  IDeadlineConfigResponse
} from "../domain.layer/interfaces/deadline-analytics.interface";

// Initialize service as singleton for better performance
const deadlineService = new DeadlineService();

/**
 * Get deadline summary counts for a user and organization
 *
 * This is the main endpoint for the deadline warning system. It returns
 * aggregated counts of overdue and due-soon items for quick display in UI badges.
 *
 * GET /api/deadline-analytics/summary
 * Query Params:
 * - entityType: 'tasks' | 'vendors' | 'policies' | 'risks' (default: 'tasks')
 *
 * @example
 * // GET /api/deadline-analytics/summary?entityType=tasks
 * // Response:
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
export async function getDeadlineSummary(req: Request, res: Response) {
  const startTime = Date.now();

  logProcessing({
    description: "starting getDeadlineSummary",
    functionName: "getDeadlineSummary",
    fileName: "deadline-analytics.ctrl.ts",
  });

  try {
    const { entityType = 'tasks' } = req.query;
    const userId = req.userId!;
    const organizationId = req.organizationId!;

    // Validate entity type
    const validEntityTypes = ['tasks', 'vendors', 'policies', 'risks'];
    if (!validEntityTypes.includes(entityType as string)) {
      return res.status(400).json(
        STATUS_CODE[400](`Invalid entity type. Must be one of: ${validEntityTypes.join(', ')}`)
      );
    }

    const summaryData = await deadlineService.getSummary(
      userId,
      organizationId,
      entityType as any
    );

    const queryTime = Date.now() - startTime;

    await logSuccess({
      eventType: "Read",
      description: `Retrieved deadline summary for ${entityType}`,
      functionName: "getDeadlineSummary",
      fileName: "deadline-analytics.ctrl.ts",
      userId
    });

    const response: IDeadlineSummaryResponse = {
      success: true,
      data: summaryData,
      message: "OK",
      timestamp: new Date().toISOString(),
      performance: {
        queryTime,
        cached: false // TODO: Add caching logic in future iteration
      }
    };

    return res.status(200).json(STATUS_CODE[200](response));
  } catch (error) {
    const queryTime = Date.now() - startTime;

    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve deadline summary",
      functionName: "getDeadlineSummary",
      fileName: "deadline-analytics.ctrl.ts",
      error: error as Error
    });

    const response = {
      success: false,
      data: null,
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
      performance: {
        queryTime,
        cached: false
      }
    };

    return res.status(500).json(STATUS_CODE[500](response));
  }
}

/**
 * Get detailed deadline items with optional filtering
 *
 * Used when users click on deadline badges to see the actual items.
 * Returns detailed information including creator data and can be filtered
 * by category (overdue or due-soon).
 *
 * GET /api/deadline-analytics/details
 * Query Params:
 * - entityType: 'tasks' | 'vendors' | 'policies' | 'risks' (default: 'tasks')
 * - category: 'overdue' | 'dueSoon' (optional, returns all if not specified)
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 *
 * @example
 * // GET /api/deadline-analytics/details?entityType=tasks&category=overdue&page=1&limit=10
 */
export async function getDeadlineDetails(req: Request, res: Response) {
  const startTime = Date.now();

  logProcessing({
    description: "starting getDeadlineDetails",
    functionName: "getDeadlineDetails",
    fileName: "deadline-analytics.ctrl.ts",
  });

  try {
    const {
      entityType = 'tasks',
      category,
      page = 1,
      limit = 20
    } = req.query;

    const userId = req.userId!;
    const organizationId = req.organizationId!;

    // Validate inputs
    const validEntityTypes = ['tasks', 'vendors', 'policies', 'risks'];
    if (!validEntityTypes.includes(entityType as string)) {
      return res.status(400).json(
        STATUS_CODE[400](`Invalid entity type. Must be one of: ${validEntityTypes.join(', ')}`)
      );
    }

    if (category && !['overdue', 'dueSoon'].includes(category as string)) {
      return res.status(400).json(
        STATUS_CODE[400]("Invalid category. Must be 'overdue' or 'dueSoon'")
      );
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);

    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json(
        STATUS_CODE[400]("Page and limit must be positive integers")
      );
    }

    const detailsData = await deadlineService.getDetails(
      userId,
      organizationId,
      entityType as string,
      category as any
    );

    // Apply pagination (simple implementation - in future, move to database level for better performance)
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedData = detailsData.slice(startIndex, endIndex);

    const queryTime = Date.now() - startTime;

    await logSuccess({
      eventType: "Read",
      description: `Retrieved deadline details for ${entityType}${category ? ` (${category})` : ''}`,
      functionName: "getDeadlineDetails",
      fileName: "deadline-analytics.ctrl.ts",
      userId
    });

    const response: IDeadlineDetailsResponse = {
      success: true,
      data: paginatedData,
      message: "OK",
      timestamp: new Date().toISOString(),
      performance: {
        queryTime,
        cached: false
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: detailsData.length,
        hasMore: endIndex < detailsData.length
      }
    };

    return res.status(200).json(STATUS_CODE[200](response));
  } catch (error) {
    const queryTime = Date.now() - startTime;

    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve deadline details",
      functionName: "getDeadlineDetails",
      fileName: "deadline-analytics.ctrl.ts",
      error: error as Error
    });

    const response = {
      success: false,
      data: [],
      message: (error as Error).message,
      timestamp: new Date().toISOString(),
      performance: {
        queryTime,
        cached: false
      }
    };

    return res.status(500).json(STATUS_CODE[500](response));
  }
}

/**
 * Get deadline service configuration
 *
 * Returns the current configuration for the deadline warning system,
 * including thresholds and completed status definitions. Useful for
 * frontend display and testing.
 *
 * GET /api/deadline-analytics/config
 *
 * @example
 * // Response:
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
export async function getDeadlineConfig(req: Request, res: Response) {
  logProcessing({
    description: "starting getDeadlineConfig",
    functionName: "getDeadlineConfig",
    fileName: "deadline-analytics.ctrl.ts",
  });

  try {
    const config = deadlineService.getConfig();

    await logSuccess({
      eventType: "Read",
      description: "Retrieved deadline service configuration",
      functionName: "getDeadlineConfig",
      fileName: "deadline-analytics.ctrl.ts",
      userId: req.userId
    });

    const response: IDeadlineConfigResponse = {
      success: true,
      data: {
        dueSoonThresholdDays: config.DUE_SOON_THRESHOLD_DAYS,
        completedStatuses: config.COMPLETED_STATUSES
      },
      message: "OK",
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(STATUS_CODE[200](response));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve deadline configuration",
      functionName: "getDeadlineConfig",
      fileName: "deadline-analytics.ctrl.ts",
      error: error as Error
    });

    const response = {
      success: false,
      data: null,
      message: (error as Error).message,
      timestamp: new Date().toISOString()
    };

    return res.status(500).json(STATUS_CODE[500](response));
  }
}