/**
 * @fileoverview Outbox Manager Service
 *
 * **Purpose:**
 * Manages the lifecycle of the OutboxEventProcessor and provides a simplified
 * interface for the main application to interact with the outbox system.
 * This service acts as an adapter between Sequelize (used by the main app)
 * and the native PostgreSQL Pool required by OutboxEventProcessor.
 *
 * **Architecture Role:**
 * - Service Layer: Bridges application startup/shutdown with outbox processing
 * - Resource Management: Handles database connection pooling for outbox operations
 * - Feature Flag Support: Enables safe deployment with configurable processing
 * - Health Monitoring: Provides status checks for operational visibility
 *
 * **FlowGram Integration:**
 * This manager ensures the outbox system is ready to collect events that
 * FlowGram will consume. It provides health checks and statistics that
 * FlowGram can use to monitor the event collection pipeline.
 *
 * **Production Considerations:**
 * - Uses separate connection pool to avoid interference with main app queries
 * - Graceful shutdown prevents event loss during deployments
 * - Feature flag allows disabling processing without code changes
 * - Health checks enable monitoring and alerting integration
 *
 * @module services/outboxManager
 * @version 1.0.0
 * @created 2025-01-06
 */

import { Pool } from 'pg';
import { OutboxEventProcessor } from './outboxEventProcessor';

/**
 * Outbox Manager Service Class
 *
 * **Responsibilities:**
 * - Lifecycle management for outbox event processing
 * - Database connection pool management for outbox operations
 * - Feature flag support for safe deployment and rollback
 * - Health monitoring and operational statistics
 *
 * **Usage Pattern:**
 * ```typescript
 * // In main application startup
 * await outboxManager.initialize();
 *
 * // In shutdown handler
 * await outboxManager.shutdown();
 * ```
 *
 * **Environment Configuration:**
 * - ENABLE_OUTBOX_PROCESSING: Set to 'true' to enable processing
 * - NODE_ENV: Automatically enables in 'development' mode
 * - DATABASE_URL: PostgreSQL connection string for outbox operations
 */
export class OutboxManager {
  /** The outbox event processor instance */
  private processor?: OutboxEventProcessor;

  /** Dedicated database connection pool for outbox operations */
  private pool?: Pool;

  /** Feature flag indicating if outbox processing is enabled */
  private isEnabled: boolean;

  /**
   * Initialize OutboxManager with feature flag detection
   *
   * **Configuration Logic:**
   * - Enabled if ENABLE_OUTBOX_PROCESSING=true (production control)
   * - Enabled if NODE_ENV=development (developer convenience)
   * - Disabled by default for safety
   */
  constructor() {
    // Feature flag for enabling/disabling outbox processing
    this.isEnabled = process.env.ENABLE_OUTBOX_PROCESSING === 'true' || process.env.NODE_ENV === 'development';
  }

