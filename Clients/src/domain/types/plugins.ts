export enum PluginCategory {
  COMMUNICATION = "communication",
  ML_OPS = "ml_ops",
  VERSION_CONTROL = "version_control",
  MONITORING = "monitoring",
  SECURITY = "security",
  DATA_MANAGEMENT = "data_management",
  ANALYTICS = "analytics",
}

export enum PluginInstallationStatus {
  INSTALLING = "installing",
  INSTALLED = "installed",
  FAILED = "failed",
  UNINSTALLING = "uninstalling",
  UNINSTALLED = "uninstalled",
}

export interface PluginFeature {
  name: string;
  description: string;
  displayOrder: number;
}

export interface Plugin {
  key: string;
  name: string;
  displayName: string;
  description: string;
  longDescription?: string;
  version: string;
  author?: string;
  category: PluginCategory;
  iconUrl?: string;
  documentationUrl?: string;
  supportUrl?: string;
  isOfficial: boolean;
  isPublished: boolean;
  requiresConfiguration: boolean;
  installationType: string;
  features: PluginFeature[];
  tags: string[];
  pluginPath?: string;
  entryPoint?: string;
  // Installation-specific fields (when fetching installed plugins)
  installationId?: number;
  installationStatus?: PluginInstallationStatus;
  installedAt?: string;
}

export interface PluginInstallation {
  id: number;
  pluginKey: string;
  userId?: number;
  tenantId?: number;
  status: PluginInstallationStatus;
  installedAt?: string;
  uninstalledAt?: string;
  errorMessage?: string;
  configuration?: any;
  metadata?: any;
  plugin?: Plugin;
  createdAt?: string;
  updatedAt?: string;
}

export interface PluginCategoryInfo {
  id: string;
  name: string;
  description: string;
}
