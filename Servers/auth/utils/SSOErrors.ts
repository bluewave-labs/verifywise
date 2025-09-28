export enum SSOErrorCode {
  // Configuration Errors
  PROVIDER_NOT_CONFIGURED = 'PROVIDER_NOT_CONFIGURED',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  PROVIDER_DISABLED = 'PROVIDER_DISABLED',

  // Authentication Errors
  INVALID_STATE_TOKEN = 'INVALID_STATE_TOKEN',
  EXPIRED_STATE_TOKEN = 'EXPIRED_STATE_TOKEN',
  INVALID_AUTH_CODE = 'INVALID_AUTH_CODE',
  TOKEN_EXCHANGE_FAILED = 'TOKEN_EXCHANGE_FAILED',

  // User Provisioning Errors
  EMAIL_DOMAIN_NOT_ALLOWED = 'EMAIL_DOMAIN_NOT_ALLOWED',
  INVALID_USER_INFO = 'INVALID_USER_INFO',
  USER_CREATION_FAILED = 'USER_CREATION_FAILED',
  ORGANIZATION_NOT_FOUND = 'ORGANIZATION_NOT_FOUND',

  // Security Errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  INVALID_ORGANIZATION_ACCESS = 'INVALID_ORGANIZATION_ACCESS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Provider Specific Errors
  AZURE_AD_ERROR = 'AZURE_AD_ERROR',
  GOOGLE_ERROR = 'GOOGLE_ERROR',
  OKTA_ERROR = 'OKTA_ERROR'
}

export class SSOError extends Error {
  public readonly code: SSOErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;
  public readonly userMessage: string;

  constructor(
    code: SSOErrorCode,
    message: string,
    userMessage: string,
    statusCode: number = 500,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'SSOError';
    this.code = code;
    this.statusCode = statusCode;
    this.userMessage = userMessage;
    this.isOperational = true;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      statusCode: this.statusCode,
      context: this.context
    };
  }
}

export const SSOErrorMessages = {
  [SSOErrorCode.PROVIDER_NOT_CONFIGURED]: {
    message: 'SSO provider is not configured for this organization',
    userMessage: 'Single Sign-On is not available for your organization. Please contact your administrator.',
    statusCode: 404
  },
  [SSOErrorCode.INVALID_CONFIGURATION]: {
    message: 'SSO provider configuration is invalid',
    userMessage: 'There is an issue with the Single Sign-On configuration. Please contact your administrator.',
    statusCode: 500
  },
  [SSOErrorCode.PROVIDER_DISABLED]: {
    message: 'SSO provider is disabled for this organization',
    userMessage: 'Single Sign-On is currently disabled for your organization. Please contact your administrator.',
    statusCode: 403
  },
  [SSOErrorCode.INVALID_STATE_TOKEN]: {
    message: 'Invalid or missing state token in SSO callback',
    userMessage: 'Authentication failed due to security validation. Please try again.',
    statusCode: 400
  },
  [SSOErrorCode.EXPIRED_STATE_TOKEN]: {
    message: 'State token has expired',
    userMessage: 'Your authentication session has expired. Please try again.',
    statusCode: 400
  },
  [SSOErrorCode.EMAIL_DOMAIN_NOT_ALLOWED]: {
    message: 'User email domain is not in the allowed domains list',
    userMessage: 'Your email domain is not authorized for this organization. Please contact your administrator.',
    statusCode: 403
  },
  [SSOErrorCode.INVALID_USER_INFO]: {
    message: 'Invalid user information received from SSO provider',
    userMessage: 'Unable to retrieve your profile information. Please try again or contact support.',
    statusCode: 400
  },
  [SSOErrorCode.USER_CREATION_FAILED]: {
    message: 'Failed to create user account from SSO information',
    userMessage: 'Unable to create your account. Please contact your administrator.',
    statusCode: 500
  },
  [SSOErrorCode.ORGANIZATION_NOT_FOUND]: {
    message: 'Organization not found or inactive',
    userMessage: 'Organization not found. Please verify the login URL and try again.',
    statusCode: 404
  },
  [SSOErrorCode.INSUFFICIENT_PERMISSIONS]: {
    message: 'User does not have sufficient permissions',
    userMessage: 'You do not have permission to perform this action.',
    statusCode: 403
  },
  [SSOErrorCode.INVALID_ORGANIZATION_ACCESS]: {
    message: 'User does not have access to this organization',
    userMessage: 'You do not have access to this organization. Please contact your administrator.',
    statusCode: 403
  }
};

export function createSSOError(
  code: SSOErrorCode,
  context?: Record<string, any>
): SSOError {
  const errorConfig = SSOErrorMessages[code];
  if (!errorConfig) {
    return new SSOError(
      code,
      'Unknown SSO error occurred',
      'An unexpected error occurred. Please try again.',
      500,
      context
    );
  }

  return new SSOError(
    code,
    errorConfig.message,
    errorConfig.userMessage,
    errorConfig.statusCode,
    context
  );
}