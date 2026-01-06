/**
 * @fileoverview Workspace Management Controller
 *
 * Handles workspace lifecycle operations including creation, retrieval, updates,
 * archival, and membership management. Implements multi-workspace architecture
 * with automatic PostgreSQL schema provisioning per workspace.
 *
 * Key Features:
 * - Workspace CRUD operations with validation
 * - Automatic PostgreSQL schema provisioning on creation
 * - Membership management (invite, remove, role updates)
 * - Super-admin and workspace-level authorization
 * - Transaction-based operations for data consistency
 * - Soft delete (archive) for workspace deactivation
 *
 * Security Features:
 * - Super-admin access for workspace management
 * - Workspace membership verification for member operations
 * - Role-based access control (owner, admin, member, viewer)
 * - Transaction rollback on failures
 *
 * Multi-Workspace:
 * - Each workspace gets isolated PostgreSQL schema
 * - Schema naming follows `ws_<slug>` pattern
 * - Workspace memberships tracked in user_workspaces table
 *
 * @module controllers/workspace
 */

import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { sequelize } from "../database/db";
import {
  getAllWorkspacesQuery,
  getWorkspaceByIdQuery,
  getWorkspaceBySlugQuery,
  getWorkspacesByOrgIdQuery,
  createWorkspaceQuery,
  updateWorkspaceByIdQuery,
  archiveWorkspaceByIdQuery,
  checkSlugExistsQuery,
  checkSchemaExistsQuery,
} from "../utils/workspace.utils";
import {
  addUserToWorkspaceQuery,
  removeUserFromWorkspaceQuery,
  getWorkspaceMembersQuery,
  getUserWorkspaceRoleQuery,
  updateUserWorkspaceRoleQuery,
  checkUserWorkspaceMembershipQuery,
  transferWorkspaceOwnershipQuery,
} from "../utils/userWorkspace.utils";
import { createWorkspaceSchema } from "../scripts/createWorkspaceSchema";
import { WorkspaceModel } from "../domain.layer/models/workspace/workspace.model";
import { WorkspaceRoleType } from "../domain.layer/interfaces/i.userWorkspace";
import {
  ValidationException,
  BusinessLogicException,
} from "../domain.layer/exceptions/custom.exception";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";
import { getUserByIdQuery } from "../utils/user.utils";

/**
 * Retrieves all workspaces from the system (Super-Admin only)
 *
 * @async
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON array of workspaces
 */
