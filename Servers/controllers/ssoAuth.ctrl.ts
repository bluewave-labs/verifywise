import { Request, Response } from 'express';
import '../types/express';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { SSOConfigurationModel } from '../domain.layer/models/sso/ssoConfiguration.model';
import { UserModel } from '../domain.layer/models/user/user.model';
import { OrganizationModel } from '../domain.layer/models/organization/organization.model';
import { SSOStateTokenManager } from '../utils/sso-state-token.utils';
import { SSOAuditLogger } from '../utils/sso-audit-logger.utils';
import { SSOErrorHandler, SSOErrorCodes } from '../utils/sso-error-handler.utils';
import * as jwt from 'jsonwebtoken';
import { Op } from 'sequelize';

/**
 * @fileoverview SSO Authentication Controller for Azure AD (Entra ID) Integration
 *
 * This controller manages the complete OAuth 2.0 authorization code flow with Azure Active Directory.
 * It handles user authentication, organization-specific SSO configurations, and secure token management
 * for multi-tenant applications requiring enterprise identity integration.
 *
 * Key Features:
 * - Organization-specific SSO configuration management
 * - Secure state token validation (CSRF protection)
 * - Azure AD OAuth 2.0 flow implementation
 * - Automatic user provisioning and organization mapping
 * - Comprehensive audit logging for security monitoring
 * - Error handling with detailed security event tracking
 *
 * Security Considerations:
 * - All SSO configurations use encrypted client secrets
 * - State tokens provide CSRF protection during OAuth flow
 * - Audit logs track all authentication attempts and failures
 * - Tenant isolation ensures organization data separation
 *
 * @author VerifyWise Development Team
 * @since 2024-09-28
 * @version 1.0.0
 */

// Configuration Constants
const JWT_EXPIRY = process.env.SSO_JWT_EXPIRY || '24h';
const JWT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const ROLE_MAP = new Map([
  [1, "Admin"],
  [2, "Reviewer"],
  [3, "Editor"],
  [4, "Auditor"]
]);

/**
 * Initiates Azure AD SSO authentication flow for an organization
 *
 * This function handles the first step of the OAuth 2.0 authorization code flow by:
 * 1. Validating the organization's SSO configuration
 * 2. Creating a secure MSAL client with encrypted credentials
 * 3. Generating CSRF-protected state tokens
 * 4. Redirecting users to Azure AD for authentication
 *
 * @async
 * @function initiateSSOLogin
 * @param {Request} req - Express request object
 * @param {string} req.params.organizationId - Organization ID for SSO configuration lookup
 * @param {Response} res - Express response object
 *
 * @returns {Promise<Response>} JSON response with Azure AD authorization URL or error
 *
 * @throws {404} SSO not configured or enabled for organization
 * @throws {500} SSO configuration errors (decryption failures, invalid Azure config)
 *
 * @security
 * - Validates organization-specific SSO configuration
 * - Uses encrypted client secrets for Azure AD authentication
 * - Generates cryptographically secure state tokens for CSRF protection
 * - Logs all authentication attempts for security monitoring
 *
 * @example
 * GET /api/sso-auth/123/login
 * Response: {
 *   "success": true,
 *   "data": {
 *     "authUrl": "https://login.microsoftonline.com/tenant-id/oauth2/v2.0/authorize?..."
 *   }
 * }
 *
 * @see {@link SSOConfigurationModel} For SSO configuration management
 * @see {@link SSOStateTokenManager} For secure state token generation
 * @see {@link SSOAuditLogger} For security event logging
 */
