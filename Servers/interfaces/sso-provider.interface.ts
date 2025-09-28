/**
 * SSO Provider Interface
 *
 * Abstract interface for implementing different SSO providers (Azure AD, Google, SAML, etc.)
 * This provides a unified API for all authentication providers while maintaining
 * provider-specific flexibility.
 */

import { Request, Response } from 'express';

/**
 * Supported SSO provider types
 */
export enum SSOProviderType {
  AZURE_AD = 'azure_ad',
  GOOGLE = 'google',
  SAML = 'saml',
  OKTA = 'okta',
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
 * User information returned from SSO providers
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
 * Core SSO provider interface that all providers must implement
 */
export interface ISSOProvider {
  /**
   * Provider identification
   */
  readonly providerType: SSOProviderType;
  readonly providerId: string;

  /**
   * Initialize the provider with configuration
   */
  initialize(config: SSOProviderConfig): Promise<void>;

  /**
   * Validate provider configuration
   */
  validateConfig(config: Partial<SSOProviderConfig>): Promise<{ valid: boolean; errors: string[] }>;

  /**
   * Generate login URL for SSO initiation
   */
  getLoginUrl(req: Request, organizationId: string, additionalParams?: Record<string, string>): Promise<SSOLoginResult>;

  /**
   * Handle callback from SSO provider
   */
  handleCallback(req: Request, organizationId: string): Promise<SSOAuthResult>;

  /**
   * Exchange authorization code for user information
   */
  exchangeCodeForUser(authCode: string, state: string): Promise<SSOAuthResult>;

  /**
   * Validate email domain against provider configuration
   */
  isEmailDomainAllowed(email: string): Promise<boolean>;

  /**
   * Get provider-specific metadata URLs
   */
  getMetadataUrls(): { authUrl?: string; tokenUrl?: string; userInfoUrl?: string; logoutUrl?: string };

  /**
   * Handle provider-specific logout (optional)
   */
  handleLogout?(req: Request, organizationId: string): Promise<{ success: boolean; logoutUrl?: string }>;

  /**
   * Validate provider-specific token (for token refresh, etc.)
   */
  validateToken?(token: string): Promise<{ valid: boolean; userInfo?: SSOUserInfo }>;

  /**
   * Get user groups/roles from provider (if supported)
   */
  getUserGroups?(userId: string): Promise<string[]>;

  /**
   * Provider health check
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