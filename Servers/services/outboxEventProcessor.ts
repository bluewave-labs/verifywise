/**
 * @fileoverview Simple Outbox Event Processor Service
 *
 * Core service that processes database change events captured by the outbox pattern.
 * Designed as a pure event collection system for external workflow engines.
 *
 * **Architecture Overview:**
 * ```
 * DB Change → Trigger → Outbox Event → Event Processor → Log Collection → External System
 * ```
 *
 * **Key Features:**
 * - **Pure Collection**: No side effects, only logs events for external consumption
 * - **Multi-tenant Isolation**: Schema-based tenant separation with secure processing
 * - **Basic Retry Logic**: Simple retry mechanism for transient failures
 * - **Real-time Delivery**: PostgreSQL LISTEN/NOTIFY + polling safety net
 * - **Rich Event Data**: old_data, new_data, changed_fields for workflow decisions
 *
 * **Event Types Processed:**
 * - `vendors_update`: Status changes, assignee changes, name changes
 * - `vendors_insert`: New vendor creation
 * - `projectrisks_update`: Risk level changes, deadline changes, status changes
 * - `controls_eu_update`: Control status changes
 * - `tasks_update`: Task status changes
 *
 * **Configuration:**
 * - `OUTBOX_BATCH_SIZE`: Number of events to process per batch (default: 10)
 * - `OUTBOX_POLL_INTERVAL`: Polling interval in ms (default: 5000)
 * - `OUTBOX_RECONNECT_DELAY`: Reconnection delay in ms (default: 5000)
 * - `ENABLE_OUTBOX_PROCESSING`: Enable/disable processing (default: true in dev)
 *
 * @module services/outboxEventProcessor
 * @version 1.0.0
 * @created 2025-01-06
 */

import { Client, Pool, PoolClient } from 'pg';

/**
 * Outbox Event Interface
 *
 * Represents a database change event captured for external processing.
 * Used by external workflow engines for automation and decision making.
 */
interface OutboxEvent {
  /** Unique event identifier */
  id: string;

  /** Tenant hash for multi-tenant isolation (e.g., 'a4ayc80OGd') */
  tenant: string;

  /** Event type indicating the operation (e.g., 'vendors_update', 'projectrisks_update') */
  event_type: string;

  /** ID of the entity that was changed (e.g., vendor ID, risk ID) */
  aggregate_id: string;

  /** Type of entity that was changed (e.g., 'vendors', 'projectrisks') */
  aggregate_type: string;

  /** Rich event payload containing all change information */
  payload: {
    /** Database operation that triggered the event */
    operation: 'INSERT' | 'UPDATE' | 'DELETE';

    /** Database table name */
    table: string;

    /** Event timestamp */
    timestamp: string;

    /** Tenant schema name */
    schema: string;

    /** Previous data state (for UPDATE and DELETE operations) */
    old_data?: Record<string, any>;

    /** Current data state (for INSERT and UPDATE operations) */
    new_data?: Record<string, any>;

    /** Changed fields with new values (for UPDATE operations) */
    changed_fields?: Record<string, any>;
  };

  /** Number of processing attempts made */
  attempts: number;

  /** Maximum number of retry attempts before giving up */
  max_attempts: number;

  /** When this event was created */
  created_at: string;

  /** When this event was successfully processed (null if pending) */
  processed_at: string | null;

  /** When this event becomes available for processing */
  available_at: string;
}

/**
 * Simple Outbox Event Processor
 *
 * Processes outbox events with pure logging - no side effects.
 * External systems can consume events via API endpoints.
 */
export class OutboxEventProcessor {
  private pool: Pool;
  private isRunning: boolean = false;
  private listenClient?: PoolClient;
  private pollInterval?: NodeJS.Timeout;
  private reconnectTimeout?: NodeJS.Timeout;
  private stats = {
    processed: 0,
    failed: 0,
    startTime: new Date()
  };

  private readonly BATCH_SIZE = parseInt(process.env.OUTBOX_BATCH_SIZE || '10');
  private readonly POLL_INTERVAL = parseInt(process.env.OUTBOX_POLL_INTERVAL || '5000');
  private readonly RECONNECT_DELAY = parseInt(process.env.OUTBOX_RECONNECT_DELAY || '5000');

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Start the event processor
   *
   * Initializes LISTEN/NOTIFY and polling mechanisms for event processing.
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('📦 Outbox processor already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting Outbox Event Processor...');

