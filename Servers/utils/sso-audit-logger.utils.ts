/**
 * @fileoverview SSO Security Audit Logger Utilities
 *
 * Comprehensive audit logging system for Azure AD Single Sign-On security events.
 * Provides structured logging with security level classification, data masking,
 * and comprehensive event tracking for compliance and security monitoring.
 *
 * This utility ensures that all SSO-related security events are properly logged
 * with appropriate detail levels for:
 * - Security incident investigation and forensics
 * - Compliance auditing (SOC 2, ISO 27001, etc.)
 * - Performance monitoring and analytics
 * - Threat detection and security monitoring
 *
 * Security Features:
 * - Automatic data masking for PII (email, IP addresses) in production
 * - Security level classification (LOW, MEDIUM, HIGH, CRITICAL)
 * - Structured logging with consistent schema for SIEM integration
 * - Request metadata extraction for forensic analysis
 * - Color-coded console output for development debugging
 * - Winston integration for enterprise logging infrastructure
 *
 * Event Categories:
 * - Authentication events (login initiation, success, failure)
 * - Configuration changes (create, update, delete, enable/disable)
 * - Security violations (CSRF attempts, domain validation failures)
 * - Rate limiting events and suspicious activity detection
 * - Azure AD integration events (token exchange, callback processing)
 *
 * Compliance Features:
 * - Immutable audit trail with timestamps
 * - User identification and session tracking
 * - IP address and user agent logging for forensics
 * - Error message logging for troubleshooting
 * - Additional metadata for context preservation
 *
 * @author VerifyWise Development Team
 * @since 2024-09-28
 * @version 1.0.0
 * @see {@link https://owasp.org/www-project-application-security-verification-standard/} OWASP ASVS Logging Requirements
 * @see {@link https://www.nist.gov/privacy-framework} NIST Privacy Framework
 *
 * @module utils/sso-audit-logger
 */

import logger from '../utils/logger/fileLogger';
import { Request } from 'express';

/**
 * SSO audit event structure for comprehensive security logging
 *
 * Defines the standardized schema for all SSO security events, ensuring
 * consistent audit trail format for compliance and security monitoring.
 * All events follow this structure for SIEM integration and forensic analysis.
 *
 * @interface SSOAuditEvent
 * @property {string} event_type - Specific type of SSO event (e.g., 'SSO_LOGIN_INITIATION')
 * @property {string} organization_id - Organization identifier for multi-tenant isolation
 * @property {string} [user_id] - Internal user ID if user is authenticated
 * @property {string} [user_email] - User email address (masked in production)
 * @property {string} ip_address - Client IP address (partially masked in production)
 * @property {string} [user_agent] - Client user agent string for device identification
 * @property {string} [session_id] - Session identifier for request correlation
 * @property {string} [azure_object_id] - Azure AD object ID for user correlation
 * @property {boolean} success - Whether the operation succeeded or failed
 * @property {string} [error_message] - Error description if operation failed
 * @property {'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'} security_level - Security risk classification
 * @property {Record<string, any>} [additional_data] - Event-specific metadata
 * @property {string} timestamp - ISO 8601 timestamp of the event
 *
 * @example
 * ```typescript
 * const auditEvent: SSOAuditEvent = {
 *   event_type: 'SSO_USER_AUTHENTICATED',
 *   organization_id: '123',
 *   user_id: '456',
 *   user_email: 'user@company.com',
 *   ip_address: '192.168.1.100',
 *   user_agent: 'Mozilla/5.0...',
 *   azure_object_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
 *   success: true,
 *   security_level: 'LOW',
 *   timestamp: '2024-09-28T10:30:00.000Z'
 * };
 * ```
 */
export interface SSOAuditEvent {
  event_type: string;
  organization_id: string;
  user_id?: string;
  user_email?: string;
  ip_address: string;
  user_agent?: string;
  session_id?: string;
  azure_object_id?: string;
  success: boolean;
  error_message?: string;
  security_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  additional_data?: Record<string, any>;
  timestamp: string;
}

/**
 * SSO Security Audit Logger Class
 *
 * Comprehensive audit logging system for SSO security events with automatic
 * data masking, security level classification, and structured event tracking.
 * Provides standardized logging methods for all SSO operations.
 *
 * Key Features:
 * - Automatic PII masking in production environments
 * - Security level classification for event prioritization
 * - Structured JSON logging for SIEM integration
 * - Request metadata extraction for forensic analysis
 * - Color-coded console output for development debugging
 * - Winston logger integration for enterprise logging
 *
 * Security Levels:
 * - LOW: Normal operations (successful login, token refresh)
 * - MEDIUM: Important events (callback processing, new user creation)
 * - HIGH: Security concerns (authentication failures, config changes)
 * - CRITICAL: Security violations (CSRF attempts, unauthorized access)
 *
 * @class SSOAuditLogger
 * @static
 *
 * @example
 * ```typescript
 * // Log successful authentication
 * SSOAuditLogger.logSuccessfulAuthentication(
 *   req, '123', '456', 'user@company.com', 'azure-obj-id'
 * );
 *
 * // Log security violation
 * SSOAuditLogger.logSecurityViolation(
 *   req, '123', 'CSRF_ATTEMPT', 'Invalid state token detected'
 * );
 * ```
 */
