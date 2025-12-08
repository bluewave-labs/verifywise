/**
 * @fileoverview Plugin Controller
 *
 * Handles plugin management operations including listing, installing,
 * enabling, disabling, and configuring plugins.
 *
 * @module controllers/plugin.ctrl
 */

import { Request, Response as ExpressResponse } from "express";
import {
  PluginManager,
  PluginManifest,
  Plugin,
  PluginContext,
  PluginType,
  PluginPermission,
  PluginConfigSchema,
} from "../plugins/core";
import { builtinPlugins } from "../plugins/builtin";
import AdmZip from "adm-zip";
import path from "path";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import logger from "../utils/logger/fileLogger";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Timeout for plugin downloads (larger files need more time) */
const FETCH_TIMEOUT_MS = 60000; // 60 seconds

/** Minimum free disk space required after extraction */
const MIN_FREE_SPACE_BYTES = 50 * 1024 * 1024; // 50MB

/** Safety margin for disk space calculation (10% extra) */
const SPACE_CHECK_MARGIN = 1.1;

/** Plugin directories */
const PLUGIN_DIRS = {
  UPLOADED: "uploaded",
  MARKETPLACE: "marketplace",
} as const;

/** Allowed domains for marketplace plugin downloads */
const ALLOWED_MARKETPLACE_DOMAINS = [
  "github.com",
  "githubusercontent.com",
] as const;

/**
 * Fetch with timeout using AbortController
 * Prevents plugin download requests from hanging indefinitely
 */
