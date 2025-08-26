import express from "express";
const router = express.Router();

import {
  getAllIntegrations,
  getConfluenceIntegration,
  disconnectConfluence,
  getIntegrationSettings,
  updateIntegrationSettings,
} from "../controllers/integration.ctrl";
import {
  connectConfluenceWithToken,
} from "../controllers/confluence-apitoken.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/", authenticateJWT, getAllIntegrations);
router.get("/confluence", authenticateJWT, getConfluenceIntegration);


// POST requests  
router.post("/confluence/connect-token", authenticateJWT, connectConfluenceWithToken); // API Token connection
router.post("/confluence/disconnect", authenticateJWT, disconnectConfluence);

// Settings routes
router.get("/:integrationType/settings", authenticateJWT, getIntegrationSettings);
router.put("/:integrationType/settings", authenticateJWT, updateIntegrationSettings);

export default router;