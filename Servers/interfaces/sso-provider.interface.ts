/**
 * @fileoverview SSO Provider Interface Definitions
 *
 * Comprehensive interface definitions for implementing multiple SSO providers
 * in a unified, extensible architecture. Provides standardized contracts for
 * Azure AD, Google, SAML, OIDC, and other authentication providers while
 * maintaining provider-specific flexibility and security requirements.
 *
 * This interface system enables:
 * - Unified API across different SSO providers
 * - Type-safe provider implementations
 * - Standardized error handling and result structures
 * - Extensible configuration for new providers
 * - Multi-tenant provider management
 * - Provider-agnostic business logic
 *
 * Architecture Pattern:
 * - ISSOProvider: Core interface for individual provider implementations
 * - ISSOProviderFactory: Factory pattern for provider instantiation
 * - ISSOManager: High-level orchestration of multiple providers
 * - Standardized data structures for interoperability
 * - Comprehensive error handling with typed error categories
 *
 * Security Features:
 * - Encrypted configuration storage
 * - Domain-based access control
 * - CSRF protection with state tokens
 * - PKCE support for OAuth 2.1 compliance
 * - Comprehensive audit logging integration
 *
 * Usage Patterns:
 * - Plugin-based provider architecture
 * - Factory pattern for provider creation
 * - Manager pattern for multi-provider orchestration
 * - Event-driven audit logging
 * - Configuration validation and testing
 *
 * @author VerifyWise Development Team
 * @since 2024-09-28
 * @version 1.0.0
 * @see {@link https://tools.ietf.org/html/rfc6749} OAuth 2.0 Authorization Framework
 * @see {@link https://openid.net/connect/} OpenID Connect Specification
 * @see {@link https://docs.oasis-open.org/security/saml/} SAML 2.0 Specification
 *
 * @module interfaces/sso-provider
 */

import { Request, Response } from 'express';

/**
 * Supported SSO provider types for multi-provider authentication
 *
 * Enumeration of officially supported SSO providers in the system.
 * Each provider type corresponds to a specific authentication protocol
 * and implementation with provider-specific configuration requirements.
 *
 * @enum {string} SSOProviderType
 * @readonly
 *
 * @example
 * ```typescript
 * // Check provider type in configuration
 * if (config.providerType === SSOProviderType.AZURE_AD) {
 *   // Azure AD specific handling
 *   validateAzureADConfig(config);
 * }
 * ```
 */
export enum SSOProviderType {
  /** Microsoft Azure Active Directory (Entra ID) - OAuth 2.0/OpenID Connect */
  AZURE_AD = 'azure_ad',

  /** Google Workspace/Identity - OAuth 2.0/OpenID Connect */
  GOOGLE = 'google',

  /** Security Assertion Markup Language 2.0 */
  SAML = 'saml',

  /** Okta Identity Platform - OIDC/SAML */
  OKTA = 'okta',

  /** Ping Identity Platform - OIDC/SAML */
  PING_IDENTITY = 'ping_identity'
}

/**
 * Cloud environment types for different providers
 */
export enum CloudEnvironment {
  // Azure environments
  AZURE_PUBLIC = 'azure_public',
  AZURE_GOVERNMENT = 'azure_government',

  // Google environments
  GOOGLE_PUBLIC = 'google_public',

  // Generic environments
  PUBLIC = 'public',
  GOVERNMENT = 'government',
  PRIVATE = 'private'
}

