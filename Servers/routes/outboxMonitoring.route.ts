/**
 * @fileoverview Outbox Event Monitoring Routes
 *
 * Provides observability and monitoring endpoints for the outbox event system.
 * These endpoints allow administrators to monitor the health, performance,
 * and status of background event processing.
 *
 * @module routes/outboxMonitoring
 */

import express from "express";
import { outboxManager } from "../services/outboxManager";
import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";
import authenticateJWT from "../middleware/auth.middleware";

const router = express.Router();

/**
 * GET /api/outbox/health
 * Health check endpoint for outbox processing
 */
router.get("/health", async (req, res) => {
  try {
    const health = await outboxManager.getHealthStatus();

    const statusCode = health.status === 'healthy' ? 200 :
                      health.status === 'disabled' ? 200 : 503;

    res.status(statusCode).json({
      status: health.status,
      timestamp: new Date().toISOString(),
      details: health.details
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to check outbox health',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/outbox/stats
 * Processing statistics endpoint
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
 */
router.get("/events", authenticateJWT, async (req, res) => {
  try {
    // Extract tenant from authenticated JWT token - enforce tenant isolation
    const userTenant = (req as any).tenantId;

    if (!userTenant) {
      return res.status(403).json({
        status: 'error',
        message: 'Tenant information not found in authentication token'
      });
    }

    const {
      event_type,
      aggregate_type,
      status = 'all', // 'pending', 'processed', 'failed', 'all'
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

    // Build WHERE conditions - ALWAYS filter by authenticated user's tenant
    const conditions: string[] = ['tenant = :tenant'];
    const replacements: any = {
      limit: limitNum,
      offset: offsetNum,
      tenant: userTenant // Force tenant to be the authenticated user's tenant
    };

    if (event_type) {
      conditions.push('event_type = :event_type');
      replacements.event_type = event_type;
    }

    if (aggregate_type) {
      conditions.push('aggregate_type = :aggregate_type');
      replacements.aggregate_type = aggregate_type;
    }

    // Status filters
    switch (status) {
      case 'pending':
        conditions.push('processed_at IS NULL AND attempts < max_attempts');
        break;
      case 'processed':
        conditions.push('processed_at IS NOT NULL');
        break;
      case 'failed':
        conditions.push('processed_at IS NULL AND attempts >= max_attempts');
        break;
      // 'all' - no additional conditions
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const orderClause = `ORDER BY ${orderBy} ${orderDir}`;

    // Get events
    const eventsQuery = `
      SELECT
        id, tenant, event_type, aggregate_id, aggregate_type,
        attempts, max_attempts, available_at, created_at, processed_at,
        CASE
          WHEN processed_at IS NOT NULL THEN 'processed'
          WHEN attempts >= max_attempts THEN 'failed'
          ELSE 'pending'
        END as status
      FROM outbox_events
      ${whereClause}
      ${orderClause}
      LIMIT :limit OFFSET :offset
    `;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM outbox_events
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
 * GET /api/outbox/metrics
 * Aggregated metrics for dashboard views
 */
router.get("/metrics", authenticateJWT, async (req, res) => {
  try {
    // Extract tenant from authenticated JWT token - enforce tenant isolation
    const userTenant = (req as any).tenantId;

    if (!userTenant) {
      return res.status(403).json({
        status: 'error',
        message: 'Tenant information not found in authentication token'
      });
    }

    const timeRange = req.query.range || '24h'; // 1h, 24h, 7d, 30d

    let timeFilter = '';
    switch (timeRange) {
      case '1h':
        timeFilter = "created_at >= NOW() - INTERVAL '1 hour' AND tenant = :tenant";
        break;
      case '24h':
        timeFilter = "created_at >= NOW() - INTERVAL '24 hours' AND tenant = :tenant";
        break;
      case '7d':
        timeFilter = "created_at >= NOW() - INTERVAL '7 days' AND tenant = :tenant";
        break;
      case '30d':
        timeFilter = "created_at >= NOW() - INTERVAL '30 days' AND tenant = :tenant";
        break;
      default:
        timeFilter = "created_at >= NOW() - INTERVAL '24 hours' AND tenant = :tenant";
    }

    // Summary metrics
    const summaryQuery = `
      SELECT
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE processed_at IS NOT NULL) as processed_events,
        COUNT(*) FILTER (WHERE processed_at IS NULL AND attempts < max_attempts) as pending_events,
        COUNT(*) FILTER (WHERE processed_at IS NULL AND attempts >= max_attempts) as failed_events,
        AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) FILTER (WHERE processed_at IS NOT NULL) as avg_processing_time_seconds
      FROM outbox_events
      WHERE ${timeFilter}
    `;

    // Events by tenant
    const tenantQuery = `
      SELECT
        tenant,
        COUNT(*) as events,
        COUNT(*) FILTER (WHERE processed_at IS NOT NULL) as processed,
        COUNT(*) FILTER (WHERE processed_at IS NULL AND attempts < max_attempts) as pending,
        COUNT(*) FILTER (WHERE processed_at IS NULL AND attempts >= max_attempts) as failed
      FROM outbox_events
      WHERE ${timeFilter}
      GROUP BY tenant
      ORDER BY events DESC
      LIMIT 10
    `;

    // Events by type
    const typeQuery = `
      SELECT
        event_type,
        COUNT(*) as events,
        COUNT(*) FILTER (WHERE processed_at IS NOT NULL) as processed,
        AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) FILTER (WHERE processed_at IS NOT NULL) as avg_processing_time
      FROM outbox_events
      WHERE ${timeFilter}
      GROUP BY event_type
      ORDER BY events DESC
    `;

    // Hourly distribution (for charts)
    const hourlyQuery = `
      SELECT
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as events,
        COUNT(*) FILTER (WHERE processed_at IS NOT NULL) as processed,
        COUNT(*) FILTER (WHERE processed_at IS NULL AND attempts >= max_attempts) as failed
      FROM outbox_events
      WHERE ${timeFilter}
      GROUP BY hour
      ORDER BY hour DESC
      LIMIT 48
    `;

    const queryReplacements = { tenant: userTenant };

    const [summary, byTenant, byType, hourly] = await Promise.all([
      sequelize.query(summaryQuery, { replacements: queryReplacements, type: QueryTypes.SELECT }),
      sequelize.query(tenantQuery, { replacements: queryReplacements, type: QueryTypes.SELECT }),
      sequelize.query(typeQuery, { replacements: queryReplacements, type: QueryTypes.SELECT }),
      sequelize.query(hourlyQuery, { replacements: queryReplacements, type: QueryTypes.SELECT })
    ]);

    res.json({
      timeRange,
      timestamp: new Date().toISOString(),
      summary: summary[0] || {},
      byTenant,
      byType,
      hourly: hourly.reverse() // Show oldest to newest for time series
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get outbox metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/outbox/cleanup
 * Manual cleanup of old processed events
 */
router.post("/cleanup", authenticateJWT, async (req, res) => {
  try {
    // Extract tenant from authenticated JWT token - enforce tenant isolation
    const userTenant = (req as any).tenantId;

    if (!userTenant) {
      return res.status(403).json({
        status: 'error',
        message: 'Tenant information not found in authentication token'
      });
    }

    const { older_than_days = 90 } = req.body;

    // Validate input
    const days = parseInt(older_than_days);
    if (isNaN(days) || days < 1 || days > 365) {
      return res.status(400).json({
        status: 'error',
        message: 'older_than_days must be between 1 and 365'
      });
    }

    const cleanupQuery = `
      DELETE FROM outbox_events
      WHERE processed_at IS NOT NULL
        AND created_at < NOW() - INTERVAL ':days days'
        AND tenant = :tenant
    `;

    const result = await sequelize.query(cleanupQuery, {
      replacements: { days, tenant: userTenant },
      type: QueryTypes.DELETE
    });

    res.json({
      status: 'success',
      message: `Cleaned up events older than ${days} days`,
      deleted_count: Array.isArray(result) ? result[1] : 0
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to cleanup old events',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;