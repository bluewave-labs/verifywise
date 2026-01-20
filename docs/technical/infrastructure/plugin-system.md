# Plugin System

## Overview

VerifyWise implements a remote plugin marketplace system that allows organizations to extend platform functionality. Plugins are fetched from a remote Git repository, downloaded and cached locally, and dynamically loaded at runtime. The system supports multi-tenant isolation, configuration management, and OAuth integrations.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PLUGIN SYSTEM FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐                                                       │
│  │   Plugin         │  1. GET /plugins/marketplace                          │
│  │   Marketplace    │◄─────────────────────────────────────────────────┐    │
│  │   (GitHub)       │                                                  │    │
│  └────────┬─────────┘                                                  │    │
│           │                                                            │    │
│           │ 2. plugins.json                                            │    │
│           ▼                                                            │    │
│  ┌──────────────────┐     ┌──────────────────┐                        │    │
│  │  PluginService   │────►│  Local Cache     │                        │    │
│  │  (Backend)       │     │  (temp/plugins/) │                        │    │
│  └────────┬─────────┘     │  5-day TTL       │                        │    │
│           │               └──────────────────┘                        │    │
│           │                                                            │    │
│           │ 3. Download plugin code + dependencies                     │    │
│           ▼                                                            │    │
│  ┌──────────────────┐                                                  │    │
│  │  Plugin Code     │                                                  │    │
│  │  Execution       │                                                  │    │
│  │  (require())     │                                                  │    │
│  └────────┬─────────┘                                                  │    │
│           │                                                            │    │
│           │ 4. install()/uninstall()/configure()                       │    │
│           ▼                                                            │    │
│  ┌──────────────────────────────────────────────────────────────────┐ │    │
│  │                    Tenant Schema                                  │ │    │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │    │
│  │  │  plugin_installations                                        │ │ │    │
│  │  │  ├── id, plugin_key, status, configuration                   │ │ │    │
│  │  │  └── installed_at, error_message, metadata                   │ │ │    │
│  │  └─────────────────────────────────────────────────────────────┘ │ │    │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │    │
│  │  │  Plugin-specific tables (e.g., mlflow_model_records)         │ │ │    │
│  │  └─────────────────────────────────────────────────────────────┘ │ │    │
│  └──────────────────────────────────────────────────────────────────┘ │    │
│                                                                        │    │
│  ┌──────────────────┐                                                  │    │
│  │   Frontend       │──────────────────────────────────────────────────┘    │
│  │   (React)        │  API calls via plugin.repository.ts                   │
│  └──────────────────┘                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Marketplace

### Remote Repository

Plugins are stored in a separate GitHub repository:

```
Repository: bluewave-labs/plugin-marketplace
Manifest URL: https://raw.githubusercontent.com/bluewave-labs/plugin-marketplace/main/plugins.json
```

### Manifest Structure

```json
{
  "version": "1.0.0",
  "plugins": [
    {
      "key": "mlflow",
      "name": "mlflow",
      "displayName": "MLflow Integration",
      "description": "Sync AI/ML models from MLflow tracking server",
      "longDescription": "Full description for detail page...",
      "version": "1.0.0",
      "author": "VerifyWise",
      "category": "ml_ops",
      "iconUrl": "https://example.com/mlflow-icon.png",
      "documentationUrl": "https://docs.example.com/mlflow",
      "supportUrl": "https://support.example.com",
      "isOfficial": true,
      "isPublished": true,
      "requiresConfiguration": true,
      "installationType": "npm",
      "features": [
        {
          "name": "Model Sync",
          "description": "Automatically sync models from MLflow",
          "displayOrder": 1
        }
      ],
      "tags": ["mlflow", "ml", "model-tracking"],
      "pluginPath": "plugins/mlflow",
      "entryPoint": "index.ts",
      "dependencies": {
        "axios": "^1.6.0"
      }
    }
  ],
  "categories": [
    {
      "id": "ml_ops",
      "name": "ML Operations",
      "description": "Machine learning operations and model management"
    }
  ]
}
```

### Plugin Categories

| Category | ID | Description |
|----------|-----|-------------|
| Communication | `communication` | Slack, email integrations |
| ML Operations | `ml_ops` | MLflow, model tracking |
| Version Control | `version_control` | GitHub, GitLab |
| Monitoring | `monitoring` | Observability tools |
| Security | `security` | Security scanning |
| Data Management | `data_management` | Risk import, data tools |
| Analytics | `analytics` | Reporting, dashboards |

---

## Database Schema

### Plugin Installations Table

Each tenant has a `plugin_installations` table in their schema:

```sql
CREATE TABLE "{tenantId}".plugin_installations (
    id SERIAL PRIMARY KEY,
    plugin_key VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'installed'
        CHECK (status IN ('installed')),
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    configuration JSONB,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups
CREATE INDEX idx_plugin_installations_key_{tenantId}
    ON "{tenantId}".plugin_installations(plugin_key);
```

### Migration

**File:** `Servers/database/migrations/20251226151729-create-plugin-installations-table.js`

The migration iterates through all organizations and creates the table in each tenant schema:

```javascript
async up(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    const organizations = await queryInterface.sequelize.query(
      `SELECT id FROM organizations;`,
      { transaction }
    );

    for (let organization of organizations[0]) {
      const tenantHash = getTenantHash(organization.id);
      await queryInterface.sequelize.query(`
        CREATE TABLE "${tenantHash}".plugin_installations (...)
      `, { transaction });

      // Add index
      await queryInterface.sequelize.query(`
        CREATE INDEX idx_plugin_installations_key_${tenantHash}
        ON "${tenantHash}".plugin_installations(plugin_key);
      `, { transaction });
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

---

## Backend Implementation

### Enums

**File:** `Servers/domain.layer/enums/plugin.enum.ts`

```typescript
export enum PluginInstallationStatus {
  INSTALLED = "installed",
}
```

### Interfaces

**File:** `Servers/domain.layer/interfaces/i.pluginInstallation.ts`

```typescript
export interface IPluginInstallation {
  id?: number;
  plugin_key: string;              // References plugin from marketplace by key
  status: PluginInstallationStatus;
  installed_at?: Date;
  uninstalled_at?: Date;
  error_message?: string;
  configuration?: any;             // JSONB - plugin-specific config
  metadata?: any;                  // JSONB - additional data
  created_at?: Date;
  updated_at?: Date;
}
```

### Model Class

**File:** `Servers/domain.layer/models/plugin/pluginInstallation.model.ts`

Uses raw SQL queries to interact with tenant-scoped tables:

```typescript
export class PluginInstallationModel {
  // Create a new plugin installation
  static async createInstallation(
    plugin_key: string,
    organization_id: number
  ): Promise<IPluginInstallation>;

  // Find installation by plugin key
  static async findByPlugin(
    plugin_key: string,
    organization_id: number
  ): Promise<IPluginInstallation | null>;

  // Get all installed plugins for an organization
  static async getInstalledPlugins(
    organization_id: number
  ): Promise<IPluginInstallation[]>;

  // Find installation by ID
  static async findById(
    id: number,
    organization_id: number
  ): Promise<IPluginInstallation | null>;

  // Find installation by ID with validation (throws if not found)
  static async findByIdWithValidation(
    id: number,
    organization_id: number
  ): Promise<IPluginInstallation>;

  // Update installation status
  static async updateStatus(
    id: number,
    organization_id: number,
    status: PluginInstallationStatus
  ): Promise<IPluginInstallation>;

  // Delete installation
  static async delete(
    id: number,
    organization_id: number
  ): Promise<void>;

  // Update configuration
  static async updateConfiguration(
    id: number,
    organization_id: number,
    configuration: any
  ): Promise<IPluginInstallation>;

  // Convert snake_case to camelCase for frontend
  static toJSON(installation: IPluginInstallation): any;
}
```

### Database Utilities

**File:** `Servers/utils/pluginInstallation.utils.ts`

Provides utility functions that use `tenantId` string directly:

```typescript
// Create a new plugin installation
export async function createInstallation(
  plugin_key: string,
  tenantId: string
): Promise<IPluginInstallation>;

// Find installation by plugin key
export async function findByPlugin(
  plugin_key: string,
  tenantId: string
): Promise<IPluginInstallation | null>;

// Get all installed plugins for a tenant
export async function getInstalledPlugins(
  tenantId: string
): Promise<IPluginInstallation[]>;

// Find installation by ID
export async function findById(
  id: number,
  tenantId: string
): Promise<IPluginInstallation | null>;

// Find installation by ID with validation (throws NotFoundException if not found)
export async function findByIdWithValidation(
  id: number,
  tenantId: string
): Promise<IPluginInstallation>;

// Update installation status
export async function updateStatus(
  id: number,
  tenantId: string,
  status: PluginInstallationStatus
): Promise<IPluginInstallation>;

// Delete installation
export async function deleteInstallation(
  id: number,
  tenantId: string
): Promise<void>;

// Update configuration
export async function updateConfiguration(
  id: number,
  tenantId: string,
  configuration: any
): Promise<IPluginInstallation>;

