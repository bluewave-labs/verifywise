/**
 * SSO Error Handler Utility
 *
 * Provides standardized error handling for SSO operations including:
 * - Consistent error response formats
 * - Security-aware error messaging
 * - Proper logging and audit trails
 * - MSAL-specific error categorization
 */

import { Request, Response } from 'express';

export interface SSOErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
  details?: string[];
  timestamp: string;
  requestId?: string;
}

export enum SSOErrorCodes {
  // Configuration Errors
  INVALID_SSO_CONFIG = 'INVALID_SSO_CONFIG',
  MISSING_SSO_CONFIG = 'MISSING_SSO_CONFIG',
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',

  // Authentication Errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXCHANGE_FAILED = 'TOKEN_EXCHANGE_FAILED',
  INVALID_STATE_TOKEN = 'INVALID_STATE_TOKEN',

  // Authorization Errors
  ACCESS_DENIED = 'ACCESS_DENIED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ORG_NOT_FOUND = 'ORG_NOT_FOUND',

  // User Management Errors
  USER_CREATION_FAILED = 'USER_CREATION_FAILED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_DOMAIN_NOT_ALLOWED = 'EMAIL_DOMAIN_NOT_ALLOWED',

  // System Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/**
 * SSO Error Handler Class
 */
export class SSOErrorHandler {
  /**
   * Create a standardized error response
   */
  static createErrorResponse(
    error: string,
    errorCode?: SSOErrorCodes,
    details?: string[],
    requestId?: string
  ): SSOErrorResponse {
    return {
      success: false,
      error,
      errorCode,
      details,
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * Handle and respond to SSO configuration errors
   */
  static handleConfigurationError(
    res: Response,
    originalError: any,
    userMessage: string = 'SSO configuration error',
    errorCode: SSOErrorCodes = SSOErrorCodes.INVALID_SSO_CONFIG
  ): Response {
    console.error('SSO Configuration Error:', {
      message: originalError?.message || 'Unknown error',
      stack: process.env.NODE_ENV !== 'production' ? originalError?.stack : undefined,
      errorCode
    });

    return res.status(500).json(
      this.createErrorResponse(userMessage, errorCode)
    );
  }

  /**
   * Handle database-related errors
   */
  static handleDatabaseError(
    res: Response,
    originalError: any,
    operation: string = 'database operation'
  ): Response {
    console.error(`Database Error during ${operation}:`, {
      message: originalError?.message || 'Unknown database error',
      code: originalError?.code,
      stack: process.env.NODE_ENV !== 'production' ? originalError?.stack : undefined
    });

    // Check for specific database error types
    let userMessage = `Failed to complete ${operation}`;
    let statusCode = 500;

    if (originalError?.name === 'SequelizeConnectionError') {
      userMessage = 'Service temporarily unavailable. Please try again later.';
      statusCode = 503;
    } else if (originalError?.name === 'SequelizeValidationError') {
      userMessage = 'Invalid data provided';
      statusCode = 400;

      return res.status(statusCode).json(
        this.createErrorResponse(
          userMessage,
          SSOErrorCodes.VALIDATION_ERROR,
          originalError.errors?.map((e: any) => e.message) || []
        )
      );
    } else if (originalError?.name === 'SequelizeUniqueConstraintError') {
      userMessage = 'Resource already exists';
      statusCode = 409;
    }

    return res.status(statusCode).json(
      this.createErrorResponse(userMessage, SSOErrorCodes.DATABASE_ERROR)
    );
  }

  /**
   * Handle MSAL (Microsoft Authentication Library) errors
   */
  static handleMSALError(
    originalError: any,
    operation: string = 'Azure AD authentication'
  ): { userMessage: string; errorCode: SSOErrorCodes; shouldRedirect: boolean } {
    console.error(`MSAL Error during ${operation}:`, {
      errorCode: originalError?.errorCode,
      errorMessage: originalError?.errorMessage,
      subError: originalError?.subError,
      correlationId: originalError?.correlationId
    });

    // Categorize MSAL errors
    const errorCode = originalError?.errorCode || originalError?.code || 'unknown';

    switch (errorCode) {
      case 'invalid_grant':
      case 'authorization_pending':
      case 'expired_token':
        return {
          userMessage: 'Authentication session expired. Please try again.',
          errorCode: SSOErrorCodes.TOKEN_EXCHANGE_FAILED,
          shouldRedirect: true
        };

      case 'invalid_client':
      case 'unauthorized_client':
        return {
          userMessage: 'SSO configuration error. Please contact your administrator.',
          errorCode: SSOErrorCodes.INVALID_SSO_CONFIG,
          shouldRedirect: true
        };

      case 'access_denied':
      case 'consent_required':
        return {
          userMessage: 'Access denied. You may not have permission to access this application.',
          errorCode: SSOErrorCodes.ACCESS_DENIED,
          shouldRedirect: true
        };

      case 'interaction_required':
        return {
          userMessage: 'Additional authentication required. Please try again.',
          errorCode: SSOErrorCodes.TOKEN_EXCHANGE_FAILED,
          shouldRedirect: true
        };

      default:
        return {
          userMessage: 'Authentication failed. Please try again.',
          errorCode: SSOErrorCodes.EXTERNAL_SERVICE_ERROR,
          shouldRedirect: true
        };
    }
  }

  /**
   * Handle authentication/authorization errors
   */
  static handleAuthError(
    res: Response,
    originalError: any,
    userMessage: string = 'Authentication failed',
    statusCode: number = 401
  ): Response {
    console.error('Authentication Error:', {
      message: originalError?.message || userMessage,
      stack: process.env.NODE_ENV !== 'production' ? originalError?.stack : undefined
    });

    const errorCode = statusCode === 401
      ? SSOErrorCodes.INVALID_CREDENTIALS
      : SSOErrorCodes.ACCESS_DENIED;

    return res.status(statusCode).json(
      this.createErrorResponse(userMessage, errorCode)
    );
  }

  /**
   * Handle validation errors with detailed feedback
   */
  static handleValidationError(
    res: Response,
    validationErrors: string[],
    userMessage: string = 'Invalid input provided'
  ): Response {
    console.warn('Validation Error:', {
      message: userMessage,
      errors: validationErrors
    });

    return res.status(400).json(
      this.createErrorResponse(
        userMessage,
        SSOErrorCodes.VALIDATION_ERROR,
        validationErrors
      )
    );
  }

  /**
   * Handle generic internal errors
   */
  static handleInternalError(
    res: Response,
    originalError: any,
    operation: string = 'operation',
    userMessage?: string
  ): Response {
    console.error(`Internal Error during ${operation}:`, {
      message: originalError?.message || 'Unknown error',
      stack: process.env.NODE_ENV !== 'production' ? originalError?.stack : undefined
    });

    return res.status(500).json(
      this.createErrorResponse(
        userMessage || `Failed to complete ${operation}`,
        SSOErrorCodes.INTERNAL_ERROR
      )
    );
  }

  /**
   * Create redirect URL with error information for frontend
   */
  static createErrorRedirectUrl(
    baseUrl: string,
    errorCode: SSOErrorCodes,
    userMessage?: string
  ): string {
    const params = new URLSearchParams({
      error: errorCode,
      ...(userMessage && { message: userMessage })
    });

    return `${baseUrl}/login?${params.toString()}`;
  }

  /**
   * Log security-sensitive operations
   */
  static logSecurityEvent(
    operation: string,
    success: boolean,
    details: {
      userId?: number;
      organizationId?: string;
      email?: string;
      ipAddress?: string;
      userAgent?: string;
      error?: string;
    }
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation,
      success,
      userId: details.userId,
      organizationId: details.organizationId,
      email: details.email ? this.maskEmail(details.email) : undefined,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      ...(details.error && { error: details.error })
    };

    if (success) {
      console.info('SSO Security Event:', logEntry);
    } else {
      console.warn('SSO Security Event (Failed):', logEntry);
    }
  }

  /**
   * Mask email for logging (show first char and domain)
   */
  private static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '[INVALID_EMAIL]';

    const maskedLocal = local.length > 1
      ? local[0] + '*'.repeat(local.length - 1)
      : '*';

    return `${maskedLocal}@${domain}`;
  }
}