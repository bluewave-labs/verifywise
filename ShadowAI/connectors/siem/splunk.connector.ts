/**
 * Splunk Connector - Fetches AI-related events from Splunk via REST API.
 *
 * Connects to Splunk's search/jobs endpoint to run saved searches
 * or ad-hoc SPL queries filtering for AI tool domains.
 */

import { BaseConnector } from "../base.connector";
import { ConnectorTestResult } from "../../types/connector-config";
import { RawEvent } from "../../types/shadow-ai-event";

export class SplunkConnector extends BaseConnector {
  private sessionKey: string | null = null;

  async testConnection(): Promise<ConnectorTestResult> {
    const startTime = Date.now();
    try {
      const config = this.config.config;
      const url = `${config.api_url}/services/auth/login`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `username=admin&password=${config.api_key}`,
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Splunk authentication failed: ${response.status}`,
          latency_ms: Date.now() - startTime,
        };
      }

      return {
        success: true,
        message: "Successfully connected to Splunk",
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
    if (!config.api_url) throw new Error("Splunk API URL is required");

    // Authenticate and get session key
    if (config.auth_token) {
      this.sessionKey = config.auth_token as string;
    } else if (config.api_key) {
      const response = await fetch(`${config.api_url}/services/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `username=admin&password=${config.api_key}`,
      });

      if (!response.ok) throw new Error("Splunk authentication failed");
      const text = await response.text();
      // Parse session key from XML response
      const match = text.match(/<sessionKey>([^<]+)<\/sessionKey>/);
      this.sessionKey = match ? match[1] : null;
    }
  }

  async fetchEvents(since: Date): Promise<RawEvent[]> {
    if (!this.sessionKey) throw new Error("Not connected to Splunk");

    const config = this.config.config;
    const searchQuery = config.search_query || 'search index=* sourcetype=*proxy* OR sourcetype=*web* | where match(dest, "openai|anthropic|gemini|copilot|midjourney")';
    const earliestTime = since.toISOString();

    // Create a search job
    const createResponse = await fetch(`${config.api_url}/services/search/jobs`, {
      method: "POST",
      headers: {
        Authorization: `Splunk ${this.sessionKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `search=${encodeURIComponent(searchQuery)}&earliest_time=${earliestTime}&output_mode=json`,
    });

    if (!createResponse.ok) throw new Error("Failed to create Splunk search job");

    const jobData = await createResponse.json();
    const sid = jobData.sid;

    // Poll for job completion
    let isDone = false;
    let attempts = 0;
    while (!isDone && attempts < 30) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const statusResponse = await fetch(
        `${config.api_url}/services/search/jobs/${sid}?output_mode=json`,
        { headers: { Authorization: `Splunk ${this.sessionKey}` } }
      );
      const statusData = await statusResponse.json();
      isDone = statusData.entry?.[0]?.content?.isDone;
      attempts++;
    }

    // Fetch results
    const resultsResponse = await fetch(
      `${config.api_url}/services/search/jobs/${sid}/results?output_mode=json&count=10000`,
      { headers: { Authorization: `Splunk ${this.sessionKey}` } }
    );

    const resultsData = await resultsResponse.json();
    const events: RawEvent[] = (resultsData.results || []).map((result: any) => ({
      source_type: "splunk",
      raw_data: result,
      received_at: new Date(),
    }));

    return events;
  }

  async disconnect(): Promise<void> {
    this.sessionKey = null;
  }
}
