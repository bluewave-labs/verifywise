# VerifyWise - Development Guide

> **Last Updated:** 2026-03-04 | **Sections:** 59

Authoritative reference for all development. Follow these patterns exactly.

## Instructions for Claude

**Keep this document up to date.** When making changes that affect features, routes, APIs, middleware, services, DB schema, migrations, patterns, or integrations — update this file accordingly (sections, TOC, date, section count).

## Related Repositories

| Repository | Location | Purpose |
|------------|----------|---------|
| **plugin-marketplace** | `../plugin-marketplace` (sibling dir) | All plugins (30+), framework plugins (SOC 2, GDPR, etc.), integration plugins, shared packages. See its `CLAUDE.md`. |

---

## 1. Project Overview

AI governance platform supporting EU AI Act, ISO 42001, ISO 27001, NIST AI RMF, and plugin frameworks (SOC 2, GDPR, HIPAA).

**Tech Stack:** React 18 + TS + Vite + MUI 7 + Redux Toolkit + React Query | Node.js 22 + Express 4 + TS + Sequelize 6 | PostgreSQL (shared schema, org_id isolation) | Redis + BullMQ | FastAPI + Python 3.12 (EvalServer)

**Structure:**
```
Clients/src/  → application/ | presentation/ | domain/ | infrastructure/
Servers/      → controllers/ | routes/ | services/ | utils/ | domain.layer/ | middleware/ | database/ | templates/ | jobs/
EvalServer/   → Python LLM evaluation service
```

## 2. Architecture

**Frontend:** `presentation → application → domain → infrastructure`
**Backend:** `routes → controllers → services → utils → domain.layer`
**Request flow:** `Browser → React → Redux/React Query → Axios → Express Router → Middleware → Controller → Service → Utils → PostgreSQL`

## 3. Multi-Tenancy

Shared-schema isolation with `organization_id` column on all tenant-scoped tables. All data lives in the `public` schema.

| Schema | Purpose |
|--------|---------|
| `public` | All tables — users, organizations, projects, vendors, risks, files, model_inventories, frameworks, etc. |

**Access:** `req.organizationId` from auth middleware. Queries: `SELECT * FROM table WHERE organization_id = :orgId`.

**Legacy:** Previously used schema-per-tenant (`{tenantHash}` schemas). Migration script `Servers/scripts/migrateToSharedSchema.ts` moves data from old tenant schemas to shared public schema with `organization_id`. Runs automatically on startup or via `npm run migrate:shared-schema`.

## 4. Database & Migrations

**Create:** `date +%Y%m%d%H%M%S` then `cd Servers && npx sequelize migration:create --name name`

**Migration pattern:** Standard Sequelize `queryInterface.addColumn('table', ...)` on the public schema. All tables are in public with `organization_id` for tenant isolation.

**Run:** `npm run build && npx sequelize db:migrate` | Undo: `npx sequelize db:migrate:undo`

## 5. Backend Development

**Controller** (`controllers/{entity}.ctrl.ts`): Use `logProcessing`, `logSuccess`, `logFailure` from `utils/logger/logHelper`. Validate input, call utils, return `STATUS_CODE[200](data)`.

**Route** (`routes/{entity}.route.ts`): `router.use(authenticateJWT)`, define CRUD routes, export. Register in `Servers/index.ts`: `app.use("/api/entities", entityRoutes)`.

**Utils** (`utils/{entity}.utils.ts`): Raw Sequelize queries with `replacements` and `organization_id` filtering on public schema tables.

**Domain models** (`domain.layer/models/`): Sequelize-typescript `@Table`, `@Column` decorators.

## 6. Frontend Development

**Component** (`presentation/components/{Name}/index.tsx`): External imports → internal imports → interface → component with hooks first, handlers, early returns, render.

**Page** (`presentation/pages/{Name}/index.tsx`): Container + PageTitle + data hook.

**Repository** (`application/repository/{entity}.repository.ts`): CRUD methods using `CustomAxios`.

**Hook** (`application/hooks/useEntity.ts`): `useQuery`/`useMutation` wrapping repository calls.

**Routes:** `Clients/src/application/config/routes.tsx` — add `<Route>` inside dashboard.

## 7. Authentication & Authorization

