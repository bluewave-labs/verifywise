# Security Review Checklist

Security-focused review checklist for VerifyWise code changes.

## Authentication

### Password Handling

- [ ] Passwords hashed with bcrypt (cost factor 12+)
- [ ] Plain text passwords never stored
- [ ] Passwords never logged
- [ ] Password field excluded from API responses
- [ ] Strong password requirements enforced

### Token Management

- [ ] JWT secret is cryptographically random (32+ chars)
- [ ] Access tokens have short expiry (15-30 min)
- [ ] Refresh tokens are rotated on use
- [ ] Tokens invalidated on logout
- [ ] Tokens invalidated on password change

### Session Security

- [ ] Session IDs are cryptographically random
- [ ] Sessions expire after inactivity
- [ ] Sessions invalidated on logout
- [ ] Concurrent session limits (if applicable)

## Authorization

### Access Control

- [ ] Every endpoint has authorization check
- [ ] Default deny (fail closed)
- [ ] Resource ownership verified
- [ ] Role-based access implemented correctly
- [ ] Privilege escalation prevented

### IDOR Prevention

- [ ] Direct object references are validated
- [ ] User can only access their own resources
- [ ] Admin checks for admin-only resources

## Input Validation

### General

- [ ] All user input validated server-side
- [ ] Input validated before processing
- [ ] Validation uses allowlist (not denylist)
- [ ] Length limits enforced
- [ ] Type validation performed

### Specific Attacks

- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (output encoding)
- [ ] Command injection prevented
- [ ] Path traversal prevented
- [ ] LDAP injection prevented (if applicable)
- [ ] XML injection prevented (if applicable)

### File Uploads

- [ ] File type validated (MIME type + extension)
- [ ] File size limits enforced
- [ ] Content validated (magic bytes)
- [ ] Filename sanitized
- [ ] Files stored outside web root

## Data Protection

### Sensitive Data

- [ ] PII encrypted at rest
- [ ] Sensitive data not in URLs
- [ ] Sensitive data not in logs
- [ ] Sensitive data not in error messages
- [ ] Proper data retention policies

### Secrets

- [ ] Secrets in environment variables (not code)
- [ ] No hardcoded credentials
- [ ] No API keys in client-side code
- [ ] .env files in .gitignore
- [ ] Different secrets per environment

### Transport

- [ ] HTTPS enforced
- [ ] TLS 1.2+ required
- [ ] HSTS header enabled
- [ ] Secure cookie flags set

## API Security

### Rate Limiting

- [ ] Rate limiting on all endpoints
- [ ] Stricter limits on auth endpoints
- [ ] Rate limit by IP and user
- [ ] 429 response for exceeded limits

### CORS

- [ ] CORS configured correctly
- [ ] Allowed origins are specific (not *)
- [ ] Credentials mode configured properly

### Headers

- [ ] Security headers set (Helmet)
- [ ] Content-Security-Policy defined
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] Referrer-Policy configured

## Error Handling

### Information Disclosure

- [ ] Generic errors to users
- [ ] No stack traces in production
- [ ] No SQL queries in errors
- [ ] No internal paths in errors
- [ ] No version info leaked

### Logging

- [ ] Security events logged
- [ ] No sensitive data in logs
- [ ] Log injection prevented
- [ ] Logs stored securely
- [ ] Audit trail for admin actions

## Dependencies

### Third-Party

- [ ] Dependencies from trusted sources
- [ ] No known vulnerabilities (npm audit)
- [ ] Minimum necessary permissions
- [ ] Lock files committed
- [ ] Regular dependency updates

## Code Review Focus Areas

### High Risk Changes

| Area | Extra Scrutiny |
|------|----------------|
| Authentication | Password, token, session handling |
| Authorization | Access control logic |
| User input | Forms, API parameters, file uploads |
| Database | Queries, migrations |
| External APIs | Request/response handling |
| File system | Read/write operations |
| Encryption | Key management, algorithms |

### Red Flags

Look for these patterns:

```typescript
// Dangerous: Dynamic query building
const query = `SELECT * FROM users WHERE id = '${userId}'`;

// Dangerous: Eval with user input
eval(userInput);

// Dangerous: Command execution with user input
exec(`ls ${userPath}`);

// Dangerous: Path concatenation
const file = path.join(baseDir, userInput);

// Dangerous: Disabled security
app.disable('x-powered-by');
// But not:
// eslint-disable security/no-exec
```

## Security Testing

### Manual Testing

- [ ] Try SQL injection payloads
- [ ] Try XSS payloads
- [ ] Test authorization bypass
- [ ] Test IDOR vulnerabilities
- [ ] Test file upload restrictions
- [ ] Test rate limiting

### Automated Testing

- [ ] Security linter enabled
- [ ] Dependency audit in CI
- [ ] SAST scan (if available)
- [ ] DAST scan (if available)

## Checklist by Change Type

### New Endpoint

```
POST /api/v1/resources

✅ Authentication
  ✅ Protected with auth middleware

✅ Authorization
  ✅ Ownership/permission checked

✅ Input Validation
  ✅ Schema validation
  ✅ SQL injection prevented
  ✅ XSS prevented (if applicable)

✅ Error Handling
  ✅ Generic errors to client
  ✅ Detailed logging

✅ Rate Limiting
  ✅ Appropriate limits set

✅ Testing
  ✅ Auth bypass tested
  ✅ Injection tested
```

### Database Changes

```
Migration: Add user_tokens table

✅ Data Protection
  ✅ Sensitive columns encrypted
  ✅ Proper column types

✅ Access Control
  ✅ Row-level security (if applicable)
  ✅ Least privilege for app user

✅ Audit
  ✅ Created/updated timestamps
  ✅ User tracking (if applicable)
```

### Dependency Addition

```
New package: some-library

✅ Source Verification
  ✅ From trusted source
  ✅ Active maintenance
  ✅ No known vulnerabilities

✅ Permissions
  ✅ Minimal permissions needed
  ✅ No suspicious access

✅ Documentation
  ✅ Reason documented
  ✅ Version locked
```

## Quick Security Checks

### Before Commit
1. No secrets in code?
2. No debug code left?
3. Validation added?
4. Errors handled?

### Before PR
1. Input sanitized?
2. Auth/authz checked?
3. Sensitive data protected?
4. Tests cover security?

### Before Deploy
1. Audit passed?
2. Headers configured?
3. HTTPS enforced?
4. Monitoring ready?

## Related Documents

- [Security Checklist](../06-security/security-checklist.md)
- [Authentication](../06-security/authentication.md)
- [Input Validation](../06-security/input-validation.md)
- [Error Handling](../06-security/error-handling.md)
