# Multi-Tenancy Architecture

## Overview

VerifyWise implements a **schema-per-tenant** isolation strategy using PostgreSQL. Each organization (tenant) gets its own dedicated database schema, providing complete data isolation at the database level while maintaining a single codebase and connection pool.

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              PostgreSQL Database                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐                                                     │
│  │   public schema     │  ← Shared data (users, organizations, frameworks)   │
│  │  ─────────────────  │                                                     │
│  │  users              │                                                     │
│  │  organizations      │                                                     │
│  │  roles              │                                                     │
│  │  frameworks         │                                                     │
│  │  subscriptions      │                                                     │
│  │  tiers              │                                                     │
│  └─────────────────────┘                                                     │
│                                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │  a1b2c3d4e5 schema  │  │  x9y8z7w6v5 schema  │  │  m3n4o5p6q7 schema  │  │
│  │  (Org ID: 1)        │  │  (Org ID: 2)        │  │  (Org ID: 3)        │  │
│  │  ─────────────────  │  │  ─────────────────  │  │  ─────────────────  │  │
│  │  projects           │  │  projects           │  │  projects           │  │
│  │  vendors            │  │  vendors            │  │  vendors            │  │
│  │  risks              │  │  risks              │  │  risks              │  │
│  │  files              │  │  files              │  │  files              │  │
│  │  model_files        │  │  model_files        │  │  model_files        │  │
│  │  ...30+ tables      │  │  ...30+ tables      │  │  ...30+ tables      │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Tenant Identification

### Tenant Hash Generation

Each organization is identified by a deterministic hash derived from its ID:

```typescript
// File: Servers/tools/getTenantHash.ts
import { createHash } from "crypto";

export const getTenantHash = (tenantId: number): string => {
  const hash = createHash('sha256').update(tenantId.toString()).digest('base64');
  return hash.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
}
```

**Process:**
1. SHA256 hash of organization ID (as string)
2. Convert to base64
3. Remove all non-alphanumeric characters
4. Take first 10 characters

**Example:**
- Organization ID: `1` → Schema: `a1b2c3d4e5`
- Organization ID: `2` → Schema: `x9y8z7w6v5`

### Why This Approach?

| Benefit | Explanation |
|---------|-------------|
| **Deterministic** | Same org ID always produces same schema name |
| **Collision-resistant** | SHA256 provides strong uniqueness |
| **SQL-safe** | Alphanumeric only, safe for SQL identifiers |
| **Compact** | 10 characters is reasonable for schema names |
| **Not guessable** | Can't easily derive org ID from schema name |

## Request Flow with Tenant Context

```
1. HTTP Request
        │
        ▼
2. Express Middleware Chain
   ├── CORS
   ├── Rate Limiting
   ├── authMiddleware ────────────────────────────────┐
   │   │                                              │
   │   ├── Extract JWT from Authorization header      │
   │   ├── Verify token signature                     │
   │   ├── Validate tenantId format (regex)           │
   │   ├── Verify tenantId === getTenantHash(orgId)   │
   │   ├── Check user belongs to organization         │
   │   └── Attach to request:                         │
   │       req.userId = decoded.id                    │
   │       req.tenantId = decoded.tenantId            │
   │       req.organizationId = decoded.organizationId│
   │                                                  │
   └── contextMiddleware ─────────────────────────────┤
       │                                              │
       └── Store in AsyncLocalStorage:                │
           { userId, tenantId, organizationId }       │
                      │                               │
                      ▼                               │
3. Controller                                         │
        │                                             │
        ▼                                             │
4. Service Layer                                      │
        │                                             │
        ▼                                             │
5. Database Query                                     │
   │                                                  │
   ├── Get tenantId from AsyncLocalStorage ◄─────────┘
   │
   └── Execute: SELECT * FROM "${tenantId}".projects ...
```

## Middleware Implementation

### Authentication Middleware

```typescript
// File: Servers/middleware/auth.middleware.ts

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    // 1. Verify and decode JWT
    const decoded = getTokenPayload(token);

    // 2. Validate tenant hash format (10 alphanumeric chars)
    if (!isValidTenantHash(decoded.tenantId)) {
      return res.status(400).json({ message: "Invalid tenant format" });
    }

    // 3. Verify tenant hash matches organization ID
    if (decoded.tenantId !== getTenantHash(decoded.organizationId)) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // 4. Verify user belongs to organization
    const belongs = await doesUserBelongsToOrganizationQuery(
      decoded.id,
      decoded.organizationId
    );
    if (!belongs.belongs) {
      return res.status(403).json({
        message: "User does not belong to this organization"
      });
    }

    // 5. Attach context to request
    req.userId = decoded.id;
    req.tenantId = decoded.tenantId;
    req.organizationId = decoded.organizationId;

    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};
```

### Context Middleware

```typescript
// File: Servers/middleware/context.middleware.ts

import { asyncLocalStorage } from "../utils/context/context";

export default function contextMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const { userId, tenantId, organizationId } = req;

  // Wrap the rest of the request in AsyncLocalStorage
  asyncLocalStorage.run({
    userId: typeof userId === "number" ? userId : undefined,
    tenantId,
    organizationId
  }, () => {
    next();
  });
}
```