// Convert snake_case to camelCase for frontend
export function toJSON(installation: IPluginInstallation): any {
  return {
    id: installation.id,
    pluginKey: installation.plugin_key,
    status: installation.status,
    installedAt: installation.installed_at,
    uninstalledAt: installation.uninstalled_at,
    errorMessage: installation.error_message,
    configuration: installation.configuration,
    metadata: installation.metadata,
    createdAt: installation.created_at,
    updatedAt: installation.updated_at,
  };
}
```

### Plugin Service

**File:** `Servers/services/plugin/pluginService.ts`

Core service handling all plugin operations:

#### Public Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getAllPlugins` | `category?: string` | `Plugin[]` | Fetch all published plugins from marketplace |
| `getPluginByKey` | `pluginKey: string` | `Plugin \| null` | Get single plugin by key |
| `searchPlugins` | `query: string` | `Plugin[]` | Search by name, description, tags |
| `installPlugin` | `pluginKey, userId, tenantId` | `IPluginInstallation` | Install plugin and execute `install()` |
| `uninstallPlugin` | `installationId, userId, tenantId` | `void` | Uninstall and execute `uninstall()` |
| `getInstalledPlugins` | `tenantId` | `PluginInstallation[]` | List installed with marketplace metadata |
| `getCategories` | - | `Category[]` | Get plugin categories |
| `updateConfiguration` | `installationId, userId, tenantId, config` | `IPluginInstallation` | Update config and call `configure()` |
| `testConnection` | `pluginKey, configuration, context?` | `{success, message}` | Test plugin connection |
| `connectOAuthWorkspace` | `pluginKey, code, userId, tenantId` | `Workspace` | Connect Slack OAuth |
| `getOAuthWorkspaces` | `pluginKey, userId, tenantId` | `Workspace[]` | List connected workspaces |
| `updateOAuthWorkspace` | `pluginKey, webhookId, userId, tenantId, data` | `Workspace` | Update workspace settings |
| `disconnectOAuthWorkspace` | `pluginKey, webhookId, userId, tenantId` | `void` | Disconnect workspace |
| `getMLflowModels` | `tenantId` | `Model[]` | Get synced MLflow models |
| `syncMLflowModels` | `tenantId` | `{success, modelCount}` | Sync from MLflow server |
| `getRiskImportTemplate` | `tenantId, organizationId` | `{buffer, filename}` | Generate Excel template |
| `importRisks` | `csvData[], tenantId` | `{success, imported, failed}` | Import risks from CSV |

#### Private Methods

| Method | Description |
|--------|-------------|
| `fetchRemoteMarketplace()` | Fetch plugins.json from GitHub |
| `loadPluginCode(plugin)` | Download and require plugin code |
| `downloadAndLoadPlugin(plugin)` | Download, cache, install deps, load |
| `downloadPluginPackageJson(plugin, tempPath)` | Download package.json |
| `installPluginDependencies(plugin, tempPath, packageJson)` | Run `npm install` |
| `validateSlackOAuth(code)` | Exchange code for access token |
| `inviteBotToChannel(token, channelId, botUserId)` | Invite bot to Slack channel |

#### Plugin Loading Flow

```typescript
private static async downloadAndLoadPlugin(plugin: Plugin): Promise<any> {
  // 1. Setup paths
  const tempPath = path.join(__dirname, "../../../temp/plugins", plugin.key);
  const entryPointPath = path.join(tempPath, plugin.entryPoint);

  // 2. Check cache (5-day TTL)
  const CACHE_DURATION_MS = 5 * 24 * 60 * 60 * 1000;
  let shouldDownload = true;

  if (fs.existsSync(entryPointPath)) {
    const stats = fs.statSync(entryPointPath);
    if (Date.now() - stats.mtimeMs < CACHE_DURATION_MS) {
      shouldDownload = false;
    }
  }

  // 3. Download if needed
  if (shouldDownload) {
    fs.mkdirSync(tempPath, { recursive: true });

    // 3a. Download package.json
    const packageJson = await this.downloadPluginPackageJson(plugin, tempPath);

    // 3b. Download entry point
    const baseUrl = PLUGIN_MARKETPLACE_URL.replace("/plugins.json", "");
    const pluginUrl = `${baseUrl}/${plugin.pluginPath}/${plugin.entryPoint}`;
    const response = await axios.get(pluginUrl);
    fs.writeFileSync(entryPointPath, response.data);

    // 3c. Install dependencies
    await this.installPluginDependencies(plugin, tempPath, packageJson);
  }

  // 4. Register ts-node for TypeScript support
  if (plugin.entryPoint.endsWith(".ts")) {
    require("ts-node/register");
  }

  // 5. Add plugin's node_modules to require paths
  const pluginNodeModulesPath = path.join(tempPath, "node_modules");
  if (fs.existsSync(pluginNodeModulesPath)) {
    const Module = require('module');
    const originalResolveLookupPaths = Module._resolveLookupPaths;
    Module._resolveLookupPaths = function(request, parent) {
      const paths = originalResolveLookupPaths.call(this, request, parent);
      if (paths && !paths.includes(pluginNodeModulesPath)) {
        paths.push(pluginNodeModulesPath);
      }
      return paths;
    };
  }

  // 6. Clear require cache and load
  delete require.cache[require.resolve(entryPointPath)];
  return require(entryPointPath);
}
```

#### Dependency Installation

```typescript
private static async installPluginDependencies(
  plugin: Plugin,
  tempPath: string,
  packageJson: any
): Promise<void> {
  if (!packageJson.dependencies || Object.keys(packageJson.dependencies).length === 0) {
    return;
  }

  const nodeModulesPath = path.join(tempPath, "node_modules");
  if (fs.existsSync(nodeModulesPath)) {
    return; // Already installed
  }

  // Install using npm
  execSync("npm install --prefer-offline --no-audit --no-fund --production", {
    cwd: tempPath,
    stdio: "pipe",
    timeout: 60000, // 60 second timeout
  });
}
```

### Controller

**File:** `Servers/controllers/plugin.ctrl.ts`

HTTP request handlers with structured logging:

| Function | HTTP | Description |
|----------|------|-------------|
| `getAllPlugins` | GET /marketplace | List marketplace plugins |
| `getPluginByKey` | GET /marketplace/:key | Get single plugin |
| `searchPlugins` | GET /marketplace/search | Search plugins |
| `installPlugin` | POST /install | Install plugin |
| `uninstallPlugin` | DELETE /installations/:id | Uninstall plugin |
| `getInstalledPlugins` | GET /installations | List installed |
| `getCategories` | GET /categories | List categories |
| `updatePluginConfiguration` | PUT /installations/:id/configuration | Update config |
| `testPluginConnection` | POST /:key/test-connection | Test connection |
| `connectOAuthWorkspace` | POST /:key/oauth/connect | OAuth connect |
| `getOAuthWorkspaces` | GET /:key/oauth/workspaces | List workspaces |
| `updateOAuthWorkspace` | PATCH /:key/oauth/workspaces/:webhookId | Update workspace |
| `disconnectOAuthWorkspace` | DELETE /:key/oauth/workspaces/:webhookId | Disconnect |
| `getMLflowModels` | GET /:key/models | Get MLflow models |
| `syncMLflowModels` | POST /:key/sync | Sync MLflow |
| `getRiskImportTemplate` | GET /:key/template | Get Excel template |
| `importRisks` | POST /:key/import | Import risks |

#### Request Context

Controllers extract user context from JWT middleware:

```typescript
const userId = (req as any).userId;
const organizationId = (req as any).organizationId;
const tenantId = (req as any).tenantId;
```

#### Response Format

All responses use `STATUS_CODE` helper:

```typescript
return res.status(200).json(STATUS_CODE[200](data));
return res.status(201).json(STATUS_CODE[201](data));
return res.status(400).json(STATUS_CODE[400]("Error message"));
return res.status(401).json(STATUS_CODE[401]("User not authenticated"));
return res.status(404).json(STATUS_CODE[404]("Not found"));
return res.status(500).json(STATUS_CODE[500](error.message));
```

#### Structured Logging

```typescript
logStructured("processing", "starting getAllPlugins", functionName, fileName);
logStructured("successful", `${plugins.length} plugins found`, functionName, fileName);
logStructured("error", "failed to retrieve plugins", functionName, fileName);
```

### Routes

**File:** `Servers/routes/plugin.route.ts`

```typescript
import express from "express";
import rateLimit from "express-rate-limit";
import authenticateJWT from "../middleware/auth.middleware";

const router = express.Router();

// Rate limiter for plugin installation (prevent abuse)
const installPluginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 20, // limit each IP to 20 install requests per hour
  message: {
    error: "Too many plugin installation requests from this IP, please try again after an hour.",
  },
});

// Marketplace routes
router.get("/marketplace", authenticateJWT, getAllPlugins);
router.get("/marketplace/:key", authenticateJWT, getPluginByKey);
router.get("/marketplace/search", authenticateJWT, searchPlugins);
router.get("/categories", authenticateJWT, getCategories);

// Installation management routes
router.post("/install", authenticateJWT, installPluginLimiter, installPlugin);
router.delete("/installations/:id", authenticateJWT, uninstallPlugin);
router.get("/installations", authenticateJWT, getInstalledPlugins);
router.put("/installations/:id/configuration", authenticateJWT, updatePluginConfiguration);
router.post("/:key/test-connection", authenticateJWT, testPluginConnection);

// OAuth workspace management routes (Slack plugin)
router.post("/:key/oauth/connect", authenticateJWT, connectOAuthWorkspace);
router.get("/:key/oauth/workspaces", authenticateJWT, getOAuthWorkspaces);
router.patch("/:key/oauth/workspaces/:webhookId", authenticateJWT, updateOAuthWorkspace);
router.delete("/:key/oauth/workspaces/:webhookId", authenticateJWT, disconnectOAuthWorkspace);

// MLflow plugin routes
router.get("/:key/models", authenticateJWT, getMLflowModels);
router.post("/:key/sync", authenticateJWT, syncMLflowModels);

// Risk Import plugin routes
router.get("/:key/template", authenticateJWT, getRiskImportTemplate);
router.post("/:key/import", authenticateJWT, importRisks);

export default router;
```

