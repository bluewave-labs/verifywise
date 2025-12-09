/**
 * @fileoverview Plugin Repository
 *
 * This module provides API functions for managing plugins in the VerifyWise platform.
 * It handles all communication with the backend plugin endpoints, including:
 *
 * - Listing and retrieving plugins
 * - Installing and uninstalling plugins
 * - Enabling and disabling plugins
 * - Managing plugin configuration
 * - Uploading custom plugins
 * - Fetching UI extensions from enabled plugins
 *
 * ## API Endpoints
 *
 * | Method | Endpoint                    | Description                    |
 * |--------|-----------------------------|---------------------------------|
 * | GET    | /plugins                    | List all registered plugins    |
 * | GET    | /plugins/stats              | Get plugin system statistics   |
 * | GET    | /plugins/:id                | Get a specific plugin          |
 * | POST   | /plugins/:id/install        | Install a plugin               |
 * | POST   | /plugins/:id/uninstall      | Uninstall a plugin             |
 * | POST   | /plugins/:id/enable         | Enable a plugin                |
 * | POST   | /plugins/:id/disable        | Disable a plugin               |
 * | GET    | /plugins/:id/config         | Get plugin configuration       |
 * | PUT    | /plugins/:id/config         | Update plugin configuration    |
 * | POST   | /plugins/upload             | Upload a custom plugin (zip)   |
 * | GET    | /plugins/ui-extensions      | Get UI extensions from plugins |
 *
 * ## Usage Example
 *
 * ```typescript
 * import { getAllPlugins, enablePlugin, disablePlugin } from './plugin.repository';
 *
 * // List all plugins
 * const { data: plugins, stats } = await getAllPlugins();
 *
 * // Enable a plugin
 * await enablePlugin('my-plugin');
 *
 * // Disable a plugin
 * await disablePlugin('my-plugin');
 * ```
 *
 * @module repository/plugin
 */

import { apiServices } from "../../infrastructure/api/networkServices";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Base URL for plugin API endpoints */
const BASE_URL = "/plugins";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * FAQ item for plugin documentation.
 */
export interface PluginFAQItem {
  /** The question */
  question: string;
  /** The answer */
  answer: string;
}

/**
 * Changelog entry for plugin version history.
 */
export interface PluginChangelogEntry {
  /** Version number (e.g., "1.0.0", "2.1.0") */
  version: string;
  /** Release name (e.g., "Initial Release", "Bug Fixes", "Performance Update") */
  name?: string;
  /** Release date in ISO format (e.g., "2024-01-15") */
  date?: string;
  /** List of changes in this release */
  changes: string[];
}

/**
 * Data Transfer Object for plugin information.
 * Represents a plugin as returned by the API.
 *
 * @example
 * {
 *   id: "activity-feed",
 *   name: "Activity Feed",
 *   description: "Displays recent activity on the dashboard",
 *   version: "1.0.0",
 *   author: "VerifyWise",
 *   type: "feature",
 *   enabled: true,
 *   installed: true,
 *   isBuiltin: true
 * }
 */
export interface PluginDTO {
  /** Unique plugin identifier (e.g., "activity-feed", "slack-integration") */
  id: string;
  /** Human-readable plugin name */
  name: string;
  /** Brief description of what the plugin does */
  description: string;
  /** Semantic version string (e.g., "1.0.0") */
  version: string;
  /** Plugin author name */
  author: string;
  /** URL to author's website (optional) */
  authorUrl?: string;
  /** Plugin type: "framework", "integration", "feature", or "reporting" */
  type: string;
  /** Base64 encoded SVG icon or inline SVG string */
  icon?: string;
  /** Whether the plugin is currently enabled */
  enabled: boolean;
  /** Whether the plugin has been installed (onInstall called) */
  installed: boolean;
  /** Whether this is a built-in plugin that ships with VerifyWise */
  isBuiltin: boolean;
  /** Current plugin configuration values */
  config?: Record<string, unknown>;
  /** Permissions required by this plugin */
  permissions?: string[];

  // Extended metadata fields
  /** Plugin homepage URL */
  homepage?: string;
  /** Plugin source code repository URL */
  repository?: string;
  /** Support/documentation URL */
  supportUrl?: string;
  /** Detailed description (supports markdown) */
  detailedDescription?: string;
  /** Category tags for filtering */
  tags?: string[];
  /** Search keywords */
  keywords?: string[];
  /** Release date (ISO format) */
  releaseDate?: string;
  /** Frequently asked questions */
  faq?: PluginFAQItem[];
  /** Version history and changes */
  changelog?: PluginChangelogEntry[];
  /** Compatibility information */
  compatibility?: {
    /** Minimum VerifyWise core version required */
    minCoreVersion?: string;
    /** Maximum VerifyWise core version supported */
    maxCoreVersion?: string;
  };
}

