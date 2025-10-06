/**
 * @fileoverview Organization Routes
 *
 * Defines RESTful API endpoints for organization management operations.
 * Implements multi-tenant architecture with proper authentication and authorization.
 *
 * Public Endpoints:
 * - GET /exists - Check if any organizations exist (setup flow)
 *
 * Protected Endpoints (require authentication):
 * - GET /:id - Get organization by ID
 * - PATCH /:id - Update organization
 *
 * Multi-Tenancy Protected Endpoints:
 * - POST / - Create new organization with tenant provisioning
 *
 * Middleware:
 * - authenticateJWT: Validates JWT tokens and enforces multi-tenant isolation
 * - checkMultiTenancy: Validates multi-tenancy constraints for new organizations
 *
 * @module routes/organization.route
 */

import express from "express";
const router = express.Router();

import {
  createOrganization,
  deleteOrganizationById,
  getAllOrganizations,
  getOrganizationById,
  updateOrganizationById,
} from "../controllers/organization.ctrl";

import authenticateJWT from "../middleware/auth.middleware";
import { checkMultiTenancy } from "../middleware/multiTenancy.middleware";

/**
 * SECURITY NOTE: /exists endpoint removed to prevent information disclosure
 *
 * The GET /organizations/exists endpoint was removed because:
 * 1. Exposed system setup status without authentication
 * 2. Provided business intelligence to potential attackers
 * 3. Could be used for reconnaissance of deployment maturity
 * 4. Internal functionality is preserved via getOrganizationsExistsQuery()
 *   which is still used by multi-tenancy middleware for legitimate purposes
 *
 * Alternative approaches for legitimate use cases:
 * - Setup flows can check organization existence through authenticated endpoints
 * - Frontend can determine setup status via other authenticated routes
 * - Internal middleware continues to use getOrganizationsExistsQuery() directly
 */

/**
 * GET /organizations/:id
 *
 * Retrieves a specific organization by ID.
 * Requires authentication.
 *
 * @name get/:id
 * @function
 * @memberof module:routes/organization.route
 * @inner
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} Organization object
 */
router.get("/:id", authenticateJWT, getOrganizationById);

/**
 * POST /organizations
 *
 * Creates a new organization with complete onboarding:
 * - Organization record creation
 * - Tenant database provisioning
 * - Admin user creation
 * - JWT token generation
 *
 * Protected by multi-tenancy validation to enforce organizational constraints.
 *
 * @name post/
 * @function
 * @memberof module:routes/organization.route
 * @inner
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} Created organization with admin user and access token
 */
router.post("/", checkMultiTenancy, createOrganization);

/**
 * PATCH /organizations/:id
 *
 * Updates an existing organization's information.
 * Requires authentication.
 *
 * @name patch/:id
 * @function
 * @memberof module:routes/organization.route
 * @inner
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} Updated organization object
 */
router.patch("/:id", authenticateJWT, updateOrganizationById);

/**
 * DELETE /organizations/:id
 *
 * Deletes an organization from the system.
 * Currently disabled - uncomment to enable.
 * Requires authentication when enabled.
 *
 * @name delete/:id
 * @function
 * @memberof module:routes/organization.route
 * @inner
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Object} Deleted organization object
 */
// router.delete("/:id", authenticateJWT, deleteOrganizationById);

export default router;
