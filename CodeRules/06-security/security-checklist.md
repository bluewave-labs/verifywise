# Security Checklist

OWASP-aligned security checklist for VerifyWise development.

## Quick Reference Checklist

### Authentication & Sessions

- [ ] Passwords hashed with bcrypt (cost factor 12+)
- [ ] JWT tokens have reasonable expiration (15-30 min for access tokens)
- [ ] Refresh tokens stored securely and rotated
- [ ] Session invalidation on logout and password change
- [ ] Account lockout after failed login attempts
- [ ] Multi-factor authentication for sensitive operations

### Authorization

- [ ] Authorization checked on every request
- [ ] Resource ownership verified before access
- [ ] Principle of least privilege applied
- [ ] Role-based access control implemented correctly
- [ ] Direct object references protected (IDOR prevention)

### Input Validation

- [ ] All user input validated on server side
- [ ] Validation happens before processing
- [ ] Input length limits enforced
- [ ] File uploads validated (type, size, content)
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (output encoding)

### Data Protection

- [ ] Sensitive data encrypted at rest
- [ ] HTTPS enforced for all connections
- [ ] Secrets stored in environment variables (not code)
- [ ] PII handled according to privacy requirements
- [ ] Proper data retention and deletion policies

### Error Handling

- [ ] Generic error messages to users
- [ ] Detailed errors logged server-side
- [ ] Stack traces never exposed to clients
- [ ] Error responses don't leak sensitive info

### Logging & Monitoring

- [ ] Security events logged
- [ ] Logs don't contain sensitive data
- [ ] Failed authentication attempts logged
- [ ] Admin actions audited

## OWASP Top 10 Coverage

### A01: Broken Access Control

**Risk**: Users accessing unauthorized resources or functions.

**Prevention**:

```typescript
// Always verify authorization
async function getProject(req: Request, res: Response) {
  const project = await Project.findById(req.params.id);

  // Check ownership/membership
  if (!project.canAccess(req.user.id)) {
    throw new ForbiddenError('Access denied');
  }

  return project;
}

// Deny by default
function authorize(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Default deny
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  };
}
```

**Checklist**:
- [ ] Access control enforced server-side
- [ ] Deny by default for all resources
- [ ] CORS properly configured
- [ ] JWT tokens validated on every request
- [ ] Rate limiting on sensitive operations

### A02: Cryptographic Failures

**Risk**: Exposure of sensitive data due to weak cryptography.

**Prevention**:

```typescript
// Use strong hashing for passwords
const BCRYPT_ROUNDS = 12;
const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

// Use secure random for tokens
import crypto from 'crypto';
const token = crypto.randomBytes(32).toString('hex');

// HTTPS only cookies
res.cookie('session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
});
```

**Checklist**:
- [ ] Strong password hashing (bcrypt, Argon2)
- [ ] HTTPS enforced everywhere
- [ ] Sensitive data encrypted at rest
- [ ] No sensitive data in URLs
- [ ] Secure cookie attributes set

### A03: Injection

**Risk**: Malicious data interpreted as commands.

**Prevention**:

```typescript
// SQL Injection - use parameterized queries (Sequelize handles this)
const user = await User.findOne({
  where: { email: userInput }, // Safe - parameterized
});

// Never concatenate SQL
// BAD: `SELECT * FROM users WHERE email = '${userInput}'`

// Command Injection - avoid shell commands with user input
// If necessary, use allowlist validation
const ALLOWED_COMMANDS = ['list', 'status', 'help'];
if (!ALLOWED_COMMANDS.includes(userInput)) {
  throw new ValidationError('Invalid command');
}
```

**Checklist**:
- [ ] Parameterized queries for all database operations
- [ ] ORM used for database interactions
- [ ] User input never in shell commands
- [ ] NoSQL injection prevention
- [ ] LDAP injection prevention (if applicable)

### A04: Insecure Design

**Risk**: Missing or ineffective security controls by design.

**Prevention**:
- Threat modeling during design phase
- Security requirements documented
- Defense in depth approach
- Secure defaults

**Checklist**:
- [ ] Security requirements defined early
- [ ] Threat model created for new features
- [ ] Principle of least privilege applied
- [ ] Fail securely (deny on error)
- [ ] Security testing in CI/CD

### A05: Security Misconfiguration

**Risk**: Insecure default configurations or missing security hardening.

**Prevention**:

```typescript
// Use Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}));

// Disable unnecessary features
app.disable('x-powered-by');

// Strict CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
};
```

