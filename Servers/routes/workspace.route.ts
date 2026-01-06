/**
 * @fileoverview Workspace Routes
 *
 * Defines API routes for workspace management operations including:
 * - Workspace CRUD (Create, Read, Update, Archive)
 * - Membership management (invite, remove, role updates)
 *
 * Route Structure:
 * - GET    /                    - Get all workspaces (Super-Admin)
 * - GET    /org/:orgId          - Get workspaces by organization (Super-Admin)
 * - GET    /slug/:slug          - Get workspace by slug (Authenticated)
 * - GET    /:id                 - Get workspace by ID (Super-Admin)
 * - POST   /                    - Create workspace (Super-Admin)
 * - PUT    /:id                 - Update workspace (Super-Admin)
 * - DELETE /:id                 - Archive workspace (Super-Admin)
 * - GET    /:id/members         - Get workspace members (Workspace Member)
 * - POST   /:id/invite          - Invite user to workspace (Workspace Admin/Owner)
 * - DELETE /:id/users/:userId   - Remove user from workspace (Workspace Admin/Owner)
 * - PUT    /:id/users/:userId/role - Update user role (Workspace Owner)
 *
 * @module routes/workspace
 */

import { Router } from "express";
import authenticateJWT from "../middleware/auth.middleware";
import {
  requireSuperAdmin,
  checkSuperAdmin,
} from "../middleware/superAdmin.middleware";
import {
  getAllWorkspaces,
  getWorkspaceById,
  getWorkspaceBySlug,
  getWorkspacesByOrgId,
  createWorkspace,
  updateWorkspace,
  archiveWorkspace,
  getWorkspaceMembers,
  inviteUserToWorkspace,
  removeUserFromWorkspace,
  updateUserRole,
} from "../controllers/workspace.ctrl";

const workspaceRouter = Router();

// ==========================================
// WORKSPACE CRUD ROUTES
// ==========================================

/**
 * @route GET /api/workspaces
 * @description Get all workspaces (Super-Admin only)
 * @query {boolean} [includeInactive=false] - Include archived workspaces
 * @access Super-Admin
 */
workspaceRouter.get("/", authenticateJWT, requireSuperAdmin, getAllWorkspaces);

/**
 * @route GET /api/workspaces/org/:orgId
 * @description Get all workspaces for an organization (Super-Admin only)
 * @param {number} orgId - Organization ID
 * @query {boolean} [includeInactive=false] - Include archived workspaces
 * @access Super-Admin
 */
workspaceRouter.get(
  "/org/:orgId",
  authenticateJWT,
  requireSuperAdmin,
  getWorkspacesByOrgId
);

/**
 * @route GET /api/workspaces/slug/:slug
 * @description Get workspace by slug (Authenticated users who are members)
 * @param {string} slug - Workspace slug
 * @access Authenticated (membership verified in controller)
 */
workspaceRouter.get(
  "/slug/:slug",
  authenticateJWT,
  checkSuperAdmin,
  getWorkspaceBySlug
);

/**
 * @route GET /api/workspaces/:id
 * @description Get workspace by ID (Super-Admin only)
 * @param {number} id - Workspace ID
 * @access Super-Admin
 */
workspaceRouter.get(
  "/:id",
  authenticateJWT,
  requireSuperAdmin,
  getWorkspaceById
);

/**
 * @route POST /api/workspaces
 * @description Create a new workspace with schema provisioning (Super-Admin only)
 * @body {number} org_id - Organization ID
 * @body {string} name - Workspace name
 * @body {string} slug - URL-friendly workspace identifier
 * @body {number} [owner_id] - User ID to set as owner (defaults to creator)
 * @access Super-Admin
 */
workspaceRouter.post("/", authenticateJWT, requireSuperAdmin, createWorkspace);

/**
 * @route PUT /api/workspaces/:id
 * @description Update workspace information (Super-Admin only)
 * @param {number} id - Workspace ID
 * @body {string} [name] - New workspace name
 * @body {string} [slug] - New workspace slug
 * @body {boolean} [is_active] - Active status
 * @access Super-Admin
 */
workspaceRouter.put(
  "/:id",
  authenticateJWT,
  requireSuperAdmin,
  updateWorkspace
);

/**
 * @route DELETE /api/workspaces/:id
 * @description Archive (soft delete) a workspace (Super-Admin only)
 * @param {number} id - Workspace ID
 * @access Super-Admin
 */
workspaceRouter.delete(
  "/:id",
  authenticateJWT,
  requireSuperAdmin,
  archiveWorkspace
);

// ==========================================
// MEMBERSHIP MANAGEMENT ROUTES
// ==========================================

/**
 * @route GET /api/workspaces/:id/members
 * @description Get all members of a workspace
 * @param {number} id - Workspace ID
 * @access Workspace Member or Super-Admin
 */
workspaceRouter.get(
  "/:id/members",
  authenticateJWT,
  checkSuperAdmin,
  getWorkspaceMembers
);

/**
 * @route POST /api/workspaces/:id/invite
 * @description Invite a user to a workspace
 * @param {number} id - Workspace ID
 * @body {number} user_id - User ID to invite
 * @body {string} [role="member"] - Role to assign (owner, admin, member, viewer)
 * @access Workspace Admin/Owner or Super-Admin
 */
workspaceRouter.post(
  "/:id/invite",
  authenticateJWT,
  checkSuperAdmin,
  inviteUserToWorkspace
);

/**
 * @route DELETE /api/workspaces/:id/users/:userId
 * @description Remove a user from a workspace
 * @param {number} id - Workspace ID
 * @param {number} userId - User ID to remove
 * @access Workspace Admin/Owner or Super-Admin
 */
workspaceRouter.delete(
  "/:id/users/:userId",
  authenticateJWT,
  checkSuperAdmin,
  removeUserFromWorkspace
);

/**
 * @route PUT /api/workspaces/:id/users/:userId/role
 * @description Update a user's role in a workspace
 * @param {number} id - Workspace ID
 * @param {number} userId - User ID to update
 * @body {string} role - New role (owner, admin, member, viewer)
 * @access Workspace Owner or Super-Admin
 */
workspaceRouter.put(
  "/:id/users/:userId/role",
  authenticateJWT,
  checkSuperAdmin,
  updateUserRole
);

export default workspaceRouter;