async function fetchWithTimeout(
  url: string,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Download timed out. The plugin file may be too large or your connection is slow.");
    }
    if (error instanceof TypeError) {
      throw new Error("Unable to connect to the download server. Please check your internet connection.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Calculate the total uncompressed size of a ZIP file
 */
function getZipUncompressedSize(zip: AdmZip): number {
  let totalSize = 0;
  for (const entry of zip.getEntries()) {
    // header.size is the uncompressed size
    totalSize += entry.header.size;
  }
  return totalSize;
}

/**
 * Get available disk space for a given path
 * Returns available bytes or null if unable to determine
 */
function getAvailableDiskSpace(targetPath: string): number | null {
  try {
    // Use statfsSync if available (Node.js 18.15+)
    if (typeof fs.statfsSync === "function") {
      const stats = fs.statfsSync(targetPath);
      return stats.bavail * stats.bsize; // Available blocks * block size
    }
  } catch (error) {
    logger.warn(`[PluginController] Unable to check disk space: ${error}`);
  }
  return null;
}

interface DiskSpaceCheck {
  hasEnoughSpace: boolean;
  required: number;
  available: number | null;
  error?: string;
}

/**
 * Check if there's enough disk space for extraction
 * Returns { hasEnoughSpace, required, available, error? }
 */
function checkDiskSpaceForExtraction(
  zip: AdmZip,
  targetPath: string
): DiskSpaceCheck {
  const uncompressedSize = getZipUncompressedSize(zip);
  const requiredSpace = Math.ceil(uncompressedSize * SPACE_CHECK_MARGIN);

  // Ensure parent directory exists to check disk space
  const checkPath = fs.existsSync(targetPath) ? targetPath : path.dirname(targetPath);
  const availableSpace = getAvailableDiskSpace(checkPath);

  // If we can't determine available space, allow the operation but log a warning
  if (availableSpace === null) {
    logger.warn(`[PluginController] Unable to verify disk space. Proceeding with extraction.`);
    return {
      hasEnoughSpace: true,
      required: requiredSpace,
      available: null,
    };
  }

  // Check if we have enough space with minimum buffer
  const spaceAfterExtraction = availableSpace - requiredSpace;
  if (spaceAfterExtraction < MIN_FREE_SPACE_BYTES) {
    const requiredMB = Math.ceil(requiredSpace / (1024 * 1024));
    const availableMB = Math.floor(availableSpace / (1024 * 1024));
    return {
      hasEnoughSpace: false,
      required: requiredSpace,
      available: availableSpace,
      error: `Insufficient disk space. Need ${requiredMB}MB but only ${availableMB}MB available.`,
    };
  }

  return {
    hasEnoughSpace: true,
    required: requiredSpace,
    available: availableSpace,
  };
}

// =============================================================================
// ZIP HANDLING HELPERS
// =============================================================================

type ZipParseResult = {
  success: true;
  zip: AdmZip;
  manifest: Record<string, unknown>;
} | {
  success: false;
  error: string;
  statusCode: number;
};

/**
 * Parse a ZIP file and extract its manifest
 * Handles both Buffer (upload) and file path (download) inputs
 */
function parseZipAndManifest(input: Buffer | string): ZipParseResult {
  let zip: AdmZip;
  try {
    zip = new AdmZip(input);
  } catch {
    return {
      success: false,
      error: "Failed to read zip file. The file may be corrupted.",
      statusCode: 400,
    };
  }

  const manifestEntry = zip.getEntry("manifest.json");
  if (!manifestEntry) {
    return {
      success: false,
      error: "Invalid plugin package: manifest.json not found at root level.",
      statusCode: 400,
    };
  }

  let manifest: Record<string, unknown>;
  try {
    const manifestContent = manifestEntry.getData().toString("utf8");
    manifest = JSON.parse(manifestContent);
  } catch {
    return {
      success: false,
      error: "Invalid manifest.json: JSON parsing failed.",
      statusCode: 400,
    };
  }

  return { success: true, zip, manifest };
}

/**
 * Create a typed PluginManifest from a raw manifest object
 */
function createPluginManifestFromRaw(manifest: Record<string, unknown>): PluginManifest {
  return {
    id: manifest.id as string,
    name: manifest.name as string,
    description: manifest.description as string,
    version: manifest.version as string,
    author: manifest.author as string,
    authorUrl: manifest.authorUrl as string | undefined,
    type: manifest.type as PluginType,
    permissions: (manifest.permissions as PluginPermission[]) || [],
    config: (manifest.config as Record<string, PluginConfigSchema>) || {},
    dependencies: (manifest.dependencies as Record<string, string>) || undefined,
  };
}

type ExtractResult = {
  success: true;
  pluginDir: string;
} | {
  success: false;
  error: string;
  statusCode: number;
};

/**
 * Extract a ZIP file to the plugin directory with disk space validation
 */
function extractPluginZip(
  zip: AdmZip,
  pluginId: string,
  targetDir: typeof PLUGIN_DIRS[keyof typeof PLUGIN_DIRS]
): ExtractResult {
  const pluginsDir = path.join(process.cwd(), "plugins", targetDir);
  const pluginDir = path.join(pluginsDir, pluginId);

  // Create directories if they don't exist
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true });
  }

  // Check disk space before extraction
  const spaceCheck = checkDiskSpaceForExtraction(zip, pluginsDir);
  if (!spaceCheck.hasEnoughSpace) {
    return {
      success: false,
      error: spaceCheck.error || "Insufficient disk space for plugin extraction.",
      statusCode: 507,
    };
  }

  // Extract to plugin directory
  zip.extractAllTo(pluginDir, true);

  return { success: true, pluginDir };
}

// Set of built-in plugin IDs for quick lookup
const BUILTIN_PLUGIN_IDS = new Set(builtinPlugins.map((p) => p.manifest.id));

// Plugin manager instance - will be set during app initialization
let pluginManager: PluginManager | null = null;

/**
 * Set the plugin manager instance
 */
export function setPluginManager(manager: PluginManager): void {
  pluginManager = manager;
}

/**
 * Get the plugin manager instance
 */
export function getPluginManager(): PluginManager | null {
  return pluginManager;
}

/**
 * Ensure plugin manager is initialized
 */
