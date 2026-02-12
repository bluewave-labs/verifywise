/**
 * Microsoft Sentinel Connector - Fetches AI-related events from
 * Azure Sentinel via the Log Analytics API.
 */

import { BaseConnector } from "../base.connector";
import { ConnectorTestResult } from "../../types/connector-config";
import { RawEvent } from "../../types/shadow-ai-event";

export class SentinelConnector extends BaseConnector {
  private accessToken: string | null = null;

  async testConnection(): Promise<ConnectorTestResult> {
    const startTime = Date.now();
    try {
      const config = this.config.config;
      if (!config.workspace_id || !config.api_key) {
        return {
          success: false,
          message: "Workspace ID and API key are required",
          latency_ms: Date.now() - startTime,
        };
      }

      // Test with a simple query
      await this.connect();
      return {
        success: true,
        message: "Successfully connected to Microsoft Sentinel",
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
    if (!config.workspace_id) throw new Error("Sentinel workspace ID is required");

    // Use provided token or authenticate via client credentials
    if (config.auth_token) {
      this.accessToken = config.auth_token as string;
    } else {
      // OAuth2 client credentials flow for Azure
      const tenantId = config.tenant_id || "common";
      const response = await fetch(
        `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "client_credentials",
            client_id: config.api_key as string,
            client_secret: config.api_secret as string,
            scope: "https://api.loganalytics.io/.default",
          }),
        }
      );

      if (!response.ok) throw new Error("Azure AD authentication failed");
      const tokenData = await response.json();
      this.accessToken = tokenData.access_token;
    }
  }

  async fetchEvents(since: Date): Promise<RawEvent[]> {
    if (!this.accessToken) throw new Error("Not connected to Sentinel");

    const config = this.config.config;
    const workspaceId = config.workspace_id;
    const sinceStr = since.toISOString();

    // KQL query for AI-related web traffic
    const query = config.search_query ||
      `CommonSecurityLog
      | where TimeGenerated >= datetime('${sinceStr}')
      | where DestinationHostName has_any ("openai.com", "anthropic.com", "gemini.google.com", "copilot.github.com", "midjourney.com", "claude.ai", "huggingface.co")
      | project TimeGenerated, SourceUserName, SourceIP, DestinationHostName, RequestURL, DeviceAction, Activity
      | take 10000`;

    const response = await fetch(
      `https://api.loganalytics.io/v1/workspaces/${workspaceId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!response.ok) throw new Error(`Sentinel query failed: ${response.status}`);

    const data = await response.json();
    const columns = data.tables?.[0]?.columns || [];
    const rows = data.tables?.[0]?.rows || [];

    const events: RawEvent[] = rows.map((row: any[]) => {
      const rawData: Record<string, unknown> = {};
      columns.forEach((col: any, idx: number) => {
        rawData[col.name] = row[idx];
      });
      return {
        source_type: "sentinel",
        raw_data: rawData,
        received_at: new Date(),
      };
    });

    return events;
  }

  async disconnect(): Promise<void> {
    this.accessToken = null;
  }
}
