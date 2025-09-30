/**
 * @fileoverview SSO Configuration Management Routes
 *
 * Express router providing comprehensive CRUD operations for Azure AD Single Sign-On
 * configurations. These routes handle administrative operations for SSO setup,
 * validation, testing, and management within organizations.
 *
 * This router focuses on authenticated administrative operations for SSO configuration
 * management, requiring proper authentication and admin privileges for all endpoints.
 *
 * Route Categories:
 * - CRUD operations for SSO configurations
 * - SSO enable/disable controls for organizations
 * - Configuration validation and testing endpoints
 * - Administrative access with organization isolation
 *
 * Security Features:
 * - All routes require JWT authentication via authenticateJWT middleware
 * - Admin-only access for configuration modifications
 * - Organization-scoped access control preventing cross-tenant operations
 * - Input validation and sanitization for all configuration parameters
 * - Secure client secret handling with encryption
 *
 * @author VerifyWise Development Team
 * @since 2024-09-28
 * @version 1.0.0
 * @see {@link https://docs.microsoft.com/en-us/azure/active-directory/develop/} Azure AD Developer Documentation
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

/**
 * @route GET /api/sso-configuration/:organizationId
 * @description Retrieves complete SSO configuration for an organization
 * @access Private (requires JWT authentication + Admin role)
 * @middleware authenticateJWT - Validates JWT token and admin permissions
 * @param {string} organizationId - Organization identifier (URL parameter)
 * @returns {Object} Complete SSO configuration (excludes client secrets)
 *
 * @security
 * - Requires admin role within the target organization
 * - Client secrets are never returned in response
 * - Organization-scoped access prevents cross-tenant data access
 *
 * @example
 * GET /api/sso-configuration/123
 * Headers: { Authorization: "Bearer jwt_token" }
 * Response: {
 *   "success": true,
 *   "data": {
 *     "exists": true,
 *     "azure_tenant_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
 *     "azure_client_id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
 *     "cloud_environment": "AzurePublic",
 *     "is_enabled": true,
 *     "auth_method_policy": "both"
 *   }
 * }
 */
router.get("/:organizationId", authenticateJWT, getSSOConfiguration);

/**
 * @route POST /api/sso-configuration/:organizationId
 * @description Creates new SSO configuration for an organization
 * @access Private (requires JWT authentication + Admin role)
 * @middleware authenticateJWT - Validates JWT token and admin permissions
 * @param {string} organizationId - Organization identifier (URL parameter)
 * @param {Object} body - SSO configuration data
 * @returns {Object} Created configuration (excludes client secrets)
 *
 * @body_parameters
 * - azure_tenant_id: string (required, GUID format)
 * - azure_client_id: string (required, GUID format)
 * - azure_client_secret: string (required, min 10 chars)
 * - cloud_environment: 'AzurePublic' | 'AzureGovernment'
 * - auth_method_policy: 'sso_only' | 'password_only' | 'both'
 *
 * @example
 * POST /api/sso-configuration/123
 * Headers: { Authorization: "Bearer jwt_token" }
 * Body: {
 *   "azure_tenant_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
 *   "azure_client_id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
 *   "azure_client_secret": "secure_client_secret",
 *   "cloud_environment": "AzurePublic",
 *   "auth_method_policy": "both"
 * }
 */
router.post("/:organizationId", authenticateJWT, createOrUpdateSSOConfiguration);

/**
 * @route PUT /api/sso-configuration/:organizationId
 * @description Updates existing SSO configuration for an organization
 * @access Private (requires JWT authentication + Admin role)
 * @middleware authenticateJWT - Validates JWT token and admin permissions
 * @param {string} organizationId - Organization identifier (URL parameter)
 * @param {Object} body - Updated SSO configuration data
 * @returns {Object} Updated configuration (excludes client secrets)
 *
 * @note Uses the same handler as POST for create-or-update functionality
 */
router.put("/:organizationId", authenticateJWT, createOrUpdateSSOConfiguration);

/**
 * @route DELETE /api/sso-configuration/:organizationId
 * @description Permanently deletes SSO configuration for an organization
 * @access Private (requires JWT authentication + Admin role)
 * @middleware authenticateJWT - Validates JWT token and admin permissions
 * @param {string} organizationId - Organization identifier (URL parameter)
 * @returns {Object} Deletion confirmation
 *
 * @security
 * - Permanently removes encrypted client secrets
 * - Disables SSO authentication immediately
 * - Cannot be undone - requires complete reconfiguration
 *
 * @example
 * DELETE /api/sso-configuration/123
 * Headers: { Authorization: "Bearer jwt_token" }
 * Response: { "success": true, "message": "SSO configuration deleted successfully" }
 */