export async function getAllWorkspaces(
  req: Request,
  res: Response
): Promise<any> {
  logStructured(
    "processing",
    "starting getAllWorkspaces",
    "getAllWorkspaces",
    "workspace.ctrl.ts"
  );
  logger.debug("Fetching all workspaces");
  try {
    const includeInactive = req.query.includeInactive === "true";
    const workspaces = await getAllWorkspacesQuery(includeInactive);

    if (workspaces && workspaces.length > 0) {
      logStructured(
        "successful",
        `found ${workspaces.length} workspaces`,
        "getAllWorkspaces",
        "workspace.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](workspaces));
    }

    logStructured(
      "successful",
      "no workspaces found",
      "getAllWorkspaces",
      "workspace.ctrl.ts"
    );
    return res.status(204).json(STATUS_CODE[204]([]));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve workspaces",
      "getAllWorkspaces",
      "workspace.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve workspaces: ${(error as Error).message}`
    );
    logger.error("Error in getAllWorkspaces:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Retrieves a workspace by its ID (Super-Admin only)
 *
 * @async
 * @param {Request} req - Express request with workspace ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} Workspace object or 404 if not found
 */
export async function getWorkspaceById(
  req: Request,
  res: Response
): Promise<any> {
  const workspaceId = parseInt(req.params.id);

  logStructured(
    "processing",
    `fetching workspace by ID: ${workspaceId}`,
    "getWorkspaceById",
    "workspace.ctrl.ts"
  );
  try {
    const workspace = await getWorkspaceByIdQuery(workspaceId);

    if (workspace) {
      logStructured(
        "successful",
        `workspace found: ID ${workspaceId}`,
        "getWorkspaceById",
        "workspace.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](workspace));
    }

    logStructured(
      "successful",
      `workspace not found: ID ${workspaceId}`,
      "getWorkspaceById",
      "workspace.ctrl.ts"
    );
    return res.status(404).json(STATUS_CODE[404]({ message: "Workspace not found" }));
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch workspace: ID ${workspaceId}`,
      "getWorkspaceById",
      "workspace.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve workspace by ID: ${workspaceId}`
    );
    logger.error("Error in getWorkspaceById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Retrieves a workspace by its slug (Authenticated users)
 *
 * @async
 * @param {Request} req - Express request with workspace slug in params
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} Workspace object or 404 if not found
 */
export async function getWorkspaceBySlug(
  req: Request,
  res: Response
): Promise<any> {
  const { slug } = req.params;

  logStructured(
    "processing",
    `fetching workspace by slug: ${slug}`,
    "getWorkspaceBySlug",
    "workspace.ctrl.ts"
  );
  try {
    const workspace = await getWorkspaceBySlugQuery(slug);

    if (workspace) {
      // Check if user is a member or super-admin
      const isMember = await checkUserWorkspaceMembershipQuery(
        req.userId!,
        workspace.id!
      );

      if (!isMember && !req.isSuperAdmin) {
        return res.status(403).json(
          STATUS_CODE[403]({
            message: "Access denied. You are not a member of this workspace.",
          })
        );
      }

      logStructured(
        "successful",
        `workspace found: slug ${slug}`,
        "getWorkspaceBySlug",
        "workspace.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](workspace));
    }

    logStructured(
      "successful",
      `workspace not found: slug ${slug}`,
      "getWorkspaceBySlug",
      "workspace.ctrl.ts"
    );
    return res.status(404).json(STATUS_CODE[404]({ message: "Workspace not found" }));
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch workspace by slug: ${slug}`,
      "getWorkspaceBySlug",
      "workspace.ctrl.ts"
    );
    logger.error("Error in getWorkspaceBySlug:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Retrieves workspaces for an organization (Super-Admin only)
 *
 * @async
 * @param {Request} req - Express request with org_id in params
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} Array of workspaces for the organization
 */
export async function getWorkspacesByOrgId(
  req: Request,
  res: Response
): Promise<any> {
  const orgId = parseInt(req.params.orgId);

  logStructured(
    "processing",
    `fetching workspaces for org: ${orgId}`,
    "getWorkspacesByOrgId",
    "workspace.ctrl.ts"
  );
  try {
    const includeInactive = req.query.includeInactive === "true";
    const workspaces = await getWorkspacesByOrgIdQuery(orgId, includeInactive);

    if (workspaces && workspaces.length > 0) {
      logStructured(
        "successful",
        `found ${workspaces.length} workspaces for org ${orgId}`,
        "getWorkspacesByOrgId",
        "workspace.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](workspaces));
    }

    return res.status(204).json(STATUS_CODE[204]([]));
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch workspaces for org: ${orgId}`,
      "getWorkspacesByOrgId",
      "workspace.ctrl.ts"
    );
    logger.error("Error in getWorkspacesByOrgId:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Creates a new workspace with schema provisioning (Super-Admin only)
 *
 * Implements workspace onboarding flow:
 * 1. Validates workspace data (name, slug uniqueness)
 * 2. Creates workspace record
 * 3. Provisions isolated PostgreSQL schema
 * 4. Adds creating user as workspace owner
 *
 * @async
 * @param {Request} req - Express request with workspace data
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} Created workspace object
 */
export async function createWorkspace(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  logStructured(
    "processing",
    "starting createWorkspace",
    "createWorkspace",
    "workspace.ctrl.ts"
  );
  logger.debug("Creating new workspace");

  try {
    const body = req.body as {
      org_id: number;
      name: string;
      slug: string;
      owner_id?: number;
    };

    // Validate required fields
    if (!body.org_id || !body.name || !body.slug) {
      await transaction.rollback();
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "org_id, name, and slug are required",
        })
      );
    }

    // Validate slug format (lowercase, alphanumeric, hyphens)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(body.slug)) {
      await transaction.rollback();
      return res.status(400).json(
        STATUS_CODE[400]({
          message:
            "Slug must be lowercase, alphanumeric, and may contain hyphens",
        })
      );
    }

    // Check if slug already exists
    const slugExists = await checkSlugExistsQuery(body.slug, null, transaction);
    if (slugExists) {
      await transaction.rollback();
      return res.status(409).json(
        STATUS_CODE[409]({
          message: "A workspace with this slug already exists",
        })
      );
    }

    // Use the WorkspaceModel's factory method (auto-generates schema_name)
    const workspaceModel = await WorkspaceModel.createNewWorkspace(
      body.org_id,
      body.name,
      body.slug
    );

    // Get auto-generated schema name
    const schemaName = workspaceModel.schema_name;

    // Check if schema already exists
    const schemaExists = await checkSchemaExistsQuery(schemaName, transaction);
    if (schemaExists) {
      await transaction.rollback();
      return res.status(409).json(
        STATUS_CODE[409]({
          message: "A schema with this name already exists",
        })
      );
    }

    // Validate workspace data
    await workspaceModel.validateWorkspaceData();

    // Create workspace record
    const createdWorkspace = await createWorkspaceQuery(
      workspaceModel,
      transaction
    );

    if (createdWorkspace) {
      // Create PostgreSQL schema with all tenant tables
      await createWorkspaceSchema(schemaName, transaction);

      // Add the owner (creating user or specified owner) to workspace
      const ownerId = body.owner_id || req.userId!;
      await addUserToWorkspaceQuery(
        {
          user_id: ownerId,
          workspace_id: createdWorkspace.id!,
          role: "owner" as WorkspaceRoleType,
          is_default: false,
          invited_by: req.userId,
        },
        transaction
      );

      await transaction.commit();

      logStructured(
        "successful",
        `workspace created: ${createdWorkspace.name} (${createdWorkspace.slug})`,
        "createWorkspace",
        "workspace.ctrl.ts"
      );
      await logEvent(
        "Create",
        `Workspace created: ${createdWorkspace.name} (schema: ${schemaName})`
      );

      return res.status(201).json(STATUS_CODE[201](createdWorkspace));
    }

    await transaction.rollback();
    return res.status(400).json(
      STATUS_CODE[400]({
        message: "Unable to create workspace",
      })
    );
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation failed: ${error.message}`,
        "createWorkspace",
        "workspace.ctrl.ts"
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "createWorkspace",
        "workspace.ctrl.ts"
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      "unexpected error during workspace creation",
      "createWorkspace",
      "workspace.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during workspace creation: ${(error as Error).message}`
    );
    logger.error("Error in createWorkspace:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Updates a workspace's information (Super-Admin only)
 *
 * @async
 * @param {Request} req - Express request with workspace ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} Updated workspace object
 */
export async function updateWorkspace(
  req: Request,
  res: Response
): Promise<any> {
  const workspaceId = parseInt(req.params.id);
  const transaction = await sequelize.transaction();

  logStructured(
    "processing",
    `updating workspace ID: ${workspaceId}`,
    "updateWorkspace",
    "workspace.ctrl.ts"
  );

  try {
    const updateData = req.body;

    // Get existing workspace
    const workspace = await getWorkspaceByIdQuery(workspaceId);
    if (!workspace) {
      await transaction.rollback();
      return res.status(404).json(
        STATUS_CODE[404]({
          message: "Workspace not found",
        })
      );
    }

    // If updating slug, check uniqueness
    if (updateData.slug && updateData.slug !== workspace.slug) {
      const slugExists = await checkSlugExistsQuery(
        updateData.slug,
        workspaceId,
        transaction
      );
      if (slugExists) {
        await transaction.rollback();
        return res.status(409).json(
          STATUS_CODE[409]({
            message: "A workspace with this slug already exists",
          })
        );
      }
    }

    // Update workspace
    const updatedWorkspace = await updateWorkspaceByIdQuery(
      workspaceId,
      updateData,
      transaction
    );

    if (updatedWorkspace) {
      await transaction.commit();
      logStructured(
        "successful",
        `workspace updated: ID ${workspaceId}`,
        "updateWorkspace",
        "workspace.ctrl.ts"
      );
      await logEvent("Update", `Workspace updated: ID ${workspaceId}`);
      return res.status(200).json(STATUS_CODE[200](updatedWorkspace));
    }

    await transaction.rollback();
    return res.status(400).json(
      STATUS_CODE[400]({
        message: "Unable to update workspace",
      })
    );
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    logStructured(
      "error",
      `failed to update workspace: ID ${workspaceId}`,
      "updateWorkspace",
      "workspace.ctrl.ts"
    );
    logger.error("Error in updateWorkspace:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Archives (soft deletes) a workspace (Super-Admin only)
 *
 * Sets is_active to false rather than deleting the record.
 *
 * @async
 * @param {Request} req - Express request with workspace ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} Archived workspace object
 */
export async function archiveWorkspace(
  req: Request,
  res: Response
): Promise<any> {
  const workspaceId = parseInt(req.params.id);
  const transaction = await sequelize.transaction();

  logStructured(
    "processing",
    `archiving workspace ID: ${workspaceId}`,
    "archiveWorkspace",
    "workspace.ctrl.ts"
  );

  try {
    // Check workspace exists
    const workspace = await getWorkspaceByIdQuery(workspaceId);
    if (!workspace) {
      await transaction.rollback();
      return res.status(404).json(
        STATUS_CODE[404]({
          message: "Workspace not found",
        })
      );
    }

    // Archive workspace
    const archivedWorkspace = await archiveWorkspaceByIdQuery(
      workspaceId,
      transaction
    );

    if (archivedWorkspace) {
      await transaction.commit();
      logStructured(
        "successful",
        `workspace archived: ID ${workspaceId}`,
        "archiveWorkspace",
        "workspace.ctrl.ts"
      );
      await logEvent("Delete", `Workspace archived: ID ${workspaceId}`);
      return res.status(200).json(STATUS_CODE[200](archivedWorkspace));
    }

    await transaction.rollback();
    return res.status(400).json(
      STATUS_CODE[400]({
        message: "Unable to archive workspace",
      })
    );
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `failed to archive workspace: ID ${workspaceId}`,
      "archiveWorkspace",
      "workspace.ctrl.ts"
    );
    logger.error("Error in archiveWorkspace:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// ==========================================
// MEMBERSHIP MANAGEMENT ENDPOINTS
// ==========================================

/**
 * Gets all members of a workspace
 *
 * @async
 * @param {Request} req - Express request with workspace ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} Array of workspace members with user details
 */
export async function getWorkspaceMembers(
  req: Request,
  res: Response
): Promise<any> {
  const workspaceId = parseInt(req.params.id);

  logStructured(
    "processing",
    `fetching members for workspace: ${workspaceId}`,
    "getWorkspaceMembers",
    "workspace.ctrl.ts"
  );

  try {
    // Check if user is a member or super-admin
    const isMember = await checkUserWorkspaceMembershipQuery(
      req.userId!,
      workspaceId
    );

    if (!isMember && !req.isSuperAdmin) {
      return res.status(403).json(
        STATUS_CODE[403]({
          message: "Access denied. You are not a member of this workspace.",
        })
      );
    }

    const members = await getWorkspaceMembersQuery(workspaceId);

    logStructured(
      "successful",
      `found ${members.length} members for workspace ${workspaceId}`,
      "getWorkspaceMembers",
      "workspace.ctrl.ts"
    );

    return res.status(200).json(STATUS_CODE[200](members));
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch workspace members: ${workspaceId}`,
      "getWorkspaceMembers",
      "workspace.ctrl.ts"
    );
    logger.error("Error in getWorkspaceMembers:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Invites a user to a workspace
 *
 * @async
 * @param {Request} req - Express request with workspace ID and user data
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} Created membership object
 */
export async function inviteUserToWorkspace(
  req: Request,
  res: Response
): Promise<any> {
  const workspaceId = parseInt(req.params.id);
  const transaction = await sequelize.transaction();

  logStructured(
    "processing",
    `inviting user to workspace: ${workspaceId}`,
    "inviteUserToWorkspace",
    "workspace.ctrl.ts"
  );

  try {
    const { user_id, role } = req.body as {
      user_id: number;
      role?: WorkspaceRoleType;
    };

    if (!user_id) {
      await transaction.rollback();
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "user_id is required",
        })
      );
    }

    // Check authorization: must be admin/owner or super-admin
    const requesterRole = await getUserWorkspaceRoleQuery(
      req.userId!,
      workspaceId
    );

    if (
      !req.isSuperAdmin &&
      requesterRole !== "owner" &&
      requesterRole !== "admin"
    ) {
      await transaction.rollback();
      return res.status(403).json(
        STATUS_CODE[403]({
          message: "Only workspace owners and admins can invite members",
        })
      );
    }

    // Check if user exists
    const user = await getUserByIdQuery(user_id);
    if (!user) {
      await transaction.rollback();
      return res.status(404).json(
        STATUS_CODE[404]({
          message: "User not found",
        })
      );
    }

    // Check if user is already a member
    const isAlreadyMember = await checkUserWorkspaceMembershipQuery(
      user_id,
      workspaceId,
      transaction
    );

    if (isAlreadyMember) {
      await transaction.rollback();
      return res.status(409).json(
        STATUS_CODE[409]({
          message: "User is already a member of this workspace",
        })
      );
    }

    // Non-owners cannot assign owner role
    const assignedRole = role || "member";
    if (assignedRole === "owner" && requesterRole !== "owner" && !req.isSuperAdmin) {
      await transaction.rollback();
      return res.status(403).json(
        STATUS_CODE[403]({
          message: "Only workspace owners can assign owner role",
        })
      );
    }

    // Add user to workspace
    const membership = await addUserToWorkspaceQuery(
      {
        user_id,
        workspace_id: workspaceId,
        role: assignedRole,
        invited_by: req.userId,
      },
      transaction
    );

    await transaction.commit();

    logStructured(
      "successful",
      `user ${user_id} added to workspace ${workspaceId}`,
      "inviteUserToWorkspace",
      "workspace.ctrl.ts"
    );
    await logEvent(
      "Create",
      `User ${user_id} invited to workspace ${workspaceId} with role ${assignedRole}`
    );

    return res.status(201).json(STATUS_CODE[201](membership));
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `failed to invite user to workspace: ${workspaceId}`,
      "inviteUserToWorkspace",
      "workspace.ctrl.ts"
    );
    logger.error("Error in inviteUserToWorkspace:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Removes a user from a workspace
 *
 * @async
 * @param {Request} req - Express request with workspace ID and user ID
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} Success status
 */
export async function removeUserFromWorkspace(
  req: Request,
  res: Response
): Promise<any> {
  const workspaceId = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  const transaction = await sequelize.transaction();

  logStructured(
    "processing",
    `removing user ${userId} from workspace: ${workspaceId}`,
    "removeUserFromWorkspace",
    "workspace.ctrl.ts"
  );

  try {
    // Check authorization: must be admin/owner or super-admin
    const requesterRole = await getUserWorkspaceRoleQuery(
      req.userId!,
      workspaceId
    );

    if (
      !req.isSuperAdmin &&
      requesterRole !== "owner" &&
      requesterRole !== "admin"
    ) {
      await transaction.rollback();
      return res.status(403).json(
        STATUS_CODE[403]({
          message: "Only workspace owners and admins can remove members",
        })
      );
    }

    // Check if target user is a member
    const targetRole = await getUserWorkspaceRoleQuery(userId, workspaceId);
    if (!targetRole) {
      await transaction.rollback();
      return res.status(404).json(
        STATUS_CODE[404]({
          message: "User is not a member of this workspace",
        })
      );
    }

    // Cannot remove workspace owner (must transfer ownership first)
    if (targetRole === "owner") {
      await transaction.rollback();
      return res.status(400).json(
        STATUS_CODE[400]({
          message:
            "Cannot remove workspace owner. Transfer ownership first.",
        })
      );
    }

    // Admins cannot remove other admins (only owners can)
    if (targetRole === "admin" && requesterRole !== "owner" && !req.isSuperAdmin) {
      await transaction.rollback();
      return res.status(403).json(
        STATUS_CODE[403]({
          message: "Only workspace owners can remove admins",
        })
      );
    }

    // Remove user from workspace
    await removeUserFromWorkspaceQuery(userId, workspaceId, transaction);

    await transaction.commit();

    logStructured(
      "successful",
      `user ${userId} removed from workspace ${workspaceId}`,
      "removeUserFromWorkspace",
      "workspace.ctrl.ts"
    );
    await logEvent(
      "Delete",
      `User ${userId} removed from workspace ${workspaceId}`
    );

    return res.status(200).json(
      STATUS_CODE[200]({
        message: "User removed from workspace successfully",
      })
    );
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `failed to remove user from workspace: ${workspaceId}`,
      "removeUserFromWorkspace",
      "workspace.ctrl.ts"
    );
    logger.error("Error in removeUserFromWorkspace:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Updates a user's role in a workspace
 *
 * @async
 * @param {Request} req - Express request with workspace ID, user ID, and new role
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} Updated membership object
 */
export async function updateUserRole(
  req: Request,
  res: Response
): Promise<any> {
  const workspaceId = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  const transaction = await sequelize.transaction();

  logStructured(
    "processing",
    `updating role for user ${userId} in workspace: ${workspaceId}`,
    "updateUserRole",
    "workspace.ctrl.ts"
  );

  try {
    const { role } = req.body as { role: WorkspaceRoleType };

    if (!role) {
      await transaction.rollback();
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "role is required",
        })
      );
    }

    // Validate role
    const validRoles: WorkspaceRoleType[] = ["owner", "admin", "member", "viewer"];
    if (!validRoles.includes(role)) {
      await transaction.rollback();
      return res.status(400).json(
        STATUS_CODE[400]({
          message: `Invalid role. Must be one of: ${validRoles.join(", ")}`,
        })
      );
    }

    // Check authorization: must be owner or super-admin
    const requesterRole = await getUserWorkspaceRoleQuery(
      req.userId!,
      workspaceId
    );

    if (!req.isSuperAdmin && requesterRole !== "owner") {
      await transaction.rollback();
      return res.status(403).json(
        STATUS_CODE[403]({
          message: "Only workspace owners can change member roles",
        })
      );
    }

    // Check if target user is a member
    const targetRole = await getUserWorkspaceRoleQuery(userId, workspaceId);
    if (!targetRole) {
      await transaction.rollback();
      return res.status(404).json(
        STATUS_CODE[404]({
          message: "User is not a member of this workspace",
        })
      );
    }

    // Handle ownership transfer specially
    if (role === "owner") {
      if (targetRole === "owner") {
        await transaction.rollback();
        return res.status(400).json(
          STATUS_CODE[400]({
            message: "User is already the workspace owner",
          })
        );
      }

      // Transfer ownership
      await transferWorkspaceOwnershipQuery(
        workspaceId,
        req.userId!,
        userId,
        transaction
      );

      await transaction.commit();

      logStructured(
        "successful",
        `ownership transferred to user ${userId} in workspace ${workspaceId}`,
        "updateUserRole",
        "workspace.ctrl.ts"
      );
      await logEvent(
      "Update",
        `Workspace ${workspaceId} ownership transferred to user ${userId}`
      );

      return res.status(200).json(
        STATUS_CODE[200]({
          message: "Ownership transferred successfully",
        })
      );
    }

    // Cannot change owner's role (must transfer ownership)
    if (targetRole === "owner") {
      await transaction.rollback();
      return res.status(400).json(
        STATUS_CODE[400]({
          message: "Cannot change owner's role. Transfer ownership instead.",
        })
      );
    }

    // Update role
    const updatedMembership = await updateUserWorkspaceRoleQuery(
      userId,
      workspaceId,
      role,
      transaction
    );

    await transaction.commit();

    logStructured(
      "successful",
      `role updated for user ${userId} in workspace ${workspaceId}`,
      "updateUserRole",
      "workspace.ctrl.ts"
    );
    await logEvent(
      "Update",
      `User ${userId} role updated to ${role} in workspace ${workspaceId}`
    );

    return res.status(200).json(STATUS_CODE[200](updatedMembership));
  } catch (error) {
    await transaction.rollback();
    logStructured(
      "error",
      `failed to update user role in workspace: ${workspaceId}`,
      "updateUserRole",
      "workspace.ctrl.ts"
    );
    logger.error("Error in updateUserRole:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