### AsyncLocalStorage Context

```typescript
// File: Servers/utils/context/context.ts

import { AsyncLocalStorage } from "async_hooks";

type RequestContext = {
  userId?: number;
  tenantId?: string;
  organizationId?: number;
};

export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();
```

### Retrieving Context

```typescript
// File: Servers/utils/context/tenantContext.ts

export function getCurrentTenantContext(): TenantContext {
  const store = asyncLocalStorage.getStore();
  return {
    tenantId: store?.tenantId,
    organizationId: store?.organizationId,
    userId: store?.userId
  };
}

// Usage in any service/util:
const { tenantId } = getCurrentTenantContext();
const query = `SELECT * FROM "${tenantId}".projects WHERE id = :id`;
```

## Database Schema Switching

Schema switching happens at query time, not connection time. All connections use the same database with schema specified in SQL:

### Query Patterns

**Tenant-scoped query:**
```typescript
// File: Servers/utils/project.utils.ts

const { tenantId } = getCurrentTenantContext();

const query = `
  SELECT * FROM "${tenantId}".projects
  WHERE id = :projectId
`;

const [projects] = await sequelize.query(query, {
  replacements: { projectId },
  type: QueryTypes.SELECT
});
```

**Cross-schema join (tenant + public):**
```typescript
const query = `
  SELECT
    p.id,
    p.project_title,
    u.name || ' ' || u.surname AS owner_name
  FROM "${tenantId}".projects p
  JOIN public.users u ON p.owner = u.id
  WHERE p.id = :projectId
`;
```

**Public schema only:**
```typescript
// File: Servers/utils/user.utils.ts

const query = `
  SELECT * FROM public.users
  WHERE id = :userId
`;
```

### SQL Injection Prevention

```typescript
// File: Servers/repositories/file.repository.ts

function validateTenant(tenant: string): void {
  if (!/^[A-Za-z0-9_]{1,30}$/.test(tenant)) {
    throw new ValidationException("Invalid tenant identifier");
  }
}

function escapePgIdentifier(ident: string): string {
  validateTenant(ident);
  return '"' + ident.replace(/"/g, '""') + '"';
}

// Safe usage:
const query = `
  INSERT INTO ${escapePgIdentifier(tenantId)}.files
  (filename, content, type)
  VALUES (:filename, :content, :type)
`;
```

## Schema Structure

### Public Schema Tables

Shared across all tenants:

| Table | Purpose |
|-------|---------|
| `users` | User accounts (with `organization_id` FK) |
| `organizations` | Organization records |
| `roles` | System roles (Admin, Reviewer, Editor, Auditor) |
| `frameworks` | Compliance frameworks (EU AI Act, ISO 42001, etc.) |
| `subscriptions` | Billing information |
| `tiers` | Service tier definitions |

### Tenant Schema Tables

Each tenant schema contains identical structure:

| Table | Purpose |
|-------|---------|
| `projects` | AI use cases/projects |
| `vendors` | Third-party vendors |
| `model_files` | AI model inventory |
| `risks` | Risk definitions |
| `projects_risks` | Project-risk associations |
| `files` | Uploaded documents |
| `approval_workflows` | Workflow definitions |
| `approval_requests` | Approval instances |
| `event_logs` | Audit trail |
| `post_market_monitoring_*` | PMM feature tables |
| ...and 30+ more |

## Tenant Creation

When a new organization is created, the system:

1. Creates the organization record in `public.organizations`
2. Generates the tenant hash
3. Creates the tenant schema with all tables

```typescript
// File: Servers/scripts/createNewTenant.ts

export const createNewTenant = async (
  organization_id: number,
  transaction: Transaction
) => {
  const tenantHash = getTenantHash(organization_id);

  // 1. Create schema
  await sequelize.query(
    `CREATE SCHEMA "${tenantHash}";`,
    { transaction }
  );

  // 2. Create tenant-specific ENUM types
  await sequelize.query(`
    CREATE TYPE "${tenantHash}".enum_vendors_data_sensitivity AS ENUM (
      'None',
      'Internal only',
      'Personally identifiable information (PII)',
      ...
    );
  `, { transaction });

  // 3. Create trigger functions
  await sequelize.query(`
    CREATE OR REPLACE FUNCTION "${tenantHash}".check_only_one_organizational_project()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.is_organizational = TRUE THEN
        IF EXISTS (
          SELECT 1 FROM "${tenantHash}".projects
          WHERE is_organizational = TRUE AND id <> NEW.id
        ) THEN
          RAISE EXCEPTION 'Only one project can have is_organizational = TRUE';
        END IF;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `, { transaction });

  // 4. Create all tables
  await sequelize.query(`
    CREATE TABLE "${tenantHash}".projects (
      id SERIAL PRIMARY KEY,
      project_title VARCHAR(255),
      owner INTEGER REFERENCES public.users(id),
      ...
    );
  `, { transaction });

  // 5. Create indexes
  // 6. Create foreign key constraints
};
```

