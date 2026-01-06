/**
 * @file userWorkspace.utils.ts
 * @description Utility functions for performing CRUD operations on the 'user_workspaces' table.
 *
 * Functions included:
 * - `addUserToWorkspaceQuery`: Adds a user to a workspace with a specific role.
 * - `removeUserFromWorkspaceQuery`: Removes a user from a workspace.
 * - `getUserWorkspacesQuery`: Gets all workspaces a user belongs to.
 * - `getWorkspaceMembersQuery`: Gets all members of a workspace.
 * - `getUserWorkspaceRoleQuery`: Gets a user's role in a specific workspace.
 * - `updateUserWorkspaceRoleQuery`: Updates a user's role in a workspace.
 * - `checkUserWorkspaceMembershipQuery`: Checks if a user is a member of a workspace.
 * - `setDefaultWorkspaceQuery`: Sets a workspace as user's default.
 * - `getWorkspaceOwnerQuery`: Gets the owner of a workspace.
 * - `countWorkspaceMembersQuery`: Counts members in a workspace.
 *
 * @module utils/userWorkspace.utils
 */

import { UserWorkspaceModel } from "../domain.layer/models/userWorkspace/userWorkspace.model";
import { WorkspaceRoleType } from "../domain.layer/interfaces/i.userWorkspace";
import { sequelize } from "../database/db";
import { QueryTypes, Transaction } from "sequelize";

/**
 * Adds a user to a workspace with a specific role.
 *
 * @param {Partial<UserWorkspaceModel>} membership - The membership data.
 * @param {Transaction} transaction - The transaction for database operations.
 * @returns {Promise<UserWorkspaceModel>} The created membership record.
 */
