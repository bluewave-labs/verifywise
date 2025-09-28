import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { SSOStateToken } from '../interfaces/ISSOProvider';
import { SSOError, SSOErrorCode, createSSOError } from './SSOErrors';

const STATE_TOKEN_SECRET = process.env.SSO_STATE_SECRET || process.env.JWT_SECRET;
const STATE_TOKEN_EXPIRY = 10 * 60 * 1000; // 10 minutes

if (!STATE_TOKEN_SECRET) {
  throw new Error('SSO_STATE_SECRET or JWT_SECRET environment variable is required');
}

export class SSOStateTokenManager {
  /**
   * Generate a secure state token for SSO authentication
   */
  static generateStateToken(organizationId: string, providerId: number): string {
    const nonce = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    const expiresAt = timestamp + STATE_TOKEN_EXPIRY;

    const payload: SSOStateToken = {
      organizationId,
      providerId,
      nonce,
      timestamp,
      expiresAt
    };

    return jwt.sign(payload, STATE_TOKEN_SECRET!, {
      algorithm: 'HS256',
      expiresIn: '10m',
      issuer: 'verifywise-sso',
      audience: `org-${organizationId}`
    });
  }

  /**
   * Validate and decode a state token
   */
  static validateStateToken(
    token: string,
    expectedOrganizationId: string,
    expectedProviderId: number
  ): SSOStateToken {
    if (!token) {
      throw createSSOError(SSOErrorCode.INVALID_STATE_TOKEN, {
        reason: 'Missing state token'
      });
    }

    try {
      const decoded = jwt.verify(token, STATE_TOKEN_SECRET!, {
        algorithms: ['HS256'],
        issuer: 'verifywise-sso',
        audience: `org-${expectedOrganizationId}`
      }) as SSOStateToken;

      // Additional validation checks
      if (decoded.organizationId !== expectedOrganizationId) {
        throw createSSOError(SSOErrorCode.INVALID_STATE_TOKEN, {
          reason: 'Organization ID mismatch',
          expected: expectedOrganizationId,
          received: decoded.organizationId
        });
      }

      if (decoded.providerId !== expectedProviderId) {
        throw createSSOError(SSOErrorCode.INVALID_STATE_TOKEN, {
          reason: 'Provider ID mismatch',
          expected: expectedProviderId,
          received: decoded.providerId
        });
      }

      // Check manual expiry (belt and suspenders with JWT exp)
      if (Date.now() > decoded.expiresAt) {
        throw createSSOError(SSOErrorCode.EXPIRED_STATE_TOKEN, {
          expiresAt: new Date(decoded.expiresAt).toISOString(),
          currentTime: new Date().toISOString()
        });
      }

      return decoded;
    } catch (error) {
      if (error instanceof SSOError) {
        throw error;
      }

      if (error instanceof jwt.TokenExpiredError) {
        throw createSSOError(SSOErrorCode.EXPIRED_STATE_TOKEN, {
          expiredAt: error.expiredAt?.toISOString(),
          currentTime: new Date().toISOString()
        });
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw createSSOError(SSOErrorCode.INVALID_STATE_TOKEN, {
          reason: 'Invalid JWT format',
          jwtError: error.message
        });
      }

      throw createSSOError(SSOErrorCode.INVALID_STATE_TOKEN, {
        reason: 'Unknown token validation error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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