export const initiateSSOLogin = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    // Step 1: Retrieve and validate organization's SSO configuration
    // Only active SSO configurations are considered for authentication
    const ssoConfig = await SSOConfigurationModel.findOne({
      where: {
        organization_id: organizationId,
        is_enabled: true                    // Ensure SSO is actively enabled
      }
    });

    if (!ssoConfig) {
      // Log security event for monitoring unauthorized SSO attempts
      SSOAuditLogger.logAuthenticationFailure(req, organizationId, 'SSO not configured or enabled');
      return res.status(404).json({
        success: false,
        error: 'SSO is not configured or enabled for this organization'
      });
    }

    // Step 2: Decrypt client secret for Azure AD authentication
    // Client secrets are encrypted at rest for security
    const clientSecret = ssoConfig.getDecryptedSecret();
    if (!clientSecret) {
      // Critical security failure - unable to access authentication credentials
      SSOAuditLogger.logAuthenticationFailure(req, organizationId, 'SSO configuration error - failed to decrypt client secret');
      return res.status(500).json({
        success: false,
        error: 'SSO configuration error'
      });
    }

    // Step 3: Extract and validate Azure AD configuration parameters
    // This includes client_id, tenant_id, and other Azure-specific settings
    const azureConfig = ssoConfig.getAzureAdConfig();
    if (!azureConfig) {
      SSOAuditLogger.logAuthenticationFailure(req, organizationId, 'Invalid Azure AD configuration');
      return res.status(500).json({
        success: false,
        error: 'Invalid SSO configuration'
      });
    }

    // Step 4: Configure Microsoft Authentication Library (MSAL) client
    // MSAL handles the OAuth 2.0 flow with Azure AD
    const msalConfig = {
      auth: {
        clientId: azureConfig.client_id,        // Azure AD application ID
        clientSecret: clientSecret,             // Decrypted client secret
        authority: `${ssoConfig.getAzureADBaseUrl()}/${azureConfig.tenant_id}` // Tenant-specific authority URL
      }
    };

    const cca = new ConfidentialClientApplication(msalConfig);

    // Step 5: Generate secure state token for CSRF protection
    // State token links the request with the callback to prevent CSRF attacks
    const secureState = SSOStateTokenManager.generateStateToken(organizationId);

    // Step 6: Configure OAuth 2.0 authorization parameters
    const authCodeUrlParameters = {
      scopes: ['openid', 'profile', 'email'], // Minimal required scopes for user identification
      redirectUri: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/sso-auth/${organizationId}/callback`,
      state: secureState                      // CSRF protection token
    };

    try {
      // Step 7: Generate Azure AD authorization URL
      // This URL redirects users to Azure AD for authentication
      const authUrl = await cca.getAuthCodeUrl(authCodeUrlParameters);

      // Step 8: Log successful SSO initiation for security monitoring
      SSOAuditLogger.logLoginInitiation(req, organizationId, true);

      return res.json({
        success: true,
        authUrl: authUrl
      });
    } catch (msalError) {
      console.error('MSAL error getting auth URL:', msalError);
      SSOAuditLogger.logLoginInitiation(req, organizationId, false, 'MSAL error generating authorization URL');
      return res.status(500).json({
        success: false,
        error: 'Failed to generate authorization URL'
      });
    }
  } catch (error) {
    console.error('Error initiating SSO login:', error);
    const { organizationId } = req.params;
    SSOAuditLogger.logLoginInitiation(req, organizationId, false, 'Unexpected error during login initiation');
    return res.status(500).json({
      success: false,
      error: 'Failed to initiate SSO login'
    });
  }
};

/**
 * Handles Azure AD OAuth callback and completes user authentication
 *
 * This function processes the OAuth 2.0 authorization code flow callback from Azure AD:
 * 1. Validates CSRF state tokens for security
 * 2. Exchanges authorization code for access tokens
 * 3. Extracts user information from Azure AD response
 * 4. Creates or updates user accounts with SSO information
 * 5. Generates application JWT tokens for session management
 *
 * @async
 * @function handleSSOCallback
 * @param {Request} req - Express request object
 * @param {string} req.params.organizationId - Organization ID from URL
 * @param {string} req.query.code - Authorization code from Azure AD
 * @param {string} req.query.state - State token for CSRF protection
 * @param {string} req.query.error - Optional error from Azure AD
 * @param {Response} res - Express response object
 *
 * @returns {Promise<Response>} Redirect to frontend with authentication result
 *
 * @security
 * - Validates state tokens to prevent CSRF attacks
 * - Uses encrypted client secrets for token exchange
 * - Logs all authentication attempts for security monitoring
 * - Handles Azure AD errors gracefully with appropriate redirects
 *
 * @example
 * GET /api/sso-auth/123/callback?code=auth_code&state=secure_token
 * Redirects to: http://frontend.com/dashboard (success)
 * Redirects to: http://frontend.com/login?error=sso_failed (failure)
 *
 * @see {@link SSOStateTokenManager.validateStateToken} For CSRF protection validation
 * @see {@link ConfidentialClientApplication.acquireTokenByCode} For token exchange
 */
export const handleSSOCallback = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { code, state, error: authError } = req.query;

    // Step 1: Check for Azure AD authentication errors
    // Azure AD redirects here with error parameter if authentication fails
    if (authError) {
      console.error('Azure AD authentication error:', authError);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=sso_failed`);
    }

    // Step 2: Validate CSRF state token for security
    // This prevents cross-site request forgery attacks during OAuth flow
    try {
      const validatedState = SSOStateTokenManager.validateStateToken(state as string, organizationId);
      // SECURITY: Only log sensitive information in development environment
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Valid state token for organization ${organizationId}, nonce: ${validatedState.nonce}`);
      }
    } catch (error) {
      // SECURITY: Limit error exposure in production for security
      if (process.env.NODE_ENV !== 'production') {
        console.error('State token validation failed:', error);
      } else {
        console.error('State token validation failed for organization:', organizationId);
      }
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=invalid_state`);
    }

    // Step 3: Validate authorization code presence
    // Authorization code is required to exchange for access tokens
    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=no_auth_code`);
    }

    // Step 4: Retrieve SSO configuration for token exchange
    // Same organization validation as in initiation step
    const ssoConfig = await SSOConfigurationModel.findOne({
      where: {
        organization_id: organizationId,
        is_enabled: true
      }
    });

    if (!ssoConfig) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=sso_not_configured`);
    }

    // Step 5: Decrypt client secret for Azure AD token exchange
    const clientSecret = ssoConfig.getDecryptedSecret();
    if (!clientSecret) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=sso_config_error`);
    }

    // Step 6: Extract Azure AD configuration for MSAL client
    const azureConfig = ssoConfig.getAzureAdConfig();
    if (!azureConfig) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=sso_config_error`);
    }

    // Create MSAL client configuration
    const msalConfig = {
      auth: {
        clientId: azureConfig.client_id,
        clientSecret: clientSecret,
        authority: `${ssoConfig.getAzureADBaseUrl()}/${azureConfig.tenant_id}`
      }
    };

    const cca = new ConfidentialClientApplication(msalConfig);

    // Token request configuration
    const tokenRequest = {
      code: code as string,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/sso-auth/${organizationId}/callback`
    };

    try {
      // Exchange authorization code for tokens
      const response = await cca.acquireTokenByCode(tokenRequest);

      if (!response) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=token_exchange_failed`);
      }

      // Extract user information from the token
      const userInfo = response.account;
      if (!userInfo || !userInfo.username) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=no_user_info`);
      }

      // Extract and validate user information from Azure AD
      const email = userInfo.username; // In Azure AD, username is typically the email

      // SECURITY: Validate email format before using
      if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 320) {
        console.error('Invalid email received from Azure AD:', { email: email ? '[REDACTED]' : 'null' });
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=invalid_email`);
      }

      // SECURITY: Safely extract Azure Object ID with validation
      let azureObjectId = null;
      if (userInfo.homeAccountId && typeof userInfo.homeAccountId === 'string') {
        const accountParts = userInfo.homeAccountId.split('.');
        if (accountParts.length >= 1 && accountParts[0].length > 0) {
          // Validate object ID format (should be GUID-like)
          const objectIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (objectIdPattern.test(accountParts[0])) {
            azureObjectId = accountParts[0];
          }
        }
      }

      // Fall back to localAccountId if homeAccountId is invalid
      if (!azureObjectId && userInfo.localAccountId && typeof userInfo.localAccountId === 'string') {
        const objectIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (objectIdPattern.test(userInfo.localAccountId)) {
          azureObjectId = userInfo.localAccountId;
        }
      }

      // Use email as fallback identifier if Azure Object ID is invalid
      if (!azureObjectId) {
        console.warn('No valid Azure Object ID found, using email as identifier for user:', email.split('@')[0] + '@[DOMAIN]');
        azureObjectId = email; // Fallback to email
      }

      // Validate that the organization exists and is active
      const organization = await OrganizationModel.findByPk(organizationId);
      if (!organization) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=invalid_organization`);
      }

      // Find or create user in our system
      let user = await UserModel.findOne({
        where: {
          email: email,
          organization_id: organizationId
        }
      });

      if (!user) {
        // SECURITY: Validate email domain against organization's allowlist
        if (!ssoConfig.isEmailDomainAllowed(email)) {
          console.warn(`SSO login denied: Email domain not allowed for ${email} in organization ${organizationId}`);
          SSOAuditLogger.logDomainValidationFailure(req, organizationId, email, ssoConfig.allowed_domains || []);
          return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=email_domain_not_allowed`);
        }

        // SECURITY: Safely extract and validate name information from Azure AD
        let firstName = 'Unknown';
        let lastName = 'User';

        if (userInfo.name && typeof userInfo.name === 'string' && userInfo.name.trim().length > 0) {
          const nameParts = userInfo.name.trim().split(' ');

          // Sanitize first name
          if (nameParts[0] && nameParts[0].length > 0) {
            firstName = nameParts[0].replace(/[<>{}[\]\\\/\x00-\x1f\x7f]/g, '').substring(0, 50);
          }

          // Sanitize last name
          if (nameParts.length > 1) {
            const lastNamePart = nameParts.slice(1).join(' ');
            if (lastNamePart.length > 0) {
              lastName = lastNamePart.replace(/[<>{}[\]\\\/\x00-\x1f\x7f]/g, '').substring(0, 50);
            }
          }
        }

        // Ensure we have valid names
        if (!firstName || firstName.trim().length === 0) firstName = 'Unknown';
        if (!lastName || lastName.trim().length === 0) lastName = 'User';

        if (firstName === 'Unknown' && lastName === 'User') {
          console.warn(`SSO user ${email.split('@')[0]}@[DOMAIN] has minimal profile information from Azure AD`);
        }

        // SECURITY: Use organization-configured default role instead of hardcoded value
        const defaultRoleId = ssoConfig.getDefaultRoleId();

        // Create new user with validation
        try {
          user = await UserModel.create({
            email: email,
            name: firstName,
            surname: lastName,
            organization_id: parseInt(organizationId),
            role_id: defaultRoleId, // Use configured default role from SSO settings
            sso_enabled: true,
            azure_ad_object_id: azureObjectId,
            sso_last_login: new Date(),
            password_hash: 'SSO_USER', // Placeholder since SSO users don't have passwords
            is_demo: false
          } as any);

          // SECURITY: Mask email in production logs
          const maskedEmail = process.env.NODE_ENV === 'production'
            ? email.split('@')[0] + '@[DOMAIN]'
            : email;
          console.log(`Created new SSO user: ${maskedEmail} for organization ${organizationId}`);
        } catch (createError) {
          console.error('Failed to create SSO user:', createError);
          return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=user_creation_failed`);
        }
      } else {
        // Update existing user's SSO fields and last login
        await user.update({
          sso_enabled: true,
          azure_ad_object_id: azureObjectId,
          sso_last_login: new Date()
        });

        // SECURITY: Mask email in production logs
        const maskedEmail = process.env.NODE_ENV === 'production'
          ? email.split('@')[0] + '@[DOMAIN]'
          : email;
        console.log(`Updated SSO login for existing user: ${maskedEmail}`);
      }

      // Generate JWT token for our application
      const jwtPayload = {
        userId: user.id,
        email: user.email,
        organizationId: user.organization_id,
        role: ROLE_MAP.get(user.role_id!) || "Reviewer", // Default to Reviewer if unknown role
        ssoEnabled: true
      };

      const token = jwt.sign(jwtPayload, process.env.JWT_SECRET as string, { expiresIn: JWT_EXPIRY });

      // Set secure httpOnly cookie instead of URL parameter for security
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: isProduction, // HTTPS in production
        sameSite: 'lax',
        maxAge: JWT_EXPIRY_MS, // Use configurable expiry
        domain: isProduction ? process.env.COOKIE_DOMAIN : undefined
      });

      // Redirect to dashboard without token in URL
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard?sso=success`);

    } catch (msalError) {
      // Use enhanced MSAL error handling
      const { userMessage, errorCode, shouldRedirect } = SSOErrorHandler.handleMSALError(msalError, 'token exchange');

      SSOErrorHandler.logSecurityEvent('sso_token_exchange', false, {
        organizationId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        error: errorCode
      });

      const redirectUrl = SSOErrorHandler.createErrorRedirectUrl(
        process.env.FRONTEND_URL || 'http://localhost:3001',
        errorCode,
        userMessage
      );

      return res.redirect(redirectUrl);
    }
  } catch (error) {
    const { organizationId } = req.params;

    // Enhanced error logging and handling
    SSOErrorHandler.logSecurityEvent('sso_callback', false, {
      organizationId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      error: (error as Error)?.message || 'Unknown callback error'
    });

    // Handle database connection errors specifically
    if ((error as any)?.name?.includes('Sequelize')) {
      const redirectUrl = SSOErrorHandler.createErrorRedirectUrl(
        process.env.FRONTEND_URL || 'http://localhost:3001',
        SSOErrorCodes.DATABASE_ERROR,
        'Service temporarily unavailable. Please try again later.'
      );
      return res.redirect(redirectUrl);
    }

    // Generic internal error
    const redirectUrl = SSOErrorHandler.createErrorRedirectUrl(
      process.env.FRONTEND_URL || 'http://localhost:3001',
      SSOErrorCodes.INTERNAL_ERROR,
      'Authentication failed. Please try again.'
    );

    return res.redirect(redirectUrl);
  }
};