router.delete("/:organizationId", authenticateJWT, deleteSSOConfiguration);

/**
 * @route POST /api/sso-configuration/:organizationId/enable
 * @description Enables SSO authentication for an organization
 * @access Private (requires JWT authentication + Admin role)
 * @middleware authenticateJWT - Validates JWT token and admin permissions
 * @param {string} organizationId - Organization identifier (URL parameter)
 * @returns {Object} Enable operation result with updated status
 *
 * @prerequisites
 * - Valid SSO configuration must exist
 * - Configuration must pass validation checks
 * - Azure AD connectivity must be verified
 *
 * @example
 * POST /api/sso-configuration/123/enable
 * Headers: { Authorization: "Bearer jwt_token" }
 * Response: {
 *   "success": true,
 *   "message": "SSO enabled successfully",
 *   "data": { "is_enabled": true, "azure_tenant_id": "...", "auth_method_policy": "both" }
 * }
 */
router.post("/:organizationId/enable", authenticateJWT, enableSSO);

/**
 * @route POST /api/sso-configuration/:organizationId/disable
 * @description Disables SSO authentication for an organization
 * @access Private (requires JWT authentication + Admin role)
 * @middleware authenticateJWT - Validates JWT token and admin permissions
 * @param {string} organizationId - Organization identifier (URL parameter)
 * @returns {Object} Disable operation result with updated status
 *
 * @note Configuration is preserved, only the enabled status is changed
 *
 * @example
 * POST /api/sso-configuration/123/disable
 * Headers: { Authorization: "Bearer jwt_token" }
 * Response: {
 *   "success": true,
 *   "message": "SSO disabled successfully",
 *   "data": { "is_enabled": false, "auth_method_policy": "both" }
 * }
 */
router.post("/:organizationId/disable", authenticateJWT, disableSSO);

/**
 * @route POST /api/sso-configuration/:organizationId/validate
 * @description Validates SSO configuration without saving to database
 * @access Private (requires JWT authentication + Admin role)
 * @middleware authenticateJWT - Validates JWT token and admin permissions
 * @param {string} organizationId - Organization identifier (URL parameter)
 * @param {Object} body - SSO configuration to validate
 * @returns {Object} Detailed validation results with errors and warnings
 *
 * @validation_checks
 * - GUID format validation for Azure AD identifiers
 * - Client secret strength requirements
 * - Domain format validation (if provided)
 * - Cloud environment and authentication policy validation
 *
 * @example
 * POST /api/sso-configuration/123/validate
 * Headers: { Authorization: "Bearer jwt_token" }
 * Body: { "azure_tenant_id": "invalid-format", ... }
 * Response: {
 *   "success": true,
 *   "validation": {
 *     "isValid": false,
 *     "errors": ["Azure tenant ID must be a valid GUID format"],
 *     "warnings": []
 *   },
 *   "message": "SSO configuration has validation errors"
 * }
 */
router.post("/:organizationId/validate", authenticateJWT, validateSSOConfiguration);

/**
 * @route POST /api/sso-configuration/:organizationId/test
 * @description Tests SSO configuration connectivity with Azure AD
 * @access Private (requires JWT authentication + Admin role)
 * @middleware authenticateJWT - Validates JWT token and admin permissions
 * @param {string} organizationId - Organization identifier (URL parameter)
 * @param {Object} body - SSO configuration to test
 * @returns {Object} Test results with connectivity status and details
 *
 * @testing_process
 * - Validates configuration format
 * - Attempts MSAL client creation
 * - Tests Azure AD authority connectivity
 * - Verifies endpoint accessibility
 *
 * @example
 * POST /api/sso-configuration/123/test
 * Headers: { Authorization: "Bearer jwt_token" }
 * Body: { "azure_tenant_id": "valid-guid", "azure_client_id": "valid-guid", ... }
 * Response: {
 *   "success": true,
 *   "testPassed": true,
 *   "message": "SSO configuration test passed",
 *   "details": {
 *     "authority": "https://login.microsoftonline.com/tenant-id",
 *     "clientConfigured": true,
 *     "warnings": []
 *   }
 * }
 */
router.post("/:organizationId/test", authenticateJWT, testSSOConfiguration);

export default router;