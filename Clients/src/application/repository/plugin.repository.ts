/**
 * Plugin Repository
 *
 * API functions for managing plugins.
 */

import { apiServices } from "../../infrastructure/api/networkServices";

const BASE_URL = "/plugins";

export interface PluginDTO {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  authorUrl?: string;
  type: string;
  icon?: string;
  enabled: boolean;
  installed: boolean;
  isBuiltin: boolean;
  config?: Record<string, unknown>;
  permissions?: string[];
}

export interface PluginStats {
  total: number;
  loaded: number;
  enabled: number;
  installed: number;
}

export interface PluginListResponse {
  success: boolean;
  data: PluginDTO[];
  stats: PluginStats;
}

export interface PluginResponse {
  success: boolean;
  data?: PluginDTO;
  message?: string;
  error?: string;
}

export interface PluginConfigResponse {
  success: boolean;
  data?: {
    config: Record<string, unknown>;
    schema?: Record<string, { type: string; required?: boolean }>;
  };
  error?: string;
}

/**
 * Get all registered plugins
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
 * Get plugin system statistics
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
 * Get a specific plugin by ID
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
 * Install a plugin
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
 * Uninstall a plugin
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
 * Enable a plugin
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
 * Disable a plugin
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
 * Get plugin configuration
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
 * Update plugin configuration
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

export interface PluginUploadResponse {
  success: boolean;
  message?: string;
  error?: string;
  validationErrors?: string[];
  data?: {
    id: string;
    name: string;
    version: string;
    type: string;
  };
}

export interface DashboardWidgetExtension {
  pluginId: string;
  widgetId: string;
  template: string;
  title: string;
  endpoint: string;
  config?: Record<string, unknown>;
}

export interface UIExtensionsResponse {
  success: boolean;
  data: {
    dashboardWidgets: DashboardWidgetExtension[];
  };
  error?: string;
}

/**
 * Upload a new plugin from a zip file
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
 * Get UI extensions from all enabled plugins
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
