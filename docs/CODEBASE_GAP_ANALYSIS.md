# Codebase Gap Analysis: Current State vs Multi-Workspace Design

## Document Information

| Field | Value |
|-------|-------|
| Date | January 2026 |
| Codebase Analyzed | `/tmp/verifywise` |
| Compared Against | `WORKSPACE_MULTI_TENANCY_DESIGN.md` |

---

## Executive Summary

### Current Architecture (Corrected)

**The codebase is already multi-tenant with schema-per-organization isolation.** This is NOT single-tenant.

```
Current State:
├── public schema (control plane)
│   ├── users (with organization_id FK)
│   ├── organizations
│   └── roles
└── tenant schemas (one per org, named by hash)
    ├── {hash}.projects
    ├── {hash}.vendors
    ├── {hash}.risks
    └── ... (all domain tables)
```

**What multi-workspace adds:** Re-key isolation from `organizationId` → `workspaceId`. You're not inventing isolation—you're adding a layer beneath organization.

### Foundation Strengths
- Schema-per-tenant isolation already implemented via `getTenantHash(organizationId)`
- Control plane tables (users, organizations, roles) in `public` schema
- Domain tables (projects, vendors, risks) isolated in tenant schemas
- BullMQ worker pattern properly passes tenant context

### Critical Gaps
1. No `workspaces` table - uses `organizations` directly as isolation boundary
2. No `user_workspaces` table - users have single `organization_id`, can't belong to multiple workspaces
3. No `is_super_admin` field on users
4. Role is global (`users.role_id`) not per-workspace
5. No OIDC implementation (only JWT auth exists)

### Notable Corrections (from review)
- ✅ **Membership validation EXISTS** - `doesUserBelongsToOrganizationQuery()` in auth middleware
- ✅ **Token generation centralized** - `auth.utils.ts` is single point of change
- ✅ **AsyncLocalStorage ready** - Request context infrastructure exists
- ⚠️ **Role casing inconsistency** - "Admin" vs "admin" in different files

---

## Detailed Gap Analysis

### 1. Database Schema Gaps

