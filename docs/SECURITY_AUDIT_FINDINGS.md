# Security Audit Findings - VerifyWise Codebase

**Audit Date:** 2026-01-04
**Auditor:** Security Review
**Status:** In Progress

---

## Executive Summary

Comprehensive security audit of the VerifyWise codebase covering OWASP Top 10 vulnerabilities, authentication/authorization flaws, injection attacks, and security misconfigurations.

---

## Critical Vulnerabilities

### VULN-001: Unauthenticated Password Change Endpoint
- **Severity:** CRITICAL
- **Type:** Missing Authentication (CWE-306)
- **File:** `Servers/routes/user.route.ts:164`
- **Status:** Open

**Description:**
The password change endpoint `/users/chng-pass/:id` does not require JWT authentication.

```typescript
// Line 164 - MISSING authenticateJWT middleware
router.patch("/chng-pass/:id", ChangePassword);

// Compare to line 162 which IS protected:
router.patch("/:id", authenticateJWT, updateUserById);
```

**Impact:**
- User enumeration via 404 responses
- Brute-force attacks on passwords without authentication
- Account takeover if attacker knows current password

**Remediation:**
```typescript
router.patch("/chng-pass/:id", authenticateJWT, ChangePassword);
```

---

### VULN-002: SQL Injection via Dynamic Schema Names
- **Severity:** CRITICAL
- **Type:** SQL Injection (CWE-89)
- **Files:** Multiple utility files
- **Status:** Open

**Affected Files:**
| File | Lines |
|------|-------|
| `Servers/utils/vendor.utils.ts` | 262, 423, 500 |
| `Servers/utils/project.utils.ts` | 353, 555, 763 |
| `Servers/utils/modelInventory.utils.ts` | 235, 420, 510 |
| `Servers/utils/risk.utils.ts` | 651, 968, 1092 |
| `Servers/utils/trainingRegistar.utils.ts` | 50, 192, 267 |
| `Servers/utils/policyManager.utils.ts` | 146 |
| `Servers/utils/task.utils.ts` | Multiple |
| `Servers/utils/incidentManagement.utils.ts` | Multiple |

**Description:**
Template literal interpolation of tenant schema names in raw SQL queries:

```typescript
`SELECT ... FROM "${tenant}".automations a ...`
```

**Impact:**
If tenant value can be manipulated, full SQL injection is possible.

**Remediation:**
- Validate tenant format with strict regex
- Use parameterized schema setting: `SET search_path TO $1`
- Consider using Sequelize schema option instead of raw queries

---

## High Vulnerabilities

### VULN-003: XSS via DOM HTML Injection
- **Severity:** HIGH
- **Type:** Cross-Site Scripting (CWE-79)
- **File:** `Clients/src/presentation/components/PlateEditor.tsx:72`
- **Status:** Open

**Description:**
Direct assignment of HTML content to DOM element without sanitization.

**Impact:**
- Session hijacking via cookie theft
- Keylogging and credential theft
- Defacement and phishing

**Remediation:**
Use DOMPurify to sanitize HTML content before DOM insertion.

---

### VULN-004: Open Redirect via Unvalidated URLs
- **Severity:** HIGH
- **Type:** Open Redirect (CWE-601)
- **Files:** Multiple client components
- **Status:** Open

**Affected Files:**
| File | Line | Code |
|------|------|------|
| `Clients/src/presentation/components/Uploader/index.tsx` | 440 | `window.open(file.url, '_blank')` |
| `Clients/src/presentation/components/Uploader/index.tsx` | 443 | `window.open(url, '_blank')` |
| `Clients/src/presentation/components/PlatePlugins/CustomLinkPlugin.tsx` | 28 | `window.open(url, "_blank")` |
| `Clients/src/presentation/components/ShareViewDropdown/ManageShareLinks.tsx` | 87 | `window.open(link, "_blank")` |
| `Clients/src/presentation/components/ShareViewDropdown/index.tsx` | 150 | `window.open(shareableLink, "_blank")` |

**Impact:**
- Phishing attacks using trusted domain
- Credential theft via malicious redirects

**Remediation:**
Validate URLs against allowlist before opening.

---

### VULN-005: Potential CORS Misconfiguration
- **Severity:** HIGH
- **Type:** Security Misconfiguration (CWE-942)
- **File:** `Servers/index.ts:61-69`
- **Status:** Needs Verification

**Description:**
CORS configuration needs review to ensure it's not overly permissive in production.

