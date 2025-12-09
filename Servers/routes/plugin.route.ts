/**
 * @fileoverview Plugin Routes
 *
 * Defines RESTful API endpoints for plugin management.
 * All endpoints require authentication and admin role.
 *
 * Protected Endpoints:
 * - GET /plugins - List all plugins
 * - GET /plugins/stats - Get plugin system stats
 * - POST /plugins/upload - Upload a new plugin
 * - POST /plugins/install-from-url - Install from marketplace URL
 * - GET /plugins/:id - Get plugin by ID
 * - POST /plugins/:id/install - Install a plugin
 * - POST /plugins/:id/uninstall - Uninstall a plugin
 * - POST /plugins/:id/enable - Enable a plugin
 * - POST /plugins/:id/disable - Disable a plugin
 * - GET /plugins/:id/config - Get plugin config
 * - PUT /plugins/:id/config - Update plugin config
 *
 * @module routes/plugin.route
 */

import express from "express";
import multer from "multer";

const router = express.Router();

// Configure multer for memory storage (we process the file in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (
    _req: express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    if (
      file.mimetype === "application/zip" ||
      file.originalname.endsWith(".zip")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only .zip files are allowed"));
    }
  },
});

import {
  getAllPlugins,
  getPluginById,
  installPlugin,
  uninstallPlugin,
  enablePlugin,
  disablePlugin,
  getPluginConfig,
  updatePluginConfig,
  getPluginStats,
  uploadPlugin,
  installFromUrl,
  getPluginUIExtensions,
} from "../controllers/plugin.ctrl";

import authenticateJWT from "../middleware/auth.middleware";
import requireAdmin from "../middleware/admin.middleware";
import { generalApiLimiter } from "../middleware/rateLimit.middleware";

/**
 * GET /plugins
 *
 * List all registered plugins with their status.
 * Requires authentication.
 */
router.get("/", authenticateJWT, getAllPlugins);

/**
 * GET /plugins/stats
 *
 * Get plugin system statistics.
 * Requires authentication.
 */
router.get("/stats", authenticateJWT, getPluginStats);

/**
 * GET /plugins/ui-extensions
 *
 * Get UI extensions from all enabled plugins.
 * Returns dashboard widgets that should be rendered.
 * Requires authentication.
 */
router.get("/ui-extensions", authenticateJWT, getPluginUIExtensions);

/**
 * POST /plugins/upload
 *
 * Upload a new plugin from a zip file.
 * The zip must contain a manifest.json at the root level.
 * Requires authentication and admin role.
 * Rate limited to prevent abuse.
 */
router.post("/upload", authenticateJWT, requireAdmin, generalApiLimiter, upload.single("plugin"), uploadPlugin);

/**
 * POST /plugins/install-from-url
 *
 * Install a plugin from the marketplace by URL.
 * Downloads the plugin from the provided URL, validates checksum,
 * and installs it.
 * Requires authentication and admin role.
 * Rate limited to prevent abuse.
 */
router.post("/install-from-url", authenticateJWT, requireAdmin, generalApiLimiter, installFromUrl);

/**
 * GET /plugins/:id
 *
 * Get a specific plugin by ID.
 * Requires authentication.
 */
router.get("/:id", authenticateJWT, getPluginById);

/**
 * POST /plugins/:id/install
 *
 * Install a plugin (first-time setup).
 * Requires authentication and admin role.
 */
router.post("/:id/install", authenticateJWT, requireAdmin, installPlugin);

/**
 * POST /plugins/:id/uninstall
 *
 * Uninstall a plugin (permanent removal).
 * Requires authentication and admin role.
 */
router.post("/:id/uninstall", authenticateJWT, requireAdmin, uninstallPlugin);

/**
 * POST /plugins/:id/enable
 *
 * Enable a plugin.
 * Requires authentication and admin role.
 */
router.post("/:id/enable", authenticateJWT, requireAdmin, enablePlugin);

/**
 * POST /plugins/:id/disable
 *
 * Disable a plugin.
 * Requires authentication and admin role.
 */
router.post("/:id/disable", authenticateJWT, requireAdmin, disablePlugin);

/**
 * GET /plugins/:id/config
 *
 * Get plugin configuration.
 * Requires authentication.
 */
router.get("/:id/config", authenticateJWT, getPluginConfig);

/**
 * PUT /plugins/:id/config
 *
 * Update plugin configuration.
 * Requires authentication and admin role.
 */
router.put("/:id/config", authenticateJWT, requireAdmin, updatePluginConfig);

export default router;