/**
 * Get SSO login URL for organization
 */
export const getSSOLoginUrl = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    // Check if SSO is enabled for this organization
    const ssoConfig = await SSOConfigurationModel.findOne({
      where: {
        organization_id: organizationId,
        is_enabled: true
      }
    });

    if (!ssoConfig) {
      return res.status(404).json({
        success: false,
        error: 'SSO is not enabled for this organization'
      });
    }

    return res.json({
      success: true,
      data: {
        ssoEnabled: true,
        loginUrl: `/api/sso-auth/${organizationId}/login`
      }
    });
  } catch (error) {
    console.error('Error getting SSO login URL:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get SSO login URL'
    });
  }
};

/**
 * Check SSO availability for organization ID or domain
 * GET /api/sso-auth/check-availability?organizationId={id}&domain={domain}
 */
export const checkSSOAvailability = async (req: Request, res: Response) => {
  try {
    const { organizationId, domain } = req.query;

    // Input validation
    if (!organizationId && !domain) {
      return res.status(400).json({
        available: false,
        error: 'Either organizationId or domain parameter is required'
      });
    }

    let organization = null;

    // Find organization by ID or domain
    if (organizationId) {
      // Validate organization ID format
      if (!/^\d+$/.test(organizationId as string)) {
        return res.status(400).json({
          available: false,
          error: 'Invalid organization ID format'
        });
      }

      organization = await OrganizationModel.findOne({
        where: { id: parseInt(organizationId as string) }
      });
    } else if (domain) {
      // Validate domain format
      const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!domainRegex.test(domain as string)) {
        return res.status(400).json({
          available: false,
          error: 'Invalid domain format'
        });
      }

      // Find organization by domain in their email domains
      // This assumes organizations have associated email domains
      // You may need to adjust this query based on your organization model
      organization = await OrganizationModel.findOne({
        where: {
          // This might need adjustment based on how domains are stored
          // For now, we'll use a simple name-based lookup
          name: {
            [Op.iLike]: `%${domain}%`
          }
        }
      });
    }

    if (!organization) {
      return res.status(404).json({
        available: false,
        error: 'Organization not found'
      });
    }

    // Check if organization has SSO enabled
    const ssoConfig = await SSOConfigurationModel.findOne({
      where: {
        organization_id: organization.id,
        is_enabled: true
      }
    });

    if (!ssoConfig) {
      return res.status(200).json({
        available: false,
        organizationId: organization.id,
        organizationName: organization.name,
        message: 'SSO not configured for this organization'
      });
    }

    // Return SSO availability info
    return res.status(200).json({
      available: true,
      organizationId: organization.id,
      organizationName: organization.name,
      providerType: 'azure_ad',
      loginUrl: `/api/sso-auth/${organization.id}/login`
    });

  } catch (error) {
    console.error('Error checking SSO availability:', error);
    return res.status(500).json({
      available: false,
      error: 'Failed to check SSO availability'
    });
  }
};

