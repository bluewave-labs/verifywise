/**
 * Integration status enum
 */
export enum IntegrationStatus {
  NOT_CONFIGURED = 'not configured',
  CONFIGURING = 'configuring',
  CONFIGURED = 'configured',
  ERROR = 'error',
}

/**
 * Integration category enum
 */
export enum IntegrationCategory {
  COMMUNICATION = 'communication',
  ML_OPS = 'ml_ops',
  VERSION_CONTROL = 'version_control',
  MONITORING = 'monitoring',
  SECURITY = 'security',
}

/**
 * Integration configuration interface
 */
export interface Integration {
  id: string;
  name: string;
  displayName: string;
  description: string;
  logo: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  features: string[];
  documentationUrl?: string;
  setupRequired?: boolean;
  lastSyncAt?: string | null;
  lastSyncStatus?: 'success' | 'partial' | 'error' | null;
  lastTestStatus?: 'success' | 'error' | null;
  lastTestedAt?: string | null;
  error?: string;
}

/**
 * Integration connection handler type
 */
export type IntegrationConnectionHandler = (integration: Integration) => Promise<void>;

/**
 * Integrations page props
 */
export interface IntegrationsPageProps {
  onIntegrationConnect?: IntegrationConnectionHandler;
  onIntegrationDisconnect?: IntegrationConnectionHandler;
}

/**
 * Integration card props
 */
export interface IntegrationCardProps {
  integration: Integration;
  onConnect?: IntegrationConnectionHandler;
  onDisconnect?: IntegrationConnectionHandler;
  onManage?: (integration: Integration) => void;
  loading?: boolean;
}
