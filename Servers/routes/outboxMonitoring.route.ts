/**
 * @fileoverview Simple Outbox Event Monitoring Routes
 *
 * Basic monitoring API for the outbox event collection system.
 * Provides essential operational visibility for pure event collection.
 *
 * **Core Functionality:**
 * - Health monitoring and system status
 * - Basic event querying with tenant isolation
 * - Simple statistics for operational oversight
 *
 * **Security Features:**
 * - JWT authentication on protected endpoints
 * - Tenant-based authorization and data isolation
 * - SQL injection protection with parameterized queries
 * - Input validation and whitelisting
 *
 * **Available Endpoints:**
 * - `GET  /api/outbox/stats` - Basic processing statistics (JWT required)
 * - `GET  /api/outbox/events` - Query events with filtering (JWT required)
 * - `PATCH /api/outbox/events/:id/acknowledge` - Mark event as processed by user (JWT required)
 *
 * @module routes/outboxMonitoring
 * @version 1.1.0 - Added user-specific event acknowledgments
 * @created 2025-01-06
 * @updated 2025-10-06
 */

import express from "express";
import { outboxManager } from "../services/outboxManager";
import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";
import authenticateJWT from "../middleware/auth.middleware";
import {
  validateOutboxEventsQuery,
  validateEventAcknowledgment,
  sanitizeRequestBody
} from "../middleware/validation.middleware";

const router = express.Router();

/**
 * SECURITY NOTE: Health endpoint removed to eliminate information disclosure
 *
 * The /api/outbox/health endpoint was removed because:
 * 1. It exposed sensitive system internals without authentication
 * 2. Could be used for reconnaissance by attackers
 * 3. Revealed processing volumes and system architecture
 * 4. Alternative monitoring methods are more secure:
 *    - Internal health checks: outboxManager.getHealthStatus()
 *    - Database monitoring: Direct PostgreSQL queries
 *    - APM tools: New Relic, DataDog, etc.
 *    - Infrastructure monitoring: K8s probes, Docker health checks
 *
 * For operational monitoring, use internal methods or dedicated monitoring tools.
 */

/**
 * GET /api/outbox/stats
 * Basic processing statistics endpoint
 *
 * **Purpose:**
 * Provides simple processing statistics for operational monitoring.
 * Basic metrics for understanding system activity and performance.
 *
 * **Authentication:** JWT required
 * **Tenant Isolation:** Statistics filtered by authenticated user's tenant
 *
 * **Response Codes:**
 * - 200: Successfully retrieved statistics
 * - 403: Authentication failed or tenant information missing
 * - 500: Internal server error
 *
 * **Response Format:**
 * ```json
 * {
 *   "timestamp": "2025-01-06T10:30:00.000Z",
 *   "stats": {
 *     "enabled": true,
 *     "total_events": 1250,
 *     "processed_events": 1240,
 *     "pending_events": 10
 *   }
 * }
 * ```
 */
