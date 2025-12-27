import express from "express";
import rateLimit from "express-rate-limit";
const router = express.Router();

import authenticateJWT from "../middleware/auth.middleware";
import {
  getAllPlugins,
  getPluginByKey,
  searchPlugins,
  installPlugin,
  uninstallPlugin,
  getInstalledPlugins,
  getCategories,
  updatePluginConfiguration,
  testPluginConnection,
  connectOAuthWorkspace,
  getOAuthWorkspaces,
  updateOAuthWorkspace,
  disconnectOAuthWorkspace,
} from "../controllers/plugin.ctrl";

// Rate limiter for plugin installation (prevent abuse)
const installPluginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 20, // limit each IP to 20 install requests per hour
  message: {
    error:
      "Too many plugin installation requests from this IP, please try again after an hour.",
  },
});

// Marketplace routes (public plugin listing)
router.get("/marketplace", authenticateJWT, getAllPlugins);
router.get("/marketplace/:key", authenticateJWT, getPluginByKey);
router.get("/marketplace/search", authenticateJWT, searchPlugins);
router.get("/categories", authenticateJWT, getCategories);

// Installation management routes
router.post("/install", authenticateJWT, installPluginLimiter, installPlugin);
router.delete("/installations/:id", authenticateJWT, uninstallPlugin);
router.get("/installations", authenticateJWT, getInstalledPlugins);
router.put("/installations/:id/configuration", authenticateJWT, updatePluginConfiguration);
router.post("/:key/test-connection", authenticateJWT, testPluginConnection);

// OAuth workspace management routes (for Slack plugin)
router.post("/:key/oauth/connect", authenticateJWT, connectOAuthWorkspace);
router.get("/:key/oauth/workspaces", authenticateJWT, getOAuthWorkspaces);
router.patch("/:key/oauth/workspaces/:webhookId", authenticateJWT, updateOAuthWorkspace);
router.delete("/:key/oauth/workspaces/:webhookId", authenticateJWT, disconnectOAuthWorkspace);

export default router;