/**
 * Plugin system statistics.
 * Provides counts of plugins in various states.
 */
export interface PluginStats {
  /** Total number of registered plugins */
  total: number;
  /** Number of plugins that have been loaded */
  loaded: number;
  /** Number of currently enabled plugins */
  enabled: number;
  /** Number of installed plugins */
  installed: number;
}

/**
 * Response from the GET /plugins endpoint.
 */
export interface PluginListResponse {
  /** Whether the request was successful */
  success: boolean;
  /** Array of plugin DTOs */
  data: PluginDTO[];
  /** Plugin system statistics */
  stats: PluginStats;
}

/**
 * Response from single-plugin operations.
 */
export interface PluginResponse {
  /** Whether the operation was successful */
  success: boolean;
  /** Updated plugin data (if successful) */
  data?: PluginDTO;
  /** Success message (if applicable) */
  message?: string;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Response from plugin configuration endpoints.
 */
export interface PluginConfigResponse {
  /** Whether the request was successful */
  success: boolean;
  /** Configuration data (if successful) */
  data?: {
    /** Current configuration values */
    config: Record<string, unknown>;
    /** Configuration schema for UI generation */
    schema?: Record<string, { type: string; required?: boolean }>;
  };
  /** Error message (if failed) */
  error?: string;
}

/**
 * Response from plugin upload endpoint.
 */
export interface PluginUploadResponse {
  /** Whether the upload and validation was successful */
  success: boolean;
  /** Success message */
  message?: string;
  /** Error message (if failed) */
  error?: string;
  /** Validation errors (if manifest is invalid) */
  validationErrors?: string[];
  /** Basic info about the uploaded plugin (if successful) */
  data?: {
    id: string;
    name: string;
    version: string;
    type: string;
  };
}

/**
 * Dashboard widget extension from a plugin.
 * Defines how a plugin contributes widgets to the dashboard.
 *
 * @example
 * {
 *   pluginId: "activity-feed",
 *   widgetId: "activity-feed-widget",
 *   template: "activity-feed",
 *   title: "Recent Activity",
 *   endpoint: "/dashboard/widget",
 *   config: { maxItems: 10 }
 * }
 */
export interface DashboardWidgetExtension {
  /** ID of the plugin that provides this widget */
  pluginId: string;
  /** Unique identifier for this widget */
  widgetId: string;
  /** Widget template to use (e.g., "activity-feed", "stats-card", "chart") */
  template: string;
  /** Display title for the widget */
  title: string;
  /** API endpoint to fetch widget data (relative to /api/plugins/{pluginId}) */
  endpoint: string;
  /** Additional configuration for the widget template */
  config?: Record<string, unknown>;
}

/**
 * Plugin page extension for sidebar navigation.
 * Defines a page that appears in the Plugins sidebar menu.
 *
 * @example
 * {
 *   pluginId: "gdpr-compliance",
 *   pluginName: "GDPR Compliance",
 *   title: "GDPR Dashboard",
 *   type: "template",
 *   template: "dashboard",
 *   endpoint: "/page/data"
 * }
 */
export interface PluginPageExtension {
  /** ID of the plugin that provides this page */
  pluginId: string;
  /** Name of the plugin (for display) */
  pluginName: string;
  /** Page title shown in header */
  title: string;
  /** Page description shown below title */
  description?: string;
  /** Lucide icon name (e.g., "shield-check", "chart", "users") */
  icon?: string;
  /** Page content type */
  type: "template" | "iframe" | "api";
  /** Template name for type="template" (e.g., "empty-page", "table") */
  template?: string;
  /** Data endpoint for type="template" */
  endpoint?: string;
  /** External URL for type="iframe" */
  url?: string;
  /** API endpoint returning HTML for type="api" */
  apiEndpoint?: string;
  /** Additional configuration */
  config?: Record<string, unknown>;
}

/**
 * Response from the UI extensions endpoint.
 */
export interface UIExtensionsResponse {
  /** Whether the request was successful */
  success: boolean;
  /** UI extension data from enabled plugins */
  data: {
    /** Dashboard widget extensions */
    dashboardWidgets: DashboardWidgetExtension[];
    /** Plugin page extensions for sidebar */
    pages: PluginPageExtension[];
  };
  /** Error message (if failed) */
  error?: string;
}

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Retrieves all registered plugins from the backend.
 *
 * Returns both the list of plugins and system statistics.
 * Use this to display the plugin management UI.
 *
 * @returns Promise containing plugin list and stats
 * @throws Error if the API request fails
 *
 * @example
 * ```typescript
 * const response = await getAllPlugins();
 * console.log(`Total plugins: ${response.stats.total}`);
 * console.log(`Enabled: ${response.stats.enabled}`);
 * response.data.forEach(plugin => {
 *   console.log(`${plugin.name} - ${plugin.enabled ? 'enabled' : 'disabled'}`);
 * });
 * ```
 */
export async function getAllPlugins(): Promise<PluginListResponse> {
  try {
    const response = await apiServices.get<PluginListResponse>(BASE_URL);
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieves plugin system statistics.
 *
 * Use this when you only need counts, not the full plugin list.
 *
 * @returns Promise containing plugin statistics
 * @throws Error if the API request fails
 *
 * @example
 * ```typescript
 * const { data: stats } = await getPluginStats();
 * console.log(`${stats.enabled} of ${stats.total} plugins enabled`);
 * ```
 */
export async function getPluginStats(): Promise<{ success: boolean; data: PluginStats }> {
  try {
    const response = await apiServices.get<{ success: boolean; data: PluginStats }>(
      `${BASE_URL}/stats`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieves a specific plugin by its ID.
 *
 * @param id - The plugin identifier
 * @returns Promise containing the plugin data
 * @throws Error if the plugin is not found or API request fails
 *
 * @example
 * ```typescript
 * const { data: plugin } = await getPluginById('activity-feed');
 * console.log(`${plugin.name} v${plugin.version}`);
 * ```
 */
export async function getPluginById(id: string): Promise<PluginResponse> {
  try {
    const response = await apiServices.get<PluginResponse>(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Installs a plugin.
 *
 * This triggers the plugin's `onInstall` lifecycle hook, which typically:
 * - Creates database tables
 * - Seeds initial data
 * - Sets up required resources
 *
 * A plugin must be installed before it can be enabled.
 *
 * @param id - The plugin identifier
 * @returns Promise containing the installation result
 * @throws Error if installation fails
 *
 * @example
 * ```typescript
 * const result = await installPlugin('my-plugin');
 * if (result.success) {
 *   console.log('Plugin installed successfully');
 *   // Now enable it
 *   await enablePlugin('my-plugin');
 * }
 * ```
 */
export async function installPlugin(id: string): Promise<PluginResponse> {
  try {
    const response = await apiServices.post<PluginResponse>(`${BASE_URL}/${id}/install`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Uninstalls a plugin.
 *
 * This triggers the plugin's `onUninstall` lifecycle hook, which typically:
 * - Drops database tables
 * - Removes plugin data
 * - Cleans up resources
 *
 * WARNING: This is a destructive operation. All plugin data will be lost.
 * The plugin must be disabled before it can be uninstalled.
 *
 * @param id - The plugin identifier
 * @returns Promise containing the uninstallation result
 * @throws Error if uninstallation fails
 *
 * @example
 * ```typescript
 * // Must disable first
 * await disablePlugin('my-plugin');
 * // Then uninstall
 * const result = await uninstallPlugin('my-plugin');
 * if (result.success) {
 *   console.log('Plugin uninstalled');
 * }
 * ```
 */
export async function uninstallPlugin(id: string): Promise<PluginResponse> {
  try {
    const response = await apiServices.post<PluginResponse>(`${BASE_URL}/${id}/uninstall`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Enables a plugin.
 *
 * This triggers the plugin's `onEnable` lifecycle hook, which typically:
 * - Registers event handlers
 * - Registers filter handlers
 * - Starts background jobs
 * - Activates UI extensions
 *
 * The plugin must be installed before it can be enabled.
 *
 * @param id - The plugin identifier
 * @returns Promise containing the enable result
 * @throws Error if enabling fails
 *
 * @example
 * ```typescript
 * const result = await enablePlugin('activity-feed');
 * if (result.success) {
 *   console.log('Plugin enabled');
 *   // Refresh UI extensions to show new widgets
 *   await refreshPluginExtensions();
 * }
 * ```
 */
export async function enablePlugin(id: string): Promise<PluginResponse> {
  try {
    const response = await apiServices.post<PluginResponse>(`${BASE_URL}/${id}/enable`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Disables a plugin.
 *
 * This triggers the plugin's `onDisable` lifecycle hook, which typically:
 * - Unregisters event handlers
 * - Unregisters filter handlers
 * - Stops background jobs
 * - Removes UI extensions
 *
 * @param id - The plugin identifier
 * @returns Promise containing the disable result
 * @throws Error if disabling fails
 *
 * @example
 * ```typescript
 * const result = await disablePlugin('activity-feed');
 * if (result.success) {
 *   console.log('Plugin disabled');
 *   // Refresh UI extensions to remove widgets
 *   await refreshPluginExtensions();
 * }
 * ```
 */
export async function disablePlugin(id: string): Promise<PluginResponse> {
  try {
    const response = await apiServices.post<PluginResponse>(`${BASE_URL}/${id}/disable`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieves the configuration for a plugin.
 *
 * Returns both the current configuration values and the schema
 * that can be used to generate a configuration UI.
 *
 * @param id - The plugin identifier
 * @returns Promise containing configuration and schema
 * @throws Error if the request fails
 *
 * @example
 * ```typescript
 * const { data } = await getPluginConfig('slack-integration');
 * console.log('Webhook URL:', data.config.webhookUrl);
 * console.log('Schema:', data.schema);
 * ```
 */
export async function getPluginConfig(id: string): Promise<PluginConfigResponse> {
  try {
    const response = await apiServices.get<PluginConfigResponse>(`${BASE_URL}/${id}/config`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Updates the configuration for a plugin.
 *
 * The configuration is validated against the plugin's schema.
 * Invalid values will be rejected with validation errors.
 *
 * @param id - The plugin identifier
 * @param config - New configuration values
 * @returns Promise containing the update result
 * @throws Error if validation fails or the request fails
 *
 * @example
 * ```typescript
 * const result = await updatePluginConfig('slack-integration', {
 *   webhookUrl: 'https://hooks.slack.com/...',
 *   channel: '#alerts'
 * });
 * if (result.success) {
 *   console.log('Configuration updated');
 * }
 * ```
 */
export async function updatePluginConfig(
  id: string,
  config: Record<string, unknown>
): Promise<PluginResponse> {
  try {
    const response = await apiServices.put<PluginResponse>(`${BASE_URL}/${id}/config`, config);
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Uploads a custom plugin from a ZIP file.
 *
 * The ZIP file must contain:
 * - manifest.json (required): Plugin metadata and configuration schema
 * - index.ts or index.js (optional): Plugin code with lifecycle hooks
 * - icon.svg (optional): Plugin icon
 *
 * The manifest is validated before the plugin is saved.
 * If validation fails, the response will include validation errors.
 *
 * @param file - ZIP file containing the plugin
 * @returns Promise containing the upload result
 * @throws Error if upload or validation fails
 *
 * @example
 * ```typescript
 * const fileInput = document.querySelector('input[type="file"]');
 * const file = fileInput.files[0];
 *
 * const result = await uploadPlugin(file);
 * if (result.success) {
 *   console.log(`Uploaded: ${result.data.name} v${result.data.version}`);
 *   // Now install and enable
 *   await installPlugin(result.data.id);
 *   await enablePlugin(result.data.id);
 * } else if (result.validationErrors) {
 *   console.error('Validation errors:', result.validationErrors);
 * }
 * ```
 */
export async function uploadPlugin(file: File): Promise<PluginUploadResponse> {
  try {
    const formData = new FormData();
    formData.append("plugin", file);

    const response = await apiServices.post<PluginUploadResponse>(
      `${BASE_URL}/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieves UI extensions from all enabled plugins.
 *
 * This is used by the PluginExtensionsContext to fetch all plugin UI contributions
 * in a single request. The response includes:
 * - Dashboard widgets
 * - Navigation items (future)
 * - Settings pages (future)
 *
 * @returns Promise containing UI extensions
 * @throws Error if the request fails
 *
 * @example
 * ```typescript
 * const { data } = await getPluginUIExtensions();
 *
 * // Render dashboard widgets
 * data.dashboardWidgets.forEach(widget => {
 *   console.log(`Widget: ${widget.title} (template: ${widget.template})`);
 * });
 * ```
 */
export async function getPluginUIExtensions(): Promise<UIExtensionsResponse> {
  try {
    const response = await apiServices.get<UIExtensionsResponse>(
      `${BASE_URL}/ui-extensions`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}