---

## API Endpoints

**Base Path:** `/api/plugins`

### Marketplace

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/marketplace` | List all published plugins | JWT |
| GET | `/marketplace/:key` | Get plugin by key | JWT |
| GET | `/marketplace/search?q=` | Search plugins | JWT |
| GET | `/categories` | Get plugin categories | JWT |

### Installation Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/install` | Install plugin | JWT |
| GET | `/installations` | List installed plugins | JWT |
| DELETE | `/installations/:id` | Uninstall plugin | JWT |
| PUT | `/installations/:id/configuration` | Update configuration | JWT |
| POST | `/:key/test-connection` | Test plugin connection | JWT |

### OAuth (Slack)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/:key/oauth/connect` | Connect OAuth workspace | JWT |
| GET | `/:key/oauth/workspaces` | Get connected workspaces | JWT |
| PATCH | `/:key/oauth/workspaces/:webhookId` | Update workspace settings | JWT |
| DELETE | `/:key/oauth/workspaces/:webhookId` | Disconnect workspace | JWT |

### Plugin-Specific

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/:key/models` | Get MLflow models | JWT |
| POST | `/:key/sync` | Sync MLflow models | JWT |
| GET | `/:key/template` | Get risk import template | JWT |
| POST | `/:key/import` | Import risks from CSV | JWT |

### Rate Limiting

| Endpoint | Limit |
|----------|-------|
| Plugin installation | 20 req/hour per IP |

---

## Plugin Interface

Plugins must export functions that the system calls during lifecycle events.

### Required Methods

```typescript
/**
 * Called when plugin is installed
 * Use to create database tables, initialize data
 */
export async function install(
  userId: number,
  tenantId: string,
  config: Record<string, any>,
  context: { sequelize: Sequelize }
): Promise<{ success: boolean; message?: string }>;

/**
 * Called when plugin is uninstalled
 * Use to clean up database tables, remove data
 */
export async function uninstall(
  userId: number,
  tenantId: string,
  context: { sequelize: Sequelize }
): Promise<{ success: boolean; message?: string }>;
```

### Optional Methods

```typescript
/**
 * Called when configuration is updated
 */
export async function configure(
  userId: number,
  tenantId: string,
  configuration: Record<string, any>,
  context: { sequelize: Sequelize }
): Promise<{ success: boolean; message?: string }>;

/**
 * Called to test plugin connection
 */
export async function testConnection(
  configuration: Record<string, any>,
  context?: { sequelize: Sequelize; userId: number; tenantId: string }
): Promise<{ success: boolean; message: string }>;

/**
 * Plugin-specific methods (examples)
 */
export async function syncModels(
  tenantId: string,
  configuration: Record<string, any>,
  context: { sequelize: Sequelize }
): Promise<{ success: boolean; modelCount: number }>;

export async function getExcelTemplate(
  organizationId: string,
  context: { sequelize: Sequelize }
): Promise<{ buffer: Buffer; filename: string }>;

export async function importRisks(
  csvData: any[],
  tenantId: string,
  context: { sequelize: Sequelize }
): Promise<{ success: boolean; imported: number; failed: number }>;
```

### Example Plugin Implementation

```typescript
// plugins/mlflow/index.ts
import { QueryTypes, Sequelize } from "sequelize";

interface PluginContext {
  sequelize: Sequelize;
}

export async function install(
  userId: number,
  tenantId: string,
  config: Record<string, any>,
  context: PluginContext
): Promise<{ success: boolean; message?: string }> {
  const { sequelize } = context;

  // Create plugin-specific table
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${tenantId}".mlflow_model_records (
      id SERIAL PRIMARY KEY,
      model_name VARCHAR(255) NOT NULL,
      version VARCHAR(50),
      stage VARCHAR(50),
      run_id VARCHAR(100),
      source VARCHAR(500),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  return { success: true, message: "MLflow plugin installed" };
}

export async function uninstall(
  userId: number,
  tenantId: string,
  context: PluginContext
): Promise<{ success: boolean; message?: string }> {
  const { sequelize } = context;

  // Drop plugin-specific table
  await sequelize.query(`
    DROP TABLE IF EXISTS "${tenantId}".mlflow_model_records
  `);

  return { success: true, message: "MLflow plugin uninstalled" };
}

export async function testConnection(
  configuration: Record<string, any>,
  context?: PluginContext
): Promise<{ success: boolean; message: string }> {
  const { tracking_server_url } = configuration;

  try {
    const response = await fetch(
      `${tracking_server_url}/api/2.0/mlflow/experiments/list`
    );
    if (response.ok) {
      return { success: true, message: "Connection successful" };
    }
    return { success: false, message: "Failed to connect to MLflow server" };
  } catch (error: any) {
    return { success: false, message: `Connection error: ${error.message}` };
  }
}

export async function syncModels(
  tenantId: string,
  configuration: Record<string, any>,
  context: PluginContext
): Promise<{ success: boolean; modelCount: number }> {
  const { sequelize } = context;
  const { tracking_server_url } = configuration;

  // Fetch models from MLflow
  const response = await fetch(
    `${tracking_server_url}/api/2.0/mlflow/registered-models/list`
  );
  const data = await response.json();
  const models = data.registered_models || [];

  // Upsert models into database
  for (const model of models) {
    await sequelize.query(`
      INSERT INTO "${tenantId}".mlflow_model_records (model_name, version, updated_at)
      VALUES (:name, :version, NOW())
      ON CONFLICT (model_name) DO UPDATE SET version = :version, updated_at = NOW()
    `, {
      replacements: {
        name: model.name,
        version: model.latest_versions?.[0]?.version
      },
      type: QueryTypes.INSERT,
    });
  }

  return { success: true, modelCount: models.length };
}
```

---

## Frontend Implementation

### Types

**File:** `Clients/src/domain/types/plugins.ts`

```typescript
export enum PluginCategory {
  COMMUNICATION = "communication",
  ML_OPS = "ml_ops",
  VERSION_CONTROL = "version_control",
  MONITORING = "monitoring",
  SECURITY = "security",
  DATA_MANAGEMENT = "data_management",
  ANALYTICS = "analytics",
}

export enum PluginInstallationStatus {
  INSTALLING = "installing",
  INSTALLED = "installed",
  FAILED = "failed",
  UNINSTALLING = "uninstalling",
  UNINSTALLED = "uninstalled",
}

export interface PluginFeature {
  name: string;
  description: string;
  displayOrder: number;
}

export interface Plugin {
  key: string;
  name: string;
  displayName: string;
  description: string;
  longDescription?: string;
  version: string;
  author?: string;
  category: PluginCategory;
  iconUrl?: string;
  documentationUrl?: string;
  supportUrl?: string;
  isOfficial: boolean;
  isPublished: boolean;
  requiresConfiguration: boolean;
  installationType: string;
  features: PluginFeature[];
  tags: string[];
  pluginPath?: string;
  entryPoint?: string;
  // Installation-specific fields (merged when fetching)
  installationId?: number;
  installationStatus?: PluginInstallationStatus;
  installedAt?: string;
}

export interface PluginInstallation {
  id: number;
  pluginKey: string;
  userId?: number;
  tenantId?: number;
  status: PluginInstallationStatus;
  installedAt?: string;
  uninstalledAt?: string;
  errorMessage?: string;
  configuration?: any;
  metadata?: any;
  plugin?: Plugin;
  createdAt?: string;
  updatedAt?: string;
}

export interface PluginCategoryInfo {
  id: string;
  name: string;
  description: string;
}
```

### Repository (API Client)

**File:** `Clients/src/application/repository/plugin.repository.ts`

```typescript
// Get all available plugins from marketplace
export async function getAllPlugins({
  category,
  signal,
  responseType = "json",
}: {
  category?: string;
  signal?: AbortSignal;
  responseType?: string;
}): Promise<Plugin[]>;

// Get plugin by key
export async function getPluginByKey({
  key,
  signal,
  responseType = "json",
}: {
  key: string;
  signal?: AbortSignal;
  responseType?: string;
}): Promise<Plugin>;

// Search plugins
export async function searchPlugins({
  query,
  signal,
  responseType = "json",
}: {
  query: string;
  signal?: AbortSignal;
  responseType?: string;
}): Promise<Plugin[]>;

// Install a plugin
export async function installPlugin({
  pluginKey,
}: {
  pluginKey: string;
}): Promise<PluginInstallation>;

// Uninstall a plugin
export async function uninstallPlugin({
  installationId,
}: {
  installationId: number;
}): Promise<any>;

// Get installed plugins for current user
export async function getInstalledPlugins({
  signal,
  responseType = "json",
}?: {
  signal?: AbortSignal;
  responseType?: string;
}): Promise<PluginInstallation[]>;

// Get plugin categories
export async function getCategories({
  signal,
  responseType = "json",
}?: {
  signal?: AbortSignal;
  responseType?: string;
}): Promise<PluginCategoryInfo[]>;

