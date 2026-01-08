/**
 * @fileoverview Workspace Session Service (Frontend)
 *
 * Handles workspace session management in the browser:
 * - Stores current workspace in localStorage
 * - Retrieves workspace info for session persistence
 * - Clears workspace data on logout
 * - Manages workspace switching
 *
 * @module application/services/workspaceSession.service
 */

/**
 * Workspace information structure
 */
export interface WorkspaceInfo {
  workspace_id: number;
  slug: string;
  name: string;
  role: string;
  is_default?: boolean;
  schema_name?: string;
}

/**
 * Current workspace data stored in localStorage
 */
export interface CurrentWorkspace {
  id: number;
  slug: string;
  name: string;
  role: string;
}

// Storage keys
const STORAGE_KEYS = {
  CURRENT_WORKSPACE_ID: "currentWorkspaceId",
  CURRENT_WORKSPACE_SLUG: "currentWorkspaceSlug",
  CURRENT_WORKSPACE_NAME: "currentWorkspaceName",
  CURRENT_WORKSPACE_ROLE: "currentWorkspaceRole",
  USER_WORKSPACES: "userWorkspaces",
  LAST_WORKSPACE_SLUG: "lastWorkspaceSlug",
} as const;

/**
 * Stores current workspace info in localStorage
 *
 * @param workspace - Workspace info to store
 */
export function setCurrentWorkspace(workspace: CurrentWorkspace): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_WORKSPACE_ID, String(workspace.id));
  localStorage.setItem(STORAGE_KEYS.CURRENT_WORKSPACE_SLUG, workspace.slug);
  localStorage.setItem(STORAGE_KEYS.CURRENT_WORKSPACE_NAME, workspace.name);
  localStorage.setItem(STORAGE_KEYS.CURRENT_WORKSPACE_ROLE, workspace.role);
  // Also save as last workspace for next login
  localStorage.setItem(STORAGE_KEYS.LAST_WORKSPACE_SLUG, workspace.slug);
}

/**
 * Gets current workspace from localStorage
 *
 * @returns Current workspace info or null if not set
 */
export function getCurrentWorkspace(): CurrentWorkspace | null {
  const id = localStorage.getItem(STORAGE_KEYS.CURRENT_WORKSPACE_ID);
  const slug = localStorage.getItem(STORAGE_KEYS.CURRENT_WORKSPACE_SLUG);
  const name = localStorage.getItem(STORAGE_KEYS.CURRENT_WORKSPACE_NAME);
  const role = localStorage.getItem(STORAGE_KEYS.CURRENT_WORKSPACE_ROLE);

  if (!id || !slug) {
    return null;
  }

  return {
    id: parseInt(id, 10),
    slug,
    name: name || "",
    role: role || "member",
  };
}

/**
 * Gets current workspace ID from localStorage
 *
 * @returns Workspace ID or null
 */
export function getCurrentWorkspaceId(): number | null {
  const id = localStorage.getItem(STORAGE_KEYS.CURRENT_WORKSPACE_ID);
  return id ? parseInt(id, 10) : null;
}

/**
 * Gets current workspace slug from localStorage
 *
 * @returns Workspace slug or null
 */
export function getCurrentWorkspaceSlug(): string | null {
  return localStorage.getItem(STORAGE_KEYS.CURRENT_WORKSPACE_SLUG);
}

/**
 * Gets last workspace slug (for returning users)
 *
 * @returns Last workspace slug or null
 */
export function getLastWorkspaceSlug(): string | null {
  return localStorage.getItem(STORAGE_KEYS.LAST_WORKSPACE_SLUG);
}

/**
 * Stores all user workspaces for workspace switcher
 *
 * @param workspaces - Array of workspace info
 */
export function setUserWorkspaces(workspaces: WorkspaceInfo[]): void {
  localStorage.setItem(STORAGE_KEYS.USER_WORKSPACES, JSON.stringify(workspaces));
}

/**
 * Gets all user workspaces from localStorage
 *
 * @returns Array of workspace info or empty array
 */