**JWT payload:** `{ id, email, name, surname, organizationId, tenantId, roleName, expire }`

| Role ID | Name | Permissions |
|---------|------|-------------|
| 1 | Admin | Full access |
| 2 | Reviewer | Read + approve/reject |
| 3 | Editor | Read + write |
| 4 | Auditor | Read only |

**Backend:** `router.use(authenticateJWT)` | **Frontend:** `useSelector(state => state.auth)`

## 8. Plugin System

Plugins live in `../plugin-marketplace`. Types: integration (Slack, MLflow), data (Risk Import), framework (SOC 2, GDPR, HIPAA).

**Flow:** Registry (`plugins.json`) → Download to `Servers/temp/plugins/` → Routes via `/api/plugins/:key/*` → UI via `<PluginSlot slotId="..." />`

**Slot IDs:** `page.risks.actions` | `page.models.tabs` | `page.plugin.config` | `page.controls.custom-framework` | `page.project-controls.custom-framework` | `modal.framework.selection` | `page.org-framework.management` | `page.framework-dashboard.custom` | `page.project-overview.custom-framework`

**File linking:** Use `file_entity_links` table with `framework_type = pluginKey`.

**Custom Framework Struct/Impl Split:**
- **Struct tables** (shared, no org_id): `custom_framework_definitions`, `custom_framework_level1_struct`, `custom_framework_level2_struct`, `custom_framework_level3_struct` — template data, one copy per plugin_key
- **Impl tables** (per-org): `custom_frameworks` (with `definition_id` FK), `custom_framework_projects`, `custom_framework_level2_impl`, `custom_framework_level3_impl`, `custom_framework_level2_risks`, `custom_framework_level3_risks`
- Installing a plugin creates struct rows (if first org) + per-org records. Uninstalling deletes per-org data; struct is cleaned up only when no org references it.

**Build (in plugin-marketplace):** `npm run build:all` | `npm run build:framework-plugins` | `npm run build:custom-framework-ui`

**IMPORTANT:** After modifying `custom-framework-base/index.ts`, rebuild plugins AND clear cached bundles: `rm -rf Servers/temp/plugins/*/`

## 9. Features Reference

### Core Features
| Feature | Backend | Frontend |
|---------|---------|----------|
| Dashboard | `/api/dashboard` | `/` |
| Projects/Use Cases | `/api/projects` | `/project-view` |
| Risk Management | `/api/projectRisks` | `/risk-management` |
| Vendors | `/api/vendors`, `/api/vendorRisks` | `/vendors` |
| Model Inventory | `/api/modelInventory`, `/api/modelRisks` | `/model-inventory` |
| Datasets | `/api/datasets` | `/datasets` |
| Policies | `/api/policies` | `/policies` |
| Tasks | `/api/tasks` | `/tasks` |
| Automations | `/api/automations` | `/automations` |
| Incidents | `/api/ai-incident-managements` | `/ai-incident-managements` |
| File Manager | `/api/files`, `/api/file-manager` | `/file-manager` |
| Reporting | `/api/reporting` | `/reporting` |
| Training Registry | `/api/training` | `/training` |
| AI Trust Center | `/api/aiTrustCentre` | `/ai-trust-center` |
| Plugins | `/api/plugins` | `/plugins` |

### Frameworks
EU AI Act (`/api/eu-ai-act`), ISO 42001 (`/api/iso-42001`), ISO 27001 (`/api/iso-27001`), NIST AI RMF (`/api/nist-ai-rmf`), Plugin frameworks (`/api/plugins/:key`)

### Special Features
LLM Evals (`/api/deepeval` → EvalServer) | AI Detection (`/api/ai-detection`) | Shadow AI (`/api/shadow-ai`) | Agent Discovery (`/api/agent-primitives`) | Approval Workflows (`/api/approval-workflows`, `/api/approval-requests`) | PMM (`/api/pmm`) | CE Marking (`/api/ce-marking`) | Entity Graph (`/api/entity-graph`) | AI Advisor (`/api/advisor`)

## 10. Development Workflow

```bash
cd Servers && npm run watch    # Backend (TS compile + nodemon)
cd Clients && npm run dev      # Frontend (Vite)
cd EvalServer && source venv/bin/activate && cd src && python app.py  # Optional
cd Servers && npm run worker   # Optional BullMQ worker
```

