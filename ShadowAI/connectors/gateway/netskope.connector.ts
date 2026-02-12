/**
 * Netskope Connector - Fetches AI-related cloud application events
 * from Netskope CASB via the REST API v2.
 */

import { BaseConnector } from "../base.connector";
import { ConnectorTestResult } from "../../types/connector-config";
import { RawEvent } from "../../types/shadow-ai-event";

export class NetskopeConnector extends BaseConnector {
  async testConnection(): Promise<ConnectorTestResult> {
    const startTime = Date.now();
    try {
      const config = this.config.config;
      if (!config.cloud_url || !config.api_token) {
        return {
          success: false,
          message: "Netskope tenant URL and API token are required",
          latency_ms: Date.now() - startTime,
        };
      }

      // Test connection with a simple API call
      const response = await fetch(
        `${config.cloud_url}/api/v2/events/data/application?limit=1`,
        {
          headers: {
            "Netskope-Api-Token": config.api_token as string,
            Accept: "application/json",
          },
        }
      );

      return {
        success: response.ok,
        message: response.ok
          ? "Successfully connected to Netskope"
          : `Netskope connection failed: ${response.status}`,
        latency_ms: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${(error as Error).message}`,
        latency_ms: Date.now() - startTime,
      };
    }
  }

  async connect(): Promise<void> {
    const config = this.config.config;
    if (!config.cloud_url) throw new Error("Netskope tenant URL is required");
    if (!config.api_token) throw new Error("Netskope API token is required");
  }

  async fetchEvents(since: Date): Promise<RawEvent[]> {
    const config = this.config.config;
    const startTime = Math.floor(since.getTime() / 1000);
    const endTime = Math.floor(Date.now() / 1000);

    const allEvents: RawEvent[] = [];
    let skip = 0;
    const limit = 5000;
    let hasMore = true;

    while (hasMore) {
      // Fetch application events with AI-related filter
      const query = config.search_query
        ? `&query=${encodeURIComponent(config.search_query as string)}`
        : "";

      const response = await fetch(
        `${config.cloud_url}/api/v2/events/data/application?starttime=${startTime}&endtime=${endTime}&limit=${limit}&skip=${skip}${query}`,
        {
          headers: {
            "Netskope-Api-Token": config.api_token as string,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) throw new Error(`Netskope API error: ${response.status}`);

      const data = await response.json();
      const events = data.data || [];

      for (const event of events) {
        allEvents.push({
          source_type: "netskope",
          raw_data: {
            timestamp: event.timestamp,
            user: event.user || event.ur_normalized,
            department: event.org_unit,
            url: event.url || event.site,
            hostname: event.hostname || event.dst_host,
            action: event.activity || event.action,
            source_ip: event.srcip || event.src_location,
            app_name: event.app,
            app_category: event.appcategory,
            category: event.category,
            cci: event.cci, // Cloud Confidence Index
            device: event.device,
            traffic_type: event.traffic_type,
            ...event,
          },
          received_at: new Date(),
        });
      }

      skip += events.length;
      hasMore = events.length === limit;

      // Safety limit
      if (allEvents.length >= 50000) break;
    }

    return allEvents;
  }

  async disconnect(): Promise<void> {
    // Netskope uses stateless API token auth; no session to clean up
  }
}