export function getUserWorkspaces(): WorkspaceInfo[] {
  const data = localStorage.getItem(STORAGE_KEYS.USER_WORKSPACES);
  if (!data) {
    return [];
  }
  try {
    return JSON.parse(data) as WorkspaceInfo[];
  } catch {
    return [];
  }
}

/**
 * Clears workspace data from localStorage (for logout)
 */
export function clearWorkspaceSession(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_WORKSPACE_ID);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_WORKSPACE_SLUG);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_WORKSPACE_NAME);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_WORKSPACE_ROLE);
  localStorage.removeItem(STORAGE_KEYS.USER_WORKSPACES);
  // NOTE: We keep LAST_WORKSPACE_SLUG for next login
}

/**
 * Clears all workspace data including last workspace
 */
export function clearAllWorkspaceData(): void {
  clearWorkspaceSession();
  localStorage.removeItem(STORAGE_KEYS.LAST_WORKSPACE_SLUG);
}

/**
 * Switches to a different workspace
 *
 * @param workspace - Workspace to switch to
 * @returns New workspace URL to navigate to
 */
export function switchWorkspace(workspace: WorkspaceInfo): string {
  setCurrentWorkspace({
    id: workspace.workspace_id,
    slug: workspace.slug,
    name: workspace.name,
    role: workspace.role,
  });
  return buildWorkspaceUrl(workspace.slug);
}

/**
 * Builds workspace URL from slug
 *
 * @param slug - Workspace slug
 * @param path - Optional path after workspace (default: '')
 * @returns Full workspace URL
 */
export function buildWorkspaceUrl(slug: string, path: string = ""): string {
  if (!slug) {
    return path || "/";
  }
  const normalizedPath = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `/w/${slug}${normalizedPath}`;
}

/**
 * Extracts workspace slug from current URL
 *
 * @param pathname - URL pathname (default: window.location.pathname)
 * @returns Workspace slug or null if not in workspace URL
 */
export function getWorkspaceSlugFromUrl(
  pathname: string = window.location.pathname
): string | null {
  // URL pattern: /w/{slug}/...
  const match = pathname.match(/^\/w\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/|$)/);
  return match ? match[1] : null;
}

/**
 * Checks if current URL is a workspace URL
 *
 * @param pathname - URL pathname (default: window.location.pathname)
 * @returns true if URL is workspace-scoped
 */
export function isWorkspaceUrl(
  pathname: string = window.location.pathname
): boolean {
  return pathname.startsWith("/w/");
}

/**
 * Removes workspace prefix from URL path
 *
 * @param pathname - URL pathname
 * @returns Path without workspace prefix
 */
export function stripWorkspaceFromPath(pathname: string): string {
  // Remove /w/{slug} prefix
  const match = pathname.match(/^\/w\/[a-z0-9]+(?:-[a-z0-9]+)*(.*)$/);
  return match ? match[1] || "/" : pathname;
}

/**
 * Validates workspace slug format
 *
 * @param slug - Workspace slug
 * @returns true if slug is valid
 */
export function isValidWorkspaceSlug(slug: string): boolean {
  if (!slug || slug.trim().length === 0) {
    return false;
  }
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugPattern.test(slug) && slug.length >= 2 && slug.length <= 63;
}

/**
 * Gets the redirect URL after login based on workspace and requested path
 *
 * @param requestedPath - Path user was trying to access before login
 * @param workspace - User's workspace info
 * @returns URL to redirect to after login
 */
export function getPostLoginRedirectUrl(
  requestedPath: string | null,
  workspace: CurrentWorkspace | null
): string {
  // If user was trying to access a specific path, redirect there
  if (requestedPath && requestedPath !== "/login" && requestedPath !== "/") {
    // If the requested path already has workspace, use it
    if (isWorkspaceUrl(requestedPath)) {
      return requestedPath;
    }
    // Otherwise, add workspace prefix if we have one
    if (workspace) {
      return buildWorkspaceUrl(workspace.slug, requestedPath);
    }
    return requestedPath;
  }

  // Default: redirect to workspace root or home
  if (workspace) {
    return buildWorkspaceUrl(workspace.slug);
  }
  return "/";
}
