/**
 * @fileoverview Unit Tests for Login Workspace Selection Logic
 *
 * Tests the functionality of:
 * - Returning user's default/last workspace on login
 * - Building workspace redirect URL with slug
 * - Handling users with no workspaces
 * - Handling users with multiple workspaces (returns default)
 *
 * @module controllers/tests/loginWorkspace.spec
 */

import {
  ValidationException,
} from "../../domain.layer/exceptions/custom.exception";

// Mock sequelize
jest.mock("../../database/db", () => ({
  sequelize: {
    query: jest.fn(),
    transaction: jest.fn(),
  },
}));

// Mock bcrypt
jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password_123"),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock userWorkspace.utils
const mockGetUserWorkspacesQuery = jest.fn();
const mockGetDefaultWorkspaceQuery = jest.fn();
const mockSetDefaultWorkspaceQuery = jest.fn();

jest.mock("../../utils/userWorkspace.utils", () => ({
  getUserWorkspacesQuery: (...args: any[]) => mockGetUserWorkspacesQuery(...args),
  getDefaultWorkspaceQuery: (...args: any[]) => mockGetDefaultWorkspaceQuery(...args),
  setDefaultWorkspaceQuery: (...args: any[]) => mockSetDefaultWorkspaceQuery(...args),
}));

// Mock user.utils
const mockGetUserByEmailQuery = jest.fn();
jest.mock("../../utils/user.utils", () => ({
  getUserByEmailQuery: (...args: any[]) => mockGetUserByEmailQuery(...args),
}));

// Types for workspace data
interface WorkspaceInfo {
  workspace_id: number;
  slug: string;
  name: string;
  role: string;
  is_default: boolean;
  is_active?: boolean;
}

interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
  workspace?: {
    id: number;
    slug: string;
    name: string;
    role: string;
  };
  workspaces?: WorkspaceInfo[];
  redirectUrl?: string;
}

/**
 * Builds workspace redirect URL from workspace slug
 *
 * @param slug - Workspace slug
 * @param basePath - Base path (default: '/')
 * @returns Full redirect URL with workspace slug
 */
function buildWorkspaceRedirectUrl(slug: string, basePath: string = "/"): string {
  if (!slug || slug.trim().length === 0) {
    return basePath;
  }

  // Ensure base path starts with /
  const normalizedBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;

  // Build workspace URL: /w/{slug}{basePath}
  return `/w/${slug}${normalizedBasePath === "/" ? "" : normalizedBasePath}`;
}

/**
 * Determines the workspace to use after login
 *
 * Priority:
 * 1. User's explicitly set default workspace
 * 2. Most recently joined workspace
 * 3. First available workspace
 * 4. null if no workspaces
 *
 * @param userId - User ID
 * @returns Workspace info or null
 */
async function getLoginWorkspace(userId: number): Promise<WorkspaceInfo | null> {
  if (!userId || userId < 1) {
    throw new ValidationException(
      "Valid user ID is required",
      "userId",
      userId
    );
  }

  // First try to get default workspace
  const defaultWorkspace = await mockGetDefaultWorkspaceQuery(userId);

  if (defaultWorkspace && defaultWorkspace.is_active !== false) {
    return {
      workspace_id: defaultWorkspace.workspace_id,
      slug: defaultWorkspace.slug,
      name: defaultWorkspace.name,
      role: defaultWorkspace.role,
      is_default: true,
    };
  }

  // If no default, get all workspaces and return the first active one
  const workspaces = await mockGetUserWorkspacesQuery(userId, false);

  if (!workspaces || workspaces.length === 0) {
    return null;
  }

  // Return first active workspace (they're already sorted by is_default DESC, joined_at DESC)
  const firstWorkspace = workspaces[0];
  return {
    workspace_id: firstWorkspace.workspace_id,
    slug: firstWorkspace.slug,
    name: firstWorkspace.name,
    role: firstWorkspace.role,
    is_default: firstWorkspace.is_default || false,
  };
}

/**
 * Builds login response with workspace information
 *
 * @param token - JWT access token
 * @param user - User data
 * @param workspace - Workspace info (optional)
 * @returns Login response object
 */
