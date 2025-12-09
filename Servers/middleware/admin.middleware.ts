/**
 * @fileoverview Admin Authorization Middleware
 *
 * Provides role-based access control for admin-only routes.
 * Must be used AFTER authenticateJWT middleware.
 *
 * ## Usage
 *
 * ```typescript
 * import authenticateJWT from "./auth.middleware";
 * import requireAdmin from "./admin.middleware";
 *
 * // Apply both middlewares - order matters!
 * router.post("/sensitive-action", authenticateJWT, requireAdmin, handler);
 * ```
 *
 * ## Security
 *
 * - Requires `req.role` to be set by authenticateJWT
 * - Only allows users with role "Admin"
 * - Returns 403 Forbidden for non-admin users
 *
 * @module middleware/admin
 */

import { NextFunction, Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";

/**
 * Express middleware that restricts access to admin users only.
 *
 * This middleware must be used after `authenticateJWT` which sets `req.role`.
 * It checks if the authenticated user has the "Admin" role and blocks
 * access for all other roles.
 *
 * @param {Request} req - Express request object (must have req.role set)
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Response|void} Returns 403 error or continues to next middleware
 *
 * @example
 * // Protect an admin-only route
 * router.delete("/users/:id", authenticateJWT, requireAdmin, deleteUser);
 *
 * @example
 * // Protect multiple routes
 * const adminRoutes = ["/config", "/users", "/settings"];
 * adminRoutes.forEach(route => {
 *   router.use(route, authenticateJWT, requireAdmin);
 * });
 */
const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  // Check if role was set by authenticateJWT
  if (!req.role) {
    return res.status(401).json(
      STATUS_CODE[401]({
        message: "Authentication required",
      })
    );
  }

  // Check if user has Admin role
  if (req.role !== "Admin") {
    return res.status(403).json(
      STATUS_CODE[403]({
        message: "Admin access required",
      })
    );
  }

  // User is admin, proceed to next middleware/handler
  next();
};

export default requireAdmin;
