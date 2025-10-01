/**
 * @fileoverview Organization Management Controller
 *
 * Handles organization lifecycle operations including creation, retrieval, updates, and deletion.
 * Implements multi-tenant architecture with automatic tenant provisioning and admin user creation
 * during organization setup.
 *
 * Key Features:
 * - Organization CRUD operations with validation
 * - Automatic tenant database provisioning on creation
 * - Admin user creation with JWT token generation
 * - Transaction-based operations for data consistency
 * - Multi-tenant isolation and data segregation
 * - Comprehensive validation and error handling
 *
 * Security Features:
 * - Transaction rollback on failures
 * - Validation of organization data before persistence
 * - Admin user automatically assigned to new organizations
 * - Selective audit logging for critical operations
 * - Organization-scoped data access
 *
 * Multi-Tenancy:
 * - Each organization gets isolated tenant database
 * - Tenant provisioning automated via createNewTenant()
 * - Organization ID used for data segregation
 * - Admin user linked to organization on creation
 *
 * @module controllers/organization
 */

import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { sequelize } from "../database/db";
import { OrganizationModel } from "../domain.layer/models/organization/organization.model";
import {
  createOrganizationQuery,
  deleteOrganizationByIdQuery,
  getAllOrganizationsQuery,
  getOrganizationByIdQuery,
  getOrganizationsExistsQuery,
  updateOrganizationByIdQuery,
} from "../utils/organization.utils";
import { invite } from "./vwmailer.ctrl";
import { createNewTenant } from "../scripts/createNewTenant";
import { createNewUserQuery } from "../utils/user.utils";
import { createNewUserWrapper } from "./user.ctrl";
import {
  ValidationException,
  BusinessLogicException,
} from "../domain.layer/exceptions/custom.exception";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";
import { generateUserTokens } from "../utils/auth.utils";
import {
  validateOrganizationIdParam,
  validateCompleteOrganizationCreation,
  validateCompleteOrganizationUpdate
} from "../utils/validations/organizationValidation.utils";
import { ValidationError } from "../utils/validations/validation.utils";

/**
 * Retrieves all organizations from the system
 *
 * Returns a complete list of all organizations in the system. This endpoint
 * typically requires admin privileges to access.
 *
 * @async
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON array of organizations or appropriate status code
 *
 * @example
 * GET /api/organizations
 * Authorization: Bearer <jwt_token>
 *
 * Response 200:
 * {
 *   "code": 200,
 *   "data": [
 *     { "id": 1, "name": "Acme Corp", "logo": "..." },
 *     { "id": 2, "name": "Tech Inc", "logo": "..." }
 *   ]
 * }
 */
