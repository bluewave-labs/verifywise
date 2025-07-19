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

/**
 * Get all organizations
 *
 * @param req Express request object
 * @param res Express response object
 * @returns Response with organizations or error
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
      await logEvent("Read", `Retrieved ${organizations.length} organizations`);
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
    await logEvent("Read", "No organizations found");
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
 * Get organization by ID
 *
 * @param req Express request object with organization ID
 * @param res Express response object
 * @returns Response with organization or error
 */
export async function getOrganizationById(
  req: Request,
  res: Response
): Promise<any> {
  const organizationId = parseInt(req.params.id);
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
      await logEvent("Read", `Organization retrieved by ID: ${organizationId}`);
      return res.status(200).json(STATUS_CODE[200](organization));
    }
    logStructured(
      "successful",
      `no organization found: ID ${organizationId}`,
      "getOrganizationById",
      "organization.ctrl.ts"
    );
    await logEvent("Read", `No organization found with ID: ${organizationId}`);
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
 * Create a new organization
 *
 * @param req Express request object with organization data
 * @param res Express response object
 * @returns Response with created organization or error
 */
export async function createOrganization(
  req: Request,
  res: Response
): Promise<any> {
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

    if (!body.name) {
      await transaction.rollback();
      return res
        .status(400)
        .json(STATUS_CODE[400]("Organization name is required"));
    }

    // Use the OrganizationModel's createNewOrganization method with validation
    const organizationModel = await OrganizationModel.createNewOrganization(body.name, body.logo);

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
      )
      await transaction.commit();
      logStructured(
        "successful",
        `organization created: ${createdOrganization.name}`,
        "createOrganization",
        "organization.ctrl.ts"
      );
      await logEvent("Create", `Organization created: ${createdOrganization.name}`);
      return res.status(201).json(STATUS_CODE[201](user.toSafeJSON()));
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
      `Unexpected error during organization creation: ${(error as Error).message
      }`
    );
    logger.error("❌ Error in createOrganization:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Update an organization
 *
 * @param req Express request object with organization ID and updated data
 * @param res Express response object
 * @returns Response with updated organization or error
 */
export async function updateOrganizationById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const organizationId = parseInt(req.params.id);
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
    const organization = await OrganizationModel.findByIdWithValidation(
      organizationId
    );

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
      `Unexpected error during update for organization ID ${organizationId}: ${(error as Error).message
      }`
    );
    logger.error("❌ Error in updateOrganizationById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Delete an organization
 *
 * @param req Express request object with organization ID
 * @param res Express response object
 * @returns Response with deleted organization or error
 */
export async function deleteOrganizationById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const organizationId = parseInt(req.params.id);
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
      `Unexpected error during delete for organization ID ${organizationId}: ${(error as Error).message
      }`
    );
    logger.error("❌ Error in deleteOrganizationById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