/**
 * Get organization SSO configuration details
 * GET /api/sso-auth/:organizationId/config
 */
/**
 * Check user's organization and SSO availability by email
 * GET /api/sso-auth/check-user-organization?email={email}
 */
export const checkUserOrganization = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;

    // Enhanced email validation
    if (!email || typeof email !== 'string') {
      return SSOErrorHandler.handleValidationError(
        res,
        ['Email parameter is required'],
        'Email is required'
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email) || email.length > 320) {
      return SSOErrorHandler.handleValidationError(
        res,
        ['Invalid email format or email too long (max 320 characters)'],
        'Invalid email format'
      );
    }

    // Find user by email
    const user = await UserModel.findOne({
      where: { email: email.toLowerCase().trim() },
      attributes: ['id', 'email', 'organization_id', 'sso_enabled']
    });

    if (!user) {
      // For new users, try to find an organization by email domain
      // that has SSO enabled and allows this email domain
      const emailDomain = email.split('@')[1]?.toLowerCase();

      if (emailDomain) {
        // Find organizations with SSO configurations that allow this email domain
        const ssoConfigs = await SSOConfigurationModel.findAll({
          where: {
            is_enabled: true
          },
          include: [{
            model: OrganizationModel,
            as: 'organization',
            attributes: ['id', 'name']
          }],
          attributes: ['organization_id', 'allowed_domains', 'auth_method_policy', 'azure_tenant_id', 'azure_client_id', 'cloud_environment']
        });

        // Check if any SSO configuration allows this email domain
        for (const ssoConfig of ssoConfigs) {
          if (ssoConfig.isEmailDomainAllowed(email)) {
            const organization = (ssoConfig as any).organization;
            return res.status(200).json({
              success: true,
              data: {
                userExists: false,
                hasOrganization: true,
                ssoAvailable: true,
                canCreateUser: true,
                organization: {
                  id: organization.id,
                  name: organization.name
                },
                sso: {
                  tenantId: ssoConfig.getAzureAdConfig()?.tenant_id || null,
                  loginUrl: `/api/sso-auth/${organization.id}/login`
                },
                authMethodPolicy: ssoConfig.auth_method_policy,
                preferredAuthMethod: 'sso',
                message: 'New user can be created via SSO for this organization'
              }
            });
          }
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          userExists: false,
          hasOrganization: false,
          ssoAvailable: false,
          authMethodPolicy: 'both',
          message: 'User not found and email domain not allowed for any SSO organization'
        }
      });
    }

    // Check if user has an organization
    if (!user.organization_id) {
      return res.status(200).json({
        success: true,
        data: {
          userExists: true,
          hasOrganization: false,
          ssoAvailable: false,
          authMethodPolicy: 'both',
          message: 'User not associated with any organization'
        }
      });
    }

    // Fetch organization and SSO configuration for existing user
    const organization = await OrganizationModel.findByPk(user.organization_id, {
      attributes: ['id', 'name']
    });

    if (!organization) {
      return res.status(200).json({
        success: true,
        data: {
          userExists: true,
          hasOrganization: false,
          ssoAvailable: false,
          authMethodPolicy: 'both',
          message: 'User organization not found'
        }
      });
    }

    const ssoConfig = await SSOConfigurationModel.findOne({
      where: {
        organization_id: user.organization_id,
        is_enabled: true
      },
      attributes: ['azure_tenant_id', 'azure_client_id', 'cloud_environment', 'is_enabled', 'auth_method_policy']
    });

    const ssoAvailable = !!(ssoConfig && ssoConfig.is_enabled);

    res.status(200).json({
      success: true,
      data: {
        userExists: true,
        hasOrganization: true,
        ssoAvailable,
        organization: {
          id: organization.id,
          name: organization.name
        },
        sso: ssoAvailable ? {
          tenantId: ssoConfig.getAzureAdConfig()?.tenant_id || null,
          loginUrl: `/api/sso-auth/${organization.id}/login`
        } : null,
        authMethodPolicy: ssoConfig ? ssoConfig.auth_method_policy : 'both',
        preferredAuthMethod: ssoAvailable && user.sso_enabled ? 'sso' : 'password'
      }
    });

  } catch (error) {
    // Use enhanced error handling for database operations
    return SSOErrorHandler.handleDatabaseError(
      res,
      error,
      'user organization lookup'
    );
  }
};