**Remediation:**
Verify origin whitelist is restrictive and doesn't include wildcards in production.

---

## Medium Vulnerabilities

### VULN-006: IDOR Risk in Multiple Endpoints
- **Severity:** MEDIUM
- **Type:** Insecure Direct Object Reference (CWE-639)
- **Files:** Multiple controllers
- **Status:** Needs Verification

**Description:**
Many endpoints accept IDs from request parameters without verifying the authenticated user has access to that resource.

**Affected Patterns:**
- `req.params.id` used directly in queries
- `req.body.id` used for resource access
- No ownership verification before operations

**Example Files:**
| File | Function | Risk |
|------|----------|------|
| `Servers/controllers/user.ctrl.ts:1206` | ChangePassword | Uses req.body.id |
| `Servers/controllers/project.ctrl.ts` | Various | Project ID from params |
| `Servers/controllers/vendor.ctrl.ts` | Various | Vendor ID from params |

**Remediation:**
Add authorization checks to verify resource ownership.

---

### VULN-007: Missing Rate Limiting on Sensitive Endpoints
- **Severity:** MEDIUM
- **Type:** Improper Restriction (CWE-307)
- **File:** `Servers/middleware/rateLimit.middleware.ts`
- **Status:** Needs Verification

**Description:**
Verify rate limiting is applied to:
- `/users/login`
- `/users/chng-pass/:id`
- `/users/reset-password`
- `/users/forgot-password`

**Impact:**
- Brute-force attacks on credentials
- Account lockout attacks
- Resource exhaustion

---

### VULN-008: JWT Storage in localStorage
- **Severity:** MEDIUM
- **Type:** Sensitive Data Exposure (CWE-922)
- **Files:** Client authentication flow
- **Status:** Open

**Description:**
JWT tokens stored in localStorage are accessible to any JavaScript code, making them vulnerable to XSS attacks.

**Impact:**
If any XSS vulnerability exists, tokens can be exfiltrated.

**Remediation:**
Consider using httpOnly cookies for token storage.

---

### VULN-009: Information Disclosure in Error Messages
- **Severity:** MEDIUM
- **Type:** Information Exposure (CWE-209)
- **Files:** Multiple controllers
- **Status:** Needs Verification

**Description:**
Error handlers may expose stack traces or internal implementation details.

---

## Low Vulnerabilities

### VULN-010: Missing Security Headers
- **Severity:** LOW
- **Type:** Security Misconfiguration (CWE-693)
- **File:** `Servers/index.ts`
- **Status:** Needs Verification

