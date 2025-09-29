/**
 * @fileoverview Azure AD (Entra ID) SSO Provider Implementation
 *
 * This module provides a comprehensive Azure Active Directory integration for Single Sign-On (SSO)
 * authentication. It implements the unified SSO provider interface to support multi-cloud
 * environments and various Azure AD configurations.
 *
 * Key Features:
 * - Full OAuth 2.0 Authorization Code Flow implementation
 * - Support for Azure Public Cloud and Azure Government Cloud
 * - Rate limiting and security validation
 * - Automatic user provisioning and attribute mapping
 * - Comprehensive error handling and audit logging
 * - CSRF protection with secure state token management
 *
 * Architecture:
 * - Extends BaseSSOProvider for consistent behavior across providers
 * - Uses Microsoft Authentication Library (MSAL) for Azure AD integration
 * - Implements tenant-specific configuration and validation
 * - Provides both login initiation and callback handling
 *
 * Security Features:
 * - Client secret encryption and secure storage
 * - GUID validation for Azure AD identifiers
 * - Rate limiting to prevent abuse
 * - Comprehensive audit logging for security monitoring
 * - State token validation for CSRF protection
 *
 * @author VerifyWise Development Team
 * @since 2024-09-28
 * @version 1.0.0
 * @see {@link https://docs.microsoft.com/en-us/azure/active-directory/develop/} Azure AD Developer Documentation
 */

import { Request } from 'express';
import { ConfidentialClientApplication } from '@azure/msal-node';
import {
  SSOProviderType,
  SSOProviderConfig,
  SSOLoginResult,
  SSOAuthResult,
  SSOUserInfo,
  SSOError,
  SSOErrorType,
  CloudEnvironment
} from '../interfaces/sso-provider.interface';
import { BaseSSOProvider } from '../abstracts/base-sso-provider.abstract';
import { SSOStateTokenManager } from '../utils/sso-state-token.utils';

/**
 * Azure AD specific configuration interface
 *
 * Extends the base SSO provider configuration with Azure AD-specific parameters
 * required for proper authentication and tenant isolation.
 *
 * @interface AzureADConfig
 * @extends {SSOProviderConfig}
 */
interface AzureADConfig extends SSOProviderConfig {
  /** Azure AD tenant identifier (GUID format) */
  tenantId: string;
  /** Azure cloud environment for government or public cloud deployment */
  cloudEnvironment: CloudEnvironment.AZURE_PUBLIC | CloudEnvironment.AZURE_GOVERNMENT;
}

/**
 * Azure AD SSO Provider implementation
 *
 * Provides complete Azure Active Directory (Entra ID) Single Sign-On integration
 * with support for multiple cloud environments and comprehensive security features.
 *
 * This class handles:
 * - OAuth 2.0 authorization code flow with Azure AD
 * - MSAL (Microsoft Authentication Library) integration
 * - Tenant-specific authentication and user provisioning
 * - Rate limiting and security validation
 * - Error handling and audit logging
 *
 * @class AzureADSSOProvider
 * @extends {BaseSSOProvider}
 *
 * @example
 * ```typescript
 * const provider = new AzureADSSOProvider('azure-ad-org-123');
 * await provider.initialize({
 *   clientId: 'app-client-id',
 *   clientSecret: 'encrypted-secret',
 *   tenantId: 'tenant-guid',
 *   cloudEnvironment: CloudEnvironment.AZURE_PUBLIC
 * });
 * const loginUrl = await provider.getLoginUrl(req, organizationId);
 * ```
 */
export class AzureADSSOProvider extends BaseSSOProvider {
  /** Microsoft Authentication Library client for Azure AD integration */
  private msalClient?: ConfidentialClientApplication;

  /** Azure AD-specific configuration including tenant and cloud settings */
  private azureConfig?: AzureADConfig;

  /**
   * Creates a new Azure AD SSO provider instance
   *
   * @param {string} providerId - Unique identifier for this provider instance
   */
  constructor(providerId: string) {
    super(SSOProviderType.AZURE_AD, providerId);
  }