// Update plugin configuration
export async function updatePluginConfiguration({
  installationId,
  configuration,
}: {
  installationId: number;
  configuration: Record<string, any>;
}): Promise<PluginInstallation>;

// Test plugin connection
export async function testPluginConnection({
  pluginKey,
  configuration,
}: {
  pluginKey: string;
  configuration: Record<string, any>;
}): Promise<any>;

// Connect OAuth workspace (Slack)
export async function connectOAuthWorkspace({
  pluginKey,
  code,
}: {
  pluginKey: string;
  code: string;
}): Promise<any>;

// Get OAuth workspaces (Slack)
export async function getOAuthWorkspaces({
  pluginKey,
  signal,
}: {
  pluginKey: string;
  signal?: AbortSignal;
}): Promise<any[]>;

// Update OAuth workspace (Slack routing types)
export async function updateOAuthWorkspace({
  pluginKey,
  webhookId,
  routing_type,
  is_active,
}: {
  pluginKey: string;
  webhookId: number;
  routing_type?: string[];
  is_active?: boolean;
}): Promise<any>;

// Disconnect OAuth workspace (Slack)
export async function disconnectOAuthWorkspace({
  pluginKey,
  webhookId,
}: {
  pluginKey: string;
  webhookId: number;
}): Promise<void>;
```

### Hooks

#### usePlugins

**File:** `Clients/src/application/hooks/usePlugins.ts`

Fetches marketplace plugins merged with installation status:

```typescript
export function usePlugins(category?: string) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const fetchPlugins = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch both marketplace and installed plugins
        const [marketplacePlugins, installedPlugins] = await Promise.all([
          getAllPlugins({ category }),
          getInstalledPlugins().catch(() => []),
        ]);

        // Create a map of installed plugins by key
        const installedMap = new Map(
          installedPlugins.map((inst) => [
            inst.plugin?.key || inst.pluginKey,
            {
              installationId: inst.id,
              status: inst.status,
            },
          ])
        );

        // Merge installation status into marketplace plugins
        const mergedPlugins = marketplacePlugins.map((plugin) => {
          const installation = installedMap.get(plugin.key);
          if (installation) {
            return {
              ...plugin,
              installationId: installation.installationId,
              installationStatus: installation.status,
            };
          }
          return plugin;
        });

        setPlugins(mergedPlugins);
      } catch (err: any) {
        setError(err.message || "Failed to fetch plugins");
      } finally {
        setLoading(false);
      }
    };

    fetchPlugins();
  }, [category, refetchTrigger]);

  const refetch = () => setRefetchTrigger((n) => n + 1);

  return { plugins, loading, error, refetch };
}
```

#### usePluginInstallation

**File:** `Clients/src/application/hooks/usePluginInstallation.ts`

Install/uninstall actions with loading states:

```typescript
export function usePluginInstallation() {
  const [installingKeys, setInstallingKeys] = useState<Set<string>>(new Set());
  const [uninstallingIds, setUninstallingIds] = useState<Set<number>>(new Set());

  const install = async (pluginKey: string) => {
    setInstallingKeys((prev) => new Set(prev).add(pluginKey));
    try {
      const installation = await installPlugin({ pluginKey });
      return installation;
    } finally {
      setInstallingKeys((prev) => {
        const next = new Set(prev);
        next.delete(pluginKey);
        return next;
      });
    }
  };

  const uninstall = async (installationId: number) => {
    setUninstallingIds((prev) => new Set(prev).add(installationId));
    try {
      await uninstallPlugin({ installationId });
    } finally {
      setUninstallingIds((prev) => {
        const next = new Set(prev);
        next.delete(installationId);
        return next;
      });
    }
  };

  const isInstalling = (pluginKey: string) => installingKeys.has(pluginKey);
  const isUninstalling = (id: number) => uninstallingIds.has(id);

  return { install, uninstall, isInstalling, isUninstalling };
}
```

#### useIsPluginInstalled

**File:** `Clients/src/application/hooks/useIsPluginInstalled.ts`

Check if specific plugin is installed:

```typescript
export function useIsPluginInstalled(pluginKey: string) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [installationId, setInstallationId] = useState<number | null>(null);

  useEffect(() => {
    const checkInstallation = async () => {
      setLoading(true);
      try {
        const installedPlugins = await getInstalledPlugins();
        const installation = installedPlugins.find(
          (p) =>
            (p.plugin?.key || p.pluginKey) === pluginKey &&
            p.status === PluginInstallationStatus.INSTALLED
        );
        setIsInstalled(!!installation);
        setInstallationId(installation?.id || null);
      } catch (error) {
        setIsInstalled(false);
        setInstallationId(null);
      } finally {
        setLoading(false);
      }
    };

    checkInstallation();
  }, [pluginKey]);

  return { isInstalled, loading, installationId };
}
```

### Components

#### PluginGate

**File:** `Clients/src/presentation/components/PluginGate/index.tsx`

Conditionally render content based on plugin installation:

```tsx
interface PluginGateProps {
  pluginKey: string;
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
}

export const PluginGate: React.FC<PluginGateProps> = ({
  pluginKey,
  children,
  fallback = null,
  loading: loadingContent = null,
}) => {
  const { isInstalled, loading } = useIsPluginInstalled(pluginKey);

  if (loading) {
    return <>{loadingContent}</>;
  }

  return <>{isInstalled ? children : fallback}</>;
};

// Usage example
<PluginGate pluginKey="mlflow" fallback={<InstallPrompt />}>
  <MLFlowDataTable />
</PluginGate>
```

#### PluginCard

**File:** `Clients/src/presentation/components/PluginCard/index.tsx`

Display plugin with install/manage/uninstall actions:

```tsx
interface PluginCardProps {
  plugin: Plugin;
  onUninstall?: (installationId: number) => Promise<void>;
  onManage?: (plugin: Plugin) => void;
  loading?: boolean;
}

const PluginCard: React.FC<PluginCardProps> = ({
  plugin,
  onUninstall,
  onManage,
  loading,
}) => {
  // Renders plugin card with:
  // - Plugin icon
  // - Name and description
  // - Features list
  // - Installation status chip (installed/installing/failed)
  // - Menu actions: Manage, Uninstall (for installed plugins)
  // - Click navigates to plugin management page
};
```

### Pages

#### Plugins Page

**File:** `Clients/src/presentation/pages/Plugins/index.tsx`

**Route:** `/plugins`

Two tabs:
1. **Marketplace** - Browse available plugins with category filter
2. **My Plugins** - View installed plugins

#### PluginManagement Page

**File:** `Clients/src/presentation/pages/Plugins/PluginManagement/index.tsx`

**Route:** `/plugins/:pluginKey/manage`

Features:
- Plugin details (name, description, features)
- Install/Uninstall buttons
- Configuration form (plugin-specific fields)
- Test connection button
- OAuth workspace management (Slack)
- Sync controls (MLflow)

---

## Current Plugins

### MLflow Integration

**Key:** `mlflow`
**Category:** ML Operations

Syncs AI/ML model metadata from MLflow tracking servers.

**Configuration:**

| Field | Type | Description |
|-------|------|-------------|
| `tracking_server_url` | URL | MLflow server URL |
| `auth_method` | select | none / basic / token |
| `username` | text | For basic auth |
| `password` | password | For basic auth |
| `api_token` | password | For token auth |
| `verify_ssl` | checkbox | Verify SSL certificates |
| `timeout` | number | Request timeout (seconds) |

**Methods:**
- `install()` - Creates `mlflow_model_records` table
- `uninstall()` - Drops table
- `testConnection()` - Tests server connectivity
- `syncModels()` - Syncs model metadata

### Slack Integration

**Key:** `slack`
**Category:** Communication

Sends team notifications via Slack OAuth webhooks.

**OAuth Flow:**

1. User clicks "Add to Slack"
2. Redirects to Slack OAuth consent
3. Callback with authorization code
4. Backend exchanges code for access token
5. Webhook URL stored encrypted (base64)
6. Bot invited to selected channel

**Workspace Management:**
- Connect multiple workspaces
- Configure notification routing types
- Enable/disable workspaces
- Disconnect workspaces

**Routing Types:**
- Membership and roles
- Projects and organizations
- Policy reminders and status
- Evidence and task alerts
- Control or policy changes

**Data Storage:**
Workspaces stored in `public.slack_webhooks` table (not tenant-scoped):

```sql
INSERT INTO public.slack_webhooks (
  access_token,        -- base64 encoded
  scope,
  team_name,
  team_id,
  channel,
  channel_id,
  configuration_url,
  url,                 -- base64 encoded webhook URL
  user_id,
  is_active,
  routing_type         -- string array
)
```

### Risk Import

**Key:** `risk-import`
**Category:** Data Management

Bulk import risks from Excel/CSV files.

**Methods:**
- `getExcelTemplate()` - Generate template with project columns
- `importRisks()` - Parse and import risk records

---

## Plugin Marketplace Repository

The plugin marketplace is a separate Git repository that contains all plugin implementations and the marketplace manifest.

### Repository Structure

```
plugin-marketplace/
├── .git/
├── .gitignore
├── package.json              # Root dev dependencies (TypeScript)
├── tsconfig.json             # TypeScript configuration
├── plugins.json              # Marketplace manifest (registry)
├── README.md                 # Repository documentation
└── plugins/                  # Plugin implementations
    ├── slack/
    │   ├── index.ts          # Plugin implementation
    │   ├── package.json      # Plugin dependencies
    │   ├── README.md         # Plugin documentation
    │   └── ui/               # Optional UI components
    │       └── src/
    ├── mlflow/
    │   ├── index.ts
    │   ├── package.json
    │   ├── README.md
    │   └── ui/
    │       └── src/
    └── risk-import/
        ├── index.ts
        ├── package.json
        ├── README.md
        └── ui/
            └── src/