**Checklist**:
- [ ] Security headers configured (Helmet)
- [ ] CORS properly restricted
- [ ] Debug mode disabled in production
- [ ] Unnecessary features disabled
- [ ] Error messages don't expose internals
- [ ] Dependencies regularly updated

### A06: Vulnerable Components

**Risk**: Using components with known vulnerabilities.

**Prevention**:

```bash
# Regularly audit dependencies
npm audit
pip-audit

# Use tools in CI/CD
# .github/workflows/security.yml
- name: Security audit
  run: npm audit --audit-level=moderate
```

**Checklist**:
- [ ] Dependency audit in CI/CD
- [ ] Automated dependency updates (Dependabot)
- [ ] Known vulnerability scanning
- [ ] Components from trusted sources
- [ ] Unused dependencies removed

### A07: Authentication Failures

**Risk**: Broken authentication allowing account compromise.

**Prevention**:

```typescript
// Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many attempts, try again later',
});

app.post('/login', authLimiter, loginHandler);

// Account lockout
async function handleFailedLogin(userId: string) {
  await User.increment('failedAttempts', { where: { id: userId } });

  const user = await User.findById(userId);
  if (user.failedAttempts >= MAX_ATTEMPTS) {
    await User.update(
      { lockedUntil: new Date(Date.now() + LOCKOUT_DURATION) },
      { where: { id: userId } }
    );
  }
}
```

**Checklist**:
- [ ] Strong password requirements
- [ ] Rate limiting on authentication
- [ ] Account lockout implemented
- [ ] Secure password recovery
- [ ] Session management secure
- [ ] MFA for sensitive operations

### A08: Software and Data Integrity

**Risk**: Code and data integrity compromised.

**Prevention**:
- Verify package integrity (lockfiles)
- Sign commits and releases
- Validate CI/CD pipeline security

**Checklist**:
- [ ] Package lockfiles committed
- [ ] CI/CD pipeline secured
- [ ] Code review required
- [ ] Signed commits (optional but recommended)
- [ ] Integrity checks on deployments

### A09: Logging and Monitoring Failures

**Risk**: Breaches undetected due to insufficient logging.

**Prevention**:

```typescript
// Log security events
logger.info({
  event: 'LOGIN_SUCCESS',
  userId: user.id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

logger.warn({
  event: 'LOGIN_FAILED',
  email: attemptedEmail, // Redact in production
  ip: req.ip,
  reason: 'invalid_password',
});

// Never log sensitive data
// BAD: logger.info({ password, token, creditCard });
```

**Checklist**:
- [ ] Login successes and failures logged
- [ ] Access control failures logged
- [ ] Input validation failures logged
- [ ] Sensitive data never logged
- [ ] Logs stored securely
- [ ] Alerting on security events

### A10: Server-Side Request Forgery (SSRF)

**Risk**: Application fetches malicious URLs provided by attackers.

**Prevention**:

```typescript
// Validate URLs against allowlist
const ALLOWED_DOMAINS = ['api.trusted.com', 'cdn.ourservice.com'];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

// Block internal IPs
function isInternalIp(hostname: string): boolean {
  const ip = hostname;
  return (
    ip.startsWith('127.') ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('172.16.') ||
    ip === 'localhost'
  );
}
```

**Checklist**:
- [ ] URL validation for external requests
- [ ] Allowlist for permitted destinations
- [ ] Block requests to internal IPs
- [ ] Disable unnecessary URL schemes
- [ ] Response validation

## Environment-Specific Security

### Development

- Use `.env.example` without real secrets
- Never commit `.env` files
- Use development-specific credentials

### Staging

- Use separate credentials from production
- Test security controls
- Perform security testing

### Production

- All security features enabled
- Debug mode disabled
- Strict security headers
- Monitoring and alerting active
- Regular security audits

## Security Review Process

### Before Code Review

1. Run static analysis tools
2. Check for hardcoded secrets
3. Verify input validation
4. Review error handling

### During Code Review

1. Authorization checks present?
2. Input validated before use?
3. Sensitive data protected?
4. Errors handled securely?

### Before Deployment

1. Security tests pass?
2. Dependencies audited?
3. Configuration reviewed?
4. Secrets rotated if needed?

## Related Documents

- [Authentication](./authentication.md)
- [Input Validation](./input-validation.md)
- [Error Handling](./error-handling.md)
- [Security Review Checklist](../checklists/security-review-checklist.md)
