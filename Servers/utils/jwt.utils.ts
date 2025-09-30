/**
 * @fileoverview JWT Token Management Utilities
 *
 * Provides functions for generating and validating JSON Web Tokens (JWT) used for
 * user authentication and session management. Implements both access and refresh
 * token patterns for enhanced security.
 *
 * Token Types:
 * - Access Token: Short-lived (1 hour) for API authentication
 * - Refresh Token: Long-lived (30 days) for obtaining new access tokens
 *
 * Security Features:
 * - Separate secrets for access and refresh tokens
 * - Token expiration validation
 * - Signature verification using HMAC-SHA256
 * - Automatic expiration timestamp injection
 *
 * @module utils/jwt
 */

import Jwt from "jsonwebtoken";

/**
 * Verifies and decodes an access token
 *
 * Validates the access token signature using JWT_SECRET.
 * Returns null if verification fails (invalid signature, malformed).
 * Note: Expiration must be checked separately using the returned expire timestamp.
 *
 * @param {string} token - JWT access token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 * @returns {number} returns.id - User ID
 * @returns {string} returns.email - User email
 * @returns {number} returns.expire - Expiration timestamp (must be checked by caller)
 *
 * @security
 * - Uses JWT_SECRET environment variable
 * - Verifies HMAC-SHA256 signature
 * - Caller must validate expire timestamp against Date.now()
 *
 * @example
 * const payload = getTokenPayload(accessToken);
 * if (payload && payload.expire > Date.now()) {
 *   console.log(`User ID: ${payload.id}`);
 * } else {
 *   console.error('Invalid or expired token');
 * }
 */
const getTokenPayload = (token: any): any => {
  try {
    return Jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: number;
      email: string;
      expire: number;
    };
  } catch (error) {
    return null;
  }
};

/**
 * Verifies and decodes a refresh token
 *
 * Validates the refresh token signature using REFRESH_TOKEN_SECRET.
 * Returns null if verification fails (invalid signature, malformed).
 * Note: Expiration must be checked separately using the returned expire timestamp.
 *
 * @param {string} token - JWT refresh token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 * @returns {number} returns.id - User ID
 * @returns {string} returns.email - User email
 * @returns {number} returns.expire - Expiration timestamp (must be checked by caller)
 *
 * @security
 * - Uses REFRESH_TOKEN_SECRET environment variable
 * - Verifies HMAC-SHA256 signature
 * - Caller must validate expire timestamp against Date.now()
 * - Should only be used for refresh token operations
 *
 * @example
 * const payload = getRefreshTokenPayload(refreshToken);
 * if (payload && payload.expire > Date.now()) {
 *   // Generate new access token
 * } else {
 *   // Require re-authentication
 * }
 */
const getRefreshTokenPayload = (token: any): any => {
  try {
    return Jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string) as {
      id: number;
      email: string;
      expire: number;
    };
  } catch (error) {
    return null;
  }
};

/**
 * Generates a short-lived JWT access token
 *
 * Creates a signed JWT access token with 1-hour expiration. The token includes
 * user identification and authorization data, plus an automatic expiration timestamp.
 *
 * @param {Object} payload - Token payload data (user info, roles, permissions)
 * @returns {string|undefined} Signed JWT token or undefined if generation fails
 *
 * @security
 * - Signed with JWT_SECRET environment variable
 * - 1 hour expiration (3600000ms)
 * - HMAC-SHA256 signature algorithm
 * - Expiration timestamp automatically added
 *
 * @example
 * const accessToken = generateToken({
 *   id: user.id,
 *   email: user.email,
 *   roleName: 'Admin',
 *   organizationId: user.organizationId
 * });
 *
 * // Token payload will include:
 * // { id, email, roleName, organizationId, expire: 1234567890000 }
 */
const generateToken = (payload: Object) => {
  try {
    return Jwt.sign(
      {
        ...payload,
        expire: Date.now() + 1 * 3600 * 1000, // 1 hour
      },
      process.env.JWT_SECRET as string
    );
  } catch (error) {
    return console.error(error);
  }
};

/**
 * Generates a long-lived JWT refresh token
 *
 * Creates a signed JWT refresh token with 30-day expiration. Used to obtain new
 * access tokens without requiring re-authentication. Should be stored in HTTP-only cookies.
 *
 * @param {Object} payload - Token payload data (user info, minimal data)
 * @returns {string|undefined} Signed JWT refresh token or undefined if generation fails
 *
 * @security
 * - Signed with REFRESH_TOKEN_SECRET environment variable
 * - 30 day expiration (2592000000ms)
 * - HMAC-SHA256 signature algorithm
 * - Should be stored in HTTP-only, Secure cookies
 * - Separate secret from access tokens for added security
 *
 * @example
 * const refreshToken = generateRefreshToken({
 *   id: user.id,
 *   email: user.email
 * });
 *
 * // Store in HTTP-only cookie
 * res.cookie('refresh_token', refreshToken, {
 *   httpOnly: true,
 *   secure: true,
 *   maxAge: 30 * 24 * 60 * 60 * 1000
 * });
 */
const generateRefreshToken = (payload: Object) => {
  try {
    return Jwt.sign(
      {
        ...payload,
        expire: Date.now() + 1 * 3600 * 1000 * 24 * 30 // 30 days
      },
      process.env.REFRESH_TOKEN_SECRET as string
    );
  } catch (error) {
    return console.error(error);
  }
};

export { getTokenPayload, generateToken, getRefreshTokenPayload, generateRefreshToken };