```

### Root Configuration Files

#### package.json (Root)

```json
{
  "devDependencies": {
    "@types/node": "^25.0.3",
    "typescript": "^5.9.3"
  }
}
```

#### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "types": ["node"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["plugins/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

#### .gitignore

```
node_modules/
dist/
build/
.env
.vscode/
.idea/
*.log
coverage/
.cache/
!plugins/**/*.js
```

### Marketplace Manifest (plugins.json)

The `plugins.json` file is the central registry that defines all available plugins.

#### Complete Manifest Structure

```json
{
  "version": "1.0.0",
  "plugins": [
    {
      "key": "plugin-key",
      "name": "Plugin Name",
      "displayName": "Plugin Display Name",
      "description": "Short description (1-2 sentences)",
      "longDescription": "Detailed description for the plugin detail page...",
      "version": "1.0.0",
      "author": "VerifyWise",
      "category": "category_id",
      "iconUrl": "/assets/plugin_logo.svg",
      "documentationUrl": "https://docs.verifywise.com/integrations/plugin",
      "supportUrl": "https://support.verifywise.com",
      "isOfficial": true,
      "isPublished": true,
      "requiresConfiguration": true,
      "installationType": "standard|tenant_scoped",
      "features": [
        {
          "name": "Feature Name",
          "description": "Feature description",
          "displayOrder": 1
        }
      ],
      "tags": ["tag1", "tag2", "tag3"],
      "pluginPath": "plugins/plugin-key",
      "entryPoint": "index.ts",
      "dependencies": {
        "package-name": "^1.0.0"
      }
    }
  ],
  "categories": [
    {
      "id": "category_id",
      "name": "Category Name",
      "description": "Category description"
    }
  ]
}
```

#### Installation Types

| Type | Description | Use Case |
|------|-------------|----------|
| `standard` | Uses shared/public tables | OAuth integrations (Slack), global configs |
| `tenant_scoped` | Creates tables in tenant schema | Data storage per organization (MLflow, Risk Import) |

#### Available Categories

| Category ID | Name | Description |
|-------------|------|-------------|
| `communication` | Communication | Team communication and notifications |
| `ml_ops` | ML Operations | Machine learning workflows and models |
| `version_control` | Version Control | Git integrations |
| `monitoring` | Monitoring | System and application monitoring |
| `security` | Security | Security and compliance tools |
| `data_management` | Data Management | Data import, export, and management |

---

## Plugin Development Guide

### Plugin Interface (TypeScript Types)

Every plugin must implement these types and export specific functions:

```typescript
// ========== TYPE DEFINITIONS ==========

interface PluginContext {
  sequelize: any; // Sequelize instance for database access
}

interface PluginMetadata {
  name: string;
  version: string;
  author: string;
  description: string;
}

interface InstallResult {
  success: boolean;
  message: string;
  installedAt: string;
}

interface UninstallResult {
  success: boolean;
  message: string;
  uninstalledAt: string;
}

