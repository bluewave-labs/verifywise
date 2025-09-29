/**
 * @fileoverview SSO Error Handler Utilities
 *
 * Comprehensive error handling system for Azure AD Single Sign-On operations.
 * Provides standardized error responses, security-aware messaging, audit logging,
 * and specialized MSAL (Microsoft Authentication Library) error categorization.
 *
 * This utility centralizes error handling across the SSO system to ensure:
 * - Consistent error response formats for API endpoints
 * - Security-conscious error messaging that doesn't expose sensitive information
 * - Comprehensive audit trails for security monitoring
 * - Developer-friendly error categorization and debugging
 * - Proper HTTP status codes aligned with OAuth 2.0 and REST standards
 *
 * Security Features:
 * - Sanitized error messages prevent information disclosure
 * - Email masking in logs for privacy protection
 * - Security event logging for audit and monitoring
 * - MSAL-specific error handling with redirect guidance
 * - Database error categorization with appropriate user messaging
 *
 * Error Categories:
 * - Configuration errors (invalid/missing SSO setup)
 * - Authentication errors (credential validation, token exchange)
 * - Authorization errors (access denied, insufficient permissions)
 * - User management errors (creation, validation, domain restrictions)
 * - System errors (database, external services, validation)
 *
 * @author VerifyWise Development Team
 * @since 2024-09-28
 * @version 1.0.0
 * @see {@link https://tools.ietf.org/html/rfc6749} OAuth 2.0 Error Responses
 * @see {@link https://docs.microsoft.com/en-us/azure/active-directory/develop/reference-aadsts-error-codes} Azure AD Error Codes
 *
 * @module utils/sso-error-handler
 */

import { Request, Response } from 'express';

/**
 * Standardized SSO error response interface
 *
 * Ensures consistent error response format across all SSO endpoints,
 * providing structured error information for frontend handling and debugging.
 *
 * @interface SSOErrorResponse
 * @property {false} success - Always false to indicate error state
 * @property {string} error - Human-readable error message for display
 * @property {string} [errorCode] - Machine-readable error code for programmatic handling
 * @property {string[]} [details] - Additional error details (e.g., validation errors)
 * @property {string} timestamp - ISO timestamp of error occurrence
 * @property {string} [requestId] - Unique request identifier for tracing
 *
 * @example
 * ```json
 * {
 *   "success": false,
 *   "error": "Invalid Azure tenant ID format",
 *   "errorCode": "VALIDATION_ERROR",
 *   "details": ["Tenant ID must be a valid GUID"],
 *   "timestamp": "2024-09-28T10:30:00.000Z",
 *   "requestId": "req_abc123"
 * }
 * ```
 */
export interface SSOErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
  details?: string[];
  timestamp: string;
  requestId?: string;
}

/**
 * Comprehensive SSO error codes for systematic error categorization
 *
 * Provides machine-readable error codes that enable:
 * - Programmatic error handling in frontend applications
 * - Systematic logging and monitoring
 * - Error analytics and debugging
 * - Consistent error responses across all SSO endpoints
 *
 * Error categories are organized by functional area for easy maintenance
 * and ensure proper HTTP status code mapping.
 *
 * @enum {string} SSOErrorCodes
 *
 * @example
 * ```typescript
 * // In controller error handling
 * return SSOErrorHandler.handleValidationError(
 *   res,
 *   ['Invalid tenant ID format'],
 *   'Configuration validation failed'
 * );
 * ```
 */
export enum SSOErrorCodes {
  // Configuration Errors (HTTP 400/500)
  /** SSO configuration is invalid or malformed */
  INVALID_SSO_CONFIG = 'INVALID_SSO_CONFIG',
  /** SSO configuration not found for organization */
  MISSING_SSO_CONFIG = 'MISSING_SSO_CONFIG',
  /** Client secret encryption/decryption failed */
  ENCRYPTION_ERROR = 'ENCRYPTION_ERROR',

  // Authentication Errors (HTTP 401)
  /** User credentials are invalid or expired */
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  /** OAuth token exchange with Azure AD failed */
  TOKEN_EXCHANGE_FAILED = 'TOKEN_EXCHANGE_FAILED',
  /** OAuth state token validation failed (CSRF protection) */
  INVALID_STATE_TOKEN = 'INVALID_STATE_TOKEN',

