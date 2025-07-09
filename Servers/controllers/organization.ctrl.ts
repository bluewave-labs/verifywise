import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { sequelize } from "../database/db";
import { OrganizationModel } from "../domain.layer/models/organization/organization.model";
import {
  addMemberToOrganizationQuery,
  addProjectToOrganizationQuery,
  createOrganizationQuery,
  deleteOrganizationByIdQuery,
  getAllOrganizationsQuery,
  getOrganizationByIdQuery,
  getOrganizationMembersQuery,
  getOrganizationProjectsQuery,
  removeMemberFromOrganizationQuery,
  removeProjectFromOrganizationQuery,
  updateOrganizationByIdQuery,
} from "../utils/organization.utils";
import {
  ValidationException,
  BusinessLogicException,
} from "../domain.layer/exceptions/custom.exception";

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
  try {
    const organizations = await getAllOrganizationsQuery();

    if (organizations && organizations.length > 0) {
      return res.status(200).json(STATUS_CODE[200](organizations));
    }

    return res.status(204).json(STATUS_CODE[204]([]));
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
  try {
    const organizationId = parseInt(req.params.id);
    const organization = await getOrganizationByIdQuery(organizationId);

    if (organization) {
      return res.status(200).json(STATUS_CODE[200](organization));
    }

    return res.status(404).json(STATUS_CODE[404](null));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get all members of an organization
 *
 * @param req Express request object with organization ID
 * @param res Express response object
 * @returns Response with organization members or error
 */
export async function getOrganizationMembers(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const organizationId = parseInt(req.params.id);
    const members = await getOrganizationMembersQuery(organizationId);

    return res.status(200).json(STATUS_CODE[200](members));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get all projects of an organization
 *
 * @param req Express request object with organization ID
 * @param res Express response object
 * @returns Response with organization projects or error
 */
export async function getOrganizationProjects(
  req: Request,
  res: Response
): Promise<any> {
  try {
    const organizationId = parseInt(req.params.id);
    const projects = await getOrganizationProjectsQuery(organizationId);

    return res.status(200).json(STATUS_CODE[200](projects));
  } catch (error) {
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
  try {
    const { name, logo, members, projects, is_demo } = req.body;

    // Use the OrganizationModel's createNewOrganization method with validation
    const organizationModel = await OrganizationModel.createNewOrganization(
      name,
      logo,
      members,
      projects,
      is_demo
    );

    // Validate the organization data before saving
    await organizationModel.validateOrganizationData();

    // Use the utility query function for database operation
    const createdOrganization = await createOrganizationQuery(
      organizationModel,
      transaction
    );

    if (createdOrganization) {
      await transaction.commit();
      return res.status(201).json(STATUS_CODE[201](createdOrganization));
    }

    await transaction.rollback();
    return res
      .status(400)
      .json(STATUS_CODE[400]("Unable to create organization"));
  } catch (error) {
    await transaction.rollback();

    // Handle specific validation errors
    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Add a member to an organization
 *
 * @param req Express request object with organization ID and member data
 * @param res Express response object
 * @returns Response with updated organization or error
 */
export async function addMemberToOrganization(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const organizationId = parseInt(req.params.id);
    const memberId = req.body.memberId;

    if (!memberId) {
      await transaction.rollback();
      return res.status(400).json(STATUS_CODE[400]("Member ID is required"));
    }

    const updatedOrganization = await addMemberToOrganizationQuery(
      organizationId,
      memberId,
      transaction
    );

    if (updatedOrganization) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](updatedOrganization));
    }

    await transaction.rollback();
    return res.status(404).json(STATUS_CODE[404]("Organization not found"));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Add a project to an organization
 *
 * @param req Express request object with organization ID and project data
 * @param res Express response object
 * @returns Response with updated organization or error
 */
export async function addProjectToOrganization(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const organizationId = parseInt(req.params.id);
    const projectId = req.body.projectId;

    if (!projectId) {
      await transaction.rollback();
      return res.status(400).json(STATUS_CODE[400]("Project ID is required"));
    }

    const updatedOrganization = await addProjectToOrganizationQuery(
      organizationId,
      projectId,
      transaction
    );

    if (updatedOrganization) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](updatedOrganization));
    }

    await transaction.rollback();
    return res.status(404).json(STATUS_CODE[404]("Organization not found"));
  } catch (error) {
    await transaction.rollback();
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
  try {
    const organizationId = parseInt(req.params.id);
    const updateData = req.body;

    // Find the organization by ID with validation
    const organization = await OrganizationModel.findByIdWithValidation(
      organizationId
    );

    // Check if organization can be modified (e.g., not a demo organization)
    organization.canBeModified();

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
      return res.status(200).json(STATUS_CODE[200](updatedOrganization));
    }

    await transaction.rollback();
    return res.status(404).json(STATUS_CODE[404]("Organization not found"));
  } catch (error) {
    await transaction.rollback();

    // Handle specific validation and business logic errors
    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

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
  try {
    const organizationId = parseInt(req.params.id);

    // First get the organization to return it in the response
    const organization = await getOrganizationByIdQuery(organizationId);

    if (!organization) {
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Organization not found"));
    }

    const isDeleted = await deleteOrganizationByIdQuery(
      organizationId,
      transaction
    );

    if (isDeleted) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](organization));
    }

    await transaction.rollback();
    return res
      .status(400)
      .json(STATUS_CODE[400]("Unable to delete organization"));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Remove a member from an organization
 *
 * @param req Express request object with organization ID and member ID
 * @param res Express response object
 * @returns Response with updated organization or error
 */
export async function removeMemberFromOrganization(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const organizationId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memberId);

    const updatedOrganization = await removeMemberFromOrganizationQuery(
      organizationId,
      memberId,
      transaction
    );

    if (updatedOrganization) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](updatedOrganization));
    }

    await transaction.rollback();
    return res.status(404).json(STATUS_CODE[404]("Organization not found"));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Remove a project from an organization
 *
 * @param req Express request object with organization ID and project ID
 * @param res Express response object
 * @returns Response with updated organization or error
 */
export async function removeProjectFromOrganization(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const organizationId = parseInt(req.params.id);
    const projectId = parseInt(req.params.projectId);

    const updatedOrganization = await removeProjectFromOrganizationQuery(
      organizationId,
      projectId,
      transaction
    );

    if (updatedOrganization) {
      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](updatedOrganization));
    }

    await transaction.rollback();
    return res.status(404).json(STATUS_CODE[404]("Organization not found"));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
