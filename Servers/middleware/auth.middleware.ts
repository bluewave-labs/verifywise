/**
 * @fileoverview JWT Authentication Middleware
 *
 * Provides comprehensive JWT token validation and user authentication for protected routes.
 * Implements multi-layered security checks including token verification, expiration validation,
 * role validation, and multi-tenant organization isolation.
 *
 * Security Layers:
 * 1. Token presence validation
 * 2. JWT signature verification
 * 3. Token expiration check
 * 4. Payload structure validation
 * 5. Organization membership verification
 * 6. Role consistency validation
 * 7. Tenant hash validation for multi-tenancy
 *
 * Features:
 * - Bearer token extraction from Authorization header
 * - Comprehensive token payload validation
 * - Multi-tenant organization isolation
 * - Role-based access control integration
 * - AsyncLocalStorage context propagation
 * - Detailed error responses for debugging
 *
 * @module middleware/auth
 */

import { NextFunction, Request, Response } from "express";
import { getTokenPayload } from "../utils/jwt.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { getTenantHash } from "../tools/getTenantHash";
import { doesUserBelongsToOrganizationQuery, getUserByIdQuery } from "../utils/user.utils";
import { asyncLocalStorage } from '../utils/context/context';

/**
 * Role ID to role name mapping for validation
 *
 * Maps database role IDs to their corresponding role names.
 * Used to validate that token role matches current user role in database.
 *
 * @constant
 */
const roleMap = new Map([
  [1, "Admin"],
  [2, "Reviewer"],
  [3, "Editor"],
  [4, "Auditor"],
])

/**
 * Express middleware for JWT authentication and authorization
 *
 * Validates JWT tokens and enforces multi-tenant organization isolation.
 * Attaches user information to request object for downstream route handlers.
 *
 * @async
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 * @returns {Promise<void|Response>} Continues to next middleware or returns error response
 *
 * @security
 * - Validates JWT signature using secret key
 * - Checks token expiration timestamp
 * - Verifies user belongs to claimed organization
 * - Validates role hasn't changed since token issuance
 * - Verifies tenant hash for multi-tenancy security
 * - Prevents token reuse across organizations
 *
 * @validation_flow
 * 1. Extract Bearer token from Authorization header
 * 2. Verify JWT signature and decode payload
 * 3. Check token expiration
 * 4. Validate payload structure (id, roleName)
 * 5. Verify organization membership in database
 * 6. Validate role consistency with current user role
 * 7. Verify tenant hash matches organization
 * 8. Attach user context to request
 * 9. Initialize AsyncLocalStorage for request tracing
 *
 * @example
 * // Protect a route with authentication
 * app.get('/api/protected', authenticateJWT, (req, res) => {
 *   console.log(`User ${req.userId} from org ${req.organizationId}`);
 *   // req.userId, req.role, req.tenantId, req.organizationId available
 * });
 *
 * @example
 * // Make authenticated request
 * fetch('/api/protected', {
 *   headers: {
 *     'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *   }
 * });
 */
const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void | Response> => {
  // Extract Bearer token from Authorization header
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(400).json(
      STATUS_CODE[400]({
        message: "Token not found",
      })
    );
  }

  try {
    // Verify JWT signature and decode payload
    const decoded = getTokenPayload(token);

    if (!decoded)
      return res.status(401).json(
        STATUS_CODE[401]({
          message: "Unauthorized **",
        })
      );

    // Check token expiration
    if (decoded.expire < Date.now())
      return res
        .status(406)
        .json(STATUS_CODE[406]({ message: "Token expired" }));

    // Validate payload structure
    if (
      !decoded.id ||
      typeof decoded.id !== 'number' ||
      decoded.id <= 0 ||
      !decoded.roleName ||
      typeof decoded.roleName !== 'string'
    ) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // Verify user belongs to the organization claimed in token
    const belongs = await doesUserBelongsToOrganizationQuery(decoded.id, decoded.organizationId);
    if (!belongs.belongs) {
      return res.status(403).json({ message: 'User does not belong to this organization' });
    }

    // Validate role hasn't changed since token was issued
    const user = await getUserByIdQuery(decoded.id)
    if (decoded.roleName !== roleMap.get(user.role_id)) {
      return res.status(403).json({ message: 'Not allowed to access' });
    }

    // Verify tenant hash for multi-tenancy security
    if (decoded.tenantId !== getTenantHash(decoded.organizationId)) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    // Attach user context to request for downstream handlers
    req.userId = decoded.id;
    req.role = decoded.roleName;
    req.tenantId = decoded.tenantId;
    req.organizationId = decoded.organizationId;

    // Initialize AsyncLocalStorage context with tenant information
    asyncLocalStorage.run({
      userId: decoded.id,
      tenantId: decoded.tenantId,
      organizationId: decoded.organizationId
    }, () => {
      next();
    });
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
};

export default authenticateJWT;