/**
 * Get available SSO providers for login page
 * GET /api/sso-auth/available-providers
 */
export const getAvailableSSOProviders = async (req: Request, res: Response) => {
  try {
    // Find all organizations with enabled SSO configurations
    const ssoConfigs = await SSOConfigurationModel.findAll({
      where: {
        is_enabled: true
      },
      include: [{
        model: OrganizationModel,
        as: 'organization',
        attributes: ['id', 'name']
      }],
      attributes: ['organization_id', 'auth_method_policy']
    });

    // Group by provider type and return available providers
    const providers = ssoConfigs.map(config => ({
      organizationId: config.organization_id,
      organizationName: (config as any).organization?.name || 'Unknown',
      providerType: 'azure_ad',
      authMethodPolicy: config.auth_method_policy,
      loginUrl: `/api/sso-auth/${config.organization_id}/login`
    }));

    res.status(200).json({
      success: true,
      providers,
      hasAvailableSSO: providers.length > 0
    });

  } catch (error) {
    console.error('Error getting available SSO providers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available SSO providers'
    });
  }
};

/**
 * Discover organization for new user by email domain
 * GET /api/sso-auth/discover-organization?email={email}
 */
export const discoverOrganizationForNewUser = async (req: Request, res: Response) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (!emailDomain) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract domain from email'
      });
    }

    // Find organizations with SSO configurations that allow this email domain
    const ssoConfigs = await SSOConfigurationModel.findAll({
      where: {
        is_enabled: true
      },
      include: [{
        model: OrganizationModel,
        as: 'organization',
        attributes: ['id', 'name']
      }],
      attributes: ['organization_id', 'allowed_domains', 'auth_method_policy', 'provider_config']
    });

    const matchingOrganizations = [];

    // Check if any SSO configuration allows this email domain
    for (const ssoConfig of ssoConfigs) {
      if (ssoConfig.isEmailDomainAllowed(email)) {
        const organization = (ssoConfig as any).organization;
        const azureConfig = ssoConfig.getAzureAdConfig();

        matchingOrganizations.push({
          organizationId: organization.id,
          organizationName: organization.name,
          authMethodPolicy: ssoConfig.auth_method_policy,
          ssoLoginUrl: `/api/sso-auth/${organization.id}/login`,
          tenantId: azureConfig?.tenant_id || null,
          allowedDomains: ssoConfig.allowed_domains
        });
      }
    }

    if (matchingOrganizations.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          found: false,
          emailDomain,
          message: 'No organizations found that allow this email domain for SSO'
        }
      });
    }

    // If multiple organizations match, return all of them
    // Frontend can present options to user or use business logic to select
    return res.status(200).json({
      success: true,
      data: {
        found: true,
        emailDomain,
        organizations: matchingOrganizations,
        recommendedAction: matchingOrganizations.length === 1
          ? 'auto_redirect'
          : 'show_selection',
        message: matchingOrganizations.length === 1
          ? `Found organization: ${matchingOrganizations[0].organizationName}`
          : `Found ${matchingOrganizations.length} organizations that allow this email domain`
      }
    });

  } catch (error) {
    console.error('Error discovering organization for new user:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to discover organization for email'
    });
  }
};

