import { ConfidentialClientApplication } from '@azure/msal-node';
import {
  ISSOProvider,
  ISSOConfiguration,
  ISSOUserInfo,
  SSOProviderType,
  ValidationResult
} from '../../interfaces/ISSOProvider';
import { SSOValidation } from '../../utils/SSOValidation';
import { SSOError, SSOErrorCode, createSSOError } from '../../utils/SSOErrors';

interface AzureAdConfig {
  azure_client_id: string;
  azure_client_secret: string;
  azure_tenant_id: string;
  azure_cloud_environment?: 'public' | 'government' | 'china' | 'germany';
}

export class AzureAdProvider implements ISSOProvider {
  private static readonly SCOPES = ['openid', 'profile', 'email'];
  private static readonly CLOUD_ENVIRONMENTS = {
    public: 'https://login.microsoftonline.com',
    government: 'https://login.microsoftonline.us',
    china: 'https://login.partner.microsoftonline.cn',
    germany: 'https://login.microsoftonline.de'
  };

  getProviderType(): SSOProviderType {
    return SSOProviderType.AZURE_AD;
  }

  validateConfiguration(config: Record<string, any>): ValidationResult {
    return SSOValidation.validateAzureAdConfiguration(config);
  }

  async getAuthorizationUrl(
    config: ISSOConfiguration,
    organizationId: string,
    state: string
  ): Promise<string> {
    const azureConfig = this.getAzureConfig(config);
    const cca = this.createMsalClient(azureConfig);

    const authCodeUrlParameters = {
      scopes: AzureAdProvider.SCOPES,
      redirectUri: this.getRedirectUri(organizationId),
      state: state
    };

    try {
      return await cca.getAuthCodeUrl(authCodeUrlParameters);
    } catch (error) {
      throw createSSOError(SSOErrorCode.AZURE_AD_ERROR, {
        reason: 'Failed to generate authorization URL',
        error: error instanceof Error ? error.message : 'Unknown error',
        organizationId
      });
    }
  }

  async handleCallback(
    code: string,
    state: string,
    config: ISSOConfiguration
  ): Promise<ISSOUserInfo> {
    const validatedCode = SSOValidation.validateAuthCode(code);
    const azureConfig = this.getAzureConfig(config);
    const cca = this.createMsalClient(azureConfig);

    const tokenRequest = {
      code: validatedCode,
      scopes: AzureAdProvider.SCOPES,
      redirectUri: this.getRedirectUri(config.organizationId.toString())
    };

    try {
      const response = await cca.acquireTokenByCode(tokenRequest);

      if (!response || !response.account) {
        throw createSSOError(SSOErrorCode.TOKEN_EXCHANGE_FAILED, {
          reason: 'No account information received from Azure AD',
          organizationId: config.organizationId
        });
      }

      return this.extractUserInfo(response.account);
    } catch (error) {
      if (error instanceof SSOError) {
        throw error;
      }

      throw createSSOError(SSOErrorCode.AZURE_AD_ERROR, {
        reason: 'Token exchange failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        organizationId: config.organizationId
      });
    }
  }

  private getAzureConfig(config: ISSOConfiguration): AzureAdConfig {
    const validation = this.validateConfiguration(config.providerConfig);
    if (!validation.isValid) {
      throw createSSOError(SSOErrorCode.INVALID_CONFIGURATION, {
        reason: 'Invalid Azure AD configuration',
        errors: validation.errors
      });
    }

    return config.providerConfig as AzureAdConfig;
  }

  private createMsalClient(azureConfig: AzureAdConfig): ConfidentialClientApplication {
    const authority = this.getAuthority(azureConfig);

    const msalConfig = {
      auth: {
        clientId: azureConfig.azure_client_id,
        clientSecret: azureConfig.azure_client_secret,
        authority: authority
      }
    };

    try {
      return new ConfidentialClientApplication(msalConfig);
    } catch (error) {
      throw createSSOError(SSOErrorCode.AZURE_AD_ERROR, {
        reason: 'Failed to create MSAL client',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private getAuthority(azureConfig: AzureAdConfig): string {
    const cloudEnv = azureConfig.azure_cloud_environment || 'public';
    const baseUrl = AzureAdProvider.CLOUD_ENVIRONMENTS[cloudEnv];

    if (!baseUrl) {
      throw createSSOError(SSOErrorCode.INVALID_CONFIGURATION, {
        reason: 'Invalid Azure cloud environment',
        environment: cloudEnv
      });
    }

    return `${baseUrl}/${azureConfig.azure_tenant_id}`;
  }

  private getRedirectUri(organizationId: string): string {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    return `${backendUrl}/api/auth/azure-ad/${organizationId}/callback`;
  }

  private extractUserInfo(account: any): ISSOUserInfo {
    if (!account.username || !account.username.includes('@')) {
      throw createSSOError(SSOErrorCode.INVALID_USER_INFO, {
        reason: 'Invalid or missing email in Azure AD response'
      });
    }

    const email = account.username;

    // Extract name information
    const displayName = account.name || '';
    const nameParts = displayName.split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Validate extracted information
    const emailValidation = SSOValidation.validateEmail(email);
    if (!emailValidation.isValid) {
      throw createSSOError(SSOErrorCode.INVALID_USER_INFO, {
        reason: 'Invalid email format from Azure AD',
        email: email,
        errors: emailValidation.errors
      });
    }

    const firstNameValidation = SSOValidation.validateUserName(firstName, 'firstName');
    const lastNameValidation = SSOValidation.validateUserName(lastName, 'lastName');

    if (!firstNameValidation.isValid || !lastNameValidation.isValid) {
      // Log warning but don't fail - use sanitized versions
      console.warn('Invalid name information from Azure AD', {
        email,
        firstNameErrors: firstNameValidation.errors,
        lastNameErrors: lastNameValidation.errors
      });
    }

    return {
      providerId: account.homeAccountId?.split('.')[0] || account.localAccountId || email,
      email: email,
      firstName: SSOValidation.sanitizeDisplayName(firstName),
      lastName: SSOValidation.sanitizeDisplayName(lastName),
      displayName: SSOValidation.sanitizeDisplayName(displayName),
      providerUserId: account.homeAccountId?.split('.')[0] || account.localAccountId || email,
      additionalClaims: {
        tenantId: account.tenantId,
        homeAccountId: account.homeAccountId,
        localAccountId: account.localAccountId,
        environment: account.environment
      }
    };
  }

  /**
   * Get the Azure AD base URL for the specified cloud environment
   */
  static getAzureAdBaseUrl(cloudEnvironment: string = 'public'): string {
    return AzureAdProvider.CLOUD_ENVIRONMENTS[cloudEnvironment as keyof typeof AzureAdProvider.CLOUD_ENVIRONMENTS]
      || AzureAdProvider.CLOUD_ENVIRONMENTS.public;
  }
}

export default AzureAdProvider;