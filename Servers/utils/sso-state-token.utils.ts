import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

const STATE_TOKEN_SECRET = process.env.SSO_STATE_SECRET;
const STATE_TOKEN_EXPIRY = 10 * 60 * 1000; // 10 minutes

if (!STATE_TOKEN_SECRET) {
  throw new Error('SSO_STATE_SECRET environment variable is required for SSO functionality. This must be separate from JWT_SECRET for security reasons.');
}

interface StateTokenPayload {
  organizationId: string;
  nonce: string;
  timestamp: number;
  expiresAt: number;
}

export class SSOStateTokenManager {
  /**
   * Generate a secure state token for SSO authentication
   */
  static generateStateToken(organizationId: string): string {
    const nonce = crypto.randomBytes(32).toString('hex');
    const timestamp = Date.now();
    const expiresAt = timestamp + STATE_TOKEN_EXPIRY;

    const payload: StateTokenPayload = {
      organizationId,
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
    expectedOrganizationId: string
  ): StateTokenPayload {
    if (!token) {
      throw new Error('Missing state token');
    }

    try {
      const decoded = jwt.verify(token, STATE_TOKEN_SECRET!, {
        algorithms: ['HS256'],
        issuer: 'verifywise-sso',
        audience: `org-${expectedOrganizationId}`
      }) as StateTokenPayload;

      // Additional validation checks
      if (decoded.organizationId !== expectedOrganizationId) {
        throw new Error(`Organization ID mismatch: expected ${expectedOrganizationId}, got ${decoded.organizationId}`);
      }

      // Note: JWT expiry is automatically handled by jwt.verify() above
      // Manual expiry check removed to prevent race conditions

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