/**
 * Standardized user information returned from all SSO providers
 *
 * Normalized user data structure that abstracts provider-specific user information
 * into a consistent format for application use. Ensures compatibility across
 * different SSO providers while preserving provider-specific details.
 *
 * @interface SSOUserInfo
 * @property {string} email - User's primary email address (normalized to lowercase)
 * @property {string} firstName - User's first/given name
 * @property {string} lastName - User's last/family name
 * @property {string} [displayName] - User's preferred display name
 * @property {string} providerId - Unique identifier from provider (Azure Object ID, Google ID, etc.)
 * @property {SSOProviderType} providerType - Source provider type for correlation
 * @property {string[]} [groups] - User groups/roles from provider for authorization
 * @property {Record<string, any>} [additionalClaims] - Provider-specific claims and attributes
 *
 * @example
 * ```typescript
 * const userInfo: SSOUserInfo = {
 *   email: 'john.doe@company.com',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   displayName: 'John Doe',
 *   providerId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
 *   providerType: SSOProviderType.AZURE_AD,
 *   groups: ['Developers', 'Admin'],
 *   additionalClaims: {
 *     department: 'Engineering',
 *     jobTitle: 'Senior Developer'
 *   }
 * };
 * ```
 */
export interface SSOUserInfo {
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  providerId: string; // Unique ID from the provider (Azure Object ID, Google ID, etc.)
  providerType: SSOProviderType;
  groups?: string[]; // User groups/roles from provider
  additionalClaims?: Record<string, any>; // Provider-specific claims
}

/**
 * SSO provider configuration interface
 */
export interface SSOProviderConfig {
  providerId: string; // Unique identifier for this provider instance
  providerType: SSOProviderType;
  organizationId: number;
  isEnabled: boolean;
  cloudEnvironment: CloudEnvironment;

  // Provider-specific configuration (encrypted)
  clientId: string;
  clientSecret: string;

  // Optional provider-specific fields
  tenantId?: string; // Azure AD
  domain?: string; // Google Workspace, SAML
  metadataUrl?: string; // SAML
  issuer?: string; // SAML, OIDC

  // Security settings
  allowedDomains?: string[];
  defaultRoleId?: number;

  // Provider-specific settings
  scopes?: string[];
  customParameters?: Record<string, string>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Authentication result from provider
 */
export interface SSOAuthResult {
  success: boolean;
  userInfo?: SSOUserInfo;
  error?: string;
  errorCode?: string;
  redirectUrl?: string; // For multi-step flows
  additionalData?: Record<string, any>;
}

/**
 * Login initiation result
 */
export interface SSOLoginResult {
  success: boolean;
  authUrl?: string;
  error?: string;
  state?: string; // CSRF protection token
  codeVerifier?: string; // PKCE for OAuth 2.1
}

/**
 * Core SSO provider interface that all SSO providers must implement
 *
 * Defines the standardized contract for all SSO provider implementations,
 * ensuring consistent behavior across different authentication providers
 * while maintaining flexibility for provider-specific features.
 *
 * This interface enables:
 * - Unified authentication flow across providers
 * - Type-safe provider implementations
 * - Consistent error handling and validation
 * - Provider-agnostic business logic
 * - Extensible configuration and features
 *
 * @interface ISSOProvider
 *
 * @example
 * ```typescript
 * class AzureADProvider implements ISSOProvider {
 *   readonly providerType = SSOProviderType.AZURE_AD;
 *   readonly providerId = 'azure-ad-main';
 *
 *   async initialize(config: SSOProviderConfig): Promise<void> {
 *     // Initialize Azure AD MSAL client
 *   }
 *
 *   async getLoginUrl(req: Request, orgId: string): Promise<SSOLoginResult> {
 *     // Generate Azure AD authorization URL
 *   }
 *   // ... implement other methods
 * }
 * ```
 */
export interface ISSOProvider {
  /**
   * Provider type identification (immutable)
   *
   * Identifies the specific SSO provider type this implementation handles.
   * Used for provider routing and type-specific logic.
   */
  readonly providerType: SSOProviderType;

  /**
   * Unique provider instance identifier (immutable)
   *
   * Distinguishes between multiple instances of the same provider type
   * within an organization (e.g., multiple Azure AD tenants).
   */
  readonly providerId: string;

  /**
   * Initializes the provider with organization-specific configuration
   *
   * Sets up the provider instance with encrypted configuration data,
   * validates settings, and prepares the provider for authentication operations.
   * Must be called before any other provider methods.
   *
   * @param {SSOProviderConfig} config - Complete provider configuration
   * @throws {SSOError} If configuration is invalid or initialization fails
   * @returns {Promise<void>} Resolves when initialization is complete
   */
  initialize(config: SSOProviderConfig): Promise<void>;

