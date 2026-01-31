import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import axios from "axios";
import { createInstallation, findByIdWithValidation, getInstalledPlugins, toJSON, updateConfiguration, deleteInstallation, findByPlugin } from "../../utils/pluginInstallation.utils";
import { PluginInstallationStatus } from "../../domain.layer/enums/plugin.enum";
import {
  ValidationException,
  NotFoundException,
} from "../../domain.layer/exceptions/custom.exception";
import { sequelize } from "../../database/db";

// Environment configuration
export const PLUGIN_MARKETPLACE_URL = "https://raw.githubusercontent.com/bluewave-labs/plugin-marketplace/main/plugins.json";
export const PLUGIN_MARKETPLACE_BASE_URL = PLUGIN_MARKETPLACE_URL.replace("/plugins.json", "");

interface Plugin {
  key: string;
  name: string;
  displayName: string;
  description: string;
  longDescription?: string;
  version: string;
  author?: string;
  category: string;
  iconUrl?: string;
  documentationUrl?: string;
  supportUrl?: string;
  isOfficial: boolean;
  isPublished: boolean;
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

/**
 * Context passed to plugin route handlers
 * Contains all information needed to handle a request
 */
export interface PluginRouteContext {
  // Authentication
  tenantId: string;
  userId: number;
  organizationId: number;

  // Request details
  method: string;           // HTTP method (GET, POST, PUT, PATCH, DELETE)
  path: string;             // Route path after /api/plugins/:key (e.g., /models, /sync)
  params: Record<string, string>;  // URL params (e.g., { modelId: "123" })
  query: Record<string, any>;      // Query string params
  body: any;                       // Request body

  // Services
  sequelize: any;

  // Plugin configuration
  configuration: Record<string, any>;
}

/**
 * Response from plugin route handlers
 */
export interface PluginRouteResponse {
  status?: number;                    // HTTP status code (default 200)
  data?: any;                         // JSON response data
  buffer?: Buffer;                    // Binary data for file downloads
  filename?: string;                  // Filename for Content-Disposition header
  contentType?: string;               // Custom content type
  headers?: Record<string, string>;   // Additional response headers
}

/**
 * Plugin router type - maps route patterns to handler functions
 * Format: "METHOD /path" -> handler function
 * Example: "GET /models" -> getModels
 * Example: "POST /sync" -> syncModels
 * Example: "GET /models/:modelId" -> getModelById
 */
export type PluginRouter = Record<string, (context: PluginRouteContext) => Promise<PluginRouteResponse>>;

interface PluginMarketplace {
  version: string;
  plugins: Plugin[];
  categories: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

/**
 * Plugin Service
 *
 * Handles plugin marketplace operations and installation management
 */
export class PluginService {
  /**
   * Get all available plugins from marketplace
   * Fetches from remote Git repository
   */
  static async getAllPlugins(category?: string): Promise<Plugin[]> {
    try {
      const marketplaceData = await this.fetchRemoteMarketplace();

      let plugins = marketplaceData.plugins.filter((p) => p.isPublished);

      // Filter by category if provided
      if (category) {
        plugins = plugins.filter((p) => p.category === category);
      }

      return plugins;
    } catch (error: any) {
      console.error("[PluginService] Error fetching plugins:", error);
      throw new Error(`Failed to fetch plugins: ${error.message}`);
    }
  }

  /**
   * Get plugin by key
   */
  static async getPluginByKey(pluginKey: string): Promise<Plugin | null> {
    try {
      const marketplaceData = await this.fetchRemoteMarketplace();

      const plugin = marketplaceData.plugins.find(
        (p) => p.key === pluginKey && p.isPublished
      );

      return plugin || null;
    } catch (error: any) {
      console.error(
        "[PluginService] Error fetching plugin %s:",
        pluginKey,
        error
      );
      throw new Error(`Failed to fetch plugin: ${error.message}`);
    }
  }

