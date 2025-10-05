/**
 * @fileoverview Outbox Manager Service
 *
 * Manages the lifecycle of the OutboxEventProcessor and provides a simplified
 * interface for the main application. This service adapts between Sequelize
 * and the native PostgreSQL Pool required by OutboxEventProcessor.
 *
 * @module services/outboxManager
 */

import { Pool } from 'pg';
import { OutboxEventProcessor } from './outboxEventProcessor';

export class OutboxManager {
  private processor?: OutboxEventProcessor;
  private pool?: Pool;
  private isEnabled: boolean;

  constructor() {
    // Feature flag for enabling/disabling outbox processing
    this.isEnabled = process.env.ENABLE_OUTBOX_PROCESSING === 'true' || process.env.NODE_ENV === 'development';
  }

  /**
   * Initialize the outbox manager with database connection
   */
  async initialize(): Promise<void> {
    if (!this.isEnabled) {
      console.log('📦 Outbox processing disabled via configuration');
      return;
    }

    try {
      // Create a dedicated connection pool for outbox processing
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
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
   */
  isOutboxEnabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const outboxManager = new OutboxManager();