**Git:** Branches: `feature/`, `fix/`, `docs/`. Commits: `type(scope): description` (feat, fix, docs, style, refactor, test, chore).

## 11. Testing

Min 80% coverage. Frontend: `cd Clients && npm run test` (Vitest). Backend: `cd Servers && npm run test` (Jest). Convention: `describe('Name', () => { it('should X when Y', ...) })`.

## 12. Environment Configuration

**Backend (.env):** PORT=3000, DB_HOST/PORT/NAME/USER/PASSWORD, REDIS_HOST/PORT, JWT_SECRET, REFRESH_TOKEN_SECRET, ENCRYPTION_KEY, EMAIL_PROVIDER, RESEND_API_KEY, SLACK_BOT_TOKEN, OPENAI_API_KEY

**Frontend (.env.local):** VITE_APP_API_URL=http://localhost:3000/api, VITE_APP_PORT=5173, VITE_IS_MULTI_TENANT=false

**Services:** PostgreSQL:5432, Redis:6379, Backend:3000, Frontend:5173, EvalServer:8000

## 13. Background Jobs (BullMQ)

Files: `jobs/producer.ts` (schedules), `jobs/worker.ts` (processes), `services/automations/automationProducer.ts` + `automationWorker.ts`.

**Add job:** 1) Create schedule function in producer with `automationQueue.add(name, data, { repeat: { pattern: "0 8 * * *" } })`, 2) Register in `jobs/producer.ts`, 3) Add handler in worker.

Run: `cd Servers && npm run worker`

## 14. Email Templates (MJML)

Location: `Servers/templates/*.mjml` (25+ templates). Variables: `{{variableName}}`. Compile: `compileMjmlToHtml(template, data)` from `tools/mjmlCompiler.ts`.

## 15. PDF/DOCX Reporting

Templates: `Servers/templates/reports/*.ejs`. Use `generateReport({ projectId, frameworkId, reportType, format }, userId, tenantId)` from `services/reporting`.

Report types: `projectRisks`, `vendorRisks`, `modelRisks`, `compliance`, `assessment`, `clausesAndAnnexes`, `nistSubcategories`, `vendors`, `models`, `trainingRegistry`, `policyManager`, `incidentManagement`, `all`.

## 16. Change History Tracking

Supported entities: vendor, vendor_risk, project_risk, policy, incident, use_case, model_inventory, file, dataset.

Use `recordEntityCreation`, `trackEntityChanges`, `recordMultipleFieldChanges`, `recordEntityDeletion` from `utils/changeHistory.base.utils`. Config: `Servers/config/changeHistory.config.ts`.

## 17. File Upload System

Use `uploadFile(fileObj, userId, projectId, FileSource, tenantId, transaction, opts)` from `utils/fileUpload.utils`. Generic linking via `file_entity_links` table with `framework_type`, `entity_type`, `entity_id`.

## 18. Approval Workflows

Structure: `ApprovalWorkflow → Steps → Approvers` | `ApprovalRequest → RequestSteps → StepApprovals`

Use `createApprovalWorkflowQuery`, `createApprovalRequestQuery`, `approveStepQuery`, `rejectStepQuery`, `withdrawApprovalRequestQuery` from respective utils.

## 19. Error Handling

Custom exceptions in `domain.layer/exceptions/custom.exception.ts`: `ValidationException` (400), `NotFoundException` (404), `UnauthorizedException` (401), `ForbiddenException` (403), `ConflictException` (409), `BusinessLogicException` (422), `DatabaseException` (500), `ExternalServiceException` (502).

## 20. Logging System

Use `logProcessing`, `logSuccess`, `logFailure` from `utils/logger/logHelper`. Event types: Create, Read, Update, Delete. Direct: `import logger from "utils/logger/fileLogger"`. Logs: `Servers/logs/app-YYYY-MM-DD.log`.

## 21. LLM Evals (EvalServer)

Python FastAPI service at `EvalServer/src/app.py`. Routes: `/deepeval` (core), `/deepeval/projects`, `/deepeval/orgs`, `/deepeval/arena`, `/deepeval/bias`. Express proxies `/api/deepeval/*` to EvalServer. Run: `cd EvalServer && source venv/bin/activate && cd src && python app.py` (port 8000).