  /**
   * Search plugins by query
   */
  static async searchPlugins(query: string): Promise<Plugin[]> {
    try {
      const marketplaceData = await this.fetchRemoteMarketplace();

      const lowerQuery = query.toLowerCase();

      const plugins = marketplaceData.plugins.filter(
        (p) =>
          p.isPublished &&
          (p.name.toLowerCase().includes(lowerQuery) ||
            p.description.toLowerCase().includes(lowerQuery) ||
            p.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)))
      );

      return plugins;
    } catch (error: any) {
      console.error("[PluginService] Error searching plugins:", error);
      throw new Error(`Failed to search plugins: ${error.message}`);
    }
  }

  /**
   * Install a plugin for a user
   */
  static async installPlugin(
    pluginKey: string,
    userId: number,
    tenantId: string
  ): Promise<any> {
    try {
      // Verify plugin exists in marketplace
      const plugin = await this.getPluginByKey(pluginKey);
      if (!plugin) {
        throw new NotFoundException(
          "Plugin not found in marketplace",
          "plugin",
          pluginKey
        );
      }

      // Load and execute plugin install method
      const pluginCode = await this.loadPluginCode(plugin);
      if (pluginCode && typeof pluginCode.install === "function") {
        const context = {
          sequelize,
        };
        const result = await pluginCode.install(userId, tenantId, {}, context);
        console.log(
          `[PluginService] Plugin ${pluginKey} installed:`,
          result
        );
      }

      // Create installation record (only after successful plugin installation)
      const installation = await createInstallation(
        pluginKey,
        tenantId
      );

      return toJSON(installation);
    } catch (error: any) {
      console.error(
        `[PluginService] Error installing plugin ${pluginKey}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  static async uninstallPlugin(
    installationId: number,
    userId: number,
    tenantId: string
  ): Promise<void> {
    try {
      const installation =
        await findByIdWithValidation(
          installationId,
          tenantId
        );

      // Load plugin and execute uninstall method
      const plugin = await this.getPluginByKey(installation.plugin_key);
      if (plugin) {
        const pluginCode = await this.loadPluginCode(plugin);
        if (pluginCode && typeof pluginCode.uninstall === "function") {
          const context = {
            sequelize,
          };
          const result = await pluginCode.uninstall(
            userId,
            tenantId,
            context
          );
          console.log(
            `[PluginService] Plugin ${installation.plugin_key} uninstalled:`,
            result
          );
        }
      }

      // Delete installation record
      await deleteInstallation(installationId, tenantId);
    } catch (error: any) {
      console.error(
        `[PluginService] Error uninstalling plugin ${installationId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get installed plugins for a tenant
   */
  static async getInstalledPlugins(
    tenantId: string
  ): Promise<any[]> {
    try {
      const installations = await getInstalledPlugins(
        tenantId
      );

      // Fetch plugin metadata from marketplace for each installation
      const pluginsWithMetadata = await Promise.all(
        installations.map(async (installation) => {
          const plugin = await this.getPluginByKey(installation.plugin_key);
          return {
            ...toJSON(installation),
            plugin: plugin || {
              key: installation.plugin_key,
              name: installation.plugin_key,
              description: "Plugin not found in marketplace",
            },
          };
        })
      );

      return pluginsWithMetadata;
    } catch (error: any) {
      console.error("[PluginService] Error fetching installed plugins:", error);
      throw error;
    }
  }

  /**
   * Get plugin categories
   */
  static async getCategories(): Promise<any[]> {
    try {
      const marketplaceData = await this.fetchRemoteMarketplace();

      return marketplaceData.categories || [];
    } catch (error: any) {
      console.error("[PluginService] Error fetching categories:", error);
      throw error;
    }
  }

  /**
   * Update plugin configuration
   */
  static async updateConfiguration(
    installationId: number,
    userId: number,
    tenantId: string,
    configuration: Record<string, any>
  ): Promise<any> {
    try {
      // Verify installation exists
      const installation =
        await findByIdWithValidation(
          installationId,
          tenantId
        );

      // Validate that plugin is installed
      if (installation.status !== PluginInstallationStatus.INSTALLED) {
        throw new ValidationException(
          "Plugin must be installed before configuring",
          "installation_id",
          installationId
        );
      }

      // Update configuration
      const updated = await updateConfiguration(
        installationId,
        tenantId,
        configuration
      );

      // Load plugin and execute configure method if it exists
      const plugin = await this.getPluginByKey(installation.plugin_key);
      if (plugin) {
        const pluginCode = await this.loadPluginCode(plugin);
        if (pluginCode && typeof pluginCode.configure === "function") {
          const context = {
            sequelize,
          };
          const result = await pluginCode.configure(
            userId,
            tenantId,
            configuration,
            context
          );
          console.log(
            `[PluginService] Plugin ${installation.plugin_key} configured:`,
            result
          );
        }
      }

      return toJSON(updated);
    } catch (error: any) {
      console.error(
        `[PluginService] Error updating plugin configuration:`,
        error
      );
      throw error;
    }
  }

  /**
   * Test plugin connection
   */
  static async testConnection(
    pluginKey: string,
    configuration: Record<string, any>,
    context?: { userId: number; tenantId: string }
  ): Promise<any> {
    try {
      // Verify plugin exists in marketplace
      const plugin = await this.getPluginByKey(pluginKey);
      if (!plugin) {
        throw new NotFoundException(
          "Plugin not found in marketplace",
          "plugin",
          pluginKey
        );
      }

      // Load plugin and execute testConnection method if it exists
      const pluginCode = await this.loadPluginCode(plugin);
      if (pluginCode && typeof pluginCode.testConnection === "function") {
        const pluginContext = context ? { sequelize, ...context } : undefined;
        const result = await pluginCode.testConnection(configuration, pluginContext);
        console.log(
          "[PluginService] Plugin %s connection test:",
          pluginKey,
          result
        );
        return result;
      }

      // If plugin doesn't implement testConnection, return not supported
      return {
        success: false,
        message: "Plugin does not support connection testing",
      };
    } catch (error: any) {
      console.error(
        `[PluginService] Error testing plugin connection:`,
        error
      );
      throw error;
    }
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Download plugin's package.json from repository
   */
  private static async downloadPluginPackageJson(plugin: Plugin, tempPath: string): Promise<any> {
    try {
      const baseUrl = PLUGIN_MARKETPLACE_URL.replace("/plugins.json", "");
      const packageJsonUrl = `${baseUrl}/${plugin.pluginPath}/package.json`;

      console.log(`[PluginService] Downloading package.json for ${plugin.key} from ${packageJsonUrl}`);

      const response = await axios.get(packageJsonUrl, {
        timeout: 10000,
        responseType: 'json',
      });

      // Save package.json to temp directory
      const packageJsonPath = path.join(tempPath, "package.json");
      fs.writeFileSync(packageJsonPath, JSON.stringify(response.data, null, 2));

      return response.data;
    } catch (error: any) {
      console.error(`[PluginService] Error downloading package.json for ${plugin.key}:`, error);
      throw new Error(`Failed to download package.json: ${error.message}`);
    }
  }

  /**
   * Install plugin dependencies using npm
   */
  private static async installPluginDependencies(plugin: Plugin, tempPath: string, packageJson: any): Promise<void> {
    try {
      if (!packageJson.dependencies || Object.keys(packageJson.dependencies).length === 0) {
        console.log(`[PluginService] No dependencies to install for plugin ${plugin.key}`);
        return;
      }

      const dependenciesCount = Object.keys(packageJson.dependencies).length;
      console.log(`[PluginService] Installing ${dependenciesCount} dependencies for plugin ${plugin.key}...`);

      // Check if node_modules already exists and dependencies are installed
      const nodeModulesPath = path.join(tempPath, "node_modules");
      const packageLockPath = path.join(tempPath, "package-lock.json");

      // If dependencies are already installed and package-lock exists, skip installation
      if (fs.existsSync(nodeModulesPath) && fs.existsSync(packageLockPath)) {
        console.log(`[PluginService] Dependencies already installed for plugin ${plugin.key}`);
        return;
      }

      // Install dependencies using npm
      // Use --prefer-offline to speed up if packages are in npm cache
      // Use --no-audit --no-fund to skip unnecessary checks
      const npmCommand = `npm install --prefer-offline --no-audit --no-fund --production`;

      console.log(`[PluginService] Running: ${npmCommand} in ${tempPath}`);

      execSync(npmCommand, {
        cwd: tempPath,
        stdio: 'pipe', // Suppress output unless there's an error
        timeout: 60000, // 60 second timeout
      });

      console.log(`[PluginService] Successfully installed dependencies for plugin ${plugin.key}`);
    } catch (error: any) {
      console.error(`[PluginService] Error installing dependencies for ${plugin.key}:`, error);
      throw new Error(`Failed to install plugin dependencies: ${error.message}`);
    }
  }

  /**
   * Download plugin UI bundle from marketplace
   */
  private static async downloadPluginUIBundle(plugin: Plugin, tempPath: string): Promise<void> {
    if (!plugin.ui?.bundleUrl) {
      return;
    }

    try {
      const baseUrl = PLUGIN_MARKETPLACE_URL.replace("/plugins.json", "");
      // bundleUrl is like "/plugins/mlflow/ui/dist/index.esm.js"
      // We need to construct the full URL
      const bundleUrl = `${baseUrl}${plugin.ui.bundleUrl}`;

      console.log(`[PluginService] Downloading UI bundle for ${plugin.key} from ${bundleUrl}`);

      const response = await axios.get(bundleUrl, {
        timeout: 30000,
        responseType: 'text',
      });

      // Create the ui/dist directory
      const uiDistPath = path.join(tempPath, "ui", "dist");
      fs.mkdirSync(uiDistPath, { recursive: true });

      // Save the bundle
      const bundleFileName = path.basename(plugin.ui.bundleUrl);
      const bundlePath = path.join(uiDistPath, bundleFileName);
      fs.writeFileSync(bundlePath, response.data);

      console.log(`[PluginService] UI bundle for ${plugin.key} downloaded to ${bundlePath}`);
    } catch (error: any) {
      // UI bundle download failure should not block plugin installation
      console.warn(`[PluginService] Failed to download UI bundle for ${plugin.key}:`, error.message);
    }
  }

  /**
   * Fetch marketplace data from remote Git repository
   */
  private static async fetchRemoteMarketplace(): Promise<PluginMarketplace> {
    try {
      const response = await axios.get(PLUGIN_MARKETPLACE_URL, {
        timeout: 10000,
        headers: {
          "Accept": "application/json",
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("[PluginService] Error fetching remote marketplace:", error);
      throw new Error(`Failed to fetch remote marketplace: ${error.message}`);
    }
  }

  /**
   * Load plugin code from remote Git repository
   * Downloads and executes plugin code from the marketplace
   */
  private static async loadPluginCode(plugin: Plugin): Promise<any> {
    try {
      const pluginCode = await this.downloadAndLoadPlugin(plugin);
      return pluginCode;
    } catch (error: any) {
      console.error(
        `[PluginService] Error loading plugin ${plugin.key}:`,
        error
      );
      throw new Error(`Failed to load plugin code: ${error.message}`);
    }
  }

  /**
   * Download plugin code from Git repository and load it
   * Caches the downloaded code and dependencies for 5 days to avoid unnecessary re-downloads
   */
  private static async downloadAndLoadPlugin(plugin: Plugin): Promise<any> {
    try {
      // 1. Setup paths
      const tempPath = path.join(__dirname, "../../../temp/plugins", plugin.key);
      const entryPointPath = path.join(tempPath, plugin.entryPoint);
      const packageJsonPath = path.join(tempPath, "package.json");

      // 2. Check if cached version exists and is less than 5 days old
      const CACHE_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days in milliseconds
      let shouldDownload = true;

      if (fs.existsSync(entryPointPath) && fs.existsSync(packageJsonPath)) {
        const stats = fs.statSync(entryPointPath);
        const fileAge = Date.now() - stats.mtimeMs;

        if (fileAge < CACHE_DURATION_MS) {
          shouldDownload = false;
          console.log(`[PluginService] Using cached plugin ${plugin.key} (age: ${Math.round(fileAge / (1000 * 60 * 60))} hours)`);
        } else {
          console.log(`[PluginService] Cache expired for plugin ${plugin.key} (age: ${Math.round(fileAge / (1000 * 60 * 60 * 24))} days)`);
        }
      }

      // 3. Download and setup if needed
      if (shouldDownload) {
        // Create temp directory
        fs.mkdirSync(tempPath, { recursive: true });

        // 3a. Download package.json
        const packageJson = await this.downloadPluginPackageJson(plugin, tempPath);

        // 3b. Download plugin entry point
        const baseUrl = PLUGIN_MARKETPLACE_URL.replace("/plugins.json", "");
        const pluginUrl = `${baseUrl}/${plugin.pluginPath}/${plugin.entryPoint}`;

        console.log(`[PluginService] Downloading plugin ${plugin.key} from ${pluginUrl}`);

        const response = await axios.get(pluginUrl, {
          timeout: 10000,
          responseType: 'text',
        });

        fs.writeFileSync(entryPointPath, response.data);

        console.log(`[PluginService] Plugin ${plugin.key} downloaded and cached`);

        // 3c. Install dependencies
        await this.installPluginDependencies(plugin, tempPath, packageJson);

        // 3d. Download UI bundle if plugin has UI configuration
        if (plugin.ui?.bundleUrl) {
          await this.downloadPluginUIBundle(plugin, tempPath);
        }
      }

      // 4. Register ts-node for TypeScript support if entry point is .ts
      if (plugin.entryPoint.endsWith(".ts")) {
        try {
          require("ts-node/register");
        } catch (error) {
          console.warn(
            "[PluginService] ts-node not available, attempting to load TypeScript file directly"
          );
        }
      }

      // 5. Add plugin's node_modules to require paths so dependencies can be resolved
      const pluginNodeModulesPath = path.join(tempPath, "node_modules");
      if (fs.existsSync(pluginNodeModulesPath)) {
        // Add to module paths for this specific require
        const Module = require('module');
        const originalResolveLookupPaths = Module._resolveLookupPaths;

        Module._resolveLookupPaths = function(request: string, parent: any) {
          const paths = originalResolveLookupPaths.call(this, request, parent);
          if (paths && !paths.includes(pluginNodeModulesPath)) {
            paths.push(pluginNodeModulesPath);
          }
          return paths;
        };
      }

      // 6. Clear require cache to ensure fresh load
      delete require.cache[require.resolve(entryPointPath)];

      // 7. Load the plugin code
      const pluginCode = require(entryPointPath);
      return pluginCode;
    } catch (error: any) {
      console.error(`[PluginService] Error downloading plugin ${plugin.key}:`, error);
      throw new Error(`Failed to download plugin: ${error.message}`);
    }
  }

  /**
   * Forward a request to a plugin's router
   * This is the generic routing mechanism that allows plugins to define their own routes
   *
   * @param pluginKey - The plugin key (e.g., "mlflow", "slack", "risk-import")
   * @param context - The request context containing all request details
   * @returns The plugin's response
   */
  static async forwardToPlugin(
    pluginKey: string,
    context: PluginRouteContext
  ): Promise<PluginRouteResponse> {
    try {
      // Check if plugin is installed for this tenant
      const installation = await findByPlugin(pluginKey, context.tenantId);
      if (!installation) {
        throw new NotFoundException(`Plugin '${pluginKey}' is not installed`);
      }

      // Get plugin from marketplace
      const plugin = await this.getPluginByKey(pluginKey);
      if (!plugin) {
        throw new NotFoundException(`Plugin '${pluginKey}' not found in marketplace`);
      }

      // Load plugin code
      const pluginCode = await this.loadPluginCode(plugin);
      if (!pluginCode) {
        throw new Error(`Failed to load plugin code for '${pluginKey}'`);
      }

      // Check if plugin exports a router
      if (!pluginCode.router || typeof pluginCode.router !== "object") {
        throw new NotFoundException(
          `Plugin '${pluginKey}' does not export a router. ` +
          `Ensure the plugin exports: export const router: PluginRouter = { ... }`
        );
      }

      const router: PluginRouter = pluginCode.router;

      // Add plugin configuration to context
      context.configuration = installation.configuration || {};
      context.sequelize = sequelize;

      // Find matching route handler
      const handler = this.matchRoute(router, context.method, context.path, context.params);

      if (!handler) {
        // List available routes for debugging
        const availableRoutes = Object.keys(router).join(", ");
        throw new NotFoundException(
          `Route '${context.method} ${context.path}' not found in plugin '${pluginKey}'. ` +
          `Available routes: ${availableRoutes || "none"}`
        );
      }

      // Execute the handler
      console.log(
        `[PluginService] Forwarding request to plugin: ${pluginKey}`,
        { method: context.method, path: context.path }
      );

      const response = await handler(context);

      console.log(
        `[PluginService] Plugin '${pluginKey}' responded:`,
        { status: response.status || 200, hasData: !!response.data, hasBuffer: !!response.buffer }
      );

      return response;
    } catch (error: any) {
      console.error(
        "[PluginService] Error forwarding to plugin:",
        { pluginKey, method: context.method, path: context.path, error: error.message }
      );
      throw error;
    }
  }

  /**
   * Match a route pattern to a handler in the plugin router
   * Supports path parameters like /models/:modelId
   *
   * @param router - The plugin's router object
   * @param method - HTTP method (GET, POST, etc.)
   * @param path - The request path (e.g., /models/123)
   * @param params - Object to populate with extracted path parameters
   * @returns The matched handler function or null
   */
  private static matchRoute(
    router: PluginRouter,
    method: string,
    path: string,
    params: Record<string, string>
  ): ((context: PluginRouteContext) => Promise<PluginRouteResponse>) | null {
    const normalizedMethod = method.toUpperCase();
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    // First, try exact match
    const exactKey = `${normalizedMethod} ${normalizedPath}`;
    if (router[exactKey]) {
      return router[exactKey];
    }

    // Then, try pattern matching for routes with parameters
    for (const [routeKey, handler] of Object.entries(router)) {
      const [routeMethod, routePattern] = routeKey.split(" ");

      if (routeMethod.toUpperCase() !== normalizedMethod) {
        continue;
      }

      // Check if this is a pattern with parameters (contains :)
      if (!routePattern.includes(":")) {
        // Exact match only
        if (routePattern === normalizedPath) {
          return handler;
        }
        continue;
      }

      // Pattern matching with parameters
      const patternParts = routePattern.split("/").filter(Boolean);
      const pathParts = normalizedPath.split("/").filter(Boolean);

      if (patternParts.length !== pathParts.length) {
        continue;
      }

      let isMatch = true;
      const extractedParams: Record<string, string> = {};

      for (let i = 0; i < patternParts.length; i++) {
        const patternPart = patternParts[i];
        const pathPart = pathParts[i];

        if (patternPart.startsWith(":")) {
          // This is a parameter - extract it
          const paramName = patternPart.slice(1);
          extractedParams[paramName] = pathPart;
        } else if (patternPart !== pathPart) {
          // Static part doesn't match
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        // Populate params object with extracted values
        Object.assign(params, extractedParams);
        return handler;
      }
    }

    return null;
  }
}
