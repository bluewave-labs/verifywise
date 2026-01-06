# VerifyWise Multi-Workspace Architecture

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Date | January 2026 |
| Status | Draft - For Discussion |
| Author | Architecture Team |

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Confirmed Decisions (Locked)](#confirmed-decisions-locked)
3. [Problem Statement](#problem-statement)
4. [Proposed Solution](#proposed-solution)
5. [Architecture Overview](#architecture-overview)
6. [Database Design](#database-design)
7. [Authentication Flow](#authentication-flow)
8. [Authorization Model](#authorization-model)
9. [Security & Secrets Management](#security--secrets-management)
10. [User Experience](#user-experience)
11. [Technical Implementation](#technical-implementation)
12. [Deployment Model](#deployment-model)
13. [Future Considerations](#future-considerations)
14. [Open Questions for Discussion](#open-questions-for-discussion)
15. [Resolved Design Decisions](#resolved-design-decisions)
16. [Known Edge Cases](#known-edge-cases)

---

## Executive Summary

This document outlines a **simple, flat multi-workspace architecture** for VerifyWise that enables organizations with multiple regional offices (e.g., Germany HQ, Turkey, France) to manage their AI governance data in isolated workspaces while maintaining the ability for authorized users to access multiple workspaces.

### Key Design Principles

1. **Simplicity over complexity** - Flat workspace model, no hierarchy
2. **Explicit over implicit** - Users are explicitly added to workspaces, no automatic inheritance
3. **Single database** - Soft multi-tenancy with schema-per-workspace isolation
4. **Workspace-first authentication** - Users select workspace, then authenticate
5. **OIDC is optional** - Workspaces can use email/password OR OIDC (not forced)
6. **Fresh deployment** - No migration from existing installations required

---

## Confirmed Decisions (Locked)

These decisions have been finalized and are NOT open for discussion:

| Decision | Value | Rationale |
|----------|-------|-----------|
| Workspace belongs to one org | Yes | Maps to existing schema isolation |
| Same email in multiple workspaces | **Yes** | Re-auth required when switching between different IdPs |
| Refresh token scope | Global | Workspace resolved per request |
| Max workspaces per deployment | ~100 | Well within PostgreSQL limits |
| OIDC requirement | **Optional** | Email/password continues to work |
| Deployment model | **Fresh only** | No data migration; schema migrations still required |
| Super admin count | Multiple allowed, min 1 | First user is super admin |
| Identity linking | **Not needed** | Email is canonical, re-auth handles multi-IdP |
| Data isolation | **Schema-per-workspace** | No row-level workspace_id columns on domain tables |
| "All Workspaces" view | **Not in Phase 1** | Super admin switches workspaces |

### Authentication Model

```
Workspace Config Options:
├── oidc_enabled: false  → Email/password login (current behavior)
└── oidc_enabled: true   → OIDC redirect to configured provider

Login Flow:
1. User selects workspace
2. If workspace.oidc_enabled:
   → Redirect to OIDC provider (Entra ID, etc.)
3. Else:
   → Show email/password form (existing flow)
```

### User Identity Rules

- **One email = One user** (globally, not per-workspace)
- Same email CAN belong to multiple workspaces
- Membership tracked in `user_workspaces` table
- Email is the canonical identifier

### Multi-Workspace Access with Re-Authentication

```
Hans@corp.com → Member of [Germany, France, Turkey]

Workspace Authentication:
├── Germany: Uses Germany Entra ID
├── France:  Uses France Entra ID
└── Turkey:  Uses email/password

Workspace Switch Behavior:
├── Germany → France: Re-authenticate (different IdP)
├── France → Turkey:  Re-authenticate (different auth method)
├── Germany → Germany-Dev (same IdP): Seamless switch
└── Turkey → Turkey-Test (both email/password): Seamless switch
```

**Re-auth logic:**
```typescript
const needsReAuth = (
  currentWorkspace: Workspace | null,  // null on first login or session expired
  targetWorkspace: Workspace
): boolean => {
  // First login or no current session - always requires auth
  if (!currentWorkspace) {
    return true;
  }

  // Different OIDC issuers - re-auth required
  if (currentWorkspace.oidc_enabled && targetWorkspace.oidc_enabled &&
      currentWorkspace.oidc_issuer !== targetWorkspace.oidc_issuer) {
    return true;
  }

  // One is OIDC, other is email/password - re-auth required
  if (currentWorkspace.oidc_enabled !== targetWorkspace.oidc_enabled) {
    return true;
  }

  // Same auth method (both OIDC with same issuer, or both email/password) - seamless switch
  return false;
};
```

**Security property:** Authentication via an IdP doesn't grant access. User must be explicitly added to workspace by admin. The IdP just verifies identity.

---

## Problem Statement

### Current State
VerifyWise is already **multi-tenant with schema-per-organization isolation**:
- Control plane tables (users, organizations, roles) in `public` schema
- Domain tables (projects, vendors, risks) isolated in per-org tenant schemas
- Schema names derived from `getTenantHash(organizationId)`

However, current isolation boundary is **organization**, not workspace. Users belong to one organization and have a single global role.

### Desired State
Change isolation boundary from **schema-per-organization** to **schema-per-workspace**. Support enterprise customers with multiple regional offices where:
- Each region (Turkey, France, Germany) has isolated data
- Regional users only see their region's data
- HQ users can access multiple regions for oversight
- Each region authenticates via their own Microsoft Entra ID tenant
- Global reporting aggregates data across regions

### Example Customer Scenario
```
Company: Global Corp
├── Germany (HQ)      → Uses Germany Entra ID
├── Turkey Office     → Uses Turkey Entra ID
└── France Office     → Uses France Entra ID

Requirements:
- Turkey employees see only Turkey data
- France employees see only France data
- Germany HQ can see Germany + Turkey + France for oversight
- Compliance reports can aggregate all regions
```

---

## Proposed Solution

### Approach: Simple Multi-Workspace (No Hierarchy)

We propose a **flat workspace model** similar to how Slack, Notion, and Linear handle multi-tenancy:

- Workspaces are independent, isolated containers
- Users can be members of one or more workspaces
- Each workspace has its own OIDC configuration
- No parent/child relationships between workspaces
- Cross-workspace access is achieved by adding users to multiple workspaces

### Why Not Hierarchy?

We evaluated ServiceNow's domain separation model with parent/child hierarchies but concluded:

| Hierarchy Model | Flat Model (Recommended) |
|-----------------|--------------------------|
| Complex visibility rules | Simple: you're in or you're out |
| Recursive queries for inheritance | Simple IN clause queries |
| "Why can user X see this?" is hard to debug | Check `user_workspaces` table |
| Requires visibility grants for edge cases | Just add user to workspace |
| Over-engineered for our use case | Matches our actual requirements |

### Core Concept

```
┌─────────────────────────────────────────────────────────────┐
│                     HOW ACCESS WORKS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Turkey Employee    →  Member of: [Turkey]                 │
│                         Can see: Turkey data only           │
│                                                             │
│   France Employee    →  Member of: [France]                 │
│                         Can see: France data only           │
│                                                             │
│   Germany HQ Manager →  Member of: [Germany, Turkey, France]│
│                         Can see: All three workspaces       │
│                         Can switch between them in UI       │
│                                                             │
│   Super Admin        →  is_super_admin: true                │
│                         Can see: Everything                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture Overview

### High-Level Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   User       │     │  Workspace   │     │   Entra ID   │
│   Browser    │────▶│  Selection   │────▶│   (per WS)   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    VerifyWise Platform                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   User      │  │  Workspace  │  │    Data Layer       │ │
│  │ Resolution  │─▶│  Context    │─▶│  (schema-per-       │ │
│  │             │  │  Middleware │  │   workspace)        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ ws_1.*   │  │ ws_2.*   │  │ ws_3.*   │   ← Workspace    │
│  │ (Turkey) │  │ (France) │  │ (Germany)│     Schemas      │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Workspace Selection Screen** - User chooses workspace before login
2. **OIDC Configuration per Workspace** - Each workspace has its own Entra ID
3. **User Resolution** - Match/create user, validate workspace membership
4. **Workspace Context Middleware** - Resolves workspace schema for queries
5. **Workspace Switcher** - UI component for multi-workspace users

---

## Database Design

### New Tables

#### `workspaces` - Workspace definitions

```sql
CREATE TABLE workspaces (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,

    -- Schema naming: store explicitly, never infer from ID
    -- Benefits: can map existing org schemas to "default workspace", supports hash or ws_{id}
    schema_name VARCHAR(63) NOT NULL UNIQUE,

    country_code VARCHAR(2),
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en-US',

    -- Authentication Configuration
    oidc_enabled BOOLEAN DEFAULT FALSE,  -- false = email/password, true = OIDC
    oidc_issuer VARCHAR(500),            -- nullable if oidc_enabled = false
    oidc_client_id VARCHAR(255),         -- nullable if oidc_enabled = false
    oidc_client_secret_encrypted VARCHAR(500),

    -- Settings
    settings JSONB DEFAULT '{}',

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    archived_at TIMESTAMP,               -- null = active, set = archived
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Example data: Mixed OIDC and email/password workspaces
-- schema_name uses hash (same as current getTenantHash pattern)
INSERT INTO workspaces (organization_id, name, slug, schema_name, country_code, timezone, oidc_enabled, oidc_issuer, oidc_client_id) VALUES
-- OIDC-enabled workspaces (Entra ID)
(1, 'Turkey', 'tr', 'a1b2c3d4e5', 'TR', 'Europe/Istanbul', TRUE, 'https://login.microsoftonline.com/turkey-tenant-id/v2.0', 'turkey-client-id'),
(1, 'France', 'fr', 'f6g7h8i9j0', 'FR', 'Europe/Paris', TRUE, 'https://login.microsoftonline.com/france-tenant-id/v2.0', 'france-client-id'),
-- Email/password workspace (no OIDC)
(1, 'Development', 'dev', 'k1l2m3n4o5', NULL, 'UTC', FALSE, NULL, NULL);
```

#### `user_workspaces` - User membership in workspaces

```sql
CREATE TABLE user_workspaces (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

    -- Role within this workspace - reuse existing roles table
    role_id INTEGER NOT NULL REFERENCES roles(id),
    -- Existing roles: Admin (1), Reviewer (2), Editor (3), Auditor (4)
    -- This keeps middleware authorize(['Admin', 'Editor']) working unchanged

    -- User preferences for this workspace
    is_default BOOLEAN DEFAULT FALSE,  -- Show this workspace on login

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),

    UNIQUE(user_id, workspace_id)
);

-- Index for fast lookups
CREATE INDEX idx_user_workspaces_user ON user_workspaces(user_id);
CREATE INDEX idx_user_workspaces_workspace ON user_workspaces(workspace_id);
```

#### Modification to `users` table

```sql
-- Add super admin flag
ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;

-- Store OIDC subject for audit trail only (NOT for identity matching)
-- Email remains canonical identifier; these are for debugging/compliance logs
ALTER TABLE users ADD COLUMN oidc_subject VARCHAR(255);
ALTER TABLE users ADD COLUMN oidc_issuer VARCHAR(500);
```

### Data Isolation: Schema-Per-Workspace

**No `workspace_id` columns on domain tables.** Isolation is achieved via PostgreSQL schemas.

```
public schema (shared control plane):
├── users
├── organizations
├── workspaces
└── user_workspaces

ws_1 schema (Germany workspace):
├── projects
├── vendors
├── risks
├── policies
├── assessments
├── model_inventory
├── tasks
└── incidents

ws_2 schema (France workspace):
├── projects      ← Same table structure, different schema
├── vendors
├── risks
└── ...
```

**Why schema isolation instead of row-level `workspace_id`:**
- Leverages existing VerifyWise architecture (already uses schema-per-tenant)
- No changes needed to utility files
- Only change: `getTenantHash(organizationId)` → `getWorkspaceSchema(workspaceId)`
- Clean separation, no accidental cross-workspace data leaks

### Workspace Schema Lifecycle

**Creating a new workspace:**
```
1. INSERT workspace row (with generated schema_name)
2. CREATE SCHEMA "{schema_name}"
3. Run tenant migrations against new schema (same as existing createNewTenant pattern)
```

**Keeping schemas in sync with migrations:**
```
All future tenant migrations iterate workspaces and apply to each workspace schema.
This is the same pattern as existing org-based tenant migrations.
```

**Security:** Never accept `schema_name` from client. Always resolve from `workspaces` table server-side. Schema names are used in SQL interpolation, so client control = SQL injection risk.

### Entity Relationship Diagram

```
PUBLIC SCHEMA (shared)
┌─────────────────┐       ┌─────────────────────┐       ┌─────────────────┐
│   workspaces    │       │   user_workspaces   │       │     users       │
├─────────────────┤       ├─────────────────────┤       ├─────────────────┤
│ id (PK)         │◄──────│ workspace_id (FK)   │       │ id (PK)         │
│ name            │       │ user_id (FK)        │──────▶│ email           │
│ slug            │       │ role_id (FK→roles)  │       │ name            │
│ schema_name     │       │ is_default          │       │ is_super_admin  │
│ oidc_issuer     │       │ created_at          │       └─────────────────┘
│ oidc_client_id  │       └─────────────────────┘
│ settings        │
└─────────────────┘

WORKSPACE SCHEMAS (isolated domain data)
ws_1.*            ws_2.*            ws_3.*
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ projects     │  │ projects     │  │ projects     │
│ vendors      │  │ vendors      │  │ vendors      │
│ risks        │  │ risks        │  │ risks        │
│ policies     │  │ policies     │  │ policies     │
│ ...          │  │ ...          │  │ ...          │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## Authentication Flow

### Workspace-First Login

Unlike traditional OIDC flows where users go directly to a single IdP, our flow starts with workspace selection:

```
┌─────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  User   │────▶│  Workspace   │────▶│   OIDC      │────▶│  VerifyWise  │
│         │     │  Selection   │     │   Login     │     │  Callback    │
└─────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                      │                     │                    │
                      │  1. User picks      │  2. Redirect to    │  3. Validate token
                      │     "Turkey"        │     Turkey Entra   │     Create session
                      │                     │     ID             │     Set workspace
                      ▼                     ▼                    ▼
```

### Detailed Flow

#### Step 1: Workspace Selection Page (`/login`)

```
┌─────────────────────────────────────────────┐
│                                             │
│            Welcome to VerifyWise            │
│                                             │
│         Select your workspace:              │
│                                             │
│    ┌─────────────────────────────────┐     │
│    │  🇹🇷  Turkey                    │     │
│    └─────────────────────────────────┘     │
│    ┌─────────────────────────────────┐     │
│    │  🇫🇷  France                    │     │
│    └─────────────────────────────────┘     │
│    ┌─────────────────────────────────┐     │
│    │  🇩🇪  Germany                   │     │
│    └─────────────────────────────────┘     │
│                                             │
└─────────────────────────────────────────────┘
```

#### Step 2: OIDC Redirect

When user clicks a workspace:
1. Look up OIDC configuration for that workspace
2. Store selected `workspace_id` in session/state parameter
3. Redirect to workspace's Entra ID login

```typescript
// Example: /api/auth/login?workspace=tr
const initiateLogin = async (workspaceSlug: string) => {
  const workspace = await db.workspaces.findBySlug(workspaceSlug);

  const state = encodeState({
    workspace_id: workspace.id,
    redirect_uri: '/dashboard'
  });

  const authUrl = buildOIDCAuthUrl({
    issuer: workspace.oidc_issuer,
    client_id: workspace.oidc_client_id,
    redirect_uri: `${BASE_URL}/api/auth/callback`,
    state: state,
    scope: 'openid profile email'
  });

  redirect(authUrl);
};

// SECURITY: State parameter must be signed and include nonce
// Prevents CSRF and replay attacks
interface OIDCState {
  workspace_id: number;
  redirect_uri: string;
  nonce: string;      // Random value for replay protection
  exp: number;        // Expiration timestamp (5 minutes)
}

const encodeState = (data: Omit<OIDCState, 'nonce' | 'exp'>): string => {
  const state: OIDCState = {
    ...data,
    nonce: crypto.randomBytes(16).toString('hex'),
    exp: Date.now() + 5 * 60 * 1000  // 5 minute expiration
  };

  const payload = Buffer.from(JSON.stringify(state)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', process.env.STATE_SIGNING_SECRET!)
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
};

const decodeState = (stateParam: string): OIDCState => {
  const [payload, signature] = stateParam.split('.');

  // Verify signature
  const expectedSig = crypto
    .createHmac('sha256', process.env.STATE_SIGNING_SECRET!)
    .update(payload)
    .digest('base64url');

  if (signature !== expectedSig) {
    throw new Error('Invalid state signature - possible CSRF attack');
  }

  const state: OIDCState = JSON.parse(Buffer.from(payload, 'base64url').toString());

  // Check expiration
  if (Date.now() > state.exp) {
    throw new Error('State expired - please try logging in again');
  }

  return state;
};
```

#### Step 3: OIDC Callback

```typescript
// /api/auth/callback
const handleCallback = async (code: string, state: string) => {
  const { workspace_id } = decodeState(state);
  const workspace = await db.workspaces.findById(workspace_id);

  // Exchange code for tokens using workspace's OIDC config
  const tokens = await exchangeCodeForTokens({
    issuer: workspace.oidc_issuer,
    client_id: workspace.oidc_client_id,
    client_secret: decrypt(workspace.oidc_client_secret_encrypted),
    code: code
  });

  const claims = decodeIdToken(tokens.id_token);

  // REQUIREMENT: Email claim must be present
  // Entra ID can return different values (email, preferred_username, mail, upn)
  // We require the IdP to be configured to send the 'email' claim
  if (!claims.email) {
    throw new OIDCConfigurationError(
      'OIDC configuration error: email claim is required. ' +
      'Please configure your identity provider to include the email claim in tokens.'
    );
  }

  // Find or create user by EMAIL (canonical identifier)
  let user = await db.users.findByEmail(claims.email);

  if (!user) {
    user = await db.users.create({
      email: claims.email,
      name: claims.name,
      // Store for audit trail only, NOT used for identity matching
      oidc_subject: claims.sub,
      oidc_issuer: claims.iss
    });
  }

  // Check if user has membership in this workspace
  // Security: IdP auth does NOT grant access - membership must exist
  const membership = await db.user_workspaces.find({
    user_id: user.id,
    workspace_id: workspace_id
  });

  if (!membership && !user.is_super_admin) {
    // User exists but not member of this workspace
    // DO NOT auto-add - require explicit admin invitation
    return { error: 'USER_NOT_MEMBER', user_id: user.id };
  }

  // Create session
  const session = await createSession({
    user_id: user.id,
    current_workspace_id: workspace_id,
    accessible_workspaces: await getUserWorkspaceIds(user.id)
  });

  return session;
};
```

---

## Authorization Model

### Role Sourcing: Critical Change from Current System

**Current system:** Role comes from `users.role_id` (one role globally)

**Multi-workspace:** Role comes from `user_workspaces.role_id` (per-workspace role)

```
Hans@corp.com:
├── Germany workspace: role = Admin (1)    ← Can manage users, full access
├── France workspace:  role = Auditor (4)  ← Read-only access
└── Turkey workspace:  role = Editor (3)   ← Can create/edit
```

**Migration impact:** The `authorize(['Admin'])` middleware pattern stays the same, but role lookup changes from `users.role_id` to `user_workspaces.role_id WHERE workspace_id = current`.

### Role Definitions (Reuse Existing)

| Role ID | Role Name | Description | Permissions |
|---------|-----------|-------------|-------------|
| 1 | `Admin` | Workspace administrator | Full access + User management |
| 2 | `Reviewer` | Review access | View + Approve/Reject |
| 3 | `Editor` | Standard user | View + Create + Edit data |
| 4 | `Auditor` | Read-only access | View all data in workspace |
| - | `is_super_admin` | Global flag on users table | Access to all workspaces + System settings |

**Note:** Reusing existing roles table avoids introducing new role names that conflict with middleware.

### Permission Matrix

| Action | Auditor | Editor | Reviewer | Admin | Super Admin |
|--------|---------|--------|----------|-------|-------------|
| View data | ✓ | ✓ | ✓ | ✓ | ✓ (all WS) |
| Create records | ✗ | ✓ | ✓ | ✓ | ✓ |
| Edit records | ✗ | ✓ | ✓ | ✓ | ✓ |
| Approve/Reject | ✗ | ✗ | ✓ | ✓ | ✓ |
| Delete records | ✗ | ✗ | ✗ | ✓ | ✓ |
| Manage users in workspace | ✗ | ✗ | ✗ | ✓ | ✓ |
| Workspace settings | ✗ | ✗ | ✗ | ✓ | ✓ |
| Create workspaces | ✗ | ✗ | ✗ | ✗ | ✓ |
| Global system settings | ✗ | ✗ | ✗ | ✗ | ✓ |

**Note:** "Workspace settings" includes timezone, locale, OIDC config for that workspace. "Global system settings" includes org-level config, license management, etc.

### Authorization Check Logic

```typescript
// WorkspaceContext interface - see Technical Implementation section for full definition

const checkPermission = (
  ctx: WorkspaceContext,
  action: string,
  resourceWorkspaceId: number
): boolean => {
  // Super admin can do anything
  if (ctx.isSuperAdmin) return true;

  // Must have access to the resource's workspace
  if (!ctx.accessibleWorkspaceIds.includes(resourceWorkspaceId)) {
    return false;
  }

  // Check role-based permission using role names from roles table
  // Role names come from user_workspaces.role_id → roles.name
  const permissions: Record<string, string[]> = {
    'Auditor': ['read'],
    'Editor': ['read', 'create', 'update'],
    'Reviewer': ['read', 'create', 'update', 'approve', 'reject'],
    'Admin': ['read', 'create', 'update', 'delete', 'manage_users']
  };

  return permissions[ctx.roleName]?.includes(action) ?? false;
};
```

---

## Security & Secrets Management

This section addresses how sensitive credentials (OIDC client secrets, API keys, encryption keys) are stored, accessed, and rotated in an **on-premises deployment**.

### Secrets Categories

| Secret Type | Example | Storage Location | Access Pattern |
|-------------|---------|------------------|----------------|
| OIDC Client Secrets | Entra ID client_secret per workspace | Database (encrypted) | Read on auth flow |
| Database Credentials | PostgreSQL password | Environment Variable | App startup |
| Encryption Keys | Master encryption key | Environment Variable | Runtime decryption |
| Session Signing Key | JWT signing secret | Environment Variable | Every request |

### Encryption Approach: Application-Managed (AES-256-GCM)

VerifyWise uses **application-managed encryption** with industry-standard AES-256-GCM. This approach:
- Uses Node.js built-in `crypto` module (no external dependencies)
- Stores encrypted secrets in the database
- Decrypts at runtime using a master key from environment variables
- Is simple to deploy and maintain

```
┌─────────────────────────────────────────────────────────────────┐
│               App-Managed Encryption Architecture               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐                                              │
│   │  Environment │                                              │
│   │  Variable    │──┐                                           │
│   │  MASTER_KEY  │  │                                           │
│   └──────────────┘  │                                           │
│                     │                                           │
│   ┌──────────────┐  │  ┌──────────────┐      ┌─────────────┐   │
│   │  VerifyWise  │◀─┘  │  Database    │      │  Decrypted  │   │
│   │  Application │────▶│  (AES-256    │─────▶│  Secret     │   │
│   │  (decrypt)   │     │  encrypted)  │      │  (in memory)│   │
│   └──────────────┘     └──────────────┘      └─────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation:**
```typescript
// utils/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const MASTER_KEY = process.env.MASTER_ENCRYPTION_KEY;

// SECURITY: Validate key on module load - fail fast if misconfigured
if (!MASTER_KEY) {
  throw new Error('MASTER_ENCRYPTION_KEY environment variable is required');
}
const keyBuffer = Buffer.from(MASTER_KEY, 'hex');
if (keyBuffer.length !== 32) {
  throw new Error(
    `MASTER_ENCRYPTION_KEY must be 64 hex characters (32 bytes). ` +
    `Got ${MASTER_KEY.length} characters (${keyBuffer.length} bytes).`
  );
}

export const encrypt = (plaintext: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(MASTER_KEY, 'hex'), iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

export const decrypt = (encryptedData: string): string => {
  const [ivHex, authTagHex, ciphertext] = encryptedData.split(':');

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(MASTER_KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};
```

**Security Properties:**
- AES-256-GCM is NIST-approved and used by governments/enterprises worldwide
- Authenticated encryption prevents tampering
- Random IV per encryption ensures identical plaintexts produce different ciphertexts
- No external dependencies or third-party services

**Operational Properties:**
- Simple to implement and maintain
- No additional infrastructure required
- Works in any environment (Docker, bare metal, VM)

**Considerations:**
- Master key must be securely stored in environment variables
- Key rotation requires re-encryption of all secrets (documented below)
- Backup the master key securely (offline, encrypted)

### Secret Rotation Process

#### OIDC Client Secret Rotation

```
┌─────────────────────────────────────────────────────────────────┐
│                OIDC Secret Rotation Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Generate new secret in Entra ID                        │
│  ┌──────────────┐                                               │
│  │  Entra ID    │  → Create new client secret (Secret B)        │
│  │  Admin Portal│  → Keep old secret (Secret A) active          │
│  └──────────────┘                                               │
│                                                                 │
│  Step 2: Update VerifyWise with new secret                      │
│  ┌──────────────┐      ┌──────────────┐                         │
│  │  Admin UI    │─────▶│  Database    │  → Store Secret B       │
│  │  or API      │      │  (encrypted) │  → Keep Secret A        │
│  └──────────────┘      └──────────────┘                         │
│                                                                 │
│  Step 3: Verify new secret works                                │
│  ┌──────────────┐      ┌──────────────┐                         │
│  │  Test Login  │─────▶│  OIDC Flow   │  → Uses Secret B        │
│  │              │      │              │  → Confirms working     │
│  └──────────────┘      └──────────────┘                         │
│                                                                 │
│  Step 4: Revoke old secret                                      │
│  ┌──────────────┐      ┌──────────────┐                         │
│  │  Entra ID    │      │  Database    │                         │
│  │  Delete A    │      │  Delete A    │                         │
│  └──────────────┘      └──────────────┘                         │
│                                                                 │
│  Timeline: 24-48 hour overlap recommended                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Rotation Implementation

```typescript
// Workspace OIDC config supports dual secrets during rotation
interface WorkspaceOIDCConfig {
  oidc_issuer: string;
  oidc_client_id: string;
  oidc_client_secret_primary: string;    // Current active
  oidc_client_secret_secondary?: string; // Previous (during rotation)
  oidc_secret_rotation_started_at?: Date;
}

// Token exchange tries primary, falls back to secondary
const exchangeCodeForTokens = async (workspace: Workspace, code: string) => {
  const secrets = [
    decrypt(workspace.oidc_client_secret_primary),
    workspace.oidc_client_secret_secondary
      ? decrypt(workspace.oidc_client_secret_secondary)
      : null
  ].filter(Boolean);

  for (const secret of secrets) {
    try {
      return await performTokenExchange(workspace.oidc_issuer, workspace.oidc_client_id, secret, code);
    } catch (err) {
      if (err.code === 'invalid_client' && secrets.length > 1) {
        continue; // Try next secret
      }
      throw err;
    }
  }
};
```

#### Master Key Rotation

```
┌─────────────────────────────────────────────────────────────────┐
│              Master Key Rotation Process                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⚠️  Plan for maintenance window - all secrets re-encrypted     │
│                                                                 │
│  Step 1: Generate new master key                                │
│          NEW_MASTER_KEY=<new 32-byte hex>                       │
│                                                                 │
│  Step 2: Deploy with BOTH keys                                  │
│          MASTER_KEY=<old>                                       │
│          NEW_MASTER_KEY=<new>                                   │
│                                                                 │
│  Step 3: Run re-encryption job                                  │
│          - Read each secret with old key                        │
│          - Re-encrypt with new key                              │
│          - Update database row                                  │
│          - Mark row as migrated                                 │
│                                                                 │
│  Step 4: Verify all rows migrated                               │
│                                                                 │
│  Step 5: Deploy with only new key                               │
│          MASTER_KEY=<new>                                       │
│                                                                 │
│  Step 6: Securely destroy old key                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Least Privilege Access Model

#### Principle: Minimal Scope, Just-In-Time

This section describes access control at two levels:
1. **Application roles** - Stored in VerifyWise database (`user_workspaces.role_id`, `users.is_super_admin`)
2. **Operational roles** - NOT stored in VerifyWise; describes who has server/infrastructure access

```
┌─────────────────────────────────────────────────────────────────┐
│              Least Privilege Access Matrix                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  APPLICATION ROLES (stored in VerifyWise database)              │
│  ─────────────────────────────────────────────────              │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Role: Admin (role_id = 1 in roles table)                │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ CAN:     Update OIDC config for their workspace         │   │
│  │          Trigger secret rotation                        │   │
│  │          Manage users in their workspace                │   │
│  │ CANNOT:  Read plaintext secrets                         │   │
│  │          Access other workspace configs                 │   │
│  │          Access master encryption key                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Role: Super Admin (users.is_super_admin = true)         │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ CAN:     Create/archive workspaces                      │   │
│  │          View audit logs                                │   │
│  │          Trigger rotation for any workspace             │   │
│  │          Auto-Admin in all workspaces                   │   │
│  │ CANNOT:  Read plaintext secrets (env vars)              │   │
│  │          Access server environment variables            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  OPERATIONAL ROLES (NOT stored in VerifyWise)                   │
│  ────────────────────────────────────────────                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Role: Infrastructure Admin (Server/SSH Access)          │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ WHO:     DevOps/SRE with server access                  │   │
│  │ CAN:     Manage server environment variables            │   │
│  │          Rotate master encryption key                   │   │
│  │          Access deployment configuration                │   │
│  │ CANNOT:  Access VerifyWise application as user          │   │
│  │          Read workspace business data                   │   │
│  │ NOTE:    This is NOT a VerifyWise user role.            │   │
│  │          Access is via SSH/server, not the application. │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Separation of Duties:                                          │
│  • Infrastructure Admin ≠ Super Admin ≠ Admin                   │
│  • No single person can access secrets + modify audit logs      │
│  • Application admins manage the app; infra admins manage       │
│    servers. These should be different people.                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

> **Key distinction:** Admin and Super Admin are VerifyWise application concepts (Admin is a role in `roles` table, Super Admin is a flag on `users` table). Infrastructure Admin describes a person with server access (SSH, Docker, etc.) who may or may not have a VerifyWise account - their access to secrets is through the server, not through the application.

### Secrets Access Audit Logging

```typescript
// Every secret access is logged
interface SecretAccessLog {
  timestamp: Date;
  actor: {
    type: 'application' | 'user' | 'service';
    id: string;
    ip_address: string;
  };
  action: 'read' | 'write' | 'rotate' | 'delete';
  secret: {
    path: string;           // e.g., "workspaces/tr/oidc_client_secret"
    workspace_id?: number;
    version?: string;
  };
  result: 'success' | 'denied' | 'error';
  metadata: {
    request_id: string;
    user_agent: string;
  };
}

// Implementation: Log to database table or structured log files
// Recommended: Create `secret_access_logs` table with immutable writes
```

### Why Application-Managed Encryption?

| Factor | Assessment |
|--------|------------|
| **Security** | AES-256-GCM is NIST-approved, used by governments and enterprises |
| **Simplicity** | No external dependencies, uses Node.js built-in `crypto` module |
| **Portability** | Works in any environment (Docker, VM, bare metal) |
| **Maintenance** | Zero additional infrastructure to maintain |
| **Cost** | No licensing fees, no additional servers |
| **Compliance** | Document your encryption approach for auditors |

**This approach is sufficient for VerifyWise because:**

1. **Limited secret types** - Only OIDC client secrets need encryption (not thousands of secrets)
2. **On-premises deployment** - Master key stays within customer's infrastructure
3. **No external dependencies** - No third-party services with licensing concerns
4. **Industry standard** - AES-256-GCM is the same algorithm used by enterprise solutions

**Note:** This is an on-premises solution with no cloud dependencies or third-party secret management services.

---

## User Experience

### Workspace Switcher Component

For users with access to multiple workspaces:

```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────────────┐                                       │
│  │ 🇹🇷 Turkey    ▾  │    Dashboard    Tasks    Settings     │
│  └──────────────────┘                                       │
│         │                                                   │
│         ▼                                                   │
│  ┌──────────────────┐                                       │
│  │ 🇹🇷 Turkey    ✓  │  ← Current                           │
│  │ 🇫🇷 France       │                                       │
│  │ 🇩🇪 Germany      │                                       │
│  └──────────────────┘                                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │   Dashboard showing Turkey workspace data only      │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Behavior Rules

1. **Single workspace users** - No switcher shown, seamless experience
2. **Multi-workspace users** - Switcher in header, current workspace clearly indicated
3. **Workspace switch** - Page reloads with new workspace context, no data loss warnings if no unsaved changes
4. **Deep links** - Include workspace in URL: `/tr/projects/123` or via header
5. **No "All Workspaces" view in Phase 1** - Super admins must switch to each workspace individually

### Visual Indicators

- Current workspace name + flag always visible in header
- Color coding per workspace (optional, configurable)

---

## Technical Implementation

### Middleware: Workspace Context

```typescript
// middleware/workspaceContext.ts

export interface WorkspaceContext {
  userId: number;
  currentWorkspaceId: number;  // Required in Phase 1 (no "all workspaces" view)
  roleName: 'Admin' | 'Reviewer' | 'Editor' | 'Auditor';  // From roles table via role_id
  isSuperAdmin: boolean;
  accessibleWorkspaceIds: number[];
}

export const workspaceContextMiddleware = async (req, res, next) => {
  const session = req.session;

  if (!session?.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await db.users.findById(session.userId);

  // Get user's workspace memberships with role names
  // Join with roles table to get role name from role_id
  const memberships = await db.user_workspaces.findAll({
    where: { user_id: session.userId },
    include: [{ model: db.roles, as: 'role', attributes: ['name'] }]
  });

  // Determine current workspace (required in Phase 1)
  const workspaceIdRaw = req.headers['x-workspace-id'] || session.currentWorkspaceId;

  // Phase 1: Workspace is required for all requests
  if (!workspaceIdRaw) {
    return res.status(400).json({ error: 'X-Workspace-Id header is required' });
  }

  const currentWorkspaceId = Number(workspaceIdRaw);

  // Get user's accessible workspace IDs from memberships
  const membershipWorkspaceIds = memberships.map(m => m.workspace_id);

  // Validate access to requested workspace
  // Super admin has access to ALL workspaces; regular users only their memberships
  if (!user.is_super_admin && !membershipWorkspaceIds.includes(currentWorkspaceId)) {
    return res.status(403).json({ error: 'No access to this workspace' });
  }

  // Get role for this workspace
  // IMPORTANT: Role comes from user_workspaces.role_id → roles.name, NOT from users table
  // This allows different roles per workspace (Admin in Germany, Auditor in France)
  const currentMembership = memberships.find(m => m.workspace_id === currentWorkspaceId);

  // Super admin is auto-Admin in all workspaces, even without explicit membership
  // Regular users get their membership role, or 'Auditor' as fallback (shouldn't happen)
  const roleName = user.is_super_admin
    ? 'Admin'  // Super admin = Admin in every workspace
    : (currentMembership?.role?.name || 'Auditor');

  // For accessibleWorkspaceIds:
  // - Regular users: their membership workspace IDs
  // - Super admin: query all active workspace IDs (not empty array!)
  const accessibleWorkspaceIds = user.is_super_admin
    ? await db.workspaces.findAll({ where: { is_active: true } }).then(ws => ws.map(w => w.id))
    : membershipWorkspaceIds;

  const ctx: WorkspaceContext = {
    userId: user.id,
    currentWorkspaceId,
    roleName,
    isSuperAdmin: user.is_super_admin,
    accessibleWorkspaceIds  // Now contains actual IDs, not empty array for super admin
  };

  req.workspaceContext = ctx;
  next();
};
```

### Schema Resolution Helper

```typescript
// utils/workspaceSchema.ts

export const getWorkspaceSchema = async (workspaceId: number): Promise<string> => {
  // Look up schema_name from workspaces table (stored, not computed)
  // This allows existing org schemas to be mapped to "default workspace"
  const workspace = await db.workspaces.findByPk(workspaceId);
  return workspace.schema_name;  // e.g., 'a1b2c3d4e5' (hash) or existing org schema
};

// Existing utility files continue to work unchanged
// Just pass workspaceSchema instead of tenantHash
```

### Example: Projects Controller

```typescript
// controllers/projects.controller.ts

export const getProjects = async (req, res) => {
  const ctx = req.workspaceContext;
  const schema = getWorkspaceSchema(ctx.currentWorkspaceId);

  // Existing query pattern - schema provides isolation
  const projects = await sequelize.query(`
    SELECT * FROM "${schema}".projects
    ORDER BY created_at DESC
  `);

  return res.json({ data: projects });
};

export const createProject = async (req, res) => {
  const ctx = req.workspaceContext;
  const schema = getWorkspaceSchema(ctx.currentWorkspaceId);

  // Check permission
  if (!checkPermission(ctx, 'create', ctx.currentWorkspaceId)) {
    return res.status(403).json({ error: 'Permission denied' });
  }

  // Insert into workspace schema - no workspace_id column needed
  const project = await sequelize.query(`
    INSERT INTO "${schema}".projects (name, description, created_by)
    VALUES (:name, :description, :userId)
    RETURNING *
  `, {
    replacements: {
      name: req.body.name,
      description: req.body.description,
      userId: ctx.userId
    }
  });

  return res.json({ data: project[0] });
};
```

**Key difference from row-level approach:** No `workspace_id` column, no filter injection. The schema IS the isolation boundary.

### Frontend: Workspace Context Provider

```typescript
// contexts/WorkspaceContext.tsx

interface WorkspaceContextValue {
  currentWorkspace: Workspace;  // Always required in Phase 1
  accessibleWorkspaces: Workspace[];
  switchWorkspace: (workspaceId: number) => void;
}

export const WorkspaceProvider: React.FC = ({ children }) => {
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<number | null>(
    () => localStorage.getItem('currentWorkspaceId')
      ? Number(localStorage.getItem('currentWorkspaceId'))
      : null
  );

  const { data: accessibleWorkspaces } = useQuery({
    queryKey: ['workspaces', 'accessible'],
    queryFn: () => api.get('/workspaces/accessible')
  });

  // Auto-select first workspace if none selected
  useEffect(() => {
    if (!currentWorkspaceId && accessibleWorkspaces?.length > 0) {
      const defaultWs = accessibleWorkspaces.find(w => w.is_default)
        || accessibleWorkspaces[0];
      setCurrentWorkspaceId(defaultWs.id);
      localStorage.setItem('currentWorkspaceId', String(defaultWs.id));
    }
  }, [currentWorkspaceId, accessibleWorkspaces]);

  const switchWorkspace = (workspaceId: number) => {
    setCurrentWorkspaceId(workspaceId);
    localStorage.setItem('currentWorkspaceId', String(workspaceId));
    // Invalidate all queries to refetch with new workspace
    queryClient.invalidateQueries();
  };

  // Add workspace header to all API requests
  useEffect(() => {
    if (currentWorkspaceId) {
      api.defaults.headers['X-Workspace-Id'] = currentWorkspaceId;
    }
  }, [currentWorkspaceId]);

  // Don't render until workspace is selected
  if (!currentWorkspaceId) {
    return <WorkspaceSelector />;  // Redirect to workspace selection
  }

  return (
    <WorkspaceContext.Provider value={{
      currentWorkspace: accessibleWorkspaces?.find(w => w.id === currentWorkspaceId)!,
      accessibleWorkspaces: accessibleWorkspaces || [],
      switchWorkspace
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};
```

---

## Deployment Model

### Fresh Deployment Only (No Data Migration)

This architecture is designed for **fresh deployments only**. No customer data migration from existing installations is required or supported.

**Clarification:**
- **No data migration** = No scripts to move existing customer data
- **Schema migrations required** = New tables/columns still use standard Sequelize migrations
- Fresh install gets workspace-aware schema from day one

**Rationale:**
- Simplifies implementation significantly
- No backward compatibility code needed
- No data migration scripts
- Clean schema from day one
- Reduces SLOC by ~100-150 lines

### Initial Setup Flow

The setup wizard handles the chicken-and-egg problem: users require `organization_id`, but no org exists on first boot.

```
1. Deploy VerifyWise (fresh installation)
   └── Database initialized with workspace-aware schema
   └── No organizations or users exist yet

2. First Access (Setup Wizard) - ATOMIC TRANSACTION
   ┌─────────────────────────────────────────────────────────┐
   │  Setup wizard detects: no organizations exist           │
   │                                                         │
   │  Step 2a: Collect info                                  │
   │    - Organization name                                  │
   │    - Admin email, password, name                        │
   │                                                         │
   │  Step 2b: Single transaction creates ALL:               │
   │    1. Organization (id = 1)                             │
   │    2. Default workspace (org_id = 1, schema = ws_1)     │
   │    3. Super admin user (org_id = 1, is_super_admin = T) │
   │    4. user_workspaces entry (Admin role in workspace)   │
   │    5. Tenant schema created (ws_1.*)                    │
   │                                                         │
   │  All-or-nothing: if any step fails, nothing created     │
   └─────────────────────────────────────────────────────────┘

3. Super Admin Logs In
   └── Redirected to default workspace
   └── Can now configure OIDC, invite users, etc.

4. Super Admin Configures Workspace (Optional)
   └── Set workspace name, country, timezone
   └── Choose auth method:
       ├── Email/password (default, already working)
       └── OIDC (configure issuer, client_id, secret)

5. Super Admin Invites Users
   └── Workspace admins can then invite more users
   └── Users assigned to workspace with role
```

**Implementation of Setup Wizard:**
```typescript
// POST /api/setup (only works if no organizations exist)
const setupFirstOrganization = async (req, res) => {
  // Guard: Only works on fresh install
  const { exists } = await getOrganizationsExistsQuery();
  if (exists) {
    return res.status(403).json({ error: 'Setup already complete' });
  }

  const { orgName, adminEmail, adminPassword, adminName } = req.body;

  // Atomic transaction - all or nothing
  const transaction = await sequelize.transaction();
  try {
    // 1. Create organization
    const org = await createOrganizationQuery({ name: orgName }, transaction);

    // 2. Create default workspace
    const workspace = await db.workspaces.create({
      organization_id: org.id,
      name: 'Default',
      slug: 'default',
      schema_name: `ws_${org.id}`,  // or use getTenantHash(org.id)
      oidc_enabled: false,
      is_active: true
    }, { transaction });

    // 3. Create tenant schema
    await createNewTenant(workspace.id, transaction);

    // 4. Create super admin user
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const user = await db.users.create({
      name: adminName,
      email: adminEmail,
      password_hash: passwordHash,
      organization_id: org.id,
      is_super_admin: true,  // First user is super admin
      role_id: 1  // Admin role (for backward compatibility)
    }, { transaction });

    // 5. Create user_workspaces entry
    await db.user_workspaces.create({
      user_id: user.id,
      workspace_id: workspace.id,
      role_id: 1,  // Admin
      is_default: true
    }, { transaction });

    await transaction.commit();
    return res.json({ success: true, message: 'Setup complete' });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};
```

### Schema Naming

Fresh deployments use clean schema naming:

```
ws_${workspaceId}   -- Workspace data schema
public              -- Shared tables (users, organizations, workspaces)

Example:
├── public.users
├── public.organizations
├── public.workspaces
├── ws_1.projects
├── ws_1.vendors
├── ws_2.projects
└── ws_2.vendors
```

### Super Admin Bootstrap

| Step | Action | Result |
|------|--------|--------|
| 1 | First user registers | Becomes super admin |
| 2 | Super admin creates org | Organization record |
| 3 | Default workspace created | `ws_1` schema |
| 4 | Super admin configures auth | OIDC or email/password |
| 5 | Super admin invites users | Workspace populated |

**Super Admin Characteristics:**
- System-level role (not workspace-scoped)
- Can create organizations and workspaces
- Auto-admin in all workspaces
- Can grant super admin to others
- Multiple super admins allowed (minimum 1 required)

### Emergency Access Recovery

If all super admins are locked out (IdP misconfigured, all super admins terminated, etc.):

```
Recovery Options:
1. Database-level (requires DB access):
   UPDATE users SET is_super_admin = true WHERE email = 'recovery@company.com';

2. CLI tool (requires server access):
   verifywise-cli promote-super-admin --email=recovery@company.com

3. Environment variable (requires restart):
   EMERGENCY_SUPER_ADMIN_EMAIL=recovery@company.com
```

**Intentional security boundary:** Recovery requires infrastructure access (database or server). This prevents recovery via compromised application layer.

---

## Implementation Guide (From Gap Analysis)

This section consolidates findings from codebase gap analysis to guide implementation.

### Current Codebase Architecture

**The codebase is already multi-tenant with schema-per-organization isolation:**

```
Current State:
├── public schema (control plane)
│   ├── users (with organization_id FK)
│   ├── organizations
│   └── roles (Admin, Reviewer, Editor, Auditor)
└── tenant schemas (one per org, named by hash)
    ├── {hash}.projects
    ├── {hash}.vendors
    ├── {hash}.risks
    └── ... (all domain tables)
```

**What this design adds:** Re-key isolation from `organizationId` → `workspaceId`. You're not inventing isolation—you're adding a layer beneath organization.

### Existing Infrastructure to Leverage

| Component | Status | Notes |
|-----------|--------|-------|
| Schema-per-tenant isolation | ✅ Ready | Foundation via `getTenantHash()` |
| Control plane in public schema | ✅ Ready | users, organizations, roles correctly placed |
| Domain tables in tenant schemas | ✅ Ready | projects, vendors, risks isolated |
| BullMQ workers tenant iteration | ✅ Ready | Pattern correct, just needs workspace rename |
| JWT middleware structure | ✅ Ready | Just needs extended claims |
| RBAC middleware (`authorize()`) | ✅ Ready | Just needs workspace role lookup |
| Organization membership check | ✅ Ready | `doesUserBelongsToOrganizationQuery()` exists |
| Token generation | ✅ Ready | `generateUserTokens()` in `auth.utils.ts` - single update point |
| AsyncLocalStorage context | ✅ Ready | Request context propagation exists |
| Change history tables | ✅ Ready | Per-tenant audit tables exist |

### ⚠️ Mandatory Implementation Items

These are **required for correctness**, not optional features:

| Item | Why Mandatory |
|------|---------------|
| **Auth middleware split** | Current middleware rejects tokens if tenant doesn't match org. Must split into `authenticateJWT` (identity only) + `workspaceContextMiddleware` (resolves workspace, sets schema, sets role) |
| **`workspaces.schema_name` column** | Store schema name explicitly. Enables mapping existing org schemas to "default workspace" |
| **Refresh token returns identity-only JWT** | Current refresh couples tenant/role. Must change to identity-only; workspace resolved per request |
| **User listing filter by `user_workspaces`** | Otherwise workspace admins see ALL org users (visibility leak) |
| **Worker iteration switches to workspaces** | Otherwise new workspaces won't get scheduled jobs |
| **Pick ONE workspace selector method** | Header (`X-Workspace-Id`) for v1. Don't mix with URL prefix |

### Implementation Phases

**Phase 1: Database Foundation**
1. Create `workspaces` table (with `schema_name`, OIDC config, `is_active`)
2. Create `user_workspaces` table (with `role_id` FK, OIDC binding columns)
3. Add `is_super_admin` to users table

**Phase 2: Authentication Update**
1. **Split auth middleware** into `authenticateJWT` + `workspaceContextMiddleware`
2. **Refactor refresh token** to return identity-only JWT
3. Add OIDC packages (openid-client)
4. Create OIDC callback routes
5. Update JWT claims (`auth_method`, `auth_issuer`)
6. Implement `req.effectiveRole` lookup from `user_workspaces`
7. Add server-side re-auth enforcement (issuer mismatch → 401)

**Phase 3: API/Controller Updates**
1. Add workspace management endpoints (CRUD for super admin)
2. Add workspace switching endpoint (updates UI hint only)
3. **Update user listing to filter by `user_workspaces`**
4. **Update worker iteration to use workspaces**
5. Centralize tenant resolution in middleware

**Phase 4: Frontend**
1. Workspace selector UI
2. Workspace switching flow
3. OIDC login flow
4. Super admin workspace management UI (defer to v2 if needed)

### Known Issues to Address

| Issue | Severity | Mitigation |
|-------|----------|------------|
| Role casing inconsistency (`"Admin"` vs `"admin"`) | Medium | Use `role_id` FK to roles table; never hardcode strings |
| `req.user` vs `req.userId` inconsistency | Low | Standardize on `req.userId`, `req.role`, `req.workspaceId` |
| Public share links scan schemas linearly | Low | Add `share_tokens(token, workspace_id)` lookup table |
| Background jobs iterate all tenants | Low | Add `workspace.is_active` filter, soft cap guard |

### Design Decisions Summary

| Decision | Rationale |
|----------|-----------|
| Keep `users.organization_id` | One org per deployment; all workspaces under single org |
| JWT is identity-only | No workspace/role in token; resolved per request |
| Refresh returns identity-only JWT | Workspace resolved by middleware, not baked in |
| Store `schema_name` explicitly | Don't infer from ID; enables org schema mapping |
| Reuse existing roles table | `role_id` FK in `user_workspaces`; keeps middleware unchanged |
| Auth middleware split is mandatory | `authenticateJWT` + `workspaceContextMiddleware` |
| `oidc_subject`/`oidc_issuer` on users | Audit trail only, NOT for identity matching |
| Workspace selector (API) | `X-Workspace-Id` header for backend API calls |
| Workspace selector (Frontend URLs) | Slug in path (`/tr/projects/123`) for bookmarks/deep links |
| Membership required for access | IdP auth does NOT grant access; admin must add user |

---

## Future Considerations

### Potential Enhancements (Not in Initial Scope)

1. **Workspace Templates** - Create new workspace from template with predefined settings
2. **Data Sharing** - Share specific records across workspaces (complex, avoid initially)
3. **Workspace Groups** - Group workspaces for easier management (e.g., "EMEA Region")
4. **Delegated Administration** - Allow workspace admins to create sub-workspaces
5. **Audit Log per Workspace** - Workspace-scoped audit trail viewing
6. **Workspace-Specific Branding** - Custom logos/colors per workspace

### What We're Explicitly NOT Building

1. **Hierarchy/Inheritance** - No parent/child workspace relationships
2. **Automatic Visibility** - No "parent sees children" logic
3. **Visibility Grants** - No cross-workspace data sharing exceptions
4. **Shared Resources** - No global templates/vendors (each workspace independent)

---

## Open Questions for Discussion

The following questions have recommendations but are pending final stakeholder approval. Once approved, they should be moved to "Resolved Design Decisions".

### 1. New User Default Role
> When a user first logs in via OIDC and is auto-created, what role should they have?

Options:
- A) `Auditor` (read-only, safest - admin upgrades as needed)
- B) `Editor` (assumes all authenticated users should contribute)
- C) Configurable per workspace

**Recommendation:** Option A (`Auditor`) with easy upgrade path

### 2. User Without Workspace Access
> User exists but has no `user_workspaces` entry for the workspace they're trying to log into. What happens?

Options:
- A) Block login with error message
- B) Auto-add them as `Auditor` (read-only)
- C) Show "request access" flow
- D) Allow login, show "No access" screen with optional "Request access" button

**Recommendation:** Option D
- Allow the OIDC flow to complete (user is authenticated)
- Show clear "You don't have access to this workspace" screen
- Display workspace name and who to contact
- Optional "Request Access" button (enhancement for later)
- User can still switch to other workspaces they have access to

**Why not block login?**
- User may have access to other workspaces
- Better UX than cryptic error at IdP redirect
- Allows for graceful "request access" flow later

### 3. Cross-Workspace User Search
> Can a workspace admin see users from other workspaces when inviting?

Options:
- A) No, only see users already in their workspace
- B) Yes, can see all users in system (privacy concern)
- C) Can invite by email, system handles matching

**Recommendation:** Option C

### 4. Session Behavior on Workspace Switch
> What happens to user's session when they switch workspaces?

Options:
- A) Keep session, just change context header
- B) Require re-authentication via new workspace's OIDC
- C) Keep session only if same OIDC issuer

**Recommendation:** Option A (best UX for multi-workspace users)

---

## Resolved Design Decisions

The following decisions have been finalized and are NOT open for discussion:

### URL Structure
**Decision:** Workspace slug in URL path

```
https://app.verifywise.ai/tr/projects/123
https://app.verifywise.ai/fr/risks/456
https://app.verifywise.ai/de/vendors
```

**Rationale:**
- Deep links are self-contained and shareable
- Bookmarks work correctly
- Browser history is meaningful
- Clear visual indicator of current workspace
- No reliance on headers for context

**Implementation:**
```typescript
// Route structure
<Route path="/:workspaceSlug/projects" element={<ProjectsPage />} />
<Route path="/:workspaceSlug/projects/:id" element={<ProjectDetailPage />} />
<Route path="/:workspaceSlug/risks" element={<RisksPage />} />
// ... etc

// Workspace context from URL
const { workspaceSlug } = useParams();
const workspace = useWorkspaceBySlug(workspaceSlug);
```

### API Structure
**Decision:** Two valid approaches, choose based on use case

#### Option A: Workspace in URL Path
```
GET  /api/workspaces/tr/projects
POST /api/workspaces/tr/projects
GET  /api/workspaces/tr/projects/123
```

**Pros:**
- Matches frontend URL structure
- Self-documenting
- Easy to understand in logs
- Works well for REST purists

**Cons:**
- Longer URLs
- Workspace context repeated in every call

#### Option B: Header-Based
```
GET  /api/projects
     X-Workspace-Id: 1

POST /api/projects
     X-Workspace-Id: 1
```

**Pros:**
- Cleaner URLs
- Easier to switch workspace in API clients
- DRY (workspace set once in client config)

**Cons:**
- Requires header on every request
- Easy to forget header in testing
- Less visible in logs

**Recommendation:**
- **Internal API (frontend → backend):** Option B (header) - simpler, workspace set once in axios config
- **Public API (if exposed):** Option A (path) - more explicit, better documentation

> **Clarification:** There's no conflict between frontend URLs and API approach:
> - **Frontend URLs** use workspace slug in path (`/tr/projects/123`) for bookmarkable deep links
> - **API calls** use `X-Workspace-Id` header (the frontend extracts workspace from URL and sets the header)
> - The frontend's workspace-aware URLs and the backend's header-based approach work together seamlessly

**Implementation (Header approach):**
```typescript
// Frontend: Set header globally
api.defaults.headers['X-Workspace-Id'] = currentWorkspaceId;

// Backend: Middleware extracts workspace
app.use('/api/*', (req, res, next) => {
  const workspaceId = req.headers['x-workspace-id'];
  req.workspace = await getWorkspaceById(workspaceId);
  next();
});
```

### Data Import/Export
**Decision:** Data goes into current workspace schema

- CSV/Excel imports insert into the current workspace's schema (`ws_{id}.projects`, etc.)
- User does NOT select target workspace (they're already in it)
- Export includes data from current workspace schema only
- Schema isolation handles boundaries automatically

### Search Behavior
**Decision:** Current workspace only, no badge

- Search only searches within current workspace
- No cross-workspace search
- No workspace badge on results (user knows where they are)
- Phase 2: Optional global search for super admins

### Settings Scope
**Decision:** All workspace-specific, admin only

| Setting | Scope | Who Can Modify |
|---------|-------|----------------|
| Notification preferences | Workspace | Workspace Admin |
| Default frameworks | Workspace | Workspace Admin |
| Risk categories | Workspace | Workspace Admin |
| Custom fields | Workspace | Workspace Admin |
| OIDC configuration | Workspace | Workspace Admin |
| Workspace name/branding | Workspace | Workspace Admin |

### Integrations
**Decision:** All per-workspace

| Integration | Configuration |
|-------------|---------------|
| Slack | Per workspace |
| Teams | Per workspace |
| Email sender/branding | Per workspace |
| Scheduled reports | Per workspace |

### Super Admin Role
**Decision:** Super Admin = Auto-admin in all workspaces, NOT a global overlord

**Super Admin CAN:**
- Create new workspaces
- Archive workspaces
- Is automatically `Admin` in every workspace (including newly created ones)

**Super Admin CANNOT (without switching workspace):**
- Configure OIDC for another workspace
- Add users to another workspace
- View another workspace's data
- Make cross-workspace changes

**Why this approach:**
- Clear accountability (actions tied to specific workspace context)
- No accidental cross-workspace changes
- Clean audit trail
- Simpler mental model

**Privilege Matrix:**

| Role | Create WS | Archive WS | Admin Actions | Scope |
|------|-----------|------------|---------------|-------|
| Auditor | ❌ | ❌ | ❌ | Current workspace |
| Editor | ❌ | ❌ | ❌ | Current workspace |
| Reviewer | ❌ | ❌ | ❌ | Current workspace |
| Admin | ❌ | ❌ | ✅ | Current workspace |
| Super Admin | ✅ | ✅ | ✅ | Must switch to workspace first |

### Reporting & Dashboards
**Decision:** Workspace-scoped only (Phase 1)

- No "All Workspaces" aggregate view
- No global dashboards for super admins
- Reports show current workspace data only
- Phase 2: Cross-workspace reporting for super admins

### 7. Canonical Identity Key
> What is the primary key for user identity: email or issuer+subject?

**Decision: Email is the canonical identifier. Period.**

```
User Lookup: ALWAYS by email
├── OIDC login → extract email claim → find user by email
├── Email/password login → find user by email
└── No identity linking table, no issuer+subject matching
```

**What about `oidc_subject` and `oidc_issuer` on users table?**

These fields are stored for **audit and debugging only**, NOT for identity lookup:

```typescript
// ✅ Correct: Lookup by email
const user = await db.users.findByEmail(claims.email);

// ❌ Wrong: Don't lookup by issuer+subject
// const user = await db.users.findByOIDC(claims.iss, claims.sub);
```

**Why store them if not used for lookup?**
- Audit trail: "User logged in via Germany Entra (sub=abc123)"
- Debugging: "Why can't user login?" → Check if sub changed
- Future forensics: If email changes, we have history

**Why NOT use issuer+subject as primary?**
- Creates multiple user records for same person
- Forces identity linking table and admin workflows
- Adds complexity we explicitly want to avoid

> **Note:** If a customer's email claim changes (rare but possible), they contact admin to update their user record. This is acceptable for Phase 1.

### 8. Workspace-First Login: Strategic or Tactical?
> Is workspace-first login a long-term UX pattern, or only to simplify multi-Entra routing?

**Context:** Current design has users select workspace before being redirected to that workspace's Entra ID. This solves the "which IdP?" routing problem but impacts UX.

Options:
- A) **Long-term pattern** - Workspace selection is a first-class UX concept, users always pick workspace first
- B) **Tactical for multi-IdP** - Only needed because of multiple Entra tenants, would prefer seamless SSO
- C) **Hybrid** - Workspace-first for initial login, remember preference, SSO for returning users

**Recommendation:** Option C (Hybrid)
- First visit: Show workspace selection
- Remember last workspace in cookie/localStorage
- Returning user: Auto-redirect to last workspace's IdP
- Provide "Switch workspace" option that resets and shows selector
- For single-workspace deployments: Skip selector entirely

**Login Failure Fallback:**

When a returning user's remembered workspace is unavailable:
```
User has access to: [A, B]
Last workspace was: B
Workspace B is: archived / OIDC misconfigured / deleted

Behavior:
1. Detect login failure (OIDC error, workspace archived, etc.)
2. Clear remembered workspace preference
3. Redirect to workspace selector
4. Show message: "Your last workspace (B) is currently unavailable"
5. Let user pick from remaining accessible workspaces
```

**Alternative Approaches:**
- **Home Realm Discovery (HRD)**: Use email domain to route to correct IdP (requires consistent email domains per workspace)
- **IdP-Initiated SSO**: User starts at Entra ID, we detect workspace from claims
- **Universal Login Page**: Single Entra ID app with custom claims mapping

### 9. Database-Level Safety
> Is additional database-level protection needed beyond schema isolation?

**Context:** Schema-per-workspace (`ws_{id}.*`) is the primary isolation mechanism. All queries target a specific schema via `"${schema}".tableName` syntax. What if a developer accidentally queries the wrong schema?

**Decision: Schema isolation is sufficient for Phase 1**

| Deployment Type | Additional Protection | Reason |
|-----------------|----------------------|--------|
| Development | None | Schema isolation sufficient |
| Standard deployments | None | Schema isolation sufficient |
| Enterprise (on request) | PostgreSQL search_path restrictions | Defense in depth |

**Why schema isolation is strong:**
- Developer must explicitly specify schema in every query
- No "default" schema that could leak data
- Typo in schema name = query fails (no silent data leak)
- Code review catches wrong schema references

**Optional Enterprise Hardening:**

For security-conscious customers, restrict database user to specific schemas:

```sql
-- Create workspace-specific database role
CREATE ROLE ws_1_role;
GRANT USAGE ON SCHEMA ws_1 TO ws_1_role;
GRANT ALL ON ALL TABLES IN SCHEMA ws_1 TO ws_1_role;

-- Revoke access to other workspace schemas
REVOKE ALL ON SCHEMA ws_2 FROM ws_1_role;
```

**Trade-offs:**
| Approach | Pros | Cons |
|----------|------|------|
| Schema isolation only | Simple, already works | Relies on correct schema in code |
| Schema + role restrictions | Defense in depth | More complex connection management |

**Testing Strategy (All Deployments):**
- Unit tests for filter application
- Integration tests attempting cross-workspace access
- Periodic security audits
- RLS available as additional safety net when needed

### 10. Audit Log Scope and Retention
> What events are included in audit logs, and what's the retention story?

**Context:** Audit logging is critical for compliance (SOC2, ISO27001, EU AI Act). Need to define scope, format, and retention.

**Events to Log:**

| Category | Events | Priority |
|----------|--------|----------|
| **Authentication** | Login, logout, failed login, session refresh | P0 |
| **Authorization** | Permission denied, role change, workspace access | P0 |
| **Data Access** | View sensitive records (PII, risk assessments) | P1 |
| **Data Mutation** | Create, update, delete of any record | P0 |
| **Admin Actions** | User invite, role change, workspace config, OIDC config | P0 |
| **Security Events** | Secret rotation, password reset, MFA changes | P0 |
| **Export/Download** | Report generation, data export | P1 |

**Audit Log Schema:**
```typescript
interface AuditLogEntry {
  id: string;                    // UUID
  timestamp: Date;               // UTC

  // Actor
  actor_type: 'user' | 'service' | 'system';
  actor_id: string;              // user_id or service name
  actor_email?: string;          // For readability
  actor_ip: string;
  actor_user_agent: string;

  // Context
  workspace_id: number | null;   // null for global actions
  session_id: string;
  request_id: string;            // For correlation

  // Action
  action: string;                // e.g., 'project.create', 'user.login'
  resource_type: string;         // e.g., 'project', 'risk', 'user'
  resource_id?: string;          // ID of affected resource

  // Details
  result: 'success' | 'failure' | 'denied';
  details: Record<string, any>;  // Action-specific data
  previous_state?: Record<string, any>;  // For mutations
  new_state?: Record<string, any>;       // For mutations
}
```

**Retention Policy:**

| Log Type | Retention | Reason |
|----------|-----------|--------|
| Security events | 7 years | Compliance requirement |
| Data mutations | 3 years | Audit trail |
| Data access | 1 year | Behavior analysis |
| System events | 90 days | Debugging |

**Storage Options (On-Premises):**
- A) **Same database** - Simple, but grows large
- B) **Separate database** - Isolation, different retention policies
- C) **Log aggregation** (ELK Stack, Graylog) - Scalable, searchable, on-prem
- D) **SIEM integration** (Splunk on-prem, Wazuh) - Advanced analysis

**Recommendation:** Option B or C depending on scale
- Separate `audit_logs` database with time-partitioned tables
- Archive to cold/offline storage after active retention period
- Immutable writes (no UPDATE/DELETE)

### 11. Multi-IdP Identity - Re-Auth on Switch

> How will you handle a user who belongs to two workspaces backed by two different Entra tenants?

**Decision:** Same email CAN belong to multiple workspaces. Re-authenticate when switching between different IdPs.

**How it works:**
```
hans@corp.com (single user record in public.users)
├── Member of Germany workspace (OIDC: Germany Entra ID)
├── Member of France workspace (OIDC: France Entra ID)
└── Member of Dev workspace (email/password)

Switching behavior:
├── Germany → France: Re-auth required (different IdP)
├── France → Dev: Re-auth required (different auth method)
├── Germany → Germany-Test (same IdP): Seamless switch
```

**Why this works without identity linking:**
- Email is the canonical identifier (single user record)
- `user_workspaces` tracks membership per workspace
- Each IdP just verifies "yes, this is hans@corp.com"
- No need to link identities - email already links them

**Security maintained via re-auth:**
- When switching to workspace with different IdP, force re-authentication
- This ensures the user can actually authenticate via that IdP
- Prevents "I authenticated via Germany, let me access France without proving I can"

**No identity linking table needed because:**
- We don't match by issuer+subject
- We match by email only
- Re-auth handles the "prove you own this identity" requirement

### 12. Admin Onboarding & OIDC Configuration
> Who can create workspaces and configure OIDC safely?

**Context:** OIDC configuration contains sensitive client secrets. Misconfiguration can break auth or create security holes.

**Role Matrix (Application Roles):**

| Action | Admin | Super Admin |
|--------|-------|-------------|
| Create workspace | ❌ | ✅ |
| Configure OIDC for their workspace | ✅ | ✅ |
| Rotate OIDC secrets for their workspace | ✅ | ✅ |
| View OIDC config | ❌ (masked) | ✅ (masked) |

> **Note:** "Admin" refers to the existing VerifyWise role (`role_id = 1`). "Super Admin" is a flag on the users table (`is_super_admin = true`), not a separate role. Plaintext secrets (environment variables) are only accessible via server access.

**Workspace Creation Flow:**
```
┌─────────────────────────────────────────────────────────────────┐
│                 Workspace Onboarding Flow                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Step 1: Super Admin creates workspace shell                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Name: Turkey                                            │  │
│  │  Slug: tr                                                │  │
│  │  Country: TR                                             │  │
│  │  Timezone: Europe/Istanbul                               │  │
│  │  Status: PENDING_OIDC                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Step 2: Super Admin configures OIDC                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  OIDC Issuer: https://login.microsoftonline.com/xxx      │  │
│  │  Client ID: abc123                                       │  │
│  │  Client Secret: [AES-256-GCM encrypted in database]      │  │
│  │  Redirect URIs: https://app.verifywise.ai/callback       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Step 3: Test authentication                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  [Test Login] → Verify OIDC flow works                   │  │
│  │  → Creates test user                                     │  │
│  │  → Confirms token exchange                               │  │
│  │  → Status: OIDC_VERIFIED                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Step 4: Activate workspace                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Super Admin reviews config                              │  │
│  │  [Activate Workspace]                                    │  │
│  │  → Status: ACTIVE                                        │  │
│  │  → Appears in workspace selector                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**OIDC Configuration Validation:**
```typescript
const validateOIDCConfig = async (config: OIDCConfig): Promise<ValidationResult> => {
  const checks = [
    // 1. Issuer is valid HTTPS URL
    validateIssuerUrl(config.oidc_issuer),

    // 2. Can fetch .well-known/openid-configuration
    fetchOIDCDiscovery(config.oidc_issuer),

    // 3. Client ID format is valid
    validateClientId(config.oidc_client_id),

    // 4. Client secret is present
    validateSecretPresent(config.oidc_client_secret),

    // 5. Redirect URI matches our domain
    validateRedirectUri(config.redirect_uri),

    // 6. Test token endpoint (optional, requires secret)
    testTokenEndpoint(config),
  ];

  return Promise.all(checks);
};
```

**Safety Measures:**
- OIDC config changes require confirmation
- Client secrets never displayed in UI (only "last 4 chars" hint)
- All config changes audit logged
- Test login required before activation
- Rollback option for 24 hours after change

**OIDC Provider Requirements:**

| Requirement | Reason | If Missing |
|-------------|--------|------------|
| `email` claim in ID token | Canonical user identifier | Block login with configuration error |
| HTTPS issuer URL | Security | Reject configuration |
| Valid redirect URI | Prevent token theft | Reject configuration |

**Email Claim Handling:**

Entra ID and other providers can return email in different claims:
- `email` - Standard OIDC claim (preferred)
- `preferred_username` - Often UPN format (`user@tenant.onmicrosoft.com`)
- `mail` - From AD mailbox attribute
- `upn` - User Principal Name

**Our stance:** We require the `email` claim to be present. This is a deployment/configuration requirement, not something we try to work around.

```typescript
// If email claim is missing, show admin-facing error
if (!claims.email) {
  throw new OIDCConfigurationError(
    'OIDC configuration error: email claim is required. ' +
    'Configure your IdP to include email claim in tokens. ' +
    'For Entra ID: Add "email" to token claims in App Registration.'
  );
}
```

**Why not fall back to other claims?**
- `preferred_username` might be UPN, not email
- `mail` might differ from corporate email
- Mixing claim sources creates identity fragmentation
- Clear error is better than silent mismatch

### 13. Workspace Deletion
> What happens when a workspace is deleted?

**Decision:** Archive only, never hard delete from UI

**Implementation:**
- UI only shows "Archive Workspace" button, never "Delete"
- Hard delete only via:
  - Database migration (with approval process)
  - CLI tool with confirmation (for compliance/legal requests)
  - Never from web UI

**Archived Workspace Semantics:**

| Aspect | Behavior |
|--------|----------|
| Authentication | Cannot authenticate into archived workspace |
| Default workspace | Cannot be set as user's default |
| Workspace selector | Excluded from all selectors |
| API queries | Excluded unless explicitly queried by super admin with `include_archived=true` |
| Data | Preserved with `archived_at` timestamp |
| Restore | Super admin can restore from admin panel |
| Audit logs | **Remain fully queryable** even when workspace is archived |

**Why archive-only?**
- Prevents accidental data loss
- Compliance: may need historical data for audits
- Easy recovery if archived by mistake
- Simplifies the UI (no "are you sure?" for destructive action)
- Audit trail preserved for regulatory requirements

### 14. "All Workspaces" View Capabilities
> What can users do in the aggregate "All Workspaces" view?

**Decision:** Not available in Phase 1

- No "All Workspaces" aggregate view
- Super admins must switch to each workspace to view/report
- Keeps UX, permissions, and mental models aligned
- Phase 2: Consider read-only cross-workspace view for super admins

---

## Known Edge Cases

These edge cases should be kept in mind during implementation.

### A. API Usage Without UI Context

**Scenario:** Direct API calls (scripts, integrations, testing) without going through the UI.

**Requirement:**
- API calls without workspace context MUST be rejected (except super admin system endpoints)
- Error messages must be explicit and actionable

**Implementation:**
```typescript
// middleware/requireWorkspace.ts
export const requireWorkspace = (req, res, next) => {
  const workspaceId = req.headers['x-workspace-id']
    || req.params.workspaceSlug;

  if (!workspaceId) {
    return res.status(400).json({
      error: 'WORKSPACE_REQUIRED',
      message: 'Workspace context is required. Provide X-Workspace-Id header or use /api/workspaces/:slug/... URL pattern.',
      hint: 'Call GET /api/workspaces/accessible to list your workspaces'
    });
  }

  next();
};

// Apply to all data endpoints
app.use('/api/projects', requireWorkspace);
app.use('/api/risks', requireWorkspace);
app.use('/api/vendors', requireWorkspace);
// ... etc
```

### B. Background Jobs and Imports

**Scenario:** Imports, scheduled jobs, and async operations that run outside request context.

**Requirement:**
- Always persist `workspace_id` at job creation time
- Never infer workspace at execution time
- Prevents subtle cross-workspace data leaks

**Implementation:**
```typescript
// Job creation - capture workspace context
const createImportJob = async (req, file) => {
  const job = await db.jobs.create({
    type: 'csv_import',
    workspaceId: req.workspaceContext.currentWorkspaceId,  // Captured!
    created_by: req.workspaceContext.userId,
    file_path: file.path,
    status: 'pending'
  });
  return job;
};

// Job execution - use stored workspaceId to compute schema
const processImportJob = async (job) => {
  // ✅ Use workspaceId from job record to get schema
  const schema = getWorkspaceSchema(job.workspaceId);  // Returns "ws_{id}"

  // ❌ Never infer workspace at execution time
  // const schema = getCurrentContext().schema;

  for (const row of parseCSV(job.file_path)) {
    // Insert into workspace schema - no workspace_id column on record
    await sequelize.query(`
      INSERT INTO "${schema}".projects (name, description, created_by)
      VALUES (:name, :description, :userId)
    `, {
      replacements: { ...row, userId: job.created_by }
    });
  }
};

// Scheduled reports - same pattern
const scheduleReport = async (req, reportConfig) => {
  await db.scheduled_reports.create({
    ...reportConfig,
    workspaceId: req.workspaceContext.currentWorkspaceId,  // Captured at schedule time
    created_by: req.workspaceContext.userId
  });
};
```

**Key point:** Jobs store `workspaceId` (used to compute schema), NOT `workspace_id` as a column on domain records.

**Audit:**
- All background job executions should log `workspaceId`
- Alert if any job runs without workspace context

### C. Mixed Authentication Modes

**Scenario:** Some workspaces use OIDC (Entra ID), others use email/password.

**Decision:** OIDC workspaces do NOT allow email/password login (except super admin break-glass).

| Workspace Auth Mode | Regular Users | Super Admin |
|---------------------|---------------|-------------|
| `oidc_enabled: true` | OIDC only | OIDC or email/password (break-glass) |
| `oidc_enabled: false` | Email/password only | Email/password only |

**Rationale:**
- If a workspace is configured for OIDC, the organization wants centralized identity control
- Allowing email/password would bypass their IdP policies (MFA, conditional access, etc.)
- Super admin break-glass is allowed but audit-logged loudly

**Implementation:**
```typescript
// Login endpoint
if (workspace.oidc_enabled) {
  if (isEmailPasswordAttempt && !user.is_super_admin) {
    return res.status(403).json({
      error: 'This workspace requires SSO login',
      redirect: buildOIDCUrl(workspace)
    });
  }

  if (isEmailPasswordAttempt && user.is_super_admin) {
    // SECURITY: Verify super admin actually has a password set
    // Super admins created via OIDC may not have a password
    if (!user.password_hash) {
      return res.status(403).json({
        error: 'Break-glass login unavailable - no password configured',
        hint: 'Set a password via account settings or use OIDC login'
      });
    }

    // Allow but audit loudly
    await auditLog('BREAK_GLASS_LOGIN', {
      userId: user.id,
      workspaceId: workspace.id,
      method: 'password',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      severity: 'HIGH'  // This should trigger alerts
    });
  }
}
```

### D. Workspace Discovery

**Decision:** Avoid listing all workspaces to unauthenticated users.

**Pattern:** Deep link or slug entry, not directory browsing.

```
✅ Allowed:
/login?workspace=germany     → Shows Germany login
/w/germany/login             → Direct to Germany workspace
Enter workspace slug: [____] → User types slug

❌ Not allowed:
/login → Shows list of all workspaces (enumeration risk)
```

**Implementation:**
- Workspace selection requires knowing the slug
- "Forgot your workspace?" links to IT help, not a directory
- Previously-used workspaces stored in localStorage (not server-side list)

### E. Data Residency

**Decision:** Logical workspaces, physical residency handled at deployment level.

```
Workspace = Logical boundary (data isolation)
Deployment = Physical boundary (data residency)

If customer needs EU-only data:
├── Option A: Deploy separate EU instance
├── Option B: All workspaces in single EU deployment
└── NOT: Mix EU and US workspaces in same deployment
```

**What we DON'T support in Phase 1:**
- Per-workspace data residency within same deployment
- Cross-region workspace replication
- Workspace migration between deployments

**What enterprises accept:**
- "Your deployment is in EU-West-1, all data stays there"
- If they need US data residency, that's a separate deployment

### F. Out of Scope for Phase 1

Explicitly deferred to avoid scope creep:

| Feature | Status | Rationale |
|---------|--------|-----------|
| SCIM provisioning | Phase 2+ | Users added manually or via OIDC auto-create |
| Cross-workspace reporting | Phase 2 | Super admin switches workspaces for now |
| Workspace hierarchy | Never | Flat model is intentional |
| Per-workspace data residency | Phase 2+ | Deployment-level residency for Phase 1 |
| Identity linking table | Never | Email is canonical, re-auth handles multi-IdP |

---

*End of Document*
