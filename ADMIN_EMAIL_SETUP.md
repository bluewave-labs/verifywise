# VerifyWise Email Service Configuration Guide

## Overview

VerifyWise supports multiple email service providers through a provider abstraction layer, enabling administrators to choose the most suitable email service for their organization. The system includes security enhancements such as TLS enforcement, input validation, and credential rotation for supported providers.

### Current Implementation

The email service includes:

- **Provider Abstraction**: Factory pattern supporting 5 email providers
- **Security Features**: TLS 1.2 enforcement, input validation, path traversal protection
- **Credential Management**: Automatic rotation for AWS SES
- **Connection Management**: Connection pooling and timeout configurations
- **Validation Engine**: Enhanced email address validation with security checks

## Table of Contents

- [Quick Start](#quick-start)
- [Supported Email Providers](#supported-email-providers)
- [Provider Configuration](#provider-configuration)
- [Security Features](#security-features)
- [Troubleshooting](#troubleshooting)
- [Migration Guide](#migration-guide)

## Quick Start

### Prerequisites

Before configuring email services, ensure you have:

- Administrative access to your chosen email provider
- Domain ownership verification (for production deployments)
- Understanding of your organization's security requirements

### Basic Configuration

All email configurations require these core environment variables:

```bash
EMAIL_PROVIDER=resend                    # Choose: resend, smtp, exchange-online, exchange-onprem, amazon-ses
EMAIL_ID=noreply@yourcompany.com        # Must match verified domain in provider
```

### Development Setup (Resend - Recommended)

For development and testing environments:

```bash
EMAIL_PROVIDER=resend
EMAIL_ID=dev-noreply@yourcompany.com
RESEND_API_KEY=re_your_development_api_key
```

**Setup Steps**:
1. Create Resend account at [resend.com](https://resend.com)
2. Verify your sending domain
3. Generate API key from dashboard
4. Configure environment variables

## Supported Email Providers

| Provider | Use Case | Setup Complexity | Enterprise Ready |
|----------|----------|------------------|------------------|
| **Resend** | Development, Small to medium teams | Low | ✅ |
| **Exchange Online** | Microsoft 365 organizations | Medium | ✅ |
| **On-Premises Exchange** | Enterprise with self-hosted Exchange | High | ✅ |
| **Amazon SES** | AWS-based deployments, High volume | Medium | ✅ |
| **Generic SMTP** | Custom servers, Gmail, other providers | Medium | ⚠️ Variable |

## Provider Configuration

### 1. Resend (Recommended for Development)

**Best for**: Development, testing, small to medium deployments

```bash
EMAIL_PROVIDER=resend
EMAIL_ID=noreply@yourcompany.com
RESEND_API_KEY=re_your_api_key_here
```

**Setup Process**:
1. Sign up at [resend.com](https://resend.com)
2. Add and verify your domain
3. Generate API key in dashboard
4. Test with a simple email send

**Pros**: Simple setup, good deliverability, analytics dashboard
**Cons**: Newer service, dependent on their infrastructure

---

### 2. Exchange Online (Office 365)

**Best for**: Organizations using Microsoft 365/Office 365

```bash
EMAIL_PROVIDER=exchange-online
EMAIL_ID=noreply@yourcompany.com
EXCHANGE_ONLINE_USER=serviceaccount@yourcompany.onmicrosoft.com
EXCHANGE_ONLINE_PASS="your-app-password-here"
EXCHANGE_ONLINE_TENANT_ID=your-tenant-id-optional  # Collected but not currently used
```

**Setup Process**:
1. Create dedicated service account in Microsoft 365 admin center
2. Enable modern authentication for the account
3. Generate app password (not regular password)
4. Assign Exchange sending permissions
5. Configure environment variables

**App Password Generation**:
1. Go to Microsoft 365 admin center
2. Navigate to Users → Active users → Select service account
3. Security info → Add method → App password
4. Use generated password (not account password)

**Pros**: Integrated with Microsoft ecosystem, enterprise security
**Cons**: Requires Microsoft 365 subscription, complex permissions

---

### 3. On-Premises Exchange Server

**Best for**: Large enterprises with self-hosted Exchange infrastructure

```bash
EMAIL_PROVIDER=exchange-onprem
EMAIL_ID=noreply@yourcompany.com
EXCHANGE_ONPREM_HOST=mail.yourcompany.com
EXCHANGE_ONPREM_PORT=587
EXCHANGE_ONPREM_USER=serviceaccount
EXCHANGE_ONPREM_PASS="service-account-password"
EXCHANGE_ONPREM_DOMAIN=YOURCOMPANY
EXCHANGE_ONPREM_SECURE=false

# Optional: Custom CA certificate support (with security validation)
EXCHANGE_ALLOW_SELF_SIGNED=false            # Allow self-signed certs in non-production
EXCHANGE_CUSTOM_CA_PATH=/etc/ssl/certs/company-ca.pem  # Path to custom CA certificate
EXCHANGE_CA_ALLOWED_DIR=/etc/ssl/certs       # Allowed directory for certificates
```

**Setup Process**:
1. Create service account in Active Directory
2. Grant "Send As" permissions in Exchange
3. Configure Exchange to allow SMTP authentication
4. Set up TLS certificates (recommended for production)
5. Configure firewall rules for SMTP traffic

**Security Notes**:
- The system includes path traversal protection for custom certificates
- Only `.pem`, `.crt`, `.cer` files allowed in specified directory
- Certificate content validation ensures proper format

**Pros**: Full control over infrastructure, customizable security
**Cons**: Complex setup, requires Exchange administration expertise

---

### 4. Amazon SES

**Best for**: AWS-based applications, high-volume sending, automatic credential management

```bash
EMAIL_PROVIDER=amazon-ses
EMAIL_ID=noreply@yourcompany.com
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=AKIA...
AWS_SES_SECRET_ACCESS_KEY=your-secret-key
AWS_SES_API_VERSION=2010-12-01

# Optional configurations
SES_CONFIGURATION_SET=your-configuration-set
AWS_CREDENTIAL_REFRESH_INTERVAL_MS=3600000  # 1 hour
```

**Setup Process**:
1. Create AWS account and enable SES in chosen region
2. Verify sending domain in SES console
3. Request production access (removes sandbox limitations)
4. Create IAM user with SES permissions
5. Generate access keys for service account

**Required IAM Permissions**:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendRawEmail",
                "ses:GetSendQuota"
            ],
            "Resource": "*"
        }
    ]
}
```

**Credential Rotation**: AWS SES provider supports automatic credential refresh every hour (configurable)

**Pros**: Scalable, cost-effective, automatic credential rotation, AWS integration
**Cons**: Requires AWS account, initial sandbox limitations

---

### 5. Generic SMTP

**Best for**: Custom SMTP servers, Gmail, other email providers

```bash
EMAIL_PROVIDER=smtp
EMAIL_ID=your-email@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS="your-app-password"
SMTP_SECURE=false
```

**Common Provider Settings**:

| Provider | Host | Port | Secure | Notes |
|----------|------|------|--------|-------|
| Gmail | smtp.gmail.com | 587 | false | Requires app password |
| Outlook | smtp-mail.outlook.com | 587 | false | Use account password |
| Yahoo | smtp.mail.yahoo.com | 587 | false | Requires app password |

**Gmail Setup Example**:
1. Enable 2-factor authentication on Gmail account
2. Generate app password (Security → App passwords)
3. Use app password in `SMTP_PASS` (not account password)

**Pros**: Works with any SMTP provider, flexible configuration
**Cons**: Reliability depends on provider, manual setup required

## Security Features

### Implemented Security Enhancements

The email service includes several security features:

#### 1. TLS Enforcement
- **Minimum TLS 1.2** enforced across all providers
- **Strong cipher suites**: `HIGH:!aNULL:!MD5:!3DES`
- **Certificate validation** in production environments

#### 2. Input Validation & Sanitization
Enhanced email validation prevents common attacks:

```typescript
// Examples of validation features
- Email format validation (RFC 5322 compliant)
- Header injection prevention (blocks \r\n characters)
- Dangerous character filtering (blocks <script>, javascript:, etc.)
- Length limits (320 chars for email, 998 for subject)
- Unicode homograph attack prevention (ASCII-only)
```

#### 3. Path Traversal Protection
For on-premises Exchange with custom certificates:
- **Directory restrictions**: Only allows files in specified directory
- **File extension validation**: Only `.pem`, `.crt`, `.cer` allowed
- **Content validation**: Verifies certificate format
- **Path resolution**: Prevents `../` traversal attacks

#### 4. Credential Management
- **AWS SES**: Automatic credential rotation with configurable intervals
- **Environment-based**: No hardcoded credentials in code
- **Validation**: Startup configuration validation

#### 5. Connection Security
- **Connection pooling**: Efficient connection reuse (SMTP providers)
- **Timeout configurations**: Prevents hanging connections
- **Retry logic**: Built-in retry with exponential backoff
- **Rate limiting**: Basic protection against abuse

### Production Security Checklist

- ✅ **Use TLS encryption**: Enable `SECURE=true` for production SMTP
- ✅ **App passwords**: Use app passwords, not account passwords
- ✅ **Dedicated accounts**: Create service-specific email accounts
- ✅ **Minimal permissions**: Grant only necessary sending permissions
- ✅ **Environment variables**: Store all credentials in env vars
- ✅ **Domain verification**: Verify sending domains with providers
- ✅ **Certificate validation**: Use proper certificates for on-premises setups

## Troubleshooting

### Common Issues

#### Authentication Failures

**Exchange Online**:
- ✅ Verify using app password, not account password
- ✅ Check modern authentication is enabled
- ✅ Ensure service account has Exchange permissions

**Gmail/SMTP**:
- ✅ Enable 2-factor authentication first
- ✅ Generate app-specific password
- ✅ Use app password in configuration

**AWS SES**:
- ✅ Verify IAM permissions are correct
- ✅ Check if account is in sandbox mode
- ✅ Ensure region matches configuration

#### Connection Issues

**On-Premises Exchange**:
- ✅ Verify SMTP service is running on Exchange server
- ✅ Check firewall allows port 587/25
- ✅ Test certificate validity if using TLS

**Network Issues**:
- ✅ Test DNS resolution for provider hostnames
- ✅ Verify outbound connectivity on required ports
- ✅ Check corporate firewall rules

#### Configuration Errors

**Environment Variables**:
- ✅ Verify all required variables are set
- ✅ Check for typos in variable names
- ✅ Ensure EMAIL_ID matches verified domain

**Certificate Issues** (On-Premises):
- ✅ Verify certificate file exists and is readable
- ✅ Check certificate is in allowed directory
- ✅ Ensure certificate format is valid

### Testing Email Configuration

Test your configuration with the built-in validation:

```bash
# The system validates configuration on startup
# Check logs for configuration validation results

# Test basic connectivity
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "subject": "Test", "template": "test"}'
```

### Debug Logging

Enable debug logging for troubleshooting:

```bash
NODE_ENV=development
LOG_LEVEL=debug
```

## Migration Guide

### Migrating Between Providers

1. **Plan the migration**:
   - Choose target provider based on requirements
   - Set up new provider account and verify domain
   - Test configuration in development environment

2. **Update configuration**:
   - Backup current environment variables
   - Update `EMAIL_PROVIDER` and provider-specific variables
   - Test email functionality

3. **Deploy changes**:
   - Deploy to staging environment first
   - Validate email sending works correctly
   - Deploy to production during maintenance window

4. **Verify and monitor**:
   - Send test emails after deployment
   - Monitor delivery rates and error logs
   - Keep old provider active briefly as backup

### Example Migration: Resend to AWS SES

```bash
# Old configuration (Resend)
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_old_key

# New configuration (AWS SES)
EMAIL_PROVIDER=amazon-ses
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=AKIA...
AWS_SES_SECRET_ACCESS_KEY=secret_key
```

## Support and Maintenance

### Regular Maintenance Tasks

- **Monthly**: Review email delivery logs and error rates
- **Quarterly**: Test provider failover and backup procedures
- **Annually**: Review and rotate credentials where possible

### Monitoring

Monitor these key indicators:
- Email delivery success rate
- Authentication failure rate
- Provider response times
- Error log patterns

### Getting Help

1. **Check application logs** for specific error messages
2. **Verify provider status** on provider status pages
3. **Test with minimal configuration** to isolate issues
4. **Consult provider documentation** for provider-specific issues

---

## Appendix

### Complete Environment Variable Reference

#### Core Variables (All Providers)
| Variable | Required | Description |
|----------|----------|-------------|
| `EMAIL_PROVIDER` | Yes | Email service provider (resend, smtp, exchange-online, exchange-onprem, amazon-ses) |
| `EMAIL_ID` | Yes | Default sender email address |

#### Resend Provider
| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes | Resend API key |

#### SMTP Provider
| Variable | Required | Description |
|----------|----------|-------------|
| `SMTP_HOST` | Yes | SMTP server hostname |
| `SMTP_PORT` | Yes | SMTP server port |
| `SMTP_USER` | Yes | SMTP username |
| `SMTP_PASS` | Yes | SMTP password |
| `SMTP_SECURE` | No | Use TLS (true/false) |

#### Exchange Online Provider
| Variable | Required | Description |
|----------|----------|-------------|
| `EXCHANGE_ONLINE_USER` | Yes | Service account email |
| `EXCHANGE_ONLINE_PASS` | Yes | App password |
| `EXCHANGE_ONLINE_TENANT_ID` | No | Azure tenant ID (collected but not used) |

#### On-Premises Exchange Provider
| Variable | Required | Description |
|----------|----------|-------------|
| `EXCHANGE_ONPREM_HOST` | Yes | Exchange server hostname |
| `EXCHANGE_ONPREM_PORT` | Yes | Exchange server port |
| `EXCHANGE_ONPREM_USER` | Yes | Username |
| `EXCHANGE_ONPREM_PASS` | Yes | Password |
| `EXCHANGE_ONPREM_DOMAIN` | No | Domain name |
| `EXCHANGE_ONPREM_SECURE` | No | Use TLS (true/false) |
| `EXCHANGE_ALLOW_SELF_SIGNED` | No | Allow self-signed certificates |
| `EXCHANGE_CUSTOM_CA_PATH` | No | Path to custom CA certificate |
| `EXCHANGE_CA_ALLOWED_DIR` | No | Allowed directory for CA certificates |

#### Amazon SES Provider
| Variable | Required | Description |
|----------|----------|-------------|
| `AWS_SES_REGION` | Yes | AWS region |
| `AWS_SES_ACCESS_KEY_ID` | Yes | AWS access key ID |
| `AWS_SES_SECRET_ACCESS_KEY` | Yes | AWS secret access key |
| `AWS_SES_API_VERSION` | No | SES API version (default: 2010-12-01) |
| `SES_CONFIGURATION_SET` | No | SES configuration set name |
| `AWS_CREDENTIAL_REFRESH_INTERVAL_MS` | No | Credential refresh interval (default: 3600000) |

### Provider Comparison

| Feature | Resend | Exchange Online | On-Prem Exchange | Amazon SES | SMTP |
|---------|--------|-----------------|------------------|------------|------|
| Setup Complexity | Low | Medium | High | Medium | Medium |
| Credential Rotation | Manual | Manual | Manual | Automatic | Manual |
| TLS Security | Built-in | Built-in | Configurable | Built-in | Configurable |
| Analytics | Yes | Basic | No | Yes | No |
| Enterprise Ready | Yes | Yes | Yes | Yes | Variable |

---

*Document Version: 1.0*
*Last Updated: 2025-10-05*
*Classification: Internal Use*

*For technical support, contact your system administrator or development team.*