function ensurePluginManager(): PluginManager {
  if (!pluginManager) {
    throw new Error("Plugin manager not initialized");
  }
  return pluginManager;
}

/**
 * Plugin response DTO
 */
interface PluginDTO {
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

/**
 * Convert plugin to DTO
 */
function pluginToDTO(
  plugin: Plugin,
  enabled: boolean,
  installed: boolean,
  config?: Record<string, unknown>
): PluginDTO {
  const { manifest } = plugin;
  return {
    id: manifest.id,
    name: manifest.name,
    description: manifest.description,
    version: manifest.version,
    author: manifest.author,
    authorUrl: manifest.authorUrl,
    type: manifest.type,
    icon: manifest.icon,
    enabled,
    installed,
    isBuiltin: BUILTIN_PLUGIN_IDS.has(manifest.id),
    config,
    permissions: manifest.permissions,
  };
}

/**
 * GET /api/plugins
 *
 * List all registered plugins with their status.
 */
export async function getAllPlugins(
  req: Request,
  res: ExpressResponse
): Promise<void> {
  try {
    const manager = ensurePluginManager();
    const plugins = manager.getAllPlugins();

    const response: PluginDTO[] = plugins.map((plugin) => {
      const enabled = manager.isEnabled(plugin.manifest.id);
      const installed = manager.isInstalled(plugin.manifest.id);
      const config = manager.getContextFactory().getPluginConfig(plugin.manifest.id);
      return pluginToDTO(plugin, enabled, installed, config);
    });

    res.status(200).json({
      success: true,
      data: response,
      stats: manager.getStats(),
    });
  } catch (error) {
    logger.error("[PluginController] Error listing plugins:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to list plugins",
    });
  }
}

/**
 * GET /api/plugins/:id
 *
 * Get a specific plugin by ID.
 */
export async function getPluginById(
  req: Request,
  res: ExpressResponse
): Promise<void> {
  try {
    const manager = ensurePluginManager();
    const { id } = req.params;

    const plugin = manager.getPlugin(id);
    if (!plugin) {
      res.status(404).json({
        success: false,
        error: `Plugin "${id}" not found`,
      });
      return;
    }

    const enabled = manager.isEnabled(id);
    const installed = manager.isInstalled(id);
    const config = manager.getContextFactory().getPluginConfig(id);

    res.status(200).json({
      success: true,
      data: pluginToDTO(plugin, enabled, installed, config),
    });
  } catch (error) {
    logger.error("[PluginController] Error getting plugin:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get plugin",
    });
  }
}

/**
 * POST /api/plugins/:id/install
 *
 * Install a plugin (first-time setup).
 */
export async function installPlugin(
  req: Request,
  res: ExpressResponse
): Promise<void> {
  try {
    const manager = ensurePluginManager();
    const { id } = req.params;

    const plugin = manager.getPlugin(id);
    if (!plugin) {
      res.status(404).json({
        success: false,
        error: `Plugin "${id}" not found`,
      });
      return;
    }

    if (manager.isInstalled(id)) {
      res.status(400).json({
        success: false,
        error: `Plugin "${id}" is already installed`,
      });
      return;
    }

    await manager.installPlugin(id);

    // Persist installed state to database
    try {
      const { savePluginState } = await import("../plugins/init");
      await savePluginState(id, true, false, {});
    } catch (stateError) {
      logger.warn(`[PluginController] Failed to save plugin state: ${stateError}`);
    }

    res.status(200).json({
      success: true,
      message: `Plugin "${id}" installed successfully`,
    });
  } catch (error) {
    logger.error("[PluginController] Error installing plugin:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to install plugin",
    });
  }
}

/**
 * POST /api/plugins/:id/uninstall
 *
 * Uninstall a plugin (permanent removal).
 * For non-builtin plugins, this also removes files and database state.
 */
