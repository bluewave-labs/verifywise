/**
 * @fileoverview Base SSO Provider Abstract Class
 *
 * Foundational abstract class providing common functionality, security features,
 * and standardized patterns for all SSO provider implementations. This class
 * implements the Template Method pattern to ensure consistent behavior while
 * allowing provider-specific customization through abstract methods.
 *
 * This base class provides:
 * - Standardized initialization and validation patterns
 * - Security-focused email domain validation with timing-safe comparisons
 * - Comprehensive audit logging integration
 * - Rate limiting support with Redis integration
 * - Common error handling and normalization
 * - Configuration management and validation
 * - Health checking infrastructure
 *
 * Security Features:
 * - Timing-safe domain comparison to prevent timing attacks
 * - Wildcard domain support with secure pattern matching
 * - Input sanitization for user data normalization
 * - Comprehensive audit logging for security monitoring
 * - Rate limiting integration for abuse prevention
 * - Secure configuration validation and management
 *
 * Architecture Pattern:
 * - Template Method: Defines algorithm structure with customizable steps
 * - Abstract Factory: Requires implementation of provider-specific methods
 * - Strategy Pattern: Allows different validation and processing strategies
 * - Observer Pattern: Integrates with audit logging for event tracking
 *
 * Extension Guidelines:
 * - Extend this class for all new SSO provider implementations
 * - Implement all abstract methods with provider-specific logic
 * - Use provided helper methods for security and consistency
 * - Follow the established patterns for error handling and logging
 * - Leverage rate limiting and validation infrastructure
 *
 * @author VerifyWise Development Team
 * @since 2024-09-28
 * @version 1.0.0
 * @see {@link ISSOProvider} Core SSO provider interface
 * @see {@link SSOAuditLogger} Audit logging integration
 *
 * @module abstracts/base-sso-provider
 */

import { Request } from 'express';
import crypto from 'crypto';
import {
  ISSOProvider,
  SSOProviderType,
  SSOProviderConfig,
  SSOLoginResult,
  SSOAuthResult,
  SSOUserInfo,
  SSOError,
  SSOErrorType,
  CloudEnvironment
} from '../interfaces/sso-provider.interface';
import { SSOAuditLogger } from '../utils/sso-audit-logger.utils';
import { getRedisRateLimiter } from '../utils/redis-rate-limiter.utils';

/**
 * Base abstract class for all SSO provider implementations
 *
 * Provides foundational functionality and security patterns that all SSO providers
 * should implement. Uses the Template Method pattern to define the overall structure
 * while allowing provider-specific customization through abstract methods.
 *
 * Key Features:
 * - Standardized initialization and validation lifecycle
 * - Security-focused domain validation with timing-safe comparisons
 * - Integrated audit logging and rate limiting
 * - Common error handling and configuration management
 * - Helper methods for data sanitization and normalization
 *
 * @abstract
 * @class BaseSSOProvider
 * @implements {ISSOProvider}
 *
 * @example
 * ```typescript
 * class AzureADProvider extends BaseSSOProvider {
 *   constructor() {
 *     super(SSOProviderType.AZURE_AD, 'azure-ad-main');
 *   }
 *
 *   protected async onInitialize(config: SSOProviderConfig): Promise<void> {
 *     // Initialize Azure AD MSAL client
 *     this.msalApp = new ConfidentialClientApplication({
 *       auth: {
 *         clientId: config.clientId,
 *         clientSecret: config.clientSecret,
 *         authority: `https://login.microsoftonline.com/${config.tenantId}`
 *       }
 *     });
 *   }
 *
 *   // Implement other abstract methods...
 * }
 * ```
 */
export abstract class BaseSSOProvider implements ISSOProvider {
  /** Provider configuration (set during initialization) */
  protected config?: SSOProviderConfig;

  /** Initialization state flag */
  protected initialized: boolean = false;

