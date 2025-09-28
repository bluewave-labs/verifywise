/**
 * SSO Environment Validator Tests
 *
 * Tests for environment variable validation logic, security checks,
 * and production readiness validation for SSO configuration.
 */

import { SSOEnvironmentValidator } from '../../utils/sso-env-validator.utils';

describe('SSOEnvironmentValidator', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Clear environment for clean tests
    delete process.env.SSO_STATE_SECRET;
    delete process.env.BACKEND_URL;
    delete process.env.JWT_SECRET;
    delete process.env.REDIS_URL;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_PASSWORD;
    delete process.env.REDIS_DB;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Required Variable Validation', () => {
    it('should fail when required variables are missing', () => {
      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required environment variable: SSO_STATE_SECRET');
      expect(result.errors).toContain('Missing required environment variable: BACKEND_URL');
      expect(result.errors).toContain('Missing required environment variable: JWT_SECRET');
    });

    it('should pass with all required variables set', () => {
      process.env.SSO_STATE_SECRET = 'a'.repeat(64);
      process.env.BACKEND_URL = 'https://api.example.com';
      process.env.JWT_SECRET = 'b'.repeat(64);
      process.env.REDIS_URL = 'redis://localhost:6379';

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Secret Validation', () => {
    beforeEach(() => {
      // Set minimum required vars
      process.env.BACKEND_URL = 'https://api.example.com';
      process.env.REDIS_URL = 'redis://localhost:6379';
    });

    it('should reject short secrets', () => {
      process.env.SSO_STATE_SECRET = 'short';
      process.env.JWT_SECRET = 'alsoshort';

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('SSO_STATE_SECRET must be at least 32 characters long');
      expect(result.errors).toContain('JWT_SECRET must be at least 32 characters long');
    });

    it('should reject weak secrets', () => {
      process.env.SSO_STATE_SECRET = 'secretsecretsecretsecretsecretsecret';
      process.env.JWT_SECRET = 'passwordpasswordpasswordpassword';

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('SSO_STATE_SECRET appears to use a weak or default value');
      expect(result.errors).toContain('JWT_SECRET appears to use a weak or default value');
    });

    it('should reject secrets with low entropy', () => {
      process.env.SSO_STATE_SECRET = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
      process.env.JWT_SECRET = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('SSO_STATE_SECRET may have insufficient entropy (too many repeated characters)');
      expect(result.errors).toContain('JWT_SECRET may have insufficient entropy (too many repeated characters)');
    });

    it('should accept strong secrets', () => {
      process.env.SSO_STATE_SECRET = 'Kj8#mP9$nQ2@vR5*wS1!xT6&yU3%zV0^';
      process.env.JWT_SECRET = 'aB4&cD7#eF2$gH9@iJ5*kL8!mN1%oP6^';

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(true);
    });
  });

  describe('URL Validation', () => {
    beforeEach(() => {
      // Set minimum required vars
      process.env.SSO_STATE_SECRET = 'a'.repeat(64);
      process.env.JWT_SECRET = 'b'.repeat(64);
      process.env.REDIS_URL = 'redis://localhost:6379';
    });

    it('should reject invalid URL format', () => {
      process.env.BACKEND_URL = 'not-a-url';

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('BACKEND_URL is not a valid URL format');
    });

    it('should require HTTPS in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.BACKEND_URL = 'http://api.example.com';

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('BACKEND_URL must use HTTPS in production environment');
    });

    it('should warn about localhost in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.BACKEND_URL = 'https://localhost:3000';

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('BACKEND_URL should not use localhost in production');
    });

    it('should accept valid HTTPS URLs', () => {
      process.env.NODE_ENV = 'production';
      process.env.BACKEND_URL = 'https://api.verifywise.com';

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(true);
    });
  });

  describe('Redis Configuration Validation', () => {
    beforeEach(() => {
      // Set minimum required vars
      process.env.SSO_STATE_SECRET = 'a'.repeat(64);
      process.env.JWT_SECRET = 'b'.repeat(64);
      process.env.BACKEND_URL = 'https://api.example.com';
    });

    it('should require Redis configuration', () => {
      // No Redis configuration provided

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Redis configuration required: Either REDIS_URL/REDIS_CONNECTION_STRING or REDIS_HOST must be provided'
      );
    });

    it('should accept REDIS_URL', () => {
      process.env.REDIS_URL = 'redis://localhost:6379';

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(true);
    });

    it('should accept REDIS_CONNECTION_STRING', () => {
      process.env.REDIS_CONNECTION_STRING = 'redis://user:pass@localhost:6379/0';

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(true);
    });

    it('should accept REDIS_HOST', () => {
      process.env.REDIS_HOST = 'redis.example.com';

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(true);
    });

    it('should validate REDIS_PORT format', () => {
      process.env.REDIS_HOST = 'localhost';
      process.env.REDIS_PORT = 'not-a-number';

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('REDIS_PORT must be a valid port number');
    });

    it('should validate REDIS_DB format', () => {
      process.env.REDIS_HOST = 'localhost';
      process.env.REDIS_DB = 'not-a-number';

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('REDIS_DB must be a valid database number (0-15)');
    });
  });

  describe('Security Validations', () => {
    beforeEach(() => {
      // Set minimum valid vars
      process.env.BACKEND_URL = 'https://api.example.com';
      process.env.REDIS_URL = 'redis://localhost:6379';
    });

    it('should require different secrets for SSO_STATE_SECRET and JWT_SECRET', () => {
      const sameSecret = 'a'.repeat(64);
      process.env.SSO_STATE_SECRET = sameSecret;
      process.env.JWT_SECRET = sameSecret;

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('SSO_STATE_SECRET and JWT_SECRET must be different for security');
    });

    it('should reject localhost URLs in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.SSO_STATE_SECRET = 'a'.repeat(64);
      process.env.JWT_SECRET = 'b'.repeat(64);
      process.env.BACKEND_URL = 'https://localhost:3000';
      process.env.REDIS_URL = 'redis://localhost:6379';

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('BACKEND_URL should not contain localhost in production');
      expect(result.errors).toContain('REDIS_URL should not contain localhost in production');
    });

    it('should accept different valid secrets', () => {
      process.env.SSO_STATE_SECRET = 'Kj8#mP9$nQ2@vR5*wS1!xT6&yU3%zV0^';
      process.env.JWT_SECRET = 'aB4&cD7#eF2$gH9@iJ5*kL8!mN1%oP6^';

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(true);
    });
  });

  describe('Warning Generation', () => {
    beforeEach(() => {
      // Set valid configuration
      process.env.SSO_STATE_SECRET = 'a'.repeat(64);
      process.env.JWT_SECRET = 'b'.repeat(64);
      process.env.BACKEND_URL = 'https://api.example.com';
      process.env.REDIS_URL = 'redis://localhost:6379';
    });

    it('should warn about missing Redis in development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.REDIS_URL; // Remove Redis config

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(false); // Will fail due to missing Redis
      expect(result.warnings).toContain('No Redis configuration found - rate limiting will be disabled');
    });

    it('should warn about missing Redis password in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.REDIS_HOST = 'redis.example.com';
      // No REDIS_PASSWORD set

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.warnings).toContain('REDIS_PASSWORD not set - consider using authentication in production');
    });

    it('should warn about short secrets in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.SSO_STATE_SECRET = 'a'.repeat(32); // Minimum length but shorter than recommended
      process.env.JWT_SECRET = 'b'.repeat(32);

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.warnings).toContain('SSO_STATE_SECRET is shorter than recommended 64 characters for production');
      expect(result.warnings).toContain('JWT_SECRET is shorter than recommended 64 characters for production');
    });
  });

  describe('validateOrThrow method', () => {
    it('should throw error when validation fails', () => {
      // No environment variables set

      expect(() => {
        SSOEnvironmentValidator.validateOrThrow();
      }).toThrow(/SSO Environment Validation Failed/);
    });

    it('should not throw when validation passes', () => {
      process.env.SSO_STATE_SECRET = 'a'.repeat(64);
      process.env.JWT_SECRET = 'b'.repeat(64);
      process.env.BACKEND_URL = 'https://api.example.com';
      process.env.REDIS_URL = 'redis://localhost:6379';

      expect(() => {
        SSOEnvironmentValidator.validateOrThrow();
      }).not.toThrow();
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      // Set valid configuration
      process.env.SSO_STATE_SECRET = 'secret123';
      process.env.JWT_SECRET = 'jwt456';
      process.env.BACKEND_URL = 'https://api.example.com';
      process.env.REDIS_URL = 'redis://user:pass@redis.example.com:6379';
      process.env.NODE_ENV = 'production';
    });

    it('should return masked environment summary', () => {
      const summary = SSOEnvironmentValidator.getEnvironmentSummary();

      expect(summary.NODE_ENV).toBe('production');
      expect(summary.SSO_STATE_SECRET).toMatch(/^\*\*\*t123$/); // Masked with last 4 chars
      expect(summary.JWT_SECRET).toMatch(/^\*\*\*456$/);
      expect(summary.BACKEND_URL).toBe('https://api.example.com/**');
      expect(summary.REDIS_URL).toBe('redis://redis.example.com:6379/**');
    });

    it('should detect Redis configuration', () => {
      expect(SSOEnvironmentValidator.isRedisConfigured()).toBe(true);

      delete process.env.REDIS_URL;
      expect(SSOEnvironmentValidator.isRedisConfigured()).toBe(false);

      process.env.REDIS_HOST = 'localhost';
      expect(SSOEnvironmentValidator.isRedisConfigured()).toBe(true);
    });

    it('should detect production mode', () => {
      expect(SSOEnvironmentValidator.isProduction()).toBe(true);

      process.env.NODE_ENV = 'development';
      expect(SSOEnvironmentValidator.isProduction()).toBe(false);

      delete process.env.NODE_ENV;
      expect(SSOEnvironmentValidator.isProduction()).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string values', () => {
      process.env.SSO_STATE_SECRET = '';
      process.env.JWT_SECRET = '';
      process.env.BACKEND_URL = '';
      process.env.REDIS_URL = '';

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle whitespace-only values', () => {
      process.env.SSO_STATE_SECRET = '   ';
      process.env.JWT_SECRET = '   ';
      process.env.BACKEND_URL = '   ';

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(false);
    });

    it('should handle invalid URL with valid format but bad content', () => {
      process.env.SSO_STATE_SECRET = 'a'.repeat(64);
      process.env.JWT_SECRET = 'b'.repeat(64);
      process.env.BACKEND_URL = 'https://';
      process.env.REDIS_URL = 'redis://localhost:6379';

      const result = SSOEnvironmentValidator.validateEnvironment();

      expect(result.valid).toBe(false);
    });
  });
});