export async function uninstallPlugin(
  req: Request,
  res: ExpressResponse
): Promise<void> {
  try {
    const manager = ensurePluginManager();
    const { id } = req.params;

    const plugin = manager.getPlugin(id);
    if (!plugin) {
      res.status(404).json({
        success: false,
        error: `Plugin "${id}" not found`,
      });
      return;
    }

    const isBuiltin = BUILTIN_PLUGIN_IDS.has(id);

    // For non-builtin plugins, check if installed
    if (!isBuiltin && !manager.isInstalled(id)) {
      res.status(400).json({
        success: false,
        error: `Plugin "${id}" is not installed`,
      });
      return;
    }

    // Uninstall the plugin (calls onUninstall hook, marks as not installed)
    await manager.uninstallPlugin(id);

    // For non-builtin plugins, fully remove from system
    if (!isBuiltin) {
      // Delete database state
      try {
        const { deletePluginState, deletePluginFiles } = await import("../plugins/init");
        await deletePluginState(id);
        deletePluginFiles(id);
      } catch (cleanupError) {
        logger.warn(`[PluginController] Partial cleanup for "${id}":`, cleanupError);
      }

      // Unregister from plugin manager
      manager.unregisterPlugin(id);

      logger.info(`[PluginController] Plugin "${id}" fully uninstalled and removed`);
    }

    res.status(200).json({
      success: true,
      message: `Plugin "${id}" uninstalled successfully`,
    });
  } catch (error) {
    logger.error("[PluginController] Error uninstalling plugin:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to uninstall plugin",
    });
  }
}

/**
 * POST /api/plugins/:id/enable
 *
 * Enable a plugin.
 */
export async function enablePlugin(
  req: Request,
  res: ExpressResponse
): Promise<void> {
  try {
    const manager = ensurePluginManager();
    const { id } = req.params;

    const plugin = manager.getPlugin(id);
    if (!plugin) {
      res.status(404).json({
        success: false,
        error: `Plugin "${id}" not found`,
      });
      return;
    }

    // Auto-install builtin plugins if not installed
    if (!manager.isInstalled(id)) {
      if (BUILTIN_PLUGIN_IDS.has(id)) {
        await manager.installPlugin(id);
      } else {
        res.status(400).json({
          success: false,
          error: `Plugin "${id}" must be installed before enabling`,
        });
        return;
      }
    }

    if (manager.isEnabled(id)) {
      res.status(400).json({
        success: false,
        error: `Plugin "${id}" is already enabled`,
      });
      return;
    }

    // Load if not loaded
    await manager.loadPlugin(id);
    await manager.enablePlugin(id);

    // Persist enabled state to database
    try {
      const { savePluginState } = await import("../plugins/init");
      const config = manager.getContextFactory().getPluginConfig(id);
      await savePluginState(id, true, true, config);
    } catch (stateError) {
      logger.warn(`[PluginController] Failed to save plugin state: ${stateError}`);
    }

    res.status(200).json({
      success: true,
      message: `Plugin "${id}" enabled successfully`,
    });
  } catch (error) {
    logger.error("[PluginController] Error enabling plugin:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to enable plugin",
    });
  }
}

/**
 * POST /api/plugins/:id/disable
 *
 * Disable a plugin.
 */
export async function disablePlugin(
  req: Request,
  res: ExpressResponse
): Promise<void> {
  try {
    const manager = ensurePluginManager();
    const { id } = req.params;

    const plugin = manager.getPlugin(id);
    if (!plugin) {
      res.status(404).json({
        success: false,
        error: `Plugin "${id}" not found`,
      });
      return;
    }

    if (!manager.isEnabled(id)) {
      res.status(400).json({
        success: false,
        error: `Plugin "${id}" is already disabled`,
      });
      return;
    }

    await manager.disablePlugin(id);

    // Persist disabled state to database
    try {
      const { savePluginState } = await import("../plugins/init");
      const config = manager.getContextFactory().getPluginConfig(id);
      await savePluginState(id, true, false, config);
    } catch (stateError) {
      logger.warn(`[PluginController] Failed to save plugin state: ${stateError}`);
    }

    res.status(200).json({
      success: true,
      message: `Plugin "${id}" disabled successfully`,
    });
  } catch (error) {
    logger.error("[PluginController] Error disabling plugin:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to disable plugin",
    });
  }
}

