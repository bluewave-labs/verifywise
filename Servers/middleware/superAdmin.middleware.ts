/**
 * @fileoverview Super Admin Authorization Middleware
 *
 * Provides authorization middleware to restrict access to super-admin users only.
 * Must be used after authenticateJWT middleware to ensure user is authenticated first.
 *
 * Super admins have platform-wide administrative privileges including:
 * - Managing all workspaces across organizations
 * - Managing workspace memberships
 * - Bypassing workspace-level access controls
 *
 * @module middleware/superAdmin
 */

import { NextFunction, Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { getUserByIdQuery } from "../utils/user.utils";

/**
 * Express middleware for super-admin authorization
 *
 * Validates that the authenticated user has super-admin privileges.
 * Must be used AFTER authenticateJWT middleware in the middleware chain.
 *
 * @async
 * @param {Request} req - Express request object (must have userId from authenticateJWT)
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void|Response>} Continues to next middleware or returns error response
 *
 * @security
 * - Requires prior authentication (userId must be present)
 * - Fetches fresh user data from database (no cached/stale super-admin status)
 * - Returns 403 Forbidden for non-super-admin users
 *
 * @example
 * // Protect a route for super-admins only
 * router.get('/workspaces', authenticateJWT, requireSuperAdmin, getAllWorkspaces);
 *
 * @example
 * // Chain with other middleware
 * router.post('/workspaces',
 *   authenticateJWT,
 *   requireSuperAdmin,
 *   validateWorkspaceInput,
 *   createWorkspace
 * );
 */
export const requireSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    // Ensure authenticateJWT middleware has run first
    if (!req.userId) {
      return res.status(401).json(
        STATUS_CODE[401]({
          message: "Authentication required",
        })
      );
    }

    // Fetch fresh user data from database to get current super-admin status
    const user = await getUserByIdQuery(req.userId);

    if (!user) {
      return res.status(404).json(
        STATUS_CODE[404]({
          message: "User not found",
        })
      );
    }

    // Check super-admin flag
    if (!user.is_super_admin) {
      return res.status(403).json(
        STATUS_CODE[403]({
          message: "Access denied. Super admin privileges required.",
        })
      );
    }

    // Attach super-admin status to request for downstream handlers
    req.isSuperAdmin = true;

    next();
  } catch (error) {
    return res.status(500).json(
      STATUS_CODE[500]({
        message: "Error verifying super admin status",
        error: (error as Error).message,
      })
    );
  }
};

/**
 * Express middleware that allows access if user is super-admin OR meets another condition
 *
 * Useful for routes where super-admins have elevated access but other users
 * may still have conditional access based on workspace membership, etc.
 *
 * @async
 * @param {Request} req - Express request object
 * @param {Response} _res - Express response object (unused, for Express middleware signature)
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void|Response>} Continues to next middleware or returns error response
 *
 * @example
 * // Allow super-admins to see all workspaces, but regular users only see their own
 * router.get('/workspaces', authenticateJWT, checkSuperAdmin, getWorkspacesHandler);
 * // In getWorkspacesHandler: if (req.isSuperAdmin) { return all } else { return user's workspaces }
 */
export const checkSuperAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void | Response> => {
  try {
    // Default to false
    req.isSuperAdmin = false;

    // If not authenticated, continue without super-admin status
    if (!req.userId) {
      return next();
    }

    // Fetch user to check super-admin status
    const user = await getUserByIdQuery(req.userId);

    if (user && user.is_super_admin) {
      req.isSuperAdmin = true;
    }

    next();
  } catch (error) {
    // On error, continue without super-admin status rather than blocking
    req.isSuperAdmin = false;
    next();
  }
};

export default requireSuperAdmin;
