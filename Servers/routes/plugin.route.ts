import express from "express";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import axios from "axios";
import { PLUGIN_MARKETPLACE_BASE_URL } from "../services/plugin/pluginService";
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
  getMLflowModels,
  syncMLflowModels,
  getRiskImportTemplate,
  importRisks,
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

// MLflow plugin routes
router.get("/:key/models", authenticateJWT, getMLflowModels);
router.post("/:key/sync", authenticateJWT, syncMLflowModels);

// Risk Import plugin routes
router.get("/:key/template", authenticateJWT, getRiskImportTemplate);
router.post("/:key/import", authenticateJWT, importRisks);

// Serve plugin UI bundles from temp/plugins/{key}/ui/dist/
// If bundle doesn't exist locally, download it from the marketplace
router.get("/:key/ui/dist/:filename", async (req, res) => {
  const { key, filename } = req.params;
  const bundlePath = path.join(__dirname, "../../temp/plugins", key, "ui", "dist", filename);
  console.log("[Plugin UI] Requested:", key, filename, "Path:", bundlePath, "Exists:", fs.existsSync(bundlePath));

  // If bundle doesn't exist, try to download it
  if (!fs.existsSync(bundlePath)) {
    try {
      console.log(`[Plugin UI] Bundle not found locally, downloading from marketplace...`);
      const bundleUrl = `${PLUGIN_MARKETPLACE_BASE_URL}/plugins/${key}/ui/dist/${filename}`;

      const response = await axios.get(bundleUrl, {
        timeout: 30000,
        responseType: 'arraybuffer',
      });

      // Create directory and save bundle
      const dirPath = path.dirname(bundlePath);
      fs.mkdirSync(dirPath, { recursive: true });
      fs.writeFileSync(bundlePath, Buffer.from(response.data));
      console.log(`[Plugin UI] Bundle downloaded and saved to: ${bundlePath}`);
    } catch (downloadError: any) {
      console.error(`[Plugin UI] Failed to download bundle:`, downloadError.message);
      res.status(404).json({ error: "Plugin UI bundle not found" });
      return;
    }
  }

  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(bundlePath);
});

export default router;
