/**
 * @fileoverview User-Workspace Association Interface
 *
 * Defines the junction entity for User-Workspace many-to-many relationship.
 * Supports role-based access control within workspaces.
 *
 * @module domain.layer/interfaces/i.userWorkspace
 */

/**
 * Valid workspace roles
 */
export const WorkspaceRole = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
  VIEWER: "viewer",
} as const;

export type WorkspaceRoleType = (typeof WorkspaceRole)[keyof typeof WorkspaceRole];

export type IUserWorkspace = {
  id?: number;
  user_id: number;
  workspace_id: number;
  role: WorkspaceRoleType;
  is_default?: boolean;
  joined_at?: Date;
  invited_by?: number;
  created_at?: Date;
  updated_at?: Date;
};

/**
 * Input type for creating a new user-workspace association
 */
export type IUserWorkspaceCreate = {
  user_id: number;
  workspace_id: number;
  role: WorkspaceRoleType;
  is_default?: boolean;
  invited_by?: number;
};

/**
 * Input type for updating user-workspace association
 */
export type IUserWorkspaceUpdate = {
  role?: WorkspaceRoleType;
  is_default?: boolean;
};

/**
 * User workspace with workspace details (for joins)
 */
export type IUserWorkspaceWithWorkspace = IUserWorkspace & {
  workspace?: {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
  };
};

/**
 * User workspace with user details (for joins)
 */
export type IUserWorkspaceWithUser = IUserWorkspace & {
  user?: {
    id: number;
    name: string;
    surname: string;
    email: string;
  };
};
