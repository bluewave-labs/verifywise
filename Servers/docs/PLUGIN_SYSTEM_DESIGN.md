# VerifyWise Plugin System Design

> This document outlines the proposed plugin architecture for VerifyWise, based on research of Countly's plugin system and best practices from other ecosystems.

## Table of Contents

1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Architecture](#architecture)
4. [Plugin Structure](#plugin-structure)
5. [Core Components](#core-components)
6. [Plugin Types](#plugin-types)
7. [Event System](#event-system)
8. [Filter System](#filter-system)
9. [UI Extension Points](#ui-extension-points)
10. [Metadata API](#metadata-api)
11. [Configuration Management](#configuration-management)
12. [Dependency Management](#dependency-management)
13. [Marketplace Integration](#marketplace-integration)
14. [Security Model](#security-model)
15. [Migration Path](#migration-path)
16. [Lessons from Countly](#lessons-from-countly)

---

## Overview

The VerifyWise Plugin System enables modular, extensible compliance management by allowing frameworks (EU AI Act, ISO 42001, etc.) and integrations (Slack, Jira, MLflow) to be loaded as independent plugins.

### Goals

- **Modularity**: Each compliance framework is a self-contained unit
- **Extensibility**: Third parties can create custom frameworks/integrations
- **Type Safety**: Full TypeScript support with compile-time validation
- **Maintainability**: Clear boundaries between core and plugins
- **Marketplace Ready**: Support for remote plugin installation

---

## Design Principles

### 1. TypeScript First
- All plugin interfaces are strongly typed
- Event payloads have explicit interfaces
- No magic strings for event names (use enums)

### 2. Small Core, Rich Plugins
- Core plugin manager: ~300 lines (not 3000 like Countly)
- Business logic lives in plugins, not core

### 3. Explicit Over Implicit
- Dependencies declared in manifest
- Version compatibility explicit
- No hidden coupling via event payload shapes

### 4. Fail Safe
- Missing plugin = graceful degradation
- Plugin errors don't crash the server
- Checksum verification for marketplace plugins

### 5. Testable
- Plugins must export test suites
- Core provides test utilities
- Isolated plugin contexts for testing

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VerifyWise Core                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Express   │  │  Sequelize  │  │   Config    │             │
│  │   Server    │  │     DB      │  │   Manager   │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
│                          ▼                                      │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Plugin Manager                          │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │ │
│  │  │  Registry   │ │  EventBus   │ │ MarketplaceClient   │  │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  Framework  │ │  Framework  │ │ Integration │
    │  Plugin:    │ │  Plugin:    │ │  Plugin:    │
    │  EU AI Act  │ │  ISO 42001  │ │    Slack    │
    └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Plugin Structure

### Directory Layout

```
plugins/
├── core/                          # Core plugin system
│   ├── types.ts                   # All TypeScript interfaces
│   ├── PluginManager.ts           # Main plugin orchestrator
│   ├── PluginRegistry.ts          # Plugin registration & lookup
│   ├── EventBus.ts                # Typed event system
│   ├── MarketplaceClient.ts       # GitHub marketplace integration
│   ├── PluginInstaller.ts         # Download & install logic
│   └── index.ts                   # Public exports
│
├── installed/                     # Downloaded plugins (gitignored)
│   ├── installed.json             # Manifest of installed plugins
│   ├── eu-ai-act@1.2.0/
│   └── iso-42001@1.0.0/
│
├── local/                         # Local development plugins
│   └── my-custom-framework/
│
└── builtin/                       # Bundled official plugins
    ├── eu-ai-act/
    ├── iso-42001/
    ├── iso-27001/
    └── nist-ai-rmf/
```

### Individual Plugin Structure

```
eu-ai-act/
├── manifest.json                  # Plugin metadata
├── index.ts                       # Main entry point
├── package.json                   # NPM dependencies (optional)
│
├── models/                        # Sequelize models
│   ├── AssessmentTopic.ts
│   ├── ControlCategory.ts
│   └── index.ts
│
├── services/                      # Business logic
│   ├── create.ts                  # Framework creation
│   ├── delete.ts                  # Framework deletion
│   ├── report.ts                  # Report generation
│   └── validation.ts              # Input validation
│
├── routes/                        # Express routes (optional)
│   └── index.ts
│
├── migrations/                    # Database migrations
│   ├── 001_initial.ts
│   └── 002_add_fields.ts
│
├── structure/                     # Static framework data
│   ├── topics.json
│   ├── questions.json
│   └── controls.json
│
└── tests/                         # Plugin tests
    ├── create.test.ts
    └── report.test.ts
```

---

## Core Components

### 1. Plugin Manifest (`manifest.json`)

```json
{
  "id": "eu-ai-act",
  "name": "EU AI Act Compliance",
  "description": "Complete EU AI Act compliance framework",
  "version": "1.2.0",
  "author": "VerifyWise",
  "authorUrl": "https://verifywise.ai",
  "license": "Apache-2.0",

  "type": "framework",
  "frameworkId": 1,

  "compatibility": {
    "minCoreVersion": "1.0.0",
    "maxCoreVersion": "2.0.0"
  },

  "dependencies": {
    "core": ">=1.0.0"
  },

  "config": {
    "defaultRiskLevel": {
      "type": "string",
      "enum": ["low", "medium", "high"],
      "default": "high",
      "description": "Default risk classification for new assessments"
    },
    "enableAIAssist": {
      "type": "boolean",
      "default": true,
      "description": "Enable AI-powered compliance suggestions"
    }
  },

  "permissions": [
    "database:read",
    "database:write",
    "events:emit",
    "config:read"
  ],

  "exports": {
    "routes": true,
    "models": true,
    "migrations": true
  }
}
```

### 2. Plugin Interface (`types.ts`)

```typescript
// ============ BASE PLUGIN ============
export interface Plugin {
  manifest: PluginManifest;

  // ======== LIFECYCLE HOOKS ========
  // Installation lifecycle (permanent, data-related)
  onInstall?(context: PluginContext): Promise<void>;    // First time plugin added
  onUninstall?(context: PluginContext): Promise<void>;  // Plugin permanently removed

  // Runtime lifecycle (temporary, session-related)
  onLoad?(context: PluginContext): Promise<void>;       // Server starting
  onUnload?(context: PluginContext): Promise<void>;     // Server stopping
  onEnable?(context: PluginContext): Promise<void>;     // Plugin turned on
  onDisable?(context: PluginContext): Promise<void>;    // Plugin turned off

  // Optional capabilities
  routes?(router: Router): void;
  models?(): ModelDefinition[];
  migrations?(): Migration[];
  eventHandlers?(): EventHandlerMap;
  filterHandlers?(): FilterHandlerMap;

  // UI Extension Points (for frontend plugins)
  ui?: PluginUIExtensions;
}

// ============ FRAMEWORK PLUGIN ============
export interface FrameworkPlugin extends Plugin {
  manifest: FrameworkManifest;

  // Required framework methods
  createForProject(
    projectId: number,
    tenant: string,
    transaction: Transaction,
    options?: FrameworkCreateOptions
  ): Promise<FrameworkData>;

  deleteForProject(
    projectFrameworkId: number,
    tenant: string,
    transaction: Transaction
  ): Promise<boolean>;

  getReportData(
    projectFrameworkId: number,
    tenant: string
  ): Promise<ReportData>;

  getStructure(): FrameworkStructure;

  // Optional framework methods
  validateCompliance?(data: unknown): ValidationResult;
  calculateProgress?(projectFrameworkId: number): Promise<ProgressInfo>;
}

// ============ INTEGRATION PLUGIN ============
export interface IntegrationPlugin extends Plugin {
  manifest: IntegrationManifest;

  // Required integration methods
  connect(credentials: unknown): Promise<ConnectionResult>;
  disconnect(): Promise<void>;
  testConnection(): Promise<boolean>;

  // Optional methods
  sync?(options: SyncOptions): Promise<SyncResult>;
  webhook?(payload: unknown): Promise<void>;
}

// ============ PLUGIN CONTEXT ============
export interface PluginContext {
  // Core services
  db: Database;
  logger: Logger;
  config: PluginConfig;
  storage: PluginStorage;  // File storage for plugin assets

  // Event system (fire-and-forget notifications)
  emit<E extends PluginEvent>(event: E, payload: EventPayloads[E]): Promise<void>;
  on<E extends PluginEvent>(event: E, handler: EventHandler<E>): void;

  // Filter system (data transformation pipeline)
  applyFilters<F extends PluginFilter>(filter: F, data: FilterPayloads[F]): Promise<FilterPayloads[F]>;
  addFilter<F extends PluginFilter>(filter: F, handler: FilterHandler<F>, priority?: number): void;

  // Metadata API (schemaless key-value storage)
  metadata: MetadataAPI;

  // Plugin access
  getPlugin<T extends Plugin>(id: string): T | undefined;
  isPluginEnabled(id: string): boolean;

  // Tenant context
  tenant: string;

  // HTTP context (if in request)
  request?: Request;
  response?: Response;
}
```

### 3. Plugin Manager

```typescript
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private eventBus: EventBus;
  private filterBus: FilterBus;
  private registry: PluginRegistry;
  private marketplace: MarketplaceClient;
  private metadataService: MetadataService;
  private uiRegistry: UIExtensionRegistry;

  // Installation lifecycle (permanent)
  async installPlugin(pluginId: string, version?: string): Promise<void>;  // Calls onInstall
  async uninstallPlugin(pluginId: string): Promise<void>;                  // Calls onUninstall

  // Runtime lifecycle (temporary)
  async loadAll(): Promise<void>;
  async loadPlugin(pluginId: string): Promise<void>;      // Calls onLoad
  async unloadPlugin(pluginId: string): Promise<void>;    // Calls onUnload

  // Enable/Disable (runtime toggle)
  async enablePlugin(id: string): Promise<void>;          // Calls onEnable
  async disablePlugin(id: string): Promise<void>;         // Calls onDisable
  isEnabled(id: string): boolean;

  // Access
  getPlugin<T extends Plugin>(id: string): T | undefined;
  getFrameworkPlugin(frameworkId: number): FrameworkPlugin | undefined;
  getAllPlugins(): Plugin[];
  getAllFrameworkPlugins(): FrameworkPlugin[];

  // Events (fire-and-forget)
  async emit<E extends PluginEvent>(event: E, payload: EventPayloads[E]): Promise<void>;

  // Filters (data transformation)
  async applyFilters<F extends PluginFilter>(filter: F, data: FilterPayloads[F]): Promise<FilterPayloads[F]>;

  // UI Extensions
  getUIExtensions(): UIExtensionManifest[];
  getNavigationItems(): NavigationItem[];
  getDashboardWidgets(): DashboardWidget[];
  getSettingsPages(): SettingsPage[];

  // Marketplace
  async installFromMarketplace(pluginId: string, version?: string): Promise<void>;
  async checkForUpdates(): Promise<UpdateInfo[]>;
}
```

---

## Plugin Types

### 1. Framework Plugins

Compliance frameworks like EU AI Act, ISO 42001, NIST AI RMF.

**Required exports:**
- `createForProject()` - Initialize framework for a project
- `deleteForProject()` - Remove framework from project
- `getReportData()` - Generate compliance report data
- `getStructure()` - Return framework structure (topics, questions, controls)

### 2. Integration Plugins

External service integrations like Slack, Jira, MLflow.

**Required exports:**
- `connect()` - Establish connection
- `disconnect()` - Clean up connection
- `testConnection()` - Verify credentials

### 3. Feature Plugins

Add-on features like advanced reporting, AI assistance.

**No required exports** - just hook into events as needed.

---

## Event System

### Available Events

```typescript
export enum PluginEvent {
  // Lifecycle
  PLUGIN_LOADED = "plugin:loaded",
  PLUGIN_UNLOADED = "plugin:unloaded",

  // Project
  PROJECT_CREATED = "project:created",
  PROJECT_UPDATED = "project:updated",
  PROJECT_DELETED = "project:deleted",

  // Framework
  FRAMEWORK_ADDED = "framework:added",
  FRAMEWORK_REMOVED = "framework:removed",
  FRAMEWORK_PROGRESS_CHANGED = "framework:progress_changed",

  // Assessment
  ASSESSMENT_UPDATED = "assessment:updated",
  QUESTION_ANSWERED = "question:answered",

  // Control
  CONTROL_UPDATED = "control:updated",
  SUBCONTROL_UPDATED = "subcontrol:updated",

  // Risk
  RISK_CREATED = "risk:created",
  RISK_UPDATED = "risk:updated",
  RISK_MITIGATED = "risk:mitigated",

  // User
  USER_LOGIN = "user:login",
  USER_LOGOUT = "user:logout",

  // Report
  REPORT_GENERATED = "report:generated",
  REPORT_EXPORTED = "report:exported",
}
```

### Typed Event Payloads

```typescript
export interface EventPayloads {
  [PluginEvent.PROJECT_CREATED]: {
    projectId: number;
    projectName: string;
    tenant: string;
    createdBy: number;
  };

  [PluginEvent.FRAMEWORK_ADDED]: {
    projectId: number;
    projectFrameworkId: number;
    frameworkId: number;
    frameworkName: string;
    tenant: string;
  };

  [PluginEvent.QUESTION_ANSWERED]: {
    projectId: number;
    questionId: number;
    answer: string;
    previousAnswer?: string;
    answeredBy: number;
    tenant: string;
  };

  // ... etc
}
```

### Event Handler Example

```typescript
// In a plugin's index.ts
export default {
  manifest: { ... },

  eventHandlers() {
    return {
      [PluginEvent.QUESTION_ANSWERED]: async (payload, context) => {
        // Recalculate compliance score
        const score = await calculateScore(payload.projectId);

        // Emit progress change
        await context.emit(PluginEvent.FRAMEWORK_PROGRESS_CHANGED, {
          projectId: payload.projectId,
          progress: score,
        });
      },

      [PluginEvent.PROJECT_DELETED]: async (payload, context) => {
        // Cleanup plugin-specific data
        await context.db.query(
          `DELETE FROM plugin_data WHERE project_id = ?`,
          [payload.projectId]
        );
      },
    };
  },
};
```

### Transaction-Aware Event Batching

Events should only be emitted **after** database transactions commit successfully. This prevents plugins from acting on data that might be rolled back.

#### Why This Matters

```typescript
// WITHOUT transaction awareness (BAD)
await transaction.start();
await db.insert(risk);
eventBus.emit('risk:created', risk);  // Plugin sends Slack notification
await transaction.rollback();          // Risk was never saved!
// User gets notified about a risk that doesn't exist

// WITH transaction awareness (GOOD)
await transaction.start();
await db.insert(risk);
// Event is queued, not emitted yet
await transaction.commit();
// NOW event is emitted - data is guaranteed to exist
```

#### EventBus Implementation with Transaction Support

```typescript
export class EventBus {
  private handlers: Map<PluginEvent, EventHandler[]> = new Map();

  /**
   * Emit an event, respecting transaction boundaries
   */
  async emit<E extends PluginEvent>(
    event: E,
    payload: EventPayloads[E],
    options?: { transaction?: Transaction }
  ): Promise<void> {
    const { transaction } = options || {};

    if (transaction) {
      // Queue event to emit after transaction commits
      this.queueForTransaction(transaction, event, payload);
    } else {
      // No transaction - emit immediately
      await this.dispatch(event, payload);
    }
  }

  /**
   * Queue events to emit after transaction commits
   */
  private queueForTransaction<E extends PluginEvent>(
    transaction: Transaction,
    event: E,
    payload: EventPayloads[E]
  ): void {
    // Initialize queue if needed
    if (!transaction._eventQueue) {
      transaction._eventQueue = [];

      // Register commit handler once per transaction
      transaction.afterCommit(async () => {
        for (const queued of transaction._eventQueue) {
          try {
            await this.dispatch(queued.event, queued.payload);
          } catch (error) {
            // Log but don't fail - event handlers shouldn't break commits
            console.error(`Event handler error for ${queued.event}:`, error);
          }
        }
      });
    }

    // Add to queue
    transaction._eventQueue.push({ event, payload });
  }

  /**
   * Actually dispatch event to handlers
   */
  private async dispatch<E extends PluginEvent>(
    event: E,
    payload: EventPayloads[E]
  ): Promise<void> {
    const handlers = this.handlers.get(event) || [];

    // Run handlers in parallel with error isolation
    await Promise.allSettled(
      handlers.map(handler => handler(payload))
    );
  }
}
```

#### Usage in Services

```typescript
// In a service that creates risks
async createRisk(data: CreateRiskInput, transaction: Transaction): Promise<Risk> {
  // Apply filters (sync, within transaction)
  const filtered = await this.pluginManager.applyFilters(
    PluginFilter.RISK_BEFORE_SAVE,
    { risk: data, isNew: true }
  );

  // Save to database (within transaction)
  const risk = await this.riskRepository.create(filtered.risk, { transaction });

  // Emit event (queued until transaction commits)
  await this.pluginManager.emit(
    PluginEvent.RISK_CREATED,
    { riskId: risk.id, projectId: risk.projectId },
    { transaction }
  );

  return risk;
  // When transaction.commit() is called, event is dispatched
  // If transaction.rollback() is called, event is discarded
}
```

#### Key Benefits

| Benefit | Description |
|---------|-------------|
| **Data Consistency** | Plugins never see uncommitted data |
| **No Ghost Events** | Rolled-back operations don't trigger handlers |
| **Batch Efficiency** | Multiple events in one transaction batch together |
| **Error Isolation** | Handler errors don't affect transaction commit |

---

## Filter System

Filters allow plugins to **transform data** as it flows through the system. Unlike events (fire-and-forget), filters pass data through a pipeline where each handler can modify and return the data.

### Events vs Filters

| Aspect | Events | Filters |
|--------|--------|---------|
| Purpose | Notify something happened | Transform data |
| Return value | None (void) | Modified data |
| Use case | Logging, side effects | Validation, enrichment |
| Flow | Broadcast | Pipeline |

### Filter Types

```typescript
export enum PluginFilter {
  // Risk filters
  RISK_BEFORE_SAVE = "risk:before_save",
  RISK_AFTER_LOAD = "risk:after_load",
  RISK_BEFORE_EXPORT = "risk:before_export",

  // Project filters
  PROJECT_BEFORE_SAVE = "project:before_save",
  PROJECT_AFTER_LOAD = "project:after_load",

  // Assessment filters
  ASSESSMENT_BEFORE_SAVE = "assessment:before_save",
  ASSESSMENT_CALCULATE_SCORE = "assessment:calculate_score",

  // Report filters
  REPORT_BEFORE_GENERATE = "report:before_generate",
  REPORT_AFTER_GENERATE = "report:after_generate",

  // User data filters
  USER_DATA_BEFORE_EXPORT = "user:data_before_export",

  // Control filters
  CONTROL_BEFORE_SAVE = "control:before_save",
  CONTROL_CALCULATE_STATUS = "control:calculate_status",

  // Navigation filters (for UI)
  NAVIGATION_ITEMS = "ui:navigation_items",
  DASHBOARD_WIDGETS = "ui:dashboard_widgets",
}
```

### Typed Filter Payloads

```typescript
export interface FilterPayloads {
  [PluginFilter.RISK_BEFORE_SAVE]: {
    risk: Risk;
    projectId: number;
    userId: number;
    isNew: boolean;
  };

  [PluginFilter.RISK_AFTER_LOAD]: {
    risk: Risk;
    includeMetadata: boolean;
  };

  [PluginFilter.ASSESSMENT_CALCULATE_SCORE]: {
    projectId: number;
    frameworkId: number;
    answers: Answer[];
    baseScore: number;
  };

  [PluginFilter.REPORT_BEFORE_GENERATE]: {
    reportType: string;
    projectId: number;
    sections: ReportSection[];
    options: ReportOptions;
  };

  [PluginFilter.USER_DATA_BEFORE_EXPORT]: {
    userId: number;
    data: UserExportData;
    format: "json" | "csv" | "pdf";
  };

  [PluginFilter.NAVIGATION_ITEMS]: {
    items: NavigationItem[];
    userRole: string;
  };

  [PluginFilter.DASHBOARD_WIDGETS]: {
    widgets: DashboardWidget[];
    userPreferences: UserPreferences;
  };
}
```

### FilterBus Implementation

```typescript
export class FilterBus {
  private handlers: Map<PluginFilter, FilterHandler[]> = new Map();

  /**
   * Register a filter handler with optional priority
   * Lower priority = runs first (like WordPress)
   */
  addFilter<F extends PluginFilter>(
    filter: F,
    handler: FilterHandler<F>,
    priority: number = 10
  ): void {
    if (!this.handlers.has(filter)) {
      this.handlers.set(filter, []);
    }
    this.handlers.get(filter)!.push({ handler, priority });
    // Sort by priority
    this.handlers.get(filter)!.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Remove a filter handler
   */
  removeFilter<F extends PluginFilter>(
    filter: F,
    handler: FilterHandler<F>
  ): void {
    const handlers = this.handlers.get(filter);
    if (handlers) {
      const index = handlers.findIndex(h => h.handler === handler);
      if (index > -1) handlers.splice(index, 1);
    }
  }

  /**
   * Apply all handlers to data in priority order
   */
  async applyFilters<F extends PluginFilter>(
    filter: F,
    data: FilterPayloads[F]
  ): Promise<FilterPayloads[F]> {
    const handlers = this.handlers.get(filter) || [];
    let result = data;

    for (const { handler } of handlers) {
      try {
        result = await handler(result);
      } catch (error) {
        // Log error but continue pipeline
        console.error(`Filter handler error for ${filter}:`, error);
      }
    }

    return result;
  }

  /**
   * Check if any handlers are registered for a filter
   */
  hasFilters(filter: PluginFilter): boolean {
    return (this.handlers.get(filter)?.length ?? 0) > 0;
  }
}
```

### Filter Handler Registration

```typescript
// In a plugin's index.ts
export default {
  manifest: { ... },

  filterHandlers() {
    return {
      // Add EU AI Act risk category before saving
      [PluginFilter.RISK_BEFORE_SAVE]: async (data) => {
        return {
          ...data,
          risk: {
            ...data.risk,
            euAiActCategory: calculateRiskCategory(data.risk),
            complianceRequirements: getRequirements(data.risk),
          },
        };
      },

      // Redact sensitive data before export
      [PluginFilter.USER_DATA_BEFORE_EXPORT]: async (data) => {
        return {
          ...data,
          data: {
            ...data.data,
            email: maskEmail(data.data.email),
            personalNotes: "[REDACTED]",
          },
        };
      },

      // Add plugin's navigation items
      [PluginFilter.NAVIGATION_ITEMS]: async (data) => {
        return {
          ...data,
          items: [
            ...data.items,
            {
              path: "/frameworks/eu-ai-act",
              label: "EU AI Act",
              icon: "shield",
              order: 10,
            },
          ],
        };
      },
    };
  },
};
```

### Using Filters in Core Code

```typescript
// In risk service
async createRisk(riskData: CreateRiskInput, userId: number): Promise<Risk> {
  // Apply before_save filters - plugins can modify/validate
  const filtered = await this.pluginManager.applyFilters(
    PluginFilter.RISK_BEFORE_SAVE,
    {
      risk: riskData,
      projectId: riskData.projectId,
      userId,
      isNew: true,
    }
  );

  // Save the potentially modified risk
  const risk = await this.riskRepository.create(filtered.risk);

  // Emit event (fire-and-forget)
  await this.pluginManager.emit(PluginEvent.RISK_CREATED, {
    riskId: risk.id,
    projectId: risk.projectId,
  });

  return risk;
}

// In report service
async generateReport(projectId: number, options: ReportOptions): Promise<Report> {
  const sections = await this.buildSections(projectId);

  // Let plugins modify report structure
  const filtered = await this.pluginManager.applyFilters(
    PluginFilter.REPORT_BEFORE_GENERATE,
    { reportType: options.type, projectId, sections, options }
  );

  const report = await this.renderReport(filtered.sections, filtered.options);

  // Let plugins post-process the report
  const finalReport = await this.pluginManager.applyFilters(
    PluginFilter.REPORT_AFTER_GENERATE,
    { report, projectId, options }
  );

  return finalReport.report;
}
```

### Filter Priority Examples

```typescript
// Validation plugin runs first (priority 1)
addFilter(PluginFilter.RISK_BEFORE_SAVE, validateRisk, 1);

// Enrichment plugin runs second (priority 10, default)
addFilter(PluginFilter.RISK_BEFORE_SAVE, enrichWithAICategory, 10);

// Logging plugin runs last (priority 100)
addFilter(PluginFilter.RISK_BEFORE_SAVE, logRiskChanges, 100);

// Execution order: validateRisk -> enrichWithAICategory -> logRiskChanges
```

---

## UI Extension Points

UI Extension Points allow plugins to inject components into predefined locations in the VerifyWise frontend without modifying core code.

### Extension Point Types

```typescript
export interface PluginUIExtensions {
  // Navigation items in sidebar
  navigation?: NavigationExtension[];

  // Widgets on dashboard
  dashboardWidgets?: DashboardWidgetExtension[];

  // Settings pages
  settingsPages?: SettingsPageExtension[];

  // Additional routes
  routes?: RouteExtension[];

  // Toolbar actions
  toolbarActions?: ToolbarActionExtension[];

  // Entity detail tabs (risks, projects, etc.)
  detailTabs?: DetailTabExtension[];

  // Report sections
  reportSections?: ReportSectionExtension[];
}
```

### Navigation Extension

```typescript
export interface NavigationExtension {
  id: string;
  label: string;
  icon: string | React.ComponentType;
  path: string;
  order?: number;                    // Lower = higher in menu
  parent?: string;                   // For nested navigation
  requiredPermissions?: string[];    // Role-based visibility
  badge?: {
    type: "count" | "dot" | "text";
    value?: number | string;
    color?: string;
  };
}

// Example: EU AI Act plugin navigation
{
  navigation: [
    {
      id: "eu-ai-act",
      label: "EU AI Act",
      icon: "ShieldCheck",
      path: "/frameworks/eu-ai-act",
      order: 10,
      requiredPermissions: ["view:frameworks"],
    },
    {
      id: "eu-ai-act-requirements",
      label: "Requirements",
      icon: "ListChecks",
      path: "/frameworks/eu-ai-act/requirements",
      parent: "eu-ai-act",
      order: 1,
    },
    {
      id: "eu-ai-act-risk-classification",
      label: "Risk classification",
      icon: "AlertTriangle",
      path: "/frameworks/eu-ai-act/risk-classification",
      parent: "eu-ai-act",
      order: 2,
    },
  ],
}
```

### Dashboard Widget Extension

```typescript
export interface DashboardWidgetExtension {
  id: string;
  title: string;
  description?: string;
  component: React.ComponentType<DashboardWidgetProps>;
  defaultSize: "small" | "medium" | "large" | "full";
  defaultPosition?: { x: number; y: number };
  refreshInterval?: number;          // Auto-refresh in seconds
  requiredPermissions?: string[];
  configSchema?: JSONSchema;         // Widget-specific settings
}

export interface DashboardWidgetProps {
  pluginContext: PluginContext;
  config: Record<string, unknown>;
  size: { width: number; height: number };
}

// Example: Compliance score widget
{
  dashboardWidgets: [
    {
      id: "eu-ai-act-compliance-score",
      title: "EU AI Act compliance",
      description: "Overall compliance score across all projects",
      component: EUAIActComplianceWidget,
      defaultSize: "medium",
      refreshInterval: 300,  // 5 minutes
      requiredPermissions: ["view:compliance"],
      configSchema: {
        type: "object",
        properties: {
          showTrend: { type: "boolean", default: true },
          projectFilter: { type: "string", enum: ["all", "active", "recent"] },
        },
      },
    },
  ],
}
```

### Settings Page Extension

```typescript
export interface SettingsPageExtension {
  id: string;
  title: string;
  description?: string;
  icon?: string | React.ComponentType;
  path: string;                      // Relative to /settings
  component: React.ComponentType<SettingsPageProps>;
  order?: number;
  requiredPermissions?: string[];
}

export interface SettingsPageProps {
  pluginContext: PluginContext;
  config: PluginConfig;
  onConfigChange: (newConfig: Partial<PluginConfig>) => Promise<void>;
}

// Example: Integration settings
{
  settingsPages: [
    {
      id: "slack-settings",
      title: "Slack integration",
      description: "Configure Slack notifications and channels",
      icon: "Slack",
      path: "integrations/slack",
      component: SlackSettingsPage,
      order: 20,
      requiredPermissions: ["admin:integrations"],
    },
  ],
}
```

### Route Extension

```typescript
export interface RouteExtension {
  path: string;
  component: React.ComponentType<RouteProps>;
  exact?: boolean;
  requiredPermissions?: string[];
  layout?: "default" | "minimal" | "none";
}

// Example: Framework-specific pages
{
  routes: [
    {
      path: "/frameworks/eu-ai-act",
      component: EUAIActDashboard,
      layout: "default",
    },
    {
      path: "/frameworks/eu-ai-act/requirements",
      component: EUAIActRequirements,
      layout: "default",
    },
    {
      path: "/frameworks/eu-ai-act/risk-classification",
      component: RiskClassificationGuide,
      layout: "default",
    },
  ],
}
```

### Detail Tab Extension

```typescript
export interface DetailTabExtension {
  id: string;
  entityType: "project" | "risk" | "vendor" | "model" | "user";
  label: string;
  icon?: string | React.ComponentType;
  component: React.ComponentType<DetailTabProps>;
  order?: number;
  requiredPermissions?: string[];
  // Only show for specific conditions
  showWhen?: (entity: unknown) => boolean;
}

export interface DetailTabProps {
  entityId: number;
  entityType: string;
  entity: unknown;
  pluginContext: PluginContext;
}

// Example: Add EU AI Act tab to project details
{
  detailTabs: [
    {
      id: "eu-ai-act-compliance",
      entityType: "project",
      label: "EU AI Act",
      icon: "ShieldCheck",
      component: ProjectEUAIActTab,
      order: 5,
      showWhen: (project) => project.frameworks?.includes("eu-ai-act"),
    },
  ],
}
```

### UIExtensionRegistry Implementation

```typescript
export class UIExtensionRegistry {
  private extensions: Map<string, PluginUIExtensions> = new Map();

  register(pluginId: string, ui: PluginUIExtensions): void {
    this.extensions.set(pluginId, ui);
  }

  unregister(pluginId: string): void {
    this.extensions.delete(pluginId);
  }

  getNavigationItems(userRole: string): NavigationExtension[] {
    const items: NavigationExtension[] = [];

    for (const [pluginId, ui] of this.extensions) {
      if (ui.navigation) {
        for (const nav of ui.navigation) {
          if (this.hasPermission(userRole, nav.requiredPermissions)) {
            items.push({ ...nav, pluginId });
          }
        }
      }
    }

    return items.sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
  }

  getDashboardWidgets(userRole: string): DashboardWidgetExtension[] {
    const widgets: DashboardWidgetExtension[] = [];

    for (const [pluginId, ui] of this.extensions) {
      if (ui.dashboardWidgets) {
        for (const widget of ui.dashboardWidgets) {
          if (this.hasPermission(userRole, widget.requiredPermissions)) {
            widgets.push({ ...widget, pluginId });
          }
        }
      }
    }

    return widgets;
  }

  getSettingsPages(userRole: string): SettingsPageExtension[] {
    const pages: SettingsPageExtension[] = [];

    for (const [pluginId, ui] of this.extensions) {
      if (ui.settingsPages) {
        for (const page of ui.settingsPages) {
          if (this.hasPermission(userRole, page.requiredPermissions)) {
            pages.push({ ...page, pluginId });
          }
        }
      }
    }

    return pages.sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
  }

  getAllRoutes(): RouteExtension[] {
    const routes: RouteExtension[] = [];

    for (const ui of this.extensions.values()) {
      if (ui.routes) {
        routes.push(...ui.routes);
      }
    }

    return routes;
  }

  private hasPermission(userRole: string, required?: string[]): boolean {
    if (!required || required.length === 0) return true;
    // Implement permission checking logic
    return true; // Simplified
  }
}
```

### Frontend Integration

```tsx
// In App.tsx or Routes component
import { usePluginManager } from "./hooks/usePluginManager";

function AppRoutes() {
  const { getRoutes, getNavigationItems } = usePluginManager();

  // Get all plugin routes
  const pluginRoutes = getRoutes();

  return (
    <Routes>
      {/* Core routes */}
      <Route path="/" element={<Dashboard />} />
      <Route path="/projects" element={<Projects />} />

      {/* Plugin routes - dynamically injected */}
      {pluginRoutes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={<route.component />}
        />
      ))}
    </Routes>
  );
}

// In Sidebar component
function Sidebar() {
  const { getNavigationItems } = usePluginManager();
  const items = getNavigationItems(currentUser.role);

  return (
    <nav>
      {items.map((item) => (
        <NavItem key={item.id} {...item} />
      ))}
    </nav>
  );
}

// In Dashboard component
function Dashboard() {
  const { getDashboardWidgets } = usePluginManager();
  const widgets = getDashboardWidgets(currentUser.role);

  return (
    <WidgetGrid>
      {widgets.map((widget) => (
        <Widget key={widget.id} {...widget}>
          <widget.component
            pluginContext={pluginContext}
            config={widgetConfig}
            size={widgetSize}
          />
        </Widget>
      ))}
    </WidgetGrid>
  );
}
```

---

## Metadata API

The Metadata API provides schemaless key-value storage for plugins, allowing them to store custom data without database migrations.

### Why Metadata API?

| Traditional Approach | Metadata API |
|---------------------|--------------|
| Create migration | Just call `metadata.set()` |
| Update model | No model changes |
| Rebuild server | Immediate use |
| Schema changes break | Flexible JSON storage |
| Plugin removal leaves orphans | Clean deletion by plugin |

### MetadataAPI Interface

```typescript
export interface MetadataAPI {
  // Single value operations
  get<T = unknown>(entityType: string, entityId: number, key: string): Promise<T | null>;
  set<T = unknown>(entityType: string, entityId: number, key: string, value: T): Promise<void>;
  delete(entityType: string, entityId: number, key: string): Promise<boolean>;

  // Batch operations
  getAll(entityType: string, entityId: number): Promise<Record<string, unknown>>;
  setMany(entityType: string, entityId: number, data: Record<string, unknown>): Promise<void>;
  deleteAll(entityType: string, entityId: number): Promise<number>;

  // Query operations
  findByKey(entityType: string, key: string, value: unknown): Promise<EntityReference[]>;
  findByKeyPrefix(entityType: string, keyPrefix: string): Promise<MetadataEntry[]>;

  // Plugin-scoped operations
  deleteByPlugin(pluginId: string): Promise<number>;
  getByPlugin(pluginId: string): Promise<MetadataEntry[]>;
}

export interface EntityReference {
  entityType: string;
  entityId: number;
}

export interface MetadataEntry {
  entityType: string;
  entityId: number;
  key: string;
  value: unknown;
  pluginId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Database Schema

```sql
CREATE TABLE entity_metadata (
  id SERIAL PRIMARY KEY,
  tenant VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,    -- 'risk', 'project', 'user', etc.
  entity_id INTEGER NOT NULL,
  plugin_id VARCHAR(100) NOT NULL,      -- Plugin that owns this metadata
  meta_key VARCHAR(255) NOT NULL,
  meta_value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Indexes for common queries
  UNIQUE(tenant, entity_type, entity_id, plugin_id, meta_key),
  INDEX idx_entity (tenant, entity_type, entity_id),
  INDEX idx_plugin (tenant, plugin_id),
  INDEX idx_key_lookup (tenant, entity_type, meta_key, meta_value)  -- For findByKey
);

-- Optional: GIN index for JSONB queries
CREATE INDEX idx_meta_value_gin ON entity_metadata USING GIN (meta_value);
```

### MetadataService Implementation

```typescript
export class MetadataService implements MetadataAPI {
  constructor(
    private db: Database,
    private pluginId: string,
    private tenant: string
  ) {}

  async get<T = unknown>(
    entityType: string,
    entityId: number,
    key: string
  ): Promise<T | null> {
    const result = await this.db.query(
      `SELECT meta_value FROM entity_metadata
       WHERE tenant = $1 AND entity_type = $2 AND entity_id = $3
         AND plugin_id = $4 AND meta_key = $5`,
      [this.tenant, entityType, entityId, this.pluginId, key]
    );

    return result.rows[0]?.meta_value ?? null;
  }

  async set<T = unknown>(
    entityType: string,
    entityId: number,
    key: string,
    value: T
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO entity_metadata
         (tenant, entity_type, entity_id, plugin_id, meta_key, meta_value)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (tenant, entity_type, entity_id, plugin_id, meta_key)
       DO UPDATE SET meta_value = $6, updated_at = NOW()`,
      [this.tenant, entityType, entityId, this.pluginId, key, JSON.stringify(value)]
    );
  }

  async delete(
    entityType: string,
    entityId: number,
    key: string
  ): Promise<boolean> {
    const result = await this.db.query(
      `DELETE FROM entity_metadata
       WHERE tenant = $1 AND entity_type = $2 AND entity_id = $3
         AND plugin_id = $4 AND meta_key = $5`,
      [this.tenant, entityType, entityId, this.pluginId, key]
    );

    return result.rowCount > 0;
  }

  async getAll(
    entityType: string,
    entityId: number
  ): Promise<Record<string, unknown>> {
    const result = await this.db.query(
      `SELECT meta_key, meta_value FROM entity_metadata
       WHERE tenant = $1 AND entity_type = $2 AND entity_id = $3
         AND plugin_id = $4`,
      [this.tenant, entityType, entityId, this.pluginId]
    );

    return result.rows.reduce((acc, row) => {
      acc[row.meta_key] = row.meta_value;
      return acc;
    }, {} as Record<string, unknown>);
  }

  async setMany(
    entityType: string,
    entityId: number,
    data: Record<string, unknown>
  ): Promise<void> {
    const entries = Object.entries(data);
    if (entries.length === 0) return;

    // Use transaction for batch insert
    await this.db.transaction(async (trx) => {
      for (const [key, value] of entries) {
        await trx.query(
          `INSERT INTO entity_metadata
             (tenant, entity_type, entity_id, plugin_id, meta_key, meta_value)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (tenant, entity_type, entity_id, plugin_id, meta_key)
           DO UPDATE SET meta_value = $6, updated_at = NOW()`,
          [this.tenant, entityType, entityId, this.pluginId, key, JSON.stringify(value)]
        );
      }
    });
  }

  async deleteAll(entityType: string, entityId: number): Promise<number> {
    const result = await this.db.query(
      `DELETE FROM entity_metadata
       WHERE tenant = $1 AND entity_type = $2 AND entity_id = $3
         AND plugin_id = $4`,
      [this.tenant, entityType, entityId, this.pluginId]
    );

    return result.rowCount;
  }

  async findByKey(
    entityType: string,
    key: string,
    value: unknown
  ): Promise<EntityReference[]> {
    const result = await this.db.query(
      `SELECT entity_type, entity_id FROM entity_metadata
       WHERE tenant = $1 AND entity_type = $2 AND meta_key = $3
         AND meta_value = $4`,
      [this.tenant, entityType, key, JSON.stringify(value)]
    );

    return result.rows;
  }

  async deleteByPlugin(pluginId: string): Promise<number> {
    const result = await this.db.query(
      `DELETE FROM entity_metadata WHERE tenant = $1 AND plugin_id = $2`,
      [this.tenant, pluginId]
    );

    return result.rowCount;
  }
}
```

### Plugin Usage Examples

```typescript
// EU AI Act plugin storing risk classification
async onLoad(context: PluginContext) {
  // When a risk is created, store classification metadata
  context.on(PluginEvent.RISK_CREATED, async (payload) => {
    const classification = await calculateEUAIActClassification(payload.riskId);

    await context.metadata.set("risk", payload.riskId, "eu_ai_act_category", {
      level: classification.level,
      rationale: classification.rationale,
      requirements: classification.requirements,
      calculatedAt: new Date().toISOString(),
    });
  });
}

// Retrieving metadata later
async getRiskWithClassification(riskId: number, context: PluginContext) {
  const risk = await context.db.query("SELECT * FROM risks WHERE id = $1", [riskId]);
  const classification = await context.metadata.get("risk", riskId, "eu_ai_act_category");

  return {
    ...risk,
    euAiActClassification: classification,
  };
}

// Cleanup on uninstall
async onUninstall(context: PluginContext) {
  // Remove all metadata created by this plugin
  const deleted = await context.metadata.deleteByPlugin("eu-ai-act");
  context.logger.info(`Cleaned up ${deleted} metadata entries`);
}
```

### Advanced Metadata Patterns

```typescript
// 1. Storing complex nested data
await context.metadata.set("project", projectId, "ai_risk_assessment", {
  overallScore: 85,
  categories: {
    transparency: { score: 90, findings: [...] },
    fairness: { score: 75, findings: [...] },
    accountability: { score: 88, findings: [...] },
  },
  lastAssessedAt: new Date().toISOString(),
  assessedBy: userId,
});

// 2. Storing arrays
await context.metadata.set("project", projectId, "compliance_tags", [
  "high-risk",
  "requires-human-oversight",
  "biometric-data",
]);

// 3. Incrementing counters
const views = await context.metadata.get("risk", riskId, "view_count") || 0;
await context.metadata.set("risk", riskId, "view_count", views + 1);

// 4. Finding entities by metadata
const highRiskProjects = await context.metadata.findByKey(
  "project",
  "ai_risk_level",
  "high"
);

// 5. Bulk operations for related data
await context.metadata.setMany("project", projectId, {
  "compliance_status": "in_progress",
  "last_review_date": new Date().toISOString(),
  "reviewer_id": userId,
  "review_notes": "Initial assessment completed",
});
```

### Metadata vs Traditional Columns

Use **Metadata API** for:
- Plugin-specific data
- Optional/sparse fields
- Frequently changing schemas
- User-defined custom fields
- Temporary/experimental features

Use **Traditional columns** for:
- Core entity attributes
- Frequently queried fields
- Fields with strict validation
- Foreign key relationships
- Fields requiring database constraints

---

## Configuration Management

### Plugin Config Schema

```json
{
  "config": {
    "apiKey": {
      "type": "string",
      "required": true,
      "secret": true,
      "description": "API key for external service"
    },
    "syncInterval": {
      "type": "number",
      "default": 3600,
      "min": 60,
      "max": 86400,
      "description": "Sync interval in seconds"
    },
    "features": {
      "type": "object",
      "properties": {
        "autoSync": { "type": "boolean", "default": true },
        "notifications": { "type": "boolean", "default": false }
      }
    }
  }
}
```

### Accessing Config

```typescript
async onLoad(context: PluginContext) {
  const apiKey = context.config.get("apiKey");
  const interval = context.config.get("syncInterval", 3600);

  // Config is validated against schema on load
  // Secrets are encrypted at rest
}
```

### Config UI Generation

The manifest config schema can auto-generate admin UI forms.

---

## Dependency Management

### Declaring Dependencies

```json
{
  "dependencies": {
    "core": ">=1.0.0",
    "eu-ai-act": "^1.0.0"
  }
}
```

### Resolution Rules

1. **Topological Sort**: Load dependencies before dependents
2. **Version Matching**: Use semver for compatibility
3. **Missing Dependency**: Disable plugin, log warning
4. **Circular Dependency**: Fail fast with clear error

### Load Order Example

```
Given:
  - alerts depends on star-rating
  - dashboards depends on alerts, views
  - views has no dependencies

Load order:
  1. views
  2. star-rating
  3. alerts
  4. dashboards
```

---

## Marketplace Integration

### Registry Structure

Hosted at: `github.com/verifywise/plugin-marketplace`

```
plugin-marketplace/
├── registry.json              # Plugin index
├── plugins/                   # Official plugins
│   ├── eu-ai-act/
│   ├── iso-42001/
│   └── ...
└── community/                 # Verified community plugins
    └── ...
```

### Registry Format

```json
{
  "version": "1.0.0",
  "plugins": {
    "eu-ai-act": {
      "name": "EU AI Act Compliance",
      "author": "VerifyWise",
      "official": true,
      "verified": true,
      "category": "framework",
      "repository": "verifywise/plugin-marketplace",
      "path": "plugins/eu-ai-act",
      "versions": {
        "1.2.0": {
          "minCoreVersion": "1.0.0",
          "checksum": "sha256:abc123...",
          "releaseDate": "2024-12-01"
        }
      },
      "latest": "1.2.0"
    }
  }
}
```

### Installation Flow

1. Fetch `registry.json` from GitHub
2. Check version compatibility
3. Resolve and install dependencies
4. Download plugin tarball
5. Verify checksum
6. Extract to `plugins/installed/`
7. Install npm dependencies
8. Run migrations
9. Load plugin

### CLI Commands

```bash
# Search
npx vw-plugins search "compliance"

# Install
npx vw-plugins install eu-ai-act
npx vw-plugins install eu-ai-act@1.1.0

# Update
npx vw-plugins update
npx vw-plugins update eu-ai-act

# List
npx vw-plugins list

# Uninstall
npx vw-plugins uninstall my-plugin
```

---

## Security Model

### Permission System

Plugins declare required permissions:

```json
{
  "permissions": [
    "database:read",
    "database:write",
    "events:emit",
    "events:listen",
    "config:read",
    "config:write",
    "http:outbound",
    "filesystem:read"
  ]
}
```

### Security Features

| Feature | Implementation |
|---------|----------------|
| Checksum verification | SHA-256 hash of plugin tarball |
| Official badge | Plugins in main repo are "official" |
| Verified badge | Community plugins reviewed by team |
| Secret encryption | Config secrets encrypted at rest |
| Audit logging | All plugin actions logged |
| Sandboxing | Future: Run in separate process |

### Trust Levels

1. **Builtin**: Shipped with VerifyWise (highest trust)
2. **Official**: From verifywise/plugin-marketplace
3. **Verified**: Community plugin reviewed and approved
4. **Community**: Unverified, use at own risk

### Enterprise Features

```typescript
const MARKETPLACE_CONFIG = {
  // Restrict to official plugins only
  allowCommunityPlugins: false,

  // Require admin approval for installs
  requireApproval: true,

  // Use private registry
  registryUrl: "https://plugins.company.com/registry.json",

  // Disable auto-updates
  autoUpdate: false,
};
```

---

## Migration Path

### Phase 1: Core Infrastructure (Complete Foundation)

Phase 1 delivers the complete plugin foundation with all core features. This ensures plugins have full capabilities from day one.

#### 1.1 Core Plugin System (~400 lines)

```
plugins/core/
├── types.ts              # All TypeScript interfaces
├── PluginManager.ts      # Main orchestrator
├── PluginRegistry.ts     # Plugin registration & lookup
├── PluginContext.ts      # Context factory for plugins
└── index.ts              # Public exports
```

**Files to create:**
- `types.ts` - Plugin, FrameworkPlugin, IntegrationPlugin interfaces
- `PluginManager.ts` - Load, unload, enable, disable, install, uninstall
- `PluginRegistry.ts` - Plugin storage and lookup
- `PluginContext.ts` - Creates scoped contexts for each plugin

#### 1.2 Event System (~100 lines)

```
plugins/core/
├── EventBus.ts           # Event emitter
└── events.ts             # Event type definitions
```

**Features:**
- Typed event enum (`PluginEvent`)
- Typed event payloads (`EventPayloads`)
- Async event handlers
- Error isolation (handler errors don't stop other handlers)

#### 1.3 Filter System (~150 lines)

```
plugins/core/
├── FilterBus.ts          # Filter pipeline
└── filters.ts            # Filter type definitions
```

**Features:**
- Typed filter enum (`PluginFilter`)
- Typed filter payloads (`FilterPayloads`)
- Priority-based execution order
- Data transformation pipeline
- Error handling with fallback to original data

#### 1.4 Metadata API (~200 lines)

```
plugins/core/
├── MetadataService.ts    # Metadata CRUD operations
└── migrations/
    └── 001_create_entity_metadata.ts
```

**Database migration:**
```sql
CREATE TABLE entity_metadata (
  id SERIAL PRIMARY KEY,
  tenant VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  plugin_id VARCHAR(100) NOT NULL,
  meta_key VARCHAR(255) NOT NULL,
  meta_value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant, entity_type, entity_id, plugin_id, meta_key)
);

CREATE INDEX idx_entity_metadata_entity ON entity_metadata (tenant, entity_type, entity_id);
CREATE INDEX idx_entity_metadata_plugin ON entity_metadata (tenant, plugin_id);
```

**Features:**
- get/set/delete single values
- getAll/setMany/deleteAll batch operations
- findByKey query operations
- deleteByPlugin for cleanup on uninstall

#### 1.5 UI Extension Registry (~150 lines)

```
plugins/core/
├── UIExtensionRegistry.ts    # UI extension management
└── ui-types.ts               # UI extension interfaces
```

**Features:**
- Navigation extensions
- Dashboard widget extensions
- Settings page extensions
- Route extensions
- Detail tab extensions
- Permission-based visibility

#### 1.6 Lifecycle Hooks

**Full lifecycle support:**

| Hook | When Called | Purpose |
|------|-------------|---------|
| `onInstall` | First install | Create tables, seed data |
| `onUninstall` | Permanent removal | Clean up all data |
| `onLoad` | Server start | Initialize resources |
| `onUnload` | Server stop | Release resources |
| `onEnable` | Plugin enabled | Start background jobs |
| `onDisable` | Plugin disabled | Stop background jobs |

#### 1.7 Plugin Storage (~50 lines)

```
plugins/core/
└── PluginStorage.ts      # File storage for plugin assets
```

**Features:**
- Plugin-scoped file storage
- Upload/download/delete operations
- Automatic cleanup on uninstall

#### Phase 1 Deliverables Summary

| Component | Lines | Description |
|-----------|-------|-------------|
| PluginManager | ~150 | Core orchestration |
| EventBus | ~100 | Event system |
| FilterBus | ~150 | Filter pipeline |
| MetadataService | ~200 | Schemaless storage |
| UIExtensionRegistry | ~150 | UI injection |
| PluginContext | ~100 | Context factory |
| Types | ~150 | All interfaces |
| **Total** | **~1000** | Complete foundation |

#### Phase 1 Frontend Work

```
src/
├── hooks/
│   └── usePluginManager.ts     # React hook for plugin access
├── contexts/
│   └── PluginContext.tsx       # Plugin context provider
└── components/
    ├── PluginNavigation.tsx    # Dynamic navigation from plugins
    ├── PluginDashboard.tsx     # Dashboard widget container
    └── PluginSettings.tsx      # Plugin settings renderer
```

### Phase 2: Convert EU AI Act
- Move existing code to `plugins/builtin/eu-ai-act/`
- Create manifest.json
- Implement FrameworkPlugin interface
- Update core to use plugin

### Phase 3: Convert Other Frameworks
- ISO 42001
- ISO 27001
- NIST AI RMF

### Phase 4: Convert Integrations
- Slack webhook
- MLflow sync
- (Future: Jira, Teams, etc.)

### Phase 5: Marketplace
- Create GitHub repository
- Implement MarketplaceClient
- Add CLI commands
- Build admin UI

### Phase 6: Cleanup
- Remove old `frameworkAdditionMap`
- Remove old framework-specific utils
- Update documentation

---

## Lessons from Countly

### What to Keep

| Pattern | Reason |
|---------|--------|
| Event-based hooks | Excellent decoupling |
| Dependency graph | Safe load ordering |
| Centralized config | Easy management |
| Lifecycle hooks | Clean init/cleanup |
| Hot enable/disable | Flexibility |

### What to Avoid

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| 3000-line god object | Hard to maintain | Split into modules |
| Magic string events | Typos = silent failure | TypeScript enums |
| `any` payloads | No type safety | Explicit interfaces |
| No versioning | Breaking changes | Semver enforcement |
| Silent test skip | Quality issues | Required test exports |
| Global state | Memory leaks, test isolation | Scoped contexts |

---

## Example: Complete Framework Plugin

```typescript
// plugins/builtin/eu-ai-act/index.ts

import {
  FrameworkPlugin,
  PluginContext,
  PluginEvent,
  FrameworkStructure
} from "../../core/types";

import { createAssessmentTracker, createComplianceTracker } from "./services/create";
import { deleteFrameworkData } from "./services/delete";
import { generateReportData } from "./services/report";
import { EU_AI_ACT_STRUCTURE } from "./structure";
import manifest from "./manifest.json";

const EUAIActPlugin: FrameworkPlugin = {
  manifest: manifest as any,

  // ============ LIFECYCLE ============
  async onLoad(context: PluginContext) {
    context.logger.info("EU AI Act plugin loaded");

    // Register scheduled jobs
    // Initialize caches
    // etc.
  },

  async onUnload(context: PluginContext) {
    context.logger.info("EU AI Act plugin unloading");

    // Cleanup resources
  },

  // ============ EVENTS ============
  eventHandlers() {
    return {
      [PluginEvent.PROJECT_DELETED]: async (payload, context) => {
        context.logger.info(`Cleaning up EU AI Act data for project ${payload.projectId}`);
        // Handled by deleteForProject, but good for logging
      },

      [PluginEvent.QUESTION_ANSWERED]: async (payload, context) => {
        // Update compliance calculations
        // Trigger notifications if thresholds crossed
      },
    };
  },

  // ============ ROUTES ============
  routes(router) {
    router.get("/eu-ai-act/requirements", async (req, res) => {
      // Return EU AI Act requirements
    });

    router.get("/eu-ai-act/risk-classification", async (req, res) => {
      // Return risk classification guide
    });
  },

  // ============ FRAMEWORK METHODS ============
  async createForProject(projectId, tenant, transaction, options = {}) {
    const assessmentTracker = await createAssessmentTracker(
      projectId,
      tenant,
      transaction,
      options.enableAI ?? false
    );

    const complianceTracker = await createComplianceTracker(
      projectId,
      tenant,
      transaction,
      options.enableAI ?? false
    );

    return {
      assessmentTracker,
      complianceTracker,
    };
  },

  async deleteForProject(projectFrameworkId, tenant, transaction) {
    return deleteFrameworkData(projectFrameworkId, tenant, transaction);
  },

  async getReportData(projectFrameworkId, tenant) {
    return generateReportData(projectFrameworkId, tenant);
  },

  getStructure(): FrameworkStructure {
    return EU_AI_ACT_STRUCTURE;
  },

  // ============ OPTIONAL METHODS ============
  async calculateProgress(projectFrameworkId) {
    // Calculate completion percentage
    return {
      overall: 75,
      bySection: {
        "Risk Assessment": 100,
        "Documentation": 50,
        "Human Oversight": 80,
      },
    };
  },

  async validateCompliance(data) {
    // Validate compliance data
    const errors: string[] = [];

    if (!data.riskLevel) {
      errors.push("Risk level is required");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

export default EUAIActPlugin;
```

---

## Future Considerations

### 1. Plugin Sandboxing
Run plugins in isolated processes/VMs for security.

### 2. Hot Reload
Update plugins without server restart.

### 3. Plugin UI Components
Allow plugins to contribute React components to the frontend.

### 4. GraphQL Extensions
Plugins can extend the GraphQL schema.

### 5. Multi-Language Support
Support plugins in languages other than TypeScript.

### 6. Plugin Analytics
Track plugin usage, errors, performance.

---

## References

- Countly Plugin System: https://github.com/Countly/countly-server/blob/master/plugins/pluginManager.js
- WordPress Plugin Handbook: https://developer.wordpress.org/plugins/
- VSCode Extension API: https://code.visualstudio.com/api
- Grafana Plugin Development: https://grafana.com/docs/grafana/latest/developers/plugins/