    try {
      // Start LISTEN/NOTIFY for real-time processing
      await this.startListening();

      // Start polling as backup mechanism
      this.startPolling();

      console.log('✅ Outbox Event Processor started successfully');
    } catch (error) {
      console.error('❌ Failed to start Outbox Event Processor:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the event processor gracefully
   */
  async shutdown(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Shutting down Outbox Event Processor...');
    this.isRunning = false;

    // Clear intervals and timeouts
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Close LISTEN client
    if (this.listenClient) {
      try {
        this.listenClient.release();
      } catch (error) {
        console.warn('Warning: Error closing LISTEN client:', error);
      }
    }

    console.log('✅ Outbox Event Processor shutdown complete');
  }

  /**
   * Get processor statistics
   */
  getStats() {
    const uptime = Date.now() - this.stats.startTime.getTime();
    return {
      isRunning: this.isRunning,
      processed: this.stats.processed,
      failed: this.stats.failed,
      uptime_ms: uptime,
      uptime_human: `${Math.floor(uptime / 1000)}s`
    };
  }

  /**
   * Health check for the processor
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      // Test database connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      return {
        status: 'healthy',
        details: {
          isRunning: this.isRunning,
          hasListenClient: !!this.listenClient,
          stats: this.getStats()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          isRunning: this.isRunning
        }
      };
    }
  }

  /**
   * Start PostgreSQL LISTEN/NOTIFY for real-time event processing
   */
  private async startListening(): Promise<void> {
    try {
      this.listenClient = await this.pool.connect();

      // Listen for outbox notifications
      await this.listenClient.query('LISTEN outbox_wakeup');

      this.listenClient.on('notification', (msg) => {
        if (msg.channel === 'outbox_wakeup') {
          console.log(`🔔 Received notification: ${msg.payload}`);
          this.processAvailableEvents().catch(error => {
            console.error('Error processing notification:', error);
          });
        }
      });

      this.listenClient.on('error', (error) => {
        console.error('❌ LISTEN client error:', error);
        this.reconnectListen();
      });

      console.log('👂 LISTEN/NOTIFY connection established');
    } catch (error) {
      console.error('❌ Failed to start LISTEN/NOTIFY:', error);
      this.reconnectListen();
    }
  }

  /**
   * Reconnect LISTEN client after failure
   */
  private reconnectListen(): void {
    if (!this.isRunning) return;

    if (this.listenClient) {
      this.listenClient.removeAllListeners();
      this.listenClient.release();
      this.listenClient = undefined;
    }

    console.log(`🔄 Reconnecting LISTEN client in ${this.RECONNECT_DELAY}ms...`);
    this.reconnectTimeout = setTimeout(() => {
      this.startListening().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, this.RECONNECT_DELAY);
  }

  /**
   * Start polling mechanism as backup
   */
  private startPolling(): void {
    this.pollInterval = setInterval(() => {
      if (this.isRunning) {
        this.processAvailableEvents().catch(error => {
          console.error('Polling error:', error);
        });
      }
    }, this.POLL_INTERVAL);

    console.log(`⏰ Polling started (interval: ${this.POLL_INTERVAL}ms)`);
  }

  /**
   * Process available events from the outbox
   */
  private async processAvailableEvents(): Promise<void> {
    if (!this.isRunning) return;

    const client = await this.pool.connect();
    try {
      // Get unprocessed events using FOR UPDATE SKIP LOCKED for concurrency safety
      const query = `
        SELECT id, tenant, event_type, aggregate_id, aggregate_type, payload,
               attempts, max_attempts, created_at, processed_at, available_at
        FROM outbox_events
        WHERE processed_at IS NULL
          AND attempts < max_attempts
          AND available_at <= NOW()
        ORDER BY created_at ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      `;

      const result = await client.query(query, [this.BATCH_SIZE]);
      const events = result.rows as OutboxEvent[];

      if (events.length === 0) {
        return; // No events to process
      }

      console.log(`📋 Processing ${events.length} events...`);

      // Process each event
      for (const event of events) {
        try {
          await this.processEvent(event, client);
          this.stats.processed++;
        } catch (error) {
          console.error(`❌ Failed to process event ${event.id}:`, error);
          await this.handleEventFailure(event, error, client);
          this.stats.failed++;
        }
      }

    } finally {
      client.release();
    }
  }

  /**
   * Process a single event (pure logging - no side effects)
   */
  private async processEvent(event: OutboxEvent, client: PoolClient): Promise<void> {
    console.log(`📦 Processing event: ${event.event_type} for ${event.aggregate_type}:${event.aggregate_id} (tenant: ${event.tenant})`);

    // Log event based on type for external system consumption
    switch (event.event_type) {
      case 'vendors_insert':
        this.logVendorInsert(event);
        break;
      case 'vendors_update':
        this.logVendorUpdate(event);
        break;
      case 'projectrisks_update':
        this.logRiskUpdate(event);
        break;
      case 'controls_eu_update':
        this.logControlUpdate(event);
        break;
      case 'tasks_update':
        this.logTaskUpdate(event);
        break;
      default:
        this.logGenericEvent(event);
    }

    // Mark event as processed
    await client.query(
      'UPDATE outbox_events SET processed_at = NOW() WHERE id = $1',
      [event.id]
    );

    console.log(`✅ Event ${event.id} processed successfully`);
  }

  /**
   * Handle event processing failure
   */
  private async handleEventFailure(event: OutboxEvent, error: any, client: PoolClient): Promise<void> {
    const newAttempts = event.attempts + 1;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Calculate exponential backoff delay
    const delayMinutes = Math.min(Math.pow(2, newAttempts), 60); // Max 60 minutes
    const availableAt = new Date(Date.now() + delayMinutes * 60 * 1000);

    await client.query(`
      UPDATE outbox_events
      SET attempts = $1, available_at = $2
      WHERE id = $3
    `, [newAttempts, availableAt, event.id]);

    if (newAttempts >= event.max_attempts) {
      console.error(`💀 Event ${event.id} exceeded max attempts (${event.max_attempts}), giving up`);
    } else {
      console.warn(`⚠️ Event ${event.id} failed (attempt ${newAttempts}/${event.max_attempts}), retrying in ${delayMinutes} minutes`);
    }
  }

  /**
   * Log vendor insert events
   */
  private logVendorInsert(event: OutboxEvent): void {
    const { new_data } = event.payload;

    console.log(`📝 New vendor created: ${new_data?.vendor_name} (ID: ${event.aggregate_id})`);
    console.log(`📊 Event available for external workflow processing`);
    console.log(`🏢 Tenant: ${event.tenant}, Created by: ${new_data?.created_by || 'Unknown'}`);
  }

  /**
   * Log vendor update events
   */
  private logVendorUpdate(event: OutboxEvent): void {
    const { old_data, new_data, changed_fields } = event.payload;

    if (changed_fields && 'review_status' in changed_fields) {
      console.log(`📦 Vendor ${event.aggregate_id} status changed: ${old_data?.review_status} → ${new_data?.review_status}`);
    }

    if (changed_fields && 'assignee' in changed_fields) {
      console.log(`👤 Vendor ${event.aggregate_id} assignee changed: ${old_data?.assignee} → ${new_data?.assignee}`);
    }

    console.log(`📊 Event available for external workflow processing`);
    console.log(`🏢 Tenant: ${event.tenant}, Vendor: ${new_data?.vendor_name}`);
  }

  /**
   * Log risk update events
   */
  private logRiskUpdate(event: OutboxEvent): void {
    const { old_data, new_data, changed_fields } = event.payload;

    if (changed_fields && 'risk_level_autocalculated' in changed_fields) {
      console.log(`⚠️ Risk ${event.aggregate_id} level changed: ${old_data?.risk_level_autocalculated} → ${new_data?.risk_level_autocalculated}`);
    }

    if (changed_fields && 'deadline' in changed_fields) {
      console.log(`📅 Risk ${event.aggregate_id} deadline changed: ${old_data?.deadline} → ${new_data?.deadline}`);
    }

    console.log(`📊 Event available for external workflow processing`);
    console.log(`🏢 Tenant: ${event.tenant}`);
  }

  /**
   * Log control update events
   */
  private logControlUpdate(event: OutboxEvent): void {
    const { old_data, new_data, changed_fields } = event.payload;

    if (changed_fields && 'status' in changed_fields) {
      console.log(`🎛️ Control ${event.aggregate_id} status changed: ${old_data?.status} → ${new_data?.status}`);
    }

    console.log(`📊 Event available for external workflow processing`);
    console.log(`🏢 Tenant: ${event.tenant}`);
  }

  /**
   * Log task update events
   */
  private logTaskUpdate(event: OutboxEvent): void {
    const { old_data, new_data, changed_fields } = event.payload;

    if (changed_fields && 'status' in changed_fields) {
      console.log(`✅ Task ${event.aggregate_id} status changed: ${old_data?.status} → ${new_data?.status}`);
    }

    console.log(`📊 Event available for external workflow processing`);
    console.log(`🏢 Tenant: ${event.tenant}`);
  }

  /**
   * Log generic events
   */
  private logGenericEvent(event: OutboxEvent): void {
    console.log(`📋 Generic event: ${event.event_type} for ${event.aggregate_type}:${event.aggregate_id}`);
    console.log(`📊 Event available for external workflow processing`);
    console.log(`🏢 Tenant: ${event.tenant}`);
  }
}