  /**
   * Validates provider configuration without initializing
   *
   * Performs comprehensive validation of provider configuration including
   * format validation, security checks, and connectivity testing.
   * Used for configuration validation in admin interfaces.
   *
   * @param {Partial<SSOProviderConfig>} config - Configuration to validate
   * @returns {Promise<{valid: boolean; errors: string[]}>} Validation result with detailed errors
   */
  validateConfig(config: Partial<SSOProviderConfig>): Promise<{ valid: boolean; errors: string[] }>;

  /**
   * Generates provider-specific login URL for SSO initiation
   *
   * Creates the authorization URL that redirects users to the SSO provider
   * for authentication. Includes CSRF protection and provider-specific parameters.
   *
   * @param {Request} req - HTTP request for metadata extraction
   * @param {string} organizationId - Organization identifier for multi-tenancy
   * @param {Record<string, string>} [additionalParams] - Provider-specific parameters
   * @returns {Promise<SSOLoginResult>} Login URL and security tokens
   */
  getLoginUrl(req: Request, organizationId: string, additionalParams?: Record<string, string>): Promise<SSOLoginResult>;

  /**
   * Handles callback from SSO provider after user authentication
   *
   * Processes the OAuth callback with authorization code or SAML response,
   * validates state tokens, exchanges codes for user information, and
   * returns standardized authentication result.
   *
   * @param {Request} req - HTTP request containing callback parameters
   * @param {string} organizationId - Organization identifier for validation
   * @returns {Promise<SSOAuthResult>} Authentication result with user information
   */
  handleCallback(req: Request, organizationId: string): Promise<SSOAuthResult>;

  /**
   * Exchanges authorization code for user information
   *
   * Performs the OAuth token exchange process, validating the authorization
   * code and state token, then retrieving user profile information from
   * the provider's user info endpoint.
   *
   * @param {string} authCode - Authorization code from provider callback
   * @param {string} state - State token for CSRF validation
   * @returns {Promise<SSOAuthResult>} User information and authentication status
   */
  exchangeCodeForUser(authCode: string, state: string): Promise<SSOAuthResult>;

  /**
   * Validates if user's email domain is allowed by provider configuration
   *
   * Checks the user's email domain against the organization's allowed domains
   * configuration to enforce domain-based access control policies.
   *
   * @param {string} email - User email address to validate
   * @returns {Promise<boolean>} True if domain is allowed, false otherwise
   */
  isEmailDomainAllowed(email: string): Promise<boolean>;

  /**
   * Returns provider-specific metadata URLs for external reference
   *
   * Provides the provider's well-known endpoints for debugging, monitoring,
   * and integration purposes. URLs vary by provider type and configuration.
   *
   * @returns {Object} Provider metadata URLs
   * @returns {string} [returns.authUrl] - Authorization endpoint URL
   * @returns {string} [returns.tokenUrl] - Token exchange endpoint URL
   * @returns {string} [returns.userInfoUrl] - User information endpoint URL
   * @returns {string} [returns.logoutUrl] - Logout endpoint URL
   */
  getMetadataUrls(): { authUrl?: string; tokenUrl?: string; userInfoUrl?: string; logoutUrl?: string };

  /**
   * Handles provider-specific logout process (optional)
   *
   * Initiates logout with the SSO provider, potentially redirecting to
   * provider logout page for complete session termination.
   *
   * @param {Request} req - HTTP request for metadata extraction
   * @param {string} organizationId - Organization identifier
   * @returns {Promise<{success: boolean; logoutUrl?: string}>} Logout result with optional redirect URL
   */
  handleLogout?(req: Request, organizationId: string): Promise<{ success: boolean; logoutUrl?: string }>;

