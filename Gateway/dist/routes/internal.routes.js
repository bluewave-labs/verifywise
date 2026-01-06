"use strict";
/**
 * Internal Routes - Health, status, and config management
 * Based on spec: docs/SPEC.md Sections 3.1, 4.4
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.internalRoutes = void 0;
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const configManager_1 = require("../config/configManager");
const databaseConfig_1 = require("../config/databaseConfig");
const eventQueue_1 = require("../queue/eventQueue");
require("../types/express-augment");
exports.internalRoutes = (0, express_1.Router)();
// Secret for internal API authentication (should be set in env)
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || '';
const DEV_MODE = process.env.DEV_MODE === 'true';
/**
 * Middleware to authenticate internal API requests
 * Requires X-Internal-Secret header with valid secret
 */
function internalAuthMiddleware(req, res, next) {
    // Skip auth for health endpoint (needed for load balancer health checks)
    if (req.path === '/health') {
        return next();
    }
    // Skip auth in DEV_MODE
    if (DEV_MODE) {
        return next();
    }
    // Require INTERNAL_API_SECRET to be configured for sensitive endpoints
    if (!INTERNAL_API_SECRET) {
        console.error('INTERNAL_API_SECRET not configured - internal routes are disabled');
        res.status(503).json({
            error: {
                code: 'SERVICE_UNAVAILABLE',
                message: 'Internal API not configured',
            },
        });
        return;
    }
    const providedSecret = req.headers['x-internal-secret'];
    if (!providedSecret) {
        res.status(401).json({
            error: {
                code: 'UNAUTHORIZED',
                message: 'Missing X-Internal-Secret header',
            },
        });
        return;
    }
    // Constant-time comparison to prevent timing attacks
    try {
        const secretBuffer = Buffer.from(INTERNAL_API_SECRET);
        const providedBuffer = Buffer.from(providedSecret);
        if (secretBuffer.length !== providedBuffer.length ||
            !crypto_1.default.timingSafeEqual(secretBuffer, providedBuffer)) {
            res.status(401).json({
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Invalid internal secret',
                },
            });
            return;
        }
    }
    catch {
        res.status(401).json({
            error: {
                code: 'UNAUTHORIZED',
                message: 'Invalid internal secret',
            },
        });
        return;
    }
    next();
}
// Apply auth middleware to all internal routes
exports.internalRoutes.use(internalAuthMiddleware);
/**
 * GET /internal/health
 * Basic health check - returns 200 if gateway is running
 */
exports.internalRoutes.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});
/**
 * GET /internal/status
 * Detailed status including config version, queue stats
 */
exports.internalRoutes.get('/status', (req, res) => {
    const queueStats = eventQueue_1.eventQueue.getStats();
    res.json({
        status: 'ok',
        gateway_id: req.gatewayId,
        config: {
            loaded: configManager_1.configManager.isLoaded(),
            version: configManager_1.configManager.getVersion(),
        },
        queue: {
            pending_events: queueStats.pending,
            total_events: queueStats.total,
            oldest_pending_age_ms: queueStats.oldestPendingAgeMs,
        },
        uptime_seconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
    });
});
/**
 * POST /internal/config/push
 * Receive new config snapshot from VerifyWise
 */
exports.internalRoutes.post('/config/push', async (req, res) => {
    try {
        const result = await configManager_1.configManager.push(req.body);
        res.json(result);
    }
    catch (error) {
        console.error('Config push failed:', error?.message || String(error));
        // Zod validation errors
        if (error.name === 'ZodError') {
            res.status(400).json({
                error: {
                    code: 'INVALID_CONFIG',
                    message: 'Config validation failed',
                    details: error.errors,
                },
            });
            return;
        }
        // Cross-reference errors
        if (error.message?.includes('references unknown')) {
            res.status(400).json({
                error: {
                    code: 'INVALID_CONFIG',
                    message: error.message,
                },
            });
            return;
        }
        res.status(500).json({
            error: {
                code: 'CONFIG_PUSH_FAILED',
                message: 'Failed to apply config',
            },
        });
    }
});
/**
 * POST /internal/queue/flush
 * Manually trigger queue flush (for testing/debugging)
 */
exports.internalRoutes.post('/queue/flush', async (req, res) => {
    try {
        const flushed = await eventQueue_1.eventQueue.flush();
        res.json({
            status: 'ok',
            events_flushed: flushed,
        });
    }
    catch (error) {
        console.error('Queue flush failed:', error);
        res.status(500).json({
            error: {
                code: 'FLUSH_FAILED',
                message: 'Failed to flush queue',
            },
        });
    }
});
/**
 * POST /internal/config/database
 * Update database configuration and forward to IngestService
 */
exports.internalRoutes.post('/config/database', async (req, res) => {
    try {
        const dbConfig = req.body;
        // Validate required fields
        if (!dbConfig.host || !dbConfig.port || !dbConfig.database || !dbConfig.username) {
            res.status(400).json({
                error: {
                    code: 'INVALID_CONFIG',
                    message: 'Missing required fields: host, port, database, username',
                },
            });
            return;
        }
        console.log(`Received database config update: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
        // Update config and forward to IngestService
        const result = await databaseConfig_1.databaseConfigManager.updateDatabaseConfig(dbConfig);
        if (result.gateway && result.ingestService) {
            res.json({
                status: 'ok',
                message: 'Database configuration updated',
                gateway: result.gateway,
                ingestService: result.ingestService,
            });
        }
        else {
            res.status(result.gateway ? 207 : 500).json({
                status: 'partial',
                message: result.error || 'Partial update',
                gateway: result.gateway,
                ingestService: result.ingestService,
                error: result.error,
            });
        }
    }
    catch (error) {
        console.error('Database config update failed:', error);
        res.status(500).json({
            error: {
                code: 'CONFIG_UPDATE_FAILED',
                message: error instanceof Error ? error.message : 'Failed to update database config',
            },
        });
    }
});
/**
 * POST /internal/config/database/test
 * Test database connection via IngestService
 */
exports.internalRoutes.post('/config/database/test', async (req, res) => {
    try {
        const dbConfig = req.body;
        // Validate required fields
        if (!dbConfig.host || !dbConfig.port || !dbConfig.database || !dbConfig.username) {
            res.status(400).json({
                error: {
                    code: 'INVALID_CONFIG',
                    message: 'Missing required fields: host, port, database, username',
                },
            });
            return;
        }
        console.log(`Testing database connection: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
        const result = await databaseConfig_1.databaseConfigManager.testDatabaseConnection(dbConfig);
        res.json({
            success: result.success,
            message: result.success ? 'Connection successful' : result.error,
        });
    }
    catch (error) {
        console.error('Database connection test failed:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Connection test failed',
        });
    }
});
/**
 * GET /internal/config/database
 * Get current database configuration (without password)
 */
exports.internalRoutes.get('/config/database', (req, res) => {
    try {
        const configState = databaseConfig_1.databaseConfigManager.getConfigState();
        res.json({
            status: 'ok',
            ...configState,
        });
    }
    catch (error) {
        res.status(500).json({
            error: {
                code: 'CONFIG_READ_FAILED',
                message: error instanceof Error ? error.message : 'Failed to read config',
            },
        });
    }
});
//# sourceMappingURL=internal.routes.js.map