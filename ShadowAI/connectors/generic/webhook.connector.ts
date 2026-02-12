/**
 * Webhook Connector - Accepts pushed events via HTTP webhook.
 * This is the simplest connector type - it receives events from
 * SIEM platforms or security tools that can forward/push events.
 */

import { BaseConnector } from "../base.connector";
import {
  ConnectorTestResult,
} from "../../types/connector-config";
import { RawEvent } from "../../types/shadow-ai-event";

export class WebhookConnector extends BaseConnector {
  private eventBuffer: RawEvent[] = [];

  /**
   * Test connection - webhook connectors are always "ready"
   * since they passively receive events.
   */
  async testConnection(): Promise<ConnectorTestResult> {
    return {
      success: true,
      message: "Webhook connector is ready to receive events",
      events_available: this.eventBuffer.length,
      latency_ms: 0,
    };
  }

  /**
   * Webhook connectors don't poll - they receive events via push.
   * This method returns any buffered events since the given timestamp.
   */
  async fetchEvents(since: Date): Promise<RawEvent[]> {
    const filtered = this.eventBuffer.filter(
      (e) => e.received_at >= since
    );
    // Clear consumed events from buffer
    this.eventBuffer = this.eventBuffer.filter(
      (e) => e.received_at < since
    );
    return filtered;
  }

  /**
   * No-op for webhook connectors.
   */
  async connect(): Promise<void> {
    // Webhook connectors don't maintain persistent connections
  }

  /**
   * No-op for webhook connectors.
   */
  async disconnect(): Promise<void> {
    // Nothing to disconnect
  }

  /**
   * Receive a single event pushed via webhook.
   */
  receiveEvent(rawData: Record<string, unknown>, sourceType?: string): RawEvent {
    const event: RawEvent = {
      source_type: sourceType || this.config.type,
      raw_data: rawData,
      received_at: new Date(),
    };
    this.eventBuffer.push(event);
    return event;
  }

  /**
   * Receive a batch of events pushed via webhook.
   */
  receiveBatch(events: Record<string, unknown>[], sourceType?: string): RawEvent[] {
    return events.map((rawData) => this.receiveEvent(rawData, sourceType));
  }

  /**
   * Validate the webhook secret if configured.
   */
  validateSecret(providedSecret: string): boolean {
    const configuredSecret = this.config.config?.webhook_secret;
    if (!configuredSecret) return true; // No secret configured, accept all
    return providedSecret === configuredSecret;
  }

  /**
   * Get the number of buffered events.
   */
  getBufferSize(): number {
    return this.eventBuffer.length;
  }
}