router.get("/stats", authenticateJWT, async (req, res) => {
  try {
    const stats = outboxManager.getStats();

    res.json({
      timestamp: new Date().toISOString(),
      stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get outbox stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/outbox/events
 * Query outbox events with filters and pagination
 *
 * **Purpose:**
 * Basic endpoint for external systems to consume outbox events.
 * Provides filtering, pagination, and tenant-isolated access to
 * outbox events for workflow processing.
 *
 * **Authentication:** JWT required
 * **Tenant Isolation:** Automatically filtered by authenticated user's tenant
 *
 * **Query Parameters:**
 * - `event_type`: Filter by event type (e.g., 'vendors_update', 'risks_update')
 * - `aggregate_type`: Filter by aggregate type (e.g., 'vendors', 'projectrisks')
 * - `status`: Event status ('pending', 'processed', 'all') - default: 'all'
 * - `exclude_acknowledged`: Exclude events acknowledged by this user ('true', 'false') - default: 'false'
 * - `limit`: Results per page (1-100) - default: 50
 * - `offset`: Pagination offset - default: 0
 * - `order_by`: Sort column (whitelisted for security) - default: 'created_at'
 * - `order_dir`: Sort direction ('ASC', 'DESC') - default: 'DESC'
 *
 * **Security Features:**
 * - SQL injection protection via parameterized queries
 * - Whitelisted ORDER BY columns to prevent injection
 * - Enforced tenant isolation via JWT token validation
 * - Input validation and sanitization
 *
 * **External System Usage:**
 * ```javascript
 * // Simple polling pattern for external workflow engines
 * const response = await fetch('/api/outbox/events?status=pending&limit=50', {
 *   headers: { 'Authorization': 'Bearer jwt_token' }
 * });
 * const { events } = await response.json();
 *
 * for (const event of events) {
 *   await processWorkflow(event);
 *   // External system handles marking as processed
 * }
 * ```
 *
 * **Response Format:**
 * ```json
 * {
 *   "events": [
 *     {
 *       "id": "123",
 *       "tenant": "a4ayc80OGd",
 *       "event_type": "vendors_update",
 *       "aggregate_id": "456",
 *       "aggregate_type": "vendors",
 *       "payload": {
 *         "operation": "UPDATE",
 *         "old_data": {...},
 *         "new_data": {...}
 *       },
 *       "attempts": 0,
 *       "max_attempts": 3,
 *       "created_at": "2025-01-06T10:30:00.000Z",
 *       "processed_at": null
 *     }
 *   ],
 *   "pagination": {
 *     "total": 1250,
 *     "limit": 50,
 *     "offset": 0,
 *     "hasMore": true
 *   },
 *   "filters": {
 *     "tenant": "a4ayc80OGd",
 *     "status": "pending"
 *   }
 * }
 * ```
 */
router.get("/events", authenticateJWT, validateOutboxEventsQuery, async (req: any, res: any) => {
  try {
    // Extract tenant and user from authenticated JWT token - enforce tenant isolation
    const userTenant = (req as any).tenantId;
    const userId = (req as any).userId;

    if (!userTenant) {
      return res.status(403).json({
        status: 'error',
        message: 'Tenant information not found in authentication token'
      });
    }

    const {
      event_type,
      aggregate_type,
      status = 'all', // 'pending', 'processed', 'all'
      exclude_acknowledged = 'false', // 'true', 'false' - exclude events acknowledged by this user
      limit = 50,
      offset = 0,
      order_by = 'created_at',
      order_dir = 'DESC'
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 50, 100);
    const offsetNum = parseInt(offset as string) || 0;

    // Whitelist allowed columns for ORDER BY to prevent SQL injection
    const ALLOWED_ORDER_BY = [
      'id', 'created_at', 'processed_at', 'event_type',
      'aggregate_type', 'attempts', 'available_at', 'tenant'
    ];

    const ALLOWED_ORDER_DIR = ['ASC', 'DESC'];

    // Validate order_by
    const orderBy = ALLOWED_ORDER_BY.includes(order_by as string)
      ? order_by as string
      : 'created_at';

    // Validate order_dir
    const orderDir = ALLOWED_ORDER_DIR.includes((order_dir as string)?.toUpperCase())
      ? (order_dir as string).toUpperCase()
      : 'DESC';

    // Build WHERE conditions - tenant isolation via schema
    const conditions: string[] = [];
    const replacements: any = {
      limit: limitNum,
      offset: offsetNum,
      tenantSchema: userTenant // Force tenant schema to be the authenticated user's tenant
    };

    if (event_type) {
      conditions.push('oe.event_type = :event_type');
      replacements.event_type = event_type;
    }

    if (aggregate_type) {
      conditions.push('oe.aggregate_type = :aggregate_type');
      replacements.aggregate_type = aggregate_type;
    }

    // Status filters
    switch (status) {
      case 'pending':
        conditions.push('oe.processed_at IS NULL AND oe.attempts < oe.max_attempts');
        break;
      case 'processed':
        conditions.push('oe.processed_at IS NOT NULL');
        break;
      // 'all' - no additional conditions
    }

    // Exclude acknowledged events filter (user-specific)
    if (exclude_acknowledged === 'true' && userId) {
      conditions.push(`oe.id NOT IN (
        SELECT event_id FROM "${userTenant}".event_acknowledgments
        WHERE user_id = :userId AND status IN ('processed', 'skipped')
      )`);
      replacements.userId = userId;
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const orderClause = `ORDER BY oe.${orderBy} ${orderDir}`;

    // Get events from tenant-specific schema
    const eventsQuery = `
      SELECT
        oe.id, oe.event_type, oe.aggregate_id, oe.aggregate_type, oe.payload,
        oe.attempts, oe.max_attempts, oe.available_at, oe.created_at, oe.processed_at,
        CASE
          WHEN oe.processed_at IS NOT NULL THEN 'processed'
          WHEN oe.attempts >= oe.max_attempts THEN 'failed'
          ELSE 'pending'
        END as status
      FROM "${userTenant}".outbox_events oe
      ${whereClause}
      ${orderClause}
      LIMIT :limit OFFSET :offset
    `;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "${userTenant}".outbox_events oe
      ${whereClause}
    `;

    const [events, countResult] = await Promise.all([
      sequelize.query(eventsQuery, { replacements, type: QueryTypes.SELECT }),
      sequelize.query(countQuery, { replacements, type: QueryTypes.SELECT })
    ]);

    const total = (countResult[0] as any)?.total || 0;

    res.json({
      events,
      pagination: {
        total: parseInt(total),
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + events.length < total
      },
      filters: {
        tenant: userTenant,
        event_type,
        aggregate_type,
        status
      }
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to query outbox events',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * PATCH /api/outbox/events/:id/acknowledge
 * Mark an event as processed by the authenticated user
 *
 * **Purpose:**
 * Allows Flowgram.ai (or other consumers) to mark specific events as processed
 * for the authenticated user. This enables user-specific event consumption where
 * multiple users can process the same event independently.
 *
 * **Authentication:** JWT required
 * **Tenant Isolation:** User can only acknowledge events from their own tenant
 *
 * **Request Body:**
 * ```json
 * {
 *   "status": "processed",              // Required: processed, failed, skipped
 *   "processor": "flowgram.ai",         // Optional: defaults to flowgram.ai
 *   "metadata": {                       // Optional: processing details
 *     "workflow_id": "project-notification",
 *     "execution_time_ms": 150,
 *     "result": "success"
 *   }
 * }
 * ```
 *
 * **Response Codes:**
 * - 200: Event acknowledged successfully
 * - 400: Invalid request body or parameters
 * - 403: Authentication failed or unauthorized access
 * - 404: Event not found or not accessible by user
 * - 409: Event already acknowledged by this user
 * - 500: Internal server error
 *
 * **Usage Example:**
 * ```javascript
 * // Flowgram.ai acknowledging event processing
 * await fetch('/api/outbox/events/123/acknowledge', {
 *   method: 'PATCH',
 *   headers: {
 *     'Authorization': 'Bearer user_jwt_token',
 *     'Content-Type': 'application/json'
 *   },
 *   body: JSON.stringify({
 *     status: 'processed',
 *     metadata: {
 *       workflow_id: 'project-status-notification',
 *       triggered_at: '2025-10-06T10:30:00Z'
 *     }
 *   })
 * });
 * ```
 */
router.patch("/events/:id/acknowledge", authenticateJWT, sanitizeRequestBody(), validateEventAcknowledgment, async (req: any, res: any) => {
  try {
    // Extract user and tenant from authenticated JWT token
    const userId = (req as any).userId;
    const userTenant = (req as any).tenantId;
    const eventId = parseInt(req.params.id);

    if (!userId || !userTenant) {
      return res.status(403).json({
        status: 'error',
        message: 'User ID or tenant information not found in authentication token'
      });
    }

    if (!eventId || isNaN(eventId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid event ID provided'
      });
    }

    // Validate request body
    const {
      status = 'processed',
      processor = 'flowgram.ai',
      metadata = null
    } = req.body;

    const allowedStatuses = ['processed', 'failed', 'skipped', 'in_progress'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    // Verify event exists in user's tenant schema
    const eventCheck = await sequelize.query(`
      SELECT id, event_type, aggregate_id
      FROM "${userTenant}".outbox_events
      WHERE id = :eventId
    `, {
      replacements: { eventId },
      type: QueryTypes.SELECT
    });

    if (eventCheck.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Event not found or not accessible'
      });
    }

    const event = eventCheck[0] as any;

    // Check if user has already acknowledged this event
    const existingAck = await sequelize.query(`
      SELECT id, status, processed_at
      FROM "${userTenant}".event_acknowledgments
      WHERE event_id = :eventId AND user_id = :userId
    `, {
      replacements: { eventId, userId },
      type: QueryTypes.SELECT
    });

    if (existingAck.length > 0) {
      const existing = existingAck[0] as any;
      return res.status(409).json({
        status: 'error',
        message: 'Event already acknowledged by this user',
        existing_acknowledgment: {
          status: existing.status,
          processed_at: existing.processed_at
        }
      });
    }

    // Create acknowledgment record in tenant schema
    const acknowledgmentResult = await sequelize.query(`
      INSERT INTO "${userTenant}".event_acknowledgments
      (event_id, user_id, processor, status, metadata, processed_at)
      VALUES (:eventId, :userId, :processor, :status, :metadata, NOW())
      RETURNING id, processed_at
    `, {
      replacements: {
        eventId,
        userId,
        processor,
        status,
        metadata: metadata ? JSON.stringify(metadata) : null
      },
      type: QueryTypes.INSERT
    });

    const acknowledgment = (acknowledgmentResult as any)[0][0];

    res.status(200).json({
      status: 'success',
      message: 'Event acknowledged successfully',
      acknowledgment: {
        id: acknowledgment.id,
        event_id: eventId,
        user_id: userId,
        processor,
        status,
        processed_at: acknowledgment.processed_at,
        metadata
      },
      event: {
        id: event.id,
        event_type: event.event_type,
        aggregate_id: event.aggregate_id
      }
    });

  } catch (error) {
    console.error('Event acknowledgment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to acknowledge event',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;