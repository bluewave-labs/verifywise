/**
 * @fileoverview Environment Configuration and Validation
 *
 * Provides centralized, type-safe environment variable management with
 * comprehensive validation and security checks. This module ensures all
 * required configuration is present and secure before application startup.
 *
 * **Security Features:**
 * - Validates all critical secrets are present
 * - Checks for weak/default secrets in production
 * - Enforces minimum security requirements
 * - Provides type-safe access to configuration
 *
 * **Key Benefits:**
 * - Fail-fast validation on startup
 * - Centralized configuration management
 * - Environment-specific validation rules
 * - Security best practices enforcement
 *
 * @created 2025-10-06
 */

import crypto from 'crypto';

/**
 * Environment configuration interface
 */
export interface EnvironmentConfig {
  // Server Configuration
  port: number;
  nodeEnv: 'development' | 'staging' | 'production';
  backendUrl: string;
  frontendUrl: string;
  allowedOrigins: string[];

  // Database Configuration
  database: {
    user: string;
    password: string;
    name: string;
    host: string;
    port: number;
    ssl: boolean;
    rejectUnauthorized: boolean;
  };

  // JWT Configuration
  jwt: {
    secret: string;
    refreshSecret: string;
  };

  // Tenant Security
  tenant: {
    hashSalt: string;
    entropySource: string;
  };

  // SSO Configuration
  sso: {
    stateSecret: string;
    encryptionKey: string;
  };

  // Redis Configuration
  redis: {
    host: string;
    port: number;
    database: number;
    password?: string;
  };

  // Outbox System
  outbox: {
    processingEnabled: boolean;
  };

  // Feature Flags
  features: {
    apiDocsEnabled: boolean;
    debugEnabled: boolean;
  };
}

/**
 * Default/insecure values that should trigger warnings or errors
 */
const INSECURE_DEFAULTS = {
  JWT_SECRET: '0e702ac3f1f3b09db752709a8eed459c89056e4c72be1bb71d4a8994575ab22e',
  REFRESH_TOKEN_SECRET: 'your-refresh-secret-key-here',
  TENANT_HASH_SALT: 'dev_salt_change_in_production_2025',
  TENANT_ENTROPY_SOURCE: 'VERIFYWISE_TENANT_DEV_2025',
  SSO_STATE_SECRET: '33ba95fa25b48d7853dab8707a1781d0c16c3900f4be3a8b704b2bb6bb3655b3',
  SSO_ENCRYPTION_KEY: 'b8c02fa5b6e817bb45630c2aab97abc0'
};

/**
 * Validation errors collection
 */
interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validates a hex string meets minimum entropy requirements
 */
function validateHexSecret(value: string, minLength: number = 32): boolean {
  if (!value || value.length < minLength) return false;
  return /^[a-fA-F0-9]+$/.test(value);
}

/**
 * Checks if a secret appears to be randomly generated
 */
function isSecureSecret(value: string, minEntropy: number = 3.5): boolean {
  if (!value || value.length < 16) return false;

  // Calculate character frequency to estimate entropy
  const charFreq: { [key: string]: number } = {};
  for (const char of value) {
    charFreq[char] = (charFreq[char] || 0) + 1;
  }

  // Shannon entropy calculation
  const length = value.length;
  let entropy = 0;
  for (const freq of Object.values(charFreq)) {
    const probability = freq / length;
    entropy -= probability * Math.log2(probability);
  }

  return entropy >= minEntropy;
}

/**
 * Validates database configuration
 */
function validateDatabase(errors: ValidationError[]): void {
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;
  const dbHost = process.env.DB_HOST;

  if (!dbUser) {
    errors.push({
      field: 'DB_USER',
      message: 'Database user is required',
      severity: 'error'
    });
  }

  if (!dbName) {
    errors.push({
      field: 'DB_NAME',
      message: 'Database name is required',
      severity: 'error'
    });
  }

  if (!dbHost) {
    errors.push({
      field: 'DB_HOST',
      message: 'Database host is required',
      severity: 'error'
    });
  }

  // In production, require a secure database password
  if (process.env.NODE_ENV === 'production') {
    if (!dbPassword || dbPassword.length < 8) {
      errors.push({
        field: 'DB_PASSWORD',
        message: 'Database password must be at least 8 characters in production',
        severity: 'error'
      });
    }
  }
}

