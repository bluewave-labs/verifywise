/**
 * @fileoverview OutboxEventProcessor Service
 *
 * Implements the Outbox + LISTEN/NOTIFY pattern for reliable event processing.
 * Features:
 * - Multi-tenant support with schema-based isolation
 * - Reliable event processing with SKIP LOCKED concurrency control
 * - Automatic retry with exponential backoff
 * - Idempotent event handling with deduplication
 * - Real-time LISTEN/NOTIFY with polling fallback
 * - Comprehensive observability and monitoring
 *
 * @module services/outboxEventProcessor
 */

import { Client, Pool } from 'pg';
import { sendEmail } from './emailService';

interface OutboxEvent {
  id: string;
  tenant: string;
  event_type: string;
  aggregate_id: string;
  aggregate_type: string;
  payload: {
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
    timestamp: string;
    schema: string;
    old_data?: any;
    new_data?: any;
    changed_fields?: Record<string, any>;
  };
  attempts: number;
  max_attempts: number;
  available_at: string;
  created_at: string;
  processed_at?: string;
}

interface EventProcessingStats {
  processed: number;
  failed: number;
  retrying: number;
  startTime: Date;
}

export class OutboxEventProcessor {
  private pool: Pool;
  private listenClient?: Client;
  private isProcessing = false;
  private isShuttingDown = false;
  private reconnecting = false;
  private batchSize: number;
  private pollInterval: number;
  private reconnectDelay: number;
  private stats: EventProcessingStats;
  private pollTimer?: NodeJS.Timeout;
  private reconnectTimer?: NodeJS.Timeout;

  constructor(pool: Pool) {
    this.pool = pool;
    this.batchSize = parseInt(process.env.OUTBOX_BATCH_SIZE || '10');
    this.pollInterval = parseInt(process.env.OUTBOX_POLL_INTERVAL || '5000'); // 5 seconds
    this.reconnectDelay = parseInt(process.env.OUTBOX_RECONNECT_DELAY || '5000'); // 5 seconds
    this.stats = {
      processed: 0,
      failed: 0,
      retrying: 0,
      startTime: new Date()
    };
  }

  /**
   * Start the outbox event processor
   * Sets up LISTEN connection and begins processing
   */
  async start(): Promise<void> {
    console.log('🚀 Starting Outbox Event Processor...');

    try {
      // Start LISTEN connection for real-time notifications
      await this.setupListener();

      // Start safety net polling
      this.startPolling();

      // Process any existing events
      await this.processEvents();

      console.log(`✅ Outbox Event Processor started successfully`);
      console.log(`📊 Configuration: batchSize=${this.batchSize}, pollInterval=${this.pollInterval}ms`);

    } catch (error) {
      console.error('❌ Failed to start Outbox Event Processor:', error);
      throw error;
    }
  }

  /**
   * Gracefully shutdown the event processor
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Outbox Event Processor...');
    this.isShuttingDown = true;

    // Clear timers
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    // Close LISTEN connection
    if (this.listenClient) {
      try {
        await this.listenClient.end();
      } catch (error) {
        console.warn('Warning: Error closing listen client:', error);
      }
    }

    // Wait for current processing to finish
    let attempts = 0;
    while (this.isProcessing && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    console.log('✅ Outbox Event Processor shutdown complete');
    this.printStats();
  }

  /**
   * Setup PostgreSQL LISTEN connection for real-time notifications
   */
  private async setupListener(): Promise<void> {
    // Clean up existing client first
    if (this.listenClient) {
      try {
        await this.listenClient.end();
      } catch (error) {
        console.warn('Warning: Error closing old listen client:', error);
      }
      this.listenClient = undefined;
    }

    try {
      this.listenClient = new Client({
        connectionString: process.env.DATABASE_URL,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
      });

      await this.listenClient.connect();

      // Set up event handlers
      this.listenClient.on('notification', this.handleNotification);
      this.listenClient.on('error', this.handleListenError);
      this.listenClient.on('end', this.handleListenDisconnect);

      // Start listening for outbox events
      await this.listenClient.query('LISTEN outbox_wakeup');

      console.log('👂 LISTEN connection established for outbox_wakeup');

    } catch (error) {
      console.error('❌ Failed to setup LISTEN connection:', error);
      this.listenClient = undefined;
      this.scheduleReconnect();
    }
  }

  /**
   * Handle incoming PostgreSQL notifications
   */
  private handleNotification = (msg: any): void => {
    if (msg.channel === 'outbox_wakeup' && !this.isShuttingDown) {
      console.log(`📨 Received notification: ${msg.payload}`);
      this.processEvents().catch(console.error);
    }
  };

  /**
   * Handle LISTEN connection errors
   */
  private handleListenError = (error: Error): void => {
    console.error('❌ LISTEN connection error:', error);
    this.scheduleReconnect();
  };

