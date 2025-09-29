/**
 * @fileoverview SSO State Token Management Utilities
 *
 * This module provides secure state token management for OAuth 2.0 flows, specifically
 * designed to prevent Cross-Site Request Forgery (CSRF) attacks during SSO authentication.
 *
 * Security Features:
 * - Cryptographically secure random nonce generation
 * - JWT-based state tokens with organization-specific audience validation
 * - Separate signing secret from main application JWT secret
 * - Timing-safe comparison to prevent timing attacks
 * - Automatic token expiration (10 minutes)
 * - Organization ID validation for multi-tenant isolation
 *
 * OAuth 2.0 Security:
 * State tokens are a critical security component in OAuth flows. They serve as:
 * - CSRF protection by linking authorization requests with callbacks
 * - Session binding to prevent session fixation attacks
 * - Organization isolation in multi-tenant environments
 *
 * @author VerifyWise Development Team
 * @since 2024-09-28
 * @version 1.0.0
 * @see {@link https://tools.ietf.org/html/rfc6749#section-10.12} OAuth 2.0 CSRF Protection
 */

import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

/** Secret key for signing SSO state tokens (separate from main JWT secret for security) */
const STATE_TOKEN_SECRET = process.env.SSO_STATE_SECRET;

/** State token expiration time in milliseconds (10 minutes) */
const STATE_TOKEN_EXPIRY = 10 * 60 * 1000;

// Critical security check: Ensure state token secret is configured
if (!STATE_TOKEN_SECRET) {
  throw new Error('SSO_STATE_SECRET environment variable is required for SSO functionality. This must be separate from JWT_SECRET for security reasons.');
}

/**
 * State token payload structure for OAuth 2.0 CSRF protection
 *
 * @interface StateTokenPayload
 */
interface StateTokenPayload {
  /** Organization ID for multi-tenant isolation */
  organizationId: string;
  /** Cryptographically secure random nonce for additional entropy */
  nonce: string;
  /** Token creation timestamp for audit purposes */
  timestamp: number;
  /** Token expiration timestamp for manual validation */
  expiresAt: number;
}

/**
 * SSO State Token Manager
 *
 * Provides secure state token generation and validation for OAuth 2.0 flows.
 * State tokens are essential for preventing CSRF attacks during SSO authentication
 * by ensuring that authorization callbacks correspond to legitimate requests.
 *
 * Key Security Features:
 * - JWT-based tokens with HMAC-SHA256 signing
 * - Organization-specific audience validation
 * - Cryptographically secure nonce generation
 * - Timing-safe comparison to prevent timing attacks
 * - Automatic expiration handling
 *
 * @class SSOStateTokenManager
 * @static
 *
 * @example
 * ```typescript
 * // Generate state token for OAuth initiation
 * const stateToken = SSOStateTokenManager.generateStateToken('123');
 *
 * // Validate state token in OAuth callback
 * const payload = SSOStateTokenManager.validateStateToken(stateToken, '123');
 * console.log('Validated nonce:', payload.nonce);
 * ```
 */
export class SSOStateTokenManager {
  /**
   * Generates a secure state token for OAuth 2.0 CSRF protection
   *
   * Creates a JWT-based state token containing organization ID and cryptographic nonce
   * for secure OAuth flow validation. The token is signed with a separate secret and
   * includes audience validation for multi-tenant isolation.
   *
   * @static
   * @param {string} organizationId - Organization identifier for tenant isolation
   * @returns {string} Signed JWT state token for OAuth authorization request
   *
   * @security
   * - Uses cryptographically secure random nonce (256 bits)
   * - JWT signed with HMAC-SHA256 using dedicated secret
   * - Organization-specific audience claim for tenant isolation
   * - Automatic expiration after 10 minutes
   *
   * @example
   * ```typescript
   * const stateToken = SSOStateTokenManager.generateStateToken('123');
   * // Use stateToken in OAuth authorization URL
   * ```
   */
  static generateStateToken(organizationId: string): string {
    // Generate cryptographically secure 256-bit nonce for CSRF protection
    const nonce = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    const expiresAt = timestamp + STATE_TOKEN_EXPIRY;

    // Create token payload with organization and timing information
    const payload: StateTokenPayload = {
      organizationId,                    // For multi-tenant validation
      nonce,                            // Cryptographic entropy
      timestamp,                        // Creation time for audit
      expiresAt                         // Manual expiry check
    };

    // Sign JWT with dedicated SSO secret and organization-specific audience
    return jwt.sign(payload, STATE_TOKEN_SECRET!, {
      algorithm: 'HS256',               // HMAC-SHA256 for symmetric signing
      expiresIn: '10m',                 // 10-minute expiration
      issuer: 'verifywise-sso',         // Token issuer identification
      audience: `org-${organizationId}` // Organization-specific audience
    });
  }

  /**
   * Validates and decodes an OAuth 2.0 state token
   *
   * Performs comprehensive validation of state tokens received in OAuth callbacks,
   * including signature verification, expiration checks, and organization validation
   * to prevent CSRF attacks and ensure proper tenant isolation.
   *
   * @static
   * @param {string} token - JWT state token from OAuth callback
   * @param {string} expectedOrganizationId - Expected organization ID for validation
   * @returns {StateTokenPayload} Decoded and validated token payload
   *
   * @throws {Error} Missing state token
   * @throws {Error} Token expired (automatic JWT validation)
   * @throws {Error} Invalid token signature or format
   * @throws {Error} Organization ID mismatch
   *
   * @security
   * - Verifies JWT signature with dedicated SSO secret
   * - Validates issuer and audience claims
   * - Checks organization ID for tenant isolation
   * - Automatic expiration handling via JWT library
   *
   * @example
   * ```typescript
   * try {
   *   const payload = SSOStateTokenManager.validateStateToken(token, '123');
   *   console.log('Valid token for org:', payload.organizationId);
   * } catch (error) {
   *   console.error('Invalid state token:', error.message);
   * }
   * ```
   */
  static validateStateToken(
    token: string,
    expectedOrganizationId: string
  ): StateTokenPayload {
    if (!token) {
      throw new Error('Missing state token');
    }

    try {
      // Verify JWT signature and validate claims
      const decoded = jwt.verify(token, STATE_TOKEN_SECRET!, {
        algorithms: ['HS256'],                     // Only allow HMAC-SHA256
        issuer: 'verifywise-sso',                  // Verify token issuer
        audience: `org-${expectedOrganizationId}` // Organization-specific audience
      }) as StateTokenPayload;

      // Additional security check: Validate organization ID for tenant isolation
      if (decoded.organizationId !== expectedOrganizationId) {
        throw new Error(`Organization ID mismatch: expected ${expectedOrganizationId}, got ${decoded.organizationId}`);
      }

      // Note: JWT expiry is automatically handled by jwt.verify() above
      // Manual expiry check removed to prevent race conditions between validation and use

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error(`State token expired at ${error.expiredAt?.toISOString()}`);
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error(`Invalid state token: ${error.message}`);
      }

      throw error; // Re-throw if it's already our custom error
    }
  }

  /**
   * Generate a secure nonce for additional CSRF protection
   */
  static generateNonce(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate a nonce matches the expected value
   */
  static validateNonce(received: string, expected: string): boolean {
    if (!received || !expected) {
      return false;
    }

    // Use crypto.timingSafeEqual to prevent timing attacks
    const receivedBuffer = Buffer.from(received, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');

    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
  }
}

export default SSOStateTokenManager;