**Description:**
Verify the following headers are set:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy`
- `Strict-Transport-Security`

---

### VULN-011: Verbose Logging of Sensitive Data
- **Severity:** LOW
- **Type:** Information Exposure (CWE-532)
- **Files:** Multiple files with logger calls
- **Status:** Needs Verification

**Description:**
Ensure sensitive data (passwords, tokens, PII) is not logged.

---

## Security Best Practices Observed

| Area | Status | Notes |
|------|--------|-------|
| Password Hashing | Good | Uses bcrypt |
| JWT Separation | Good | Separate access/refresh secrets |
| Input Validation | Good | Validation utilities exist |
| Tenant Isolation | Good | Schema-per-tenant |
| Auth Middleware | Good | Most routes protected |
| File Upload Validation | Good | MIME type checks |

---

## Remediation Priority

| Priority | Vulnerability | Effort | Impact |
|----------|--------------|--------|--------|
| P0 | VULN-001 (Unauth password change) | Low | Critical |
| P0 | VULN-002 (SQL Injection) | Medium | Critical |
| P1 | VULN-003 (XSS) | Low | High |
| P1 | VULN-004 (Open Redirect) | Low | High |
| P2 | VULN-005 (CORS) | Low | High |
| P2 | VULN-006 (IDOR) | Medium | Medium |
| P2 | VULN-007 (Rate Limiting) | Medium | Medium |
| P3 | VULN-008 (JWT Storage) | High | Medium |
| P3 | VULN-009 (Error Messages) | Low | Medium |
| P4 | VULN-010 (Security Headers) | Low | Low |
| P4 | VULN-011 (Logging) | Low | Low |

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 3 |
| Medium | 4 |
| Low | 2 |
| **Total** | **11** |

---

## Exploitation Analysis (Logged-In User)

Analysis of which vulnerabilities can be exploited by an authenticated user within VerifyWise.

### Exploitable by Logged-In Users

| Vuln ID | Exploitable | Attack Vector | Mitigation in Place |
|---------|-------------|---------------|---------------------|
| VULN-001 | **NO** | Requires no auth - exploitable by anyone | None (critical fix needed) |
| VULN-002 | **UNLIKELY** | Tenant hash from JWT, not user-controllable | JWT validation, hash from org ID |
| VULN-003 | **YES** | Logged-in user can inject malicious content via PlateEditor | None |
| VULN-004 | **YES** | Logged-in user can create malicious links/files | None |
| VULN-005 | **NO** | CORS is server config, not user-exploitable | N/A |
| VULN-006 | **PARTIAL** | Within same tenant, users may access other users' resources | Tenant isolation only |
| VULN-007 | **YES** | Logged-in user can brute-force other endpoints | Partial rate limiting |
| VULN-008 | **YES** | If XSS exists, logged-in user's token is at risk | None |
| VULN-009 | **YES** | Logged-in user sees detailed errors | None |
| VULN-010 | **NO** | Headers are server config | N/A |
| VULN-011 | **NO** | Logs are server-side only | N/A |

---

### Detailed Exploitation Scenarios

#### Scenario 1: Stored XSS via PlateEditor (VULN-003 + VULN-008)
**Attack Chain:**
1. Logged-in attacker creates content with malicious script in PlateEditor
2. Victim user views the content
3. Script executes and steals JWT from localStorage
4. Attacker uses stolen token to impersonate victim

**Files:**
- `Clients/src/presentation/components/PlateEditor.tsx:72`

**Severity:** HIGH - Full account takeover possible

---

#### Scenario 2: Intra-Tenant IDOR (VULN-006)
**Attack Chain:**
1. User A and User B are in same organization
2. User A (Auditor role) accesses project endpoint with User B's project ID
3. No ownership check beyond tenant isolation
4. User A can view/modify User B's projects

**Files:**
- `Servers/controllers/project.ctrl.ts:98` - Uses `req.params.id` directly
- `Servers/controllers/vendor.ctrl.ts:69` - Uses `req.params.id` directly
- `Servers/controllers/file.ctrl.ts:24` - Uses `req.params.id` directly

**Analysis:**
- `getProjectById` at line 107 queries by `projectId` and `tenantId`
- No check if user has access to that specific project
- Same pattern in `getVendorById`, `getFileContentById`

**Mitigating Factor:** Tenant isolation prevents cross-organization access

**Severity:** MEDIUM - Horizontal privilege escalation within organization

---

#### Scenario 3: Open Redirect for Phishing (VULN-004)
**Attack Chain:**
1. Logged-in attacker creates a document with malicious link
2. Link uses `window.open()` with external phishing URL
3. Victim clicks link, lands on attacker-controlled site
4. Attacker harvests credentials

**Files:**
- `Clients/src/presentation/components/PlatePlugins/CustomLinkPlugin.tsx:28`
- `Clients/src/presentation/components/Uploader/index.tsx:440`

**Severity:** HIGH - Credential theft via social engineering

---

#### Scenario 4: File Access Within Tenant (VULN-006)
**Attack Chain:**
1. Logged-in user enumerates file IDs (1, 2, 3, ...)
2. Accesses `/files/{id}` for each ID
3. Downloads files uploaded by other users in same organization

**Files:**
- `Servers/controllers/file.ctrl.ts:24-33`

```typescript
const fileId = parseInt(req.params.id);
const file = await getFileById(fileId, req.tenantId!);
// No check: does this user have permission to access this file?
```

**Severity:** MEDIUM - Information disclosure within tenant

---

### Protected Endpoints (Good Examples)

The following endpoints properly check authorization:

| File | Line | Protection |
|------|------|------------|
| `Servers/controllers/user.ctrl.ts` | 195 | Checks `user.organization_id !== req.organizationId` |
| `Servers/controllers/project.ctrl.ts` | 63-66 | Checks `userId` and `role` before proceeding |
| `Servers/utils/project.utils.ts` | getAllProjectsQuery | Filters by user role and membership |

---

### Recommendations for Logged-In User Attacks

1. **Immediate:** Add DOMPurify sanitization for all user-generated HTML content
2. **Immediate:** Validate URLs before `window.open()` calls
3. **Short-term:** Add resource-level authorization checks (not just tenant-level)
4. **Short-term:** Move JWT to httpOnly cookies to mitigate XSS token theft
5. **Medium-term:** Implement role-based access control per resource

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2026-01-04 | 1.0 | Security Audit | Initial findings |
