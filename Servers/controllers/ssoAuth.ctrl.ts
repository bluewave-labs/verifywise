import { Request, Response } from 'express';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { SSOConfigurationModel } from '../domain.layer/models/sso/ssoConfiguration.model';
import { UserModel } from '../domain.layer/models/user/user.model';
import { OrganizationModel } from '../domain.layer/models/organization/organization.model';
import { SSOStateTokenManager } from '../utils/sso-state-token.utils';
import { SSOAuditLogger } from '../utils/sso-audit-logger.utils';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';

/**
 * SSO Authentication Controller
 * Handles Azure AD OAuth flow for SSO authentication
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
 * Initiate SSO login - redirects user to Azure AD
 */
export const initiateSSOLogin = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;

    // Find SSO configuration for the organization
    const ssoConfig = await SSOConfigurationModel.findOne({
      where: {
        organization_id: organizationId,
        is_enabled: true
      }
    });

    if (!ssoConfig) {
      SSOAuditLogger.logAuthenticationFailure(req, organizationId, 'SSO not configured or enabled');
      return res.status(404).json({
        success: false,
        error: 'SSO is not configured or enabled for this organization'
      });
    }

    // Get the decrypted client secret
    const clientSecret = ssoConfig.getDecryptedSecret();
    if (!clientSecret) {
      SSOAuditLogger.logAuthenticationFailure(req, organizationId, 'SSO configuration error - failed to decrypt client secret');
      return res.status(500).json({
        success: false,
        error: 'SSO configuration error'
      });
    }

    // Create MSAL client configuration
    const msalConfig = {
      auth: {
        clientId: ssoConfig.azure_client_id,
        clientSecret: clientSecret,
        authority: `${ssoConfig.getAzureADBaseUrl()}/${ssoConfig.azure_tenant_id}`
      }
    };

    const cca = new ConfidentialClientApplication(msalConfig);

    // Generate secure state token with CSRF protection
    const secureState = SSOStateTokenManager.generateStateToken(organizationId);

    // Define the authorization URL parameters
    const authCodeUrlParameters = {
      scopes: ['openid', 'profile', 'email'],
      redirectUri: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/sso-auth/${organizationId}/callback`,
      state: secureState // Use cryptographically secure state token
    };

    try {
      // Get authorization URL
      const authUrl = await cca.getAuthCodeUrl(authCodeUrlParameters);

      // Log successful login initiation
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
 * Handle SSO callback from Azure AD
 */
export const handleSSOCallback = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { code, state, error: authError } = req.query;

    // Check if Azure AD returned an error
    if (authError) {
      console.error('Azure AD authentication error:', authError);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=sso_failed`);
    }

    // Validate secure state token with CSRF protection
    try {
      const validatedState = SSOStateTokenManager.validateStateToken(state as string, organizationId);
      // SECURITY: Only log in development mode, never expose nonce in production
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Valid state token for organization ${organizationId}, nonce: ${validatedState.nonce}`);
      }
    } catch (error) {
      // SECURITY: Log error details only in development
      if (process.env.NODE_ENV !== 'production') {
        console.error('State token validation failed:', error);
      } else {
        console.error('State token validation failed for organization:', organizationId);
      }
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=invalid_state`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=no_auth_code`);
    }

    // Find SSO configuration
    const ssoConfig = await SSOConfigurationModel.findOne({
      where: {
        organization_id: organizationId,
        is_enabled: true
      }
    });

    if (!ssoConfig) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=sso_not_configured`);
    }

    // Get the decrypted client secret
    const clientSecret = ssoConfig.getDecryptedSecret();
    if (!clientSecret) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=sso_config_error`);
    }

    // Create MSAL client configuration
    const msalConfig = {
      auth: {
        clientId: ssoConfig.azure_client_id,
        clientSecret: clientSecret,
        authority: `${ssoConfig.getAzureADBaseUrl()}/${ssoConfig.azure_tenant_id}`
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
      console.error('MSAL token exchange error:', msalError);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=token_exchange_failed`);
    }
  } catch (error) {
    console.error('Error handling SSO callback:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/login?error=callback_error`);
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

    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // Find user by email and include organization
    const user = await UserModel.findOne({
      where: { email: email.toLowerCase().trim() },
      include: [{
        model: OrganizationModel,
        as: 'organization',
        attributes: ['id', 'name'],
        include: [{
          model: SSOConfigurationModel,
          as: 'ssoConfiguration',
          where: { is_enabled: true },
          required: false,
          attributes: ['azure_tenant_id', 'is_enabled', 'auth_method_policy']
        }]
      }],
      attributes: ['id', 'email', 'organization_id', 'sso_enabled']
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        data: {
          userExists: false,
          hasOrganization: false,
          ssoAvailable: false,
          authMethodPolicy: 'both',
          message: 'User not found'
        }
      });
    }

    if (!user.organization_id || !(user as any).organization) {
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

    const organization = (user as any).organization;
    const ssoConfig = organization.ssoConfiguration;
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
          tenantId: ssoConfig.azure_tenant_id
        } : null,
        authMethodPolicy: ssoConfig ? ssoConfig.auth_method_policy : 'both',
        preferredAuthMethod: ssoAvailable && user.sso_enabled ? 'sso' : 'password'
      }
    });

  } catch (error) {
    console.error('Error checking user organization:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while checking user organization'
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

    // Get SSO configuration
    const ssoConfig = await SSOConfigurationModel.findOne({
      where: {
        organization_id: parseInt(organizationId)
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
        cloudEnvironment: ssoConfig.cloud_environment,
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