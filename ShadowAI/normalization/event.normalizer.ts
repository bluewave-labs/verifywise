/**
 * Event Normalizer - Transforms raw events from diverse security sources
 * into the unified ShadowAIEvent schema.
 */

import {
  ShadowAIEvent,
  ActionType,
  DataClassification,
  RawEvent,
} from "../types/shadow-ai-event";
import { matchAITool, AIToolEntry } from "./ai-tool.registry";

export interface NormalizationResult {
  event: ShadowAIEvent | null;
  matched_tool: AIToolEntry | null;
  is_ai_related: boolean;
  normalization_errors?: string[];
}

export class EventNormalizer {
  /**
   * Normalize a raw event into a ShadowAIEvent.
   * Returns null event if the event is not AI-related.
   */
  normalize(raw: RawEvent, connectorId: number): NormalizationResult {
    const errors: string[] = [];

    // Extract URL/domain from raw event
    const url = this.extractUrl(raw);
    if (!url) {
      return { event: null, matched_tool: null, is_ai_related: false, normalization_errors: ["No URL found in event"] };
    }

    // Match against AI tool registry
    const tool = matchAITool(url);
    if (!tool) {
      return { event: null, matched_tool: null, is_ai_related: false };
    }

    // Extract fields from raw event
    const timestamp = this.extractTimestamp(raw);
    if (!timestamp) {
      errors.push("Could not extract timestamp, using current time");
    }

    const event: ShadowAIEvent = {
      connector_id: connectorId,
      raw_event_id: this.extractRawEventId(raw),
      timestamp: timestamp || new Date(),
      user_identifier: this.extractUserIdentifier(raw),
      department: this.extractDepartment(raw),
      ai_tool_name: tool.name,
      ai_tool_category: tool.category,
      action_type: this.inferActionType(raw),
      data_classification: this.inferDataClassification(raw),
      source_ip: this.extractSourceIp(raw),
      destination_url: url,
      metadata: {
        raw_source_type: raw.source_type,
        tool_vendor: tool.vendor,
        tool_default_risk: tool.default_risk,
      },
    };

    return {
      event,
      matched_tool: tool,
      is_ai_related: true,
      normalization_errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Normalize a batch of raw events.
   */
  normalizeBatch(
    rawEvents: RawEvent[],
    connectorId: number
  ): NormalizationResult[] {
    return rawEvents.map((raw) => this.normalize(raw, connectorId));
  }

  private extractUrl(raw: RawEvent): string | null {
    const data = raw.raw_data;
    // Try common field names across different security tools
    const urlFields = [
      "url", "dest_url", "destination_url", "request_url",
      "dst_url", "target_url", "uri", "request_uri",
      "hostname", "dest_host", "destination_host",
      "domain", "dest_domain", "destination_domain",
      "host", "server_name", "dest_name",
      "cs-uri-stem", "cs-host", // IIS/proxy log format
      "http.url", "http.host", // ECS format
      "web.url", "web.domain", // Generic
    ];

    for (const field of urlFields) {
      const value = this.getNestedValue(data, field);
      if (value && typeof value === "string") {
        return value;
      }
    }

    return null;
  }

  private extractTimestamp(raw: RawEvent): Date | null {
    const data = raw.raw_data;
    const timeFields = [
      "timestamp", "_time", "event_time", "time",
      "datetime", "date", "created_at", "received_at",
      "@timestamp", "eventTime", "TimeGenerated",
    ];

    for (const field of timeFields) {
      const value = this.getNestedValue(data, field);
      if (value) {
        const date = new Date(value as string | number);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    return null;
  }

  private extractRawEventId(raw: RawEvent): string | undefined {
    const data = raw.raw_data;
    const idFields = ["id", "event_id", "eventId", "_id", "uuid", "message_id"];
    for (const field of idFields) {
      const value = this.getNestedValue(data, field);
      if (value) return String(value);
    }
    return undefined;
  }

  private extractUserIdentifier(raw: RawEvent): string | undefined {
    const data = raw.raw_data;
    const userFields = [
      "user", "username", "user_name", "user_id",
      "userId", "email", "user_email", "src_user",
      "source_user", "actor", "principal_name",
      "userPrincipalName", "samAccountName",
    ];

    for (const field of userFields) {
      const value = this.getNestedValue(data, field);
      if (value && typeof value === "string") return value;
    }

    return undefined;
  }

  private extractDepartment(raw: RawEvent): string | undefined {
    const data = raw.raw_data;
    const deptFields = [
      "department", "dept", "business_unit", "org_unit",
      "group", "team", "division",
    ];

    for (const field of deptFields) {
      const value = this.getNestedValue(data, field);
      if (value && typeof value === "string") return value;
    }

    return undefined;
  }

  private extractSourceIp(raw: RawEvent): string | undefined {
    const data = raw.raw_data;
    const ipFields = [
      "src_ip", "source_ip", "client_ip", "src",
      "sourceAddress", "clientIP", "remote_addr",
    ];

    for (const field of ipFields) {
      const value = this.getNestedValue(data, field);
      if (value && typeof value === "string") return value;
    }

    return undefined;
  }

  private inferActionType(raw: RawEvent): ActionType {
    const data = raw.raw_data;

    // Check explicit action fields
    const actionFields = ["action", "event_type", "method", "http_method", "request_method"];
    for (const field of actionFields) {
      const value = this.getNestedValue(data, field);
      if (value && typeof value === "string") {
        const action = value.toLowerCase();
        if (action.includes("upload") || action === "post" || action === "put") return "upload";
        if (action.includes("download") || action === "get") return "download";
        if (action.includes("login") || action.includes("auth")) return "login";
        if (action.includes("api") || action.includes("call")) return "api_call";
        if (action.includes("share")) return "data_share";
        if (action.includes("prompt") || action.includes("chat") || action.includes("completion")) return "prompt";
      }
    }

    // Check URL path for hints
    const url = this.extractUrl(raw);
    if (url) {
      const urlLower = url.toLowerCase();
      if (urlLower.includes("/chat") || urlLower.includes("/completion") || urlLower.includes("/generate")) return "prompt";
      if (urlLower.includes("/upload") || urlLower.includes("/files")) return "upload";
      if (urlLower.includes("/api/") || urlLower.includes("/v1/") || urlLower.includes("/v2/")) return "api_call";
    }

    return "access";
  }

  private inferDataClassification(raw: RawEvent): DataClassification {
    const data = raw.raw_data;
    const classFields = [
      "data_classification", "classification", "sensitivity",
      "data_type", "content_type", "dlp_classification",
    ];

    for (const field of classFields) {
      const value = this.getNestedValue(data, field);
      if (value && typeof value === "string") {
        const cls = value.toLowerCase();
        if (cls.includes("restricted") || cls.includes("secret")) return "restricted";
        if (cls.includes("pii") || cls.includes("personal")) return "pii";
        if (cls.includes("phi") || cls.includes("health")) return "phi";
        if (cls.includes("financial") || cls.includes("payment")) return "financial";
        if (cls.includes("confidential")) return "confidential";
        if (cls.includes("internal")) return "internal";
        if (cls.includes("public")) return "public";
      }
    }

    return "unknown";
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const keys = path.split(".");
    let current: unknown = obj;
    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== "object") {
        return undefined;
      }
      current = (current as Record<string, unknown>)[key];
    }
    return current;
  }
}