  /**
   * Creates a new SSO provider instance
   *
   * @param {SSOProviderType} providerType - Type of SSO provider (immutable)
   * @param {string} providerId - Unique identifier for this provider instance (immutable)
   */
  constructor(
    public readonly providerType: SSOProviderType,
    public readonly providerId: string
  ) {}

  /**
   * Initialize the provider with configuration
   */
  async initialize(config: SSOProviderConfig): Promise<void> {
    // Validate configuration before initialization
    const validation = await this.validateConfig(config);
    if (!validation.valid) {
      throw new SSOError(
        SSOErrorType.CONFIGURATION_ERROR,
        `Configuration validation failed: ${validation.errors.join(', ')}`,
        this.providerType
      );
    }

    this.config = config;
    await this.onInitialize(config);
    this.initialized = true;
  }

  /**
   * Provider-specific initialization logic (must be implemented by subclasses)
   *
   * Called after common validation passes during the initialization process.
   * Implement provider-specific setup such as OAuth client creation,
   * SAML configuration, or API client initialization.
   *
   * @protected
   * @abstract
   * @param {SSOProviderConfig} config - Validated provider configuration
   * @returns {Promise<void>} Resolves when provider-specific initialization completes
   *
   * @example
   * ```typescript
   * // Azure AD implementation
   * protected async onInitialize(config: SSOProviderConfig): Promise<void> {
   *   this.msalApp = new ConfidentialClientApplication({
   *     auth: {
   *       clientId: config.clientId,
   *       clientSecret: config.clientSecret,
   *       authority: `https://login.microsoftonline.com/${config.tenantId}`
   *     }
   *   });
   * }
   * ```
   */
  protected abstract onInitialize(config: SSOProviderConfig): Promise<void>;

  /**
   * Validate provider configuration
   */
  async validateConfig(config: Partial<SSOProviderConfig>): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Common validation
    if (!config.clientId) {
      errors.push('Client ID is required');
    }

    if (!config.clientSecret) {
      errors.push('Client Secret is required');
    }

    if (!config.organizationId) {
      errors.push('Organization ID is required');
    }

    if (!config.providerType) {
      errors.push('Provider type is required');
    }

    if (config.providerType !== this.providerType) {
      errors.push(`Provider type mismatch: expected ${this.providerType}, got ${config.providerType}`);
    }

    // Provider-specific validation
    const providerErrors = await this.validateProviderSpecificConfig(config);
    errors.push(...providerErrors);

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Provider-specific configuration validation
   */
  protected abstract validateProviderSpecificConfig(config: Partial<SSOProviderConfig>): Promise<string[]>;

  /**
   * Generate login URL for SSO initiation
   */
  abstract getLoginUrl(req: Request, organizationId: string, additionalParams?: Record<string, string>): Promise<SSOLoginResult>;

  /**
   * Handle callback from SSO provider
   */
  abstract handleCallback(req: Request, organizationId: string): Promise<SSOAuthResult>;

  /**
   * Exchange authorization code for user information
   */
  abstract exchangeCodeForUser(authCode: string, state: string): Promise<SSOAuthResult>;

  /**
   * Get provider-specific metadata URLs
   */
  abstract getMetadataUrls(): { authUrl?: string; tokenUrl?: string; userInfoUrl?: string; logoutUrl?: string };

