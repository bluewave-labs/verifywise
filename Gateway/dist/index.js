"use strict";
/**
 * VerifyWise LLM Gateway - Main Entry Point
 * Based on spec: docs/SPEC.md
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const configManager_1 = require("./config/configManager");
const internal_routes_1 = require("./routes/internal.routes");
const llm_routes_1 = require("./routes/llm.routes");
const auth_middleware_1 = require("./middleware/auth.middleware");
const eventQueue_1 = require("./queue/eventQueue");
const app = (0, express_1.default)();
const PORT = process.env.GATEWAY_PORT || 8080;
const GATEWAY_ID = process.env.GATEWAY_ID || `gateway-${Date.now()}`;
const DEV_MODE = process.env.DEV_MODE === 'true';
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || '';
// CORS configuration - restrict to allowed origins
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin)
            return callback(null, true);
        // Only allow all origins in explicit DEV_MODE
        if (ALLOWED_ORIGINS.length === 0) {
            if (DEV_MODE) {
                return callback(null, true);
            }
            // Production mode without allowed origins - deny
            console.warn('CORS: Rejecting request - no ALLOWED_ORIGINS configured and DEV_MODE not enabled');
            return callback(new Error('CORS not configured - set ALLOWED_ORIGINS or DEV_MODE=true'));
        }
        if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Secret', 'X-Correlation-ID'],
    exposedHeaders: ['X-Correlation-ID'],
    maxAge: 86400, // 24 hours
};
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)(corsOptions));
// Request timeout middleware (2 minutes default)
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '120000', 10);
app.use((req, res, next) => {
    res.setTimeout(REQUEST_TIMEOUT_MS, () => {
        if (!res.headersSent) {
            res.status(408).json({
                error: {
                    code: 'REQUEST_TIMEOUT',
                    message: 'Request timed out',
                },
            });
        }
    });
    next();
});
// Parse JSON bodies with size limit
app.use(express_1.default.json({ limit: '1mb' }));
// Import type augmentation
require("./types/express-augment");
// Attach gateway ID to all requests
app.use((req, res, next) => {
    req.gatewayId = GATEWAY_ID;
    next();
});
// Backpressure middleware - reject requests when queue is at capacity
const backpressureMiddleware = (req, res, next) => {
    if (!eventQueue_1.eventQueue.canAccept()) {
        const capacity = eventQueue_1.eventQueue.getCapacityPercent();
        console.warn(`Backpressure: Queue at ${capacity}% capacity, rejecting request`);
        res.status(429).json({
            error: {
                code: 'QUEUE_FULL',
                message: 'Gateway queue is at capacity. Please retry later.',
                retry_after_seconds: 30,
            },
        });
        return;
    }
    next();
};
// Internal routes (no auth required, no backpressure)
app.use('/internal', internal_routes_1.internalRoutes);
// LLM routes (auth required, with backpressure)
app.use('/v1/llm', backpressureMiddleware, auth_middleware_1.authMiddleware, llm_routes_1.llmRoutes);
// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: {
            code: 'INTERNAL_ERROR',
            message: 'An internal error occurred',
        },
    });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: {
            code: 'NOT_FOUND',
            message: `Route ${req.method} ${req.path} not found`,
        },
    });
});
async function start() {
    console.log('Starting VerifyWise LLM Gateway...');
    console.log(`Gateway ID: ${GATEWAY_ID}`);
    console.log(`DEV_MODE: ${DEV_MODE}`);
    // Validate required environment variables
    if (!DEV_MODE && !INTERNAL_API_SECRET) {
        console.error('FATAL: INTERNAL_API_SECRET must be set in production mode');
        console.error('Set INTERNAL_API_SECRET or enable DEV_MODE=true for development');
        process.exit(1);
    }
    if (DEV_MODE) {
        console.warn('WARNING: Running in DEV_MODE - not for production use!');
        if (ALLOWED_ORIGINS.length === 0) {
            console.warn('WARNING: CORS allows all origins in DEV_MODE');
        }
    }
    // Initialize SQLite queue
    try {
        eventQueue_1.eventQueue.initialize();
        console.log('Event queue initialized');
    }
    catch (error) {
        console.error('Failed to initialize event queue:', error);
        process.exit(1);
    }
    // Load config
    try {
        await configManager_1.configManager.load();
        if (configManager_1.configManager.isLoaded()) {
            console.log(`Config loaded: version ${configManager_1.configManager.getVersion()}`);
        }
        else {
            console.warn('No config loaded - Gateway running in safe mode (will reject all requests)');
        }
    }
    catch (error) {
        console.error('Failed to load config:', error);
        console.warn('Gateway starting in safe mode');
    }
    // Start server
    const server = app.listen(PORT, () => {
        console.log(`Gateway listening on port ${PORT}`);
        console.log('Endpoints:');
        console.log(`  - GET  /internal/health`);
        console.log(`  - GET  /internal/status`);
        console.log(`  - POST /internal/config/push`);
        console.log(`  - POST /v1/llm/chat`);
    });
    // Store server reference for graceful shutdown
    return server;
}
// Graceful shutdown handler
async function shutdown(signal) {
    console.log(`${signal} received, shutting down gracefully...`);
    // Close queue and wait for final flush
    try {
        await eventQueue_1.eventQueue.close();
        console.log('Event queue closed successfully');
    }
    catch (error) {
        console.error('Error closing event queue:', error);
    }
    process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
start();
//# sourceMappingURL=index.js.map