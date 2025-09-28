/**
 * Express router for handling SSO configuration routes.
 *
 * This router provides endpoints for creating, retrieving, updating, and deleting SSO configurations,
 * as well as enabling/disabling SSO for organizations.
 *
 * @module routes/sso-configuration.route
 */

import express from "express";
const router = express.Router();

import {
  getSSOConfiguration,
  createOrUpdateSSOConfiguration,
  deleteSSOConfiguration,
  enableSSO,
  disableSSO,
} from "../controllers/ssoConfiguration.ctrl";

import authenticateJWT from "../middleware/auth.middleware";
import { ssoConfigRateLimit } from "../middleware/rateLimiting.middleware";

// GET requests
router.get("/:organizationId", ssoConfigRateLimit, authenticateJWT, getSSOConfiguration);

// POST/PUT requests
router.post("/:organizationId", ssoConfigRateLimit, authenticateJWT, createOrUpdateSSOConfiguration);
router.put("/:organizationId", ssoConfigRateLimit, authenticateJWT, createOrUpdateSSOConfiguration);

// DELETE requests
router.delete("/:organizationId", ssoConfigRateLimit, authenticateJWT, deleteSSOConfiguration);

// SSO Control requests
router.post("/:organizationId/enable", ssoConfigRateLimit, authenticateJWT, enableSSO);
router.post("/:organizationId/disable", ssoConfigRateLimit, authenticateJWT, disableSSO);

export default router;