/**
 * Built-in Plugin Manifest
 *
 * Plugins defined here live in the main repo and use the plugin infrastructure
 * for install/uninstall per tenant without remote download.
 */

interface BuiltinPlugin {
  key: string;
  name: string;
  displayName: string;
  description: string;
  longDescription?: string;
  version: string;
  author?: string;
  category: string;
  region?: string;
  frameworkType?: "organizational" | "project";
  iconUrl?: string;
  documentationUrl?: string;
  supportUrl?: string;
  isOfficial: boolean;
  isPublished: boolean;
  isBuiltIn: boolean;
  requiresConfiguration: boolean;
  installationType: string;
  features: Array<{
    name: string;
    description: string;
    displayOrder: number;
  }>;
  tags: string[];
  pluginPath: string;
  entryPoint: string;
  dependencies?: Record<string, string>;
  ui?: {
    bundleUrl: string;
    slots: Array<{
      slotId: string;
      componentName: string;
      renderType: string;
      props?: Record<string, any>;
      trigger?: string;
    }>;
  };
}

const BUILTIN_PLUGINS: BuiltinPlugin[] = [];

/**
 * Returns all built-in plugin definitions.
 */
export function getBuiltinPlugins(): BuiltinPlugin[] {
  return BUILTIN_PLUGINS;
}

/**
 * Checks whether a plugin key refers to a built-in plugin.
 */
export function isBuiltinPlugin(key: string): boolean {
  return BUILTIN_PLUGINS.some((p) => p.key === key);
}
