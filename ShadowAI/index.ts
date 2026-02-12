/**
 * ShadowAI Module - Core exports
 *
 * VerifyWise Shadow AI governance module that transforms security
 * telemetry into actionable AI usage oversight.
 */

// Types
export * from "./types/shadow-ai-event";
export * from "./types/connector-config";
export * from "./types/policy";
export * from "./types/risk";
export * from "./types/inventory";
export * from "./types/review";

// Normalization
export { AI_TOOL_REGISTRY, matchAITool, buildDomainLookup, getToolsByCategory, getHighRiskTools } from "./normalization/ai-tool.registry";
export type { AIToolEntry } from "./normalization/ai-tool.registry";
export { EventNormalizer } from "./normalization/event.normalizer";

// Enrichment
export { IdentityEnricher } from "./enrichment/identity.enricher";

// Engine
export { PolicyEngine } from "./engine/policy.engine";
export { RiskEngine } from "./engine/risk.engine";
export { InventoryEngine } from "./engine/inventory.engine";

// Connectors
export { BaseConnector } from "./connectors/base.connector";
export { WebhookConnector } from "./connectors/generic/webhook.connector";
export { SyslogConnector } from "./connectors/generic/syslog.connector";
export { SplunkConnector } from "./connectors/siem/splunk.connector";
export { SentinelConnector } from "./connectors/siem/sentinel.connector";
export { QRadarConnector } from "./connectors/siem/qradar.connector";
export { ZscalerConnector } from "./connectors/gateway/zscaler.connector";
export { NetskopeConnector } from "./connectors/gateway/netskope.connector";
