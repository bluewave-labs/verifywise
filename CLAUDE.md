# VerifyWise - Development Guide

> **Last Updated:** 2026-03-05

This document contains core rules and patterns for all development in the VerifyWise codebase. For detailed feature documentation, see the [Reference Index](#detailed-references) at the bottom.

---

## Instructions for Claude

**Keep documentation up to date.**

When making changes to the codebase:
- **Core architecture changes** (new patterns, conventions, multi-tenancy, migration rules) → Update this CLAUDE.md
- **Feature-specific changes** (new routes, APIs, middleware, services) → Update the relevant reference doc (see [Detailed References](#detailed-references))
- **Both** when a change spans core + feature

Always update the "Last Updated" date when modifying this file.

---

## Related Repositories

| Repository | Location | Purpose |
|------------|----------|---------|
| **plugin-marketplace** | `../plugin-marketplace` (sibling directory) | All plugins (30+), framework plugins (SOC 2, GDPR, etc.), integration plugins. See `plugin-marketplace/CLAUDE.md`. |

> Plugin source code is NOT in this repository. Work in the plugin-marketplace repo.

---

## 1. Project Overview

VerifyWise is an AI governance platform supporting EU AI Act, ISO 42001, ISO 27001, NIST AI RMF, and plugin frameworks (SOC 2, GDPR, HIPAA, etc.).

### Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript, Vite, Material-UI 7, Redux Toolkit, React Query |
| **Backend** | Node.js 22, Express.js 4, TypeScript, Sequelize 6 |
| **Database** | PostgreSQL (schema-per-tenant) |
| **Cache/Queue** | Redis + BullMQ |
| **Python Services** | FastAPI, Python 3.12 (EvalServer) |

### Project Structure

```
verifywise/
├── Clients/                    # React frontend
│   └── src/
│       ├── application/        # Business logic (hooks, redux, repository)
│       ├── presentation/       # UI (pages, components, themes)
│       ├── domain/             # Types, interfaces, enums
│       └── infrastructure/     # API client, external services
├── Servers/                    # Express backend
│   ├── controllers/            # Request handlers
│   ├── routes/                 # API endpoints
│   ├── services/               # Business logic services
│   ├── utils/                  # Database queries (repository pattern)
│   ├── domain.layer/           # Models, interfaces, frameworks
│   ├── middleware/             # Auth, rate limiting, multi-tenancy
│   ├── database/               # DB config, migrations
│   ├── templates/              # Email (MJML) & PDF (EJS) templates
│   └── jobs/                   # BullMQ workers
├── EvalServer/                 # Python LLM evaluation service
└── docs/                       # Documentation
```

---

## 2. Architecture

### Frontend Clean Architecture

```
presentation/     → UI components, pages (what user sees)
application/      → Business logic, hooks, redux, contexts
domain/           → Types, interfaces, enums (core entities)
infrastructure/   → API clients, external services
```

### Backend Layered Architecture

```
routes/           → HTTP endpoint definitions
controllers/      → Request handling, validation
services/         → Complex business logic
utils/            → Database queries (Sequelize)
domain.layer/     → Models, interfaces, exceptions
```

### Request Flow

```
Browser → React Component → Redux/React Query → Axios
    ↓
Express Router → Middleware Chain → Controller → Service → Utils → PostgreSQL
```

---

## 3. Multi-Tenancy

VerifyWise uses **schema-per-tenant** isolation. Each organization gets its own PostgreSQL schema.

### Tenant Hash Generation

```typescript
// File: Servers/tools/getTenantHash.ts
import { createHash } from "crypto";

export const getTenantHash = (tenantId: number): string => {
  const hash = createHash('sha256').update(tenantId.toString()).digest('base64');
  return hash.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
}
// Example: Organization ID 1 → Schema "a1b2c3d4e5"
```

### Schema Structure

| Schema | Tables | Purpose |
|--------|--------|---------|
| `public` | users, organizations, roles, frameworks, subscriptions | Shared data |
| `{tenantHash}` | projects, vendors, risks, files, model_inventories, etc. | Tenant-specific data |

### Using Tenant Context

```typescript
const tenantId = req.tenantId;  // From auth middleware
const organizationId = req.organizationId;
const query = `SELECT * FROM "${tenantId}".projects WHERE id = :id`;
```

---

## 4. Database & Migrations

### Creating Migrations

**CRITICAL: Always generate timestamp with `date` command**

```bash
date +%Y%m%d%H%M%S
cd Servers
npx sequelize migration:create --name my-migration-name
```

### Migration Pattern: ALL TENANTS

```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`, { transaction }
      );
      // MUST use dist path
      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".my_table
          ADD COLUMN new_column VARCHAR(255);
        `, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`, { transaction }
      );
      const { getTenantHash } = require("../../dist/tools/getTenantHash");
      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".my_table
          DROP COLUMN IF EXISTS new_column;
        `, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
```

### Migration Pattern: PUBLIC Schema Only

```javascript
'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'new_field', {
      type: Sequelize.STRING, allowNull: true
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'new_field');
  }
};
```

### CRITICAL: Update createNewTenant.ts

After tenant-affecting migrations, you MUST also update `Servers/scripts/createNewTenant.ts` so new organizations get the same schema changes.

### Running Migrations

```bash
cd Servers
npm run build                    # Build TypeScript first (migrations use dist/)
npx sequelize db:migrate         # Run migrations
npx sequelize db:migrate:undo    # Rollback last
```

---

## 5. Backend Development (Summary)

**Full patterns with code examples:** See `docs/technical/guides/backend-patterns.md`

### Layer Flow

1. **Route** (`Servers/routes/{entity}.route.ts`) — Define endpoints, apply `authenticateJWT`
2. **Controller** (`Servers/controllers/{entity}.ctrl.ts`) — Handle request, validate, call utils, use `logProcessing`/`logSuccess`/`logFailure`, return `STATUS_CODE[xxx](...)`
3. **Utils** (`Servers/utils/{entity}.utils.ts`) — Raw SQL via `sequelize.query()` with `"${tenantId}".table_name` and `:replacements`
4. **Model** (`Servers/domain.layer/models/{entity}/`) — Sequelize-typescript decorators

**Don't forget:** Register new routes in `Servers/index.ts`:
```typescript
import entityRoutes from "./routes/entity.route";
app.use("/api/entities", entityRoutes);
```

---

## 6. Frontend Development (Summary)

**Full patterns with code examples:** See `docs/technical/guides/frontend-patterns.md`

### Layer Flow

1. **Component** (`Clients/src/presentation/components/{Name}/index.tsx`) — Hooks first, handlers, early returns, render
2. **Page** (`Clients/src/presentation/pages/{Name}/index.tsx`) — Uses hooks, loading/error states, PageTitle
3. **Repository** (`Clients/src/application/repository/{entity}.repository.ts`) — CustomAxios calls to API
4. **Hook** (`Clients/src/application/hooks/use{Entity}.ts`) — React Query `useQuery`/`useMutation`
5. **Route** (`Clients/src/application/config/routes.tsx`) — Add `<Route>` inside dashboard

---

## 7. Authentication & Authorization

### JWT Token Payload

```typescript
interface TokenPayload {
  id: number;              // User ID
  email: string;
  organizationId: number;
  tenantId: string;        // Tenant hash
  roleName: string;        // "Admin" | "Reviewer" | "Editor" | "Auditor"
  expire: Date;
}
```

### Roles

| Role ID | Name | Permissions |
|---------|------|-------------|
| 1 | Admin | Full access |
| 2 | Reviewer | Read + approve/reject |
| 3 | Editor | Read + write |
| 4 | Auditor | Read only |

### Usage

```typescript
// Backend: protect routes
import authenticateJWT from "../middleware/auth.middleware";
router.use(authenticateJWT);

// Frontend: check role
const { authToken, role } = useSelector((state) => state.auth);
```

**Detailed middleware reference:** See `docs/claude/middleware.md`

---

## 8. Development Workflow

### Starting Development

```bash
cd Servers && npm install && npm run watch    # Backend (Terminal 1)
cd Clients && npm install && npm run dev      # Frontend (Terminal 2)
cd Servers && npm run worker                  # BullMQ Worker (Terminal 3, optional)
```

### Build

```bash
cd Servers && npm run build    # Backend → /dist
cd Clients && npm run build    # Frontend → /dist
```

### Git Workflow

```bash
# Branch naming
feature/description    fix/description    docs/description

# Commit format: type(scope): description
# Types: feat, fix, docs, style, refactor, test, chore
feat(auth): add password reset functionality
fix(dashboard): resolve chart rendering issue
```

### PR Checklist

- [ ] Code deployed and tested locally
- [ ] Self-review completed
- [ ] Issue number included
- [ ] No hardcoded values
- [ ] UI elements use theme references
- [ ] Tests written/updated
- [ ] No console.log statements
- [ ] No sensitive data exposed

---

## 9. Testing

- **Minimum coverage:** 80%
- **Frontend:** `cd Clients && npm run test` (Vitest)
- **Backend:** `cd Servers && npm run test` (Jest)
- **Convention:** `describe('ComponentName', () => { it('should do X when Y', ...) })`

---

## 10. Environment Configuration

### Backend (.env)

Key variables: `PORT`, `DB_HOST/PORT/NAME/USER/PASSWORD`, `REDIS_HOST/PORT`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `MULTI_TENANCY_ENABLED`, `ENCRYPTION_KEY`, `EMAIL_PROVIDER`, `RESEND_API_KEY`

### Frontend (.env.local)

```env
VITE_APP_API_URL=http://localhost:3000/api
VITE_APP_PORT=5173
VITE_IS_MULTI_TENANT=false
```

### Required Services

| Service | Default Port | Required |
|---------|-------------|----------|
| PostgreSQL | 5432 | Yes |
| Redis | 6379 | Yes |
| Backend | 3000 | Yes |
| Frontend | 5173 | Yes |
| EvalServer | 8000 | For LLM Evals |

---

## Quick Reference

### Key Files

| Purpose | Path |
|---------|------|
| Backend entry | `Servers/index.ts` |
| Frontend entry | `Clients/src/main.tsx` |
| Route definitions (BE) | `Servers/routes/*.ts` |
| Route definitions (FE) | `Clients/src/application/config/routes.tsx` |
| Database models | `Servers/domain.layer/models/` |
| Tenant hash | `Servers/tools/getTenantHash.ts` |
| Create tenant script | `Servers/scripts/createNewTenant.ts` |
| Auth middleware | `Servers/middleware/auth.middleware.ts` |
| Axios config | `Clients/src/infrastructure/api/customAxios.ts` |
| Redux store | `Clients/src/application/redux/store.ts` |
| Custom exceptions | `Servers/domain.layer/exceptions/custom.exception.ts` |
| Log helper | `Servers/utils/logger/logHelper.ts` |

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Variables/Functions | camelCase | `getUserData`, `isValid` |
| Components/Classes | PascalCase | `UserProfile`, `AuthService` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| Files (Components) | PascalCase | `UserProfile.tsx` |
| Files (Utilities) | camelCase | `formatDate.ts` |
| Database Tables | snake_case | `user_profiles` |
| API Endpoints | kebab-case | `/api/user-profiles` |

### Common Commands

```bash
date +%Y%m%d%H%M%S                              # Get timestamp for migrations
cd Servers && npx sequelize migration:create --name name
cd Servers && npm run build && npx sequelize db:migrate
cd Servers && npm run watch                      # Start backend
cd Clients && npm run dev                        # Start frontend
```

---

## Detailed References

Read the relevant file BEFORE implementing changes in that area:

| When working on... | Read this file |
|---------------------|---------------|
| Backend controller/route/utils patterns | `docs/technical/guides/backend-patterns.md` |
| Frontend component/page/hook patterns | `docs/technical/guides/frontend-patterns.md` |
| Adding a new feature (full guide) | `docs/technical/guides/adding-new-feature.md` |
| Adding a new framework | `docs/technical/guides/adding-new-framework.md` |
| API conventions | `docs/technical/guides/api-conventions.md` |
| Code style | `docs/technical/guides/code-style.md` |
| Plugin system | `docs/technical/infrastructure/plugin-system.md` |
| API routes & endpoints | `docs/technical/api/endpoints.md` |
| Background jobs (BullMQ) | `docs/technical/infrastructure/automations.md` |
| Email templates (MJML) | `docs/technical/infrastructure/email-service.md` |
| PDF/DOCX reporting | `docs/technical/infrastructure/pdf-generation.md` |
| File upload system | `docs/technical/infrastructure/file-storage.md` |
| Change history tracking | `docs/claude/change-history.md` |
| Error handling & exceptions | `docs/claude/error-handling.md` |
| Logging system | `docs/claude/logging.md` |
| Middleware (rate limit, RBAC, JWT, Redis) | `docs/claude/middleware.md` |
| Assessments, subscriptions, tokens, etc. | `docs/claude/additional-apis.md` |
| Approval workflows | `docs/technical/domains/approvals.md` |
| AI Detection | `docs/technical/domains/ai-detection.md` |
| Post-market monitoring | `docs/technical/domains/post-market-monitoring.md` |
| Notifications | `docs/technical/domains/notifications.md` |
| Risk management | `docs/technical/domains/risk-management.md` |
| Vendors | `docs/technical/domains/vendors.md` |
| Policies | `docs/technical/domains/policies.md` |
| Datasets | `docs/technical/domains/datasets.md` |
| Use cases / projects | `docs/technical/domains/use-cases.md` |
| Tasks | `docs/technical/domains/tasks.md` |
| Incidents | `docs/technical/domains/incidents.md` |
| Evidence hub | `docs/technical/domains/evidence.md` |
| Models / model inventory | `docs/technical/domains/models.md` |
| Training registry | `docs/technical/domains/training.md` |
| Search | `docs/technical/domains/search.md` |
| Share links | `docs/technical/domains/share-links.md` |
| Dashboard | `docs/technical/domains/dashboard.md` |
| Compliance frameworks | `docs/technical/domains/compliance-frameworks.md` |
| MUI theming & design tokens | `docs/technical/guides/design-tokens.md` |
| Frontend styling | `docs/technical/frontend/styling.md` |
| Frontend components | `docs/technical/frontend/components.md` |
| Redux, Axios, frontend architecture | `docs/technical/frontend/overview.md` |
| AI Advisor | `docs/technical/infrastructure/ai-advisor.md` |
| Integrations (Slack, GitHub) | `docs/technical/infrastructure/integrations.md` |
| Docker & deployment | `docs/deployment/PRODUCTION_DEPLOYMENT_GUIDE.md` |
| CI/CD workflows | `docs/deployment/README.md` |
| Database schema | `docs/technical/architecture/database-schema.md` |
| Authentication architecture | `docs/technical/architecture/authentication.md` |
| Multi-tenancy architecture | `docs/technical/architecture/multi-tenancy.md` |
| Testing guide | `docs/technical/guides/testing.md` |

---

## Additional Resources

- [Code Rules](./CodeRules/README.md) - Detailed coding standards
- [Plugin System](./docs/PLUGIN_SYSTEM.md) - Plugin architecture
- [Technical Docs](./docs/technical/) - Architecture documentation
- [API Docs](./Servers/swagger.yaml) - OpenAPI specification
- [Agent Roles](./agents/) - AI-assisted development roles