interface ConfigureResult {
  success: boolean;
  message: string;
  configuredAt: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface TestConnectionResult {
  success: boolean;
  message: string;
  testedAt: string;
}
```

### Required Exports

Every plugin MUST export these functions:

```typescript
// Required: Called when plugin is installed
export async function install(
  userId: number,
  tenantId: string,
  config: YourConfigType,
  context: PluginContext
): Promise<InstallResult>;

// Required: Called when plugin is uninstalled
export async function uninstall(
  userId: number,
  tenantId: string,
  context: PluginContext
): Promise<UninstallResult>;

// Required: Plugin metadata
export const metadata: PluginMetadata;
```

### Optional Exports

```typescript
// Optional: Called when configuration is saved
export async function configure(
  userId: number,
  tenantId: string,
  config: YourConfigType,
  context: PluginContext
): Promise<ConfigureResult>;

// Optional: Validate configuration before saving
export function validateConfig(config: YourConfigType): ValidationResult;

// Optional: Test connection to external service
export async function testConnection(
  config: YourConfigType,
  context?: { sequelize: any; userId: number; tenantId: string }
): Promise<TestConnectionResult>;

// Optional: Plugin-specific methods
export async function syncModels(...): Promise<SyncResult>;
export async function importData(...): Promise<ImportResult>;
```

---

## Complete Plugin Templates

### Template 1: Standard Plugin (OAuth-based, like Slack)

Use this template for plugins that use OAuth authentication and store data in public tables.

#### package.json

```json
{
  "name": "@verifywise/plugin-my-service",
  "version": "1.0.0",
  "description": "My Service integration plugin for VerifyWise",
  "main": "index.js",
  "author": "VerifyWise",
  "license": "MIT",
  "dependencies": {
    "@my-service/web-api": "^1.0.0"
  },
  "keywords": ["verifywise", "plugin", "my-service", "integration"]
}
```

#### index.ts

```typescript
/**
 * My Service Plugin for VerifyWise
 *
 * This plugin provides My Service integration for notifications.
 */

// Type declaration for Node.js Buffer global
declare const Buffer: {
  from(str: string, encoding?: string): { toString(encoding?: string): string };
};

// ========== TYPE DEFINITIONS ==========

interface PluginContext {
  sequelize: any;
}

interface PluginMetadata {
  name: string;
  version: string;
  author: string;
  description: string;
}

interface InstallResult {
  success: boolean;
  message: string;
  installedAt: string;
}

interface UninstallResult {
  success: boolean;
  message: string;
  uninstalledAt: string;
}

interface ConfigureResult {
  success: boolean;
  message: string;
  configuredAt: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface MyServiceConfig {
  routing_type?: string[];
  // Add your config fields here
}

// ========== CONSTANTS ==========

const VALID_ROUTING_TYPES = [
  "Membership and roles",
  "Projects and organizations",
  "Policy reminders and status",
  "Evidence and task alerts",
  "Control or policy changes",
];

// ========== PLUGIN LIFECYCLE METHODS ==========

/**
 * Install the plugin
 * For OAuth plugins, no tables needed - uses existing OAuth flow
 */
export async function install(
  _userId: number,
  _tenantId: string,
  _config: MyServiceConfig,
  _context: PluginContext
): Promise<InstallResult> {
  try {
    return {
      success: true,
      message: "Plugin installed successfully. Configure OAuth to connect.",
      installedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Installation failed: ${error.message}`);
  }
}

/**
 * Uninstall the plugin
 */
export async function uninstall(
  userId: number,
  _tenantId: string,
  context: PluginContext
): Promise<UninstallResult> {
  try {
    const { sequelize } = context;

    // Clean up OAuth configurations
    const result: any = await sequelize.query(
      `DELETE FROM public.my_service_webhooks WHERE user_id = :userId`,
      { replacements: { userId } }
    );

    const deletedCount = result[0]?.rowCount || 0;

    return {
      success: true,
      message: `Plugin uninstalled. Removed ${deletedCount} configuration(s).`,
      uninstalledAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Uninstallation failed: ${error.message}`);
  }
}

/**
 * Configure the plugin
 */
export async function configure(
  userId: number,
  _tenantId: string,
  config: MyServiceConfig,
  context: PluginContext
): Promise<ConfigureResult> {
  try {
    const { sequelize } = context;

    if (config.routing_type && config.routing_type.length > 0) {
      const routingTypeArray = `{${config.routing_type.map((t: string) => `"${t}"`).join(",")}}`;

      await sequelize.query(
        `UPDATE public.my_service_webhooks
         SET routing_type = :routing_type, updated_at = NOW()
         WHERE user_id = :userId`,
        { replacements: { userId, routing_type: routingTypeArray } }
      );
    }

    return {
      success: true,
      message: "Configuration saved.",
      configuredAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Configuration failed: ${error.message}`);
  }
}

/**
 * Validate configuration
 */
export function validateConfig(config: MyServiceConfig): ValidationResult {
  const errors: string[] = [];

  if (!config) {
    return { valid: true, errors };
  }

  if (config.routing_type) {
    const invalidTypes = config.routing_type.filter(
      (type) => VALID_ROUTING_TYPES.indexOf(type) === -1
    );
    if (invalidTypes.length > 0) {
      errors.push(`Invalid routing types: ${invalidTypes.join(", ")}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Test connection
 */
export async function testConnection(
  _config: MyServiceConfig,
  context?: { sequelize: any; userId: number }
): Promise<{ success: boolean; message: string; testedAt: string }> {
  try {
    if (!context?.sequelize || !context?.userId) {
      return {
        success: true,
        message: "Plugin installed. Connect via OAuth.",
        testedAt: new Date().toISOString(),
      };
    }

    const { sequelize, userId } = context;

    const result: any = await sequelize.query(
      `SELECT COUNT(*) as count FROM public.my_service_webhooks
       WHERE user_id = :userId AND is_active = true`,
      { replacements: { userId } }
    );

    const count = parseInt(result[0]?.[0]?.count || "0");

    return {
      success: count > 0,
      message: count > 0 ? `${count} connection(s) active` : "No connections. Configure OAuth.",
      testedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Connection check failed: ${error.message}`,
      testedAt: new Date().toISOString(),
    };
  }
}

// ========== PLUGIN METADATA ==========

export const metadata: PluginMetadata = {
  name: "My Service",
  version: "1.0.0",
  author: "VerifyWise",
  description: "My Service integration for notifications",
};
```

---

### Template 2: Tenant-Scoped Plugin with Database Table (like MLflow)

Use this template for plugins that need to store data per organization.

#### package.json

```json
{
  "name": "@verifywise/plugin-my-data-service",
  "version": "1.0.0",
  "description": "My Data Service integration plugin for VerifyWise",
  "main": "index.js",
  "author": "VerifyWise",
  "license": "MIT",
  "dependencies": {
    "axios": "^1.6.0"
  },
  "keywords": ["verifywise", "plugin", "my-data-service", "integration"]
}
```

#### index.ts

```typescript
/**
 * My Data Service Plugin for VerifyWise
 *
 * This plugin syncs data from an external service and stores it per-tenant.
 */

declare const Buffer: {
  from(str: string): { toString(encoding: string): string };
};

// ========== TYPE DEFINITIONS ==========

interface PluginContext {
  sequelize: any;
}

interface PluginMetadata {
  name: string;
  version: string;
  author: string;
  description: string;
}

interface InstallResult {
  success: boolean;
  message: string;
  installedAt: string;
}

interface UninstallResult {
  success: boolean;
  message: string;
  uninstalledAt: string;
}

interface ConfigureResult {
  success: boolean;
  message: string;
  configuredAt: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface TestConnectionResult {
  success: boolean;
  message: string;
  serverVersion: string;
  testedAt: string;
}

interface SyncResult {
  success: boolean;
  recordCount: number;
  syncedAt: string;
  status: string;
}

interface MyServiceConfig {
  server_url?: string;
  auth_method?: "none" | "basic" | "token";
  username?: string;
  password?: string;
  api_token?: string;
  verify_ssl?: boolean;
  timeout?: number;
}

// ========== PLUGIN LIFECYCLE METHODS ==========

/**
 * Install the plugin - creates tenant-specific table
 */
export async function install(
  _userId: number,
  tenantId: string,
  config: MyServiceConfig,
  context: PluginContext
): Promise<InstallResult> {
  try {
    const { sequelize } = context;

    // Create tenant-specific table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "${tenantId}".my_service_records (
        id SERIAL PRIMARY KEY,
        record_name VARCHAR(255) NOT NULL,
        record_type VARCHAR(255),
        status VARCHAR(255),
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        external_id VARCHAR(255),
        last_synced_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT my_service_records_unique UNIQUE (record_name, external_id)
      )
    `);

    // Perform initial sync if config provided
    if (config?.server_url) {
      const testResult = await testConnection(config);
      if (!testResult.success) {
        throw new Error(`Connection test failed: ${testResult.message}`);
      }

      const syncResult = await syncRecords(tenantId, config, context);
      if (!syncResult.success) {
        throw new Error(`Initial sync failed: ${syncResult.status}`);
      }

      return {
        success: true,
        message: `Plugin installed. Synced ${syncResult.recordCount} records.`,
        installedAt: new Date().toISOString(),
      };
    }

    return {
      success: true,
      message: "Plugin installed. Configure server URL to start syncing.",
      installedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Installation failed: ${error.message}`);
  }
}

/**
 * Uninstall the plugin - drops tenant-specific table
 */
export async function uninstall(
  _userId: number,
  tenantId: string,
  context: PluginContext
): Promise<UninstallResult> {
  try {
    const { sequelize } = context;

    // Count records before deletion
    const countResult: any = await sequelize.query(
      `SELECT COUNT(*) as count FROM "${tenantId}".my_service_records`
    );
    const totalRecords = parseInt(countResult[0][0].count);

    // Drop table
    await sequelize.query(
      `DROP TABLE IF EXISTS "${tenantId}".my_service_records CASCADE`
    );

    return {
      success: true,
      message: `Plugin uninstalled. Removed ${totalRecords} records.`,
      uninstalledAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Uninstallation failed: ${error.message}`);
  }
}

/**
 * Configure the plugin
 */
export async function configure(
  _userId: number,
  tenantId: string,
  config: MyServiceConfig,
  context: PluginContext
): Promise<ConfigureResult> {
  try {
    const validation = validateConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(", ")}`);
    }

    const testResult = await testConnection(config);
    if (!testResult.success) {
      throw new Error(`Connection test failed: ${testResult.message}`);
    }

    const syncResult = await syncRecords(tenantId, config, context);
    if (!syncResult.success) {
      throw new Error(`Sync failed: ${syncResult.status}`);
    }

    return {
      success: true,
      message: `Configured successfully. Synced ${syncResult.recordCount} records.`,
      configuredAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Configuration failed: ${error.message}`);
  }
}

/**
 * Validate configuration
 */
export function validateConfig(config: MyServiceConfig): ValidationResult {
  const errors: string[] = [];

  if (!config) {
    errors.push("Configuration is required");
    return { valid: false, errors };
  }

  if (!config.server_url) {
    errors.push("Server URL is required");
  }

  if (!config.auth_method) {
    errors.push("Authentication method is required");
  }

  if (config.auth_method === "basic") {
    if (!config.username || !config.password) {
      errors.push("Username and password required for basic auth");
    }
  }

  if (config.auth_method === "token") {
    if (!config.api_token) {
      errors.push("API token required for token auth");
    }
  }

  if (config.timeout && (config.timeout < 1 || config.timeout > 300)) {
    errors.push("Timeout must be between 1 and 300 seconds");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Test connection
 */
export async function testConnection(
  config: MyServiceConfig
): Promise<TestConnectionResult> {
  try {
    if (!config.server_url) {
      throw new Error("Server URL is required");
    }

    const headers = buildHeaders(config);
    const baseUrl = config.server_url.replace(/\/$/, "");

    const response = await fetch(`${baseUrl}/api/v1/health`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }

    return {
      success: true,
      message: "Successfully connected to server",
      serverVersion: "1.0+",
      testedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      serverVersion: "unknown",
      testedAt: new Date().toISOString(),
    };
  }
}

/**
 * Sync records from external service
 */
export async function syncRecords(
  tenantId: string,
  config: MyServiceConfig,
  context: PluginContext
): Promise<SyncResult> {
  try {
    if (!config.server_url) {
      throw new Error("Server URL is required");
    }

    const { sequelize } = context;
    const headers = buildHeaders(config);
    const baseUrl = config.server_url.replace(/\/$/, "");

    // Fetch data from external API
    const response = await fetch(`${baseUrl}/api/v1/records`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const data = await response.json();
    const records = data.records || [];

    if (!records.length) {
      return {
        success: true,
        recordCount: 0,
        syncedAt: new Date().toISOString(),
        status: "no_records",
      };
    }

    // Persist records using bulk upsert
    await persistRecords(records, tenantId, sequelize);

    return {
      success: true,
      recordCount: records.length,
      syncedAt: new Date().toISOString(),
      status: "success",
    };
  } catch (error: any) {
    return {
      success: false,
      recordCount: 0,
      syncedAt: new Date().toISOString(),
      status: `failed: ${error.message}`,
    };
  }
}

// ========== HELPER FUNCTIONS ==========

/**
 * Build authentication headers
 */
function buildHeaders(config: MyServiceConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.auth_method === "basic" && config.username && config.password) {
    const credentials = Buffer.from(
      `${config.username}:${config.password}`
    ).toString("base64");
    headers["Authorization"] = `Basic ${credentials}`;
  } else if (config.auth_method === "token" && config.api_token) {
    headers["Authorization"] = `Bearer ${config.api_token}`;
  }

  return headers;
}

/**
 * Persist records to database with upsert
 */
async function persistRecords(
  records: any[],
  tenantId: string,
  sequelize: any
): Promise<void> {
  if (!records.length) return;

  const now = new Date();

  for (const record of records) {
    await sequelize.query(
      `INSERT INTO "${tenantId}".my_service_records
       (record_name, record_type, status, data, external_id, last_synced_at, updated_at)
       VALUES (:record_name, :record_type, :status, :data, :external_id, :last_synced_at, :updated_at)
       ON CONFLICT (record_name, external_id) DO UPDATE SET
         record_type = EXCLUDED.record_type,
         status = EXCLUDED.status,
         data = EXCLUDED.data,
         last_synced_at = EXCLUDED.last_synced_at,
         updated_at = EXCLUDED.updated_at`,
      {
        replacements: {
          record_name: record.name,
          record_type: record.type || null,
          status: record.status || null,
          data: JSON.stringify(record.data || {}),
          external_id: record.id || null,
          last_synced_at: now,
          updated_at: now,
        },
      }
    );
  }
}

// ========== PLUGIN METADATA ==========

export const metadata: PluginMetadata = {
  name: "My Data Service",
  version: "1.0.0",
  author: "VerifyWise",
  description: "My Data Service integration for data sync",
};
```

---

### Template 3: Data Import Plugin with Excel (like Risk Import)

Use this template for plugins that import data from files.

#### package.json

```json
{
  "name": "@verifywise/plugin-data-import",
  "version": "1.0.0",
  "description": "Data import plugin for VerifyWise",
  "main": "index.js",
  "author": "VerifyWise",
  "license": "MIT",
  "dependencies": {
    "exceljs": "^4.4.0"
  },
  "keywords": ["verifywise", "plugin", "import", "excel", "data-management"]
}
```

#### index.ts (Key sections)

```typescript
/**
 * Data Import Plugin for VerifyWise
 *
 * Provides Excel import with dropdown validation.
 */

import * as ExcelJS from "exceljs";

// ========== TYPE DEFINITIONS ==========

interface PluginContext {
  sequelize: any;
}

interface ExcelTemplateResult {
  success: boolean;
  buffer: any;
  filename: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; field: string; message: string }>;
  importedAt: string;
}

interface DataRow {
  name: string;
  type: string;
  // Add your fields here
}

// ========== ENUM DEFINITIONS ==========

const TYPE_VALUES = ["Type A", "Type B", "Type C"];
const STATUS_VALUES = ["Active", "Inactive", "Pending"];

// ========== PLUGIN LIFECYCLE METHODS ==========

export async function install(
  _userId: number,
  _tenantId: string,
  _config: any,
  _context: PluginContext
): Promise<InstallResult> {
  try {
    // No tables needed - works with existing tables
    return {
      success: true,
      message: "Plugin installed. You can now import data via Excel.",
      installedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Installation failed: ${error.message}`);
  }
}

export async function uninstall(
  _userId: number,
  _tenantId: string,
  _context: PluginContext
): Promise<UninstallResult> {
  try {
    return {
      success: true,
      message: "Plugin uninstalled.",
      uninstalledAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Uninstallation failed: ${error.message}`);
  }
}

// ========== EXCEL TEMPLATE GENERATION ==========

export async function getExcelTemplate(
  organizationId: string,
  context: PluginContext
): Promise<ExcelTemplateResult> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Data Import");

  // Fetch users for dropdown
  let users: Array<{ id: number; name: string; email: string }> = [];
  try {
    const result = await context.sequelize.query(
      "SELECT id, name, surname, email FROM public.users WHERE organization_id = :organizationId",
      { replacements: { organizationId }, type: context.sequelize.QueryTypes.SELECT }
    );
    users = result as any;
  } catch (error) {
    console.error("Error fetching users:", error);
  }

  // Define headers
  const headers = [
    { key: "name", header: "Name *", width: 30 },
    { key: "type", header: "Type *", width: 20 },
    { key: "owner", header: "Owner *", width: 30 },
    { key: "status", header: "Status", width: 20 },
    { key: "due_date", header: "Due Date", width: 20 },
  ];

  worksheet.columns = headers;

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF13715B" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 25;

  // Create user dropdown options
  const userOptions = users.map(
    (u) => `${u.name} - ${u.email} (ID: ${u.id})`
  );

  // Add dropdown validation helper
  const addDropdown = (col: number, values: string[], startRow = 2, endRow = 1000) => {
    for (let row = startRow; row <= endRow; row++) {
      worksheet.getCell(row, col).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`"${values.join(",")}"`],
        showErrorMessage: true,
        errorStyle: "error",
        errorTitle: "Invalid Value",
        error: "Please select from dropdown",
      };
    }
  };