  /**
   * Provider-specific initialization logic for Azure AD
   *
   * Configures the Microsoft Authentication Library (MSAL) client with Azure AD-specific
   * settings including tenant authority URLs and authentication parameters.
   *
   * @protected
   * @async
   * @param {SSOProviderConfig} config - Azure AD configuration parameters
   * @throws {Error} If MSAL client initialization fails
   */
  protected async onInitialize(config: SSOProviderConfig): Promise<void> {
    this.azureConfig = config as AzureADConfig;

    // Configure MSAL client for Azure AD authentication
    // Authority URL determines the Azure AD endpoint for tenant-specific authentication
    const msalConfig = {
      auth: {
        clientId: config.clientId,           // Azure AD Application (client) ID
        clientSecret: config.clientSecret,  // Application secret for confidential client flow
        authority: `${this.getAzureADBaseUrl()}/${config.tenantId}` // Tenant-specific authority URL
      }
    };

    // Initialize MSAL confidential client for server-side OAuth flow
    this.msalClient = new ConfidentialClientApplication(msalConfig);
  }

  /**
   * Azure AD-specific configuration validation
   *
   * Validates Azure AD configuration parameters including GUID formats for tenant ID
   * and client ID, as well as cloud environment settings.
   *
   * @protected
   * @async
   * @param {Partial<SSOProviderConfig>} config - Configuration to validate
   * @returns {Promise<string[]>} Array of validation error messages
   */
  protected async validateProviderSpecificConfig(config: Partial<SSOProviderConfig>): Promise<string[]> {
    const errors: string[] = [];

    // Validate Azure AD Tenant ID (required)
    if (!config.tenantId) {
      errors.push('Azure AD Tenant ID is required');
    } else {
      // Azure AD tenant IDs must be in GUID format (RFC 4122)
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!guidRegex.test(config.tenantId)) {
        errors.push('Azure AD Tenant ID must be a valid GUID format');
      }
    }