/**
 * GET /api/plugins/:id/config
 *
 * Get plugin configuration.
 */
export async function getPluginConfig(
  req: Request,
  res: ExpressResponse
): Promise<void> {
  try {
    const manager = ensurePluginManager();
    const { id } = req.params;

    const plugin = manager.getPlugin(id);
    if (!plugin) {
      res.status(404).json({
        success: false,
        error: `Plugin "${id}" not found`,
      });
      return;
    }

    const config = manager.getContextFactory().getPluginConfig(id);
    const schema = plugin.manifest.config;

    res.status(200).json({
      success: true,
      data: {
        config,
        schema,
      },
    });
  } catch (error) {
    logger.error("[PluginController] Error getting plugin config:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get plugin config",
    });
  }
}

/**
 * PUT /api/plugins/:id/config
 *
 * Update plugin configuration.
 */
export async function updatePluginConfig(
  req: Request,
  res: ExpressResponse
): Promise<void> {
  try {
    const manager = ensurePluginManager();
    const { id } = req.params;
    const newConfig = req.body;

    const plugin = manager.getPlugin(id);
    if (!plugin) {
      res.status(404).json({
        success: false,
        error: `Plugin "${id}" not found`,
      });
      return;
    }

    // Validate config against schema if defined
    const schema = plugin.manifest.config;
    if (schema) {
      const validationErrors = validateConfig(newConfig, schema);
      if (validationErrors.length > 0) {
        res.status(400).json({
          success: false,
          error: "Invalid configuration",
          validationErrors,
        });
        return;
      }
    }

    manager.getContextFactory().setPluginConfig(id, newConfig);

    // Persist config to database
    try {
      const { savePluginState } = await import("../plugins/init");
      const installed = manager.isInstalled(id);
      const enabled = manager.isEnabled(id);
      await savePluginState(id, installed, enabled, newConfig);
    } catch (stateError) {
      logger.warn(`[PluginController] Failed to save plugin config: ${stateError}`);
    }

    res.status(200).json({
      success: true,
      message: `Plugin "${id}" configuration updated successfully`,
      data: { config: newConfig },
    });
  } catch (error) {
    logger.error("[PluginController] Error updating plugin config:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to update plugin config",
    });
  }
}

/**
 * GET /api/plugins/stats
 *
 * Get plugin system statistics.
 */
export async function getPluginStats(
  req: Request,
  res: ExpressResponse
): Promise<void> {
  try {
    const manager = ensurePluginManager();

    res.status(200).json({
      success: true,
      data: manager.getStats(),
    });
  } catch (error) {
    logger.error("[PluginController] Error getting plugin stats:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to get plugin stats",
    });
  }
}

/**
 * Validate configuration against schema
 */
function validateConfig(
  config: Record<string, unknown>,
  schema: Record<string, { type: string; required?: boolean }>
): string[] {
  const errors: string[] = [];

  for (const [key, definition] of Object.entries(schema)) {
    const value = config[key];

    // Check required fields
    if (definition.required && (value === undefined || value === null)) {
      errors.push(`Missing required field: ${key}`);
      continue;
    }

    // Skip validation if not provided and not required
    if (value === undefined || value === null) {
      continue;
    }

    // Type validation
    const actualType = Array.isArray(value) ? "array" : typeof value;
    if (actualType !== definition.type) {
      errors.push(
        `Invalid type for "${key}": expected ${definition.type}, got ${actualType}`
      );
    }
  }

  return errors;
}