export class SSOAuditLogger {
  /**
   * Extracts relevant request metadata for comprehensive audit logging
   *
   * Gathers forensic information from HTTP requests including client identification,
   * session tracking, and network information for security investigation purposes.
   * Handles missing metadata gracefully with fallback values.
   *
   * @private
   * @static
   * @param {Request} req - Express request object
   * @returns {Object} Request metadata for audit logging
   * @returns {string} returns.ip_address - Client IP address (with fallbacks)
   * @returns {string} [returns.user_agent] - Client user agent string
   * @returns {string} [returns.session_id] - Session identifier if available
   *
   * @security
   * - IP address detection with multiple fallback sources
   * - Safe type casting for session ID extraction
   * - Graceful handling of missing headers
   *
   * @example
   * ```typescript
   * const metadata = SSOAuditLogger.extractRequestMetadata(req);
   * // Returns: { ip_address: '192.168.1.100', user_agent: 'Mozilla/5.0...', session_id: 'sess_123' }
   * ```
   */
  private static extractRequestMetadata(req: Request): {
    ip_address: string;
    user_agent?: string;
    session_id?: string;
  } {
    return {
      ip_address: req.ip || req.connection.remoteAddress || 'unknown',
      user_agent: req.get('User-Agent'),
      session_id: (req as any).sessionID,
    };
  }

  /**
   * Core audit logging function
   */
  private static logAuditEvent(event: SSOAuditEvent): void {
    const maskedEvent = this.maskSensitiveData(event);

    // Log to Winston with structured format
    logger.info(`SSO_AUDIT: ${JSON.stringify(maskedEvent)}`, {
      component: 'SSO_AUDIT',
      security_level: event.security_level,
      event_type: event.event_type,
      organization_id: event.organization_id,
      timestamp: event.timestamp
    });

    // Console log for development with color coding
    if (process.env.NODE_ENV !== 'production') {
      const color = this.getLogColor(event.security_level);
      console.log(`${color}[SSO_AUDIT] ${event.security_level}: ${event.event_type}\x1b[0m`);
      console.log(JSON.stringify(maskedEvent, null, 2));
    }
  }

  /**
   * Get console color for log level
   */
  private static getLogColor(level: string): string {
    switch (level) {
      case 'CRITICAL': return '\x1b[41m'; // Red background
      case 'HIGH': return '\x1b[31m'; // Red text
      case 'MEDIUM': return '\x1b[33m'; // Yellow text
      case 'LOW': return '\x1b[36m'; // Cyan text
      default: return '\x1b[0m'; // Reset
    }
  }

