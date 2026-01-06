"use strict";
/**
 * Event Queue - SQLite-based durable event queue
 * Based on spec: docs/SPEC.md Section 7, 8.2
 *
 * Uses SQLite with WAL mode for durability and performance.
 * Events are written synchronously to guarantee durability before HTTP response.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventQueue = exports.EventQueue = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const configManager_1 = require("../config/configManager");
const QUEUE_DIR = process.env.QUEUE_DIR || './data/queue';
const DB_FILE = 'events.db';
// Max retries before moving to dead letter queue
const MAX_RETRIES = 10;
// Max age before discarding (24 hours)
const MAX_EVENT_AGE_MS = 24 * 60 * 60 * 1000;
// Default max queue size
const DEFAULT_MAX_EVENTS = 50000;
const DEFAULT_MAX_SIZE_MB = 512;
class EventQueue {
    constructor() {
        this.db = null;
        this.dbPath = '';
        this.flushInterval = null;
        this.flushIntervalMs = 5000; // 5 seconds
        this.batchSize = 100;
        this.ingestServiceUrl = process.env.INGEST_SERVICE_URL || 'http://localhost:4000';
        this.gatewayId = process.env.GATEWAY_ID || `gateway-${Date.now()}`;
        // Prepared statements for performance
        this.insertStmt = null;
        this.selectPendingStmt = null;
        this.markSentStmt = null;
        this.deleteStmt = null;
        this.countStmt = null;
        this.oldestStmt = null;
        this.moveToDeadLetterStmt = null;
        this.incrementRetryStmt = null;
    }
    /**
     * Initialize the SQLite-based queue
     */
    initialize() {
        // Ensure queue directory exists
        if (!fs_1.default.existsSync(QUEUE_DIR)) {
            fs_1.default.mkdirSync(QUEUE_DIR, { recursive: true });
        }
        this.dbPath = path_1.default.join(QUEUE_DIR, DB_FILE);
        // Open database with WAL mode as per spec Section 8.2.3
        this.db = new better_sqlite3_1.default(this.dbPath);
        // Configure for durability and performance
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('synchronous = NORMAL');
        this.db.pragma('cache_size = 10000');
        this.db.pragma('temp_store = MEMORY');
        // Create tables if not exist
        this.createTables();
        // Prepare statements
        this.prepareStatements();
        // Start flush interval
        this.startFlushInterval();
        const stats = this.getStats();
        console.log(`Event queue initialized: ${this.dbPath}`);
        console.log(`  Pending events: ${stats.pending}`);
    }
    /**
     * Create database tables
     */
    createTables() {
        if (!this.db)
            return;
        // Main events table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        correlation_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        retry_count INTEGER DEFAULT 0,
        sent INTEGER DEFAULT 0,
        sent_at INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_events_sent ON events(sent, created_at);
      CREATE INDEX IF NOT EXISTS idx_events_correlation ON events(correlation_id);
    `);
        // Dead letter table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS dead_letter (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        original_id INTEGER NOT NULL,
        correlation_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        retry_count INTEGER NOT NULL,
        dead_letter_reason TEXT NOT NULL,
        dead_lettered_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_dead_letter_correlation ON dead_letter(correlation_id);
    `);
    }
    /**
     * Prepare SQL statements for performance
     */
    prepareStatements() {
        if (!this.db)
            return;
        this.insertStmt = this.db.prepare(`
      INSERT INTO events (correlation_id, event_type, payload, created_at, retry_count, sent)
      VALUES (?, ?, ?, ?, 0, 0)
    `);
        this.selectPendingStmt = this.db.prepare(`
      SELECT id, correlation_id, event_type, payload, created_at, retry_count
      FROM events
      WHERE sent = 0
      ORDER BY created_at ASC
      LIMIT ?
    `);
        this.markSentStmt = this.db.prepare(`
      UPDATE events SET sent = 1, sent_at = ? WHERE id = ?
    `);
        this.deleteStmt = this.db.prepare(`
      DELETE FROM events WHERE id = ?
    `);
        this.countStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM events WHERE sent = 0
    `);
        this.oldestStmt = this.db.prepare(`
      SELECT MIN(created_at) as oldest FROM events WHERE sent = 0
    `);
        this.moveToDeadLetterStmt = this.db.prepare(`
      INSERT INTO dead_letter (original_id, correlation_id, event_type, payload, created_at, retry_count, dead_letter_reason, dead_lettered_at)
      SELECT id, correlation_id, event_type, payload, created_at, retry_count, ?, ?
      FROM events WHERE id = ?
    `);
        this.incrementRetryStmt = this.db.prepare(`
      UPDATE events SET retry_count = retry_count + 1 WHERE id = ?
    `);
    }
    /**
     * Check if queue is at capacity (backpressure check)
     * Returns true if queue can accept more events
     */
    canAccept() {
        const settings = configManager_1.configManager.getGatewaySettings();
        const maxEvents = settings.queue_max_events || DEFAULT_MAX_EVENTS;
        const stats = this.getStats();
        return stats.pending < maxEvents;
    }
    /**
     * Get current queue capacity percentage (0-100)
     */
    getCapacityPercent() {
        const settings = configManager_1.configManager.getGatewaySettings();
        const maxEvents = settings.queue_max_events || DEFAULT_MAX_EVENTS;
        const stats = this.getStats();
        return Math.round((stats.pending / maxEvents) * 100);
    }
    /**
     * Enqueue an event - SYNCHRONOUS for durability guarantee
     * Event is written to SQLite before this method returns
     */
    enqueue(event) {
        if (!this.db || !this.insertStmt) {
            console.error('Event queue not initialized');
            return;
        }
        // Synchronous insert - guarantees durability before returning
        this.insertStmt.run(event.correlation_id, event.event_type, JSON.stringify(event), Date.now());
    }
    /**
     * Enqueue multiple events in a transaction
     */
    enqueueBatch(events) {
        if (!this.db || !this.insertStmt) {
            console.error('Event queue not initialized');
            return;
        }
        const insertMany = this.db.transaction((evts) => {
            for (const event of evts) {
                this.insertStmt.run(event.correlation_id, event.event_type, JSON.stringify(event), Date.now());
            }
        });
        insertMany(events);
    }
    /**
     * Get queue statistics
     */
    getStats() {
        if (!this.db || !this.countStmt || !this.oldestStmt) {
            return { pending: 0, total: 0, oldestPendingAgeMs: null };
        }
        const countResult = this.countStmt.get();
        const oldestResult = this.oldestStmt.get();
        return {
            pending: countResult.count,
            total: countResult.count, // For now, just pending count
            oldestPendingAgeMs: oldestResult.oldest ? Date.now() - oldestResult.oldest : null,
        };
    }
    /**
     * Move an event to dead letter queue
     */
    moveToDeadLetter(eventId, reason) {
        if (!this.db || !this.moveToDeadLetterStmt || !this.deleteStmt)
            return;
        const moveAndDelete = this.db.transaction(() => {
            this.moveToDeadLetterStmt.run(reason, Date.now(), eventId);
            this.deleteStmt.run(eventId);
        });
        moveAndDelete();
    }
    /**
     * Flush pending events to VerifyWise
     */
    async flush() {
        if (!this.db || !this.selectPendingStmt) {
            return 0;
        }
        const now = Date.now();
        // Get batch of pending events
        const batch = this.selectPendingStmt.all(this.batchSize);
        if (batch.length === 0) {
            return 0;
        }
        // Process expired and max-retried events
        const toSend = [];
        for (const row of batch) {
            const age = now - row.created_at;
            if (age > MAX_EVENT_AGE_MS) {
                this.moveToDeadLetter(row.id, 'expired');
                console.warn(`Event ${row.id} expired after ${Math.round(age / 1000)}s`);
            }
            else if (row.retry_count >= MAX_RETRIES) {
                this.moveToDeadLetter(row.id, 'max_retries_exceeded');
                console.warn(`Event ${row.id} moved to dead letter after ${row.retry_count} retries`);
            }
            else {
                toSend.push(row);
            }
        }
        if (toSend.length === 0) {
            return 0;
        }
        try {
            // Format events for IngestService (spec format)
            const events = toSend.map(row => {
                const parsedPayload = JSON.parse(row.payload);
                return {
                    queue_id: row.id,
                    correlation_id: row.correlation_id,
                    event_type: row.event_type,
                    payload: parsedPayload,
                    created_at: row.created_at
                };
            });
            // Send to IngestService
            const ingestToken = process.env.INGEST_TOKEN || '';
            const response = await axios_1.default.post(`${this.ingestServiceUrl}/internal/logs/ingest`, {
                gateway_id: this.gatewayId,
                events
            }, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ingestToken}`,
                },
            });
            if (response.status === 200 && response.data?.acknowledged_ids) {
                const acknowledgedIds = response.data.acknowledged_ids;
                const sentIds = new Set(acknowledgedIds);
                const allSentIds = toSend.map(row => row.id);
                // FIXED C2: Handle partial failures - some events acknowledged, some not
                const unacknowledgedIds = allSentIds.filter(id => !sentIds.has(id));
                // Mark acknowledged events as sent
                if (acknowledgedIds.length > 0) {
                    const markSent = this.db.transaction((ids) => {
                        const sentAt = Date.now();
                        for (const id of ids) {
                            this.markSentStmt.run(sentAt, id);
                        }
                    });
                    markSent(acknowledgedIds);
                }
                // Increment retry count for unacknowledged events (partial failure)
                if (unacknowledgedIds.length > 0) {
                    console.warn(`Partial flush: ${acknowledgedIds.length}/${allSentIds.length} events acknowledged. ` +
                        `${unacknowledgedIds.length} events will be retried.`);
                    const incrementRetries = this.db.transaction((ids) => {
                        for (const id of ids) {
                            this.incrementRetryStmt.run(id);
                        }
                    });
                    incrementRetries(unacknowledgedIds);
                    // Log any explicit errors from IngestService
                    if (response.data?.errors && Array.isArray(response.data.errors)) {
                        for (const err of response.data.errors) {
                            console.error(`Event ${err.queue_id} failed: ${err.error}`);
                        }
                    }
                }
                return acknowledgedIds.length;
            }
            else {
                // Unexpected response format - treat as full failure
                console.error('Unexpected IngestService response:', response.status, response.data);
                const incrementRetries = this.db.transaction((ids) => {
                    for (const id of ids) {
                        this.incrementRetryStmt.run(id);
                    }
                });
                incrementRetries(toSend.map(row => row.id));
            }
        }
        catch (error) {
            // Log error but don't throw - events will be retried
            if (error.code !== 'ECONNREFUSED') {
                console.error('Failed to flush events to IngestService:', error.message);
            }
            // Increment retry count for all events in the batch
            const incrementRetries = this.db.transaction((ids) => {
                for (const id of ids) {
                    this.incrementRetryStmt.run(id);
                }
            });
            incrementRetries(toSend.map(row => row.id));
        }
        return 0;
    }
    /**
     * Start periodic flush
     */
    startFlushInterval() {
        this.flushInterval = setInterval(async () => {
            try {
                const flushed = await this.flush();
                if (flushed > 0) {
                    console.log(`Flushed ${flushed} events to IngestService`);
                }
            }
            catch (error) {
                console.error('Flush interval error:', error);
            }
        }, this.flushIntervalMs);
    }
    /**
     * Compact the database - remove old sent events
     */
    compact() {
        if (!this.db)
            return;
        // Delete sent events older than 1 hour (they're already in VerifyWise)
        const cutoff = Date.now() - 60 * 60 * 1000;
        this.db.prepare('DELETE FROM events WHERE sent = 1 AND sent_at < ?').run(cutoff);
        // Vacuum to reclaim space
        this.db.exec('VACUUM');
    }
    /**
     * Close the queue - waits for final flush
     */
    async close() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
        // Final flush attempt - await it!
        try {
            const flushed = await this.flush();
            if (flushed > 0) {
                console.log(`Final flush: ${flushed} events sent`);
            }
        }
        catch (error) {
            console.error('Final flush failed:', error);
        }
        // Checkpoint WAL to main database
        if (this.db) {
            try {
                this.db.pragma('wal_checkpoint(TRUNCATE)');
            }
            catch (e) {
                console.error('WAL checkpoint failed:', e);
            }
            this.db.close();
            this.db = null;
        }
        console.log('Event queue closed');
    }
}
exports.EventQueue = EventQueue;
// Singleton instance
exports.eventQueue = new EventQueue();
//# sourceMappingURL=eventQueue.js.map