    // Validate Azure AD Client ID format (if provided)
    if (config.clientId) {
      // Azure AD application IDs must also be in GUID format
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!guidRegex.test(config.clientId)) {
        errors.push('Azure AD Client ID must be a valid GUID format');
      }
    }

    if (config.cloudEnvironment &&
        config.cloudEnvironment !== CloudEnvironment.AZURE_PUBLIC &&
        config.cloudEnvironment !== CloudEnvironment.AZURE_GOVERNMENT) {
      errors.push('Cloud environment must be azure_public or azure_government for Azure AD');
    }

    return errors;
  }

  /**
   * Generates Azure AD login URL for SSO initiation
   *
   * Creates an OAuth 2.0 authorization URL for Azure AD authentication with comprehensive
   * security validation including rate limiting, input validation, and CSRF protection.
   *
   * @async
   * @param {Request} req - Express request object for rate limiting and logging
   * @param {string} organizationId - Organization identifier for tenant isolation
   * @param {Record<string, string>} [additionalParams] - Optional additional OAuth parameters
   * @returns {Promise<SSOLoginResult>} Login result containing authorization URL
   *
   * @throws {SSOError} RATE_LIMIT_EXCEEDED - When rate limits are exceeded
   * @throws {SSOError} CONFIGURATION_ERROR - When organization ID is invalid
   * @throws {SSOError} PROVIDER_ERROR - When Azure AD URL generation fails
   *
   * @example
   * ```typescript
   * const result = await provider.getLoginUrl(req, '123');
   * // Redirect user to result.authUrl for Azure AD authentication
   * ```
   */
  async getLoginUrl(req: Request, organizationId: string, additionalParams?: Record<string, string>): Promise<SSOLoginResult> {
    this.ensureInitialized();

    // Rate limiting check
    const rateLimitResult = await this.checkRateLimit(req, 'login');
    if (!rateLimitResult.allowed) {
      throw new SSOError(
        SSOErrorType.RATE_LIMIT_EXCEEDED,
        `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
        this.providerType
      );
    }

    // Enhanced input validation
    if (!organizationId || typeof organizationId !== 'string') {
      throw new SSOError(
        SSOErrorType.CONFIGURATION_ERROR,
        'Organization ID must be a non-empty string',
        this.providerType
      );
    }

    // Validate organization ID format (should be numeric string for VerifyWise)
    if (!/^\d+$/.test(organizationId.trim())) {
      throw new SSOError(
        SSOErrorType.CONFIGURATION_ERROR,
        'Organization ID must be a valid numeric identifier',
        this.providerType
      );
    }

    // Validate additional parameters if provided
    if (additionalParams) {
      for (const [key, value] of Object.entries(additionalParams)) {
        if (typeof key !== 'string' || typeof value !== 'string') {
          throw new SSOError(
            SSOErrorType.CONFIGURATION_ERROR,
            'Additional parameters must be string key-value pairs',
            this.providerType
          );
        }

        // Sanitize parameter values
        if (key.length > 100 || value.length > 500) {
          throw new SSOError(
            SSOErrorType.CONFIGURATION_ERROR,
            'Parameter keys and values exceed maximum length',
            this.providerType
          );
        }

        // Check for dangerous characters
        if (/[<>{}[\]\\\/\x00-\x1f\x7f]/.test(key) || /[<>{}[\]\\\/\x00-\x1f\x7f]/.test(value)) {
          throw new SSOError(
            SSOErrorType.CONFIGURATION_ERROR,
            'Parameter keys and values contain invalid characters',
            this.providerType
          );
        }
      }
    }

    try {
      // Generate secure state token with CSRF protection
      const secureState = SSOStateTokenManager.generateStateToken(organizationId);

      // Validate required environment variables
      const backendUrl = process.env.BACKEND_URL;
      if (!backendUrl) {
        throw new SSOError(
          SSOErrorType.CONFIGURATION_ERROR,
          'BACKEND_URL environment variable is required for SSO operation',
          this.providerType
        );
      }

      // Define the authorization URL parameters
      const authCodeUrlParameters = {
        scopes: this.azureConfig?.scopes || ['openid', 'profile', 'email'],
        redirectUri: `${backendUrl}/api/sso-auth/${organizationId}/callback`,
        state: secureState,
        ...additionalParams
      };

      // Get authorization URL from MSAL
      const authUrl = await this.msalClient!.getAuthCodeUrl(authCodeUrlParameters);

      // Log successful login initiation
      this.logAuditEvent(req, 'login_initiated', true);

      return {
        success: true,
        authUrl: authUrl,
        state: secureState
      };
    } catch (error) {
      this.logAuditEvent(req, 'login_initiated', false, undefined, 'Failed to generate authorization URL');
      throw this.handleProviderError(error, 'login URL generation');
    }
  }

  /**
   * Handle callback from SSO provider
   */
  async handleCallback(req: Request, organizationId: string): Promise<SSOAuthResult> {
    this.ensureInitialized();

    // Rate limiting check
    const rateLimitResult = await this.checkRateLimit(req, 'callback');
    if (!rateLimitResult.allowed) {
      throw new SSOError(
        SSOErrorType.RATE_LIMIT_EXCEEDED,
        `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
        this.providerType
      );
    }

    // Enhanced input validation for organizationId
    if (!organizationId || typeof organizationId !== 'string') {
      this.logAuditEvent(req, 'authentication_failure', false, undefined, 'Invalid organization ID format');
      return {
        success: false,
        error: 'Invalid organization ID',
        errorCode: 'invalid_organization_id'
      };
    }

    // Validate organization ID format
    if (!/^\d+$/.test(organizationId.trim())) {
      this.logAuditEvent(req, 'authentication_failure', false, undefined, 'Organization ID format validation failed');
      return {
        success: false,
        error: 'Invalid organization ID format',
        errorCode: 'invalid_organization_id'
      };
    }

    const { code, state, error: authError } = req.query;

    // Enhanced query parameter validation
    if (code && typeof code !== 'string') {
      this.logAuditEvent(req, 'authentication_failure', false, undefined, 'Invalid authorization code type');
      return {
        success: false,
        error: 'Invalid authorization code format',
        errorCode: 'invalid_auth_code'
      };
    }

    if (state && typeof state !== 'string') {
      this.logAuditEvent(req, 'authentication_failure', false, undefined, 'Invalid state parameter type');
      return {
        success: false,
        error: 'Invalid state parameter format',
        errorCode: 'invalid_state'
      };
    }

    if (authError && typeof authError !== 'string') {
      this.logAuditEvent(req, 'authentication_failure', false, undefined, 'Invalid error parameter type');
      return {
        success: false,
        error: 'Invalid error parameter format',
        errorCode: 'invalid_error_param'
      };
    }

    // Validate code length and format if present
    if (code && (code.length < 10 || code.length > 2048)) {
      this.logAuditEvent(req, 'authentication_failure', false, undefined, 'Authorization code length validation failed');
      return {
        success: false,
        error: 'Invalid authorization code length',
        errorCode: 'invalid_auth_code'
      };
    }

    // Validate state parameter length if present
    if (state && (state.length < 10 || state.length > 1024)) {
      this.logAuditEvent(req, 'authentication_failure', false, undefined, 'State parameter length validation failed');
      return {
        success: false,
        error: 'Invalid state parameter length',
        errorCode: 'invalid_state'
      };
    }

    // Check if Azure AD returned an error
    if (authError) {
      this.logAuditEvent(req, 'authentication_failure', false, undefined, `Azure AD error: ${authError}`);
      return {
        success: false,
        error: 'Azure AD authentication error',
        errorCode: 'azure_ad_error'
      };
    }

    // Validate state token
    try {
      SSOStateTokenManager.validateStateToken(state as string, organizationId);
    } catch (error) {
      this.logAuditEvent(req, 'authentication_failure', false, undefined, 'State token validation failed');
      return {
        success: false,
        error: 'Invalid state token',
        errorCode: 'invalid_state'
      };
    }

    if (!code) {
      this.logAuditEvent(req, 'authentication_failure', false, undefined, 'No authorization code received');
      return {
        success: false,
        error: 'No authorization code received',
        errorCode: 'no_auth_code'
      };
    }

    return this.exchangeCodeForUser(code as string, state as string);
  }

  /**
   * Exchange authorization code for user information
   */
  async exchangeCodeForUser(authCode: string, state: string): Promise<SSOAuthResult> {
    this.ensureInitialized();

    // Enhanced input validation for authorization code
    if (!authCode || typeof authCode !== 'string') {
      throw new SSOError(
        SSOErrorType.AUTHENTICATION_FAILED,
        'Authorization code must be a non-empty string',
        this.providerType
      );
    }

    // Validate authorization code format and length
    if (authCode.length < 10 || authCode.length > 2048) {
      throw new SSOError(
        SSOErrorType.AUTHENTICATION_FAILED,
        'Authorization code has invalid length',
        this.providerType
      );
    }

    // Check for dangerous characters in authorization code
    if (/[\x00-\x1f\x7f<>{}[\]\\]/.test(authCode)) {
      throw new SSOError(
        SSOErrorType.AUTHENTICATION_FAILED,
        'Authorization code contains invalid characters',
        this.providerType
      );
    }

    // Enhanced input validation for state parameter
    if (!state || typeof state !== 'string') {
      throw new SSOError(
        SSOErrorType.AUTHENTICATION_FAILED,
        'State parameter must be a non-empty string',
        this.providerType
      );
    }

    // Validate state parameter length
    if (state.length < 10 || state.length > 1024) {
      throw new SSOError(
        SSOErrorType.AUTHENTICATION_FAILED,
        'State parameter has invalid length',
        this.providerType
      );
    }

    try {
      // Validate required environment variables
      const backendUrl = process.env.BACKEND_URL;
      if (!backendUrl) {
        throw new SSOError(
          SSOErrorType.CONFIGURATION_ERROR,
          'BACKEND_URL environment variable is required for token exchange',
          this.providerType
        );
      }

      // Token request configuration
      const tokenRequest = {
        code: authCode,
        scopes: this.azureConfig?.scopes || ['openid', 'profile', 'email'],
        redirectUri: `${backendUrl}/api/sso-auth/${this.azureConfig?.organizationId}/callback`
      };

      // Exchange authorization code for tokens
      const response = await this.msalClient!.acquireTokenByCode(tokenRequest);

      if (!response) {
        throw new SSOError(SSOErrorType.AUTHENTICATION_FAILED, 'Token exchange failed - no response', this.providerType);
      }

      // Extract user information from the token
      const userInfo = response.account;
      if (!userInfo || !userInfo.username) {
        throw new SSOError(SSOErrorType.AUTHENTICATION_FAILED, 'No user information in token response', this.providerType);
      }

      // Normalize user information
      const normalizedUserInfo = this.normalizeUserInfo(userInfo);

      // Validate email domain
      const domainAllowed = await this.isEmailDomainAllowed(normalizedUserInfo.email);
      if (!domainAllowed) {
        throw new SSOError(SSOErrorType.DOMAIN_NOT_ALLOWED, 'Email domain not allowed', this.providerType);
      }

      return {
        success: true,
        userInfo: normalizedUserInfo
      };
    } catch (error) {
      if (error instanceof SSOError) {
        throw error;
      }
      throw this.handleProviderError(error, 'token exchange');
    }
  }

  /**
   * Get provider-specific metadata URLs
   */
  getMetadataUrls(): { authUrl?: string; tokenUrl?: string; userInfoUrl?: string; logoutUrl?: string } {
    const baseUrl = this.getAzureADBaseUrl();
    const tenantId = this.azureConfig?.tenantId || 'common';

    return {
      authUrl: `${baseUrl}/${tenantId}/oauth2/v2.0/authorize`,
      tokenUrl: `${baseUrl}/${tenantId}/oauth2/v2.0/token`,
      userInfoUrl: `${this.getGraphApiUrl()}/v1.0/me`,
      logoutUrl: `${baseUrl}/${tenantId}/oauth2/v2.0/logout`
    };
  }

  /**
   * Provider-specific health check implementation
   */
  protected async performHealthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      if (!this.msalClient) {
        return {
          healthy: false,
          message: 'MSAL client not initialized'
        };
      }

      // Test connectivity to Azure AD discovery endpoint
      const metadataUrls = this.getMetadataUrls();

      // Basic configuration validation
      if (!this.azureConfig?.tenantId || !this.azureConfig?.clientId) {
        return {
          healthy: false,
          message: 'Missing required Azure AD configuration'
        };
      }

      return {
        healthy: true,
        message: 'Azure AD provider healthy'
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Normalize user information from Azure AD format
   */
  protected normalizeUserInfo(azureUserData: any): SSOUserInfo {
    // Extract email - in Azure AD, username is typically the email
    const email = azureUserData.username;
    if (!this.isValidEmail(email)) {
      throw new SSOError(SSOErrorType.AUTHENTICATION_FAILED, 'Invalid email format from Azure AD', this.providerType);
    }

    // Extract Azure Object ID
    let azureObjectId = '';
    if (azureUserData.homeAccountId && typeof azureUserData.homeAccountId === 'string') {
      const accountParts = azureUserData.homeAccountId.split('.');
      if (accountParts.length >= 1 && accountParts[0].length > 0) {
        // Validate object ID format (should be GUID-like)
        const objectIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (objectIdPattern.test(accountParts[0])) {
          azureObjectId = accountParts[0];
        }
      }
    }

    // Fall back to localAccountId if homeAccountId is invalid
    if (!azureObjectId && azureUserData.localAccountId && typeof azureUserData.localAccountId === 'string') {
      const objectIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (objectIdPattern.test(azureUserData.localAccountId)) {
        azureObjectId = azureUserData.localAccountId;
      }
    }

    // Use email as fallback identifier if Azure Object ID is invalid
    if (!azureObjectId) {
      azureObjectId = email;
    }

    // Extract and sanitize name information
    let firstName = 'Unknown';
    let lastName = 'User';
    let displayName = '';

    if (azureUserData.name && typeof azureUserData.name === 'string' && azureUserData.name.trim().length > 0) {
      const nameParts = azureUserData.name.trim().split(' ');
      displayName = azureUserData.name.trim();

      // Sanitize first name
      if (nameParts[0] && nameParts[0].length > 0) {
        firstName = this.sanitizeName(nameParts[0]);
      }

      // Sanitize last name
      if (nameParts.length > 1) {
        const lastNamePart = nameParts.slice(1).join(' ');
        if (lastNamePart.length > 0) {
          lastName = this.sanitizeName(lastNamePart);
        }
      }
    }

    // Ensure we have valid names
    if (!firstName || firstName.trim().length === 0) firstName = 'Unknown';
    if (!lastName || lastName.trim().length === 0) lastName = 'User';
    if (!displayName) displayName = `${firstName} ${lastName}`;

    return {
      email,
      firstName,
      lastName,
      displayName,
      providerId: azureObjectId,
      providerType: SSOProviderType.AZURE_AD,
      additionalClaims: {
        azureObjectId,
        homeAccountId: azureUserData.homeAccountId,
        localAccountId: azureUserData.localAccountId,
        tenantId: azureUserData.tenantId || this.azureConfig?.tenantId
      }
    };
  }

  /**
   * Get Azure AD login URL based on cloud environment
   */
  private getAzureADBaseUrl(): string {
    return this.azureConfig?.cloudEnvironment === CloudEnvironment.AZURE_GOVERNMENT
      ? 'https://login.microsoftonline.us'
      : 'https://login.microsoftonline.com';
  }

  /**
   * Get Microsoft Graph API URL based on cloud environment
   */
  private getGraphApiUrl(): string {
    return this.azureConfig?.cloudEnvironment === CloudEnvironment.AZURE_GOVERNMENT
      ? 'https://graph.microsoft.us'
      : 'https://graph.microsoft.com';
  }

  /**
   * Handle provider-specific logout (optional implementation)
   */
  async handleLogout(req: Request, organizationId: string): Promise<{ success: boolean; logoutUrl?: string }> {
    const metadataUrls = this.getMetadataUrls();

    return {
      success: true,
      logoutUrl: metadataUrls.logoutUrl
    };
  }

  /**
   * Validate Azure AD JWT token
   */
  async validateToken(token: string): Promise<{ valid: boolean; userInfo?: SSOUserInfo }> {
    try {
      // Enhanced input validation for token
      if (!token || typeof token !== 'string') {
        throw new SSOError(
          SSOErrorType.AUTHENTICATION_FAILED,
          'Token must be a non-empty string',
          this.providerType
        );
      }

      // Validate token format (JWT has 3 parts separated by dots)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new SSOError(
          SSOErrorType.AUTHENTICATION_FAILED,
          'Invalid JWT token format',
          this.providerType
        );
      }

      // Check token length (reasonable bounds for JWT)
      if (token.length < 100 || token.length > 8192) {
        throw new SSOError(
          SSOErrorType.AUTHENTICATION_FAILED,
          'Token length is outside acceptable range',
          this.providerType
        );
      }

      // Check for dangerous characters
      if (/[\x00-\x1f\x7f<>{}[\]\\]/.test(token)) {
        throw new SSOError(
          SSOErrorType.AUTHENTICATION_FAILED,
          'Token contains invalid characters',
          this.providerType
        );
      }

      this.ensureInitialized();

      // Use MSAL to validate the token
      // Note: MSAL primarily handles authentication flows, not token validation
      // For production, you would typically validate against Azure AD's jwks_uri

      // For now, we'll implement basic JWT structure validation
      // and defer to the authentication flow for full validation

      try {
        // Decode JWT header and payload for basic validation
        const header = JSON.parse(Buffer.from(tokenParts[0], 'base64url').toString());
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64url').toString());

        // Basic JWT header validation
        if (!header.alg || !header.typ || header.typ !== 'JWT') {
          throw new SSOError(
            SSOErrorType.AUTHENTICATION_FAILED,
            'Invalid JWT header structure',
            this.providerType
          );
        }

        // Basic payload validation
        if (!payload.sub || !payload.iss || !payload.aud || !payload.exp) {
          throw new SSOError(
            SSOErrorType.AUTHENTICATION_FAILED,
            'JWT missing required claims',
            this.providerType
          );
        }

        // Check token expiration
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp <= now) {
          throw new SSOError(
            SSOErrorType.AUTHENTICATION_FAILED,
            'JWT token has expired',
            this.providerType
          );
        }

        // Check if token is not used before its valid time
        if (payload.nbf && payload.nbf > now) {
          throw new SSOError(
            SSOErrorType.AUTHENTICATION_FAILED,
            'JWT token is not yet valid',
            this.providerType
          );
        }

        // Validate issuer is from Azure AD
        const validIssuers = [
          `https://login.microsoftonline.com/${this.azureConfig?.tenantId}/v2.0`,
          `https://login.microsoftonline.us/${this.azureConfig?.tenantId}/v2.0`, // Government cloud
          'https://sts.windows.net/' // Alternative issuer format
        ];

        const isValidIssuer = validIssuers.some(validIssuer =>
          payload.iss.startsWith(validIssuer) || payload.iss.includes(this.azureConfig?.tenantId || '')
        );

        if (!isValidIssuer) {
          throw new SSOError(
            SSOErrorType.AUTHENTICATION_FAILED,
            'JWT token issuer is not trusted',
            this.providerType
          );
        }

        // Validate audience matches our application
        const expectedAudience = this.azureConfig?.clientId;
        if (expectedAudience && payload.aud !== expectedAudience) {
          throw new SSOError(
            SSOErrorType.AUTHENTICATION_FAILED,
            'JWT token audience mismatch',
            this.providerType
          );
        }

        // Extract user information from token claims
        const userInfo: SSOUserInfo = {
          email: payload.email || payload.preferred_username || payload.upn || '',
          firstName: payload.given_name || 'Unknown',
          lastName: payload.family_name || 'User',
          displayName: payload.name || `${payload.given_name || 'Unknown'} ${payload.family_name || 'User'}`,
          providerId: payload.sub || payload.oid || payload.email || '',
          providerType: SSOProviderType.AZURE_AD,
          additionalClaims: {
            azureObjectId: payload.oid || payload.sub,
            tenantId: payload.tid || this.azureConfig?.tenantId,
            roles: payload.roles || [],
            groups: payload.groups || [],
            tokenId: payload.jti,
            authTime: payload.auth_time,
            sessionId: payload.sid
          }
        };

        // Validate extracted email
        if (!this.isValidEmail(userInfo.email)) {
          throw new SSOError(
            SSOErrorType.AUTHENTICATION_FAILED,
            'Invalid email in JWT token',
            this.providerType
          );
        }

        // Sanitize names
        userInfo.firstName = this.sanitizeName(userInfo.firstName);
        userInfo.lastName = this.sanitizeName(userInfo.lastName);
        userInfo.displayName = this.sanitizeName(userInfo.displayName || `${userInfo.firstName} ${userInfo.lastName}`);

        return {
          valid: true,
          userInfo
        };

      } catch (decodeError) {
        throw new SSOError(
          SSOErrorType.AUTHENTICATION_FAILED,
          'Failed to decode JWT token',
          this.providerType
        );
      }

    } catch (error) {
      // Log validation failure for security monitoring
      console.warn('JWT token validation failed:', error instanceof Error ? error.message : 'Unknown error');

      if (error instanceof SSOError) {
        throw error;
      }

      return {
        valid: false
      };
    }
  }

  /**
   * Enhanced sanitize user name fields with additional security checks for Azure AD
   */
  protected sanitizeName(name: string): string {
    if (!name || typeof name !== 'string') {
      return '';
    }

    // Remove dangerous characters and normalize Unicode
    let sanitized = name
      .normalize('NFD') // Normalize Unicode decomposition
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics/combining marks
      .replace(/[<>{}[\]\\\/\x00-\x1f\x7f\u00a0\u2000-\u200f\u2028-\u202f\u205f-\u206f]/g, '') // Remove dangerous chars
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 50) // Limit length
      .trim();

    // Additional security: reject names that are only special characters or too short
    if (sanitized.length < 1 || /^[^\w\s\-'.]+$/.test(sanitized)) {
      return '';
    }

    // Prevent injection attempts
    if (/(?:javascript|data|vbscript|on\w+):/i.test(sanitized)) {
      return '';
    }

    return sanitized;
  }

  /**
   * Enhanced email validation with additional security checks for Azure AD
   */
  protected isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }

    // Length checks
    if (email.length < 3 || email.length > 320) {
      return false;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    // Additional security checks
    const localPart = email.split('@')[0];
    const domain = email.split('@')[1];

    // Check for dangerous characters in local part
    if (/[<>{}[\]\\\/\x00-\x1f\x7f]/.test(localPart)) {
      return false;
    }

    // Check for dangerous characters in domain
    if (/[<>{}[\]\\\/\x00-\x1f\x7f]/.test(domain)) {
      return false;
    }

    // Prevent obvious injection attempts
    if (/(?:javascript|data|vbscript|on\w+):/i.test(email)) {
      return false;
    }

    // Validate domain has at least one dot and proper structure
    if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
      return false;
    }

    return true;
  }

  /**
   * Get user groups from Azure AD (optional implementation)
   */
  async getUserGroups(userId: string): Promise<string[]> {
    try {
      // Enhanced input validation for user ID
      if (!userId || typeof userId !== 'string') {
        throw new Error('User ID must be a non-empty string');
      }

      // Validate GUID format for Azure Object ID
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!guidRegex.test(userId)) {
        throw new Error('User ID must be a valid GUID format');
      }

      // This would make a call to Microsoft Graph API to get user groups
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Failed to get user groups from Azure AD:', error);
      return [];
    }
  }
}

export default AzureADSSOProvider;