  // Add date validation helper
  const addDateValidation = (col: number, startRow = 2, endRow = 1000) => {
    for (let row = startRow; row <= endRow; row++) {
      const cell = worksheet.getCell(row, col);
      cell.dataValidation = {
        type: "date",
        allowBlank: true,
        operator: "greaterThan",
        formulae: [new Date(1900, 0, 1)],
        showErrorMessage: true,
        errorTitle: "Invalid Date",
        error: "Please enter valid date",
      };
      cell.numFmt = "yyyy-mm-dd";
    }
  };

  // Apply validations
  addDropdown(2, TYPE_VALUES);        // Type column
  if (userOptions.length > 0) {
    addDropdown(3, userOptions);      // Owner column
  }
  addDropdown(4, STATUS_VALUES);      // Status column
  addDateValidation(5);               // Due Date column

  // Freeze header row
  worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: 1 }];

  // Add sample data
  const sampleUser = userOptions.length > 0 ? userOptions[0] : "Select user";
  worksheet.addRow({
    name: "Example Item",
    type: "Type A",
    owner: sampleUser,
    status: "Active",
    due_date: "2025-12-31",
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return {
    success: true,
    buffer,
    filename: "import_template.xlsx",
  };
}

// ========== DATA IMPORT ==========

function parseUserId(value: any): number | null {
  if (!value) return null;
  const strValue = String(value);
  if (!isNaN(Number(strValue))) return Number(strValue);
  const match = strValue.match(/\(ID:\s*(\d+)\)/);
  return match?.[1] ? Number(match[1]) : null;
}

function validateRow(
  row: Partial<DataRow>,
  rowIndex: number
): Array<{ row: number; field: string; message: string }> {
  const errors: Array<{ row: number; field: string; message: string }> = [];

  if (!row.name?.trim()) {
    errors.push({ row: rowIndex, field: "name", message: "Name is required" });
  }

  if (row.type && TYPE_VALUES.indexOf(row.type) === -1) {
    errors.push({
      row: rowIndex,
      field: "type",
      message: `Invalid type. Must be: ${TYPE_VALUES.join(", ")}`,
    });
  }

  return errors;
}

export async function importData(
  data: Partial<DataRow>[],
  tenantId: string,
  context: PluginContext
): Promise<ImportResult> {
  const { sequelize } = context;
  const errors: Array<{ row: number; field: string; message: string }> = [];
  let imported = 0;
  let failed = 0;

  try {
    // Validate all rows first
    data.forEach((row, index) => {
      errors.push(...validateRow(row, index + 2));
    });

    if (errors.length > 0) {
      return {
        success: false,
        imported: 0,
        failed: data.length,
        errors,
        importedAt: new Date().toISOString(),
      };
    }

    // Import each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        await sequelize.query(
          `INSERT INTO "${tenantId}".your_table (name, type, created_at)
           VALUES (:name, :type, NOW())`,
          {
            replacements: {
              name: row.name?.trim(),
              type: row.type || null,
            },
          }
        );
        imported++;
      } catch (error: any) {
        failed++;
        errors.push({
          row: i + 2,
          field: "general",
          message: `Import failed: ${error.message}`,
        });
      }
    }

    return {
      success: imported > 0,
      imported,
      failed,
      errors,
      importedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    throw new Error(`Import failed: ${error.message}`);
  }
}

// ========== PLUGIN METADATA ==========

export const metadata: PluginMetadata = {
  name: "Data Import",
  version: "1.0.0",
  author: "VerifyWise",
  description: "Import data from Excel files",
};
```

---

## Slack Plugin: Notification Routing Types

The Slack plugin uses routing types to filter notifications:

```typescript
const VALID_ROUTING_TYPES = [
  "Membership and roles",
  "Projects and organizations",
  "Policy reminders and status",
  "Evidence and task alerts",
  "Control or policy changes",
];
```

### Notification Functions

```typescript
// Send by routing type
export async function sendNotificationByRoutingType(
  userId: number,
  routingType: string,
  message: { title: string; message: string },
  sequelize: any
): Promise<void>;