## 22. AI Advisor

AI governance assistant with function calling. Located at `Servers/advisor/`. Supports OpenAI, Anthropic, OpenRouter. Endpoints: `POST /api/advisor/run` and `POST /api/advisor/stream`.

Tool categories: Risk, Model Inventory, Model Risk, Vendor, Incident, Task, Policy, Use Case, Dataset, Framework, Training, Evidence, Reporting, AI Trust Centre, Agent Discovery.

LLM keys stored per-tenant via `/api/llm-keys`.

## 23. Shadow AI Detection

Monitors unauthorized AI tool usage. Ingestion via `POST /api/v1/shadow-ai/events` with `X-API-Key` header.

Key routes: `/api/shadow-ai/insights/*` (summary, tools-by-events, users-by-department, trend), `/api/shadow-ai/users`, `/api/shadow-ai/tools`, `/api/shadow-ai/rules`, `/api/shadow-ai/config/syslog`, `/api/shadow-ai/settings`, `/api/shadow-ai/api-keys`.

Governance statuses: unreviewed, approved, restricted, blocked.

## 24. AI Detection Module

Scans repositories for AI-generated code and AI/ML dependencies. Scan flow: `POST /scans` → poll status → `GET /scans/:id/findings`.

Key routes: `/ai-detection/scans` (CRUD), `/scans/:id/findings`, `/scans/:id/security-findings`, `/scans/:id/export/ai-bom`, `/scans/:id/compliance`, `/ai-detection/stats`.

Governance: null, reviewed, approved, flagged. Roles: Admin/Editor can start/cancel scans; Admin only can delete.

## 25. Post-Market Monitoring (PMM)

Scheduled monitoring cycles for production AI systems. Config per project → Cycles → Questions → Responses → Reports.

Routes: `/pmm/config`, `/pmm/config/:id/questions`, `/pmm/active-cycle/:projectId`, `/pmm/cycles/:id/responses`, `/pmm/cycles/:id/submit`, `/pmm/reports`.

Frequencies: weekly, biweekly, monthly, quarterly, annually. States: pending → in_progress → completed | flagged. Uses BullMQ for notifications.

## 26. Slack Integration

Webhook-based notifications. Routes: `/api/slackWebhooks` (CRUD + `/:id/send` for testing). Integrates with automations via `action_type_id: 2`.

## 27. Entity Graph

Visual entity relationships with annotations, saved views, and gap rules. Routes: `/api/entity-graph/annotations`, `/api/entity-graph/views`, `/api/entity-graph/gap-rules`. Entity types: project, risk, vendor, model, policy, incident, task.

## 28. Automations System

Rule-based automation engine. Routes: `/api/automations` (CRUD), `/api/automations/triggers`, `/api/automations/:id/history`.

Triggers: vendor_review_date, policy_due_date, risk_status_change, model_deployed, task_overdue. Actions: send_email, send_slack_message, create_task, update_status, notify_users.

## 29. In-App Notifications

Real-time via Redis pub/sub + SSE. Routes: `/api/notifications` (GET, mark read, SSE).

Use `sendInAppNotification(tenantId, notifData, sendEmail, emailOpts)` or `sendBulkInAppNotifications` from `services/inAppNotification.service`.

Types: task_assigned, review_requested/approved/rejected, approval_requested/complete, vendor_review_due, policy_due_soon, training_assigned.

## 30. Agent Discovery

AI agent inventory and governance. Routes: `/api/agent-primitives` (CRUD + capabilities/risks). Agent types: conversational, autonomous, assistive, analytical. Deployment statuses: development, testing, staging, production, deprecated, retired.

## 31. Evidence Hub

Compliance evidence repository. Routes: `/api/evidenceHub` (CRUD). Links files to framework requirements and entities. Status: current, outdated, archived.

## 32. CE Marking

EU CE Marking compliance tracking. Routes: `GET/PUT /api/ce-marking/:projectId`.

## 33. Virtual Folders

Hierarchical file organization. Routes: `/api/virtual-folders` (CRUD, `/tree`, `/uncategorized`, `/:id/files`), `/api/files/:id/folders`.

## 34. Global Search

`GET /api/search?q=term&limit=20&offset=0`. Searches across projects, risks, vendors, models, policies, tasks, incidents, files, training.