## Multi-Tenancy Enforcement

### Environment Configuration

```env
# Enable/disable multi-tenancy (SaaS mode)
MULTI_TENANCY_ENABLED=true

# Allowed domains for organization creation
# (only app.verifywise.ai and test.verifywise.ai can create orgs)
```

### Organization Creation Guard

```typescript
// File: Servers/middleware/multiTenancy.middleware.ts

export const checkMultiTenancy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestOrigin = req.headers.origin || req.headers.host;
  const organizationExists = await getOrganizationsExistsQuery();

  // Allow if:
  // 1. Multi-tenancy enabled AND request from authorized domains
  // 2. OR no organizations exist yet (initial setup)
  if (
    (process.env.MULTI_TENANCY_ENABLED === "true" &&
      (requestOrigin?.includes("app.verifywise.ai") ||
       requestOrigin?.includes("test.verifywise.ai"))) ||
    !organizationExists.exists
  ) {
    return next();
  }

  return res.status(403).json({
    message: "Multi tenancy is not enabled in this server."
  });
};
```

## JWT Token Structure

Tokens contain tenant information:

```typescript
interface TokenPayload {
  id: number;              // User ID
  email: string;
  name: string;
  surname: string;
  organizationId: number;  // Organization ID
  tenantId: string;        // Tenant hash (e.g., "a1b2c3d4e5")
  roleName: string;        // User's role
  expire: Date;
}
```

## Security Considerations

### Defense in Depth

1. **JWT Validation**: Token must be valid and not expired
2. **Tenant Hash Validation**: Must match regex `^[a-zA-Z0-9]{10}$`
3. **Hash Verification**: `tenantId === getTenantHash(organizationId)`
4. **Organization Membership**: User must belong to the organization
5. **SQL Identifier Validation**: Schema names validated before use

### Validation Functions

```typescript
// File: Servers/utils/security.utils.ts

// Validates tenant hash format
export function isValidTenantHash(tenantId: string): boolean {
  return /^[a-zA-Z0-9]{10}$/.test(tenantId);
}

// Validates SQL identifiers
export function isValidSQLIdentifier(value: string): boolean {
  return /^[a-zA-Z0-9_]{1,63}$/.test(value);
}

// Creates safe SQL identifier
export function safeSQLIdentifier(identifier: string): string {
  if (!isValidSQLIdentifier(identifier)) {
    throw new Error("Invalid SQL identifier");
  }
  return identifier;
}
```

## Data Migration Between Schemas

When migrating data from public to tenant schemas:

```javascript
// File: Servers/database/migrations/20260114142551-*.js

// 1. Read data with organization context
const rows = await queryInterface.sequelize.query(`
  SELECT e.*, u.organization_id
  FROM public.event_logs AS e
  INNER JOIN users u ON e.user_id = u.id
`);

// 2. Group by tenant
const map = new Map();
for (let row of rows[0]) {
  const tenantHash = getTenantHash(row.organization_id);
  if (!map.has(tenantHash)) {
    map.set(tenantHash, []);
  }
  map.get(tenantHash).push(row);
}

// 3. Insert into each tenant schema
for (let [tenantHash, rows] of map) {
  await queryInterface.sequelize.query(`
    INSERT INTO "${tenantHash}".event_logs (...)
    VALUES ...
  `);
}
```

## Summary Table

| Aspect | Implementation |
|--------|----------------|
| **Isolation Strategy** | Schema-per-tenant (PostgreSQL named schemas) |
| **Tenant Identifier** | Organization ID (integer) |
| **Schema Name** | SHA256(orgId) → base64 → alphanumeric → 10 chars |
| **Context Storage** | AsyncLocalStorage (async_hooks) |
| **Context Propagation** | authMiddleware → contextMiddleware → asyncLocalStorage.run() |
| **Database Connections** | Single connection pool; schema specified in SQL queries |
| **Public Schema** | users, organizations, roles, frameworks, subscriptions |
| **Tenant Schema** | projects, vendors, risks, files, and 30+ more tables |
| **Tenant Validation** | Regex + getTenantHash verification |
| **SQL Injection Prevention** | Parameterized queries + identifier validation |

## Key Files

| File | Purpose |
|------|---------|
| `Servers/tools/getTenantHash.ts` | Hash generation function |
| `Servers/middleware/auth.middleware.ts` | JWT validation, tenant verification |
| `Servers/middleware/context.middleware.ts` | AsyncLocalStorage setup |
| `Servers/middleware/multiTenancy.middleware.ts` | Organization creation guard |
| `Servers/utils/context/context.ts` | AsyncLocalStorage instance |
| `Servers/utils/context/tenantContext.ts` | Context retrieval helpers |
| `Servers/utils/security.utils.ts` | Validation functions |
| `Servers/scripts/createNewTenant.ts` | Tenant schema creation |

## Related Documentation

- [Architecture Overview](./overview.md)
- [Authentication](./authentication.md)
- [Database Schema](./database-schema.md)
