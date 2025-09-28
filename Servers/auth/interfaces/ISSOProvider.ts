export interface ISSOConfiguration {
  id?: number;
  organizationId: number;
  providerId: number;
  providerType: SSOProviderType;
  providerConfig: Record<string, any>;
  isEnabled: boolean;
  allowedDomains?: string[];
  defaultRoleId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISSOProvider {
  getProviderType(): SSOProviderType;

  validateConfiguration(config: Record<string, any>): ValidationResult;

  getAuthorizationUrl(
    config: ISSOConfiguration,
    organizationId: string,
    state: string
  ): Promise<string>;

  handleCallback(
    code: string,
    state: string,
    config: ISSOConfiguration
  ): Promise<ISSOUserInfo>;

  refreshToken?(refreshToken: string, config: ISSOConfiguration): Promise<ISSOTokens>;
}

export interface ISSOUserInfo {
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  providerUserId: string;
  additionalClaims?: Record<string, any>;
}

export interface ISSOTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt: Date;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export enum SSOProviderType {
  AZURE_AD = 'azure-ad',
  GOOGLE = 'google',
  OKTA = 'okta',
  SAML = 'saml'
}

export interface SSOStateToken {
  organizationId: string;
  providerId: number;
  nonce: string;
  timestamp: number;
  expiresAt: number;
}