#### Current State: `users` table
```sql
-- Current users table (from migrations)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  surname VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  role_id INTEGER REFERENCES roles(id),      -- Global role
  organization_id INTEGER REFERENCES organizations(id), -- Single org
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### Design Requirement: Extended `users` table
```sql
-- Required changes (from design doc)
ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN oidc_subject VARCHAR(255);  -- Audit only
ALTER TABLE users ADD COLUMN oidc_issuer VARCHAR(255);   -- Audit only
```

| Gap | Severity | Notes |
|-----|----------|-------|
| Missing `is_super_admin` | **HIGH** | Super admin concept doesn't exist |
| Missing `oidc_subject` | Medium | Needed for OIDC audit trail |
| Missing `oidc_issuer` | Medium | Needed for OIDC audit trail |
| `organization_id` is NOT NULL | **LOW** | ✅ OK if keeping "one org per deployment" - all workspaces under single org |

#### Missing Table: `workspaces`
```sql
-- Design requires this table (doesn't exist)
CREATE TABLE workspaces (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  schema_name VARCHAR(63) NOT NULL UNIQUE,  -- ← KEY: Store actual schema name
  organization_id INTEGER REFERENCES organizations(id),
  oidc_enabled BOOLEAN DEFAULT FALSE,
  oidc_issuer VARCHAR(255),
  oidc_client_id VARCHAR(255),
  oidc_client_secret_encrypted TEXT,
  is_active BOOLEAN DEFAULT TRUE,           -- For background job filtering
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Schema naming: store explicitly, never infer from ID
-- Benefits:
-- 1. Existing org schemas can map to "default workspace" without data migration
-- 2. Can use hash (current pattern) or ws_{id} - your choice per workspace
-- 3. Never touch raw SQL call sites that interpolate schema names
```

| Gap | Severity | Notes |
|-----|----------|-------|
| Table doesn't exist | **CRITICAL** | Core of multi-workspace architecture |
| No OIDC configuration storage | **HIGH** | Required for OIDC support |
| `schema_name` column | **HIGH** | Store explicitly; enables mapping existing org schemas to default workspace |

#### Missing Table: `user_workspaces`
```sql
-- Design requires this table (doesn't exist)
CREATE TABLE user_workspaces (
  user_id INTEGER REFERENCES users(id),
  workspace_id INTEGER REFERENCES workspaces(id),
  role VARCHAR(50) NOT NULL,  -- Per-workspace role
  oidc_issuer VARCHAR(255),   -- Bind identity to specific IdP for this workspace
  oidc_subject VARCHAR(255),  -- OIDC subject claim (for collision prevention)
  invited_by INTEGER REFERENCES users(id),
  invited_at TIMESTAMP,
  PRIMARY KEY (user_id, workspace_id)
);

-- Identity binding: On first OIDC login, store (issuer, subject).
-- On subsequent logins, require match if set. Prevents email collision across Entra tenants.
```

| Gap | Severity | Notes |
|-----|----------|-------|
| Table doesn't exist | **CRITICAL** | Required for multi-workspace membership |
| Per-workspace roles not possible | **HIGH** | Currently role is global |

---

### 2. Authentication Gaps

#### Current JWT Structure
```typescript
// From auth.middleware.ts (line 157-161)
req.userId = decoded.id;
req.role = decoded.roleName;
req.tenantId = decoded.tenantId;        // Hash of organizationId
req.organizationId = decoded.organizationId;
```

#### Design JWT Structure (Simplified - Identity-Based)

**Key Design Decision:** Keep JWT identity-based, resolve workspace per request.

```typescript
// Recommended JWT structure (identity-only, minimal coupling)
{
  id: number,
  email: string,
  orgId: number,                    // Keep for "one org per deployment"
  auth_method: 'local' | 'oidc',    // For re-auth enforcement
  auth_issuer: string | null,       // OIDC issuer if applicable
  lastWorkspaceId?: number,         // UI hint only, not enforcement
  expire: number
}

// Workspace resolved per request via middleware:
// - From URL: /api/w/:workspaceSlug/...
// - Or header: X-Workspace-Id
// Middleware sets: req.workspaceId, req.tenantId (schema), req.effectiveRole
```

**Why identity-based is better:**
- Workspace switch doesn't require token refresh
- Role/membership changes take effect immediately
- No footgun from trusting `tenantHash` in token without server validation

| Gap | Severity | Notes |
|-----|----------|-------|
| JWT currently workspace-coupled | **MEDIUM** | Simplify to identity-only, resolve workspace per request |
| Missing `auth_method`/`auth_issuer` | **HIGH** | Needed for server-side re-auth enforcement |
| Role baked into token | **MEDIUM** | Use `req.effectiveRole` from middleware instead |

#### OIDC Support
```typescript
// Current: Only passport-jwt for JWT validation
// package.json shows: "passport-jwt": "^4.0.1"

// Missing packages for OIDC:
// - openid-client
// - passport-azure-ad (for Entra ID)
// - @azure/msal-node (optional)
```

| Gap | Severity | Notes |
|-----|----------|-------|
| No OIDC packages | **HIGH** | Design requires optional OIDC |
| No OIDC callback routes | **HIGH** | No `/auth/callback` endpoints |
| No IdP configuration endpoints | **HIGH** | Admin API needed to configure OIDC |
| No IdP configuration UI | **LOW** | UI can come later; admin API + DB config sufficient for v1 |

---

### 3. Authorization/RBAC Gaps

#### Current RBAC Pattern
```typescript
// From accessControl.middleware.ts (line 64-78)
const authorize = (allowedRoles: string[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.role) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const roleName = req.role; // From JWT, sourced from users.role_id

    if (!allowedRoles.includes(roleName)) {
      return res.status(403).json({ message: "Access denied" });
    }
    return next();
  };
```

#### Existing Membership Validation (Good!)
```typescript
// From auth.middleware.ts (line 141-144) - THIS EXISTS!
const belongs = await doesUserBelongsToOrganizationQuery(decoded.id, decoded.organizationId);
if (!belongs.belongs) {
  return res.status(403).json({ message: 'User does not belong to this organization' });
}
```

**Correction:** The auth middleware DOES validate organization membership. This is good existing infrastructure that will need to change from checking `users.organization_id` to checking `user_workspaces`.

#### Design RBAC Pattern
```typescript
// Required: Role from user_workspaces
const authorize = (allowedRoles: string[]) =>
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Role should come from user_workspaces.role for current workspace
    const workspaceRole = await getUserWorkspaceRole(req.userId, req.workspaceId);
    if (!allowedRoles.includes(workspaceRole)) {
      return res.status(403).json({ message: "Access denied" });
    }
    return next();
  };
```

| Gap | Severity | Notes |
|-----|----------|-------|
| Role is global | **HIGH** | User has same role everywhere |
| No super admin check | **HIGH** | No bypass for super admins |
| Membership check uses `organization_id` | **MEDIUM** | ✅ Exists but needs to change to `user_workspaces` |

---

### 4. Background Jobs/Workers

#### Current Pattern (Good)
```typescript
// From automationWorker.ts (line 24-26)
const organizations = await getAllOrganizationsQuery();
for (let org of organizations) {
  const tenantHash = getTenantHash(org.id!);
  // ... process tenant
}
```

This pattern is **correct** for iterating all tenants. Just needs adaptation:
- Replace `getAllOrganizationsQuery()` → `getAllWorkspacesQuery()`
- Replace `getTenantHash(org.id)` → `getWorkspaceSchema(workspace.id)`

| Gap | Severity | Notes |
|-----|----------|-------|
| Iterates organizations not workspaces | Low | Easy rename once workspaces exist |
| Uses `getTenantHash` not `getWorkspaceSchema` | Low | Simple function rename |

---

### 5. Tenant Schema Creation

#### Current Pattern
```typescript
// From createNewTenant.ts (line 6-12)
export const createNewTenant = async (
  organization_id: number,
  transaction: Transaction
) => {
  const tenantHash = getTenantHash(organization_id);
  await sequelize.query(`CREATE SCHEMA "${tenantHash}";`, { transaction });
  // ... create all tenant tables
}
```

#### Design Pattern
```typescript
// Option A: Keep hash pattern, just change input (minimal churn)
export const createWorkspaceSchema = async (
  workspace_id: number,
  transaction: Transaction
) => {
  const schema = getTenantHash(workspace_id);  // Reuse existing function
  await sequelize.query(`CREATE SCHEMA "${schema}";`, { transaction });
}

// Option B: Store schema_name on workspaces table (flexible)
// workspaces.schema_name = 'ws_1' or hash - your choice
```

**Design Decision:** Schema naming (`ws_${id}` vs hash) is **optional optimization**. For minimal code churn, keep `getTenantHash()` style - just change what ID it hashes (workspaceId instead of orgId).

| Gap | Severity | Notes |
|-----|----------|-------|
| Schema name is hash | **LOW** | Optional - can keep hash for minimal churn |
| Tied to organization_id | **MEDIUM** | Change input to workspace_id |

---

### 6. API Routes

#### Current Pattern
All routes use organization from JWT:
```typescript
// Typical pattern in controllers
const organizationId = req.organizationId;
const tenantHash = getTenantHash(organizationId);
```

#### Design Pattern (Centralized in Middleware)
```typescript
// Middleware sets req.tenantId (schema name) once
// Controllers just use it directly - no recomputation needed
const schema = req.tenantId;  // Already computed by middleware

// Most utils already accept tenant schema as parameter
await getAllVendorsQuery(req.tenantId);
```

**Key insight:** Most utils already accept tenant schema or can be made to with small localized changes. Avoid global find/replace by centralizing tenant selection in middleware.

| Gap | Severity | Notes |
|-----|----------|-------|
| Utils recompute tenant from orgId | **LOW** | Centralize in middleware; utils already accept schema param |
| No workspace switching endpoint | **HIGH** | `/api/workspaces/switch` needed |
| No workspace CRUD endpoints | **HIGH** | Super admin workspace management |

---

## Implementation Roadmap (Greenfield Only)

**Deployment Model:** Fresh installations only. No data migration from existing systems (but schema migrations required for new tables/columns).

### ⚠️ Mandatory Implementation Items (Not Optional)

These are **required for correctness**, not extra features:

| Item | Why Mandatory |
|------|---------------|
| **Auth middleware split** | Current middleware rejects tokens if tenant doesn't match org. Must split into `authenticateJWT` (identity only) + `workspaceContextMiddleware` (resolves workspace, sets schema, sets role) |
| **`workspaces.schema_name` column** | Store schema name explicitly. Enables mapping existing org schemas to "default workspace" without data migration |
| **Refresh token returns identity-only JWT** | Current refresh couples tenant/role. Must change to return identity-only JWT; workspace resolved per request |
| **User listing filter by `user_workspaces`** | Otherwise workspace admins see ALL org users (visibility leak) |
| **Worker iteration switches to workspaces** | Otherwise new workspaces won't get scheduled jobs |
| **Pick ONE workspace selector method** | Header (`X-Workspace-Id`) OR URL prefix. Don't mix both |

### Phase 1: Database Foundation
1. Create `workspaces` table (with `schema_name`, OIDC config columns, `is_active`)
2. Create `user_workspaces` table (with per-workspace role, OIDC binding columns)
3. Add `is_super_admin` to users table

### Phase 2: Authentication Update
1. **Split auth middleware** into `authenticateJWT` + `workspaceContextMiddleware`
2. **Refactor refresh token** to return identity-only JWT (no workspace/role)
3. Add OIDC packages (openid-client)
4. Create OIDC callback routes
5. Update JWT to identity-based (`auth_method`, `auth_issuer`)
6. Implement `req.effectiveRole` lookup from `user_workspaces`
7. Add server-side re-auth enforcement (issuer mismatch → 401)

### Phase 3: API/Controller Updates
1. Add workspace management endpoints (CRUD for super admin)
2. Add workspace switching endpoint (updates UI hint, no auth change)
3. **Update user listing to filter by `user_workspaces`**
4. **Update worker iteration to use workspaces**
5. Centralize tenant resolution in middleware (minimal controller changes)

### Phase 4: Frontend
1. Workspace selector UI
2. Workspace switching flow
3. OIDC login flow
4. Super admin workspace management UI (can defer to v2)

---

## What's Already Working Well

| Component | Status | Notes |
|-----------|--------|-------|
| Schema-per-tenant isolation | ✅ Good | Foundation is solid |
| Control plane in public schema | ✅ Good | users, organizations, roles correctly placed |
| Domain tables in tenant schemas | ✅ Good | projects, vendors, risks isolated |
| BullMQ workers tenant iteration | ✅ Good | Pattern is correct, just needs rename |
| JWT middleware structure | ✅ Good | Just needs extended claims |
| RBAC middleware structure | ✅ Good | Just needs workspace role lookup |
| **Organization membership check** | ✅ Good | `doesUserBelongsToOrganizationQuery()` exists in auth middleware |
| **Token generation centralized** | ✅ Good | `generateUserTokens()` in `auth.utils.ts` - single place to update |
| **Refresh token with HTTP-only cookies** | ✅ Good | Already implemented securely |
| **Express Request type extended** | ✅ Good | `types/express.d.ts` already extends Request |
| **AsyncLocalStorage context** | ✅ Good | Request context propagation infrastructure exists |
| **Change history tables** | ✅ Good | Per-tenant audit tables already exist |

### Detailed Infrastructure Notes

#### Token Generation (Single Point of Change)
```typescript
// auth.utils.ts - Centralized token generation
export function generateUserTokens(userData: UserTokenData, res: Response) {
  const tokenPayload = {
    id: userData.id,
    email: userData.email,
    roleName: userData.roleName,        // Change to workspace role
    tenantId: getTenantHash(userData.organizationId),  // Change to workspace schema
    organizationId: userData.organizationId,  // Change to workspaceId
  };
  // ... sets refresh_token cookie
}
```

#### Express Request Type Definition
```typescript
// types/express.d.ts - Already extended
declare module 'express' {
  interface Request {
    userId?: number;
    role?: string;
    tenantId?: string;        // Will need to add workspaceId
    organizationId?: number;  // Will change to workspaceId
  }
}
```

#### AsyncLocalStorage (Extensible Context)
```typescript
// utils/context/context.ts - Currently stores userId
type RequestContext = {
  userId?: number;
  // Can extend with: workspaceId, tenantSchema, etc.
};
export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();
```

---

## Files Requiring Changes

### Critical (Must Change)
- `Servers/middleware/auth.middleware.ts` - JWT validation
- `Servers/utils/jwt.utils.ts` - Token generation
- `Servers/middleware/accessControl.middleware.ts` - Role checking
- `Servers/tools/getTenantHash.ts` - Rename to workspace pattern
- `Servers/scripts/createNewTenant.ts` - Workspace schema creation

### High Priority (Most Controllers)
- All files in `Servers/controllers/*.ctrl.ts`
- All files in `Servers/utils/*.utils.ts` using organizationId
- All files in `Servers/services/automations/` - Worker tenant handling

### Medium Priority
- `Servers/database/migrations/` - New migration files needed
- Route files - New workspace routes needed

---

## Developer Review Feedback (2026-01-03)

Based on external developer review, these additional implementation concerns were identified:

### F) Auth Middleware Must Be Split (Not Just Renamed)

**Issue:** Simply swapping `getTenantHash()` → `getWorkspaceSchema()` won't work because:
```typescript
// auth.middleware.ts:153 - REJECTS if tenant doesn't match org
if (decoded.tenantId !== getTenantHash(decoded.organizationId)) {
  return res.status(400).json({ message: 'Invalid token' });
}
```

**Required Approach:**
1. `authenticateJWT` → Validates identity + user exists (no tenant check)
2. `workspaceContextMiddleware` → Resolves workspace from header/URL, sets `req.tenantId` (schema), sets `req.effectiveRole`

### G) Effective Role Pattern

To avoid touching all routes, use:
```typescript
// After workspace resolution
req.effectiveRole = workspaceRole ?? userGlobalRole;

// authorize() checks effectiveRole instead of req.role
```

### H) Server-Side Re-Auth Enforcement

If re-auth logic is frontend-only, it's bypassable via direct API calls.

**Fix:** Add claims to JWT at login:
```typescript
{
  auth_method: 'local' | 'oidc',
  auth_issuer: '<issuer>' | null
}
```
Then middleware compares token auth context vs workspace's required issuer → return `401 WORKSPACE_REAUTH_REQUIRED` on mismatch.

### I) User API Visibility Leak

Once multiple workspaces exist in one org, workspace admins might see ALL org users.

**Current:** `SELECT * FROM users WHERE organization_id = ?`
**Required:** Join with `user_workspaces` to filter by current workspace.

### J) "Fresh Deployment" Needs Clarification

Design doc says "no migration scripts" but still needs migrations for:
- `workspaces` table
- `user_workspaces` table
- OIDC config columns on workspaces
- `is_super_admin` on users

**Clarification:** "Fresh deployment" = no DATA migration, but SCHEMA migrations are required.

---

## Potential Issues & Edge Cases

### 1. Role Validation in Auth Middleware
```typescript
// auth.middleware.ts line 146-150
const user = await getUserByIdQuery(decoded.id)
if (decoded.roleName !== roleMap.get(user.role_id)) {
  return res.status(403).json({ message: 'Not allowed to access' });
}
```
**Issue:** This validates that JWT role matches `users.role_id`. In multi-workspace, role comes from `user_workspaces.role` which varies per workspace. This check will need significant rework.

### 2. Tenant Hash Collision Risk
```typescript
// getTenantHash.ts
const hash = createHash('sha256').update(tenantId.toString()).digest('base64');
return hash.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
```
**Note:** 10-character hash gives ~62^10 possibilities (800+ quintillion), collision risk is negligible for ~100 workspaces. However, design doc suggests `ws_${id}` for readability.

### 3. Hard-coded Role Names
Several places use string literals like `"Admin"`, `"admin"` (inconsistent casing):
- `tokens.ctrl.ts:24` - `roleName: "Admin"`
- `organization.ctrl.ts:333` - `roleName: "Admin"`
- `control.ctrl.ts:279` - `roleName === "admin"` (lowercase!)

**Issue:** Case inconsistency could cause authorization failures.

### 4. Users Table Column Name
Initial migration used `role` but was renamed to `role_id` via migration `20250520134340-rename-role-column.js`. Code uses `role_id` correctly.

### 5. Email Case Sensitivity (VERIFIED OK)
```typescript
// user.utils.ts:89 - Already handles case-insensitive lookup
WHERE LOWER(users.email) = LOWER(:email)
```
**Status:** ✅ Already handled correctly in codebase.

### 6. OIDC Email-Only Identity Matching Risk (NEW)

**Issue:** The same email can exist across different Entra ID tenants (guest users, mergers, shared aliases). If matching purely by email, you could accidentally bind the wrong person to an account.

**Example:**
- User `hans@corp.com` exists in Germany Entra tenant
- Guest user `hans@corp.com` also exists in Turkey Entra tenant (different person or same person via B2B)
- If you match only by email, both could access the same VerifyWise account

**Mitigation (stays simple):**
```typescript
// On first successful OIDC login for a workspace:
// Bind (issuer, subject) to that user for that workspace

// user_workspaces table addition:
oidc_issuer VARCHAR(255),   -- e.g., 'https://login.microsoftonline.com/{tenant}'
oidc_subject VARCHAR(255),  -- e.g., Azure AD object ID

// On subsequent logins:
// Require same (issuer, subject) match, not just email
```

**When to enforce:**
- First OIDC login: Store `(issuer, subject)` on `user_workspaces`
- Later logins: If `user_workspaces.oidc_subject` is set, require exact match
- This prevents email collision without adding complexity of identity linking table

### 7. Workspace Archived vs Deleted
With schema-per-workspace, "delete" means `DROP SCHEMA` (scary/irreversible). Design should prefer archive with `is_archived` flag.

### 8. Workspace Selection Method
Developer suggests picking ONE method:
- **URL-based:** `/api/w/:workspaceSlug/...` (best for debugging)
- **Header-based:** `X-Workspace-Id` (best for API clients)

Don't mix both - creates weird bugs.

### 9. Request Identity Shape Inconsistency (NEW)

**Issue:** `control.ctrl.ts` uses `(req as any).user?.roleName`, but auth middleware sets `req.role` and `req.userId`, not `req.user`.

```typescript
// control.ctrl.ts - uses req.user
const roleName = (req as any).user?.roleName;

// auth.middleware.ts - sets req.role, NOT req.user
req.userId = decoded.id;
req.role = decoded.roleName;
```

**Impact:** Any new "workspace role" work will be harder if the request identity shape is inconsistent across controllers.

**Simple fix:** Standardize on `req.userId`, `req.role`, and later `req.workspaceId`. Remove `req.user` usage unless explicitly populated.

### 10. Refresh Token Workspace Switching Behavior (NEW)

**Issue:** Refresh tokens are currently tied to tenant context in the token payload. If you implement workspace switching by just changing a header, but refresh still mints access tokens for the old workspace, you'll get confusing "it switched, but then it snapped back" behavior.

**Simple fix options (pick one):**
- **Easiest UX:** On workspace switch, mint a new refresh token as well (overwrite cookie), so refresh is always aligned to the current workspace.
- **Simplest backend:** Don't do "workspace switch" server side at all—require re-login per workspace (worse UX, but dead simple).

### 11. Public Share Links Scan Schemas (NEW)

**Issue:** There is at least one public flow that iterates schemas to find a token (share links). If you grow from "few orgs" to "orgs times workspaces," this becomes slower linearly.

**Simple mitigation:** Store a mapping in `public` schema like `share_tokens(token, workspace_id, created_at)` so resolution is one lookup, then jump straight to the right schema.

### 12. Background Jobs "Iterate All Tenants" Scale (NEW)

**Issue:** Gap analysis correctly notes workers iterate all orgs today. With workspaces, that becomes "iterate all workspaces." That's fine for the 80% case, but:
- You probably want a single `workspace.is_active` flag and skip inactive
- You may want a soft cap guard in configs (to avoid accidental 10k schema loops later)

### 13. Role Normalization Recommendation (NEW)

**Issue:** Role casing inconsistency (`"Admin"` vs `"admin"`) is a real bug risk.

**Simple fix:** Use a single enum source or even a const object:
```typescript
const Roles = {
  Admin: "Admin",
  Reviewer: "Reviewer",
  Editor: "Editor",
  Auditor: "Auditor"
} as const;
```
Then never type role strings directly—import from this single source.

---

## Scope Notes

### Analyzed
- `/tmp/verifywise/Servers/` - Backend codebase
- Database migrations
- Authentication/authorization flow
- Background job patterns
- Token generation and validation

### NOT Analyzed (Out of Scope)
- Frontend (`Clients/`) - Workspace selector UI, etc.
- Gateway service
- EvaluationModule
- Infrastructure/deployment configs

### Related Work (Separate Codebase)
The plan file mentions form builder work with organization slug migrations. These exist in the main codebase (`/Users/gorkemcetin/verifywise`) but NOT in the analyzed codebase (`/tmp/verifywise`). The form builder migrations added:
- `organizations.slug` column
- Unique random ID generation for public URLs

---

## Summary

The current codebase has a **solid foundation** due to the existing schema-per-tenant isolation. The main work involves:

1. **Database**: Adding workspaces/user_workspaces tables and super admin flag
2. **Auth**: OIDC support and JWT claims update
3. **RBAC**: Per-workspace role lookup instead of global role
4. **Terminology**: organization → workspace rename across codebase

### Key Positives Discovered
- **Membership validation already exists** in auth middleware (just needs table change)
- **Token generation is centralized** in `auth.utils.ts` (single update point)
- **AsyncLocalStorage infrastructure** ready for extended context
- **Change history/audit tables** already tenant-isolated
- **Refresh tokens properly implemented** with HTTP-only cookies

The design document is well-aligned with the existing architecture patterns, making the implementation feasible without major architectural changes (greenfield deployment only - no data migration required).

---

## Design Decisions to Keep It Simple

Based on developer review, these decisions minimize implementation complexity:

| Decision | Rationale |
|----------|-----------|
| Keep `users.organization_id` as-is | One org per deployment; all workspaces under single org |
| **JWT is identity-only** | No workspace/role in token. Workspace resolved per request; no token refresh on switch |
| **Refresh returns identity-only JWT** | Workspace is resolved by middleware on each request, not baked into refresh |
| **Store `schema_name` explicitly** | Don't infer from ID; enables mapping existing org schemas to default workspace |
| Use `req.effectiveRole` for authz | Workspace role from `user_workspaces`, checked by middleware |
| **Auth middleware split is mandatory** | `authenticateJWT` (identity) + `workspaceContextMiddleware` (workspace/schema/role) |
| No UI for IdP config in v1 | Admin API + DB config sufficient; UI can come later |
| Bind OIDC by (issuer, subject) per workspace | Prevents email collision across Entra tenants |
| Centralize tenant resolution in middleware | Avoid touching many utility files; controllers use `req.tenantId` |
| **Header-only workspace selector** | Use `X-Workspace-Id` header; don't mix with URL prefix in v1 |

---

## Revision History

| Date | Change |
|------|--------|
| 2026-01-03 | Initial analysis |
| 2026-01-03 | Corrected: Organization membership validation EXISTS in auth middleware |
| 2026-01-03 | Added: Existing good infrastructure details (token gen, AsyncLocalStorage, etc.) |
| 2026-01-03 | Added: Potential issues section (role validation, case inconsistency) |
| 2026-01-03 | Added: Developer review feedback (auth split, effective role, re-auth enforcement, user visibility leak) |
| 2026-01-03 | Verified: Email case sensitivity already handled with LOWER() |
| 2026-01-03 | Added: Workspace archive vs delete, workspace selection method recommendations |
| 2026-01-03 | Applied 7 simplification suggestions from developer review |
| 2026-01-03 | Added: OIDC identity binding edge case with (issuer, subject) mitigation |
| 2026-01-03 | Added: Design Decisions to Keep It Simple section |
| 2026-01-03 | Added: 5 new gaps from developer code path review (req.user inconsistency, refresh token behavior, share links scan, background job scale, role normalization) |
| 2026-01-03 | Dropped specific "73 files" count per developer suggestion |
| 2026-01-03 | **Major revision:** Corrected "Current State" to multi-tenant (schema-per-org, not single-tenant) |
| 2026-01-03 | Added `schema_name` column to workspaces table (mandatory, enables existing org schema mapping) |
| 2026-01-03 | Added `is_active` to workspaces table for background job filtering |
| 2026-01-03 | Added OIDC binding columns to `user_workspaces` table |
| 2026-01-03 | Created "Mandatory Implementation Items" section to distinguish required vs optional |
| 2026-01-03 | Elevated auth middleware split, refresh token refactor as mandatory items |