/**
 * Validates JWT secrets
 */
function validateJWTSecrets(errors: ValidationError[]): void {
  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET;

  if (!jwtSecret) {
    errors.push({
      field: 'JWT_SECRET',
      message: 'JWT secret is required',
      severity: 'error'
    });
  } else {
    // Check for default/insecure values
    if (jwtSecret === INSECURE_DEFAULTS.JWT_SECRET) {
      const severity = process.env.NODE_ENV === 'production' ? 'error' : 'warning';
      errors.push({
        field: 'JWT_SECRET',
        message: 'Using default JWT secret - change immediately!',
        severity
      });
    }

    // Validate entropy and format
    if (!validateHexSecret(jwtSecret, 32)) {
      errors.push({
        field: 'JWT_SECRET',
        message: 'JWT_SECRET should be a secure hex string (min 32 chars)',
        severity: 'warning'
      });
    }
  }

  if (!refreshSecret) {
    errors.push({
      field: 'REFRESH_TOKEN_SECRET',
      message: 'Refresh token secret is required',
      severity: 'error'
    });
  } else if (refreshSecret === INSECURE_DEFAULTS.REFRESH_TOKEN_SECRET) {
    const severity = process.env.NODE_ENV === 'production' ? 'error' : 'warning';
    errors.push({
      field: 'REFRESH_TOKEN_SECRET',
      message: 'Using default refresh token secret - change immediately!',
      severity
    });
  }
}

/**
 * Validates tenant security configuration
 */
function validateTenantSecurity(errors: ValidationError[]): void {
  const tenantSalt = process.env.TENANT_HASH_SALT;
  const entropySource = process.env.TENANT_ENTROPY_SOURCE;

  if (!tenantSalt) {
    errors.push({
      field: 'TENANT_HASH_SALT',
      message: 'Tenant hash salt is required',
      severity: 'error'
    });
  } else if (tenantSalt === INSECURE_DEFAULTS.TENANT_HASH_SALT) {
    const severity = process.env.NODE_ENV === 'production' ? 'error' : 'warning';
    errors.push({
      field: 'TENANT_HASH_SALT',
      message: 'Using default tenant salt - change for production!',
      severity
    });
  }

  if (!entropySource) {
    errors.push({
      field: 'TENANT_ENTROPY_SOURCE',
      message: 'Tenant entropy source is required',
      severity: 'error'
    });
  } else if (entropySource === INSECURE_DEFAULTS.TENANT_ENTROPY_SOURCE) {
    const severity = process.env.NODE_ENV === 'production' ? 'error' : 'warning';
    errors.push({
      field: 'TENANT_ENTROPY_SOURCE',
      message: 'Using default entropy source - change for production!',
      severity
    });
  }
}

/**
 * Validates SSO configuration
 */
function validateSSOConfiguration(errors: ValidationError[]): void {
  const ssoSecret = process.env.SSO_STATE_SECRET;
  const ssoKey = process.env.SSO_ENCRYPTION_KEY;

  if (!ssoSecret) {
    errors.push({
      field: 'SSO_STATE_SECRET',
      message: 'SSO state secret is required',
      severity: 'error'
    });
  } else if (ssoSecret === INSECURE_DEFAULTS.SSO_STATE_SECRET) {
    const severity = process.env.NODE_ENV === 'production' ? 'error' : 'warning';
    errors.push({
      field: 'SSO_STATE_SECRET',
      message: 'Using default SSO state secret - change immediately!',
      severity
    });
  }

  if (!ssoKey) {
    errors.push({
      field: 'SSO_ENCRYPTION_KEY',
      message: 'SSO encryption key is required',
      severity: 'error'
    });
  } else if (ssoKey === INSECURE_DEFAULTS.SSO_ENCRYPTION_KEY) {
    const severity = process.env.NODE_ENV === 'production' ? 'error' : 'warning';
    errors.push({
      field: 'SSO_ENCRYPTION_KEY',
      message: 'Using default SSO encryption key - change immediately!',
      severity
    });
  }
}

