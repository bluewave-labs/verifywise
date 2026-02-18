/**
 * Built-in Plugin Component Registry
 *
 * Maps built-in plugin keys to their lazy-loaded React components.
 * These components are part of the main bundle and don't need remote loading.
 */

import React from "react";

const BUILTIN_PLUGINS: Record<string, Record<string, React.LazyExoticComponent<React.ComponentType<any>>>> = {
  "model-lifecycle": {
    ModelLifecycleContent: React.lazy(
      () => import("../../presentation/pages/ModelInventory/ModelDetailPage/ModelLifecycleContent")
    ),
  },
  "dataset-bulk-upload": {
    BulkUploadButton: React.lazy(
      () => import("../../presentation/pages/Datasets/BulkUpload/BulkUploadButton")
    ),
    BulkUploadModal: React.lazy(
      () => import("../../presentation/pages/Datasets/BulkUpload/BulkUploadModal")
    ),
  },
};

/**
 * Get components for a built-in plugin by key.
 * Returns a map of componentName -> lazy-loaded component, or null if not a built-in plugin.
 */
export function getBuiltinPluginComponents(
  pluginKey: string
): Record<string, React.ComponentType<any>> | null {
  return BUILTIN_PLUGINS[pluginKey] || null;
}

/**
 * Check if a plugin key refers to a built-in plugin.
 */
export function isBuiltinPlugin(pluginKey: string): boolean {
  return pluginKey in BUILTIN_PLUGINS;
}
