# VerifyWise Current Architecture Analysis

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.1 |
| Date | January 2026 |
| Purpose | Inform multi-workspace implementation |
| Author | Architecture Team |

---

## Key Implementation Notes

| Aspect | Decision | Impact |
|--------|----------|--------|
| Deployment Model | **Fresh only** | No migration scripts needed |
| OIDC | **Does not exist** | Must be built from scratch (~300-400 lines new code) |
| OIDC Requirement | **Optional** | Email/password continues to work |
| Identity Model | **One email = one global user** | Single row in `public.users`, multiple `user_workspaces` entries |
| Multi-workspace access | **Allowed with re-auth** | Same email can be in multiple workspaces, re-auth on IdP switch |
| Passport.js | In package.json but **not used** | Can ignore or remove |

---

## Table of Contents

1. [A. Authentication & Session Layer](#a-authentication--session-layer)
2. [B. RBAC Model](#b-rbac-model)
3. [C. Data Access Enforcement](#c-data-access-enforcement)
4. [D. API Surface & Frontend Contract](#d-api-surface--frontend-contract)
5. [E. Auditing](#e-auditing)
6. [F. Admin & Bootstrap Flows](#f-admin--bootstrap-flows)
7. [G. Constraints & Recommendations](#g-constraints--recommendations)

---

## A. Authentication & Session Layer

### Where is authentication handled today?

**Pattern: Express middleware with JWT validation**

| Component | Location | Purpose |
|-----------|----------|---------|
| Auth Middleware | `Servers/middleware/auth.middleware.ts` | JWT validation, request enrichment |
| JWT Utilities | `Servers/utils/jwt.utils.ts` | Token generation/verification |
| Auth Utils | `Servers/utils/auth.utils.ts` | Token creation helpers |
| User Controller | `Servers/controllers/user.ctrl.ts` | Login/logout/refresh endpoints |

**Key Finding:** There is **NO OAuth or OIDC implementation**. The system uses only email/password authentication with JWT tokens.

### What does a verified session look like?

**Token Payload Structure:**
```typescript
{
  id: number;              // User ID
  email: string;           // User email
  roleName: string;        // "Admin" | "Reviewer" | "Editor" | "Auditor"
  organizationId: number;  // Organization ID for multi-tenancy
  tenantId: string;        // SHA256 hash of organizationId (10 chars)
  expire: number;          // Expiration timestamp in milliseconds
}
```

**Token Types & Storage:**

| Token | Expiration | Storage |
|-------|------------|---------|
| Access Token | 1 hour | Returned in JSON response, stored in frontend |
| Refresh Token | 30 days | HTTP-only secure cookie |

**Session Storage:** **Stateless JWT** - No Redis, memory, or database session storage.

### What identity attributes are currently trusted as canonical?

**Primary Identity: Email**

```sql
-- User table schema (from migrations)
id: INTEGER (PK, auto-increment)
email: STRING (UNIQUE constraint)  -- Canonical identifier
password_hash: STRING
role_id: INTEGER (FK -> roles.id)
organization_id: INTEGER (FK -> organizations.id)
```

**No OIDC fields exist:**
- No `oidc_subject`
- No `oidc_issuer`
- No support for external identity providers

### Do you already support more than one OIDC provider?

**No.** The system is hardcoded to email/password authentication.

- No OIDC configuration tables
- No IdP discovery endpoints
- No OAuth flows implemented
- Would require greenfield implementation for workspace-specific OIDC

### How do you currently decide "this request is authenticated"?

**Multi-step validation in `auth.middleware.ts:96-172`:**

```
1. Token Extraction    → Bearer token from Authorization header
2. Signature Verify    → HMAC-SHA256 with JWT_SECRET
3. Expiration Check    → Compare decoded.expire vs Date.now()
4. Payload Validation  → Ensure id (number > 0) and roleName exist
5. Org Membership      → DB query: doesUserBelongsToOrganizationQuery()
6. Role Consistency    → DB lookup confirms role hasn't changed
7. Tenant Hash Match   → Verify tenantId matches computed hash
```

**Request Context Attached:**
```typescript
req.userId = decoded.id;
req.role = decoded.roleName;
req.tenantId = decoded.tenantId;
req.organizationId = decoded.organizationId;
```

**AsyncLocalStorage:** Context also propagated via `asyncLocalStorage` for cross-module access.

---

## B. RBAC Model

### Where are roles stored today?

**Database Schema:**

```sql
-- roles table (public schema, shared across tenants)
id: INTEGER (PK)
name: VARCHAR         -- "Admin", "Reviewer", "Editor", "Auditor"
description: VARCHAR
is_demo: BOOLEAN
created_at: TIMESTAMP

-- users table
role_id: INTEGER (FK -> roles.id)  -- Single role per user
organization_id: INTEGER           -- Org membership
```

**Hardcoded Role IDs:**

| ID | Name | Description |
|----|------|-------------|
| 1 | Admin | Full system access |
| 2 | Reviewer | Review and approval |
| 3 | Editor | Modify content |
| 4 | Auditor | Read-only audit access |

**Roles in JWT:** Yes, `roleName` is embedded in token.

### Are roles global or contextual today?

**Roles are GLOBAL (organization-level), not project-scoped.**

- Each user has ONE role within their organization
- No role hierarchy at project level
- `projects_members` is a simple join table (user_id, project_id) - no role field
- Project access is binary: member or not member

**No granular permissions:**
- No `permissions` table
- No dynamic permission system
- Hardcoded role names in middleware

### How are RBAC checks implemented in code?

**Centralized Middleware Pattern:**

```typescript
// accessControl.middleware.ts
const authorize = (allowedRoles: string[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.role) return 401;
    if (!allowedRoles.includes(req.role)) return 403;
    return next();
  };

// Usage in routes
router.post('/file-manager',
  authenticateJWT,                           // Step 1: Verify token
  authorize(['Admin', 'Reviewer', 'Editor']), // Step 2: Check role
  uploadFile
);
```

**Some inline checks exist:**
```typescript
// In controllers
if (user.role_id === 1) { ... }  // Admin check
```

### Do RBAC checks happen before or after data fetching?

**Before (security-first pattern):**

```
Request → authenticateJWT → authorize(['Admin']) → Controller → Fetch Data
```

**However, organization isolation check happens AFTER fetch:**
```typescript
const user = await getUserByIdQuery(id);  // Fetch first
if (user.organization_id !== req.organizationId) {  // Then check
  return 403;
}
```

### Do you already have "viewer vs editor" distinctions enforced everywhere?

**Partially.** Only Auditor (role 4) is truly read-only.

| Role | Write Access |
|------|--------------|
| Admin | Full |
| Reviewer | Yes (limited) |
| Editor | Yes |
| Auditor | **No** (read-only) |

**Some routes trust the frontend** - not all routes have `authorize()` middleware.

---

## C. Data Access Enforcement

### How is data fetched today?

**Pattern: Raw SQL via Sequelize with schema-based multi-tenancy**

```typescript
// Example from control.utils.ts
sequelize.query(`
  SELECT * FROM "${tenant}".controls
  ORDER BY created_at DESC
`);
```

**Architecture:**

| Layer | Description |
|-------|-------------|
| Controllers | Handle HTTP, extract context |
| Utility files | 73 files containing query functions |
| Models | Type definitions, minimal query logic |
| Repository | Only 1 exists: `file.repository.ts` |

**No centralized repository layer** - queries scattered across 73 utility files.

### Is there a single place where filters can be injected?

**Schema-based isolation is the single point:**

```typescript
// Tenant hash computed from organizationId
const tenantHash = getTenantHash(organizationId);

// All queries use schema prefix
SELECT * FROM "${tenantHash}".projects ...
```

**Risk:** No row-level `WHERE org_id = ?` as secondary protection.

**Impact of adding workspace_id:**
- Would require touching **40-50+ utility files**
- No single injection point for additional filters

### Do create operations already set ownership fields server-side?

**No - client data passed directly:**

```typescript
// vendor.ctrl.ts - create function
const vendorData = req.body;  // Direct assignment
const vendor = await VendorModel.createNewVendor(
  vendorData.vendor_name,
  vendorData.assignee,     // Client can send any user ID!
  vendorData.reviewer,     // No server-side validation
  // ...
);
```

**Missing protections:**
- No `created_by` auto-set server-side
- No `org_id` injection into records
- Schema isolation is only protection

### Do background jobs or async workers exist today?

**Yes - Bull + Redis job queue:**

| File | Purpose |
|------|---------|
| `Servers/jobs/producer.ts` | Job creation |
| `Servers/jobs/worker.ts` | Job processing |
| `Servers/services/automations/` | Automation logic |

**Scope handling is GOOD:**
```typescript
const organizations = await getAllOrganizationsQuery();
for (let org of organizations) {
  const tenantHash = getTenantHash(org.id);
  const vendors = await getAllVendorsQuery(tenantHash);
  // Properly scoped per-org
}
```

**Cron jobs:** Vendor review notifications, report notifications, MLflow sync.

### Are there any raw SQL queries today?

**All queries are parameterized SQL via Sequelize:**

```typescript
sequelize.query(`...WHERE id = :id`, {
  replacements: { id }
});
```

**SQL Injection protections:**
- `:placeholder` style parameters (safe)
- `validateTenant()` regex: `/^[A-Za-z0-9_]{1,30}$/`
- `escapePgIdentifier()` for schema names

**RLS consideration:** Would be straightforward to implement - all queries go through Sequelize.

---

## D. API Surface & Frontend Contract

### How does the frontend currently identify "context"?

**JWT token contains organization context:**

```typescript
// DecodedToken interface
{
  id: string;
  email: string;
  roleName: string;
  organizationId: string;    // KEY CONTEXT
  tenantId: string;          // KEY CONTEXT
}
```

**useAuth hook** (`Clients/src/application/hooks/useAuth.ts`):
```typescript
{
  token,
  userId,
  organizationId,  // From JWT
  userRoleName,
  isAuthenticated
}
```

### Is there already a concept of "current org" or "current project" in UI state?

**Organization:** Fixed per user based on JWT (not selectable)

**Project:** Selectable via multiple mechanisms:

| Storage | Location |
|---------|----------|
| VerifyWiseContext | `currentProjectId` (React context) |
| EvalsSidebarContext | `currentProject` (module-specific) |
| URL | Route params (`/evals/:projectId`) |
| localStorage | User preferences |

### Are API endpoints currently global or implicitly scoped?

**All endpoints are implicitly scoped to organization via JWT:**

```typescript
// Backend middleware attaches context
req.tenantId = decoded.tenantId;
req.organizationId = decoded.organizationId;

// Controllers use tenant for schema
const projects = await getAllProjectsQuery(req.tenantId);
// Queries: SELECT * FROM "${tenantHash}".projects
```

**No explicit org params needed in API calls.**

### Do APIs already reject requests missing certain headers?

**Yes - strict validation in auth middleware:**

| Status | Condition |
|--------|-----------|
| 400 | Missing Authorization header |
| 400 | Invalid token structure |
| 401 | Invalid JWT signature |
| 406 | Token expired |
| 403 | User not in token's organization |
| 403 | Role changed since token issued |

---

## E. Auditing

### What events are currently audited?

**Event Log Table (`public.event_logs`):**
```sql
id: SERIAL
event_type: ENUM ('Create', 'Read', 'Update', 'Delete', 'Error')
description: TEXT
user_id: FK
timestamp: TIMESTAMP
```

**Logged Events:**
- Create/Update/Delete operations (784+ logging calls)
- Read operations logged but NOT persisted to database
- Error events with messages

**Change History:** 10 entities have dedicated `*_change_history` tables:
- Vendor, Model Inventory, Use Case, Project, Framework
- Evidence Hub, Project Risk, Vendor Risk, Policy, Incident

### How is audit context passed today?

**AsyncLocalStorage pattern:**

```typescript
// auth.middleware.ts
asyncLocalStorage.run({ userId: decoded.id }, () => {
  next();
});

// dbLogger.ts
const store = asyncLocalStorage.getStore();
const effectiveUserId = store?.userId || userId;
```

**Context structure:** `{ userId?: number }`

### Can you easily add workspace_id to every audit event?

**Medium difficulty:**

| Component | Effort |
|-----------|--------|
| event_logs table | Add column, migrate |
| AsyncLocalStorage context | Add workspaceId to store |
| logEvent() calls | Already centralized - single change |
| Change history tables | In tenant schemas - already isolated |

**Key insight:** Change history tables are already tenant-scoped (in `${tenantHash}` schema).

### What's NOT audited today?

- Permission denials (403 responses)
- Failed login attempts
- JWT validation failures
- Role mismatches
- Expired token attempts

---

## F. Admin & Bootstrap Flows

### How is the first admin created today?

**"First Organization Wins" pattern:**

```typescript
// POST /api/organizations
1. Create organization in public.organizations
2. createNewTenant(organization_id)  // Create schema
3. Create user with roleId=1 (Admin)
4. Generate JWT tokens
5. Return user + token
```

**No manual DB inserts required** - API-driven.

**Roles seeded in migration:**
```javascript
[
  { name: 'Admin', description: 'Full access' },
  { name: 'Reviewer', description: 'Review access' },
  { name: 'Editor', description: 'Edit access' },
  { name: 'Auditor', description: 'Audit access' }
]
```

### Who can currently create org-like entities?

**Organizations:**
```typescript
// multiTenancy.middleware.ts
if (
  (MULTI_TENANCY_ENABLED && requestOrigin?.includes("verifywise.ai"))
  || !organizationExists.exists  // First org always allowed
) {
  return next();
}
```

- First organization: Anyone can create (bootstrap)
- Subsequent: Only if multi-tenancy enabled AND from allowed domains

**Projects:** Any authenticated user in the organization.

### Is there already a notion of "super admin" vs "regular admin"?

**No explicit super admin.** Instead:

| Level | Implementation |
|-------|----------------|
| Organization Admin | Role ID 1 - full access within org |
| System-level | Environment config (`MULTI_TENANCY_ENABLED`) |
| Domain whitelist | `app.verifywise.ai`, `test.verifywise.ai` |

**Key gap:** No cross-organization admin role exists.

---

## G. Constraints & Recommendations

### What parts of VerifyWise are you most reluctant to touch?

Based on the architecture analysis:

| Component | Reluctance | Reason |
|-----------|------------|--------|
| **Auth middleware** | Medium | Well-structured, but needs OIDC addition |
| **73 utility files** | High | Scattered queries, high change volume |
| **DB schema** | Medium | Schema-per-tenant is good foundation |
| **Frontend routing** | Low | React Router, straightforward to add workspace |
| **API contracts** | Medium | Implicit scoping works, needs header addition |

### What kind of refactor would you consider unacceptable?

| Refactor | Acceptability | Impact |
|----------|---------------|--------|
| Touching every query (73 utils) | **Unacceptable now** | 23,000+ lines, high risk |
| Rewriting auth from scratch | Unacceptable | Working system, add OIDC instead |
| Introducing Redis (beyond existing) | Acceptable | Already using for Bull queue |
| Adding new tables | Acceptable | Standard migration |
| Adding workspace header | Acceptable | Single middleware change |

### What scale are you realistically targeting?

**Recommendation based on architecture:**

| Scale | Feasible | Notes |
|-------|----------|-------|
| 10 orgs / workspaces | Yes | Current architecture handles |
| 100 orgs / workspaces | Yes | Schema-per-tenant scales |
| 1,000 orgs / workspaces | Maybe | Schema proliferation concern |

**Schema-per-tenant limits:**
- PostgreSQL handles thousands of schemas
- But: migration complexity grows linearly
- Consider: Row-level tenancy for very high scale

### Recommended Approach for Multi-Workspace

**Fresh Deployment Only** - No migration from existing installations.

**Phase 1: Minimal Changes**

1. **Add workspace tables** (new, don't modify existing)
   - `workspaces` table (with `oidc_enabled` boolean)
   - `user_workspaces` table

2. **Add workspace middleware** (new, wraps existing auth)
   - Extract workspace from URL or header
   - Validate user membership
   - Set `req.workspaceId`

3. **Add OIDC support** (new code, ~300-400 lines)
   - OIDC discovery, token exchange
   - Conditional: only if `workspace.oidc_enabled = true`
   - Email/password continues to work for non-OIDC workspaces

4. **Modify tenant hash logic** (single file)
   - Currently: `getTenantHash(organizationId)`
   - New: `getTenantHash(workspaceId)`
   - Schema naming: `ws_${workspaceId}`

5. **Don't touch utility files**
   - Schema isolation continues to work
   - Workspace = tenant

**No Phase 2 Needed** - Fresh deployment eliminates migration complexity.

### Key Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `middleware/auth.middleware.ts` | Add OIDC support, workspace context | P0 |
| `tools/getTenantHash.ts` | Accept workspaceId | P0 |
| `routes/*.route.ts` | Add workspace prefix to routes | P1 |
| `infrastructure/api/customAxios.ts` | Add X-Workspace-Id header | P1 |
| New: `middleware/workspace.middleware.ts` | Workspace resolution | P0 |
| New: `utils/workspace.utils.ts` | Workspace queries | P0 |

### Codebase Statistics

| Metric | Count |
|--------|-------|
| Utility files | 73 |
| Total lines in utils | 23,202 |
| Controller files | 64 |
| Database tables | ~40 per tenant |
| Existing tenants | Schema per org |

---

## Summary

**Strengths for multi-workspace:**
- Schema-based multi-tenancy already works
- JWT-based auth is extensible
- AsyncLocalStorage provides request context
- Background jobs handle tenant scope correctly

**Gaps to address:**
- No OIDC support (requires greenfield)
- No workspace concept (organization = tenant)
- Ownership fields not enforced server-side
- Permission denials not audited
- No super admin role

**Recommended strategy:**
1. Workspace = new concept layered on top of organization
2. Add OIDC configuration per workspace
3. Use existing schema isolation (workspace → tenant hash)
4. Add workspace context to auth middleware
5. Defer touching 73 utility files until phase 2

---

*End of Document*
