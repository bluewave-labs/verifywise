# VerifyWise - Comprehensive Development Guide

> **Last Updated:** 2026-02-20
> **Sections:** 59 + Quick Reference API Index

This document is the authoritative reference for all development in the VerifyWise codebase. Follow these patterns and procedures exactly.

---

## Instructions for Claude

**IMPORTANT: Keep this document up to date.**

Whenever you make changes to the codebase that affect:
- New features, routes, or APIs
- New middleware or services
- Database schema changes or migrations
- New patterns or conventions
- Configuration changes
- New integrations or plugins

You MUST update this CLAUDE.md file to reflect those changes. This includes:
1. Adding new sections for significant features
2. Updating existing sections when behavior changes
3. Updating the Table of Contents if sections are added
4. Updating the "Last Updated" date at the top
5. Updating the section count in the header

This document should always accurately represent the current state of the codebase.

---

## Table of Contents

### Foundation
1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Multi-Tenancy](#3-multi-tenancy)
4. [Database & Migrations](#4-database--migrations)

### Development
5. [Backend Development](#5-backend-development)
6. [Frontend Development](#6-frontend-development)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Plugin System](#8-plugin-system)
9. [Features Reference](#9-features-reference)
10. [Development Workflow](#10-development-workflow)
11. [Testing](#11-testing)
12. [Environment Configuration](#12-environment-configuration)

### Backend Systems
13. [Background Jobs (BullMQ)](#13-background-jobs-bullmq)
14. [Email Templates (MJML)](#14-email-templates-mjml)
15. [PDF/DOCX Reporting](#15-pdfdocx-reporting)
16. [Change History Tracking](#16-change-history-tracking)
17. [File Upload System](#17-file-upload-system)
18. [Approval Workflows](#18-approval-workflows)
19. [Error Handling](#19-error-handling)
20. [Logging System](#20-logging-system)

### AI & Advanced Features
21. [LLM Evals (EvalServer)](#21-llm-evals-evalserver)
22. [AI Advisor](#22-ai-advisor)
23. [Shadow AI Detection](#23-shadow-ai-detection)
24. [AI Detection Module](#24-ai-detection-module)
25. [Post-Market Monitoring](#25-post-market-monitoring-pmm)
26. [Slack Integration](#26-slack-integration)
27. [Entity Graph](#27-entity-graph)
28. [Automations System](#28-automations-system)
29. [In-App Notifications](#29-in-app-notifications)
30. [Agent Discovery](#30-agent-discovery)

### Additional Features
31. [Evidence Hub](#31-evidence-hub)
32. [CE Marking](#32-ce-marking)
33. [Virtual Folders](#33-virtual-folders)
34. [Global Search](#34-global-search-wise-search)
35. [Share Links](#35-share-links)
36. [GitHub Integration](#36-github-integration)
37. [Notes System](#37-notes-system)
38. [User Preferences](#38-user-preferences)
39. [Invitations](#39-invitations)
40. [Auto Drivers](#40-auto-drivers)

[Quick Reference: API Prefix Index](#quick-reference-api-prefix-index)

### Infrastructure & Middleware
41. [Rate Limiting Middleware](#41-rate-limiting-middleware)
42. [Access Control Middleware](#42-access-control-middleware)
43. [Redis Configuration](#43-redis-configuration)

### Frontend Architecture
44. [Redux State Management](#44-redux-state-management)
45. [Axios Configuration](#45-axios-configuration)
46. [MUI Theming](#46-mui-theming)

### Additional APIs
47. [Assessments & Questions](#47-assessments--questions)
48. [Subscriptions & Tiers](#48-subscriptions--tiers)
49. [API Tokens](#49-api-tokens)
50. [Dataset Bulk Upload](#50-dataset-bulk-upload)
51. [Compliance Score](#51-compliance-score)
52. [Policy Linked Objects](#52-policy-linked-objects)
53. [Dashboard Data](#53-dashboard-data)

### Deployment & DevOps
54. [JWT Auth Middleware](#54-jwt-auth-middleware)
55. [Plugin Guard Middleware](#55-plugin-guard-middleware)
56. [Request Context (AsyncLocalStorage)](#56-request-context-asynclocalstorage)
57. [Docker & Deployment](#57-docker--deployment)
58. [CI/CD Workflows](#58-cicd-workflows)
59. [AI Agent Role Definitions](#59-ai-agent-role-definitions)

---

## 1. Project Overview

VerifyWise is an AI governance platform for compliance management supporting:
- **EU AI Act** - European Union AI regulation
- **ISO 42001** - AI Management System standard
- **ISO 27001** - Information Security Management
- **NIST AI RMF** - AI Risk Management Framework
- **Plugin frameworks** - SOC 2, GDPR, HIPAA, etc.

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
│   ├── controllers/            # Request handlers (69 files)
│   ├── routes/                 # API endpoints (67 files)
│   ├── services/               # Business logic services
│   ├── utils/                  # Database queries (repository pattern)
│   ├── domain.layer/           # Models, interfaces, frameworks
│   ├── middleware/             # Auth, rate limiting, multi-tenancy
│   ├── database/               # DB config, migrations
│   ├── templates/              # Email (MJML) & PDF (EJS) templates
│   └── jobs/                   # BullMQ workers
├── EvalServer/                 # Python LLM evaluation service
├── EvaluationModule/           # AI evaluation components
├── GRSModule/                  # Governance, Risk, Security module
├── agents/                     # AI agent configurations
└── docs/                       # Documentation
```

---

## 2. Architecture

### Frontend Clean Architecture

```
presentation/     → UI components, pages (what user sees)
     ↓
application/      → Business logic, hooks, redux, contexts
     ↓
domain/           → Types, interfaces, enums (core entities)
     ↓
infrastructure/   → API clients, external services
```

### Backend Layered Architecture

```
routes/           → HTTP endpoint definitions
     ↓
controllers/      → Request handling, validation
     ↓
services/         → Complex business logic
     ↓
utils/            → Database queries (Sequelize)
     ↓
domain.layer/     → Models, interfaces, exceptions
```

### Request Flow

```
Browser → React Component → Redux/React Query → Axios
    ↓
Express Router → Middleware Chain → Controller → Service → Utils → PostgreSQL
    ↓
Response back through chain
```

---

## 3. Multi-Tenancy

### Overview

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
// In controllers/services, tenant context is available via:
const tenantId = req.tenantId;  // From auth middleware
const organizationId = req.organizationId;

// In database queries:
const query = `SELECT * FROM "${tenantId}".projects WHERE id = :id`;
```

---

## 4. Database & Migrations

### Creating Migrations

**CRITICAL: Always generate timestamp with `date` command**

```bash
# Step 1: Generate timestamp
date +%Y%m%d%H%M%S
# Example output: 20260220143500

# Step 2: Create migration file
cd Servers
npx sequelize migration:create --name my-migration-name
# Creates: database/migrations/YYYYMMDDHHMMSS-my-migration-name.js
```

### Migration Patterns

#### A. Migrations Affecting ALL TENANTS (tenant schemas)

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Get all organizations
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      // 2. Import getTenantHash (MUST use dist path)
      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      // 3. Loop over all tenants
      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        // Your schema changes here
        await queryInterface.sequelize.query(`
          ALTER TABLE "${tenantHash}".my_table
          ADD COLUMN new_column VARCHAR(255);
        `, { transaction });

        console.log(`Updated schema for tenant ${tenantHash}`);
      }

      // 4. ALWAYS commit the transaction
      await transaction.commit();
      console.log('Migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const [organizations] = await queryInterface.sequelize.query(
        `SELECT id FROM organizations;`,
        { transaction }
      );

      const { getTenantHash } = require("../../dist/tools/getTenantHash");

      for (const organization of organizations) {
        const tenantHash = getTenantHash(organization.id);

        // Revert changes
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

#### B. Migrations Affecting PUBLIC Schema Only

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // No need to loop tenants - just modify public schema
    await queryInterface.addColumn('users', 'new_field', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'new_field');
  }
};
```

### Updating createNewTenant.ts

**CRITICAL: After creating tenant-affecting migrations, update the tenant creation script**

File: `Servers/scripts/createNewTenant.ts`

This file creates schemas for NEW organizations. You MUST add your table/column changes here too, or new tenants won't have them.

```typescript
// Add your new table/column in createNewTenant.ts
await sequelize.query(`
  CREATE TABLE IF NOT EXISTS "${tenantHash}".my_new_table (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
`, { transaction });
```

### Running Migrations

```bash
cd Servers

# Build TypeScript first (migrations use dist/)
npm run build

# Run migrations
npx sequelize db:migrate

# Rollback last migration
npx sequelize db:migrate:undo

# Rollback all migrations
npx sequelize db:migrate:undo:all
```

---

## 5. Backend Development

### Controller Pattern

File: `Servers/controllers/{entity}.ctrl.ts`

```typescript
import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { logProcessing, logSuccess, logFailure } from "../utils/logger/logHelper";

export async function getEntity(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting getEntity",
    functionName: "getEntity",
    fileName: "entity.ctrl.ts",
    userId: req.userId!,
    tenantId: req.tenantId!,
  });

  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    // Validate input
    if (!id) {
      return res.status(400).json(STATUS_CODE[400]({ message: "ID required" }));
    }

    // Call utils (database queries)
    const entity = await getEntityByIdQuery(id, tenantId);

    if (!entity) {
      return res.status(404).json(STATUS_CODE[404]({ message: "Not found" }));
    }

    await logSuccess({
      eventType: "Read",
      description: "Retrieved entity",
      functionName: "getEntity",
      fileName: "entity.ctrl.ts",
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(200).json(STATUS_CODE[200](entity));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve entity",
      functionName: "getEntity",
      fileName: "entity.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
```

### Route Pattern

File: `Servers/routes/{entity}.route.ts`

```typescript
import express from "express";
import authenticateJWT from "../middleware/auth.middleware";
import {
  getEntity,
  createEntity,
  updateEntity,
  deleteEntity,
} from "../controllers/entity.ctrl";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateJWT);

// Define routes
router.get("/", getAllEntities);
router.get("/:id", getEntity);
router.post("/", createEntity);
router.patch("/:id", updateEntity);
router.delete("/:id", deleteEntity);

export default router;
```

**Don't forget to register the route in `Servers/index.ts`:**

```typescript
import entityRoutes from "./routes/entity.route";
// ...
app.use("/api/entities", entityRoutes);
```

### Utils (Database Queries) Pattern

File: `Servers/utils/{entity}.utils.ts`

```typescript
import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";

export async function getEntityByIdQuery(
  id: string | number,
  tenantId: string
): Promise<EntityType | null> {
  const [entities] = await sequelize.query(
    `SELECT * FROM "${tenantId}".entities WHERE id = :id`,
    {
      replacements: { id },
      type: QueryTypes.SELECT,
    }
  );
  return entities[0] || null;
}

export async function createEntityQuery(
  data: CreateEntityDto,
  tenantId: string
): Promise<EntityType> {
  const [result] = await sequelize.query(
    `INSERT INTO "${tenantId}".entities (name, description, created_at)
     VALUES (:name, :description, NOW())
     RETURNING *`,
    {
      replacements: { name: data.name, description: data.description },
      type: QueryTypes.INSERT,
    }
  );
  return result[0];
}
```

### Domain Layer Models

File: `Servers/domain.layer/models/{entity}/{entity}.model.ts`

```typescript
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";

@Table({ tableName: "entities", timestamps: false })
export class EntityModel extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false })
  name!: string;

  @Column({ type: DataType.TEXT })
  description?: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  created_at!: Date;

  @ForeignKey(() => UserModel)
  @Column({ type: DataType.INTEGER })
  created_by?: number;

  @BelongsTo(() => UserModel, "created_by")
  creator?: UserModel;
}
```

---

## 6. Frontend Development

### Component Pattern

File: `Clients/src/presentation/components/{ComponentName}/index.tsx`

```tsx
// 1. External imports
import { useState, useCallback } from 'react';
import { Box, Typography, Button } from '@mui/material';

// 2. Internal imports
import { useEntity } from '@/application/hooks/useEntity';
import type { EntityProps } from './types';

// 3. Interface (if not in separate file)
interface Props {
  entityId: string;
  onUpdate?: (entity: Entity) => void;
}

// 4. Component
export function EntityCard({ entityId, onUpdate }: Props) {
  // Hooks first
  const { entity, isLoading, refetch } = useEntity(entityId);
  const [isEditing, setIsEditing] = useState(false);

  // Handlers
  const handleSave = useCallback(async () => {
    // implementation
    await refetch();
    onUpdate?.(entity);
  }, [entity, onUpdate, refetch]);

  // Early returns
  if (isLoading) return <Skeleton />;
  if (!entity) return null;

  // Main render
  return (
    <Box>
      <Typography variant="h6">{entity.name}</Typography>
      <Button onClick={handleSave}>Save</Button>
    </Box>
  );
}
```

### Page Pattern

File: `Clients/src/presentation/pages/{PageName}/index.tsx`

```tsx
import { Box, Container } from "@mui/material";
import PageTitle from "@/presentation/components/PageTitle";
import { usePageData } from "./hooks/usePageData";

export default function MyPage() {
  const { data, isLoading, error } = usePageData();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <Container>
      <PageTitle title="My Page" />
      <Box>
        {/* Page content */}
      </Box>
    </Container>
  );
}
```

### Repository Pattern

File: `Clients/src/application/repository/{entity}.repository.ts`

```typescript
import CustomAxios from "@/infrastructure/api/customAxios";
import { Entity, CreateEntityDto, UpdateEntityDto } from "@/domain/types/entity";

const BASE_URL = "/entities";

export const entityRepository = {
  async getAll(): Promise<Entity[]> {
    const response = await CustomAxios.get(BASE_URL);
    return response.data.data;
  },

  async getById(id: string): Promise<Entity> {
    const response = await CustomAxios.get(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  async create(data: CreateEntityDto): Promise<Entity> {
    const response = await CustomAxios.post(BASE_URL, data);
    return response.data.data;
  },

  async update(id: string, data: UpdateEntityDto): Promise<Entity> {
    const response = await CustomAxios.patch(`${BASE_URL}/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await CustomAxios.delete(`${BASE_URL}/${id}`);
  },
};
```

### Custom Hook Pattern

File: `Clients/src/application/hooks/useEntity.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { entityRepository } from "@/application/repository/entity.repository";

export function useEntity(id: string) {
  return useQuery({
    queryKey: ["entity", id],
    queryFn: () => entityRepository.getById(id),
    enabled: !!id,
  });
}

export function useEntities() {
  return useQuery({
    queryKey: ["entities"],
    queryFn: entityRepository.getAll,
  });
}

export function useCreateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: entityRepository.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });
}
```

### Adding a New Route

File: `Clients/src/application/config/routes.tsx`

```tsx
import MyNewPage from "../../presentation/pages/MyNewPage";

export const createRoutes = (triggerSidebar: boolean, _triggerSidebarReload: () => void) => [
  // ... existing routes
  <Route
    key="dashboard"
    path="/"
    element={<ProtectedRoute Component={Dashboard} reloadTrigger={triggerSidebar} />}
  >
    {/* Add your new route inside dashboard */}
    <Route path="/my-new-page" element={<MyNewPage />} />
  </Route>,
];
```

---

## 7. Authentication & Authorization

### JWT Token Structure

```typescript
interface TokenPayload {
  id: number;              // User ID
  email: string;
  name: string;
  surname: string;
  organizationId: number;  // Organization ID
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

### Protected Routes (Frontend)

```tsx
import { useSelector } from "react-redux";

function MyComponent() {
  const { authToken, role } = useSelector((state) => state.auth);

  // Check if admin
  if (role !== "Admin") {
    return <AccessDenied />;
  }

  return <AdminContent />;
}
```

### Protected Routes (Backend)

```typescript
import authenticateJWT from "../middleware/auth.middleware";

// Apply to all routes in a router
router.use(authenticateJWT);

// Or apply to specific routes
router.get("/", authenticateJWT, getAll);
```

---

## 8. Plugin System

### Overview

Plugins extend VerifyWise functionality:
- **Integration plugins**: Slack, MLflow, Azure AI
- **Data plugins**: Risk Import
- **Framework plugins**: SOC 2, GDPR, HIPAA (compliance frameworks)

### Frontend: Using PluginSlot

```tsx
import { PluginSlot } from "@/presentation/components/PluginSlot";

// Render plugin UI at a designated slot
<PluginSlot
  slotId="page.controls.custom-framework"
  project={project}
  apiServices={apiServices}
/>
```

### Available Slot IDs

| Slot ID | Location |
|---------|----------|
| `page.risks.actions` | Risk Management - "Insert From" menu |
| `page.models.tabs` | Model Inventory - Additional tabs |
| `page.plugin.config` | Plugin Management - Configuration UI |
| `page.controls.custom-framework` | Org Controls - Framework controls |
| `page.project-controls.custom-framework` | Project Controls - Framework controls |
| `modal.framework.selection` | Add Framework Modal - Framework cards |

### Backend: Plugin Routes

```typescript
// Plugin routes are forwarded via:
// /api/plugins/:key/* → Plugin router

// In plugin's index.ts:
export const router = express.Router();

router.get('/level2', getLevel2Items);
router.post('/level2', createLevel2Item);
router.post('/level2/:id/files', linkFileToLevel2Item);
router.delete('/level2/:id/files/:fileId', unlinkFileFromLevel2Item);
```

### File Linking for Plugins

Use `file_entity_links` table for proper file associations:

```typescript
// Backend: Link file to plugin entity
await sequelize.query(`
  INSERT INTO "${tenantId}".file_entity_links
  (file_id, framework_type, entity_type, entity_id, project_id, created_by)
  VALUES (:fileId, :pluginKey, 'level2', :entityId, :projectId, :userId)
`, { replacements: { fileId, pluginKey, entityId, projectId, userId } });
```

---

## 9. Features Reference

### Core Features

| Feature | Backend Routes | Frontend Pages |
|---------|---------------|----------------|
| **Dashboard** | `/api/dashboard` | `/` (IntegratedDashboard) |
| **Projects/Use Cases** | `/api/projects` | `/project-view` |
| **Risk Management** | `/api/projectRisks` | `/risk-management` |
| **Vendors** | `/api/vendors`, `/api/vendorRisks` | `/vendors` |
| **Model Inventory** | `/api/modelInventory`, `/api/modelRisks` | `/model-inventory` |
| **Datasets** | `/api/datasets` | `/datasets` |
| **Policies** | `/api/policies` | `/policies` |
| **Tasks** | `/api/tasks` | `/tasks` |
| **Automations** | `/api/automations` | `/automations` |
| **Incidents** | `/api/ai-incident-managements` | `/ai-incident-managements` |
| **File Manager** | `/api/files`, `/api/file-manager` | `/file-manager` |
| **Reporting** | `/api/reporting` | `/reporting` |
| **Training Registry** | `/api/training` | `/training` |
| **AI Trust Center** | `/api/aiTrustCentre` | `/ai-trust-center` |
| **Plugins** | `/api/plugins` | `/plugins` |
| **Settings** | `/api/organizations` | `/settings` |

### Compliance Frameworks

| Framework | Backend Routes | Notes |
|-----------|---------------|-------|
| EU AI Act | `/api/eu-ai-act` | Built-in |
| ISO 42001 | `/api/iso-42001` | Built-in |
| ISO 27001 | `/api/iso-27001` | Built-in |
| NIST AI RMF | `/api/nist-ai-rmf` | Built-in |
| Plugin frameworks | `/api/plugins/:key` | SOC 2, GDPR, etc. |

### Special Features

| Feature | Backend Routes | Frontend Pages |
|---------|---------------|----------------|
| **LLM Evals** | `/api/deepeval` (proxied to EvalServer) | `/evals` |
| **AI Detection** | `/api/ai-detection` | `/ai-detection` |
| **Shadow AI** | `/api/shadow-ai` | `/shadow-ai` |
| **Agent Discovery** | `/api/agent-primitives` | `/agent-discovery` |
| **Approval Workflows** | `/api/approval-workflows`, `/api/approval-requests` | `/approval-workflows` |
| **Post-Market Monitoring** | `/api/pmm` | `/monitoring` |
| **CE Marking** | `/api/ce-marking` | - |
| **Entity Graph** | `/api/entity-graph` | - |
| **AI Advisor** | `/api/advisor` | - |

---

## 10. Development Workflow

### Starting Development

```bash
# Terminal 1: Backend
cd Servers
npm install
npm run watch    # Compiles TypeScript + starts server with nodemon

# Terminal 2: Frontend
cd Clients
npm install
npm run dev      # Starts Vite dev server

# Terminal 3 (optional): EvalServer
cd EvalServer
source venv/bin/activate
cd src && python app.py

# Terminal 4 (optional): BullMQ Worker
cd Servers
npm run worker
```

### Build for Production

```bash
# Backend
cd Servers
npm run build    # Compiles to /dist

# Frontend
cd Clients
npm run build    # Builds to /dist
```

### Git Workflow

```bash
# Branch naming
feature/description-of-feature
fix/description-of-fix
docs/description-of-docs

# Commit format
type(scope): description

# Types: feat, fix, docs, style, refactor, test, chore
# Examples:
feat(auth): add password reset functionality
fix(dashboard): resolve chart rendering issue
docs(api): update endpoint documentation
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

## 11. Testing

### Test Coverage Target

- **Minimum**: 80% coverage

### Frontend Testing (Vitest)

```bash
cd Clients
npm run test           # Run tests
npm run test:coverage  # With coverage
```

### Backend Testing (Jest)

```bash
cd Servers
npm run test           # Run tests
npm run test:coverage  # With coverage
```

### Test Naming Convention

```typescript
describe('ComponentName', () => {
  it('should do X when Y', () => {
    // test
  });
});
```

---

## 12. Environment Configuration

### Backend (.env)

```env
# Server
PORT=3000
NODE_ENV=development
HOST=localhost

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=verifywise
DB_USER=postgres
DB_PASSWORD=****

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication
JWT_SECRET=****
REFRESH_TOKEN_SECRET=****

# Multi-tenancy
MULTI_TENANCY_ENABLED=false

# Encryption
ENCRYPTION_KEY=****

# Email
EMAIL_PROVIDER=resend
RESEND_API_KEY=****

# Integrations
SLACK_BOT_TOKEN=****
OPENAI_API_KEY=****
```

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

### Common Commands

```bash
# Migrations
cd Servers
date +%Y%m%d%H%M%S                              # Get timestamp
npx sequelize migration:create --name name       # Create migration
npm run build && npx sequelize db:migrate        # Run migrations

# Development
cd Servers && npm run watch                      # Start backend
cd Clients && npm run dev                        # Start frontend

# Build
cd Servers && npm run build                      # Build backend
cd Clients && npm run build                      # Build frontend
```

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
| UI Text | Sentence case | `Add new risk`, `Risk management` |
| Table Column Headers | UPPERCASE | `RISK NAME`, `STATUS`, `DUE DATE` |

---

## 13. Background Jobs (BullMQ)

### Overview

VerifyWise uses BullMQ with Redis for background job processing. Jobs handle scheduled tasks, notifications, and async operations.

### Architecture

```
Servers/jobs/
├── producer.ts      # Schedules all jobs on server start
└── worker.ts        # Processes jobs from queues

Servers/services/automations/
├── automationProducer.ts  # Queue & job scheduling
└── automationWorker.ts    # Job handlers
```

### Adding a New Scheduled Job

**Step 1: Add job to producer**

File: `Servers/services/automations/automationProducer.ts`

```typescript
import { Queue } from "bullmq";
import { REDIS_URL } from "../../database/redis";

export const automationQueue = new Queue("automation-actions", {
  connection: { url: REDIS_URL }
});

// Add your scheduled job
export async function scheduleMyNewJob() {
  logger.info("Adding my new job to the queue...");
  await automationQueue.add(
    "my_new_job",           // Job name
    { type: "my_job_type" }, // Job data
    {
      repeat: {
        pattern: "0 8 * * *", // Cron pattern: 8 AM daily
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
}
```

**Step 2: Register in producer.ts**

File: `Servers/jobs/producer.ts`

```typescript
import { scheduleMyNewJob } from "../services/automations/automationProducer";

export async function addAllJobs(): Promise<void> {
  // ... existing jobs
  await scheduleMyNewJob();
}
```

**Step 3: Add handler in worker**

File: `Servers/services/automations/automationWorker.ts`

```typescript
export const createAutomationWorker = () => {
  const automationWorker = new Worker(
    "automation-actions",
    async (job: Job) => {
      const name = job.name;

      if (name === "my_new_job") {
        await processMyNewJob(job.data);
      }
      // ... other handlers
    },
    { connection: { url: REDIS_URL }, concurrency: 10 }
  );
  return automationWorker;
};

async function processMyNewJob(data: any) {
  // Your job logic here
  const organizations = await getAllOrganizationsQuery();
  for (const org of organizations) {
    const tenantHash = getTenantHash(org.id!);
    // Process for each tenant
  }
}
```

### Common Cron Patterns

| Pattern | Description |
|---------|-------------|
| `0 0 * * *` | Daily at midnight |
| `0 8 * * *` | Daily at 8 AM |
| `0 * * * *` | Every hour |
| `0 */6 * * *` | Every 6 hours |
| `0 1 1 * *` | 1st of month at 1 AM |
| `30 1 * * *` | Daily at 1:30 AM |

### Running Workers

```bash
cd Servers
npm run worker  # Starts BullMQ workers
```

---

## 14. Email Templates (MJML)

### Overview

Email templates use MJML (Mailjet Markup Language) for responsive HTML emails.

### Template Location

```
Servers/templates/
├── account-creation-email.mjml
├── password-reset-email.mjml
├── approval-requested.mjml
├── approval-complete.mjml
├── vendor-review-due.mjml
├── policy-due-soon.mjml
├── pmm-initial-notification.mjml
├── task-assigned.mjml
└── ... (25+ templates)
```

### Template Syntax

```mjml
<!-- Variables: {{variableName}} -->
<mjml>
  <mj-head>
    <mj-font name="Roboto" href="https://fonts.googleapis.com/css?family=Roboto:300,500"></mj-font>
    <mj-attributes>
      <mj-all font-family="Roboto, Helvetica, sans-serif"></mj-all>
      <mj-text font-weight="300" font-size="14px" color="#616161" line-height="24px"></mj-text>
    </mj-attributes>
  </mj-head>
  <mj-body>
    <mj-section>
      <mj-column width="100%">
        <mj-text>
          <p>Hello {{name}}!</p>
          <p>Your action is required: <a href="{{link}}">Click here</a></p>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
```

### Using Templates in Code

```typescript
import { compileMjmlToHtml } from "../tools/mjmlCompiler";
import { readFileSync } from "fs";
import { join } from "path";

// Read template
const templatePath = join(__dirname, "../templates", "my-template.mjml");
const mjmlTemplate = readFileSync(templatePath, "utf-8");

// Compile with data
const htmlBody = compileMjmlToHtml(mjmlTemplate, {
  name: "John Doe",
  link: "https://app.verifywise.ai/action",
  // ... other variables
});

// Send email
await sendEmail({
  to: ["user@example.com"],
  subject: "Action Required",
  body: htmlBody,
});
```

### MJML Compiler

File: `Servers/tools/mjmlCompiler.ts`

```typescript
import mjml2html from "mjml";

export const compileMjmlToHtml = (
  mjmlTemplate: string,
  data: Record<string, string>
): string => {
  // Replace {{placeholders}} with actual data
  let compiledTemplate = mjmlTemplate;
  Object.keys(data).forEach((key) => {
    compiledTemplate = compiledTemplate.replace(
      new RegExp(`{{${key}}}`, "g"),
      data[key]
    );
  });

  // Convert MJML to HTML
  const { html } = mjml2html(compiledTemplate);
  return html;
};
```

---

## 15. PDF/DOCX Reporting

### Overview

Reports are generated using EJS templates and converted to PDF (Playwright) or DOCX.

### Template Location

```
Servers/templates/reports/
├── report-pdf.ejs      # PDF template
├── report-docx.ejs     # DOCX template
├── pmm-report.ejs      # Post-market monitoring
└── styles/             # CSS for reports
```

### Report Generation Flow

```typescript
import { generateReport } from "../services/reporting";

// Generate report
const result = await generateReport(
  {
    projectId: 123,
    frameworkId: 1,
    projectFrameworkId: 456,
    reportType: "projectRisks",  // or "all", "vendors", "compliance", etc.
    format: "docx",             // or "pdf"
    branding: {
      organizationName: "My Company",
    },
  },
  userId,
  tenantId
);

if (result.success) {
  // result.content - Buffer containing the file
  // result.filename - Generated filename
  // result.mimeType - MIME type
}
```

### Available Report Sections

| Section Key | Description |
|-------------|-------------|
| `projectRisks` | Use case/project risks |
| `vendorRisks` | Vendor risk analysis |
| `modelRisks` | Model risk inventory |
| `compliance` | Compliance status |
| `assessment` | Assessment answers |
| `clausesAndAnnexes` | ISO clauses/annexes |
| `nistSubcategories` | NIST AI RMF |
| `vendors` | Vendor list |
| `models` | Model inventory |
| `trainingRegistry` | Training records |
| `policyManager` | Policies |
| `incidentManagement` | Incidents |
| `all` | All sections |

---

## 16. Change History Tracking

### Overview

All major entities track changes automatically using a generic change history system.

### Supported Entities

- `vendor` - Vendors
- `vendor_risk` - Vendor risks
- `project_risk` - Use case/project risks
- `policy` - Policies
- `incident` - Incidents
- `use_case` - Use cases/projects
- `model_inventory` - Model inventory
- `file` - Files
- `dataset` - Datasets

### Recording Changes

```typescript
import {
  recordEntityCreation,
  trackEntityChanges,
  recordMultipleFieldChanges,
  recordEntityDeletion,
} from "../utils/changeHistory.base.utils";

// On entity creation
await recordEntityCreation(
  "vendor",           // Entity type
  vendorId,           // Entity ID
  userId,             // User making change
  tenantId,           // Tenant
  vendorData,         // Initial data
  transaction         // Optional transaction
);

// On entity update - track changes automatically
const changes = await trackEntityChanges("vendor", oldData, newData);
if (changes.length > 0) {
  await recordMultipleFieldChanges(
    "vendor",
    vendorId,
    userId,
    tenantId,
    changes,
    transaction
  );
}

// On entity deletion
await recordEntityDeletion("vendor", vendorId, userId, tenantId, transaction);
```

### Getting Change History

```typescript
import { getEntityChangeHistory } from "../utils/changeHistory.base.utils";

const { data, hasMore, total } = await getEntityChangeHistory(
  "vendor",     // Entity type
  vendorId,     // Entity ID
  tenantId,     // Tenant
  100,          // Limit
  0             // Offset
);
```

### Adding Change History to New Entity

1. Create change history table in migration
2. Add config in `Servers/config/changeHistory.config.ts`
3. Use base utils in your controller/service

---

## 17. File Upload System

### Backend File Upload

```typescript
import { uploadFile, deleteFileById, getFileById } from "../utils/fileUpload.utils";
import { FileSource } from "../domain.layer/models/file/file.model";

// Upload file
const uploadedFile = await uploadFile(
  {
    originalname: "document.pdf",
    buffer: fileBuffer,
    mimetype: "application/pdf",
    size: fileBuffer.length,
  },
  userId,
  projectId,           // null for org-level files
  FileSource.MANUAL,   // or REPORTING, POLICY, etc.
  tenantId,
  transaction,
  {
    org_id: organizationId,  // Optional
    model_id: modelId,       // Optional
    file_path: "custom/path", // Optional
  }
);

// Get file
const file = await getFileById(fileId, tenantId);

// Delete file
await deleteFileById(fileId, tenantId, transaction);
```

### File Sources (Enum)

```typescript
enum FileSource {
  MANUAL = "Manual",
  REPORTING = "Reporting",
  POLICY = "Policy",
  VENDOR = "Vendor",
  MODEL = "Model",
  // ... etc
}
```

### File Entity Links (Generic Linking)

For linking files to any entity (frameworks, plugins, etc.):

```typescript
// Link file to entity
await sequelize.query(`
  INSERT INTO "${tenantId}".file_entity_links
  (file_id, framework_type, entity_type, entity_id, project_id, created_by)
  VALUES (:fileId, :frameworkType, :entityType, :entityId, :projectId, :userId)
`, {
  replacements: {
    fileId,
    frameworkType: "eu-ai-act",  // or plugin key like "nyc-local-law-144"
    entityType: "control",        // or "level2", "assessment", etc.
    entityId,
    projectId,
    userId,
  },
  transaction
});

// Get files for entity
const files = await sequelize.query(`
  SELECT f.* FROM "${tenantId}".files f
  INNER JOIN "${tenantId}".file_entity_links fel ON f.id = fel.file_id
  WHERE fel.framework_type = :frameworkType
    AND fel.entity_type = :entityType
    AND fel.entity_id = :entityId
`, { replacements: { frameworkType, entityType, entityId } });
```

---

## 18. Approval Workflows

### Overview

Approval workflows allow multi-step approval processes for entities like use cases and files.

### Workflow Structure

```
ApprovalWorkflow
  └── ApprovalWorkflowStep (ordered steps)
        └── ApprovalStepApprovers (users who can approve)

ApprovalRequest (instance of workflow)
  └── ApprovalRequestStep (step instances)
        └── ApprovalRequestStepApproval (individual approvals)
```

### Creating a Workflow

```typescript
import { createApprovalWorkflowQuery } from "../utils/approvalWorkflow.utils";

const workflow = await createApprovalWorkflowQuery(
  {
    workflow_title: "Use Case Approval",
    entity_type: "use_case",  // or "file"
    description: "Two-step approval for AI use cases",
    created_by: userId,
    steps: [
      {
        step_name: "Manager Review",
        description: "Initial review by manager",
        approver_ids: [managerId1, managerId2],
        requires_all_approvers: false,  // Any one can approve
      },
      {
        step_name: "Compliance Review",
        description: "Final compliance sign-off",
        approver_ids: [complianceOfficerId],
        requires_all_approvers: true,   // All must approve
      },
    ],
  },
  tenantId,
  transaction
);
```

### Creating an Approval Request

```typescript
import { createApprovalRequestQuery } from "../utils/approvalRequest.utils";

const request = await createApprovalRequestQuery(
  {
    request_name: "Approve Use Case: AI Chatbot",
    workflow_id: workflowId,
    entity_id: projectId,
    entity_type: "use_case",
    requested_by: userId,
  },
  tenantId,
  transaction
);
```

### Approval Actions

```typescript
import {
  approveStepQuery,
  rejectStepQuery,
  withdrawApprovalRequestQuery,
} from "../utils/approvalRequest.utils";

// Approve current step
await approveStepQuery(requestId, userId, "Looks good!", tenantId, transaction);

// Reject
await rejectStepQuery(requestId, userId, "Needs more detail", tenantId, transaction);

// Withdraw request
await withdrawApprovalRequestQuery(requestId, tenantId, transaction);
```

---

## 19. Error Handling

### Custom Exceptions

File: `Servers/domain.layer/exceptions/custom.exception.ts`

```typescript
import {
  ValidationException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BusinessLogicException,
  DatabaseException,
  ExternalServiceException,
} from "../domain.layer/exceptions/custom.exception";

// Validation error (400)
throw new ValidationException("Invalid email format", "email", invalidValue);

// Not found (404)
throw new NotFoundException("Project not found", "project", projectId);

// Unauthorized (401)
throw new UnauthorizedException("Invalid token");

// Forbidden (403)
throw new ForbiddenException("Access denied", "project", "delete");

// Conflict (409)
throw new ConflictException("Email already exists", "user", "email");

// Business logic (422)
throw new BusinessLogicException(
  "Cannot delete project with active risks",
  "project_deletion",
  { riskCount: 5 }
);

// Database error (500)
throw new DatabaseException("Connection failed", "SELECT", "projects");

// External service (502)
throw new ExternalServiceException("Slack API error", "slack", "/api/chat.postMessage");
```

### Using in Controllers

```typescript
export async function getProject(req: Request, res: Response) {
  try {
    const project = await getProjectByIdQuery(id, tenantId);

    if (!project) {
      throw new NotFoundException("Project not found", "project", id);
    }

    return res.status(200).json(STATUS_CODE[200](project));
  } catch (error) {
    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400]({ message: error.message }));
    }
    if (error instanceof NotFoundException) {
      return res.status(404).json(STATUS_CODE[404]({ message: error.message }));
    }
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
```

---

## 20. Logging System

### Log Helper Usage

```typescript
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../utils/logger/logHelper";

export async function myFunction(req: Request, res: Response) {
  // Log start of operation
  logProcessing({
    description: "Starting myFunction",
    functionName: "myFunction",
    fileName: "myController.ctrl.ts",
    userId: req.userId!,
    tenantId: req.tenantId!,
  });

  try {
    // ... operation logic

    // Log success (also writes to event_logs table for non-Read operations)
    await logSuccess({
      eventType: "Create",  // "Create" | "Read" | "Update" | "Delete"
      description: "Created new entity",
      functionName: "myFunction",
      fileName: "myController.ctrl.ts",
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(200).json(result);
  } catch (error) {
    // Log failure
    await logFailure({
      eventType: "Create",
      description: "Failed to create entity",
      functionName: "myFunction",
      fileName: "myController.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
```

### Log Levels

| Level | Usage |
|-------|-------|
| `debug` | Detailed debugging (dev only) |
| `info` | General operational info |
| `warn` | Warnings (not errors) |
| `error` | Errors that need attention |

### Log Files

Logs are written to tenant-specific directories:
```
Servers/logs/
├── default/
│   └── app-2026-02-20.log
├── a1b2c3d4e5/  # Tenant-specific
│   └── app-2026-02-20.log
└── x9y8z7w6v5/
    └── app-2026-02-20.log
```

### Direct Logger Usage

```typescript
import logger from "../utils/logger/fileLogger";

logger.debug("Detailed debug info");
logger.info("General info");
logger.warn("Warning message");
logger.error("Error occurred", error);
```

---

## 21. LLM Evals (EvalServer)

### Overview

The EvalServer is a Python FastAPI service for evaluating LLM responses using DeepEval and custom metrics.

### Architecture

```
EvalServer/
├── src/
│   ├── app.py                  # FastAPI entry point
│   ├── routers/
│   │   ├── deepeval.py         # Main evaluation routes
│   │   ├── deepeval_projects.py # Project management
│   │   ├── deepeval_orgs.py    # Organization settings
│   │   ├── deepeval_arena.py   # Model comparison arena
│   │   ├── bias_audits.py      # Bias detection audits
│   │   └── evaluation_logs.py  # Logging & monitoring
│   ├── services/               # Business logic
│   ├── database/               # SQLAlchemy + Alembic
│   │   ├── db.py              # Database connection
│   │   └── redis.py           # Redis for caching
│   └── middlewares/
│       └── middleware.py       # Tenant middleware
├── alembic/                    # Database migrations
└── requirements.txt
```

### API Routes

| Route Prefix | Purpose |
|-------------|---------|
| `/deepeval` | Core evaluation endpoints |
| `/deepeval/projects` | Project/experiment management |
| `/deepeval/orgs` | Organization API key settings |
| `/deepeval/arena` | Model comparison arena |
| `/deepeval/bias` | Bias audit functionality |

### Running EvalServer

```bash
cd EvalServer
source venv/bin/activate  # or create venv first
pip install -r requirements.txt
cd src && python app.py
# Runs on http://localhost:8000
```

### Environment Variables

```env
LLM_EVALS_PORT=8000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://localhost:6379
BACKEND_URL=http://localhost:3000
```

### Backend Proxy

The Express backend proxies requests to EvalServer:

```typescript
// Servers/routes/deepEvalRoutes.route.ts
// Proxies /api/deepeval/* to EvalServer
```

### Key Tables (Tenant Schema)

| Table | Purpose |
|-------|---------|
| `llm_evals_experiments` | Experiment configurations |
| `llm_evals_test_cases` | Individual test cases |
| `llm_evals_results` | Evaluation results |
| `llm_evals_metrics` | Metric configurations |

---

## 22. AI Advisor

### Overview

AI-powered governance assistant that can query and analyze data across the entire VerifyWise platform using function calling.

### Architecture

```
Servers/advisor/
├── aiSdkAgent.ts          # AI SDK agent implementation
├── functions/             # Tool implementations
│   ├── riskFunctions.ts
│   ├── modelInventoryFunctions.ts
│   ├── modelRiskFunctions.ts
│   ├── vendorFunctions.ts
│   ├── incidentFunctions.ts
│   ├── taskFunctions.ts
│   ├── policyFunctions.ts
│   ├── useCaseFunctions.ts
│   ├── datasetFunctions.ts
│   ├── frameworkFunctions.ts
│   ├── trainingFunctions.ts
│   ├── evidenceFunctions.ts
│   ├── reportingFunctions.ts
│   ├── aiTrustCentreFunctions.ts
│   └── agentDiscoveryFunctions.ts
└── tools/                 # Tool definitions (schemas)
    └── *.ts              # Tool schemas for each category
```

### Supported LLM Providers

| Provider | Model Support |
|----------|--------------|
| OpenAI | GPT-4, GPT-3.5-turbo |
| Anthropic | Claude models |
| OpenRouter | Various models |

### Using the Advisor

```typescript
// POST /api/advisor/run
// Body: { prompt: "What are the top 5 risks?" }

// Streaming endpoint
// POST /api/advisor/stream
// Body: { prompt: "Summarize compliance status", llmKeyId?: number }
```

### Available Tool Categories

| Category | Tools |
|----------|-------|
| Risk | List risks, get risk details, risk analytics |
| Model Inventory | List models, model details, lifecycle status |
| Model Risk | Model-specific risks |
| Vendor | Vendor list, vendor risks |
| Incident | Incident management queries |
| Task | Task queries and analysis |
| Policy | Policy compliance queries |
| Use Case | Project/use case details |
| Dataset | Dataset information |
| Framework | Framework compliance status |
| Training | Training registry queries |
| Evidence | Evidence hub queries |
| Reporting | Generate reports |
| AI Trust Centre | Public trust center info |
| Agent Discovery | AI agent inventory |

### Configuration

LLM keys are stored per-tenant:

```typescript
// Add LLM key via /api/llm-keys
{
  name: "OpenAI",       // or "Anthropic", "OpenRouter"
  key: "sk-...",        // API key (encrypted at rest)
  model: "gpt-4",       // Model name
  url?: "https://..."   // Optional custom endpoint
}
```

---

## 23. Shadow AI Detection

### Overview

Monitors and tracks unauthorized AI tool usage within an organization by analyzing network traffic and logs.

### API Routes

| Route | Purpose |
|-------|---------|
| `GET /api/shadow-ai/insights/summary` | Overview dashboard metrics |
| `GET /api/shadow-ai/insights/tools-by-events` | Tool usage by event count |
| `GET /api/shadow-ai/insights/tools-by-users` | Tool usage by user count |
| `GET /api/shadow-ai/insights/users-by-department` | Department breakdown |
| `GET /api/shadow-ai/insights/trend` | Usage trends over time |
| `GET /api/shadow-ai/users` | List users with AI tool usage |
| `GET /api/shadow-ai/users/:email/activity` | User-specific activity |
| `GET /api/shadow-ai/tools` | Detected AI tools |
| `PATCH /api/shadow-ai/tools/:id/status` | Update tool governance status |
| `POST /api/shadow-ai/tools/:id/start-governance` | Initiate governance workflow |
| `GET/POST/PATCH/DELETE /api/shadow-ai/rules` | Alert rules management |
| `GET /api/shadow-ai/rules/alert-history` | Alert history |
| `GET/POST/PATCH/DELETE /api/shadow-ai/config/syslog` | Syslog configuration |
| `GET/PATCH /api/shadow-ai/settings` | Rate limiting & retention |

### Data Ingestion

External systems send data via API keys:

```typescript
// POST /api/v1/shadow-ai/events
// Headers: X-API-Key: <shadow-ai-api-key>
{
  event_type: "ai_tool_access",
  tool_name: "ChatGPT",
  user_email: "user@company.com",
  department: "Engineering",
  timestamp: "2026-02-20T10:30:00Z",
  metadata: { ... }
}
```

### API Key Management

```typescript
// Create API key for ingestion
POST /api/shadow-ai/api-keys
// Body: { name: "Network Monitor" }

// List keys
GET /api/shadow-ai/api-keys

// Revoke key
DELETE /api/shadow-ai/api-keys/:id
```

### Tool Governance Statuses

| Status | Description |
|--------|-------------|
| `unreviewed` | Newly detected, not yet assessed |
| `approved` | Approved for organization use |
| `restricted` | Limited use with conditions |
| `blocked` | Not allowed for use |

### Alert Rules

```typescript
{
  name: "High-risk tool detected",
  condition: {
    tool_category: "code_generation",
    user_count_threshold: 5
  },
  actions: ["email", "slack"],
  is_active: true
}
```

---

## 24. AI Detection Module

### Overview

Scans code repositories to detect AI-generated code and AI/ML dependencies for governance and compliance.

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/ai-detection/scans` | POST | Start new repository scan |
| `/ai-detection/scans` | GET | List scan history |
| `/ai-detection/scans/active` | GET | Get active scan (polling) |
| `/ai-detection/scans/:scanId` | GET | Get scan details |
| `/ai-detection/scans/:scanId/status` | GET | Get scan status |
| `/ai-detection/scans/:scanId/findings` | GET | Get AI detection findings |
| `/ai-detection/scans/:scanId/security-findings` | GET | Security vulnerabilities |
| `/ai-detection/scans/:scanId/security-summary` | GET | Security summary |
| `/ai-detection/scans/:scanId/cancel` | POST | Cancel in-progress scan |
| `/ai-detection/scans/:scanId` | DELETE | Delete scan (Admin only) |
| `/ai-detection/scans/:scanId/findings/:findingId/governance` | PATCH | Update governance status |
| `/ai-detection/scans/:scanId/governance-summary` | GET | Governance summary |
| `/ai-detection/stats` | GET | Overall statistics |
| `/ai-detection/scans/:scanId/export/ai-bom` | GET | Export AI Bill of Materials |
| `/ai-detection/scans/:scanId/dependency-graph` | GET | Dependency visualization |
| `/ai-detection/scans/:scanId/compliance` | GET | EU AI Act compliance mapping |

### Scan Flow

```
1. POST /scans { repository_url: "https://github.com/..." }
   ↓
2. Scan status: pending → cloning → scanning → completed/failed
   ↓
3. Poll GET /scans/:id/status until complete
   ↓
4. GET /scans/:id/findings for results
```

### Governance Statuses

| Status | Description |
|--------|-------------|
| `null` | Not reviewed |
| `reviewed` | Reviewed, no action needed |
| `approved` | Approved for use |
| `flagged` | Requires attention/remediation |

### Authorization

| Action | Allowed Roles |
|--------|--------------|
| Start scan | Admin, Editor |
| View scans/findings | All roles |
| Cancel scan | Admin, Editor |
| Delete scan | Admin only |

### Rate Limiting

- 30 scan requests per 15 minutes per IP

---

## 25. Post-Market Monitoring (PMM)

### Overview

Scheduled monitoring cycles for AI systems in production, ensuring ongoing compliance and stakeholder feedback.

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Config** | PMM configuration per project (frequency, stakeholders) |
| **Cycle** | Individual monitoring period |
| **Questions** | Survey questions for stakeholders |
| **Responses** | Stakeholder answers to questions |
| **Reports** | Generated compliance reports |

### API Routes

**Configuration:**
| Route | Method | Purpose |
|-------|--------|---------|
| `/pmm/config/:projectId` | GET | Get project config |
| `/pmm/config` | POST | Create config |
| `/pmm/config/:configId` | PUT | Update config |
| `/pmm/config/:configId` | DELETE | Delete config |

**Questions:**
| Route | Method | Purpose |
|-------|--------|---------|
| `/pmm/config/:configId/questions` | GET | Get questions |
| `/pmm/config/:configId/questions` | POST | Add question |
| `/pmm/questions/:questionId` | PUT | Update question |
| `/pmm/questions/:questionId` | DELETE | Delete question |
| `/pmm/questions/reorder` | POST | Reorder questions |

**Cycles:**
| Route | Method | Purpose |
|-------|--------|---------|
| `/pmm/active-cycle/:projectId` | GET | Get active cycle |
| `/pmm/cycles/:cycleId` | GET | Get cycle details |
| `/pmm/cycles/:cycleId/responses` | GET | Get saved responses |
| `/pmm/cycles/:cycleId/responses` | POST | Save responses (partial) |
| `/pmm/cycles/:cycleId/submit` | POST | Submit cycle (final) |
| `/pmm/cycles/:cycleId/flag` | POST | Flag concern |

**Reports:**
| Route | Method | Purpose |
|-------|--------|---------|
| `/pmm/reports` | GET | List reports |
| `/pmm/reports/:reportId/download` | GET | Download PDF |

### Monitoring Frequency

```typescript
enum MonitoringFrequency {
  WEEKLY = "weekly",
  BIWEEKLY = "biweekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  ANNUALLY = "annually"
}
```

### Cycle States

```
pending → in_progress → completed
                ↓
            flagged (concern raised)
```

### Scheduled Jobs

PMM uses BullMQ jobs to:
1. Send initial stakeholder notifications
2. Send reminder notifications
3. Auto-close cycles at deadline

---

## 26. Slack Integration

### Overview

Send notifications and alerts to Slack channels via webhooks.

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/slackWebhooks` | GET | List all webhooks |
| `/api/slackWebhooks/:id` | GET | Get webhook by ID |
| `/api/slackWebhooks` | POST | Create webhook |
| `/api/slackWebhooks/:id` | PATCH | Update webhook |
| `/api/slackWebhooks/:id` | DELETE | Delete webhook |
| `/api/slackWebhooks/:id/send` | POST | Send test message |

### Webhook Configuration

```typescript
{
  name: "Compliance Alerts",
  webhook_url: "https://hooks.slack.com/services/...",
  channel: "#compliance",
  description: "Notifications for compliance events",
  is_active: true
}
```

### Using in Automations

Slack webhooks integrate with the automation system:

```typescript
// Automation action
{
  action_type_id: 2,  // "send_slack_message"
  params: {
    webhook_id: 123,
    message: "New risk detected: {{risk_title}}"
  }
}
```

### Rate Limiting

- 10 webhook creation requests per hour per IP

---

## 27. Entity Graph

### Overview

Visual representation of relationships between entities with annotations, saved views, and gap analysis rules.

### API Routes

**Annotations:**
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/entity-graph/annotations` | POST | Create/update annotation |
| `/api/entity-graph/annotations` | GET | Fetch all user annotations |
| `/api/entity-graph/annotations/:entityType/:entityId` | GET | Get annotation for entity |
| `/api/entity-graph/annotations/:id` | DELETE | Delete annotation |

**Views:**
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/entity-graph/views` | POST | Create view |
| `/api/entity-graph/views` | GET | Fetch all user views |
| `/api/entity-graph/views/:id` | GET | Get view by ID |
| `/api/entity-graph/views/:id` | PUT | Update view |
| `/api/entity-graph/views/:id` | DELETE | Delete view |

**Gap Rules:**
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/entity-graph/gap-rules` | POST | Save custom gap rules |
| `/api/entity-graph/gap-rules` | GET | Get user's gap rules |
| `/api/entity-graph/gap-rules` | DELETE | Reset to defaults |
| `/api/entity-graph/gap-rules/defaults` | GET | Get default rules |

### Entity Types

| Entity Type | Graph Node |
|-------------|-----------|
| `project` | Use case/project |
| `risk` | Project risk |
| `vendor` | Vendor |
| `model` | Model inventory |
| `policy` | Policy |
| `incident` | Incident |
| `task` | Task |

### Annotations

```typescript
{
  entity_type: "project",
  entity_id: 123,
  note: "Critical project - requires weekly review",
  color: "#ff0000",
  icon: "warning"
}
```

### Gap Rules

Define what relationships should exist between entities:

```typescript
{
  source_type: "project",
  target_type: "risk",
  relationship: "must_have",
  min_count: 1,
  description: "Every project must have at least one risk assessment"
}
```

---

## 28. Automations System

### Overview

Rule-based automation engine that executes actions based on triggers.

### Architecture

```
Servers/
├── routes/automation.route.ts      # API endpoints
├── controllers/automations.ctrl.ts # Request handlers
├── utils/automation.utils.ts       # Database queries
├── services/automations/
│   ├── automationProducer.ts      # Job scheduling
│   └── automationWorker.ts        # Job execution
└── domain.layer/interfaces/
    ├── i.automationTrigger.ts
    └── i.tenantAutomationAction.ts
```

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/automations/triggers` | GET | List available triggers |
| `/api/automations/triggers/:triggerId/actions` | GET | Get actions for trigger |
| `/api/automations` | GET | List automations |
| `/api/automations/:id` | GET | Get automation by ID |
| `/api/automations` | POST | Create automation |
| `/api/automations/:id` | PATCH | Update automation |
| `/api/automations/:id` | DELETE | Delete automation |
| `/api/automations/:id/history` | GET | Execution history |
| `/api/automations/:id/stats` | GET | Execution statistics |

### Triggers (Examples)

| Trigger | Description |
|---------|-------------|
| `vendor_review_date` | When vendor review date approaches |
| `policy_due_date` | When policy due date approaches |
| `risk_status_change` | When risk status changes |
| `model_deployed` | When model is deployed |
| `task_overdue` | When task becomes overdue |

### Actions (Examples)

| Action | Description |
|--------|-------------|
| `send_email` | Send email notification |
| `send_slack_message` | Send Slack message |
| `create_task` | Auto-create a task |
| `update_status` | Update entity status |
| `notify_users` | Send in-app notification |

### Creating an Automation

```typescript
// POST /api/automations
{
  name: "Vendor Review Reminder",
  triggerId: 1,  // vendor_review_date
  params: {
    days_before: 7
  },
  actions: [
    {
      action_type_id: 1,  // send_email
      params: {
        template: "vendor-review-due",
        to: ["{{vendor.assignee_email}}"]
      }
    },
    {
      action_type_id: 2,  // send_slack_message
      params: {
        webhook_id: 123,
        message: "Vendor {{vendor.name}} review due in 7 days"
      }
    }
  ]
}
```

### Execution Flow

```
1. Scheduled job checks triggers
2. Matching triggers queue execution
3. Worker processes actions in sequence
4. Results logged to automation_execution_logs
```

---

## 29. In-App Notifications

### Overview

Real-time notification system using Redis pub/sub for instant delivery and PostgreSQL for persistence.

### Architecture

```
Browser ←─ SSE ←─ Express ←─ Redis Subscriber
                              ↑
                         Redis Pub/Sub
                              ↑
                     Any Backend Service
```

### Notification Types

```typescript
enum NotificationType {
  TASK_ASSIGNED = "task_assigned",
  REVIEW_REQUESTED = "review_requested",
  REVIEW_APPROVED = "review_approved",
  REVIEW_REJECTED = "review_rejected",
  APPROVAL_REQUESTED = "approval_requested",
  APPROVAL_COMPLETE = "approval_complete",
  VENDOR_REVIEW_DUE = "vendor_review_due",
  POLICY_DUE_SOON = "policy_due_soon",
  TRAINING_ASSIGNED = "training_assigned",
  // ... more types
}
```

### Entity Types

```typescript
enum NotificationEntityType {
  TASK = "task",
  RISK = "risk",
  VENDOR = "vendor",
  POLICY = "policy",
  USE_CASE = "use_case",
  TRAINING = "training",
  MODEL = "model",
  INCIDENT = "incident",
}
```

### Sending Notifications

```typescript
import { sendInAppNotification, notifyTaskAssigned } from "../services/inAppNotification.service";

// Generic notification
await sendInAppNotification(
  tenantId,
  {
    user_id: userId,
    type: NotificationType.TASK_ASSIGNED,
    title: "New task assigned",
    message: "You have been assigned to: Review vendor",
    entity_type: NotificationEntityType.TASK,
    entity_id: taskId,
    entity_name: "Review vendor",
    action_url: `/tasks?taskId=${taskId}`,
  },
  true,  // Send email notification
  {
    template: EMAIL_TEMPLATES.TASK_ASSIGNED,
    subject: "New task assigned",
    variables: { ... }
  }
);

// Convenience function
await notifyTaskAssigned(
  tenantId,
  assigneeId,
  { id: taskId, title: "Review vendor", priority: "high", due_date: "2026-03-01" },
  "John Doe",
  "https://app.verifywise.ai"
);
```

### Bulk Notifications

```typescript
import { sendBulkInAppNotifications } from "../services/inAppNotification.service";

await sendBulkInAppNotifications(
  tenantId,
  {
    user_ids: [1, 2, 3, 4],
    type: NotificationType.POLICY_DUE_SOON,
    title: "Policy due soon",
    message: "Policy XYZ is due in 3 days",
    entity_type: NotificationEntityType.POLICY,
    entity_id: policyId,
    entity_name: "Policy XYZ",
    action_url: `/policies/${policyId}`,
  }
);
```

### Frontend: SSE Subscription

```typescript
// Connect to SSE endpoint
const eventSource = new EventSource('/api/notifications/sse');

eventSource.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  // Show notification in UI
};
```

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/notifications` | GET | Get notifications (paginated) |
| `/api/notifications/unread-count` | GET | Get unread count |
| `/api/notifications/:id/read` | PATCH | Mark as read |
| `/api/notifications/read-all` | PATCH | Mark all as read |
| `/api/notifications/sse` | GET | SSE connection |

---

## 30. Agent Discovery

### Overview

Inventory and governance system for AI agents deployed across the organization.

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/agent-primitives` | GET | List all agents |
| `/api/agent-primitives/:id` | GET | Get agent details |
| `/api/agent-primitives` | POST | Register new agent |
| `/api/agent-primitives/:id` | PATCH | Update agent |
| `/api/agent-primitives/:id` | DELETE | Remove agent |
| `/api/agent-primitives/:id/capabilities` | GET | Get agent capabilities |
| `/api/agent-primitives/:id/risks` | GET | Get associated risks |

### Agent Properties

```typescript
{
  name: "Customer Support Agent",
  description: "AI agent for handling customer inquiries",
  agent_type: "conversational",
  deployment_status: "production",
  owner_id: userId,
  capabilities: ["text_generation", "sentiment_analysis"],
  integrations: ["zendesk", "slack"],
  risk_level: "medium",
  compliance_status: "compliant",
  last_audit_date: "2026-02-01"
}
```

### Agent Types

| Type | Description |
|------|-------------|
| `conversational` | Chat/dialogue agents |
| `autonomous` | Self-acting agents |
| `assistive` | Human-assisting agents |
| `analytical` | Data analysis agents |

### Deployment Statuses

| Status | Description |
|--------|-------------|
| `development` | In development |
| `testing` | Being tested |
| `staging` | Pre-production |
| `production` | Live in production |
| `deprecated` | Being phased out |
| `retired` | No longer active |

---

## 31. Evidence Hub

### Overview

Central repository for compliance evidence, linking documentation to requirements and controls.

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/evidenceHub` | GET | List all evidence |
| `/api/evidenceHub/:id` | GET | Get evidence by ID |
| `/api/evidenceHub` | POST | Create new evidence |
| `/api/evidenceHub/:id` | PATCH | Update evidence |
| `/api/evidenceHub/:id` | DELETE | Delete evidence |

### Evidence Properties

```typescript
{
  title: "Risk Assessment Report",
  description: "Annual risk assessment for AI system",
  file_id: fileId,
  evidence_type: "document",
  framework_requirements: ["EU-AI-Act-Art10", "ISO42001-7.2"],
  linked_entities: [
    { entity_type: "risk", entity_id: 123 },
    { entity_type: "model", entity_id: 456 }
  ],
  tags: ["risk", "annual-review"],
  status: "current"  // current | outdated | archived
}
```

---

## 32. CE Marking

### Overview

EU CE Marking compliance tracking for AI systems classified as high-risk under EU AI Act.

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/ce-marking/:projectId` | GET | Get CE marking data for project |
| `/api/ce-marking/:projectId` | PUT | Update CE marking data |

### CE Marking Checklist

The CE marking process tracks:
- Conformity assessment completed
- Technical documentation prepared
- Quality management system in place
- EU declaration of conformity signed
- CE marking affixed to product/documentation
- Registration in EU database completed

---

## 33. Virtual Folders

### Overview

Organize files into a hierarchical folder structure without moving physical files.

### API Routes

**Folder Management:**
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/virtual-folders` | GET | List all folders (flat) |
| `/api/virtual-folders/tree` | GET | Get folder tree (hierarchy) |
| `/api/virtual-folders/uncategorized` | GET | Files not in any folder |
| `/api/virtual-folders/:id` | GET | Get folder by ID |
| `/api/virtual-folders/:id/path` | GET | Get folder breadcrumb path |
| `/api/virtual-folders` | POST | Create folder |
| `/api/virtual-folders/:id` | PATCH | Update folder |
| `/api/virtual-folders/:id` | DELETE | Delete folder (cascade) |

**File-Folder Mapping:**
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/virtual-folders/:id/files` | GET | Get files in folder |
| `/api/virtual-folders/:id/files` | POST | Assign files to folder |
| `/api/virtual-folders/:id/files/:fileId` | DELETE | Remove file from folder |
| `/api/files/:id/folders` | GET | Get folders containing file |
| `/api/files/:id/folders` | PATCH | Bulk update file folders |

### Folder Structure

```typescript
{
  name: "Compliance Documents",
  parent_id: null,  // null for root folders
  color: "#4CAF50",
  icon: "folder",
  description: "All compliance-related documents"
}
```

---

## 34. Global Search (Wise Search)

### Overview

Unified search across all entities in the application.

### API Route

```
GET /api/search?q=searchterm&limit=20&offset=0
```

### Searchable Entities

| Entity | Searchable Fields |
|--------|------------------|
| Projects | name, description |
| Risks | title, description |
| Vendors | name, description |
| Models | name, description |
| Policies | name, content |
| Tasks | title, description |
| Incidents | title, description |
| Files | filename, description |
| Training | name, description |

### Search Response

```typescript
{
  results: [
    {
      entity_type: "project",
      entity_id: 123,
      title: "AI Chatbot Project",
      snippet: "...matching text...",
      score: 0.95
    },
    // ...
  ],
  total: 42,
  limit: 20,
  offset: 0
}
```

---

## 35. Share Links

### Overview

Generate secure, time-limited public links to share resources externally.

### API Routes

**Public (No Auth):**
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/shares/token/:token` | GET | Validate share link |
| `/api/shares/view/:token` | GET | Get shared data |

**Protected:**
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/shares` | POST | Create share link |
| `/api/shares/:resourceType/:resourceId` | GET | Get links for resource |
| `/api/shares/:id` | PATCH | Update share link |
| `/api/shares/:id` | DELETE | Delete/revoke share link |

### Shareable Resources

| Resource Type | What's Shared |
|--------------|---------------|
| `report` | Generated compliance reports |
| `trust-center` | AI Trust Center profile |
| `compliance-dashboard` | Compliance summary |

### Share Link Properties

```typescript
{
  resource_type: "report",
  resource_id: 123,
  expires_at: "2026-03-20T00:00:00Z",  // null for no expiry
  password: "optional-password",
  view_count: 0,
  max_views: 100,  // null for unlimited
  is_active: true
}
```

### Public View URL

```
https://app.verifywise.ai/shared/{resourceType}/{token}
```

---

## 36. GitHub Integration

### Overview

Connect to GitHub for private repository scanning in AI Detection module.

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/integrations/github/token` | GET | Get token status |
| `/api/integrations/github/token` | POST | Save/update token |
| `/api/integrations/github/token` | DELETE | Delete token |
| `/api/integrations/github/token/test` | POST | Test token validity |

### Authorization

All GitHub integration endpoints require **Admin** role.

### Token Storage

- Personal Access Tokens (PATs) are encrypted at rest
- Tokens are scoped per organization
- Used for cloning private repositories during AI Detection scans

---

## 37. Notes System

### Overview

Add notes to any entity for collaboration and context.

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/notes` | GET | List notes (with filters) |
| `/api/notes/:id` | GET | Get note by ID |
| `/api/notes` | POST | Create note |
| `/api/notes/:id` | PATCH | Update note |
| `/api/notes/:id` | DELETE | Delete note |
| `/api/notes/entity/:entityType/:entityId` | GET | Get notes for entity |

### Note Properties

```typescript
{
  entity_type: "risk",
  entity_id: 123,
  content: "Discussed with compliance team. Need follow-up.",
  is_pinned: false,
  visibility: "team",  // team | private
  mentions: [userId1, userId2]
}
```

---

## 38. User Preferences

### Overview

Store user-specific settings and preferences.

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/user-preferences` | GET | Get current user preferences |
| `/api/user-preferences` | PATCH | Update preferences |
| `/api/user-preferences/:key` | GET | Get specific preference |
| `/api/user-preferences/:key` | PUT | Set specific preference |

### Common Preferences

| Key | Type | Description |
|-----|------|-------------|
| `theme` | string | "light" or "dark" |
| `sidebar_collapsed` | boolean | Sidebar state |
| `notifications_email` | boolean | Email notifications |
| `notifications_in_app` | boolean | In-app notifications |
| `dashboard_layout` | object | Dashboard widget positions |
| `table_page_size` | number | Default rows per page |
| `timezone` | string | User timezone |

---

## 39. Invitations

### Overview

Invite users to join the organization.

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/invitations` | GET | List pending invitations |
| `/api/invitations` | POST | Send invitation |
| `/api/invitations/:id` | DELETE | Cancel invitation |
| `/api/invitations/:id/resend` | POST | Resend invitation |
| `/api/invitations/accept/:token` | POST | Accept invitation |

### Invitation Flow

```
1. Admin sends invitation (POST /invitations)
2. User receives email with link
3. User clicks link → /register?token=xxx
4. User completes registration (POST /invitations/accept/:token)
5. User is added to organization
```

### Invitation Properties

```typescript
{
  email: "newuser@company.com",
  role_id: 2,  // Reviewer
  expires_at: "2026-03-01T00:00:00Z",
  message: "Welcome to the compliance team!"
}
```

---

## 40. Auto Drivers

### Overview

Automated compliance status calculation based on defined rules.

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/autoDrivers` | GET | List auto drivers |
| `/api/autoDrivers/:id` | GET | Get driver by ID |
| `/api/autoDrivers` | POST | Create driver |
| `/api/autoDrivers/:id` | PATCH | Update driver |
| `/api/autoDrivers/:id` | DELETE | Delete driver |
| `/api/autoDrivers/:id/run` | POST | Execute driver manually |

### Driver Types

| Type | Description |
|------|-------------|
| `risk_score` | Calculate aggregate risk scores |
| `compliance_status` | Update compliance percentages |
| `control_coverage` | Calculate control coverage |
| `evidence_freshness` | Flag outdated evidence |

---

## Quick Reference: API Prefix Index

| Prefix | Purpose |
|--------|---------|
| `/api/users` | User management |
| `/api/organizations` | Organization settings |
| `/api/roles` | Role management |
| `/api/projects` | Use cases/projects |
| `/api/projectRisks` | Project risks |
| `/api/vendors` | Vendor management |
| `/api/vendorRisks` | Vendor risks |
| `/api/modelInventory` | Model inventory |
| `/api/modelRisks` | Model risks |
| `/api/datasets` | Datasets |
| `/api/policies` | Policies |
| `/api/tasks` | Tasks |
| `/api/files` | File management |
| `/api/file-manager` | Advanced file ops |
| `/api/virtual-folders` | Folder organization |
| `/api/training` | Training registry |
| `/api/ai-incident-managements` | Incidents |
| `/api/frameworks` | Framework config |
| `/api/eu-ai-act` | EU AI Act controls |
| `/api/iso-42001` | ISO 42001 controls |
| `/api/iso-27001` | ISO 27001 controls |
| `/api/nist-ai-rmf` | NIST AI RMF |
| `/api/plugins` | Plugin management |
| `/api/automations` | Automation rules |
| `/api/approval-workflows` | Approval flows |
| `/api/approval-requests` | Approval requests |
| `/api/notifications` | Notifications |
| `/api/evidenceHub` | Evidence hub |
| `/api/reporting` | Report generation |
| `/api/dashboard` | Dashboard data |
| `/api/ai-detection` | AI code detection |
| `/api/shadow-ai` | Shadow AI monitoring |
| `/api/agent-primitives` | Agent discovery |
| `/api/pmm` | Post-market monitoring |
| `/api/aiTrustCentre` | AI Trust Center |
| `/api/ce-marking` | CE Marking |
| `/api/advisor` | AI Advisor |
| `/api/deepeval` | LLM Evaluations |
| `/api/search` | Global search |
| `/api/shares` | Share links |
| `/api/slackWebhooks` | Slack integration |
| `/api/integrations/github` | GitHub PAT |
| `/api/llm-keys` | LLM API keys |
| `/api/entity-graph` | Entity graph |
| `/api/notes` | Notes |
| `/api/logger` | Event logs |
| `/api/user-preferences` | User prefs |
| `/api/invitations` | Invitations |
| `/api/subscriptions` | Subscriptions |
| `/api/tiers` | Pricing tiers |
| `/api/tokens` | API tokens |
| `/api/autoDrivers` | Auto drivers |
| `/api/mail` | Email sending |
| `/api/compliance` | Compliance utils |

---

## 41. Rate Limiting Middleware

### Overview

Production-ready rate limiting to prevent API abuse and DoS attacks.

### Available Rate Limiters

| Limiter | Window | Max Requests | Use Case |
|---------|--------|--------------|----------|
| `authLimiter` | 15 min | 5 | Login, registration, password reset |
| `generalApiLimiter` | 15 min | 100 | Standard API endpoints |
| `fileOperationsLimiter` | 15 min | 50 | File upload/download |
| `aiDetectionScanLimiter` | 60 min | 10 | AI code scanning |

### Usage

```typescript
import {
  authLimiter,
  generalApiLimiter,
  fileOperationsLimiter,
  aiDetectionScanLimiter,
} from "../middleware/rateLimit.middleware";

// Apply to routes
router.post("/login", authLimiter, loginController);
router.post("/upload", fileOperationsLimiter, uploadController);
router.post("/scans", aiDetectionScanLimiter, startScanController);
```

### Response on Limit Exceeded

```json
{
  "message": "Too many requests from this IP, please try again after 15 minutes",
  "statusCode": 429
}
```

### Headers

Rate limit info is sent in `RateLimit-*` headers:
- `RateLimit-Limit` - Max requests
- `RateLimit-Remaining` - Remaining requests
- `RateLimit-Reset` - Reset timestamp

---

## 42. Access Control Middleware

### Overview

Role-based access control (RBAC) for protecting routes based on user roles.

### Standard Roles

| Role | ID | Permissions |
|------|-----|-------------|
| Admin | 1 | Full system access |
| Reviewer | 2 | Read + approve/reject |
| Editor | 3 | Read + write |
| Auditor | 4 | Read only |

### Usage

```typescript
import authenticateJWT from "../middleware/auth.middleware";
import authorize from "../middleware/accessControl.middleware";

// Single role
router.delete("/users/:id", authenticateJWT, authorize(["Admin"]), deleteUser);

// Multiple roles
router.patch("/data/:id", authenticateJWT, authorize(["Admin", "Editor"]), updateData);

// Read-only operations
router.get("/audit-logs", authenticateJWT, authorize(["Admin", "Auditor"]), getAuditLogs);
```

### Common Role Groups

```typescript
const ALL_ROLES = ["Admin", "Editor", "Reviewer", "Auditor"];
const WRITE_ROLES = ["Admin", "Editor"];
const ADMIN_ONLY = ["Admin"];
const REVIEW_ROLES = ["Admin", "Reviewer"];
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 401 | No role found (not authenticated) |
| 403 | Role not in allowed list |

---

## 43. Redis Configuration

### Overview

Redis is used for BullMQ job queues, caching, and real-time notifications (pub/sub).

### Configuration

File: `Servers/database/redis.ts`

```typescript
import IORedis from "ioredis";

export const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379/0";

const redisClient = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

export default redisClient;
```

### Usage Patterns

**Pub/Sub for Notifications:**
```typescript
import redisClient from "../database/redis";

// Publish
await redisClient.publish("in-app-notifications", JSON.stringify({
  tenantId,
  userId,
  notification,
}));

// Subscribe (in subscriber service)
const subscriber = redisClient.duplicate();
await subscriber.subscribe("in-app-notifications");
subscriber.on("message", (channel, message) => {
  const data = JSON.parse(message);
  // Handle notification
});
```

**BullMQ Queues:**
```typescript
import { Queue, Worker } from "bullmq";
import { REDIS_URL } from "../database/redis";

const myQueue = new Queue("my-queue", {
  connection: { url: REDIS_URL }
});

const worker = new Worker("my-queue", async (job) => {
  // Process job
}, { connection: { url: REDIS_URL } });
```

---

## 44. Redux State Management

### Overview

Redux Toolkit with persist for client-side state management.

### Store Structure

File: `Clients/src/application/redux/store.ts`

```typescript
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "ui"],  // Persisted slices
};

const rootReducer = combineReducers({
  ui: uiSlice,
  auth: authReducer,
  files: fileReducer,
});
```

### Available Slices

| Slice | Purpose | Persisted |
|-------|---------|-----------|
| `auth` | Authentication state | Yes |
| `ui` | UI state (sidebar, modals) | Yes |
| `files` | File upload state | No |

### Auth Slice State

```typescript
interface AuthState {
  isLoading: boolean;
  authToken: string;
  user: string;
  userExists: boolean;
  success: boolean | null;
  message: string | null;
  expirationDate: number | null;
  onboardingStatus: string;
  isOrgCreator: boolean;
}
```

### Auth Actions

```typescript
import { clearAuthState, setAuthToken, setUserExists } from "./auth/authSlice";

// Logout
dispatch(clearAuthState());

// Set token
dispatch(setAuthToken(token));

// Check user exists
dispatch(setUserExists(true));
```

### Using in Components

```typescript
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/application/redux/store";

function MyComponent() {
  const { authToken, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  // Use state...
}
```

### Version-Based Cache Invalidation

The store automatically clears persisted data when app version changes, ensuring users get fresh state on updates.

---

## 45. Axios Configuration

### Overview

Custom Axios instance with interceptors for authentication, token refresh, and error handling.

### Configuration

File: `Clients/src/infrastructure/api/customAxios.ts`

```typescript
const CustomAxios = axios.create({
  baseURL: `${ENV_VARs.URL}/api`,
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});
```

### Request Interceptor

- Automatically adds `Authorization: Bearer {token}` header
- Enables credentials for auth endpoints

### Response Interceptor

| Status | Action |
|--------|--------|
| 403 (org mismatch) | Show alert, logout |
| 406 (token expired) | Refresh token, retry request |

### Token Refresh Flow

```
1. Request returns 406 (Token Expired)
2. Axios queues pending requests
3. Refresh token request sent
4. New token stored in Redux
5. Queued requests retried with new token
```

### Usage

```typescript
import CustomAxios from "@/infrastructure/api/customAxios";

// GET
const response = await CustomAxios.get("/users");

// POST
const response = await CustomAxios.post("/projects", { name: "New Project" });

// With error handling
try {
  const response = await CustomAxios.get("/data");
  return response.data;
} catch (error) {
  if (axios.isAxiosError(error) && error.response?.status === 404) {
    return null;  // Handle not found
  }
  throw error;
}
```

---

## 46. MUI Theming

### Overview

Material-UI theming with custom palette, typography, and component styles.

### Theme Files

```
Clients/src/presentation/themes/
├── index.ts          # Central exports
├── light.ts          # Light theme
├── v1SingleTheme.ts  # Alternative theme
├── alerts.ts         # Alert styles
├── tables.ts         # Table styles
├── mixins.ts         # Reusable style mixins
└── components.ts     # Component overrides
```

### Color Palette

```typescript
const palette = {
  primary: { main: "#13715B" },  // VerifyWise green
  secondary: { main: "#F4F4F4" },
  text: {
    primary: "#1c2130",
    secondary: "#344054",
    tertiary: "#475467",
    accent: "#838c99",
  },
  background: {
    main: "#FFFFFF",
    alt: "#FCFCFD",
    modal: "#FCFCFD",
    fill: "#E6F0EC",
  },
  status: {
    success: { text: "#079455", main: "#17b26a", bg: "#ecfdf3" },
    error: { text: "#f04438", main: "#d32f2f", bg: "#f9eced" },
    warning: { text: "#DC6803", main: "#fdb022", bg: "#fffcf5" },
  },
  border: {
    light: "#eaecf0",
    dark: "#d0d5dd",
  },
};
```

### Typography

```typescript
const typography = {
  fontFamily: "'Geist', system-ui, -apple-system, sans-serif",
  fontSize: 13,
};
```

### Using Theme in Components

```typescript
import { useTheme, SxProps, Theme } from "@mui/material";

function MyComponent() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.main,
        color: theme.palette.text.primary,
        border: `1px solid ${theme.palette.border.light}`,
      }}
    >
      Content
    </Box>
  );
}
```

### Theme Exports

```typescript
import { light, singleTheme, alertStyles, tableStyles } from "@/presentation/themes";
```

---

## 47. Assessments & Questions

### Overview

Questionnaire system for compliance assessments with topics and subtopics.

### API Routes

**Assessments:**
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/assessments` | GET | List all assessments |
| `/api/assessments/:id` | GET | Get assessment by ID |
| `/api/assessments/project/byid/:id` | GET | Get assessment for project |
| `/api/assessments/getAnswers/:id` | GET | Get answers for assessment |

**Questions:**
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/questions` | GET | List all questions |
| `/api/questions/:id` | GET | Get question by ID |
| `/api/questions/bytopic/:id` | GET | Get questions by topic |
| `/api/questions/bysubtopic/:id` | GET | Get questions by subtopic |

### Structure

```
Assessment
  └── Topics
        └── Subtopics
              └── Questions
                    └── Answers
```

---

## 48. Subscriptions & Tiers

### Overview

Subscription and pricing tier management for multi-tenant SaaS.

### API Routes

**Subscriptions:**
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/subscriptions` | GET | Get current subscription |
| `/api/subscriptions` | POST | Create subscription |
| `/api/subscriptions/:id` | PUT | Update subscription |

**Tiers:**
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/tiers/features/:id` | GET | Get tier features |

### Subscription Properties

```typescript
{
  organization_id: number;
  tier_id: number;
  status: "active" | "cancelled" | "expired";
  start_date: Date;
  end_date: Date;
  features: string[];
}
```

---

## 49. API Tokens

### Overview

API token management for programmatic access.

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/tokens` | GET | List API tokens |
| `/api/tokens` | POST | Create token |
| `/api/tokens/:id` | DELETE | Delete token |

### Token Properties

```typescript
{
  name: "CI/CD Pipeline",
  token: "vw_...",  // Shown once on creation
  scopes: ["read", "write"],
  expires_at: "2027-01-01",
  last_used_at: Date | null
}
```

### Security

- Tokens are hashed before storage
- Full token shown only once on creation
- Middleware validates token creation/deletion

---

## 50. Dataset Bulk Upload

### Overview

Plugin for bulk uploading CSV/XLSX files to create dataset records.

### Requirements

- Plugin `dataset-bulk-upload` must be installed
- Admin or Editor role required

### API Route

```
POST /api/dataset-bulk-upload/upload
Content-Type: multipart/form-data

file: <CSV/XLSX file>
```

### Supported File Types

| MIME Type | Extensions |
|-----------|------------|
| `text/csv` | .csv |
| `application/vnd.ms-excel` | .xls, .csv |
| `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | .xlsx |

### Limits

- Max file size: 30MB
- One file per request (for progress tracking)

### Error Responses

| Status | Condition |
|--------|-----------|
| 413 | File size exceeds 30MB |
| 415 | Unsupported file type |
| 403 | Plugin not installed |

---

## 51. Compliance Score

### Overview

Calculates and returns AI compliance scores with module breakdowns.

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/compliance/score` | GET | Get score for current org |
| `/api/compliance/score/:organizationId` | GET | Get score for specific org |
| `/api/compliance/details/:organizationId` | GET | Detailed breakdown for drill-down |

### Score Response

```typescript
{
  overall_score: 78.5,
  modules: {
    risk_management: { score: 85, weight: 0.25 },
    vendor_management: { score: 72, weight: 0.20 },
    model_governance: { score: 80, weight: 0.25 },
    policy_compliance: { score: 75, weight: 0.15 },
    training: { score: 70, weight: 0.15 }
  },
  calculated_at: "2026-02-20T10:30:00Z",
  data_quality: {
    completeness: 92,
    last_updated: "2026-02-19"
  }
}
```

### Details Response

Includes:
- Component-level scoring
- Improvement insights
- Data quality indicators
- Historical trends

---

## 52. Policy Linked Objects

### Overview

Link policies to risks and evidence for traceability.

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/policy-linked` | GET | Get all linked objects |
| `/api/policy-linked/:policyId/linked-objects` | GET | Get linked objects for policy |
| `/api/policy-linked/:policyId/linked-objects` | POST | Create link |
| `/api/policy-linked/:policyId/linked-objects` | DELETE | Delete link |
| `/api/policy-linked/risk/:riskId/unlink-all` | DELETE | Unlink risk from all policies |
| `/api/policy-linked/evidence/:evidenceId/unlink-all` | DELETE | Unlink evidence from all |

### Linked Object Types

| Type | Description |
|------|-------------|
| `risk` | Link policy to a risk |
| `evidence` | Link policy to evidence |

### Use Case

Track which policies address which risks, and what evidence supports policy compliance.

---

## 53. Dashboard Data

### Overview

Aggregated dashboard metrics for the overview page.

### API Route

```
GET /api/dashboard
```

### Response

```typescript
{
  compliance_score: 78.5,
  risk_summary: {
    total: 45,
    high: 5,
    medium: 20,
    low: 20
  },
  vendor_summary: {
    total: 12,
    pending_review: 3
  },
  model_summary: {
    total: 8,
    in_production: 5,
    in_development: 3
  },
  task_summary: {
    total: 25,
    overdue: 2,
    due_this_week: 8
  },
  recent_activity: [
    { type: "risk_created", timestamp: "...", user: "..." },
    // ...
  ]
}
```

---

## 54. JWT Auth Middleware

### Overview

Comprehensive JWT authentication with multi-tenant isolation and security validation.

### Security Layers

1. **Token presence** - Bearer token extraction
2. **JWT verification** - Signature validation
3. **Expiration check** - Token not expired
4. **Payload validation** - Required fields present
5. **Organization membership** - User belongs to claimed org
6. **Role consistency** - Role hasn't changed since token issued
7. **Tenant hash validation** - Defense against SQL injection

### Request Properties Set

```typescript
// After authenticateJWT middleware:
req.userId         // number - User ID
req.role           // string - "Admin" | "Reviewer" | "Editor" | "Auditor"
req.tenantId       // string - Tenant hash (e.g., "a1b2c3d4e5")
req.organizationId // number - Organization ID
```

### Role Map

```typescript
const roleMap = new Map([
  [1, "Admin"],
  [2, "Reviewer"],
  [3, "Editor"],
  [4, "Auditor"],
]);
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 400 | Token not found / Invalid token |
| 401 | JWT verification failed |
| 403 | User not in org / Role changed |
| 406 | Token expired |
| 500 | Server error |

### Usage

```typescript
import authenticateJWT from "../middleware/auth.middleware";

// Apply to all routes
router.use(authenticateJWT);

// Or specific routes
router.get("/protected", authenticateJWT, handler);
```

---

## 55. Plugin Guard Middleware

### Overview

Middleware factory that checks if a plugin is installed before allowing access.

### Usage

```typescript
import { requirePlugin } from "../middleware/pluginGuard.middleware";

// Require plugin for all routes in router
router.use(requirePlugin("dataset-bulk-upload"));

// Or for specific routes
router.post("/upload", requirePlugin("my-plugin"), uploadHandler);
```

### Behavior

| Condition | Response |
|-----------|----------|
| Plugin installed | Calls `next()` |
| Plugin not installed | 404 with message |
| No tenant context | 401 |
| Server error | 500 |

### Implementation

```typescript
export function requirePlugin(pluginKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const installation = await findByPlugin(pluginKey, req.tenantId);
    if (!installation || installation.status !== "installed") {
      return res.status(404).json({
        message: `The '${pluginKey}' plugin is not installed`,
      });
    }
    return next();
  };
}
```

---

## 56. Request Context (AsyncLocalStorage)

### Overview

Node.js AsyncLocalStorage for request-scoped context propagation.

### Setup

```typescript
// Servers/utils/context/context.ts
import { AsyncLocalStorage } from "async_hooks";

interface RequestContext {
  userId: number;
  tenantId: string;
  organizationId: number;
}

export const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();
```

### Initialization (in auth middleware)

```typescript
asyncLocalStorage.run({
  userId: decoded.id,
  tenantId: decoded.tenantId,
  organizationId: decoded.organizationId
}, () => {
  next();
});
```

### Usage in Services

```typescript
import { asyncLocalStorage } from "../utils/context/context";

function myService() {
  const context = asyncLocalStorage.getStore();
  if (context) {
    console.log(`User ${context.userId} from tenant ${context.tenantId}`);
  }
}
```

### Use Cases

- Automatic tenant context in logging
- Request tracing across async operations
- Audit trail without passing context through all functions

---

## 57. Docker & Deployment

### Services Architecture

```yaml
services:
  postgresdb:    # PostgreSQL 16.8
  redis:         # Redis 7 (queues, pub/sub)
  backend:       # Express.js API
  frontend:      # React SPA (Nginx)
  worker:        # BullMQ job processor
  eval_server:   # Python FastAPI (LLM evals)
```

### Docker Compose Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Base configuration |
| `docker-compose.prod.yml` | Production overrides |
| `docker-compose.override.yml` | Local development |

### Running with Docker

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f backend
```

### Environment Variables

```bash
# Database
DB_USER=postgres
DB_PASSWORD=secret
DB_NAME=verifywise
DB_PORT=5432

# Backend
BACKEND_PORT=3000
JWT_SECRET=your-secret
ENCRYPTION_KEY=your-encryption-key

# Features
MOCK_DATA_ON=false
```

### Container Images

| Service | Image |
|---------|-------|
| Backend | `ghcr.io/bluewave-labs/verifywise-backend:latest` |
| Frontend | `ghcr.io/bluewave-labs/verifywise-frontend:latest` |
| EvalServer | `ghcr.io/bluewave-labs/verifywise-eval-server:latest` |

### Health Checks

```yaml
# PostgreSQL
test: ["CMD", "pg_isready", "-U", "$DB_USER", "-d", "$DB_NAME"]

# Redis
test: ["CMD", "redis-cli", "ping"]
```

### Worker Service

The worker runs as a separate container using the same backend image:

```yaml
worker:
  image: ghcr.io/bluewave-labs/verifywise-backend:latest
  command: ["node", "dist/jobs/worker.js"]
```

---

## 58. CI/CD Workflows

### GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `docker-image.yml` | Release published | Build & push to GHCR |
| `docker-image-test.yml` | PR to main | Test Docker builds |
| `backend-checks.yml` | PR | Lint, type-check, test backend |
| `frontend-checks.yml` | PR | Lint, type-check, test frontend |
| `deploy-to-production.yml` | Manual | Deploy to production |

### Build & Push Flow

```
1. Release published on GitHub
2. Build all Docker images (frontend, backend, eval-server)
3. Scan images with Trivy for vulnerabilities
4. Upload scan results to GitHub Security
5. Push images to GitHub Container Registry
6. Tag with release version + latest
```

### Security Scanning

- **Trivy** scans for CRITICAL and HIGH vulnerabilities
- Results uploaded to GitHub Security tab
- Non-blocking (exit-code: 0)

### Required Secrets

| Secret | Purpose |
|--------|---------|
| `GITHUB_TOKEN` | GHCR authentication (auto) |
| `SLACK_CLIENT_ID` | Frontend build arg |

### Image Tags

```
ghcr.io/bluewave-labs/verifywise-backend:latest
ghcr.io/bluewave-labs/verifywise-backend:v1.2.3
```

---

## 59. AI Agent Role Definitions

### Overview

The `agents/` directory contains role definitions for AI-assisted development workflows.

### Available Roles

| File | Role |
|------|------|
| `00-TEAM_WORKFLOW.md` | Team coordination and workflow |
| `technical-lead.md` | Architecture decisions, code review |
| `senior-backend-developer.md` | Complex backend features |
| `senior-frontend-developer.md` | Complex frontend features |
| `mid-backend-developer.md` | Standard backend tasks |
| `mid-frontend-developer.md` | Standard frontend tasks |
| `junior-backend-developer.md` | Simple backend tasks |
| `junior-frontend-developer.md` | Simple frontend tasks |
| `devops-engineer.md` | Infrastructure, CI/CD |
| `qa-engineer.md` | Testing, quality assurance |
| `product-manager.md` | Requirements, prioritization |
| `ux-ui-designer.md` | Design, user experience |

### Usage

These files define prompts and guidelines for AI coding assistants to follow specific role patterns when implementing features.

### Team Workflow

The `00-TEAM_WORKFLOW.md` file defines:
- Task assignment protocols
- Code review processes
- Communication patterns
- Escalation procedures

---

## Additional Resources

- [Code Rules](./CodeRules/README.md) - Detailed coding standards
- [Plugin System](./docs/PLUGIN_SYSTEM.md) - Plugin architecture
- [Technical Docs](./docs/technical/) - Architecture documentation
- [API Docs](./Servers/swagger.yaml) - OpenAPI specification
- [Agent Roles](./agents/) - AI-assisted development roles