// Specific notification helpers
export async function notifyControlPolicyChange(userId, changeData, sequelize): Promise<void>;
export async function notifyEvidenceTaskAlert(userId, alertData, sequelize): Promise<void>;
export async function notifyPolicyReminderStatus(userId, policyData, sequelize): Promise<void>;
export async function notifyMembershipRoles(userId, memberData, sequelize): Promise<void>;
export async function notifyProjectOrganization(userId, projectData, sequelize): Promise<void>;
```

---

## Risk Import Plugin: Enums Reference

### AI Lifecycle Phases

```typescript
const AI_LIFECYCLE_PHASES = [
  "Problem definition & planning",
  "Data collection & processing",
  "Model development & training",
  "Model validation & testing",
  "Deployment & integration",
  "Monitoring & maintenance",
  "Decommissioning & retirement",
];
```

### Likelihood Values

```typescript
const LIKELIHOOD_VALUES = ["Rare", "Unlikely", "Possible", "Likely", "Almost Certain"];
```

### Severity Values

```typescript
const SEVERITY_VALUES = ["Negligible", "Minor", "Moderate", "Major", "Catastrophic"];
```

### Risk Severity Values

```typescript
const RISK_SEVERITY_VALUES = ["Negligible", "Minor", "Moderate", "Major", "Critical"];
```

### Risk Level Values

```typescript
const RISK_LEVEL_VALUES = [
  "No risk",
  "Very low risk",
  "Low risk",
  "Medium risk",
  "High risk",
  "Very high risk",
];
```

### Mitigation Status Values

```typescript
const MITIGATION_STATUS_VALUES = [
  "Not Started",
  "In Progress",
  "Completed",
  "On Hold",
  "Deferred",
  "Canceled",
  "Requires review",
];
```

### Risk Category Values

```typescript
const RISK_CATEGORY_VALUES = [
  "Strategic risk",
  "Operational risk",
  "Compliance risk",
  "Financial risk",
  "Cybersecurity risk",
  "Reputational risk",
  "Legal risk",
  "Technological risk",
  "Third-party/vendor risk",
  "Environmental risk",
  "Human resources risk",
  "Geopolitical risk",
  "Fraud risk",
  "Data privacy risk",
  "Health and safety risk",
];
```

### Risk Level Calculation

```typescript
function calculateRiskLevel(likelihood: string, severity: string): string {
  const likelihoodMap: Record<string, number> = {
    Rare: 1, Unlikely: 2, Possible: 3, Likely: 4, "Almost Certain": 5,
  };
  const severityMap: Record<string, number> = {
    Negligible: 1, Minor: 2, Moderate: 3, Major: 4, Catastrophic: 5,
  };

  const score = (likelihoodMap[likelihood] * 1) + (severityMap[severity] * 3);

  if (score <= 4) return "Very low risk";
  if (score <= 8) return "Low risk";
  if (score <= 12) return "Medium risk";
  if (score <= 16) return "High risk";
  return "Very high risk";
}
```

---

## Security Considerations

### Remote Code Execution

Plugins are downloaded and executed via `require()`. Security measures:

1. **Trusted Source:** Only fetch from verified marketplace repository
2. **Cache Isolation:** Each plugin cached in separate directory
3. **Tenant Isolation:** Plugin data stored in tenant-scoped schemas
4. **Context Injection:** Only `sequelize` instance passed to plugins
5. **Timeout:** npm install has 60-second timeout

### OAuth Security

- Access tokens stored encrypted (base64)
- Webhook URLs stored encrypted (base64)
- CSRF protection via state parameter
- User ownership verified before modifications

### Configuration Storage

- Plugin configurations stored as JSONB
- Sensitive fields should be encrypted by plugin
- Never expose raw credentials to frontend

### Validation

All inputs validated with custom exceptions:

```typescript
throw new ValidationException("Plugin key is required", "plugin_key", plugin_key);
throw new NotFoundException("Plugin installation not found", "installation", id);
```

---

## Adding a New Plugin (Step-by-Step)

### Step 1: Create Plugin Directory

```bash
cd plugin-marketplace
mkdir -p plugins/my-plugin/ui/src
```

### Step 2: Create package.json

```json
{
  "name": "@verifywise/plugin-my-plugin",
  "version": "1.0.0",
  "description": "My Plugin for VerifyWise",
  "main": "index.js",
  "author": "VerifyWise",
  "license": "MIT",
  "dependencies": {
    // Add your dependencies here
  },
  "keywords": ["verifywise", "plugin", "my-plugin"]
}
```

### Step 3: Create index.ts

Use one of the templates above based on your plugin type:
- **OAuth/Standard plugin**: Use Template 1 (Slack-like)
- **Tenant-scoped with database**: Use Template 2 (MLflow-like)
- **Data import from files**: Use Template 3 (Risk Import-like)

Minimum required exports:

```typescript
// REQUIRED: Install function
export async function install(
  userId: number,
  tenantId: string,
  config: any,
  context: { sequelize: any }
): Promise<{ success: boolean; message: string; installedAt: string }> {
  // Your installation logic
  return {
    success: true,
    message: "Plugin installed successfully",
    installedAt: new Date().toISOString(),
  };
}

// REQUIRED: Uninstall function
export async function uninstall(
  userId: number,
  tenantId: string,
  context: { sequelize: any }
): Promise<{ success: boolean; message: string; uninstalledAt: string }> {
  // Your cleanup logic
  return {
    success: true,
    message: "Plugin uninstalled successfully",
    uninstalledAt: new Date().toISOString(),
  };
}

// REQUIRED: Metadata
export const metadata = {
  name: "My Plugin",
  version: "1.0.0",
  author: "VerifyWise",
  description: "Description of my plugin",
};
```

### Step 4: Add to plugins.json Manifest

```json
{
  "key": "my-plugin",
  "name": "My Plugin",
  "displayName": "My Plugin",
  "description": "Short description (shown in card)",
  "longDescription": "Detailed description (shown in detail page)...",
  "version": "1.0.0",
  "author": "VerifyWise",
  "category": "data_management",
  "iconUrl": "/assets/my_plugin_logo.svg",
  "documentationUrl": "https://docs.verifywise.com/integrations/my-plugin",
  "supportUrl": "https://support.verifywise.com",
  "isOfficial": true,
  "isPublished": true,
  "requiresConfiguration": true,
  "installationType": "tenant_scoped",
  "features": [
    {
      "name": "Feature 1",
      "description": "What this feature does",
      "displayOrder": 1
    },
    {
      "name": "Feature 2",
      "description": "What this feature does",
      "displayOrder": 2
    }
  ],
  "tags": ["my-plugin", "integration", "data"],
  "pluginPath": "plugins/my-plugin",
  "entryPoint": "index.ts",
  "dependencies": {
    "axios": "^1.6.0"
  }
}
```

### Step 5: Create README.md

```markdown
# My Plugin

## Overview
Description of what the plugin does.

## Features
- Feature 1
- Feature 2

## Configuration
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| server_url | URL | Yes | Server URL |
| api_key | Password | Yes | API key |

## Usage
Instructions on how to use the plugin.

## Database Schema
If tenant-scoped, document the tables created.

## Troubleshooting
Common issues and solutions.
```

### Step 6: Add Frontend Configuration (if needed)

Update `Clients/src/presentation/pages/Plugins/PluginManagement/index.tsx`:

```typescript
const getConfigFields = () => {
  if (pluginKey === "my-plugin") {
    return [
      {
        key: "server_url",
        label: "Server URL",
        type: "url",
        placeholder: "https://api.example.com",
        required: true,
      },
      {
        key: "api_key",
        label: "API Key",
        type: "password",
        placeholder: "Enter your API key",
        required: true,
      },
      {
        key: "sync_interval",
        label: "Sync Interval (minutes)",
        type: "number",
        placeholder: "60",
        required: false,
      },
    ];
  }
  // ... existing plugins
};
```

### Step 7: Test Your Plugin

1. Install dependencies:
   ```bash
   cd plugins/my-plugin
   npm install
   ```

2. Compile TypeScript:
   ```bash
   cd ../..
   npx tsc
   ```

3. Test locally:
   - Set `PLUGIN_MARKETPLACE_URL` to local path
   - Or copy plugins.json and plugin folder to VerifyWise server

4. Test in VerifyWise:
   - Navigate to `/plugins`
   - Find your plugin in Marketplace
   - Install and configure
   - Test all functionality

### Step 8: Commit and Push

```bash
git add .
git commit -m "feat: add my-plugin integration"
git push origin your-branch
```

### Checklist

- [ ] `package.json` with correct dependencies
- [ ] `index.ts` with all required exports
- [ ] `install()` creates tables (if tenant-scoped)
- [ ] `uninstall()` drops tables and cleans up
- [ ] `validateConfig()` validates all required fields
- [ ] `testConnection()` tests external service (if applicable)
- [ ] `plugins.json` entry with all fields
- [ ] `README.md` with documentation
- [ ] Frontend config fields (if `requiresConfiguration: true`)
- [ ] Tested install/uninstall cycle
- [ ] Tested configuration
- [ ] Tested main functionality

---

## Key Files

### Backend

| File | Purpose |
|------|---------|
| `Servers/services/plugin/pluginService.ts` | Core plugin service with all operations |
| `Servers/controllers/plugin.ctrl.ts` | HTTP handlers with logging |
| `Servers/routes/plugin.route.ts` | Route definitions with rate limiting |
| `Servers/utils/pluginInstallation.utils.ts` | Database utility functions |
| `Servers/domain.layer/models/plugin/pluginInstallation.model.ts` | Model class with raw SQL |
| `Servers/domain.layer/interfaces/i.pluginInstallation.ts` | TypeScript interface |
| `Servers/domain.layer/enums/plugin.enum.ts` | Status enum |
| `Servers/database/migrations/20251226151729-create-plugin-installations-table.js` | Database migration |

### Frontend

| File | Purpose |
|------|---------|
| `Clients/src/domain/types/plugins.ts` | TypeScript types and enums |
| `Clients/src/application/repository/plugin.repository.ts` | API client functions |
| `Clients/src/application/hooks/usePlugins.ts` | Marketplace + installed plugins hook |
| `Clients/src/application/hooks/usePluginInstallation.ts` | Install/uninstall actions hook |
| `Clients/src/application/hooks/useIsPluginInstalled.ts` | Check installation status hook |
| `Clients/src/presentation/components/PluginGate/index.tsx` | Conditional rendering component |
| `Clients/src/presentation/components/PluginCard/index.tsx` | Plugin card component |
| `Clients/src/presentation/pages/Plugins/index.tsx` | Marketplace page |
| `Clients/src/presentation/pages/Plugins/PluginManagement/index.tsx` | Plugin detail/config page |

---

## Environment Variables

### Backend

```bash
# Slack OAuth (for Slack plugin)
SLACK_API_URL=https://slack.com/api/oauth.v2.access
SLACK_CLIENT_ID=your-client-id
SLACK_CLIENT_SECRET=your-client-secret
FRONTEND_URL=https://app.verifywise.ai
```

### Frontend

```bash
VITE_SLACK_CLIENT_ID=your-client-id
VITE_SLACK_URL=https://slack.com/oauth/v2/authorize
```

---

## Related Documentation

- [Architecture Overview](../architecture/overview.md)
- [Multi-tenancy](../architecture/multi-tenancy.md)
- [External Integrations](./integrations.md)
- [Automations](./automations.md)
- [API Endpoints](../api/endpoints.md)