  /**
   * Initialize the outbox manager with database connection
   *
   * **Initialization Process:**
   * 1. Check feature flag - exit early if disabled
   * 2. Create dedicated PostgreSQL connection pool
   * 3. Test database connectivity with simple query
   * 4. Initialize and start the event processor
   * 5. Begin LISTEN/NOTIFY monitoring
   *
   * **Connection Pool Configuration:**
   * - max: 5 connections (small pool to avoid resource contention)
   * - idleTimeoutMillis: 30s (cleanup idle connections)
   * - connectionTimeoutMillis: 10s (fail fast on connection issues)
   *
   * **FlowGram Integration Impact:**
   * Once initialized, the outbox system begins collecting events
   * that FlowGram can consume via database polling or monitoring APIs.
   *
   * @throws {Error} Database connection failures or processor startup errors
   */
  async initialize(): Promise<void> {
    if (!this.isEnabled) {
      console.log('📦 Outbox processing disabled via configuration');
      return;
    }

    try {
      // Create a dedicated connection pool for outbox processing
      // Use same database configuration as main application
      const databaseConfig = process.env.DATABASE_URL ? {
        connectionString: process.env.DATABASE_URL,
      } : {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
      };

      this.pool = new Pool({
        ...databaseConfig,
        max: 5, // Small pool for outbox processing
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      // Initialize the processor
      this.processor = new OutboxEventProcessor(this.pool);
      await this.processor.start();

      console.log('✅ Outbox Manager initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Outbox Manager:', error);
      throw error;
    }
  }

  /**
   * Gracefully shutdown the outbox manager
   *
   * **Shutdown Process:**
   * 1. Stop the event processor (completes current events)
   * 2. Close LISTEN/NOTIFY connections
   * 3. Drain and close connection pool
   * 4. Ensure no resource leaks
   *
   * **Production Safety:**
   * - Waits for in-flight events to complete processing
   * - Closes database connections to prevent resource leaks
   * - Safe to call multiple times (idempotent)
   * - Returns quickly if outbox is disabled
   *
   * **Deployment Integration:**
   * Called during application shutdown to ensure clean termination
   * before container/process restart in deployment pipelines.
   */
  async shutdown(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    console.log('🛑 Shutting down Outbox Manager...');

    try {
      // Shutdown the processor first
      if (this.processor) {
        await this.processor.shutdown();
      }

      // Close the connection pool
      if (this.pool) {
        await this.pool.end();
      }

      console.log('✅ Outbox Manager shutdown complete');

    } catch (error) {
      console.error('❌ Error during Outbox Manager shutdown:', error);
    }
  }

  /**
   * Get health status of outbox processing
   *
   * **Health Check Levels:**
   * - 'disabled': Feature flag turned off (expected state)
   * - 'unhealthy': Database connectivity or processor issues
   * - 'healthy': All systems operational and processing events
   *
   * **FlowGram Monitoring Integration:**
   * FlowGram can call this endpoint to verify that VerifyWise
   * is actively collecting events before attempting to poll them.
   *
   * **Monitoring Integration:**
   * This method provides the foundation for health check endpoints
   * that can be integrated with monitoring systems (DataDog, New Relic, etc.)
   *
   * @returns Health status with details for debugging
   */
  async getHealthStatus(): Promise<{ status: 'healthy' | 'unhealthy' | 'disabled'; details: any }> {
    if (!this.isEnabled) {
      return { status: 'disabled', details: { reason: 'Feature disabled via configuration' } };
    }

    if (!this.processor) {
      return { status: 'unhealthy', details: { reason: 'Processor not initialized' } };
    }

    try {
      return await this.processor.healthCheck();
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Get processing statistics
   *
   * **Available Statistics:**
   * - Event processing counts and rates
   * - Retry attempts and failure rates
   * - LISTEN/NOTIFY connection status
   * - Database connection pool metrics
   *
   * **FlowGram Analytics Integration:**
   * These statistics help FlowGram understand the volume and
   * reliability of events being collected for workflow processing.
   *
   * **Operational Visibility:**
   * Used by monitoring APIs to provide operational insights
   * into outbox system performance and throughput.
   *
   * @returns Processing statistics object
   */
  getStats(): any {
    if (!this.isEnabled || !this.processor) {
      return { enabled: false };
    }

    return {
      enabled: true,
      ...this.processor.getStats()
    };
  }

  /**
   * Check if outbox processing is enabled
   *
   * **Feature Flag Query:**
   * Provides a simple way for other services to check if outbox
   * processing is active without triggering initialization.
   *
   * **Use Cases:**
   * - Conditional monitoring setup
   * - FlowGram integration status checks
   * - API endpoint availability decisions
   *
   * @returns true if outbox processing is enabled
   */
  isOutboxEnabled(): boolean {
    return this.isEnabled;
  }
}

/**
 * Singleton OutboxManager Instance
 *
 * **Singleton Pattern:**
 * Ensures only one outbox manager exists per application instance,
 * preventing multiple competing event processors and connection pools.
 *
 * **Usage in Application:**
 * ```typescript
 * import { outboxManager } from './services/outboxManager';
 *
 * // In application startup
 * await outboxManager.initialize();
 *
 * // In health check endpoint
 * const health = await outboxManager.getHealthStatus();
 *
 * // In application shutdown
 * await outboxManager.shutdown();
 * ```
 *
 * **FlowGram Integration:**
 * FlowGram services import this singleton to check health status
 * and ensure the event collection system is operational.
 */
export const outboxManager = new OutboxManager();