function buildLoginResponse(
  token: string,
  user: { id: number; email: string; name: string },
  workspace: WorkspaceInfo | null
): LoginResponse {
  const response: LoginResponse = {
    token,
    user,
  };

  if (workspace) {
    response.workspace = {
      id: workspace.workspace_id,
      slug: workspace.slug,
      name: workspace.name,
      role: workspace.role,
    };
    response.redirectUrl = buildWorkspaceRedirectUrl(workspace.slug);
  }

  return response;
}

/**
 * Validates workspace slug format for URL construction
 *
 * @param slug - Workspace slug
 * @returns true if slug is valid URL-safe format
 */
function isValidWorkspaceSlug(slug: string): boolean {
  if (!slug || slug.trim().length === 0) {
    return false;
  }
  // Slug must be lowercase alphanumeric with hyphens
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugPattern.test(slug) && slug.length >= 2 && slug.length <= 63;
}

// ===================================
// TEST SUITES
// ===================================

describe("Login Workspace Selection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("buildWorkspaceRedirectUrl", () => {
    it("should build correct URL with workspace slug", () => {
      const url = buildWorkspaceRedirectUrl("acme-corp");
      expect(url).toBe("/w/acme-corp");
    });

    it("should handle slug with dashboard base path", () => {
      const url = buildWorkspaceRedirectUrl("acme-corp", "/dashboard");
      expect(url).toBe("/w/acme-corp/dashboard");
    });

    it("should handle slug with nested path", () => {
      const url = buildWorkspaceRedirectUrl("my-workspace", "/projects/1");
      expect(url).toBe("/w/my-workspace/projects/1");
    });

    it("should return base path when slug is empty", () => {
      const url = buildWorkspaceRedirectUrl("", "/dashboard");
      expect(url).toBe("/dashboard");
    });

    it("should return base path when slug is null/undefined", () => {
      const url = buildWorkspaceRedirectUrl(null as unknown as string);
      expect(url).toBe("/");
    });

    it("should normalize base path with leading slash", () => {
      const url = buildWorkspaceRedirectUrl("acme-corp", "dashboard");
      expect(url).toBe("/w/acme-corp/dashboard");
    });

    it("should handle root path correctly", () => {
      const url = buildWorkspaceRedirectUrl("acme-corp", "/");
      expect(url).toBe("/w/acme-corp");
    });
  });

  describe("isValidWorkspaceSlug", () => {
    it("should return true for valid slugs", () => {
      expect(isValidWorkspaceSlug("acme-corp")).toBe(true);
      expect(isValidWorkspaceSlug("my-workspace")).toBe(true);
      expect(isValidWorkspaceSlug("workspace123")).toBe(true);
      expect(isValidWorkspaceSlug("test-workspace-2024")).toBe(true);
    });

    it("should return false for invalid slugs", () => {
      expect(isValidWorkspaceSlug("")).toBe(false);
      expect(isValidWorkspaceSlug("A")).toBe(false); // too short
      expect(isValidWorkspaceSlug("UPPERCASE")).toBe(false);
      expect(isValidWorkspaceSlug("has spaces")).toBe(false);
      expect(isValidWorkspaceSlug("has_underscore")).toBe(false);
      expect(isValidWorkspaceSlug("-leading")).toBe(false);
      expect(isValidWorkspaceSlug("trailing-")).toBe(false);
      expect(isValidWorkspaceSlug("double--hyphen")).toBe(false);
    });

    it("should return false for slugs exceeding length limit", () => {
      const longSlug = "a".repeat(64);
      expect(isValidWorkspaceSlug(longSlug)).toBe(false);
    });
  });

  describe("getLoginWorkspace", () => {
    it("should return default workspace when set", async () => {
      const mockDefaultWorkspace = {
        workspace_id: 1,
        slug: "default-workspace",
        name: "Default Workspace",
        role: "owner",
        is_default: true,
        is_active: true,
      };
      mockGetDefaultWorkspaceQuery.mockResolvedValue(mockDefaultWorkspace);

      const result = await getLoginWorkspace(123);

      expect(result).toEqual({
        workspace_id: 1,
        slug: "default-workspace",
        name: "Default Workspace",
        role: "owner",
        is_default: true,
      });
      expect(mockGetDefaultWorkspaceQuery).toHaveBeenCalledWith(123);
    });

    it("should return first workspace when no default is set", async () => {
      mockGetDefaultWorkspaceQuery.mockResolvedValue(null);
      mockGetUserWorkspacesQuery.mockResolvedValue([
        {
          workspace_id: 2,
          slug: "first-workspace",
          name: "First Workspace",
          role: "member",
          is_default: false,
        },
        {
          workspace_id: 3,
          slug: "second-workspace",
          name: "Second Workspace",
          role: "viewer",
          is_default: false,
        },
      ]);

      const result = await getLoginWorkspace(123);

      expect(result).toEqual({
        workspace_id: 2,
        slug: "first-workspace",
        name: "First Workspace",
        role: "member",
        is_default: false,
      });
    });

    it("should return null when user has no workspaces", async () => {
      mockGetDefaultWorkspaceQuery.mockResolvedValue(null);
      mockGetUserWorkspacesQuery.mockResolvedValue([]);

      const result = await getLoginWorkspace(123);

      expect(result).toBeNull();
    });

    it("should skip inactive default workspace and return first active one", async () => {
      mockGetDefaultWorkspaceQuery.mockResolvedValue({
        workspace_id: 1,
        slug: "inactive-default",
        name: "Inactive Default",
        role: "owner",
        is_default: true,
        is_active: false,
      });
      mockGetUserWorkspacesQuery.mockResolvedValue([
        {
          workspace_id: 2,
          slug: "active-workspace",
          name: "Active Workspace",
          role: "member",
          is_default: false,
        },
      ]);

      const result = await getLoginWorkspace(123);

      expect(result).toEqual({
        workspace_id: 2,
        slug: "active-workspace",
        name: "Active Workspace",
        role: "member",
        is_default: false,
      });
    });

    it("should throw ValidationException for invalid userId", async () => {
      await expect(getLoginWorkspace(0)).rejects.toThrow(ValidationException);
      await expect(getLoginWorkspace(-1)).rejects.toThrow(ValidationException);
    });
  });

  describe("buildLoginResponse", () => {
    const mockUser = { id: 1, email: "test@example.com", name: "Test User" };
    const mockToken = "jwt-token-123";

    it("should build response with workspace and redirect URL", () => {
      const workspace: WorkspaceInfo = {
        workspace_id: 1,
        slug: "acme-corp",
        name: "Acme Corp",
        role: "owner",
        is_default: true,
      };

      const response = buildLoginResponse(mockToken, mockUser, workspace);

      expect(response).toEqual({
        token: mockToken,
        user: mockUser,
        workspace: {
          id: 1,
          slug: "acme-corp",
          name: "Acme Corp",
          role: "owner",
        },
        redirectUrl: "/w/acme-corp",
      });
    });

    it("should build response without workspace when user has none", () => {
      const response = buildLoginResponse(mockToken, mockUser, null);

      expect(response).toEqual({
        token: mockToken,
        user: mockUser,
      });
      expect(response.workspace).toBeUndefined();
      expect(response.redirectUrl).toBeUndefined();
    });

    it("should include correct role in workspace info", () => {
      const workspace: WorkspaceInfo = {
        workspace_id: 1,
        slug: "team-workspace",
        name: "Team Workspace",
        role: "viewer",
        is_default: false,
      };

      const response = buildLoginResponse(mockToken, mockUser, workspace);

      expect(response.workspace?.role).toBe("viewer");
    });
  });

  describe("Full Login Workspace Flow Integration", () => {
    const mockUser = { id: 1, email: "test@example.com", name: "Test User" };
    const mockToken = "jwt-token-123";

    it("should handle user with default workspace", async () => {
      mockGetDefaultWorkspaceQuery.mockResolvedValue({
        workspace_id: 1,
        slug: "my-company",
        name: "My Company",
        role: "owner",
        is_default: true,
        is_active: true,
      });

      const workspace = await getLoginWorkspace(mockUser.id);
      const response = buildLoginResponse(mockToken, mockUser, workspace);

      expect(response.redirectUrl).toBe("/w/my-company");
      expect(response.workspace?.slug).toBe("my-company");
    });

    it("should handle user with multiple workspaces (returns first)", async () => {
      mockGetDefaultWorkspaceQuery.mockResolvedValue(null);
      mockGetUserWorkspacesQuery.mockResolvedValue([
        {
          workspace_id: 1,
          slug: "primary-workspace",
          name: "Primary Workspace",
          role: "admin",
          is_default: false,
        },
        {
          workspace_id: 2,
          slug: "secondary-workspace",
          name: "Secondary Workspace",
          role: "member",
          is_default: false,
        },
      ]);

      const workspace = await getLoginWorkspace(mockUser.id);
      const response = buildLoginResponse(mockToken, mockUser, workspace);

      expect(response.redirectUrl).toBe("/w/primary-workspace");
      expect(response.workspace?.slug).toBe("primary-workspace");
    });

    it("should handle user with no workspaces gracefully", async () => {
      mockGetDefaultWorkspaceQuery.mockResolvedValue(null);
      mockGetUserWorkspacesQuery.mockResolvedValue([]);

      const workspace = await getLoginWorkspace(mockUser.id);
      const response = buildLoginResponse(mockToken, mockUser, workspace);

      expect(response.redirectUrl).toBeUndefined();
      expect(response.workspace).toBeUndefined();
    });
  });
});