  /**
   * Validates provider-specific tokens (optional)
   *
   * Validates access tokens or ID tokens for token refresh scenarios
   * or direct token validation without full authentication flow.
   *
   * @param {string} token - Provider token to validate
   * @returns {Promise<{valid: boolean; userInfo?: SSOUserInfo}>} Validation result with user info
   */
  validateToken?(token: string): Promise<{ valid: boolean; userInfo?: SSOUserInfo }>;

  /**
   * Retrieves user groups/roles from provider (optional)
   *
   * Fetches user's group memberships or role assignments from the provider
   * for authorization and role-based access control.
   *
   * @param {string} userId - Provider-specific user identifier
   * @returns {Promise<string[]>} Array of group/role names
   */
  getUserGroups?(userId: string): Promise<string[]>;

  /**
   * Performs provider health check and connectivity test
   *
   * Validates provider connectivity, configuration health, and service
   * availability for monitoring and diagnostics purposes.
   *
   * @returns {Promise<{healthy: boolean; message?: string}>} Health status with optional details
   */
  healthCheck(): Promise<{ healthy: boolean; message?: string }>;
}

/**
 * Provider factory interface for creating provider instances
 */
export interface ISSOProviderFactory {
  /**
   * Create a provider instance
   */
  createProvider(config: SSOProviderConfig): Promise<ISSOProvider>;

  /**
   * Get supported provider types
   */
  getSupportedProviders(): SSOProviderType[];

  /**
   * Validate provider type support
   */
  isProviderSupported(providerType: SSOProviderType): boolean;
}

/**
 * SSO manager interface for orchestrating multiple providers
 */
export interface ISSOManager {
  /**
   * Register a new SSO provider for an organization
   */
  registerProvider(config: SSOProviderConfig): Promise<{ success: boolean; error?: string }>;

  /**
   * Get provider for organization
   */
  getProvider(organizationId: number, providerType?: SSOProviderType): Promise<ISSOProvider | null>;

  /**
   * Get all providers for organization
   */
  getProviders(organizationId: number): Promise<ISSOProvider[]>;

  /**
   * Update provider configuration
   */
  updateProvider(organizationId: number, providerId: string, config: Partial<SSOProviderConfig>): Promise<{ success: boolean; error?: string }>;

  /**
   * Remove provider
   */
  removeProvider(organizationId: number, providerId: string): Promise<{ success: boolean; error?: string }>;

  /**
   * Get login URL for primary provider
   */
  getLoginUrl(req: Request, organizationId: number, providerType?: SSOProviderType): Promise<SSOLoginResult>;

  /**
   * Handle callback from any provider
   */
  handleCallback(req: Request, organizationId: number, providerType: SSOProviderType): Promise<SSOAuthResult>;

  /**
   * Check if SSO is enabled for organization
   */
  isSSOEnabled(organizationId: number): Promise<boolean>;
}

/**
 * Error types for SSO operations
 */
export enum SSOErrorType {
  CONFIGURATION_ERROR = 'configuration_error',
  AUTHENTICATION_FAILED = 'authentication_failed',
  INVALID_TOKEN = 'invalid_token',
  INVALID_STATE = 'invalid_state',
  DOMAIN_NOT_ALLOWED = 'domain_not_allowed',
  PROVIDER_ERROR = 'provider_error',
  NETWORK_ERROR = 'network_error',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded'
}

/**
 * Custom SSO error class
 */
export class SSOError extends Error {
  constructor(
    public readonly errorType: SSOErrorType,
    public readonly message: string,
    public readonly providerType?: SSOProviderType,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'SSOError';
  }
}

/**
 * SSO event types for audit logging
 */
export enum SSOEventType {
  LOGIN_INITIATED = 'login_initiated',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  CALLBACK_PROCESSED = 'callback_processed',
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  CONFIGURATION_UPDATED = 'configuration_updated',
  PROVIDER_ENABLED = 'provider_enabled',
  PROVIDER_DISABLED = 'provider_disabled',
  DOMAIN_VALIDATION_FAILED = 'domain_validation_failed',
  TOKEN_EXCHANGE_FAILED = 'token_exchange_failed'
}

export default ISSOProvider;