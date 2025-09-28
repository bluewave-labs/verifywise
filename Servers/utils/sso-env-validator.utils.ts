/**
 * SSO Environment Variable Validator
 *
 * Validates all required environment variables for SSO functionality
 * at application startup. Provides clear error messages and security
 * checks for sensitive configuration values.
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface EnvironmentConfig {
  // Core SSO configuration
  SSO_STATE_SECRET?: string;
  BACKEND_URL?: string;

  // Redis configuration for rate limiting
  REDIS_URL?: string;
  REDIS_CONNECTION_STRING?: string;
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  REDIS_PASSWORD?: string;
  REDIS_DB?: string;

  // JWT configuration
  JWT_SECRET?: string;

  // Environment type
  NODE_ENV?: string;
}

export class SSOEnvironmentValidator {
  private static readonly REQUIRED_VARS = [
    'SSO_STATE_SECRET',
    'BACKEND_URL',
    'JWT_SECRET'
  ];

  private static readonly CONDITIONAL_VARS = {
    // If no REDIS_URL, then REDIS_HOST is required
    REDIS_CONDITIONAL: ['REDIS_URL', 'REDIS_CONNECTION_STRING', 'REDIS_HOST']
  };

  private static readonly SECRET_VARS = [
    'SSO_STATE_SECRET',
    'JWT_SECRET',
    'REDIS_PASSWORD'
  ];

  /**
   * Validate all SSO-related environment variables
   */
  static validateEnvironment(): ValidationResult {
    const env = process.env as EnvironmentConfig;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required variables
    for (const varName of this.REQUIRED_VARS) {
      const value = env[varName as keyof EnvironmentConfig];

      if (!value) {
        errors.push(`Missing required environment variable: ${varName}`);
        continue;
      }

      // Validate specific variables
      const validationError = this.validateSpecificVariable(varName, value);
      if (validationError) {
        errors.push(validationError);
      }
    }

    // Check conditional variables (Redis configuration)
    const hasRedisUrl = env.REDIS_URL || env.REDIS_CONNECTION_STRING;
    const hasRedisHost = env.REDIS_HOST;

    if (!hasRedisUrl && !hasRedisHost) {
      errors.push(
        'Redis configuration required: Either REDIS_URL/REDIS_CONNECTION_STRING or REDIS_HOST must be provided'
      );
    }

    // Validate Redis configuration if provided
    if (hasRedisHost) {
      const redisPort = env.REDIS_PORT;
      if (redisPort && !/^\d+$/.test(redisPort)) {
        errors.push('REDIS_PORT must be a valid port number');
      }

      const redisDb = env.REDIS_DB;
      if (redisDb && !/^\d+$/.test(redisDb)) {
        errors.push('REDIS_DB must be a valid database number (0-15)');
      }
    }

    // Security validations
    const securityErrors = this.validateSecurity(env);
    errors.push(...securityErrors);

    // Environment-specific warnings
    const envWarnings = this.generateWarnings(env);
    warnings.push(...envWarnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate specific environment variables
   */
  private static validateSpecificVariable(name: string, value: string): string | null {
    switch (name) {
      case 'SSO_STATE_SECRET':
        return this.validateSecret(name, value, 32);

      case 'JWT_SECRET':
        return this.validateSecret(name, value, 32);

      case 'BACKEND_URL':
        return this.validateUrl(name, value);

      default:
        return null;
    }
  }

  /**
   * Validate secret values (length, complexity, etc.)
   */
  private static validateSecret(name: string, value: string, minLength: number): string | null {
    if (value.length < minLength) {
      return `${name} must be at least ${minLength} characters long`;
    }

    // Check for common weak secrets
    const weakSecrets = [
      'secret',
      'password',
      'changeme',
      'default',
      '123456',
      'qwerty',
      value.toLowerCase() === name.toLowerCase()
    ];

    if (weakSecrets.some(weak => value.toLowerCase().includes(weak as string))) {
      return `${name} appears to use a weak or default value`;
    }

    // Check for sufficient entropy (basic check)
    const uniqueChars = new Set(value).size;
    if (uniqueChars < Math.min(16, value.length * 0.5)) {
      return `${name} may have insufficient entropy (too many repeated characters)`;
    }

    return null;
  }

  /**
   * Validate URL format and security
   */
  private static validateUrl(name: string, value: string): string | null {
    try {
      const url = new URL(value);

      // Ensure HTTPS in production
      if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
        return `${name} must use HTTPS in production environment`;
      }

      // Check for suspicious URLs
      if (url.hostname === 'localhost' && process.env.NODE_ENV === 'production') {
        return `${name} should not use localhost in production`;
      }

      // Validate port if specified
      if (url.port && !/^\d+$/.test(url.port)) {
        return `${name} contains invalid port number`;
      }

      return null;
    } catch (error) {
      return `${name} is not a valid URL format`;
    }
  }

  /**
   * Security-focused validations
   */
  private static validateSecurity(env: EnvironmentConfig): string[] {
    const errors: string[] = [];

    // Ensure SSO_STATE_SECRET is different from JWT_SECRET
    if (env.SSO_STATE_SECRET && env.JWT_SECRET) {
      if (env.SSO_STATE_SECRET === env.JWT_SECRET) {
        errors.push('SSO_STATE_SECRET and JWT_SECRET must be different for security');
      }
    }

    // Check for hardcoded localhost URLs in production
    if (env.NODE_ENV === 'production') {
      const urlVars = ['BACKEND_URL', 'REDIS_URL'];

      for (const varName of urlVars) {
        const value = env[varName as keyof EnvironmentConfig];
        if (value && value.includes('localhost')) {
          errors.push(`${varName} should not contain localhost in production`);
        }
      }
    }

    return errors;
  }

  /**
   * Generate environment-specific warnings
   */
  private static generateWarnings(env: EnvironmentConfig): string[] {
    const warnings: string[] = [];

    // Development environment warnings
    if (env.NODE_ENV === 'development') {
      if (!env.REDIS_URL && !env.REDIS_HOST) {
        warnings.push('No Redis configuration found - rate limiting will be disabled');
      }
    }

    // Production environment warnings
    if (env.NODE_ENV === 'production') {
      if (!env.REDIS_PASSWORD) {
        warnings.push('REDIS_PASSWORD not set - consider using authentication in production');
      }

      // Check for weak secret lengths in production
      for (const secretVar of this.SECRET_VARS) {
        const value = env[secretVar as keyof EnvironmentConfig];
        if (value && value.length < 64) {
          warnings.push(`${secretVar} is shorter than recommended 64 characters for production`);
        }
      }
    }

    return warnings;
  }

  /**
   * Validate environment and throw error if invalid
   */
  static validateOrThrow(): void {
    const result = this.validateEnvironment();

    if (!result.valid) {
      const errorMessage = [
        'SSO Environment Validation Failed:',
        '',
        'Errors:',
        ...result.errors.map(error => `  - ${error}`),
        '',
        'Please fix these environment variable issues before starting the application.'
      ].join('\n');

      throw new Error(errorMessage);
    }

    // Log warnings if any
    if (result.warnings.length > 0) {
      console.warn('SSO Environment Warnings:');
      result.warnings.forEach(warning => {
        console.warn(`  - ${warning}`);
      });
      console.warn('');
    }

    console.log('✅ SSO environment validation passed');
  }

  /**
   * Get masked environment summary for logging
   */
  static getEnvironmentSummary(): Record<string, string> {
    const env = process.env as EnvironmentConfig;
    const summary: Record<string, string> = {};

    // Show non-sensitive variables
    const safeVars = ['NODE_ENV', 'REDIS_HOST', 'REDIS_PORT', 'REDIS_DB'];

    for (const varName of safeVars) {
      const value = env[varName as keyof EnvironmentConfig];
      if (value) {
        summary[varName] = value;
      }
    }

    // Show masked sensitive variables
    for (const secretVar of this.SECRET_VARS) {
      const value = env[secretVar as keyof EnvironmentConfig];
      if (value) {
        summary[secretVar] = `***${value.slice(-4)}`; // Show last 4 characters
      }
    }

    // Show masked URLs
    const urlVars = ['BACKEND_URL', 'REDIS_URL'];
    for (const urlVar of urlVars) {
      const value = env[urlVar as keyof EnvironmentConfig];
      if (value) {
        try {
          const url = new URL(value);
          summary[urlVar] = `${url.protocol}//${url.hostname}${url.port ? ':' + url.port : ''}/**`;
        } catch {
          summary[urlVar] = 'Invalid URL';
        }
      }
    }

    return summary;
  }

  /**
   * Check if Redis is properly configured
   */
  static isRedisConfigured(): boolean {
    const env = process.env as EnvironmentConfig;
    return !!(env.REDIS_URL || env.REDIS_CONNECTION_STRING || env.REDIS_HOST);
  }

  /**
   * Check if running in production mode
   */
  static isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }
}

export default SSOEnvironmentValidator;