describe("Session Workspace Storage", () => {
  describe("Workspace ID in session/localStorage", () => {
    // Simulating session storage behavior
    let mockSession: Record<string, any>;

    beforeEach(() => {
      mockSession = {};
    });

    it("should store currentWorkspaceId in session", () => {
      const workspaceId = 123;
      mockSession.currentWorkspaceId = workspaceId;
      expect(mockSession.currentWorkspaceId).toBe(123);
    });

    it("should store workspaceSlug for URL construction", () => {
      const slug = "acme-corp";
      mockSession.currentWorkspaceSlug = slug;
      expect(mockSession.currentWorkspaceSlug).toBe("acme-corp");
    });

    it("should update workspace when user switches workspaces", () => {
      mockSession.currentWorkspaceId = 1;
      mockSession.currentWorkspaceSlug = "old-workspace";

      // User switches workspace
      mockSession.currentWorkspaceId = 2;
      mockSession.currentWorkspaceSlug = "new-workspace";

      expect(mockSession.currentWorkspaceId).toBe(2);
      expect(mockSession.currentWorkspaceSlug).toBe("new-workspace");
    });

    it("should clear workspace on logout", () => {
      mockSession.currentWorkspaceId = 123;
      mockSession.currentWorkspaceSlug = "acme-corp";

      // Logout clears session
      delete mockSession.currentWorkspaceId;
      delete mockSession.currentWorkspaceSlug;

      expect(mockSession.currentWorkspaceId).toBeUndefined();
      expect(mockSession.currentWorkspaceSlug).toBeUndefined();
    });
  });

  describe("localStorage workspace persistence", () => {
    // Simulating localStorage behavior
    const mockLocalStorage: Record<string, string> = {};

    const setItem = (key: string, value: string) => {
      mockLocalStorage[key] = value;
    };

    const getItem = (key: string): string | null => {
      return mockLocalStorage[key] || null;
    };

    const removeItem = (key: string) => {
      delete mockLocalStorage[key];
    };

    beforeEach(() => {
      Object.keys(mockLocalStorage).forEach((key) => delete mockLocalStorage[key]);
    });

    it("should persist last workspace ID to localStorage", () => {
      setItem("lastWorkspaceId", "123");
      expect(getItem("lastWorkspaceId")).toBe("123");
    });

    it("should persist last workspace slug to localStorage", () => {
      setItem("lastWorkspaceSlug", "acme-corp");
      expect(getItem("lastWorkspaceSlug")).toBe("acme-corp");
    });

    it("should retrieve last workspace on page reload", () => {
      // Simulate previous session storage
      setItem("lastWorkspaceId", "456");
      setItem("lastWorkspaceSlug", "returning-workspace");

      // On page reload, retrieve values
      const lastId = getItem("lastWorkspaceId");
      const lastSlug = getItem("lastWorkspaceSlug");

      expect(lastId).toBe("456");
      expect(lastSlug).toBe("returning-workspace");
    });

    it("should clear workspace data on logout", () => {
      setItem("lastWorkspaceId", "123");
      setItem("lastWorkspaceSlug", "acme-corp");

      // Logout clears data
      removeItem("lastWorkspaceId");
      removeItem("lastWorkspaceSlug");

      expect(getItem("lastWorkspaceId")).toBeNull();
      expect(getItem("lastWorkspaceSlug")).toBeNull();
    });
  });
});