  // Authorization Errors (HTTP 403/404)
  /** User access denied by Azure AD or organization policy */
  ACCESS_DENIED = 'ACCESS_DENIED',
  /** User lacks required permissions for operation */
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  /** Organization not found or inaccessible */
  ORG_NOT_FOUND = 'ORG_NOT_FOUND',

  // User Management Errors (HTTP 400/409)
  /** Failed to create user account after SSO authentication */
  USER_CREATION_FAILED = 'USER_CREATION_FAILED',
  /** User not found in system or Azure AD */
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  /** User email domain not allowed by organization policy */
  EMAIL_DOMAIN_NOT_ALLOWED = 'EMAIL_DOMAIN_NOT_ALLOWED',

  // System Errors (HTTP 500/503)
  /** Database operation failed */
  DATABASE_ERROR = 'DATABASE_ERROR',
  /** External service (Azure AD) unavailable or returned error */
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  /** Request validation failed */
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  /** Unexpected internal server error */
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/**
 * SSO Error Handler Class
 *
 * Central error handling utility for all SSO operations. Provides consistent
 * error responses, security-aware messaging, and comprehensive logging.
 * All methods are static for easy access throughout the SSO system.
 *
 * Key Features:
 * - Standardized error response format across all endpoints
 * - Security-conscious error messaging (no sensitive data exposure)
 * - MSAL-specific error categorization and handling
 * - Database error classification with appropriate HTTP status codes
 * - Comprehensive audit logging for security monitoring
 * - Email masking for privacy protection in logs
 *
 * @class SSOErrorHandler
 * @static
 *
 * @example
 * ```typescript
 * // In SSO controller
 * try {
 *   await performSSOOperation();
 * } catch (error) {
 *   return SSOErrorHandler.handleInternalError(res, error, 'SSO authentication');
 * }
 * ```
 */
export class SSOErrorHandler {
  /**
   * Creates a standardized error response object
   *
   * Ensures consistent error structure across all SSO endpoints,
   * making it easier for frontend applications to handle errors
   * and for developers to debug issues.
   *
   * @static
   * @param {string} error - Human-readable error message for display
   * @param {SSOErrorCodes} [errorCode] - Machine-readable error code
   * @param {string[]} [details] - Additional error details (e.g., validation errors)
   * @param {string} [requestId] - Unique request identifier for tracing
   * @returns {SSOErrorResponse} Standardized error response object
   *
   * @example
   * ```typescript
   * const errorResponse = SSOErrorHandler.createErrorResponse(
   *   'Invalid Azure tenant ID format',
   *   SSOErrorCodes.VALIDATION_ERROR,
   *   ['Tenant ID must be a valid GUID'],
   *   'req_abc123'
   * );
   * ```
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
   * Handles SSO configuration-related errors
   *
   * Processes errors related to SSO setup, validation, or configuration
   * issues. Provides appropriate user messaging while logging detailed
   * error information for debugging.
   *
   * @static
   * @param {Response} res - Express response object
   * @param {any} originalError - Original error object with details
   * @param {string} [userMessage='SSO configuration error'] - User-friendly error message
   * @param {SSOErrorCodes} [errorCode=INVALID_SSO_CONFIG] - Error code for categorization
   * @returns {Response} Express response with error details
   *
   * @security
   * - Sanitizes error messages to prevent sensitive information disclosure
   * - Logs full error details only in development environment
   * - Returns appropriate HTTP 500 status for configuration errors
   *
   * @example
   * ```typescript
   * try {
   *   await validateSSOConfig(config);
   * } catch (error) {
   *   return SSOErrorHandler.handleConfigurationError(
   *     res,
   *     error,
   *     'Invalid Azure AD configuration',
   *     SSOErrorCodes.INVALID_SSO_CONFIG
   *   );
   * }
   * ```
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
   * Handles database-related errors with appropriate status codes
   *
   * Processes database errors from Sequelize ORM operations, categorizing them
   * by error type and providing appropriate HTTP status codes and user messages.
   * Includes special handling for connection, validation, and constraint errors.
   *
   * @static
   * @param {Response} res - Express response object
   * @param {any} originalError - Sequelize or database error object
   * @param {string} [operation='database operation'] - Description of the operation that failed
   * @returns {Response} Express response with appropriate status code and error details
   *
   * @error_handling
   * - SequelizeConnectionError → 503 Service Unavailable
   * - SequelizeValidationError → 400 Bad Request (with detailed validation errors)
   * - SequelizeUniqueConstraintError → 409 Conflict
   * - Other database errors → 500 Internal Server Error
   *
   * @example
   * ```typescript
   * try {
   *   await SSOConfiguration.create(configData);
   * } catch (error) {
   *   return SSOErrorHandler.handleDatabaseError(res, error, 'SSO configuration creation');
   * }
   * ```
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
   * Handles Microsoft Authentication Library (MSAL) specific errors
   *
   * Processes MSAL errors from Azure AD authentication operations, providing
   * appropriate user messaging and categorization. Returns structured error
   * information that helps determine if user should be redirected to retry authentication.
   *
   * @static
   * @param {any} originalError - MSAL error object from Azure AD operations
   * @param {string} [operation='Azure AD authentication'] - Description of the operation that failed
   * @returns {Object} Error handling result with user message, error code, and redirect guidance
   * @returns {string} returns.userMessage - User-friendly error message
   * @returns {SSOErrorCodes} returns.errorCode - Categorized error code
   * @returns {boolean} returns.shouldRedirect - Whether user should be redirected to retry
   *
   * @msal_error_categories
   * - invalid_grant/expired_token → Token refresh required
   * - invalid_client/unauthorized_client → Configuration error
   * - access_denied/consent_required → Permission issues
   * - interaction_required → Additional authentication needed
   *
   * @example
   * ```typescript
   * try {
   *   const token = await msalClient.acquireTokenSilent(request);
   * } catch (msalError) {
   *   const { userMessage, errorCode, shouldRedirect } =
   *     SSOErrorHandler.handleMSALError(msalError, 'token acquisition');
   *
   *   if (shouldRedirect) {
   *     return res.redirect('/sso/login');
   *   }
   *   return res.status(401).json({ error: userMessage, errorCode });
   * }
   * ```
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
   * Logs security-sensitive SSO operations for audit and monitoring
   *
   * Creates structured audit logs for security events during SSO operations.
   * Masks sensitive information like email addresses while preserving necessary
   * details for security monitoring and compliance purposes.
   *
   * @static
   * @param {string} operation - Description of the security operation performed
   * @param {boolean} success - Whether the operation succeeded or failed
   * @param {Object} details - Security event details
   * @param {number} [details.userId] - User ID if authenticated
   * @param {string} [details.organizationId] - Organization ID for multi-tenant tracking
   * @param {string} [details.email] - User email (will be masked in logs)
   * @param {string} [details.ipAddress] - Client IP address for security tracking
   * @param {string} [details.userAgent] - Client user agent for device tracking
   * @param {string} [details.error] - Error message if operation failed
   * @returns {void}
   *
   * @security
   * - Email addresses are automatically masked (e.g., "j***@example.com")
   * - Full stack traces only logged in development environment
   * - Successful events logged as INFO, failures as WARN for monitoring
   * - Includes ISO timestamp for precise audit trail
   *
   * @example
   * ```typescript
   * // Log successful SSO login
   * SSOErrorHandler.logSecurityEvent('sso_login', true, {
   *   userId: 123,
   *   organizationId: 'org-456',
   *   email: 'user@company.com',
   *   ipAddress: req.ip,
   *   userAgent: req.get('User-Agent')
   * });
   *
   * // Log failed authentication attempt
   * SSOErrorHandler.logSecurityEvent('sso_login_failed', false, {
   *   email: 'attacker@malicious.com',
   *   ipAddress: req.ip,
   *   error: 'Invalid state token'
   * });
   * ```
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
   * Masks email addresses for privacy-compliant logging
   *
   * Converts email addresses to a masked format for audit logs while
   * preserving domain information for security analysis. Ensures compliance
   * with privacy regulations while maintaining useful security information.
   *
   * @private
   * @static
   * @param {string} email - Email address to mask
   * @returns {string} Masked email in format "f***@domain.com"
   *
   * @masking_pattern
   * - Shows first character of local part + asterisks for remaining characters
   * - Preserves full domain for security domain analysis
   * - Returns '[INVALID_EMAIL]' for malformed email addresses
   *
   * @example
   * ```typescript
   * maskEmail('john.doe@company.com')   // Returns: 'j*******@company.com'
   * maskEmail('a@test.org')            // Returns: 'a@test.org'
   * maskEmail('invalid-email')         // Returns: '[INVALID_EMAIL]'
   * ```
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