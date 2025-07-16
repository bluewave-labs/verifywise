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

// /**
//  * Get all members of an organization
//  *
//  * @param req Express request object with organization ID
//  * @param res Express response object
//  * @returns Response with organization members or error
//  */
// export async function getOrganizationMembers(
//   req: Request,
//   res: Response
// ): Promise<any> {
//   const organizationId = parseInt(req.params.id);
//   logStructured(
//     "processing",
//     `fetching members for organization ID: ${organizationId}`,
//     "getOrganizationMembers",
//     "organization.ctrl.ts"
//   );
//   logger.debug(`🔍 Fetching members for organization ID: ${organizationId}`);
//   try {
//     const members = await getOrganizationMembersQuery(organizationId);
//     logStructured(
//       "successful",
//       `members fetched for organization ID: ${organizationId}`,
//       "getOrganizationMembers",
//       "organization.ctrl.ts"
//     );
//     await logEvent(
//       "Read",
//       `Members fetched for organization ID: ${organizationId}`
//     );
//     return res.status(200).json(STATUS_CODE[200](members));
//   } catch (error) {
//     logStructured(
//       "error",
//       `failed to fetch members for organization ID: ${organizationId}`,
//       "getOrganizationMembers",
//       "organization.ctrl.ts"
//     );
//     await logEvent(
//       "Error",
//       `Failed to fetch members for organization ID: ${organizationId}`
//     );
//     logger.error("❌ Error in getOrganizationMembers:", error);
//     return res.status(500).json(STATUS_CODE[500]((error as Error).message));
//   }
// }

// /**
//  * Get all projects of an organization
//  *
//  * @param req Express request object with organization ID
//  * @param res Express response object
//  * @returns Response with organization projects or error
//  */
// export async function getOrganizationProjects(
//   req: Request,
//   res: Response
// ): Promise<any> {
//   const organizationId = parseInt(req.params.id);
//   logStructured(
//     "processing",
//     `fetching projects for organization ID: ${organizationId}`,
//     "getOrganizationProjects",
//     "organization.ctrl.ts"
//   );
//   logger.debug(`🔍 Fetching projects for organization ID: ${organizationId}`);
//   try {
//     const projects = await getOrganizationProjectsQuery(organizationId);
//     logStructured(
//       "successful",
//       `projects fetched for organization ID: ${organizationId}`,
//       "getOrganizationProjects",
//       "organization.ctrl.ts"
//     );
//     await logEvent(
//       "Read",
//       `Projects fetched for organization ID: ${organizationId}`
//     );
//     return res.status(200).json(STATUS_CODE[200](projects));
//   } catch (error) {
//     logStructured(
//       "error",
//       `failed to fetch projects for organization ID: ${organizationId}`,
//       "getOrganizationProjects",
//       "organization.ctrl.ts"
//     );
//     await logEvent(
//       "Error",
//       `Failed to fetch projects for organization ID: ${organizationId}`
//     );
//     logger.error("❌ Error in getOrganizationProjects:", error);
//     return res.status(500).json(STATUS_CODE[500]((error as Error).message));
//   }
// }

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

// /**
//  * Add a member to an organization
//  *
//  * @param req Express request object with organization ID and member data
//  * @param res Express response object
//  * @returns Response with updated organization or error
//  */
// export async function addMemberToOrganization(
//   req: Request,
//   res: Response
// ): Promise<any> {
//   const transaction = await sequelize.transaction();
//   const organizationId = parseInt(req.params.id);
//   logStructured(
//     "processing",
//     `adding member to organization ID: ${organizationId}`,
//     "addMemberToOrganization",
//     "organization.ctrl.ts"
//   );
//   logger.debug(`➕ Adding member to organization ID: ${organizationId}`);
//   try {
//     const memberId = req.body.memberId;

//     if (!memberId) {
//       logStructured(
//         "error",
//         "member ID is required",
//         "addMemberToOrganization",
//         "organization.ctrl.ts"
//       );
//       await logEvent(
//         "Error",
//         "Member ID is required for addMemberToOrganization"
//       );
//       await transaction.rollback();
//       return res.status(400).json(STATUS_CODE[400]("Member ID is required"));
//     }

