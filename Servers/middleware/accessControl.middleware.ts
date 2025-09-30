/**
 * @fileoverview Access Control Middleware
 *
 * Provides role-based access control (RBAC) middleware for protecting routes
 * based on user roles. Works in conjunction with authentication middleware to
 * enforce granular access permissions.
 *
 * Key Features:
 * - Role-based route protection
 * - Multiple role support per route
 * - Integration with JWT authentication
 * - Clear error responses for unauthorized access
 *
 * Usage Flow:
 * 1. Authentication middleware populates req.user with JWT payload
 * 2. Access control middleware checks user's role against allowed roles
 * 3. Grants or denies access based on role match
 *
 * Standard Roles:
 * - Admin: Full system access
 * - Reviewer: Review and approval permissions
 * - Editor: Content editing permissions
 * - Auditor: Read-only audit access
 *
 * @module middleware/accessControl
 */

import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
    user: {
        id: number;
        email: string;
        roleName: string;
        // Add any other fields your JWT contains
    };
}

/**
 * Creates role-based access control middleware
 *
 * Returns middleware function that validates user's role against allowed roles list.
 * Must be used after authentication middleware that populates req.user.
 *
 * @param {string[]} allowedRoles - Array of role names authorized to access the route
 * @returns {Function} Express middleware function for role validation
 *
 * @security
 * - Requires authentication middleware to run first
 * - Validates role from authenticated user context
 * - Returns 401 if user not authenticated
 * - Returns 403 if user role not in allowed list
 *
 * @example
 * // Allow only Admin role
 * router.delete('/users/:id', authenticateJWT, authorize(['Admin']), deleteUser);
 *
 * @example
 * // Allow multiple roles
 * router.patch('/data/:id', authenticateJWT, authorize(['Admin', 'Editor']), updateData);
 *
 * @example
 * // Protect sensitive operations
 * router.get('/audit-logs', authenticateJWT, authorize(['Admin', 'Auditor']), getAuditLogs);
 */
const authorize = (allowedRoles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Check if user exists first
    if (!req.user) {
        console.error('Authorization failed: No user found in request');
        return res.status(401).json({ message: "Authentication required" });
    }
    const roleName = req.user?.roleName; // Extract role from authenticated user

    if (!roleName || !allowedRoles.includes(roleName)) {
        return res.status(403).json({ message: "Access denied" });
    }

    next(); // Proceed if role is authorized
};

export default authorize;