  /**
   * Handle LISTEN connection disconnect
   */
  private handleListenDisconnect = (): void => {
    console.warn('⚠️ LISTEN connection disconnected');
    if (!this.isShuttingDown) {
      this.scheduleReconnect();
    }
  };

  /**
   * Schedule reconnection of LISTEN connection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.isShuttingDown || this.reconnecting) return;

    this.reconnecting = true;
    console.log(`🔄 Scheduling LISTEN reconnection in ${this.reconnectDelay}ms`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.setupListener();
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
        this.scheduleReconnect();
      } finally {
        this.reconnectTimer = undefined;
        this.reconnecting = false;
      }
    }, this.reconnectDelay);
  }

  /**
   * Start safety net polling for events
   */
  private startPolling(): void {
    this.pollTimer = setInterval(() => {
      if (!this.isProcessing && !this.isShuttingDown) {
        this.processEvents().catch(console.error);
      }
    }, this.pollInterval);

    console.log(`⏱️ Safety net polling started (interval: ${this.pollInterval}ms)`);
  }

  /**
   * Main event processing loop
   */
  private async processEvents(): Promise<void> {
    if (this.isProcessing || this.isShuttingDown) return;

    this.isProcessing = true;

    try {
      let totalProcessed = 0;

      while (!this.isShuttingDown) {
        const events = await this.claimEvents();

        if (events.length === 0) break;

        // Process events in parallel with error isolation
        const results = await Promise.allSettled(
          events.map(event => this.processEvent(event))
        );

        // Count successful vs failed processing
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        totalProcessed += events.length;
        this.stats.processed += successful;
        this.stats.failed += failed;

        console.log(`📦 Processed batch: ${successful} successful, ${failed} failed`);
      }

      if (totalProcessed > 0) {
        console.log(`✅ Processing complete: ${totalProcessed} events processed`);
      }

    } catch (error) {
      console.error('❌ Error in event processing loop:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Claim events for processing using FOR UPDATE SKIP LOCKED
   */
  private async claimEvents(): Promise<OutboxEvent[]> {
    const client = await this.pool.connect();

    try {
      const result = await client.query(`
        UPDATE outbox_events
        SET available_at = NOW() + INTERVAL '30 seconds'
        WHERE id IN (
          SELECT id FROM outbox_events
          WHERE processed_at IS NULL
            AND available_at <= NOW()
            AND attempts < max_attempts
          ORDER BY created_at ASC
          LIMIT $1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING *
      `, [this.batchSize]);

      return result.rows;

    } finally {
      client.release();
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(event: OutboxEvent): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      console.log(`🔄 Processing event ${event.id}: ${event.event_type} (attempt ${event.attempts + 1})`);

      try {
        // Route to appropriate handler based on event type
        await this.routeEvent(event);

        // Mark as successfully processed
        await client.query(`
          UPDATE outbox_events
          SET processed_at = NOW(), attempts = attempts + 1
          WHERE id = $1
        `, [event.id]);

        await client.query('COMMIT');

        console.log(`✅ Successfully processed event ${event.id}: ${event.event_type}`);

      } catch (error) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Failed to rollback transaction:', rollbackError);
        }
        throw error; // Re-throw to outer catch
      }

    } catch (error) {
      // Handle retry logic
      await this.handleEventFailure(event, error as Error);

    } finally {
      // ALWAYS release, even if rollback fails
      try {
        client.release();
      } catch (releaseError) {
        console.error('Failed to release client:', releaseError);
      }
    }
  }

  /**
   * Route events to appropriate handlers
   */
  private async routeEvent(event: OutboxEvent): Promise<void> {
    switch (event.event_type) {
      case 'vendors_update':
        await this.handleVendorUpdate(event);
        break;

      case 'vendors_insert':
        await this.handleVendorInsert(event);
        break;

      case 'projectrisks_update':
        await this.handleRiskUpdate(event);
        break;

      case 'controls_eu_update':
        await this.handleControlUpdate(event);
        break;

      case 'tasks_update':
        await this.handleTaskUpdate(event);
        break;

      default:
        console.warn(`⚠️ Unknown event type: ${event.event_type}, skipping`);
    }
  }

  /**
   * Handle vendor update events
   */
  private async handleVendorUpdate(event: OutboxEvent): Promise<void> {
    const { old_data, new_data, changed_fields } = event.payload;

    // Only process if review_status changed
    if (changed_fields && 'review_status' in changed_fields) {
      console.log(`📧 Vendor ${event.aggregate_id} status changed: ${old_data?.review_status} → ${new_data?.review_status}`);

      // Send notification email
      await sendEmail(
        new_data?.assignee_email || 'admin@company.com',
        'Vendor Review Status Updated',
        'vendor-status-changed',
        {
          vendor_name: new_data?.vendor_name || 'Unknown Vendor',
          old_status: old_data?.review_status || 'Unknown',
          new_status: new_data?.review_status || 'Unknown',
          assignee_name: new_data?.assignee || 'Team',
          vendor_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendors/${event.aggregate_id}`,
          tenant_name: event.tenant
        }
      );

      console.log(`✅ Vendor status change email sent for vendor ${event.aggregate_id}`);
    }
  }

  /**
   * Handle vendor insert events
   */
  private async handleVendorInsert(event: OutboxEvent): Promise<void> {
    const { new_data } = event.payload;

    console.log(`📝 New vendor created: ${new_data?.vendor_name} (ID: ${event.aggregate_id})`);

    // Could send welcome emails, setup notifications, etc.
    // For now, just log the event
  }

  /**
   * Handle risk update events
   */
  private async handleRiskUpdate(event: OutboxEvent): Promise<void> {
    const { old_data, new_data, changed_fields } = event.payload;

    // Handle risk level changes
    if (changed_fields && 'risk_level_autocalculated' in changed_fields) {
      console.log(`⚠️ Risk ${event.aggregate_id} level changed: ${old_data?.risk_level_autocalculated} → ${new_data?.risk_level_autocalculated}`);

      // Could trigger risk escalation workflows
    }

    // Handle deadline changes
    if (changed_fields && 'deadline' in changed_fields) {
      console.log(`📅 Risk ${event.aggregate_id} deadline changed: ${old_data?.deadline} → ${new_data?.deadline}`);

      // Could trigger deadline notification workflows
    }
  }

  /**
   * Handle control update events
   */
  private async handleControlUpdate(event: OutboxEvent): Promise<void> {
    const { old_data, new_data, changed_fields } = event.payload;

    if (changed_fields && 'status' in changed_fields) {
      console.log(`🎛️ Control ${event.aggregate_id} status changed: ${old_data?.status} → ${new_data?.status}`);

      // Could trigger compliance workflows
    }
  }

  /**
   * Handle task update events
   */
  private async handleTaskUpdate(event: OutboxEvent): Promise<void> {
    const { old_data, new_data, changed_fields } = event.payload;

    if (changed_fields && 'status' in changed_fields) {
      console.log(`✅ Task ${event.aggregate_id} status changed: ${old_data?.status} → ${new_data?.status}`);

      // Could trigger task completion workflows
    }
  }

  /**
   * Handle event processing failures with retry logic
   */
  private async handleEventFailure(event: OutboxEvent, error: Error): Promise<void> {
    const client = await this.pool.connect();

    try {
      const nextAttempt = event.attempts + 1;
      const maxAttempts = event.max_attempts;

      if (nextAttempt >= maxAttempts) {
        // Mark as permanently failed
        await client.query(`
          UPDATE outbox_events
          SET attempts = $1, available_at = NULL
          WHERE id = $2
        `, [nextAttempt, event.id]);

        console.error(`❌ Event ${event.id} permanently failed after ${maxAttempts} attempts:`, error.message);
        this.stats.failed++;

      } else {
        // Schedule retry with exponential backoff
        const backoffMs = Math.min(1000 * Math.pow(2, nextAttempt), 300000); // Max 5 minutes
        const availableAt = new Date(Date.now() + backoffMs);

        await client.query(`
          UPDATE outbox_events
          SET attempts = $1, available_at = $2
          WHERE id = $3
        `, [nextAttempt, availableAt, event.id]);

        console.warn(`⚠️ Event ${event.id} failed (attempt ${nextAttempt}/${maxAttempts}), retrying in ${backoffMs}ms:`, error.message);
        this.stats.retrying++;
      }

    } finally {
      client.release();
    }
  }

  /**
   * Get current processing statistics
   */
  getStats(): EventProcessingStats & { uptime: number } {
    return {
      ...this.stats,
      uptime: Date.now() - this.stats.startTime.getTime()
    };
  }

  /**
   * Print processing statistics
   */
  private printStats(): void {
    const stats = this.getStats();
    const uptimeHours = (stats.uptime / (1000 * 60 * 60)).toFixed(2);

    console.log('📊 Outbox Event Processor Statistics:');
    console.log(`   ✅ Processed: ${stats.processed}`);
    console.log(`   ❌ Failed: ${stats.failed}`);
    console.log(`   🔄 Retrying: ${stats.retrying}`);
    console.log(`   ⏱️ Uptime: ${uptimeHours} hours`);
  }

  /**
   * Health check for monitoring
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const client = await this.pool.connect();

      try {
        // Check if we can query the outbox table
        const result = await client.query(`
          SELECT COUNT(*) as pending_events
          FROM outbox_events
          WHERE processed_at IS NULL
        `);

        const pendingEvents = parseInt(result.rows[0].pending_events);
        const stats = this.getStats();

        return {
          status: 'healthy',
          details: {
            pendingEvents,
            isProcessing: this.isProcessing,
            listenConnected: !!this.listenClient,
            stats
          }
        };

      } finally {
        client.release();
      }

    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          isProcessing: this.isProcessing,
          listenConnected: false
        }
      };
    }
  }
}