//     const updatedOrganization = await addMemberToOrganizationQuery(
//       organizationId,
//       memberId,
//       transaction
//     );

//     if (updatedOrganization) {
//       await transaction.commit();
//       logStructured(
//         "successful",
//         `member added to organization ID: ${organizationId}`,
//         "addMemberToOrganization",
//         "organization.ctrl.ts"
//       );
//       await logEvent(
//         "Update",
//         `Member ${memberId} added to organization ID: ${organizationId}`
//       );
//       return res.status(200).json(STATUS_CODE[200](updatedOrganization));
//     }

//     logStructured(
//       "error",
//       "organization not found for addMember",
//       "addMemberToOrganization",
//       "organization.ctrl.ts"
//     );
//     await logEvent(
//       "Error",
//       "Organization not found for addMemberToOrganization"
//     );
//     await transaction.rollback();
//     return res.status(404).json(STATUS_CODE[404]("Organization not found"));
//   } catch (error) {
//     await transaction.rollback();
//     logStructured(
//       "error",
//       `failed to add member to organization ID: ${organizationId}`,
//       "addMemberToOrganization",
//       "organization.ctrl.ts"
//     );
//     await logEvent(
//       "Error",
//       `Failed to add member to organization ID: ${organizationId}`
//     );
//     logger.error("❌ Error in addMemberToOrganization:", error);
//     return res.status(500).json(STATUS_CODE[500]((error as Error).message));
//   }
// }

// /**
//  * Add a project to an organization
//  *
//  * @param req Express request object with organization ID and project data
//  * @param res Express response object
//  * @returns Response with updated organization or error
//  */
// export async function addProjectToOrganization(
//   req: Request,
//   res: Response
// ): Promise<any> {
//   const transaction = await sequelize.transaction();
//   const organizationId = parseInt(req.params.id);
//   logStructured(
//     "processing",
//     `adding project to organization ID: ${organizationId}`,
//     "addProjectToOrganization",
//     "organization.ctrl.ts"
//   );
//   logger.debug(`➕ Adding project to organization ID: ${organizationId}`);
//   try {
//     const projectId = req.body.projectId;

//     if (!projectId) {
//       logStructured(
//         "error",
//         "project ID is required",
//         "addProjectToOrganization",
//         "organization.ctrl.ts"
//       );
//       await logEvent(
//         "Error",
//         "Project ID is required for addProjectToOrganization"
//       );
//       await transaction.rollback();
//       return res.status(400).json(STATUS_CODE[400]("Project ID is required"));
//     }

//     const updatedOrganization = await addProjectToOrganizationQuery(
//       organizationId,
//       projectId,
//       transaction
//     );

//     if (updatedOrganization) {
//       await transaction.commit();
//       logStructured(
//         "successful",
//         `project added to organization ID: ${organizationId}`,
//         "addProjectToOrganization",
//         "organization.ctrl.ts"
//       );
//       await logEvent(
//         "Update",
//         `Project ${projectId} added to organization ID: ${organizationId}`
//       );
//       return res.status(200).json(STATUS_CODE[200](updatedOrganization));
//     }

//     logStructured(
//       "error",
//       "organization not found for addProject",
//       "addProjectToOrganization",
//       "organization.ctrl.ts"
//     );
//     await logEvent(
//       "Error",
//       "Organization not found for addProjectToOrganization"
//     );
//     await transaction.rollback();
//     return res.status(404).json(STATUS_CODE[404]("Organization not found"));
//   } catch (error) {
//     await transaction.rollback();
//     logStructured(
//       "error",
//       `failed to add project to organization ID: ${organizationId}`,
//       "addProjectToOrganization",
//       "organization.ctrl.ts"
//     );
//     await logEvent(
//       "Error",
//       `Failed to add project to organization ID: ${organizationId}`
//     );
//     logger.error("❌ Error in addProjectToOrganization:", error);
//     return res.status(500).json(STATUS_CODE[500]((error as Error).message));
//   }
// }

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
    console.log("aaaaaaa");

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