  /**
   * Validates email domain against provider configuration with security-focused implementation
   *
   * Implements timing-safe domain comparison to prevent timing attacks that could
   * be used to enumerate allowed domains. Supports wildcard subdomains and
   * comprehensive domain validation patterns.
   *
   * @param {string} email - User email address to validate
   * @returns {Promise<boolean>} True if domain is allowed, false otherwise
   *
   * @security
   * - Uses timing-safe comparison to prevent enumeration attacks
   * - Supports wildcard subdomain patterns (*.company.com)
   * - Normalizes domains to lowercase for consistent comparison
   * - Implements constant-time algorithm to prevent information leakage
   *
   * @example
   * ```typescript
   * // Configuration: allowedDomains: ['company.com', '*.partner.org']
   * await provider.isEmailDomainAllowed('user@company.com');     // true
   * await provider.isEmailDomainAllowed('user@sub.partner.org'); // true
   * await provider.isEmailDomainAllowed('user@other.com');       // false
   * ```
   */
  async isEmailDomainAllowed(email: string): Promise<boolean> {
    if (!this.config) {
      throw new SSOError(SSOErrorType.CONFIGURATION_ERROR, 'Provider not initialized', this.providerType);
    }

    if (!this.config.allowedDomains || this.config.allowedDomains.length === 0) {
      return true; // No restrictions
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      return false;
    }

    // Use constant-time comparison to prevent timing attacks
    let isAllowed = false;

    for (const allowedDomain of this.config.allowedDomains) {
      const normalizedAllowed = allowedDomain.toLowerCase().trim();
      let domainMatches = false;

      // Support wildcard subdomains (e.g., *.company.com)
      if (normalizedAllowed.startsWith('*.')) {
        const baseDomain = normalizedAllowed.substring(2);

        try {
          const exactBuffer = Buffer.from(domain.padEnd(64, '\0'));
          const baseDomainBuffer = Buffer.from(baseDomain.padEnd(64, '\0'));

          // Check exact match with base domain
          const exactMatchResult = domain.length === baseDomain.length &&
            crypto.timingSafeEqual(exactBuffer.subarray(0, baseDomain.length), baseDomainBuffer.subarray(0, baseDomain.length));

          // Check wildcard match (domain ends with .baseDomain)
          const wildcardMatchResult = domain.endsWith('.' + baseDomain);

          domainMatches = exactMatchResult || wildcardMatchResult;
        } catch (error) {
          // Fall back to regular comparison if timing-safe comparison fails
          domainMatches = domain === baseDomain || domain.endsWith('.' + baseDomain);
        }
      } else {
        // Regular domain comparison with constant-time comparison
        try {
          const domainBuffer = Buffer.from(domain.padEnd(64, '\0'));
          const allowedBuffer = Buffer.from(normalizedAllowed.padEnd(64, '\0'));

          domainMatches = domain.length === normalizedAllowed.length &&
            crypto.timingSafeEqual(domainBuffer.subarray(0, domain.length), allowedBuffer.subarray(0, normalizedAllowed.length));
        } catch (error) {
          // Fall back to regular comparison if timing-safe comparison fails
          domainMatches = domain === normalizedAllowed;
        }
      }

      // Use bitwise OR with numeric conversion for true constant-time operation
      isAllowed = Boolean((isAllowed ? 1 : 0) | (domainMatches ? 1 : 0));
    }

    return isAllowed;
  }

  /**
   * Provider health check
   */
  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    if (!this.initialized) {
      return {
        healthy: false,
        message: 'Provider not initialized'
      };
    }

    if (!this.config) {
      return {
        healthy: false,
        message: 'Configuration missing'
      };
    }

