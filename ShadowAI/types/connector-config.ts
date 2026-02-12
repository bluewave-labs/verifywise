/**
 * Connector configuration types for Shadow AI data source integrations.
 */

export type ConnectorType =
  | "splunk"
  | "sentinel"
  | "qradar"
  | "zscaler"
  | "netskope"
  | "syslog"
  | "webhook";

export type ConnectorStatus = "active" | "paused" | "error" | "configuring";

export interface ConnectorConfig {
  id?: number;
  tenant_id?: string;
  name: string;
  type: ConnectorType;
  config: ConnectorConfigDetails;
  status: ConnectorStatus;
  last_sync_at?: Date;
  last_error?: string;
  events_ingested?: number;
  created_by?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ConnectorConfigDetails {
  // Common fields
  enabled?: boolean;
  poll_interval_minutes?: number;

  // API-based connectors (Splunk, Sentinel, QRadar)
  api_url?: string;
  api_key?: string;
  api_secret?: string;
  auth_token?: string;
  workspace_id?: string;
  tenant_id?: string;

  // Syslog connector
  syslog_port?: number;
  syslog_protocol?: "tcp" | "udp";

  // Webhook connector
  webhook_secret?: string;

  // Gateway connectors (Zscaler, Netskope)
  cloud_url?: string;
  api_token?: string;
  subscription_key?: string;

  // Query/filter settings
  search_query?: string;
  index_name?: string;
  event_filter?: string;

  // TLS settings
  tls_enabled?: boolean;
  tls_ca_cert?: string;
  tls_skip_verify?: boolean;

  // Additional key-value pairs
  [key: string]: unknown;
}

export interface ConnectorTestResult {
  success: boolean;
  message: string;
  events_available?: number;
  latency_ms?: number;
}

export interface ConnectorSyncResult {
  success: boolean;
  events_ingested: number;
  events_failed: number;
  duration_ms: number;
  errors?: string[];
}
