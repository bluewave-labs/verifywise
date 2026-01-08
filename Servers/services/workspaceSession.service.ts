/**
 * @fileoverview Workspace Session Service
 *
 * Handles workspace selection and session management for user login.
 * Provides functions for:
 * - Determining user's default/last workspace on login
 * - Building workspace redirect URLs
 * - Building login responses with workspace information
 *
 * @module services/workspaceSession.service
 */

import {
  getUserWorkspacesQuery,
  getDefaultWorkspaceQuery,
} from "../utils/userWorkspace.utils";
import { ValidationException } from "../domain.layer/exceptions/custom.exception";

/**
 * Workspace information structure
 */
export interface WorkspaceInfo {
  workspace_id: number;
  slug: string;
  name: string;
  role: string;
  is_default: boolean;
  schema_name?: string;
}

/**
 * Login response with workspace information
 */
export interface LoginResponseWithWorkspace {
  token: string;
  user: {
    id: number;
    email: string;
    name?: string;
    surname?: string;
    role_name?: string;
    organization_id?: number;
    is_super_admin?: boolean;
  };
  workspace?: {
    id: number;
    slug: string;
    name: string;
    role: string;
    schema_name?: string;
  };
  workspaces?: WorkspaceInfo[];
  redirectUrl?: string;
}

/**
 * Builds workspace redirect URL from workspace slug
 *
 * URL Structure: /w/{slug}{basePath}
 * Examples:
 * - buildWorkspaceRedirectUrl('acme') → '/w/acme'
 * - buildWorkspaceRedirectUrl('acme', '/dashboard') → '/w/acme/dashboard'
 *
 * @param slug - Workspace slug
 * @param basePath - Base path after workspace (default: '/')
 * @returns Full redirect URL with workspace slug
 */
export function buildWorkspaceRedirectUrl(
  slug: string,
  basePath: string = "/"
): string {
  if (!slug || slug.trim().length === 0) {
    return basePath;
  }

  // Ensure base path starts with /
  const normalizedBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;

  // Build workspace URL: /w/{slug}{basePath}
  return `/w/${slug}${normalizedBasePath === "/" ? "" : normalizedBasePath}`;
}

/**
 * Validates workspace slug format for URL construction
 *
 * Slug rules:
 * - Lowercase alphanumeric with hyphens
 * - No leading/trailing hyphens
 * - No consecutive hyphens
 * - 2-63 characters
 *
 * @param slug - Workspace slug
 * @returns true if slug is valid URL-safe format
 */
export function isValidWorkspaceSlug(slug: string): boolean {
  if (!slug || slug.trim().length === 0) {
    return false;
  }
  // Slug must be lowercase alphanumeric with hyphens
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugPattern.test(slug) && slug.length >= 2 && slug.length <= 63;
}

/**
 * Determines the workspace to use after login
 *
 * Priority:
 * 1. User's explicitly set default workspace (if active)
 * 2. Most recently joined workspace
 * 3. First available active workspace
 * 4. null if no workspaces
 *
 * @param userId - User ID
 * @returns Workspace info or null if user has no workspaces
 * @throws ValidationException if userId is invalid
 */
export async function getLoginWorkspace(
  userId: number
): Promise<WorkspaceInfo | null> {
  if (!userId || userId < 1) {
    throw new ValidationException(
      "Valid user ID is required",
      "userId",
      userId
    );
  }

  // First try to get explicitly set default workspace
  const defaultWorkspace = await getDefaultWorkspaceQuery(userId);

  if (defaultWorkspace && defaultWorkspace.is_active !== false) {
    return {
      workspace_id: defaultWorkspace.workspace_id || defaultWorkspace.id,
      slug: defaultWorkspace.slug,
      name: defaultWorkspace.name,
      role: defaultWorkspace.role,
      is_default: true,
      schema_name: defaultWorkspace.schema_name,
    };
  }

  // If no default, get all workspaces and return the first active one
  // They're already sorted by is_default DESC, joined_at DESC
  const workspaces = await getUserWorkspacesQuery(userId, false);

  if (!workspaces || workspaces.length === 0) {
    return null;
  }

  // Return first active workspace
  const firstWorkspace = workspaces[0];
  return {
    workspace_id: firstWorkspace.workspace_id || firstWorkspace.id,
    slug: firstWorkspace.slug,
    name: firstWorkspace.name,
    role: firstWorkspace.role,
    is_default: firstWorkspace.is_default || false,
    schema_name: firstWorkspace.schema_name,
  };
}

/**
 * Gets all workspaces for a user (for workspace switcher)
 *
 * @param userId - User ID
 * @returns Array of workspace info objects
 * @throws ValidationException if userId is invalid
 */
export async function getUserLoginWorkspaces(
  userId: number
): Promise<WorkspaceInfo[]> {
  if (!userId || userId < 1) {
    throw new ValidationException(
      "Valid user ID is required",
      "userId",
      userId
    );
  }

  const workspaces = await getUserWorkspacesQuery(userId, false);

  if (!workspaces || workspaces.length === 0) {
    return [];
  }

  return workspaces.map((ws: any) => ({
    workspace_id: ws.workspace_id || ws.id,
    slug: ws.slug,
    name: ws.name,
    role: ws.role,
    is_default: ws.is_default || false,
    schema_name: ws.schema_name,
  }));
}

/**
 * Builds login response with workspace information
 *
 * @param token - JWT access token
 * @param user - User data
 * @param workspace - Current workspace info (optional)
 * @param allWorkspaces - All user workspaces for workspace switcher (optional)
 * @returns Login response object with workspace info
 */
export function buildLoginResponseWithWorkspace(
  token: string,
  user: LoginResponseWithWorkspace["user"],
  workspace: WorkspaceInfo | null,
  allWorkspaces?: WorkspaceInfo[]
): LoginResponseWithWorkspace {
  const response: LoginResponseWithWorkspace = {
    token,
    user,
  };

  if (workspace) {
    response.workspace = {
      id: workspace.workspace_id,
      slug: workspace.slug,
      name: workspace.name,
      role: workspace.role,
      schema_name: workspace.schema_name,
    };
    response.redirectUrl = buildWorkspaceRedirectUrl(workspace.slug);
  }

  if (allWorkspaces && allWorkspaces.length > 0) {
    response.workspaces = allWorkspaces;
  }

  return response;
}

/**
 * Complete login workspace setup
 *
 * Performs full workspace resolution for login:
 * 1. Gets user's default/first workspace
 * 2. Gets all user workspaces for switcher
 * 3. Builds complete login response
 *
 * @param token - JWT access token
 * @param user - User data
 * @returns Complete login response with workspace info
 */
export async function setupLoginWorkspace(
  token: string,
  user: LoginResponseWithWorkspace["user"]
): Promise<LoginResponseWithWorkspace> {
  try {
    // Get user's default/first workspace
    const currentWorkspace = await getLoginWorkspace(user.id);

    // Get all user workspaces for workspace switcher
    const allWorkspaces = await getUserLoginWorkspaces(user.id);

    return buildLoginResponseWithWorkspace(
      token,
      user,
      currentWorkspace,
      allWorkspaces
    );
  } catch (error) {
    // If workspace lookup fails, return response without workspace info
    // User can still login, just won't have workspace context
    return {
      token,
      user,
    };
  }
}