  /**
   * Mask sensitive data in audit logs
   */
  private static maskSensitiveData(event: SSOAuditEvent): SSOAuditEvent {
    const masked = { ...event };

    // Mask email address in production
    if (process.env.NODE_ENV === 'production' && masked.user_email) {
      const parts = masked.user_email.split('@');
      if (parts.length === 2) {
        masked.user_email = `${parts[0]}@[DOMAIN]`;
      }
    }

    // Mask IP address in production (keep first 3 octets)
    if (process.env.NODE_ENV === 'production' && masked.ip_address && masked.ip_address.includes('.')) {
      const parts = masked.ip_address.split('.');
      if (parts.length === 4) {
        masked.ip_address = `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
      }
    }

    return masked;
  }

  /**
   * Logs SSO login initiation attempts for security monitoring
   *
   * Records when users begin the SSO authentication process, providing early
   * detection of authentication patterns and potential security issues.
   * Essential for monitoring login frequency and detecting unusual activity.
   *
   * @static
   * @param {Request} req - Express request object for metadata extraction
   * @param {string} organizationId - Organization identifier for multi-tenant tracking
   * @param {boolean} success - Whether login initiation was successful
   * @param {string} [error] - Error message if initiation failed
   * @returns {void}
   *
   * @security_level
   * - LOW: Successful login initiation (normal operation)
   * - MEDIUM: Failed login initiation (potential configuration issues)
   *
   * @example
   * ```typescript
   * // Successful login initiation
   * SSOAuditLogger.logLoginInitiation(req, '123', true);
   *
   * // Failed login initiation
   * SSOAuditLogger.logLoginInitiation(req, '123', false, 'SSO not configured');
   * ```
   */
  static logLoginInitiation(req: Request, organizationId: string, success: boolean, error?: string): void {
    const event: SSOAuditEvent = {
      event_type: 'SSO_LOGIN_INITIATION',
      organization_id: organizationId,
      success,
      error_message: error,
      security_level: success ? 'LOW' : 'MEDIUM',
      timestamp: new Date().toISOString(),
      ...this.extractRequestMetadata(req)
    };

    this.logAuditEvent(event);
  }

  /**
   * Log SSO callback processing
   */
  static logCallbackProcessing(
    req: Request,
    organizationId: string,
    userEmail?: string,
    azureObjectId?: string,
    success: boolean = true,
    error?: string
  ): void {
    const event: SSOAuditEvent = {
      event_type: 'SSO_CALLBACK_PROCESSING',
      organization_id: organizationId,
      user_email: userEmail,
      azure_object_id: azureObjectId,
      success,
      error_message: error,
      security_level: success ? 'MEDIUM' : 'HIGH',
      timestamp: new Date().toISOString(),
      ...this.extractRequestMetadata(req)
    };

    this.logAuditEvent(event);
  }

  /**
   * Logs successful SSO authentication events with user details
   *
   * Records completed SSO authentication including user identification and
   * whether this represents a new user creation. Critical for security
   * monitoring, user onboarding tracking, and access pattern analysis.
   *
   * @static
   * @param {Request} req - Express request object for metadata extraction
   * @param {string} organizationId - Organization identifier for multi-tenant tracking
   * @param {string} userId - Internal user ID from the application database
   * @param {string} userEmail - User email address (will be masked in production)
   * @param {string} azureObjectId - Azure AD object ID for correlation
   * @param {boolean} [isNewUser=false] - Whether this is a newly created user account
   * @returns {void}
   *
   * @security_level
   * - LOW: Existing user authentication (normal operation)
   * - MEDIUM: New user creation (elevated monitoring for onboarding)
   *
   * @audit_value
   * - Tracks successful authentication for access pattern analysis
   * - Correlates application and Azure AD user identities
   * - Monitors new user onboarding through SSO
   * - Provides session correlation for security investigation
   *
   * @example
   * ```typescript
   * // Existing user authentication
   * SSOAuditLogger.logSuccessfulAuthentication(
   *   req, '123', '456', 'user@company.com', 'azure-object-id-here'
   * );
   *
   * // New user creation through SSO
   * SSOAuditLogger.logSuccessfulAuthentication(
   *   req, '123', '789', 'newuser@company.com', 'azure-object-id-new', true
   * );
   * ```
   */
  static logSuccessfulAuthentication(
    req: Request,
    organizationId: string,
    userId: string,
    userEmail: string,
    azureObjectId: string,
    isNewUser: boolean = false
  ): void {
    const event: SSOAuditEvent = {
      event_type: isNewUser ? 'SSO_USER_CREATED' : 'SSO_USER_AUTHENTICATED',
      organization_id: organizationId,
      user_id: userId,
      user_email: userEmail,
      azure_object_id: azureObjectId,
      success: true,
      security_level: isNewUser ? 'MEDIUM' : 'LOW',
      additional_data: { is_new_user: isNewUser },
      timestamp: new Date().toISOString(),
      ...this.extractRequestMetadata(req)
    };

    this.logAuditEvent(event);
  }

  /**
   * Log SSO authentication failure
   */
  static logAuthenticationFailure(
    req: Request,
    organizationId: string,
    reason: string,
    userEmail?: string
  ): void {
    const event: SSOAuditEvent = {
      event_type: 'SSO_AUTHENTICATION_FAILURE',
      organization_id: organizationId,
      user_email: userEmail,
      success: false,
      error_message: reason,
      security_level: 'HIGH',
      timestamp: new Date().toISOString(),
      ...this.extractRequestMetadata(req)
    };

    this.logAuditEvent(event);
  }

  /**
   * Log SSO configuration changes
   */
  static logConfigurationChange(
    req: Request,
    organizationId: string,
    adminUserId: string,
    changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'ENABLE' | 'DISABLE',
    changedFields?: string[]
  ): void {
    const event: SSOAuditEvent = {
      event_type: `SSO_CONFIG_${changeType}`,
      organization_id: organizationId,
      user_id: adminUserId,
      success: true,
      security_level: 'HIGH',
      additional_data: {
        change_type: changeType,
        changed_fields: changedFields
      },
      timestamp: new Date().toISOString(),
      ...this.extractRequestMetadata(req)
    };

    this.logAuditEvent(event);
  }

  /**
   * Logs security violations and suspicious activities with CRITICAL priority
   *
   * Records high-priority security events including CSRF attempts, unauthorized
   * access, and other suspicious activities. These logs trigger immediate alerts
   * and require investigation for potential security incidents.
   *
   * @static
   * @param {Request} req - Express request object for metadata extraction
   * @param {string} organizationId - Organization identifier for multi-tenant tracking
   * @param {string} violationType - Type of security violation (e.g., 'CSRF_ATTEMPT')
   * @param {string} description - Detailed description of the security violation
   * @param {string} [userEmail] - User email if known (will be masked in production)
   * @returns {void}
   *
   * @security_level CRITICAL - Requires immediate attention and investigation
   *
   * @violation_types
   * - CSRF_ATTEMPT: Invalid state token or cross-site request forgery
   * - UNAUTHORIZED_ACCESS: Access attempt without proper authorization
   * - SUSPICIOUS_LOGIN_PATTERN: Unusual login behavior or frequency
   * - CONFIGURATION_TAMPERING: Unauthorized SSO configuration changes
   * - TOKEN_MANIPULATION: Invalid or tampered authentication tokens
   *
   * @example
   * ```typescript
   * // Log CSRF attempt
   * SSOAuditLogger.logSecurityViolation(
   *   req, '123', 'CSRF_ATTEMPT', 'Invalid state token detected', 'attacker@evil.com'
   * );
   *
   * // Log unauthorized access attempt
   * SSOAuditLogger.logSecurityViolation(
   *   req, '123', 'UNAUTHORIZED_ACCESS', 'Access attempt to admin endpoint without authorization'
   * );
   * ```
   */
  static logSecurityViolation(
    req: Request,
    organizationId: string,
    violationType: string,
    description: string,
    userEmail?: string
  ): void {
    const event: SSOAuditEvent = {
      event_type: 'SSO_SECURITY_VIOLATION',
      organization_id: organizationId,
      user_email: userEmail,
      success: false,
      error_message: description,
      security_level: 'CRITICAL',
      additional_data: {
        violation_type: violationType,
        description
      },
      timestamp: new Date().toISOString(),
      ...this.extractRequestMetadata(req)
    };

    this.logAuditEvent(event);
  }

  /**
   * Log rate limiting events
   */
  static logRateLimitExceeded(req: Request, organizationId: string, endpointType: string): void {
    const event: SSOAuditEvent = {
      event_type: 'SSO_RATE_LIMIT_EXCEEDED',
      organization_id: organizationId,
      success: false,
      error_message: `Rate limit exceeded for ${endpointType}`,
      security_level: 'MEDIUM',
      additional_data: {
        endpoint_type: endpointType,
        rate_limit_exceeded: true
      },
      timestamp: new Date().toISOString(),
      ...this.extractRequestMetadata(req)
    };

    this.logAuditEvent(event);
  }

  /**
   * Log state token validation failures (CSRF attempts)
   */
  static logStateTokenFailure(req: Request, organizationId: string, reason: string): void {
    const event: SSOAuditEvent = {
      event_type: 'SSO_STATE_TOKEN_FAILURE',
      organization_id: organizationId,
      success: false,
      error_message: reason,
      security_level: 'CRITICAL',
      additional_data: {
        csrf_protection: true,
        validation_failure: reason
      },
      timestamp: new Date().toISOString(),
      ...this.extractRequestMetadata(req)
    };

    this.logAuditEvent(event);
  }

  /**
   * Log domain validation failures
   */
  static logDomainValidationFailure(
    req: Request,
    organizationId: string,
    userEmail: string,
    allowedDomains: string[]
  ): void {
    const event: SSOAuditEvent = {
      event_type: 'SSO_DOMAIN_VALIDATION_FAILURE',
      organization_id: organizationId,
      user_email: userEmail,
      success: false,
      error_message: 'Email domain not allowed for SSO',
      security_level: 'HIGH',
      additional_data: {
        allowed_domains: allowedDomains,
        user_domain: userEmail.split('@')[1]
      },
      timestamp: new Date().toISOString(),
      ...this.extractRequestMetadata(req)
    };

    this.logAuditEvent(event);
  }

  /**
   * Log Azure AD token exchange events
   */
  static logTokenExchange(
    req: Request,
    organizationId: string,
    success: boolean,
    error?: string
  ): void {
    const event: SSOAuditEvent = {
      event_type: 'SSO_TOKEN_EXCHANGE',
      organization_id: organizationId,
      success,
      error_message: error,
      security_level: success ? 'LOW' : 'HIGH',
      additional_data: {
        azure_ad_integration: true
      },
      timestamp: new Date().toISOString(),
      ...this.extractRequestMetadata(req)
    };

    this.logAuditEvent(event);
  }
}

export default SSOAuditLogger;