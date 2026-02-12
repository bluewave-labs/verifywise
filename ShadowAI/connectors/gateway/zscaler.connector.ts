/**
 * Zscaler Connector - Fetches AI-related web traffic logs from
 * Zscaler Internet Access (ZIA) via the Nanolog Streaming Service
 * or Web Insights API.
 */

import { BaseConnector } from "../base.connector";
import { ConnectorTestResult } from "../../types/connector-config";
import { RawEvent } from "../../types/shadow-ai-event";

export class ZscalerConnector extends BaseConnector {
  private cookie: string | null = null;

  async testConnection(): Promise<ConnectorTestResult> {
    const startTime = Date.now();
    try {
      const config = this.config.config;
      if (!config.cloud_url || !config.api_key) {
        return {
          success: false,
          message: "Zscaler cloud URL and API key are required",
          latency_ms: Date.now() - startTime,
        };
      }

      await this.connect();
      return {
        success: true,
        message: "Successfully connected to Zscaler ZIA",
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
    if (!config.cloud_url) throw new Error("Zscaler cloud URL is required");

    // Authenticate with Zscaler
    const response = await fetch(`${config.cloud_url}/api/v1/authenticatedSession`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: config.api_key,
        username: config.api_url, // Using api_url field for username
        password: config.api_secret,
      }),
    });

    if (!response.ok) throw new Error("Zscaler authentication failed");

    // Extract JSESSIONID from response cookies
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/JSESSIONID=([^;]+)/);
      this.cookie = match ? `JSESSIONID=${match[1]}` : null;
    }

    // Fall back to API token if no session cookie
    if (!this.cookie && config.api_token) {
      this.cookie = `JSESSIONID=${config.api_token}`;
    }
  }

  async fetchEvents(since: Date): Promise<RawEvent[]> {
    if (!this.cookie) throw new Error("Not connected to Zscaler");

    const config = this.config.config;
    const startTime = Math.floor(since.getTime() / 1000);
    const endTime = Math.floor(Date.now() / 1000);

    // Fetch web transaction logs
    const response = await fetch(
      `${config.cloud_url}/api/v1/webApplicationRules?startTime=${startTime}&endTime=${endTime}&page=1&pageSize=10000`,
      {
        headers: {
          Cookie: this.cookie,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) throw new Error(`Zscaler API error: ${response.status}`);

    const data = await response.json();
    const events: RawEvent[] = (data.list || data.webTransactionLogs || []).map(
      (log: any) => ({
        source_type: "zscaler",
        raw_data: {
          timestamp: log.datetime || log.timestamp,
          user: log.login || log.user,
          department: log.department,
          url: log.url || log.hostname,
          hostname: log.hostname,
          action: log.action || log.urlFilteringAction,
          source_ip: log.clientPublicIP || log.sourceip,
          bytes_in: log.responsebytes,
          bytes_out: log.requestbytes,
          ...log,
        },
        received_at: new Date(),
      })
    );

    return events;
  }

  async disconnect(): Promise<void> {
    if (this.cookie) {
      try {
        const config = this.config.config;
        await fetch(`${config.cloud_url}/api/v1/authenticatedSession`, {
          method: "DELETE",
          headers: { Cookie: this.cookie },
        });
      } catch {
        // Ignore disconnect errors
      }
      this.cookie = null;
    }
  }
}
