/**
 * @fileoverview SSO Authentication Routes
 *
 * Express router providing comprehensive endpoints for Azure AD Single Sign-On
 * authentication flows. Handles the complete OAuth 2.0 authorization code flow
 * including login initiation, callback processing, and organization discovery.
 *
 * This router is responsible for public-facing SSO endpoints that don't require
 * pre-authentication, making it the entry point for users to authenticate via
 * Azure AD SSO.
 *
 * Route Categories:
 * - Public availability checks for SSO features
 * - Organization discovery based on user email
 * - OAuth flow initiation and callback handling
 * - SSO provider information and configuration
 *
 * Security Features:
 * - Rate limiting on all endpoints to prevent abuse
 * - Organization-scoped access for security isolation
 * - CSRF protection via state tokens in OAuth flow
 * - Public routes designed for unauthenticated access
 *
 * @author VerifyWise Development Team
 * @since 2024-09-28
 * @version 1.0.0
 * @see {@link https://tools.ietf.org/html/rfc6749} OAuth 2.0 Authorization Framework
 * @see {@link https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow} Azure AD OAuth Flow
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

/**
 * @route GET /api/sso-auth/check-availability
 * @description Checks if SSO functionality is available in the system
 * @access Public (no authentication required)
 * @rateLimit generalSsoRateLimit
 * @returns {Object} { available: boolean, providers: string[] }
 *
 * @example
 * GET /api/sso-auth/check-availability
 * Response: { "available": true, "providers": ["azure-ad"] }
 */
router.get("/check-availability", generalSsoRateLimit, checkSSOAvailability);

/**
 * @route GET /api/sso-auth/available-providers
 * @description Retrieves list of available SSO providers for the login interface
 * @access Public (no authentication required)
 * @rateLimit generalSsoRateLimit
 * @returns {Object} Array of SSO provider configurations for frontend display
 *
 * @example
 * GET /api/sso-auth/available-providers
 * Response: [{ "id": "azure-ad", "name": "Microsoft", "enabled": true }]
 */
router.get("/available-providers", generalSsoRateLimit, getAvailableSSOProviders);

/**
 * @route GET /api/sso-auth/check-user-organization?email=user@domain.com
 * @description Discovers user's organization and SSO availability based on email domain
 * @access Public (no authentication required)
 * @rateLimit generalSsoRateLimit
 * @param {string} email - User email address for organization discovery
 * @returns {Object} Organization information and SSO configuration status
 *
 * @example
 * GET /api/sso-auth/check-user-organization?email=user@company.com
 * Response: { "organizationId": 123, "ssoEnabled": true, "provider": "azure-ad" }
 */
router.get("/check-user-organization", generalSsoRateLimit, checkUserOrganization);

/**
 * @route GET /api/sso-auth/:organizationId/config
 * @description Retrieves public SSO configuration for an organization
 * @access Public (no authentication required)
 * @rateLimit generalSsoRateLimit
 * @param {string} organizationId - Organization identifier
 * @returns {Object} Public SSO configuration (excludes sensitive data)
 *
 * @example
 * GET /api/sso-auth/123/config
 * Response: { "enabled": true, "provider": "azure-ad", "loginUrl": "/sso-auth/123/login" }
 */
router.get("/:organizationId/config", generalSsoRateLimit, getOrganizationSSOConfig);

/**
 * @route GET /api/sso-auth/:organizationId/login
 * @description Initiates Azure AD OAuth 2.0 authorization code flow
 * @access Public (no authentication required)
 * @rateLimit ssoLoginRateLimit (stricter limits for login attempts)
 * @param {string} organizationId - Organization identifier for SSO configuration
 * @returns {Redirect} Redirects user to Azure AD authorization endpoint
 *
 * @security
 * - Generates cryptographically secure state token for CSRF protection
 * - Validates organization SSO configuration before redirect
 * - Includes proper OAuth 2.0 scopes for user profile access
 *
 * @example
 * GET /api/sso-auth/123/login
 * Response: 302 Redirect to https://login.microsoftonline.com/tenant/oauth2/v2.0/authorize?...
 */
router.get("/:organizationId/login", ssoLoginRateLimit, initiateSSOLogin);

/**
 * @route GET /api/sso-auth/:organizationId/callback?code=...&state=...
 * @description Handles Azure AD OAuth 2.0 authorization callback
 * @access Public (no authentication required)
 * @rateLimit ssoCallbackRateLimit (stricter limits for callback processing)
 * @param {string} organizationId - Organization identifier
 * @param {string} code - Authorization code from Azure AD (query parameter)
 * @param {string} state - State token for CSRF validation (query parameter)
 * @returns {Redirect} Redirects to application with authentication cookie
 *
 * @security
 * - Validates state token to prevent CSRF attacks
 * - Exchanges authorization code for access token securely
 * - Creates secure HTTP-only authentication cookie
 * - Validates user organization membership
 *
 * @example
 * GET /api/sso-auth/123/callback?code=abc123&state=xyz789
 * Response: 302 Redirect to frontend dashboard with auth cookie set
 */
router.get("/:organizationId/callback", ssoCallbackRateLimit, handleSSOCallback);

/**
 * @route GET /api/sso-auth/:organizationId/info
 * @description Retrieves SSO login information and URLs for an organization
 * @access Public (no authentication required)
 * @rateLimit generalSsoRateLimit
 * @param {string} organizationId - Organization identifier
 * @returns {Object} SSO login URLs and configuration information
 *
 * @example
 * GET /api/sso-auth/123/info
 * Response: { "loginUrl": "/api/sso-auth/123/login", "provider": "azure-ad", "enabled": true }
 */
router.get("/:organizationId/info", generalSsoRateLimit, getSSOLoginUrl);

export default router;