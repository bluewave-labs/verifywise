/**
 * @fileoverview Marketplace Routes
 *
 * Defines RESTful API endpoints for the plugin marketplace.
 * All endpoints require authentication.
 *
 * Endpoints:
 * - GET /marketplace - Browse all available plugins
 * - GET /marketplace/categories - Get plugin categories
 * - GET /marketplace/tags - Get available tags
 * - GET /marketplace/updates - Get plugins with available updates
 * - POST /marketplace/refresh - Force refresh the registry
 * - GET /marketplace/:id - Get plugin details
 *
 * @module routes/marketplace.route
 */

import express from "express";

const router = express.Router();

import {
  getMarketplacePlugins,
  getMarketplacePluginById,
  getMarketplaceCategories,
  getMarketplaceTags,
  getAvailableUpdates,
  refreshRegistry,
} from "../controllers/marketplace.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

/**
 * GET /marketplace
 *
 * Get all available plugins from the marketplace.
 * Supports filtering and search.
 *
 * Query params:
 * - type: Filter by plugin type (integration, feature, framework, reporting)
 * - search: Search by name, description, or tags
 * - installed: Filter by installation status (true, false, updates)
 * - refresh: Force refresh the registry cache (true)
 */
router.get("/", authenticateJWT, getMarketplacePlugins);

/**
 * GET /marketplace/categories
 *
 * Get available plugin categories (types) with counts.
 */
router.get("/categories", authenticateJWT, getMarketplaceCategories);

/**
 * GET /marketplace/tags
 *
 * Get all available tags with counts.
 */
router.get("/tags", authenticateJWT, getMarketplaceTags);

/**
 * GET /marketplace/updates
 *
 * Get plugins that have updates available.
 */
router.get("/updates", authenticateJWT, getAvailableUpdates);

/**
 * POST /marketplace/refresh
 *
 * Force refresh the registry cache.
 */
router.post("/refresh", authenticateJWT, refreshRegistry);

/**
 * GET /marketplace/:id
 *
 * Get details of a specific marketplace plugin.
 */
router.get("/:id", authenticateJWT, getMarketplacePluginById);

export default router;
