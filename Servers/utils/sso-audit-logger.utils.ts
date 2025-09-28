import logger from '../utils/logger/fileLogger';
import { Request } from 'express';

/**
 * SSO Security Audit Logger
 *
 * Comprehensive logging for SSO security events to ensure proper audit trails
 * for compliance and security monitoring
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

export class SSOAuditLogger {
  /**
   * Extract relevant request metadata for audit logging
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
   * Log SSO login initiation attempt
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
   * Log successful SSO authentication
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
   * Log security violations and suspicious activities
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