## 35. Share Links

Secure, time-limited public links. Public: `/api/shares/token/:token`, `/api/shares/view/:token`. Protected: `/api/shares` (CRUD). Resources: report, trust-center, compliance-dashboard.

## 36. GitHub Integration

Private repo scanning for AI Detection. Routes: `/api/integrations/github/token` (GET/POST/DELETE/test). Admin only. PATs encrypted at rest.

## 37. Notes System

Notes on any entity. Routes: `/api/notes` (CRUD), `/api/notes/entity/:entityType/:entityId`. Properties: entity_type, entity_id, content, is_pinned, visibility (team/private), mentions.

## 38. User Preferences

Routes: `/api/user-preferences` (GET/PATCH), `/api/user-preferences/:key` (GET/PUT). Keys: theme, sidebar_collapsed, notifications_email/in_app, dashboard_layout, table_page_size, timezone.

## 39. Invitations

Routes: `/api/invitations` (GET/POST), `/:id` (DELETE), `/:id/resend`, `/accept/:token`. Flow: Admin invites → email → register → accept.

## 40. Auto Drivers

Automated compliance calculation. Routes: `/api/autoDrivers` (CRUD + `/:id/run`). Types: risk_score, compliance_status, control_coverage, evidence_freshness.

## API Prefix Index

| Prefix | Purpose |
|--------|---------|
| `/api/users` | Users |
| `/api/organizations` | Orgs/Settings |
| `/api/roles` | Roles |
| `/api/projects` | Projects/Use Cases |
| `/api/projectRisks` | Project Risks |
| `/api/vendors`, `/api/vendorRisks` | Vendors |
| `/api/modelInventory`, `/api/modelRisks` | Models |
| `/api/datasets` | Datasets |
| `/api/policies` | Policies |
| `/api/tasks` | Tasks |
| `/api/files`, `/api/file-manager` | Files |
| `/api/virtual-folders` | Folders |
| `/api/training` | Training |
| `/api/ai-incident-managements` | Incidents |
| `/api/frameworks` | Framework config |
| `/api/eu-ai-act` | EU AI Act |
| `/api/iso-42001` | ISO 42001 |
| `/api/iso-27001` | ISO 27001 |
| `/api/nist-ai-rmf` | NIST AI RMF |
| `/api/plugins` | Plugins |
| `/api/automations` | Automations |
| `/api/approval-workflows`, `/api/approval-requests` | Approvals |
| `/api/notifications` | Notifications |
| `/api/evidenceHub` | Evidence |
| `/api/reporting` | Reports |
| `/api/dashboard` | Dashboard |
| `/api/ai-detection` | AI Detection |
| `/api/shadow-ai` | Shadow AI |
| `/api/agent-primitives` | Agent Discovery |
| `/api/pmm` | Post-Market Monitoring |
| `/api/aiTrustCentre` | AI Trust Center |
| `/api/ce-marking` | CE Marking |
| `/api/advisor` | AI Advisor |
| `/api/deepeval` | LLM Evals |
| `/api/search` | Search |
| `/api/shares` | Share Links |
| `/api/slackWebhooks` | Slack |
| `/api/integrations/github` | GitHub |
| `/api/llm-keys` | LLM Keys |
| `/api/entity-graph` | Entity Graph |
| `/api/notes` | Notes |
| `/api/logger` | Event Logs |
| `/api/user-preferences` | User Prefs |
| `/api/invitations` | Invitations |
| `/api/subscriptions`, `/api/tiers` | Subscriptions |
| `/api/tokens` | API Tokens |
| `/api/autoDrivers` | Auto Drivers |
| `/api/mail` | Email |
| `/api/compliance` | Compliance |

## 41. Rate Limiting Middleware

| Limiter | Window | Max | Use Case |
|---------|--------|-----|----------|
| `authLimiter` | 15 min | 5 | Login, registration |
| `generalApiLimiter` | 15 min | 100 | Standard API |
| `fileOperationsLimiter` | 15 min | 50 | File ops |
| `aiDetectionScanLimiter` | 60 min | 10 | AI scanning |

Import from `middleware/rateLimit.middleware`.

## 42. Access Control Middleware