/**
 * Required manifest fields for validation
 */
const REQUIRED_MANIFEST_FIELDS = ["id", "name", "version", "author", "type", "description"];

/**
 * Valid plugin types
 */
const VALID_PLUGIN_TYPES = ["feature", "integration", "framework", "reporting"];

/**
 * Validate plugin manifest
 */
function validateManifest(manifest: Record<string, unknown>): string[] {
  const errors: string[] = [];

  // Check required fields
  for (const field of REQUIRED_MANIFEST_FIELDS) {
    if (!manifest[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate field types
  if (manifest.id && typeof manifest.id !== "string") {
    errors.push("Field 'id' must be a string");
  }

  if (manifest.name && typeof manifest.name !== "string") {
    errors.push("Field 'name' must be a string");
  }

  if (manifest.version && typeof manifest.version !== "string") {
    errors.push("Field 'version' must be a string");
  }

  if (manifest.author && typeof manifest.author !== "string") {
    errors.push("Field 'author' must be a string");
  }

  if (manifest.type && typeof manifest.type !== "string") {
    errors.push("Field 'type' must be a string");
  } else if (manifest.type && !VALID_PLUGIN_TYPES.includes(manifest.type as string)) {
    errors.push(`Invalid type: ${manifest.type}. Must be one of: ${VALID_PLUGIN_TYPES.join(", ")}`);
  }

  if (manifest.description && typeof manifest.description !== "string") {
    errors.push("Field 'description' must be a string");
  }

  // Validate optional fields
  if (manifest.permissions !== undefined) {
    if (!Array.isArray(manifest.permissions)) {
      errors.push("Field 'permissions' must be an array");
    } else if (!manifest.permissions.every((p: unknown) => typeof p === "string")) {
      errors.push("All permissions must be strings");
    }
  }

  if (manifest.dependencies !== undefined) {
    if (typeof manifest.dependencies !== "object" || manifest.dependencies === null) {
      errors.push("Field 'dependencies' must be an object");
    }
  }

  if (manifest.config !== undefined) {
    if (typeof manifest.config !== "object" || manifest.config === null) {
      errors.push("Field 'config' must be an object");
    }
  }

  return errors;
}

/**
 * Create a dynamic plugin from manifest
 * Exported for use by init.ts to load marketplace plugins from disk
 */
export function createDynamicPlugin(manifest: PluginManifest): Plugin {
  return {
    manifest,

    async onInstall(context: PluginContext): Promise<void> {
      context.logger.info(`Uploaded plugin "${manifest.name}" installed`);
    },

    async onUninstall(context: PluginContext): Promise<void> {
      context.logger.info(`Uploaded plugin "${manifest.name}" uninstalled`);
    },

    async onEnable(context: PluginContext): Promise<void> {
      context.logger.info(`Uploaded plugin "${manifest.name}" enabled`);
    },

    async onDisable(context: PluginContext): Promise<void> {
      context.logger.info(`Uploaded plugin "${manifest.name}" disabled`);
    },
  };
}

/**
 * POST /api/plugins/upload
 *
 * Upload and register a new plugin from a zip file.
 * The zip must contain a manifest.json file at the root level.
 */
export async function uploadPlugin(
  req: Request,
  res: ExpressResponse
): Promise<void> {
  let tempDir: string | null = null;

  try {
    const manager = ensurePluginManager();

    // Check if file was uploaded
    const file = req.file;
    if (!file) {
      res.status(400).json({
        success: false,
        error: "No file uploaded. Please upload a .zip plugin package.",
      });
      return;
    }

    // Validate file type
    if (!file.originalname.endsWith(".zip")) {
      res.status(400).json({
        success: false,
        error: "Invalid file type. Only .zip files are accepted.",
      });
      return;
    }

    // Create temp directory for extraction
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "plugin-upload-"));

    // Parse ZIP and extract manifest using helper
    const parseResult = parseZipAndManifest(file.buffer);
    if (!parseResult.success) {
      res.status(parseResult.statusCode).json({
        success: false,
        error: parseResult.error,
      });
      return;
    }

    const { zip, manifest } = parseResult;

    // Validate manifest
    const validationErrors = validateManifest(manifest);
    if (validationErrors.length > 0) {
      res.status(400).json({
        success: false,
        error: "Invalid manifest.json",
        validationErrors,
      });
      return;
    }

    // Check if plugin already exists
    const pluginId = manifest.id as string;
    const existingPlugin = manager.getPlugin(pluginId);
    if (existingPlugin) {
      res.status(409).json({
        success: false,
        error: `Plugin "${pluginId}" already exists. Uninstall it first to upload a new version.`,
      });
      return;
    }

    // Extract to plugins directory using helper
    const extractResult = extractPluginZip(zip, pluginId, PLUGIN_DIRS.UPLOADED);
    if (!extractResult.success) {
      res.status(extractResult.statusCode).json({
        success: false,
        error: extractResult.error,
      });
      return;
    }

    // Create dynamic plugin from manifest using helper
    const pluginManifest = createPluginManifestFromRaw(manifest);

    const plugin = createDynamicPlugin(pluginManifest);

    // Register the plugin
    manager.registerPlugin(plugin, {});

    logger.info(`[PluginController] Plugin "${pluginId}" uploaded and registered successfully`);

    res.status(200).json({
      success: true,
      message: `Plugin "${pluginManifest.name}" uploaded successfully`,
      data: {
        id: pluginManifest.id,
        name: pluginManifest.name,
        version: pluginManifest.version,
        type: pluginManifest.type,
      },
    });
  } catch (error) {
    logger.error("[PluginController] Error uploading plugin:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload plugin",
    });
  } finally {
    // Cleanup temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch (cleanupError) {
        logger.warn(`[PluginController] Failed to cleanup temp directory: ${tempDir}`, cleanupError);
      }
    }
  }
}

