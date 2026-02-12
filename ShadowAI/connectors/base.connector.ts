/**
 * Base Connector - Abstract base class for all Shadow AI data source connectors.
 * Each connector implements source-specific logic for connecting to and
 * fetching events from security tools.
 */

import {
  ConnectorConfig,
  ConnectorTestResult,
  ConnectorSyncResult,
} from "../types/connector-config";
import { RawEvent } from "../types/shadow-ai-event";

export abstract class BaseConnector {
  protected config: ConnectorConfig;

  constructor(config: ConnectorConfig) {
    this.config = config;
  }

  /**
   * Test the connection to the data source.
   */
  abstract testConnection(): Promise<ConnectorTestResult>;

  /**
   * Fetch events from the data source since the given timestamp.
   * Returns raw events that need to be normalized.
   */
  abstract fetchEvents(since: Date): Promise<RawEvent[]>;

  /**
   * Connect to the data source (initialize session, authenticate, etc.).
   */
  abstract connect(): Promise<void>;

  /**
   * Disconnect from the data source (cleanup sessions, etc.).
   */
  abstract disconnect(): Promise<void>;

  /**
   * Get the connector's current configuration.
   */
  getConfig(): ConnectorConfig {
    return this.config;
  }

  /**
   * Update the connector's configuration.
   */
  updateConfig(config: Partial<ConnectorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Perform a full sync operation: connect, fetch, disconnect.
   * Returns a sync result summary.
   */
  async sync(since: Date): Promise<ConnectorSyncResult> {
    const startTime = Date.now();
    let eventsIngested = 0;
    let eventsFailed = 0;
    const errors: string[] = [];

    try {
      await this.connect();
      const events = await this.fetchEvents(since);
      eventsIngested = events.length;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(errorMsg);
      eventsFailed = 1;
    } finally {
      try {
        await this.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }

    return {
      success: errors.length === 0,
      events_ingested: eventsIngested,
      events_failed: eventsFailed,
      duration_ms: Date.now() - startTime,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}