/**
 * Parses and validates ALLOWED_ORIGINS
 */
function parseAllowedOrigins(): string[] {
  const origins = process.env.ALLOWED_ORIGINS;
  if (!origins) return ['http://localhost:5173']; // Development default

  try {
    const parsed = JSON.parse(origins);
    if (!Array.isArray(parsed)) {
      throw new Error('ALLOWED_ORIGINS must be a JSON array');
    }
    return parsed.filter(origin => typeof origin === 'string');
  } catch (error) {
    console.warn('⚠️  Invalid ALLOWED_ORIGINS format, using development defaults:', error);
    return ['http://localhost:5173'];
  }
}

/**
 * Main configuration loader and validator
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  const errors: ValidationError[] = [];

  // Core validation
  validateDatabase(errors);
  validateJWTSecrets(errors);
  validateTenantSecurity(errors);
  validateSSOConfiguration(errors);

  // Handle validation errors
  const criticalErrors = errors.filter(e => e.severity === 'error');
  const warnings = errors.filter(e => e.severity === 'warning');

  if (warnings.length > 0) {
    console.warn('⚠️  Environment Configuration Warnings:');
    warnings.forEach(warning => {
      console.warn(`   ${warning.field}: ${warning.message}`);
    });
  }

  if (criticalErrors.length > 0) {
    console.error('❌ Critical Environment Configuration Errors:');
    criticalErrors.forEach(error => {
      console.error(`   ${error.field}: ${error.message}`);
    });
    console.error('\n💡 Quick Fix Commands:');
    console.error('   Generate JWT secret: openssl rand -hex 32');
    console.error('   Generate salt: openssl rand -base64 32');
    console.error('   See .env.example for complete template');
    throw new Error(`Environment validation failed with ${criticalErrors.length} critical errors`);
  }

  // Build configuration object
  const config: EnvironmentConfig = {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: (process.env.NODE_ENV as any) || 'development',
    backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    allowedOrigins: parseAllowedOrigins(),

    database: {
      user: process.env.DB_USER!,
      password: process.env.DB_PASSWORD || '',
      name: process.env.DB_NAME!,
      host: process.env.DB_HOST!,
      port: parseInt(process.env.DB_PORT || '5432'),
      ssl: process.env.DB_SSL === 'true',
      rejectUnauthorized: process.env.REJECT_UNAUTHORIZED !== 'false'
    },

    jwt: {
      secret: process.env.JWT_SECRET!,
      refreshSecret: process.env.REFRESH_TOKEN_SECRET!
    },

    tenant: {
      hashSalt: process.env.TENANT_HASH_SALT!,
      entropySource: process.env.TENANT_ENTROPY_SOURCE!
    },

    sso: {
      stateSecret: process.env.SSO_STATE_SECRET!,
      encryptionKey: process.env.SSO_ENCRYPTION_KEY!
    },

    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      database: parseInt(process.env.REDIS_DB || '0'),
      password: process.env.REDIS_PASSWORD
    },

    outbox: {
      processingEnabled: process.env.ENABLE_OUTBOX_PROCESSING === 'true'
    },

    features: {
      apiDocsEnabled: process.env.ENABLE_API_DOCS === 'true',
      debugEnabled: process.env.DEBUG !== undefined
    }
  };

  // Success message
  console.log('✅ Environment configuration loaded successfully');
  if (config.nodeEnv === 'development') {
    console.log('🔧 Running in development mode');
  } else {
    console.log(`🚀 Running in ${config.nodeEnv} mode`);
  }

  return config;
}

/**
 * Generate secure random secrets (utility for deployment)
 */
export function generateSecrets(): {
  jwtSecret: string;
  refreshSecret: string;
  tenantSalt: string;
  ssoSecret: string;
  ssoKey: string;
} {
  return {
    jwtSecret: crypto.randomBytes(32).toString('hex'),
    refreshSecret: crypto.randomBytes(32).toString('hex'),
    tenantSalt: crypto.randomBytes(32).toString('base64'),
    ssoSecret: crypto.randomBytes(32).toString('hex'),
    ssoKey: crypto.randomBytes(16).toString('hex')
  };
}

// Export singleton instance
export const environmentConfig = loadEnvironmentConfig();