export async function getAllOrganizations(
  req: Request,
  res: Response
): Promise<any> {
  logStructured(
    "processing",
    "starting getAllOrganizations",
    "getAllOrganizations",
    "organization.ctrl.ts"
  );
  logger.debug("🔍 Fetching all organizations");
  try {
    const organizations = await getAllOrganizationsQuery();

    if (organizations && organizations.length > 0) {
      logStructured(
        "successful",
        "organizations found",
        "getAllOrganizations",
        "organization.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](organizations));
    }
    logStructured(
      "successful",
      "no organizations found",
      "getAllOrganizations",
      "organization.ctrl.ts"
    );
    return res.status(204).json(STATUS_CODE[204]([]));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve organizations",
      "getAllOrganizations",
      "organization.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve organizations: ${(error as Error).message}`
    );
    logger.error("❌ Error in getAllOrganizations:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Checks if any organizations exist in the system
 *
 * Used for setup/initialization flows to determine if this is a fresh installation
 * requiring initial organization setup.
 *
 * @async
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} Boolean indicating organization existence
 *
 * @example
 * GET /api/organizations/exists
 *
 * Response 200:
 * {
 *   "code": 200,
 *   "data": true
 * }
 */
export async function getOrganizationsExists(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const organizationsExists = await getOrganizationsExistsQuery();
    return res.status(200).json(STATUS_CODE[200](organizationsExists));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Retrieves a specific organization by its ID
 *
 * Returns detailed information about a single organization.
 *
 * @async
 * @param {Request} req - Express request with organization ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} Organization object or 404 if not found
 *
 * @example
 * GET /api/organizations/1
 * Authorization: Bearer <jwt_token>
 *
 * Response 200:
 * {
 *   "code": 200,
 *   "data": {
 *     "id": 1,
 *     "name": "Acme Corp",
 *     "logo": "https://example.com/logo.png",
 *     "created_at": "2025-01-15T10:30:00Z"
 *   }
 * }
 */
export async function getOrganizationById(
  req: Request,
  res: Response
): Promise<any> {
  const organizationId = parseInt(req.params.id);

  // Validate organization ID parameter
  const organizationIdValidation = validateOrganizationIdParam(organizationId);
  if (!organizationIdValidation.isValid) {
    logStructured(
      "error",
      `Invalid organization ID parameter: ${req.params.id}`,
      "getOrganizationById",
      "organization.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Invalid organization ID parameter: ${req.params.id}`
    );
    return res.status(400).json({
      status: 'error',
      message: organizationIdValidation.message || 'Invalid organization ID',
      code: organizationIdValidation.code || 'INVALID_PARAMETER'
    });
  }

  logStructured(
    "processing",
    `fetching organization by ID: ${organizationId}`,
    "getOrganizationById",
    "organization.ctrl.ts"
  );
  logger.debug(`🔍 Looking up organization with ID: ${organizationId}`);
  try {
    const organization = await getOrganizationByIdQuery(organizationId);
    if (organization) {
      logStructured(
        "successful",
        `organization found: ID ${organizationId}`,
        "getOrganizationById",
        "organization.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](organization));
    }
    logStructured(
      "successful",
      `no organization found: ID ${organizationId}`,
      "getOrganizationById",
      "organization.ctrl.ts"
    );
    return res.status(404).json(STATUS_CODE[404](null));
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch organization: ID ${organizationId}`,
      "getOrganizationById",
      "organization.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve organization by ID: ${organizationId}`
    );
    logger.error("❌ Error in getOrganizationById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Creates a new organization with tenant provisioning and admin user
 *
 * Implements a complete organization onboarding flow that:
 * 1. Creates organization record with validation
 * 2. Provisions isolated tenant database
 * 3. Creates admin user for the organization
 * 4. Generates authentication tokens for immediate login
 *
 * All operations are wrapped in a transaction to ensure atomicity.
 *
 * @async
 * @param {Request} req - Express request with organization and admin user data
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} Created organization with admin user and access token
 *
 * @security
 * - Transaction-based to ensure atomic operations
 * - Validation performed before database operations
 * - Admin user created with hashed password
 * - JWT tokens generated for immediate authenticated access
 * - Tenant database isolated from other organizations
 *
 * @validation
 * - Organization name required
 * - Admin user email, name, surname, password required
 * - All data validated via model methods
 *
 * @example
 * POST /api/organizations
 * {
 *   "name": "Acme Corp",
 *   "logo": "https://example.com/logo.png",
 *   "userEmail": "admin@acme.com",
 *   "userName": "John",
 *   "userSurname": "Doe",
 *   "userPassword": "SecurePassword123!"
 * }
 *
 * Response 201:
 * {
 *   "code": 201,
 *   "data": {
 *     "user": { "id": 1, "email": "admin@acme.com", ... },
 *     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   }
 * }
 */
export async function createOrganization(
  req: Request,
  res: Response
): Promise<any> {
  // Validate organization creation request
  const validationErrors = validateCompleteOrganizationCreation(req.body);
  if (validationErrors.length > 0) {
    logStructured(
      "error",
      `Organization creation validation failed`,
      "createOrganization",
      "organization.ctrl.ts"
    );
    await logEvent(
      "Error",
      "Organization creation validation failed"
    );
    return res.status(400).json({
      status: 'error',
      message: 'Organization creation validation failed',
      errors: validationErrors.map((err: ValidationError) => ({
        field: err.field,
        message: err.message,
        code: err.code
      }))
    });
  }

  const transaction = await sequelize.transaction();
  logStructured(
    "processing",
    "starting createOrganization",
    "createOrganization",
    "organization.ctrl.ts"
  );
  logger.debug("🛠️ Creating new organization");
  try {
    const body = req.body as {
      name: string;
      logo: string;
      userEmail: string;
      userName: string;
      userSurname: string;
      userPassword: string;
    };

    // Use the OrganizationModel's createNewOrganization method with validation
    const organizationModel = await OrganizationModel.createNewOrganization(
      body.name,
      body.logo
    );

    // Validate the organization data before saving
    await organizationModel.validateOrganizationData();

    // Use the utility query function for database operation
    const createdOrganization = await createOrganizationQuery(
      organizationModel,
      transaction
    );

    if (createdOrganization) {
      const organization_id = createdOrganization.id!;
      await createNewTenant(organization_id, transaction);
      const user = await createNewUserWrapper(
        {
          email: body.userEmail,
          name: body.userName,
          surname: body.userSurname,
          password: body.userPassword,
          roleId: 1, // Assuming 1 is the default role ID for Admin
          organizationId: organization_id,
        },
        transaction
      );

      // Generate tokens for the newly created user
      const { accessToken } = generateUserTokens({
        id: user.id!,
        email: body.userEmail,
        roleName: "Admin", // roleId 1 corresponds to Admin
        organizationId: organization_id,
      }, res);

      await transaction.commit();
      logStructured(
        "successful",
        `organization created: ${createdOrganization.name}`,
        "createOrganization",
        "organization.ctrl.ts"
      );
      await logEvent(
        "Create",
        `Organization created: ${createdOrganization.name}`
      );
      return res.status(201).json(STATUS_CODE[201]({
        user: user.toSafeJSON(),
        token: accessToken
      }));
    }

    logStructured(
      "error",
      "failed to create organization",
      "createOrganization",
      "organization.ctrl.ts"
    );
    await logEvent("Error", "Organization creation failed");
    await transaction.rollback();
    return res
      .status(400)
      .json(STATUS_CODE[400]("Unable to create organization"));
  } catch (error) {
    await transaction.rollback();

    // Handle specific validation errors
    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation failed: ${error.message}`,
        "createOrganization",
        "organization.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during organization creation: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "createOrganization",
        "organization.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during organization creation: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      "unexpected error during organization creation",
      "createOrganization",
      "organization.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during organization creation: ${
        (error as Error).message
      }`
    );
    logger.error("❌ Error in createOrganization:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Updates an existing organization's information
 *
 * Allows modification of organization details with comprehensive validation.
 * Uses transaction to ensure data consistency.
 *
 * @async
 * @param {Request} req - Express request with organization ID in params and update data in body
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} Updated organization object or error status
 *
 * @security
 * - Transaction-based update for atomicity
 * - Validation performed before persistence
 * - Organization ID verified before update
 *
 * @validation
 * - Organization must exist
 * - Updated data validated via model methods
 * - Name and other fields validated for format/length
 *
 * @example
 * PATCH /api/organizations/1
 * Authorization: Bearer <jwt_token>
 * {
 *   "name": "Acme Corporation",
 *   "logo": "https://example.com/new-logo.png"
 * }
 *
 * Response 200:
 * {
 *   "code": 200,
 *   "data": {
 *     "id": 1,
 *     "name": "Acme Corporation",
 *     "logo": "https://example.com/new-logo.png",
 *     "updated_at": "2025-01-15T12:00:00Z"
 *   }
 * }
 */
export async function updateOrganizationById(
  req: Request,
  res: Response
): Promise<any> {
  const organizationId = parseInt(req.params.id);

  // Validate organization ID parameter
  const organizationIdValidation = validateOrganizationIdParam(organizationId);
  if (!organizationIdValidation.isValid) {
    logStructured(
      "error",
      `Invalid organization ID parameter: ${req.params.id}`,
      "updateOrganizationById",
      "organization.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Invalid organization ID parameter: ${req.params.id}`
    );
    return res.status(400).json({
      status: 'error',
      message: organizationIdValidation.message || 'Invalid organization ID',
      code: organizationIdValidation.code || 'INVALID_PARAMETER'
    });
  }

  // Validate organization update request
  const validationErrors = validateCompleteOrganizationUpdate(req.body);
  if (validationErrors.length > 0) {
    logStructured(
      "error",
      `Organization update validation failed for ID ${organizationId}`,
      "updateOrganizationById",
      "organization.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Organization update validation failed for ID ${organizationId}`
    );
    return res.status(400).json({
      status: 'error',
      message: 'Organization update validation failed',
      errors: validationErrors.map((err: ValidationError) => ({
        field: err.field,
        message: err.message,
        code: err.code
      }))
    });
  }

  const transaction = await sequelize.transaction();
  logStructured(
    "processing",
    `updating organization ID: ${organizationId}`,
    "updateOrganizationById",
    "organization.ctrl.ts"
  );
  logger.debug(`✏️ Update requested for organization ID: ${organizationId}`);
  try {
    const updateData = req.body;

    // Find the organization by ID with validation
    const organization =
      await OrganizationModel.findByIdWithValidation(organizationId);

    // Update the organization using the model's update method
    await organization.updateOrganization(updateData);

    // Validate the updated organization data
    await organization.validateOrganizationData();

    // Use the utility query function for database operation
    const updatedOrganization = await updateOrganizationByIdQuery(
      organizationId,
      organization,
      transaction
    );

    if (updatedOrganization) {
      await transaction.commit();
      logStructured(
        "successful",
        `organization updated: ID ${organizationId}`,
        "updateOrganizationById",
        "organization.ctrl.ts"
      );
      await logEvent("Update", `Organization updated: ID ${organizationId}`);
      return res.status(200).json(STATUS_CODE[200](updatedOrganization));
    }

    logStructured(
      "error",
      "organization not found for update",
      "updateOrganizationById",
      "organization.ctrl.ts"
    );
    await logEvent(
      "Error",
      "Organization not found for updateOrganizationById"
    );
    await transaction.rollback();
    return res.status(404).json(STATUS_CODE[404]("Organization not found"));
  } catch (error) {
    await transaction.rollback();

    // Handle specific validation and business logic errors
    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        "updateOrganizationById",
        "organization.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during organization update: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "updateOrganizationById",
        "organization.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during organization update: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      `unexpected error for organization ID ${organizationId}`,
      "updateOrganizationById",
      "organization.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during update for organization ID ${organizationId}: ${
        (error as Error).message
      }`
    );
    logger.error("❌ Error in updateOrganizationById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Deletes an organization from the system
 *
 * Removes an organization and its associated data. This operation should be used
 * with caution as it may impact associated users and tenant data.
 *
 * @async
 * @param {Request} req - Express request with organization ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} Deleted organization object or error status
 *
 * @security
 * - Transaction-based deletion for atomicity
 * - Organization existence verified before deletion
 * - May cascade to related tenant data
 *
 * @warning
 * Deleting an organization may impact:
 * - All users associated with the organization
 * - Tenant database data
 * - Related projects and assessments
 *
 * @example
 * DELETE /api/organizations/1
 * Authorization: Bearer <jwt_token>
 *
 * Response 200:
 * {
 *   "code": 200,
 *   "data": {
 *     "id": 1,
 *     "name": "Acme Corp"
 *   }
 * }
 */
export async function deleteOrganizationById(
  req: Request,
  res: Response
): Promise<any> {
  const organizationId = parseInt(req.params.id);

  // Validate organization ID parameter
  const organizationIdValidation = validateOrganizationIdParam(organizationId);
  if (!organizationIdValidation.isValid) {
    logStructured(
      "error",
      `Invalid organization ID parameter: ${req.params.id}`,
      "deleteOrganizationById",
      "organization.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Invalid organization ID parameter: ${req.params.id}`
    );
    return res.status(400).json({
      status: 'error',
      message: organizationIdValidation.message || 'Invalid organization ID',
      code: organizationIdValidation.code || 'INVALID_PARAMETER'
    });
  }

  const transaction = await sequelize.transaction();
  logStructured(
    "processing",
    `attempting to delete organization ID ${organizationId}`,
    "deleteOrganizationById",
    "organization.ctrl.ts"
  );
  logger.debug(`🗑️ Delete request for organization ID ${organizationId}`);
  try {
    const organization = await getOrganizationByIdQuery(organizationId);

    if (!organization) {
      logStructured(
        "error",
        `organization not found: ID ${organizationId}`,
        "deleteOrganizationById",
        "organization.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Delete failed — organization not found: ID ${organizationId}`
      );
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Organization not found"));
    }

    const isDeleted = await deleteOrganizationByIdQuery(
      organizationId,
      transaction
    );

    if (isDeleted) {
      await transaction.commit();
      logStructured(
        "successful",
        `organization deleted: ID ${organizationId}`,
        "deleteOrganizationById",
        "organization.ctrl.ts"
      );
      await logEvent("Delete", `Organization deleted: ID ${organizationId}`);
      return res.status(200).json(STATUS_CODE[200](organization));
    }

    logStructured(
      "error",
      "unable to delete organization",
      "deleteOrganizationById",
      "organization.ctrl.ts"
    );
    await logEvent("Error", "Unable to delete organization");
    await transaction.rollback();
    return res
      .status(400)
      .json(STATUS_CODE[400]("Unable to delete organization"));
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `unexpected error deleting organization ID ${organizationId}`,
      "deleteOrganizationById",
      "organization.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during delete for organization ID ${organizationId}: ${
        (error as Error).message
      }`
    );
    logger.error("❌ Error in deleteOrganizationById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