// /**
//  * Remove a member from an organization
//  *
//  * @param req Express request object with organization ID and member ID
//  * @param res Express response object
//  * @returns Response with updated organization or error
//  */
// export async function removeMemberFromOrganization(
//   req: Request,
//   res: Response
// ): Promise<any> {
//   const transaction = await sequelize.transaction();
//   const organizationId = parseInt(req.params.id);
//   const memberId = parseInt(req.params.memberId);
//   logStructured(
//     "processing",
//     `removing member ${memberId} from organization ID: ${organizationId}`,
//     "removeMemberFromOrganization",
//     "organization.ctrl.ts"
//   );
//   logger.debug(
//     `➖ Removing member ${memberId} from organization ID: ${organizationId}`
//   );
//   try {
//     const updatedOrganization = await removeMemberFromOrganizationQuery(
//       organizationId,
//       memberId,
//       transaction
//     );

//     if (updatedOrganization) {
//       await transaction.commit();
//       logStructured(
//         "successful",
//         `member removed from organization ID: ${organizationId}`,
//         "removeMemberFromOrganization",
//         "organization.ctrl.ts"
//       );
//       await logEvent(
//         "Update",
//         `Member ${memberId} removed from organization ID: ${organizationId}`
//       );
//       return res.status(200).json(STATUS_CODE[200](updatedOrganization));
//     }

//     logStructured(
//       "error",
//       "organization not found for removeMember",
//       "removeMemberFromOrganization",
//       "organization.ctrl.ts"
//     );
//     await logEvent(
//       "Error",
//       "Organization not found for removeMemberFromOrganization"
//     );
//     await transaction.rollback();
//     return res.status(404).json(STATUS_CODE[404]("Organization not found"));
//   } catch (error) {
//     await transaction.rollback();
//     logStructured(
//       "error",
//       `failed to remove member from organization ID: ${organizationId}`,
//       "removeMemberFromOrganization",
//       "organization.ctrl.ts"
//     );
//     await logEvent(
//       "Error",
//       `Failed to remove member from organization ID: ${organizationId}`
//     );
//     logger.error("❌ Error in removeMemberFromOrganization:", error);
//     return res.status(500).json(STATUS_CODE[500]((error as Error).message));
//   }
// }

// /**
//  * Remove a project from an organization
//  *
//  * @param req Express request object with organization ID and project ID
//  * @param res Express response object
//  * @returns Response with updated organization or error
//  */
// export async function removeProjectFromOrganization(
//   req: Request,
//   res: Response
// ): Promise<any> {
//   const transaction = await sequelize.transaction();
//   const organizationId = parseInt(req.params.id);
//   const projectId = parseInt(req.params.projectId);
//   logStructured(
//     "processing",
//     `removing project ${projectId} from organization ID: ${organizationId}`,
//     "removeProjectFromOrganization",
//     "organization.ctrl.ts"
//   );
//   logger.debug(
//     `➖ Removing project ${projectId} from organization ID: ${organizationId}`
//   );
//   try {
//     const updatedOrganization = await removeProjectFromOrganizationQuery(
//       organizationId,
//       projectId,
//       transaction
//     );

//     if (updatedOrganization) {
//       await transaction.commit();
//       logStructured(
//         "successful",
//         `project removed from organization ID: ${organizationId}`,
//         "removeProjectFromOrganization",
//         "organization.ctrl.ts"
//       );
//       await logEvent(
//         "Update",
//         `Project ${projectId} removed from organization ID: ${organizationId}`
//       );
//       return res.status(200).json(STATUS_CODE[200](updatedOrganization));
//     }

//     logStructured(
//       "error",
//       "organization not found for removeProject",
//       "removeProjectFromOrganization",
//       "organization.ctrl.ts"
//     );
//     await logEvent(
//       "Error",
//       "Organization not found for removeProjectFromOrganization"
//     );
//     await transaction.rollback();
//     return res.status(404).json(STATUS_CODE[404]("Organization not found"));
//   } catch (error) {
//     await transaction.rollback();
//     logStructured(
//       "error",
//       `failed to remove project from organization ID: ${organizationId}`,
//       "removeProjectFromOrganization",
//       "organization.ctrl.ts"
//     );
//     await logEvent(
//       "Error",
//       `Failed to remove project from organization ID: ${organizationId}`
//     );
//     logger.error("❌ Error in removeProjectFromOrganization:", error);
//     return res.status(500).json(STATUS_CODE[500]((error as Error).message));
//   }
// }