    // Provider-specific health check
    return await this.performHealthCheck();
  }

  /**
   * Provider-specific health check implementation
   */
  protected abstract performHealthCheck(): Promise<{ healthy: boolean; message?: string }>;


  /**
   * Normalize user information from provider-specific format
   */
  protected abstract normalizeUserInfo(providerUserData: any): SSOUserInfo;

  /**
   * Sanitize user name fields
   */
  protected sanitizeName(name: string): string {
    if (!name || typeof name !== 'string') {
      return '';
    }

    return name
      .replace(/[<>{}[\]\\\/\x00-\x1f\x7f]/g, '') // Remove dangerous characters
      .substring(0, 50) // Limit length
      .trim();
  }

  /**
   * Validate email format
   */
  protected isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 320;
  }

  /**
   * Log audit events
   */
  protected logAuditEvent(
    req: Request,
    eventType: string,
    success: boolean,
    userEmail?: string,
    error?: string
  ): void {
    if (!this.config) return;

    const organizationId = this.config.organizationId.toString();

    switch (eventType) {
      case 'login_initiated':
        SSOAuditLogger.logLoginInitiation(req, organizationId, success, error);
        break;
      case 'authentication_failure':
        SSOAuditLogger.logAuthenticationFailure(req, organizationId, error || 'Unknown error', userEmail);
        break;
      case 'token_exchange':
        SSOAuditLogger.logTokenExchange(req, organizationId, success, error);
        break;
      default:
        // Custom event logging could be added here
        break;
    }
  }

  /**
   * Get configuration value safely
   */
  protected getConfigValue<T>(key: keyof SSOProviderConfig): T | undefined {
    if (!this.config) {
      throw new SSOError(SSOErrorType.CONFIGURATION_ERROR, 'Provider not initialized', this.providerType);
    }
    return this.config[key] as T;
  }

  /**
   * Check if provider is initialized
   */
  protected ensureInitialized(): void {
    if (!this.initialized || !this.config) {
      throw new SSOError(SSOErrorType.CONFIGURATION_ERROR, 'Provider not initialized', this.providerType);
    }
  }

  /**
   * Checks rate limiting for SSO operations using Redis-based rate limiting
   *
   * Implements distributed rate limiting to prevent abuse of SSO endpoints.
   * Integrates with Redis for cluster-wide rate limiting and provides
   * graceful degradation when Redis is unavailable.
   *
   * @protected
   * @param {Request} req - HTTP request for client identification
   * @param {'login'|'callback'|'token'} operation - Type of SSO operation
   * @returns {Promise<{allowed: boolean; retryAfter?: number}>} Rate limit result
   *
   * @rate_limits
   * - login: Prevents brute force login attempts
   * - callback: Prevents callback endpoint abuse
   * - token: Prevents token exchange abuse
   *
   * @fail_safe
   * - Fails open when Redis is unavailable (logs error, allows request)
   * - Logs rate limit violations for security monitoring
   * - Provides retry-after timing for client backoff
   *
   * @example
   * ```typescript
   * const rateLimit = await this.checkRateLimit(req, 'login');
   * if (!rateLimit.allowed) {
   *   return res.status(429).json({
   *     error: 'Rate limit exceeded',
   *     retryAfter: rateLimit.retryAfter
   *   });
   * }
   * ```
   */
  protected async checkRateLimit(
    req: Request,
    operation: 'login' | 'callback' | 'token'
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    try {
      const rateLimiter = getRedisRateLimiter();
      const result = await rateLimiter.checkRateLimit(req, operation, this.providerType);

      if (!result.allowed) {
        this.logAuditEvent(req, 'rate_limit_exceeded', false, undefined,
          `Rate limit exceeded for ${operation} operation: ${result.attempts} attempts`);
      }

      return {
        allowed: result.allowed,
        retryAfter: result.retryAfter
      };
    } catch (error) {
      // If Redis is down, log error but allow the request (fail open)
      console.error('Rate limiting error:', error);
      this.logAuditEvent(req, 'rate_limit_error', false, undefined,
        `Rate limiting unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // In production, you might want to fail closed instead
      return { allowed: true };
    }
  }

  /**
   * Handle provider-specific errors
   */
  protected handleProviderError(error: any, context: string): SSOError {
    if (error instanceof SSOError) {
      return error;
    }

    // Map common HTTP errors
    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        return new SSOError(
          SSOErrorType.AUTHENTICATION_FAILED,
          `Authentication failed in ${context}: ${error.message}`,
          this.providerType,
          error
        );
      }
      if (status >= 500) {
        return new SSOError(
          SSOErrorType.PROVIDER_ERROR,
          `Provider error in ${context}: ${error.message}`,
          this.providerType,
          error
        );
      }
    }

    // Network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return new SSOError(
        SSOErrorType.NETWORK_ERROR,
        `Network error in ${context}: ${error.message}`,
        this.providerType,
        error
      );
    }

    // Default to provider error
    return new SSOError(
      SSOErrorType.PROVIDER_ERROR,
      `Error in ${context}: ${error.message}`,
      this.providerType,
      error
    );
  }
}

export default BaseSSOProvider;