/**
 * Get organization SSO configuration details
 * GET /api/sso-auth/:organizationId/config
 */
export const getOrganizationSSOConfig = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    // Validate organization ID
    if (!/^\d+$/.test(organizationId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid organization ID format'
      });
    }

    // Find organization
    const organization = await OrganizationModel.findOne({
      where: { id: parseInt(organizationId) }
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Get SSO configuration (Azure AD provider)
    const ssoConfig = await SSOConfigurationModel.findOne({
      where: {
        organization_id: parseInt(organizationId),
        
      }
    });

    if (!ssoConfig) {
      return res.status(404).json({
        success: false,
        error: 'SSO configuration not found for this organization'
      });
    }

    // Return safe configuration data (no secrets)
    return res.status(200).json({
      success: true,
      config: {
        organizationId: ssoConfig.organization_id,
        isEnabled: ssoConfig.is_enabled,
        provider: 'azure_ad',
        cloudEnvironment: ssoConfig.getAzureAdConfig()?.cloud_environment || 'AzurePublic',
        allowedDomains: ssoConfig.allowed_domains || [],
        defaultRoleId: ssoConfig.default_role_id || 2,
        loginUrl: ssoConfig.is_enabled ? `/api/sso-auth/${organizationId}/login` : null,
        createdAt: ssoConfig.created_at,
        updatedAt: ssoConfig.updated_at,
        organizationName: organization.name
      }
    });

  } catch (error) {
    console.error('Error getting organization SSO config:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get SSO configuration'
    });
  }
};