/**
 * Verify URL is from allowed marketplace domain
 */
function isAllowedMarketplaceUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_MARKETPLACE_DOMAINS.some(domain =>
      parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * POST /api/plugins/install-from-url
 *
 * Install a plugin from a marketplace URL.
 * Downloads the zip file, validates checksum, and installs the plugin.
 */
export async function installFromUrl(
  req: Request,
  res: ExpressResponse
): Promise<void> {
  let tempDir: string | null = null;

  try {
    const manager = ensurePluginManager();
    const { id, name, version, downloadUrl, checksum } = req.body;

    // Validate required fields
    if (!id || !name || !version || !downloadUrl) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: id, name, version, downloadUrl",
      });
      return;
    }

    // Validate URL is from allowed domain
    if (!isAllowedMarketplaceUrl(downloadUrl)) {
      res.status(400).json({
        success: false,
        error: "Invalid download URL. Only plugins from the official marketplace are allowed.",
      });
      return;
    }

    // Check if plugin already exists
    const existingPlugin = manager.getPlugin(id);
    if (existingPlugin) {
      res.status(409).json({
        success: false,
        error: `Plugin "${id}" already exists. Uninstall it first to install a new version.`,
      });
      return;
    }

    // Create temp directory
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "plugin-marketplace-"));
    const tempZipPath = path.join(tempDir, "plugin.zip");

    // Download the zip file
    logger.info(`[PluginController] Downloading plugin from: ${downloadUrl}`);

    let fetchResponse: Awaited<ReturnType<typeof fetchWithTimeout>>;
    try {
      fetchResponse = await fetchWithTimeout(downloadUrl);
    } catch (fetchError) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : "Failed to download plugin";
      logger.error(`[PluginController] Download failed: ${errorMessage}`);
      res.status(400).json({
        success: false,
        error: errorMessage,
      });
      return;
    }

    if (!fetchResponse.ok) {
      res.status(400).json({
        success: false,
        error: `Failed to download plugin: HTTP ${fetchResponse.status}`,
      });
      return;
    }

    // Validate content-type to ensure we're downloading a ZIP file
    const contentType = fetchResponse.headers.get("content-type");
    if (contentType && !contentType.includes("application/zip") &&
        !contentType.includes("application/octet-stream") &&
        !contentType.includes("application/x-zip")) {
      logger.warn(`[PluginController] Unexpected content-type: ${contentType}`);
      // Don't fail hard - GitHub raw returns application/octet-stream
    }

    const arrayBuffer = await fetchResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate checksum if provided
    if (checksum) {
      const hash = crypto.createHash("sha256").update(buffer).digest("hex").toLowerCase();
      // Strip the "sha256:" prefix if present for comparison, normalize to lowercase
      const expectedHash = (checksum.startsWith("sha256:") ? checksum.slice(7) : checksum).toLowerCase();
      if (hash !== expectedHash) {
        logger.info(`[PluginController] Checksum mismatch: expected ${expectedHash}, got ${hash}`);
        res.status(400).json({
          success: false,
          error: "Checksum verification failed. The plugin file may be corrupted or tampered with.",
        });
        return;
      }
      logger.info(`[PluginController] Checksum verified for plugin: ${id}`);
    }

    // Save to temp file
    fs.writeFileSync(tempZipPath, buffer);

    // Parse ZIP and extract manifest using helper
    const parseResult = parseZipAndManifest(tempZipPath);
    if (!parseResult.success) {
      res.status(parseResult.statusCode).json({
        success: false,
        error: parseResult.error,
      });
      return;
    }

    const { zip, manifest } = parseResult;

    // Validate manifest
    const validationErrors = validateManifest(manifest);
    if (validationErrors.length > 0) {
      res.status(400).json({
        success: false,
        error: "Invalid manifest.json",
        validationErrors,
      });
      return;
    }

    // Verify manifest ID matches expected ID
    if (manifest.id !== id) {
      res.status(400).json({
        success: false,
        error: `Manifest ID mismatch: expected "${id}", got "${manifest.id}"`,
      });
      return;
    }

    // Extract to plugins directory using helper
    const extractResult = extractPluginZip(zip, id, PLUGIN_DIRS.MARKETPLACE);
    if (!extractResult.success) {
      res.status(extractResult.statusCode).json({
        success: false,
        error: extractResult.error,
      });
      return;
    }

    // Create dynamic plugin from manifest using helper
    const pluginManifest = createPluginManifestFromRaw(manifest);

    const plugin = createDynamicPlugin(pluginManifest);

    // Register the plugin
    manager.registerPlugin(plugin, {});

    // Install the plugin (mark as installed in the registry)
    await manager.installPlugin(pluginManifest.id);

    // Save plugin state to database for persistence
    try {
      const { savePluginState } = await import("../plugins/init");
      await savePluginState(pluginManifest.id, true, false, {});
    } catch (stateError) {
      // Log but don't fail - plugin is installed, just state wasn't persisted
      logger.warn(`[PluginController] Failed to save plugin state: ${stateError}`);
    }

    logger.info(`[PluginController] Plugin "${id}" installed from marketplace successfully`);

    res.status(200).json({
      success: true,
      message: `Plugin "${pluginManifest.name}" installed successfully`,
      data: {
        id: pluginManifest.id,
        name: pluginManifest.name,
        version: pluginManifest.version,
      },
    });
  } catch (error) {
    logger.error("[PluginController] Error installing plugin from URL:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to install plugin from marketplace",
    });
  } finally {
    // Cleanup temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true });
      } catch (cleanupError) {
        logger.warn(`[PluginController] Failed to cleanup temp directory: ${tempDir}`, cleanupError);
      }
    }
  }
}
