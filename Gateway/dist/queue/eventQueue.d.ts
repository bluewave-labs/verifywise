/**
 * Event Queue - File-based durable event queue
 * Based on spec: docs/SPEC.md Section 7
 *
 * Uses append-only log file for durability with periodic compaction.
 * Events are written immediately to disk, then batched for sending.
 */
import { GatewayEvent } from '../types/events.types';
export declare class EventQueue {
    private walPath;
    private sentPath;
    private events;
    private sentIds;
    private nextId;
    private flushInterval;
    private flushIntervalMs;
    private batchSize;
    private verifyWiseUrl;
    private writeStream;
    /**
     * Initialize the file-based queue
     */
    initialize(): void;
    /**
     * Load sent event IDs from disk
     */
    private loadSentIds;
    /**
     * Load events from write-ahead log
     */
    private loadFromWal;
    /**
     * Enqueue an event
     */
    enqueue(event: GatewayEvent): void;
    /**
     * Get queue statistics
     */
    getStats(): {
        pending: number;
        total: number;
        oldestPendingAgeMs: number | null;
    };
    /**
     * Flush pending events to VerifyWise
     */
    flush(): Promise<number>;
    /**
     * Start periodic flush
     */
    private startFlushInterval;
    /**
     * Compact the WAL file (remove sent events)
     */
    compact(): void;
    /**
     * Close the queue
     */
    close(): void;
}
export declare const eventQueue: EventQueue;
//# sourceMappingURL=eventQueue.d.ts.map