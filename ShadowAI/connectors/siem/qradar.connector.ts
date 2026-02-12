/**
 * IBM QRadar Connector - Fetches AI-related events from QRadar
 * via the Ariel Query Language (AQL) REST API.
 */

import { BaseConnector } from "../base.connector";
import { ConnectorTestResult } from "../../types/connector-config";
import { RawEvent } from "../../types/shadow-ai-event";

export class QRadarConnector extends BaseConnector {
  async testConnection(): Promise<ConnectorTestResult> {
    const startTime = Date.now();
    try {
      const config = this.config.config;
      if (!config.api_url || !config.auth_token) {
        return {
          success: false,
          message: "API URL and SEC token are required",
          latency_ms: Date.now() - startTime,
        };
      }

      const response = await fetch(`${config.api_url}/api/system/about`, {
        headers: {
          SEC: config.auth_token as string,
          Accept: "application/json",
        },
      });

      return {
        success: response.ok,
        message: response.ok ? "Successfully connected to QRadar" : `QRadar connection failed: ${response.status}`,
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
    if (!config.api_url) throw new Error("QRadar API URL is required");
    if (!config.auth_token) throw new Error("QRadar SEC token is required");
  }

  async fetchEvents(since: Date): Promise<RawEvent[]> {
    const config = this.config.config;
    const sinceEpoch = Math.floor(since.getTime() / 1000);

    // AQL query for AI-related web traffic events
    const aql = config.search_query ||
      `SELECT starttime, sourceip, username, destinationip, destinationport, URL, CATEGORYNAME(highlevelcategory)
       FROM events
       WHERE starttime > ${sinceEpoch}000
       AND (URL LIKE '%openai.com%' OR URL LIKE '%anthropic.com%' OR URL LIKE '%gemini.google.com%'
            OR URL LIKE '%copilot%' OR URL LIKE '%midjourney.com%' OR URL LIKE '%claude.ai%'
            OR URL LIKE '%huggingface.co%')
       LIMIT 10000`;

    // Create search
    const createResponse = await fetch(
      `${config.api_url}/api/ariel/searches`,
      {
        method: "POST",
        headers: {
          SEC: config.auth_token as string,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ query_expression: aql }),
      }
    );

    if (!createResponse.ok) throw new Error("Failed to create QRadar search");
    const searchData = await createResponse.json();
    const searchId = searchData.search_id;

    // Poll for completion
    let status = "EXECUTE";
    let attempts = 0;
    while (status !== "COMPLETED" && status !== "ERROR" && attempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const statusResponse = await fetch(
        `${config.api_url}/api/ariel/searches/${searchId}`,
        {
          headers: {
            SEC: config.auth_token as string,
            Accept: "application/json",
          },
        }
      );
      const statusData = await statusResponse.json();
      status = statusData.status;
      attempts++;
    }

    if (status !== "COMPLETED") throw new Error(`QRadar search did not complete: ${status}`);

    // Fetch results
    const resultsResponse = await fetch(
      `${config.api_url}/api/ariel/searches/${searchId}/results`,
      {
        headers: {
          SEC: config.auth_token as string,
          Accept: "application/json",
        },
      }
    );

    const resultsData = await resultsResponse.json();
    const events: RawEvent[] = (resultsData.events || resultsData.flows || []).map(
      (event: any) => ({
        source_type: "qradar",
        raw_data: event,
        received_at: new Date(),
      })
    );

    return events;
  }

  async disconnect(): Promise<void> {
    // QRadar uses stateless SEC token auth; no session to clean up
  }
}
