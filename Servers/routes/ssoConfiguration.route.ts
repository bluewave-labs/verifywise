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
  validateSSOConfiguration,
  testSSOConfiguration,
} from "../controllers/ssoConfiguration.ctrl";

import authenticateJWT from "../middleware/auth.middleware";

// GET requests
router.get("/:organizationId", authenticateJWT, getSSOConfiguration);

// POST/PUT requests
router.post("/:organizationId", authenticateJWT, createOrUpdateSSOConfiguration);
router.put("/:organizationId", authenticateJWT, createOrUpdateSSOConfiguration);

// DELETE requests
router.delete("/:organizationId", authenticateJWT, deleteSSOConfiguration);

// SSO Control requests
router.post("/:organizationId/enable", authenticateJWT, enableSSO);
router.post("/:organizationId/disable", authenticateJWT, disableSSO);

// SSO Validation and Testing requests
router.post("/:organizationId/validate", authenticateJWT, validateSSOConfiguration);
router.post("/:organizationId/test", authenticateJWT, testSSOConfiguration);

export default router;