export const addUserToWorkspaceQuery = async (
  membership: Partial<UserWorkspaceModel>,
  transaction: Transaction
): Promise<UserWorkspaceModel> => {
  const result = await sequelize.query(
    `INSERT INTO user_workspaces(
      user_id, workspace_id, role, is_default, joined_at, invited_by, created_at, updated_at
    ) VALUES (
      :user_id, :workspace_id, :role, :is_default, :joined_at, :invited_by, :created_at, :updated_at
    ) RETURNING *`,
    {
      replacements: {
        user_id: membership.user_id,
        workspace_id: membership.workspace_id,
        role: membership.role || "member",
        is_default: membership.is_default || false,
        joined_at: new Date(),
        invited_by: membership.invited_by || null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      mapToModel: true,
      model: UserWorkspaceModel,
      transaction,
    }
  );
  return result[0];
};

/**
 * Removes a user from a workspace.
 *
 * @param {number} userId - The user ID.
 * @param {number} workspaceId - The workspace ID.
 * @param {Transaction} transaction - The transaction for database operations.
 * @returns {Promise<number>} Number of rows deleted (0 or 1).
 */
export const removeUserFromWorkspaceQuery = async (
  userId: number,
  workspaceId: number,
  transaction: Transaction
): Promise<number> => {
  const result = await sequelize.query(
    `DELETE FROM user_workspaces WHERE user_id = :userId AND workspace_id = :workspaceId`,
    {
      replacements: { userId, workspaceId },
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return result as unknown as number;
};

/**
 * Gets all workspaces a user belongs to (with workspace details).
 *
 * @param {number} userId - The user ID.
 * @param {boolean} includeInactive - Whether to include inactive workspaces.
 * @param {Transaction | null} transaction - Optional transaction.
 * @returns {Promise<any[]>} Array of workspace memberships with workspace details.
 */
export const getUserWorkspacesQuery = async (
  userId: number,
  includeInactive: boolean = false,
  transaction: Transaction | null = null
): Promise<any[]> => {
  const activeClause = includeInactive ? "" : "AND w.is_active = true";
  const result = await sequelize.query(
    `SELECT
      uw.id as membership_id,
      uw.user_id,
      uw.workspace_id,
      uw.role,
      uw.is_default,
      uw.joined_at,
      uw.invited_by,
      w.id,
      w.org_id,
      w.name,
      w.slug,
      w.schema_name,
      w.is_active,
      w.created_at as workspace_created_at
    FROM user_workspaces uw
    INNER JOIN workspaces w ON uw.workspace_id = w.id
    WHERE uw.user_id = :userId ${activeClause}
    ORDER BY uw.is_default DESC, uw.joined_at DESC`,
    {
      replacements: { userId },
      type: QueryTypes.SELECT,
      ...(transaction && { transaction }),
    }
  );
  return result;
};

/**
 * Gets all members of a workspace (with user details).
 *
 * @param {number} workspaceId - The workspace ID.
 * @param {Transaction | null} transaction - Optional transaction.
 * @returns {Promise<any[]>} Array of workspace members with user details.
 */
export const getWorkspaceMembersQuery = async (
  workspaceId: number,
  transaction: Transaction | null = null
): Promise<any[]> => {
  const result = await sequelize.query(
    `SELECT
      uw.id as membership_id,
      uw.user_id,
      uw.workspace_id,
      uw.role,
      uw.is_default,
      uw.joined_at,
      uw.invited_by,
      u.id,
      u.name as user_name,
      u.email,
      u.surname,
      u.is_active as user_is_active
    FROM user_workspaces uw
    INNER JOIN users u ON uw.user_id = u.id
    WHERE uw.workspace_id = :workspaceId
    ORDER BY
      CASE uw.role
        WHEN 'owner' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'member' THEN 3
        WHEN 'viewer' THEN 4
      END,
      uw.joined_at ASC`,
    {
      replacements: { workspaceId },
      type: QueryTypes.SELECT,
      ...(transaction && { transaction }),
    }
  );
  return result;
};

/**
 * Gets a user's role in a specific workspace.
 *
 * @param {number} userId - The user ID.
 * @param {number} workspaceId - The workspace ID.
 * @param {Transaction | null} transaction - Optional transaction.
 * @returns {Promise<WorkspaceRoleType | null>} The user's role or null if not a member.
 */
export const getUserWorkspaceRoleQuery = async (
  userId: number,
  workspaceId: number,
  transaction: Transaction | null = null
): Promise<WorkspaceRoleType | null> => {
  const result = await sequelize.query(
    `SELECT role FROM user_workspaces WHERE user_id = :userId AND workspace_id = :workspaceId`,
    {
      replacements: { userId, workspaceId },
      type: QueryTypes.SELECT,
      ...(transaction && { transaction }),
    }
  ) as { role: WorkspaceRoleType }[];

  return result[0]?.role || null;
};

/**
 * Updates a user's role in a workspace.
 *
 * @param {number} userId - The user ID.
 * @param {number} workspaceId - The workspace ID.
 * @param {WorkspaceRoleType} role - The new role.
 * @param {Transaction} transaction - The transaction for database operations.
 * @returns {Promise<UserWorkspaceModel | null>} The updated membership or null.
 */
export const updateUserWorkspaceRoleQuery = async (
  userId: number,
  workspaceId: number,
  role: WorkspaceRoleType,
  transaction: Transaction
): Promise<UserWorkspaceModel | null> => {
  const result = await sequelize.query(
    `UPDATE user_workspaces
     SET role = :role, updated_at = :updated_at
     WHERE user_id = :userId AND workspace_id = :workspaceId
     RETURNING *`,
    {
      replacements: { userId, workspaceId, role, updated_at: new Date() },
      mapToModel: true,
      model: UserWorkspaceModel,
      transaction,
    }
  );
  return result[0] || null;
};

/**
 * Checks if a user is a member of a workspace.
 *
 * @param {number} userId - The user ID.
 * @param {number} workspaceId - The workspace ID.
 * @param {Transaction | null} transaction - Optional transaction.
 * @returns {Promise<boolean>} True if user is a member, false otherwise.
 */
export const checkUserWorkspaceMembershipQuery = async (
  userId: number,
  workspaceId: number,
  transaction: Transaction | null = null
): Promise<boolean> => {
  const result = await sequelize.query(
    `SELECT COUNT(*) as count FROM user_workspaces WHERE user_id = :userId AND workspace_id = :workspaceId`,
    {
      replacements: { userId, workspaceId },
      type: QueryTypes.SELECT,
      ...(transaction && { transaction }),
    }
  ) as { count: string }[];

  return parseInt(result[0].count, 10) > 0;
};

/**
 * Sets a workspace as the user's default workspace.
 * Clears any existing default first.
 *
 * @param {number} userId - The user ID.
 * @param {number} workspaceId - The workspace ID to set as default.
 * @param {Transaction} transaction - The transaction for database operations.
 * @returns {Promise<UserWorkspaceModel | null>} The updated membership or null.
 */
export const setDefaultWorkspaceQuery = async (
  userId: number,
  workspaceId: number,
  transaction: Transaction
): Promise<UserWorkspaceModel | null> => {
  // First, clear any existing default
  await sequelize.query(
    `UPDATE user_workspaces SET is_default = false, updated_at = :updated_at WHERE user_id = :userId AND is_default = true`,
    {
      replacements: { userId, updated_at: new Date() },
      type: QueryTypes.UPDATE,
      transaction,
    }
  );

  // Set the new default
  const result = await sequelize.query(
    `UPDATE user_workspaces
     SET is_default = true, updated_at = :updated_at
     WHERE user_id = :userId AND workspace_id = :workspaceId
     RETURNING *`,
    {
      replacements: { userId, workspaceId, updated_at: new Date() },
      mapToModel: true,
      model: UserWorkspaceModel,
      transaction,
    }
  );
  return result[0] || null;
};

/**
 * Gets the owner of a workspace.
 *
 * @param {number} workspaceId - The workspace ID.
 * @param {Transaction | null} transaction - Optional transaction.
 * @returns {Promise<any | null>} The owner's membership with user details or null.
 */
export const getWorkspaceOwnerQuery = async (
  workspaceId: number,
  transaction: Transaction | null = null
): Promise<any | null> => {
  const result = await sequelize.query(
    `SELECT
      uw.id as membership_id,
      uw.user_id,
      uw.workspace_id,
      uw.role,
      uw.joined_at,
      u.name as user_name,
      u.email,
      u.surname
    FROM user_workspaces uw
    INNER JOIN users u ON uw.user_id = u.id
    WHERE uw.workspace_id = :workspaceId AND uw.role = 'owner'`,
    {
      replacements: { workspaceId },
      type: QueryTypes.SELECT,
      ...(transaction && { transaction }),
    }
  );
  return result[0] || null;
};

/**
 * Counts members in a workspace.
 *
 * @param {number} workspaceId - The workspace ID.
 * @param {Transaction | null} transaction - Optional transaction.
 * @returns {Promise<number>} The member count.
 */
export const countWorkspaceMembersQuery = async (
  workspaceId: number,
  transaction: Transaction | null = null
): Promise<number> => {
  const result = await sequelize.query(
    `SELECT COUNT(*) as count FROM user_workspaces WHERE workspace_id = :workspaceId`,
    {
      replacements: { workspaceId },
      type: QueryTypes.SELECT,
      ...(transaction && { transaction }),
    }
  ) as { count: string }[];

  return parseInt(result[0].count, 10);
};

/**
 * Gets user's default workspace.
 *
 * @param {number} userId - The user ID.
 * @param {Transaction | null} transaction - Optional transaction.
 * @returns {Promise<any | null>} The default workspace with details or null.
 */
export const getDefaultWorkspaceQuery = async (
  userId: number,
  transaction: Transaction | null = null
): Promise<any | null> => {
  const result = await sequelize.query(
    `SELECT
      uw.id as membership_id,
      uw.user_id,
      uw.workspace_id,
      uw.role,
      uw.is_default,
      uw.joined_at,
      w.id,
      w.org_id,
      w.name,
      w.slug,
      w.schema_name,
      w.is_active
    FROM user_workspaces uw
    INNER JOIN workspaces w ON uw.workspace_id = w.id
    WHERE uw.user_id = :userId AND uw.is_default = true AND w.is_active = true`,
    {
      replacements: { userId },
      type: QueryTypes.SELECT,
      ...(transaction && { transaction }),
    }
  );
  return result[0] || null;
};

/**
 * Gets a specific user-workspace membership record.
 *
 * @param {number} userId - The user ID.
 * @param {number} workspaceId - The workspace ID.
 * @param {Transaction | null} transaction - Optional transaction.
 * @returns {Promise<UserWorkspaceModel | null>} The membership record or null.
 */
export const getUserWorkspaceMembershipQuery = async (
  userId: number,
  workspaceId: number,
  transaction: Transaction | null = null
): Promise<UserWorkspaceModel | null> => {
  const result = await sequelize.query(
    `SELECT * FROM user_workspaces WHERE user_id = :userId AND workspace_id = :workspaceId`,
    {
      replacements: { userId, workspaceId },
      mapToModel: true,
      model: UserWorkspaceModel,
      ...(transaction && { transaction }),
    }
  );
  return result[0] || null;
};

/**
 * Gets count of workspaces a user belongs to.
 *
 * @param {number} userId - The user ID.
 * @param {Transaction | null} transaction - Optional transaction.
 * @returns {Promise<number>} The workspace count.
 */
export const getUserWorkspaceCountQuery = async (
  userId: number,
  transaction: Transaction | null = null
): Promise<number> => {
  const result = await sequelize.query(
    `SELECT COUNT(*) as count FROM user_workspaces uw
     INNER JOIN workspaces w ON uw.workspace_id = w.id
     WHERE uw.user_id = :userId AND w.is_active = true`,
    {
      replacements: { userId },
      type: QueryTypes.SELECT,
      ...(transaction && { transaction }),
    }
  ) as { count: string }[];

  return parseInt(result[0].count, 10);
};

/**
 * Transfers workspace ownership to another user.
 *
 * @param {number} workspaceId - The workspace ID.
 * @param {number} currentOwnerId - Current owner's user ID.
 * @param {number} newOwnerId - New owner's user ID.
 * @param {Transaction} transaction - The transaction for database operations.
 * @returns {Promise<boolean>} True if transfer was successful.
 */
export const transferWorkspaceOwnershipQuery = async (
  workspaceId: number,
  currentOwnerId: number,
  newOwnerId: number,
  transaction: Transaction
): Promise<boolean> => {
  // Demote current owner to admin
  await sequelize.query(
    `UPDATE user_workspaces
     SET role = 'admin', updated_at = :updated_at
     WHERE user_id = :currentOwnerId AND workspace_id = :workspaceId AND role = 'owner'`,
    {
      replacements: { currentOwnerId, workspaceId, updated_at: new Date() },
      type: QueryTypes.UPDATE,
      transaction,
    }
  );

  // Promote new owner
  await sequelize.query(
    `UPDATE user_workspaces
     SET role = 'owner', updated_at = :updated_at
     WHERE user_id = :newOwnerId AND workspace_id = :workspaceId`,
    {
      replacements: { newOwnerId, workspaceId, updated_at: new Date() },
      type: QueryTypes.UPDATE,
      transaction,
    }
  );

  return true;
};
