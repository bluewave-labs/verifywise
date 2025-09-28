/**
 * Express router for handling SSO authentication routes.
 *
 * This router provides endpoints for Azure AD OAuth flow including
 * login initiation, callback handling, and SSO status checking.
 *
 * @module routes/ssoAuth.route
 */

import express from "express";
const router = express.Router();

import {
  initiateSSOLogin,
  handleSSOCallback,
  getSSOLoginUrl,
  checkSSOAvailability,
  getOrganizationSSOConfig,
  checkUserOrganization,
  getAvailableSSOProviders,
} from "../controllers/ssoAuth.ctrl";

import {
  ssoLoginRateLimit,
  ssoCallbackRateLimit,
  generalSsoRateLimit,
} from "../middleware/rateLimiting.middleware";

// Public SSO availability check (no organization ID needed)
router.get("/check-availability", generalSsoRateLimit, checkSSOAvailability);

// Get available SSO providers for login page
router.get("/available-providers", generalSsoRateLimit, getAvailableSSOProviders);

// Email-based user organization and SSO check
router.get("/check-user-organization", generalSsoRateLimit, checkUserOrganization);

// Organization-specific SSO routes
router.get("/:organizationId/config", generalSsoRateLimit, getOrganizationSSOConfig);
router.get("/:organizationId/login", ssoLoginRateLimit, initiateSSOLogin);
router.get("/:organizationId/callback", ssoCallbackRateLimit, handleSSOCallback);
router.get("/:organizationId/info", generalSsoRateLimit, getSSOLoginUrl);

export default router;