Use `authorize(["Admin", "Editor"])` from `middleware/accessControl.middleware`. Common groups: `ALL_ROLES`, `WRITE_ROLES` (Admin, Editor), `ADMIN_ONLY`, `REVIEW_ROLES` (Admin, Reviewer).

## 43. Redis Configuration

`Servers/database/redis.ts`. Used for BullMQ queues, caching, and notifications pub/sub. Default: `redis://localhost:6379/0`.

## 44. Redux State Management

Store: `Clients/src/application/redux/store.ts`. Persisted slices: auth, ui. Auth state: `{ isLoading, authToken, user, userExists, success, message, expirationDate, onboardingStatus, isOrgCreator }`. Actions: `clearAuthState`, `setAuthToken`, `setUserExists`.

## 45. Axios Configuration

`Clients/src/infrastructure/api/customAxios.ts`. Base URL: `{ENV_VARs.URL}/api`. Timeout: 120s. Auto-adds Bearer token. 403 → logout, 406 → refresh token + retry.

## 46. MUI Theming

Files: `Clients/src/presentation/themes/`. Primary: `#13715B`. Font: Geist. Themes: `light`, `singleTheme`. Status colors: success (#17b26a), error (#d32f2f), warning (#fdb022).

## 47-53. Additional APIs

- **Assessments:** `/api/assessments`, `/api/questions` — questionnaire system with topics/subtopics
- **Subscriptions:** `/api/subscriptions`, `/api/tiers/features/:id` — SaaS tier management
- **API Tokens:** `/api/tokens` — programmatic access tokens (hashed, shown once)
- **Dataset Bulk Upload:** `POST /api/dataset-bulk-upload/upload` — CSV/XLSX, max 30MB, requires plugin
- **Compliance Score:** `/api/compliance/score`, `/api/compliance/details/:orgId` — weighted module scores
- **Policy Linked Objects:** `/api/policy-linked/:policyId/linked-objects` — link policies to risks/evidence
- **Dashboard:** `GET /api/dashboard` — aggregated metrics (compliance, risks, vendors, models, tasks)

## 54. JWT Auth Middleware

`Servers/middleware/auth.middleware.ts`. Security: token presence → JWT verify → expiration → payload validation → org membership → role consistency → tenant hash validation.

Sets: `req.userId`, `req.role`, `req.tenantId`, `req.organizationId`. Errors: 400 (no token), 401 (invalid), 403 (wrong org/role), 406 (expired).

## 55. Plugin Guard Middleware

`requirePlugin("plugin-key")` — checks plugin installation before route access. Returns 404 if not installed.

## 56. Request Context (AsyncLocalStorage)

`Servers/utils/context/context.ts`. Stores `{ userId, tenantId, organizationId }` per request. Access: `asyncLocalStorage.getStore()`.

## 57. Docker & Deployment

Services: postgresdb (16.8), redis (7), backend, frontend (Nginx), worker, eval_server. Images: `ghcr.io/bluewave-labs/verifywise-{backend,frontend,eval-server}:latest`.

## 58. CI/CD Workflows

Docker builds on release → Trivy scan → push to GHCR. PR checks: lint, type-check, test for both frontend and backend.

## 59. AI Agent Role Definitions

`agents/` directory with role definitions: technical-lead, senior/mid/junior backend/frontend devs, devops, QA, PM, UX designer. `00-TEAM_WORKFLOW.md` defines coordination.

---

## Quick Reference

### Key Files
| Purpose | Path |
|---------|------|
| Backend entry | `Servers/index.ts` |
| Frontend entry | `Clients/src/main.tsx` |
| Routes (BE) | `Servers/routes/*.ts` |
| Routes (FE) | `Clients/src/application/config/routes.tsx` |
| DB models | `Servers/domain.layer/models/` |
| Shared schema migration | `Servers/scripts/migrateToSharedSchema.ts` |
| Migration config | `Servers/scripts/migrationConfig.ts` |
| Auth middleware | `Servers/middleware/auth.middleware.ts` |
| Axios config | `Clients/src/infrastructure/api/customAxios.ts` |
| Redux store | `Clients/src/application/redux/store.ts` |

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Variables/Functions | camelCase | `getUserData` |
| Components/Classes | PascalCase | `UserProfile` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| DB Tables | snake_case | `user_profiles` |
| API Endpoints | kebab-case | `/api/user-profiles` |
