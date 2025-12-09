# VerifyWise Plugin System Specification

Version: 1.5.0
Last Updated: December 8, 2025

## Table of Contents

1. [Overview](#1-overview)
2. [Plugin Architecture](#2-plugin-architecture)
3. [Unified Plugin Architecture](#3-unified-plugin-architecture)
4. [Plugin Manifest](#4-plugin-manifest)
5. [Plugin File Structure](#5-plugin-file-structure)
6. [Plugin Lifecycle](#6-plugin-lifecycle)
7. [Plugin Permissions](#7-plugin-permissions)
8. [Configuration & Secrets](#8-configuration--secrets)
9. [Plugin Registry](#9-plugin-registry)
10. [Installation & Updates](#10-installation--updates)
11. [Plugin Webhooks](#11-plugin-webhooks)
12. [Plugin Development](#12-plugin-development)
13. [UI Extension Points](#13-ui-extension-points)
14. [Dashboard Widget Templates](#14-dashboard-widget-templates)
15. [Database & Migrations](#15-database--migrations)
16. [Error Handling](#16-error-handling)
17. [Multi-tenant Support](#17-multi-tenant-support)
18. [Version Comparison](#18-version-comparison)
19. [Available Events Reference](#19-available-events-reference)
20. [Marketplace Backend API](#20-marketplace-backend-api)
21. [Plugin Scheduler API](#21-plugin-scheduler-api)
22. [Plugin Model API](#22-plugin-model-api)
23. [Plugin Middleware API](#23-plugin-middleware-api)
24. [Hot Reload (Development)](#24-hot-reload-development)
25. [Future Tasks](#25-future-tasks)

---

## 1. Overview

The VerifyWise Plugin System allows extending the platform with additional functionality through installable plugins. Plugins can add integrations (Slack, Jira), features (audit trail, custom reporting), compliance frameworks (ISO 27001, SOC2), and more.

### Key Principles

- **WordPress-like experience**: Browse, install, enable/disable, uninstall from UI
- **Admin-only management**: Only administrators can manage plugins
- **External registry**: All plugins (including built-in) come from GitHub registry
- **Self-contained**: Plugins bundle their dependencies
- **Multi-tenant aware**: Each tenant has separate plugin installations and configurations

---

## 2. Plugin Architecture

### 2.1 Plugin Types

| Type | Description | Examples |
|------|-------------|----------|
| `integration` | Connect with external services | Slack, Jira, Microsoft Teams |
| `feature` | Add new functionality | Audit trail, custom reporting |
| `framework` | Compliance frameworks | ISO 27001, SOC2, GDPR |
| `reporting` | Report generation & export | Custom reports, analytics |

### 2.2 Plugin States

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
Registered ──► Installed ──► Loaded ──► Enabled              │
                  │            │          │                   │
                  │            │          ▼                   │
                  │            │       Disabled ──────────────┤
                  │            │                              │
                  │            ▼                              │
                  │         Unloaded                          │
                  │                                           │
                  ▼                                           │
              Uninstalled ◄───────────────────────────────────┘
```

**State Definitions:**
- **Registered**: Plugin is known to the system (listed in registry)
- **Installed**: Plugin files downloaded and stored locally
- **Loaded**: Plugin code loaded into memory, `onLoad()` called
- **Enabled**: Plugin is active, processing events, `onEnable()` called
- **Disabled**: Plugin loaded but not processing, `onDisable()` called
- **Unloaded**: Plugin removed from memory, `onUnload()` called
- **Uninstalled**: Plugin files removed, `onUninstall()` called

---

## 3. Unified Plugin Architecture

The VerifyWise plugin system uses a **Unified Plugin Architecture** where all plugins (both built-in and marketplace) have full access to TypeScript/JavaScript capabilities. There is no sandboxing or template-only restriction.

### 3.1 Trust Model

All plugins are trusted because they come from:
- **VerifyWise Team** - Official built-in plugins
- **VerifyWise Employees** - Marketplace plugins developed internally
- **Customers** - Custom plugins for specific organizational needs

There are no third-party plugins, which eliminates the need for sandboxing.

### 3.2 Plugin Distribution Types

| Type | Location | Distribution | Example |
|------|----------|--------------|---------|
| **Built-in** | `plugins/builtin/` | Ships with VerifyWise | activity-feed |
| **Marketplace** | `plugins/marketplace/` | Downloaded on-demand | gdpr-compliance |

Both types have identical capabilities:
- Custom routes and API endpoints
- Event handlers and filters
- Database access via context
- UI extensions (dashboard widgets, settings, navigation)
- Full lifecycle hooks

### 3.3 Plugin Loading

The plugin loader automatically detects plugin type:

```
plugins/marketplace/my-plugin/
├── manifest.json        # Required: Plugin metadata
├── icon.svg            # Optional: Plugin icon
├── index.ts            # Optional: Full TypeScript plugin
└── ...                 # Any additional files
```

**Loading behavior:**
1. If `index.ts` or `index.js` exists → Load as full TypeScript plugin (dynamic import)
2. If only `manifest.json` exists → Create manifest-only plugin (backwards compatible)

### 3.4 Sample Plugins

Two reference implementations are available:

**1. Minimal Test Plugin** (`plugins/builtin/index.ts`):
- Basic lifecycle hooks (install, uninstall, enable, disable)
- No external dependencies
- Use this to verify plugin system functionality

**2. Activity Feed Plugin** (`plugins/builtin/activity-feed/`):
- Dashboard widget using the "activity-feed" template
- Custom API endpoint for widget data
- Icon and manifest configuration
- Use this as a reference for building dashboard widgets

---

## 4. Plugin Manifest

Each plugin must include a `manifest.json` file with the following schema:

```json
{
  "id": "slack-notifications",
  "name": "Slack Notifications",
  "description": "Send real-time notifications to Slack channels when risks are created, policies are updated, or compliance deadlines approach.",
  "version": "1.0.0",
  "author": {
    "name": "VerifyWise",
    "url": "https://verifywise.ai"
  },
  "homepage": "https://docs.verifywise.ai/plugins/slack-notifications",
  "repository": "https://github.com/bluewave-labs/verifywise-apps",
  "support": "https://github.com/bluewave-labs/verifywise-apps/issues",
  "type": "integration",
  "tags": ["slack", "notifications", "alerts", "messaging"],
  "permissions": [
    "events:listen",
    "config:read",
    "http:outbound"
  ],
  "config": {
    "webhookUrl": {
      "type": "string",
      "required": true,
      "secret": true,
      "description": "Slack webhook URL"
    },
    "channel": {
      "type": "string",
      "required": false,
      "description": "Default channel name"
    },
    "notifyOnRisks": {
      "type": "boolean",
      "required": false,
      "default": true,
      "description": "Send notifications for risk events"
    }
  },
  "compatibility": {
    "minVersion": "1.6.0"
  },
  "dependencies": {
    "other-plugin-id": ">=1.0.0"
  }
}
```

### 3.1 Manifest Field Reference

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `id` | string | Yes | Unique plugin identifier | lowercase, hyphens only, max 50 chars |
| `name` | string | Yes | Display name | Max 50 characters |
| `description` | string | Yes | Short description | Max 200 characters |
| `version` | string | Yes | Plugin version | Semver format: `X.Y` or `X.Y.Z` |
| `author` | object | Yes | Author information | `name` required, `url` optional |
| `homepage` | string | No | Documentation URL | Valid URL |
| `repository` | string | No | Source code URL | Valid URL |
| `support` | string | No | Support/issues URL | Valid URL |
| `type` | string | Yes | Plugin type | `integration`, `feature`, `framework`, `reporting` |
| `tags` | array | Yes | Searchable keywords | Array of strings |
| `permissions` | array | Yes | Required permissions | See [Permissions](#6-plugin-permissions) |
| `config` | object | No | Configuration schema | See [Configuration](#7-configuration--secrets) |
| `compatibility.minVersion` | string | No | Minimum VerifyWise version | Semver string |
| `dependencies` | object | No | Required plugins | `{ "plugin-id": ">=version" }` |

---

## 4. Plugin File Structure

### 4.1 Source Repository Structure

In the `verifywise-apps` repository, each plugin has a source folder:

```
verifywise-apps/
├── plugins/
│   ├── slack-notifications/
│   │   ├── src/
│   │   │   └── index.ts       # Plugin source code
│   │   ├── manifest.json      # Plugin metadata
│   │   ├── icon.png           # 64x64 PNG icon
│   │   ├── CHANGELOG.md       # Version history
│   │   ├── README.md          # Documentation
│   │   ├── package.json       # Dependencies (if any)
│   │   └── tsconfig.json      # TypeScript config
│   └── jira-integration/
│       └── ...
├── registry.json              # Auto-generated by CI
├── schema/
│   └── manifest.schema.json   # JSON Schema for validation
└── .github/
    └── workflows/
        └── build-plugins.yml  # CI builds and releases
```

### 4.2 Built Plugin Zip Contents

CI builds and releases a zip file for each plugin:

```
slack-notifications-1.0.0.zip
├── manifest.json      # Required - Plugin metadata
├── index.js           # Required - Compiled & bundled entry point
├── icon.png           # Required - 64x64 PNG icon
├── CHANGELOG.md       # Required - Version history
└── README.md          # Required - Documentation
```

### 4.3 Required Files

| File | Description | Validated By |
|------|-------------|--------------|
| `manifest.json` | Plugin metadata and configuration schema | CI JSON Schema |
| `index.js` | Pre-compiled JavaScript entry point (bundled with dependencies) | CI |
| `icon.png` | Plugin icon, 64x64 pixels, PNG format | CI |
| `CHANGELOG.md` | Version history in Keep a Changelog format | CI |
| `README.md` | Plugin documentation | CI |

### 4.4 Plugin Entry Point

The `index.js` must export a default plugin object:

```javascript
module.exports = {
  manifest: { /* loaded from manifest.json */ },

  // Lifecycle hooks (all optional)
  async onInstall(context) { /* First install OR update */ },
  async onUninstall(context) { /* Removal */ },
  async onLoad(context) { /* Loaded into memory */ },
  async onUnload(context) { /* Removed from memory */ },
  async onEnable(context) { /* Activated */ },
  async onDisable(context) { /* Deactivated */ },

  // Optional capabilities
  routes(router) { /* Express routes */ },
  webhooks() { /* Webhook endpoints */ },
  eventHandlers() { /* Event subscriptions */ },
  filterHandlers() { /* Data filters */ }
};
```

---

## 5. Plugin Lifecycle

### 5.1 Lifecycle Hooks

| Hook | When Called | Use Case |
|------|-------------|----------|
| `onInstall` | First installation AND updates | Create/migrate database tables, initialize data |
| `onUninstall` | Removal | Clean up (optional: delete data) |
| `onLoad` | After install, on server startup | Load resources into memory |
| `onUnload` | Before uninstall, on server shutdown | Release resources |
| `onEnable` | Plugin activated by admin | Subscribe to events, start processing |
| `onDisable` | Plugin deactivated by admin | Unsubscribe from events, stop processing |

### 5.2 Installation Flow

```
1. Admin clicks "Install" in UI
2. Verify VerifyWise version compatibility
3. Check plugin dependencies (must be installed first)
4. Download zip from GitHub releases
5. Verify SHA256 checksum
6. Extract to tenant's plugins directory
7. Validate manifest against schema
8. Call onInstall(context)
9. Call onLoad(context)
10. Save state to database (installed, not enabled)
11. Admin can now enable the plugin
```

### 5.3 Update Flow

```
1. Admin clicks "Update" in UI
2. If plugin enabled: Call onDisable(context)
3. Call onUnload(context)
4. Backup current version (for rollback)
5. Download new version zip
6. Verify SHA256 checksum
7. Extract and replace plugin files
8. Validate manifest
9. Call onInstall(context) ← runs migrations for new version
10. Call onLoad(context)
11. If was enabled: Call onEnable(context)
12. Update version in database
```

### 5.4 Uninstallation Options

| Option | Behavior | Hooks Called |
|--------|----------|--------------|
| **Uninstall** | Remove plugin code, keep data | `onDisable` → `onUnload` → `onUninstall` (deleteData=false) |
| **Uninstall and delete data** | Remove code AND all plugin data | `onDisable` → `onUnload` → `onUninstall` (deleteData=true) |

### 5.5 Rollback Flow

If an update causes issues, admin can rollback:

```
1. Admin clicks "Rollback" in UI
2. Call onDisable(context) if enabled
3. Call onUnload(context)
4. Restore previous version from backup
5. Call onLoad(context)
6. If was enabled: Call onEnable(context)
7. Update version in database
```

**Note:** Only 1 previous version is kept for rollback. Database migrations are NOT automatically reversed - plugins should handle backwards compatibility.

---

## 6. Plugin Permissions

Plugins must declare required permissions in their manifest. Users see these before installation.

| Permission | Description | Enforcement |
|------------|-------------|-------------|
| `database:read` | Read data from database | Runtime check on `context.db.query()` |
| `database:write` | Write data to database | Runtime check on `context.db.query()` |
| `events:emit` | Emit events to the system | Runtime check on `context.emit()` |
| `events:listen` | Listen to system events | Runtime check on `context.on()` |
| `filters:add` | Add data transformation filters | Runtime check on `context.addFilter()` |
| `config:read` | Read plugin configuration | Runtime check on `context.config.get()` |
| `config:write` | Write plugin configuration | Runtime check on `context.config.set()` |
| `http:outbound` | Make outbound HTTP requests | Runtime check on HTTP calls |
| `filesystem:read` | Read files from disk | Runtime check on file operations |
| `filesystem:write` | Write files to disk | Runtime check on file operations |
| `models:define` | Define Sequelize models | Runtime check on `context.models.define()` |
| `middleware:inject` | Inject middleware into routes | Runtime check on `context.middleware.add()` |

### 6.1 Permission Enforcement

When a plugin attempts an operation without the required permission:
1. Operation is blocked
2. Error logged with plugin context
3. `PermissionDeniedError` thrown
4. Plugin continues running (not auto-disabled for permission errors)

---

## 7. Configuration & Secrets

### 7.1 Configuration Schema

Plugins define their configuration in `manifest.json`:

```json
{
  "config": {
    "apiKey": {
      "type": "string",
      "required": true,
      "secret": true,
      "description": "API key for authentication"
    },
    "syncInterval": {
      "type": "number",
      "required": false,
      "default": 60,
      "min": 10,
      "max": 3600,
      "description": "Sync interval in seconds"
    },
    "environment": {
      "type": "string",
      "required": true,
      "enum": ["development", "staging", "production"],
      "description": "Target environment"
    },
    "enabledFeatures": {
      "type": "array",
      "required": false,
      "items": { "type": "string" },
      "description": "List of enabled features"
    },
    "emailPattern": {
      "type": "string",
      "required": false,
      "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "description": "Email validation pattern"
    }
  }
}
```

### 7.2 Config Field Types

| Type | Validation Options |
|------|-------------------|
| `string` | `required`, `default`, `secret`, `enum`, `pattern` (regex), `minLength`, `maxLength` |
| `number` | `required`, `default`, `min`, `max` |
| `boolean` | `required`, `default` |
| `array` | `required`, `default`, `items` (nested schema) |
| `object` | `required`, `default`, `properties` (nested schema) |

### 7.3 Secret Storage

- Fields marked with `secret: true` are encrypted at rest
- Encryption: AES-256-GCM
- Encryption key: Stored in `PLUGIN_SECRETS_KEY` environment variable
- Secrets decrypted only when plugin needs them
- Never exposed in API responses or logs
- Displayed as `••••••••` in UI

### 7.4 Accessing Configuration

```typescript
// In plugin code
async onEnable(context: PluginContext) {
  const apiKey = context.config.get<string>("apiKey");
  const interval = context.config.get<number>("syncInterval", 60);

  // Use configuration values
}
```

---

## 8. Plugin Registry

### 8.1 Registry Location

```
Repository: https://github.com/bluewave-labs/verifywise-apps
Registry URL: https://raw.githubusercontent.com/bluewave-labs/verifywise-apps/main/registry.json
```

### 8.2 Repository Structure

```
verifywise-apps/
├── plugins/
│   ├── slack-notifications/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── manifest.json
│   │   ├── icon.png
│   │   ├── CHANGELOG.md
│   │   ├── README.md
│   │   └── package.json
│   ├── jira-integration/
│   │   └── ...
│   └── audit-trail/
│       └── ...
├── registry.json              # Auto-generated by CI
├── schema/
│   └── manifest.schema.json   # JSON Schema for validation
└── .github/
    └── workflows/
        └── build-plugins.yml  # CI workflow
```

### 8.3 Registry Format

The `registry.json` is auto-generated by CI from individual plugin manifests:

```json
{
  "version": "1.0.0",
  "generated": "2024-12-07T12:00:00Z",
  "plugins": [
    {
      "id": "slack-notifications",
      "name": "Slack Notifications",
      "description": "Send real-time notifications to Slack...",
      "version": "1.0.0",
      "author": {
        "name": "VerifyWise",
        "url": "https://verifywise.ai"
      },
      "homepage": "https://docs.verifywise.ai/plugins/slack-notifications",
      "repository": "https://github.com/bluewave-labs/verifywise-apps",
      "support": "https://github.com/bluewave-labs/verifywise-apps/issues",
      "type": "integration",
      "tags": ["slack", "notifications"],
      "icon": "https://raw.githubusercontent.com/bluewave-labs/verifywise-apps/main/plugins/slack-notifications/icon.png",
      "download": "https://github.com/bluewave-labs/verifywise-apps/releases/download/slack-notifications-1.0.0/slack-notifications-1.0.0.zip",
      "checksum": "sha256:abc123def456...",
      "compatibility": {
        "minVersion": "1.6.0"
      },
      "permissions": ["events:listen", "config:read", "http:outbound"],
      "dependencies": {}
    }
  ]
}
```

### 8.4 Build & Release Process (CI)

When a PR is merged to `verifywise-apps`:

```
1. CI detects changed plugin folders
2. For each changed plugin:
   a. Validate manifest.json against schema
   b. Validate icon.png (64x64 PNG)
   c. Validate CHANGELOG.md exists
   d. Validate README.md exists
   e. Install npm dependencies (if package.json exists)
   f. Build TypeScript: src/index.ts → dist/index.js
   g. Bundle with esbuild (include all dependencies)
   h. Create zip: {id}-{version}.zip
   i. Calculate SHA256 checksum
   j. Create GitHub release with zip attached
3. Regenerate registry.json with all plugins
4. Commit and push registry.json
```

### 8.5 Plugin Submission Process

1. Fork `verifywise-apps` repository
2. Create plugin folder: `/plugins/my-plugin/`
3. Add required files:
   - `manifest.json` - Plugin metadata
   - `src/index.ts` - Plugin source code
   - `icon.png` - 64x64 PNG icon
   - `CHANGELOG.md` - Version history
   - `README.md` - Documentation
   - `package.json` - If using npm dependencies
4. Submit Pull Request
5. Core team reviews for security and quality
6. On merge, CI automatically:
   - Validates all files
   - Builds and bundles the plugin
   - Creates GitHub release
   - Updates registry.json
7. Plugin appears in VerifyWise plugin browser

---

## 9. Installation & Updates

### 9.1 Installation Sources

| Source | Indicator | Trust Level | Checksum Verified |
|--------|-----------|-------------|-------------------|
| Official Registry | "Verified" badge | High - reviewed by core team | Yes |
| Manual Upload | "Manually installed" | User responsibility | Yes |

### 9.2 Update Detection

- When admin visits Plugins page, fetch latest `registry.json`
- Compare installed versions with registry versions
- Show update badge: "Installed: 1.0.0 → Available: 1.1.0"
- Admin manually triggers update

### 9.3 Dependency Handling

When installing a plugin with dependencies:

1. Check if all dependencies are installed
2. If missing dependencies:
   - Show list of required plugins
   - Option to "Install all dependencies" (installs in order)
   - Or block installation until dependencies installed manually
3. Dependencies are installed but NOT automatically enabled
4. Load order respects dependency graph

When uninstalling a plugin:
- Check if other plugins depend on it
- Warn admin: "Plugin X depends on this. Uninstalling will also uninstall X."
- Admin confirms or cancels

### 9.4 Size Limit

Maximum plugin zip size: **50 MB**

---

## 10. Plugin Webhooks

Plugins can register webhook endpoints to receive external callbacks.

### 10.1 Registering Webhooks

```typescript
// In plugin code
module.exports = {
  webhooks() {
    return {
      // Registers: POST /api/plugins/jira-integration/webhooks/issue-updated
      'issue-updated': {
        method: 'POST',
        handler: async (req, res, context) => {
          const payload = req.body;
          context.logger.info('Jira issue updated', payload);

          // Process webhook
          await processJiraUpdate(payload, context);

          res.status(200).json({ received: true });
        }
      },
      // Registers: POST /api/plugins/jira-integration/webhooks/comment-added
      'comment-added': {
        method: 'POST',
        handler: async (req, res, context) => {
          // Handle comment webhook
        }
      }
    };
  }
};
```

### 10.2 Webhook URL Format

```
POST /api/plugins/{plugin-id}/webhooks/{webhook-name}
```

Example: `POST /api/plugins/jira-integration/webhooks/issue-updated`

### 10.3 Webhook Security

- Webhooks only active when plugin is enabled
- Plugins should implement their own signature verification
- Rate limiting applied per-plugin (100 requests/minute default)

---

## 11. Plugin Development

### 11.1 Development Mode

For local plugin development without going through GitHub:

**Configuration file** (`config/plugins.json`):
```json
{
  "development": {
    "enabled": true,
    "paths": [
      "/path/to/my-local-plugin"
    ]
  }
}
```

Plugins in development paths:
- Loaded directly from source (no zip needed)
- Reloaded on server restart
- Not shown as "verified" in UI

### 11.2 Development Upload

For testing packaged plugins before submitting to registry:
- Endpoint: `POST /api/plugins/upload`
- Admin authentication required
- Accepts multipart form with zip file
- Checksum verified after upload
- Marked as "Manually installed" in UI

### 11.3 Building Plugins

Plugins should be built with esbuild (recommended):

```javascript
// build.js
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/index.js',
  external: [], // Bundle everything
  minify: true,
  sourcemap: false,
});
```

### 11.4 Local Testing Checklist

- [ ] Plugin loads without errors
- [ ] All lifecycle hooks work correctly
- [ ] Configuration schema validates
- [ ] Permissions are correctly declared
- [ ] Webhook endpoints respond
- [ ] Database migrations run successfully
- [ ] Multi-tenant data isolation works

---

## 13. UI Extension Points

Plugins can extend the VerifyWise UI through defined extension points.

### 13.1 Extension Points

| Extension Point | Description | Status |
|-----------------|-------------|--------|
| Plugin settings page | `/settings/plugins/[plugin-id]` - Full page for plugin config | **Available** |
| Dashboard widgets | Add widgets to main dashboard using templates | **Available** |
| Risk card actions | Add buttons to risk cards (e.g., "Send to Jira") | Planned |
| Project sidebar items | Add navigation items to project sidebar | Planned |
| Report sections | Add custom sections to reports | Planned |

### 13.2 Dashboard Widget Extensions

Plugins can register dashboard widgets that appear on the main dashboard:

```typescript
const plugin: Plugin = {
  manifest: { ... },

  uiExtensions: {
    dashboardWidgets: [
      {
        widgetId: "my-plugin-stats",
        pluginId: "my-plugin",
        title: "Plugin Statistics",
        template: "stats-card",    // Use built-in template
        endpoint: "/dashboard/widget",  // API endpoint for data
        config: {
          refreshInterval: 30,
          showChange: true
        }
      }
    ]
  }
};
```

### 13.3 Fetching Widget Extensions

The frontend fetches all plugin UI extensions via:

```
GET /api/plugins/ui-extensions
```

Response:
```json
{
  "success": true,
  "data": {
    "dashboardWidgets": [
      {
        "widgetId": "activity-feed-widget",
        "pluginId": "activity-feed",
        "title": "Recent Activity",
        "template": "activity-feed",
        "endpoint": "/activity",
        "config": { "limit": 10 }
      }
    ]
  }
}
```

---

## 14. Dashboard Widget Templates

Plugins can use pre-built widget templates for dashboard integration. Templates are optional conveniences that simplify plugin development.

### 14.1 Available Templates

| Template | Description | Use Case |
|----------|-------------|----------|
| `activity-feed` | Activity log with avatars and timestamps | Recent actions, audit logs |
| `list` | Generic list of items with icons | Todo items, notifications |
| `stats-card` | Single metric card with change indicator | KPIs, counters |
| `table` | Tabular data display | Data listings, reports |
| `chart` | Bar, line, pie, donut charts (Recharts) | Analytics, trends |
| `timeline` | Chronological events with icons | History, milestones |
| `progress` | Circular, linear, gauge indicators | Completion tracking |
| `alerts` | Severity-based notifications | Critical issues, warnings |
| `calendar` | Read-only calendar with events | Deadlines, schedules |
| `card-grid` | Multiple mini stats cards | Dashboard overview |

### 14.2 Template Data Contracts

Each template expects data from the plugin's API endpoint in a specific format.

#### `stats-card` Template

```json
{
  "success": true,
  "data": {
    "value": 42,
    "label": "Total Risks",
    "change": "+5",
    "changeType": "increase",
    "icon": "shield"
  }
}
```

#### `list` Template

```json
{
  "success": true,
  "data": {
    "items": [
      { "id": "1", "title": "Item 1", "icon": "check", "url": "/item/1" }
    ],
    "total": 10
  }
}
```

#### `table` Template

```json
{
  "success": true,
  "data": {
    "columns": ["Name", "Status", "Date"],
    "rows": [
      ["Risk A", "Open", "2024-01-15"],
      ["Risk B", "Closed", "2024-01-10"]
    ],
    "total": 2
  }
}
```

#### `activity-feed` Template

```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "1",
        "action": "created",
        "entityType": "risk",
        "entityName": "Data Breach Risk",
        "user": { "name": "John Doe", "avatar": "https://..." },
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

#### `chart` Template

```json
{
  "success": true,
  "data": {
    "type": "bar",
    "labels": ["Jan", "Feb", "Mar"],
    "datasets": [
      { "label": "Risks", "data": [10, 15, 8], "color": "#13715B" }
    ]
  }
}
```

#### `alerts` Template

```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "1",
        "title": "Critical Deadline",
        "message": "Compliance review due tomorrow",
        "severity": "critical",
        "actionLabel": "View",
        "actionUrl": "/reviews/123"
      }
    ]
  }
}
```

#### `card-grid` Template

```json
{
  "success": true,
  "data": {
    "cards": [
      { "id": "1", "label": "Risks", "value": 42, "icon": "shield", "color": "#dc2626" },
      { "id": "2", "label": "Controls", "value": 156, "icon": "check", "color": "#16a34a" }
    ]
  }
}
```

### 14.3 Template Configuration

Each template supports configuration options:

```typescript
{
  widgetId: "my-widget",
  pluginId: "my-plugin",
  title: "Widget Title",
  template: "table",
  endpoint: "/data",
  config: {
    refreshInterval: 60,     // Auto-refresh in seconds
    pageSize: 10,           // Items per page (for lists/tables)
    columns: 2,             // Grid columns (for card-grid)
    compact: true,          // Compact mode
    emptyMessage: "No data" // Custom empty state message
  }
}
```

### 14.4 Custom Widgets (Built-in Plugins Only)

Built-in plugins can render custom React components instead of templates by including the component directly in the plugin code. This is not available for marketplace plugins.

---

## 15. Database & Migrations

### 15.1 Plugin Database Access

Plugins can create their own tables using migrations in the `onInstall` hook:

```typescript
async onInstall(context: PluginContext) {
  // Get current migration version
  const currentVersion = await context.metadata.get('system', 0, 'db_version') || 0;

  // Run migrations
  if (currentVersion < 1) {
    await context.db.query(`
      CREATE TABLE IF NOT EXISTS plugin_jira_integration_mappings (
        id SERIAL PRIMARY KEY,
        risk_id INTEGER NOT NULL,
        jira_issue_key VARCHAR(50) NOT NULL,
        synced_at TIMESTAMP DEFAULT NOW(),
        tenant VARCHAR(100) NOT NULL
      )
    `);
    await context.metadata.set('system', 0, 'db_version', 1);
  }

  if (currentVersion < 2) {
    await context.db.query(`
      ALTER TABLE plugin_jira_integration_mappings
      ADD COLUMN IF NOT EXISTS last_sync_status VARCHAR(20)
    `);
    await context.metadata.set('system', 0, 'db_version', 2);
  }
}
```

### 13.2 Table Naming Convention

Plugin database tables must follow naming convention:

```
plugin_{plugin_id_underscored}_{table_name}
```

Examples:
- Plugin ID: `jira-integration` → `plugin_jira_integration_mappings`
- Plugin ID: `slack-notifications` → `plugin_slack_notifications_logs`

**Note:** Hyphens in plugin ID are converted to underscores for SQL compatibility.

### 13.3 Migration Best Practices

- Always use `IF NOT EXISTS` for table creation
- Always use `IF NOT EXISTS` for column additions
- Include `tenant` column for multi-tenant support
- Use transactions for data migrations
- Store migration version in plugin metadata
- Design for forward compatibility (rollback won't reverse migrations)

### 13.4 Data Cleanup on Uninstall

When "Uninstall and delete data" is selected:

```typescript
async onUninstall(context: PluginContext) {
  // Check if data deletion was requested
  const deleteData = context.options?.deleteData ?? false;

  if (deleteData) {
    await context.db.query('DROP TABLE IF EXISTS plugin_jira_integration_mappings');
    await context.metadata.deleteByPlugin();
    context.logger.info('Plugin data deleted');
  } else {
    context.logger.info('Plugin uninstalled, data preserved');
  }
}
```

---

## 14. Error Handling

### 14.1 Plugin Errors

If an enabled plugin throws an unhandled error:

1. Error is logged with plugin context and stack trace
2. Plugin is automatically disabled
3. Admin is notified via system alert
4. Other plugins continue running unaffected
5. Error details stored for admin review

### 14.2 Error States

| Error Type | Action | Recovery |
|------------|--------|----------|
| Lifecycle hook error | Auto-disable plugin | Admin fixes config, re-enables |
| Event handler error | Log, continue processing | Automatic (next event) |
| Permission denied | Log, throw error | Fix plugin permissions |
| Webhook error | Return 500, log | Automatic (next request) |

### 14.3 Startup Errors

If a plugin fails during server startup:
- Log error with full details
- Skip plugin, continue loading others
- Mark plugin as "error" state in UI
- Store error message for admin review

### 14.4 Error Information

Admin can view in Plugins UI:
- Last error message
- Error timestamp
- Stack trace (expandable)
- Suggested fix (if known error type)

---

## 15. Multi-tenant Support

### 15.1 Tenant Isolation

- **Installation**: Per-tenant (each tenant downloads and installs separately)
- **Configuration**: Per-tenant (each tenant has own config values)
- **State**: Per-tenant (enabled/disabled independently)
- **Data**: Per-tenant (all plugin tables include `tenant` column)

### 15.2 Installation Per Tenant

When tenant admin installs a plugin:
1. Plugin zip downloaded to tenant's storage
2. Plugin state saved with tenant ID
3. Other tenants unaffected

Benefits:
- Tenants can have different plugin versions
- Tenant data fully isolated
- One tenant's plugin issues don't affect others

### 15.3 Context Tenant

```typescript
async onEnable(context: PluginContext) {
  const tenant = context.tenant; // Current tenant ID

  // All queries automatically scoped to tenant
  const result = await context.db.query(
    'SELECT * FROM plugin_jira_integration_mappings WHERE tenant = $1',
    [tenant]
  );

  // Metadata also scoped to tenant
  await context.metadata.set('settings', 0, 'lastSync', new Date());
}
```

---

## 16. Version Comparison

### 16.1 Version Format

Versions follow Semantic Versioning (semver):
- `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)
- `MAJOR.MINOR` also valid (e.g., `1.2` treated as `1.2.0`)

### 16.2 Comparison Rules

| Operator | Meaning | Example |
|----------|---------|---------|
| `>=` | Greater than or equal | `>=1.0.0` matches 1.0.0, 1.0.1, 2.0.0 |
| `>` | Greater than | `>1.0.0` matches 1.0.1, 2.0.0, not 1.0.0 |
| `<=` | Less than or equal | `<=2.0.0` matches 1.0.0, 2.0.0, not 2.0.1 |
| `<` | Less than | `<2.0.0` matches 1.0.0, 1.9.9, not 2.0.0 |
| `=` | Exact match | `=1.5.0` matches only 1.5.0 |
| `^` | Compatible | `^1.2.0` matches >=1.2.0 and <2.0.0 |
| `~` | Approximately | `~1.2.0` matches >=1.2.0 and <1.3.0 |

### 16.3 Compatibility Check

```typescript
// VerifyWise checks before installation:
const vwVersion = '1.7.0';
const pluginMinVersion = '1.6.0';

if (semver.lt(vwVersion, pluginMinVersion)) {
  throw new Error(`Plugin requires VerifyWise ${pluginMinVersion} or higher`);
}
```

---

## 17. Available Events Reference

Plugins can subscribe to the following events using `context.on(eventName, handler)`.

### 17.1 Event Payload Structure

All events include a base payload:

```typescript
interface BaseEventPayload {
  tenant: string;           // Tenant identifier
  timestamp: Date;          // When the event occurred
  triggeredBy: {
    userId: number;         // User who triggered the event
    email?: string;         // User's email (if available)
    name?: string;          // User's name (if available)
  };
}
```

### 17.2 Entity Events

#### Project Events

| Event | Additional Payload Fields |
|-------|---------------------------|
| `project:created` | `projectId`, `project` (full entity) |
| `project:updated` | `projectId`, `project`, `changes` |
| `project:deleted` | `projectId`, `project` (snapshot before deletion) |

#### Risk Events (Project-level)

| Event | Additional Payload Fields |
|-------|---------------------------|
| `risk:created` | `riskId`, `projectId`, `risk` |
| `risk:updated` | `riskId`, `projectId`, `risk`, `changes` |
| `risk:deleted` | `riskId`, `projectId`, `risk` |
| `risk:mitigated` | `riskId`, `projectId`, `risk`, `mitigationStatus`, `previousStatus` |

#### Vendor Events

| Event | Additional Payload Fields |
|-------|---------------------------|
| `vendor:created` | `vendorId`, `projectId`, `vendor` |
| `vendor:updated` | `vendorId`, `projectId`, `vendor`, `changes` |
| `vendor:deleted` | `vendorId`, `projectId`, `vendor` |

#### Vendor Risk Events

| Event | Additional Payload Fields |
|-------|---------------------------|
| `vendor_risk:created` | `vendorRiskId`, `vendorId`, `projectId`, `vendorRisk` |
| `vendor_risk:updated` | `vendorRiskId`, `vendorId`, `projectId`, `vendorRisk`, `changes` |
| `vendor_risk:deleted` | `vendorRiskId`, `vendorId`, `projectId`, `vendorRisk` |
| `vendor_risk:mitigated` | `vendorRiskId`, `vendorId`, `projectId`, `vendorRisk`, `mitigationStatus`, `previousStatus` |

#### Model Inventory Events

| Event | Additional Payload Fields |
|-------|---------------------------|
| `model:created` | `modelId`, `projectId`, `model` |
| `model:updated` | `modelId`, `projectId`, `model`, `changes` |
| `model:deleted` | `modelId`, `projectId`, `model` |
| `model:status_changed` | `modelId`, `projectId`, `model`, `previousStatus`, `newStatus` |

#### Model Risk Events

| Event | Additional Payload Fields |
|-------|---------------------------|
| `model_risk:created` | `modelRiskId`, `modelId`, `projectId`, `modelRisk` |
| `model_risk:updated` | `modelRiskId`, `modelId`, `projectId`, `modelRisk`, `changes` |
| `model_risk:deleted` | `modelRiskId`, `modelId`, `projectId`, `modelRisk` |
| `model_risk:mitigated` | `modelRiskId`, `modelId`, `projectId`, `modelRisk`, `mitigationStatus`, `previousStatus` |

#### Incident Events

| Event | Additional Payload Fields |
|-------|---------------------------|
| `incident:created` | `incidentId`, `projectId?`, `incident` |
| `incident:updated` | `incidentId`, `projectId?`, `incident`, `changes` |
| `incident:deleted` | `incidentId`, `projectId?`, `incident` |
| `incident:resolved` | `incidentId`, `projectId?`, `incident`, `resolution` |

#### Policy Events

| Event | Additional Payload Fields |
|-------|---------------------------|
| `policy:created` | `policyId`, `projectId?`, `policy` |
| `policy:updated` | `policyId`, `projectId?`, `policy`, `changes` |
| `policy:deleted` | `policyId`, `projectId?`, `policy` |
| `policy:published` | `policyId`, `projectId?`, `policy`, `version` |

#### Task Events

| Event | Additional Payload Fields |
|-------|---------------------------|
| `task:created` | `taskId`, `projectId?`, `task` |
| `task:updated` | `taskId`, `projectId?`, `task`, `changes` |
| `task:deleted` | `taskId`, `projectId?`, `task` |
| `task:completed` | `taskId`, `projectId?`, `task` |
| `task:assigned` | `taskId`, `projectId?`, `task`, `assigneeId`, `previousAssigneeId?` |

#### Training Events

| Event | Additional Payload Fields |
|-------|---------------------------|
| `training:created` | `trainingId`, `training` |
| `training:updated` | `trainingId`, `training`, `changes` |
| `training:deleted` | `trainingId`, `training` |
| `training:completed` | `trainingId`, `training`, `completedByUserId` |
| `training:assigned` | `trainingId`, `training`, `assignedUserIds` |

#### Note Events

| Event | Additional Payload Fields |
|-------|---------------------------|
| `note:created` | `noteId`, `entityType`, `entityId`, `note` |
| `note:updated` | `noteId`, `entityType`, `entityId`, `note`, `changes` |
| `note:deleted` | `noteId`, `entityType`, `entityId`, `note` |

#### File Events

| Event | Additional Payload Fields |
|-------|---------------------------|
| `file:uploaded` | `fileId`, `entityType?`, `entityId?`, `file` |
| `file:updated` | `fileId`, `entityType?`, `entityId?`, `file`, `changes` |
| `file:deleted` | `fileId`, `entityType?`, `entityId?`, `file` |

#### User Events

| Event | Additional Payload Fields |
|-------|---------------------------|
| `user:login` | `userId`, `user` |
| `user:logout` | `userId` |
| `user:created` | `userId`, `user` |
| `user:updated` | `userId`, `user`, `changes` |
| `user:deleted` | `userId`, `user` |

#### Framework Events

| Event | Additional Payload Fields |
|-------|---------------------------|
| `framework:added` | `projectId`, `projectFrameworkId`, `frameworkId`, `framework` |
| `framework:removed` | `projectId`, `projectFrameworkId`, `frameworkId`, `framework` |
| `framework:progress_changed` | `projectId`, `projectFrameworkId`, `frameworkId`, `previousProgress`, `progress` |

#### Report Events

| Event | Additional Payload Fields |
|-------|---------------------------|
| `report:generated` | `reportId`, `reportType`, `projectId`, `report` |
| `report:exported` | `reportId`, `format`, `projectId`, `report` |

### 17.3 Plugin Lifecycle Events

These events are system-triggered (no `triggeredBy`):

| Event | Payload Fields |
|-------|----------------|
| `plugin:loaded` | `pluginId`, `timestamp` |
| `plugin:unloaded` | `pluginId`, `timestamp` |
| `plugin:enabled` | `pluginId`, `timestamp` |
| `plugin:disabled` | `pluginId`, `timestamp` |

### 17.4 The `changes` Object

For update events, the `changes` object contains before/after values for each changed field:

```typescript
interface Changes {
  [fieldName: string]: {
    before: unknown;
    after: unknown;
  };
}

// Example
{
  "status": { "before": "draft", "after": "published" },
  "title": { "before": "Old Title", "after": "New Title" }
}
```

### 17.5 Subscribing to Events

```typescript
async onEnable(context: PluginContext) {
  // Subscribe to risk creation
  context.on('risk:created', async (payload) => {
    const { riskId, projectId, risk, triggeredBy } = payload;
    context.logger.info(`Risk ${riskId} created by user ${triggeredBy.userId}`);

    // Send notification, sync to external system, etc.
  });

  // Subscribe to task completion
  context.on('task:completed', async (payload) => {
    const { taskId, task, triggeredBy } = payload;
    // Handle task completion
  });
}
```

---

## 18. Marketplace Backend API

The marketplace backend provides APIs for browsing, searching, and installing plugins from the official registry.

### 18.1 Registry Configuration

```
Registry URL: https://raw.githubusercontent.com/bluewave-labs/verifywise-apps/main/registry.json
Cache TTL: 15 minutes
```

### 18.2 Marketplace Endpoints

#### GET /api/marketplace

Browse all available plugins from the marketplace.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter by plugin type: `integration`, `feature`, `framework`, `reporting` |
| `search` | string | Search by name, description, or tags |
| `installed` | string | Filter by status: `true` (installed), `false` (not installed), `updates` (has updates) |
| `refresh` | boolean | Force refresh the registry cache |

**Response:**

```json
{
  "success": true,
  "data": {
    "registryVersion": "1.0.0",
    "registryUpdated": "2024-12-07T12:00:00Z",
    "plugins": [
      {
        "id": "slack-notifications",
        "name": "Slack Notifications",
        "description": "Send real-time notifications to Slack...",
        "version": "1.0.0",
        "author": { "name": "VerifyWise", "url": "https://verifywise.ai" },
        "type": "integration",
        "tags": ["slack", "notifications"],
        "icon": "https://...",
        "download": "https://github.com/.../slack-notifications-1.0.0.zip",
        "checksum": "sha256:abc123...",
        "permissions": ["events:listen", "config:read", "http:outbound"],
        "installed": true,
        "installedVersion": "1.0.0",
        "enabled": true,
        "hasUpdate": false
      }
    ],
    "total": 1
  }
}
```

#### GET /api/marketplace/:id

Get details of a specific marketplace plugin.

#### GET /api/marketplace/categories

Get available plugin categories with counts.

**Response:**

```json
{
  "success": true,
  "data": [
    { "type": "integration", "count": 5, "label": "Integration" },
    { "type": "feature", "count": 3, "label": "Feature" },
    { "type": "framework", "count": 2, "label": "Framework" }
  ]
}
```

#### GET /api/marketplace/tags

Get all available tags with counts, sorted by popularity.

**Response:**

```json
{
  "success": true,
  "data": [
    { "tag": "notifications", "count": 4 },
    { "tag": "slack", "count": 2 },
    { "tag": "jira", "count": 2 }
  ]
}
```

#### GET /api/marketplace/updates

Get plugins that have updates available.

**Response:**

```json
{
  "success": true,
  "data": {
    "plugins": [
      {
        "id": "slack-notifications",
        "installedVersion": "1.0.0",
        "version": "1.1.0",
        "hasUpdate": true
      }
    ],
    "total": 1
  }
}
```

#### POST /api/marketplace/refresh

Force refresh the registry cache.

### 18.3 Plugin Management Endpoints

#### GET /api/plugins

List all registered plugins (installed and built-in).

#### POST /api/plugins/install-from-url

Install a plugin from the marketplace.

**Request Body:**

```json
{
  "id": "slack-notifications",
  "name": "Slack Notifications",
  "version": "1.0.0",
  "downloadUrl": "https://github.com/.../slack-notifications-1.0.0.zip",
  "checksum": "sha256:abc123..."
}
```

**Security:**
- Only URLs from allowed domains accepted (github.com, githubusercontent.com)
- SHA256 checksum verified before installation
- Manifest ID must match expected plugin ID

#### POST /api/plugins/upload

Upload a plugin manually (ZIP file).

- Accepts multipart form with `plugin` field
- Maximum file size: 10 MB
- ZIP must contain `manifest.json` at root level

#### POST /api/plugins/:id/enable

Enable an installed plugin.

#### POST /api/plugins/:id/disable

Disable an enabled plugin.

#### POST /api/plugins/:id/uninstall

Uninstall a plugin.

#### GET /api/plugins/:id/config

Get plugin configuration and schema.

#### PUT /api/plugins/:id/config

Update plugin configuration.

### 18.4 Marketplace Frontend Integration

The frontend can use these endpoints to build a plugin marketplace experience:

```typescript
// Browse marketplace
const { data } = await fetch('/api/marketplace?type=integration');

// Search plugins
const { data } = await fetch('/api/marketplace?search=slack');

// Check for updates
const { data } = await fetch('/api/marketplace/updates');

// Install from marketplace
await fetch('/api/plugins/install-from-url', {
  method: 'POST',
  body: JSON.stringify({
    id: plugin.id,
    name: plugin.name,
    version: plugin.version,
    downloadUrl: plugin.download,
    checksum: plugin.checksum
  })
});

// Enable after install
await fetch(`/api/plugins/${plugin.id}/enable`, { method: 'POST' });
```

---

## 19. Plugin Scheduler API

The Plugin Scheduler API allows plugins to schedule background and recurring jobs using BullMQ and Redis. Plugins can schedule tasks using cron patterns, fixed intervals, or one-time delayed execution.

### 19.1 Overview

The scheduler is available through the plugin context:

```typescript
// In your plugin's onEnable or other lifecycle methods
async onEnable(context: PluginContext): Promise<void> {
  // Schedule a recurring job using cron pattern
  await context.scheduler.schedule(
    'daily-sync',
    async (data, ctx) => {
      context.logger.info('Running daily sync job');
      // Your job logic here
    },
    { cron: '0 0 * * *' } // Run at midnight every day
  );
}
```

### 19.2 Scheduler API Reference

| Method | Description |
|--------|-------------|
| `schedule(name, handler, options, data?)` | Schedule a recurring job |
| `scheduleOnce(name, handler, delay, data?)` | Schedule a one-time delayed job |
| `cancel(name)` | Cancel a scheduled job by name |
| `cancelAll()` | Cancel all jobs for this plugin |
| `list()` | List all scheduled jobs for this plugin |
| `exists(name)` | Check if a job with the given name exists |

### 19.3 Schedule Options

```typescript
interface ScheduleJobOptions {
  /** Cron pattern (e.g., "0 * * * *" for every hour) */
  cron?: string;

  /** Interval in milliseconds (alternative to cron) */
  every?: number;

  /** Delay before first execution in milliseconds */
  delay?: number;

  /** Maximum number of times to repeat (undefined = forever) */
  limit?: number;

  /** Job priority (lower = higher priority) */
  priority?: number;

  /** Number of retry attempts on failure (default: 3) */
  attempts?: number;

  /** Backoff strategy for retries */
  backoff?: {
    type: "fixed" | "exponential";
    delay: number; // milliseconds
  };
}
```

### 19.4 Common Cron Patterns

| Pattern | Description |
|---------|-------------|
| `* * * * *` | Every minute |
| `0 * * * *` | Every hour |
| `0 0 * * *` | Every day at midnight |
| `0 0 * * 0` | Every Sunday at midnight |
| `0 0 1 * *` | First day of every month |
| `*/15 * * * *` | Every 15 minutes |
| `0 9-17 * * 1-5` | Every hour 9am-5pm, Mon-Fri |

### 19.5 Examples

**Schedule a job with interval:**

```typescript
// Run every 5 minutes
await context.scheduler.schedule(
  'check-updates',
  async (data, ctx) => {
    console.log(`Checking updates (attempt ${ctx.attemptsMade + 1})`);
  },
  { every: 5 * 60 * 1000 }
);
```

**Schedule a one-time delayed job:**

```typescript
// Run once after 30 seconds
await context.scheduler.scheduleOnce(
  'delayed-notification',
  async (data, ctx) => {
    await sendNotification(data.message);
  },
  30000, // 30 seconds
  { message: 'Welcome to VerifyWise!' }
);
```

**Pass data to job handler:**

```typescript
await context.scheduler.schedule(
  'weekly-report',
  async (data, ctx) => {
    const { reportType, recipients } = data;
    await generateAndSendReport(reportType, recipients, ctx.tenant);
  },
  { cron: '0 9 * * 1' }, // Every Monday at 9am
  {
    reportType: 'compliance-summary',
    recipients: ['admin@example.com']
  }
);
```

**Cancel jobs on plugin disable:**

```typescript
async onDisable(context: PluginContext): Promise<void> {
  // Cancel all scheduled jobs for this plugin
  const cancelled = await context.scheduler.cancelAll();
  context.logger.info(`Cancelled ${cancelled} scheduled jobs`);
}
```

**List all scheduled jobs:**

```typescript
const jobs = await context.scheduler.list();
for (const job of jobs) {
  console.log(`Job: ${job.name}, Next run: ${job.nextRun}`);
}
```

### 19.6 Job Handler Context

When a job handler is called, it receives a context object with useful information:

```typescript
interface JobContext {
  jobId: string;       // Unique job ID
  attemptsMade: number; // Number of retry attempts made
  pluginId: string;    // ID of the plugin that scheduled this job
  tenant: string;      // Tenant context
}
```

### 19.7 Error Handling

Jobs that throw errors are automatically retried based on the configured `attempts` and `backoff` options:

```typescript
await context.scheduler.schedule(
  'risky-operation',
  async (data, ctx) => {
    if (ctx.attemptsMade >= 3) {
      // Final attempt, handle gracefully
      context.logger.error('Operation failed after 3 attempts');
      return;
    }
    throw new Error('Temporary failure');
  },
  {
    every: 60000,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 }
  }
);
```

### 19.8 Best Practices

1. **Unique job names**: Use descriptive, unique names within your plugin
2. **Cleanup on disable**: Cancel all jobs when your plugin is disabled
3. **Handle retries gracefully**: Check `attemptsMade` to handle final attempts differently
4. **Use appropriate intervals**: Avoid scheduling jobs too frequently
5. **Log job execution**: Use the plugin logger to track job progress
6. **Pass minimal data**: Keep job data small; fetch details when the job runs

---

## 22. Plugin Model API

The Plugin Model API allows plugins to define their own Sequelize models for database operations. Models are automatically prefixed to prevent conflicts between plugins.

### 22.1 Overview

The model API is available through the plugin context:

```typescript
async onInstall(context: PluginContext): Promise<void> {
  // Define a model with Sequelize-like syntax
  context.models.define('AuditLog', {
    id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
    entityType: { type: 'STRING', allowNull: false },
    entityId: { type: 'INTEGER', allowNull: false },
    action: { type: 'STRING', allowNull: false },
    userId: { type: 'INTEGER', references: { model: 'users', key: 'id' } },
    details: { type: 'JSONB' },
    tenant: { type: 'STRING', allowNull: false }
  }, {
    timestamps: true,
    indexes: [
      { fields: ['entityType', 'entityId'] },
      { fields: ['userId'] }
    ]
  });

  // Sync models to database (creates tables)
  await context.models.sync();
}
```

### 22.2 Table Naming Convention

Plugin tables are automatically prefixed to prevent conflicts:

```
plugin_{plugin_id_underscored}_{model_name_snake_case}
```

Examples:
- Plugin ID: `audit-trail`, Model: `AuditLog` → `plugin_audit_trail_audit_log`
- Plugin ID: `jira-sync`, Model: `IssueMapping` → `plugin_jira_sync_issue_mapping`

### 22.3 Model API Reference

| Method | Description |
|--------|-------------|
| `define(name, attributes, options?)` | Define a new model |
| `get<T>(name)` | Get a previously defined model |
| `getCoreModel<T>(name)` | Get a core VerifyWise model (User, Project, etc.) |
| `sync(options?)` | Sync all models to database |
| `dropAll()` | Drop all plugin tables |
| `list()` | List all defined model names |
| `has(name)` | Check if a model is defined |

### 22.4 Supported Data Types

| Type | Sequelize Equivalent |
|------|---------------------|
| `STRING` | DataTypes.STRING |
| `TEXT` | DataTypes.TEXT |
| `INTEGER` | DataTypes.INTEGER |
| `BIGINT` | DataTypes.BIGINT |
| `FLOAT` | DataTypes.FLOAT |
| `DOUBLE` | DataTypes.DOUBLE |
| `DECIMAL` | DataTypes.DECIMAL |
| `BOOLEAN` | DataTypes.BOOLEAN |
| `DATE` | DataTypes.DATE |
| `DATEONLY` | DataTypes.DATEONLY |
| `JSON` | DataTypes.JSON |
| `JSONB` | DataTypes.JSONB |
| `UUID` | DataTypes.UUID |
| `ENUM` | DataTypes.ENUM (requires `values` array) |

### 22.5 Attribute Options

```typescript
interface PluginModelAttributeDefinition {
  type: string;            // Required: data type name
  allowNull?: boolean;     // Allow NULL values (default: true)
  defaultValue?: unknown;  // Default value
  primaryKey?: boolean;    // Is primary key
  autoIncrement?: boolean; // Auto-increment (for INTEGER)
  unique?: boolean;        // Unique constraint
  values?: string[];       // For ENUM type
  references?: {           // Foreign key reference
    model: string;
    key: string;
  };
  onDelete?: string;       // CASCADE, SET NULL, etc.
  onUpdate?: string;       // CASCADE, SET NULL, etc.
}
```

### 22.6 Working with Core Models

Plugins can reference core VerifyWise models for relationships:

```typescript
// Available core models
const coreModels = [
  'User', 'Project', 'Risk', 'Vendor', 'VendorRisk',
  'Model', 'ModelRisk', 'Task', 'Incident', 'Policy',
  'Training', 'Note', 'File'
];

// Get a core model
const UserModel = context.models.getCoreModel('User');
if (UserModel) {
  const user = await UserModel.findByPk(userId);
}

// Create association with core model
context.models.associate('AuditLog', 'belongsTo', 'User', {
  foreignKey: 'userId',
  as: 'user'
});
```

### 22.7 Model Sync Options

```typescript
// Force sync (drops and recreates tables - use with caution!)
await context.models.sync({ force: true });

// Alter sync (adds new columns, doesn't remove existing)
await context.models.sync({ alter: true });

// Safe sync (only creates if not exists)
await context.models.sync();
```

### 22.8 Best Practices

1. **Always include tenant column**: For multi-tenant data isolation
2. **Use migrations pattern**: Track schema version in metadata
3. **Sync only in onInstall**: Don't sync on every enable
4. **Leave data on uninstall**: Unless explicitly requested

### 22.9 Required Permission

Plugins must declare `models:define` permission in their manifest:

```json
{
  "permissions": ["models:define", "database:write"]
}
```

---

## 23. Plugin Middleware API

The Plugin Middleware API allows plugins to inject middleware into existing routes. Middleware can run before or after route handlers.

### 23.1 Overview

The middleware API is available through the plugin context:

```typescript
async onEnable(context: PluginContext): Promise<void> {
  // Add middleware that runs BEFORE the route handler
  context.middleware.add('/api/risks/*', 'before', async (req, res, next, ctx) => {
    context.logger.info(`Risk API accessed: ${req.method} ${req.path}`);
    next();
  });

  // Add middleware that runs AFTER the route handler
  context.middleware.add('/api/projects/:id', 'after', async (req, res, next, ctx) => {
    // Modify response before it's sent
    if (res.locals.responseBody) {
      res.locals.responseBody.pluginEnhanced = true;
    }
    next();
  });
}
```

### 23.2 Middleware API Reference

| Method | Description |
|--------|-------------|
| `add(pattern, position, handler)` | Add middleware for a route pattern |
| `remove(id)` | Remove middleware by ID |
| `removeAll()` | Remove all middleware for this plugin |
| `list()` | List all middleware for this plugin |
| `has(id)` | Check if middleware exists |

### 23.3 Route Pattern Syntax

Patterns support:
- Exact paths: `/api/users`
- Parameters: `/api/users/:id`
- Wildcards: `/api/risks/*`

```typescript
// Match exact path
context.middleware.add('/api/projects', 'before', handler);

// Match path with parameter
context.middleware.add('/api/projects/:id', 'before', handler);

// Match all paths under /api/risks/
context.middleware.add('/api/risks/*', 'before', handler);
```

### 23.4 Middleware Handler

```typescript
type PluginMiddlewareHandler = (
  req: Request,
  res: Response,
  next: () => void,
  context: MiddlewareContext
) => Promise<void> | void;

interface MiddlewareContext {
  pluginId: string;
  tenant: string;
}
```

### 23.5 Before Middleware

Before middleware runs before the route handler:

```typescript
context.middleware.add('/api/risks/*', 'before', async (req, res, next, ctx) => {
  // Validate request
  if (!req.headers['x-custom-header']) {
    res.status(400).json({ error: 'Missing required header' });
    return; // Don't call next() to stop the chain
  }

  // Add data to request
  req.pluginData = { validated: true };

  next(); // Continue to route handler
});
```

**Important**: If you don't call `next()` and send a response, the request chain stops.

### 23.6 After Middleware

After middleware runs after the route handler:

```typescript
context.middleware.add('/api/projects/:id', 'after', async (req, res, next, ctx) => {
  // Access the response body
  const body = res.locals.responseBody;

  // Modify response
  if (body && body.data) {
    body.data.enhancedBy = ctx.pluginId;
  }

  next();
});
```

### 23.7 Execution Order

- **Before middleware**: First-registered runs first
- **After middleware**: First-registered runs first
- Multiple plugins can add middleware to the same route

```
Request → Before(Plugin A) → Before(Plugin B) → Route Handler → After(Plugin A) → After(Plugin B) → Response
```

### 23.8 Cleanup on Disable

Always remove middleware when the plugin is disabled:

```typescript
async onDisable(context: PluginContext): Promise<void> {
  const removed = context.middleware.removeAll();
  context.logger.info(`Removed ${removed} middleware entries`);
}
```

### 23.9 Examples

**Audit logging middleware:**

```typescript
context.middleware.add('/api/*', 'before', async (req, res, next, ctx) => {
  const startTime = Date.now();
  req.auditStartTime = startTime;
  next();
});

context.middleware.add('/api/*', 'after', async (req, res, next, ctx) => {
  const duration = Date.now() - req.auditStartTime;
  await logAuditEntry({
    path: req.path,
    method: req.method,
    duration,
    tenant: ctx.tenant
  });
  next();
});
```

**Request validation middleware:**

```typescript
context.middleware.add('/api/risks', 'before', async (req, res, next, ctx) => {
  if (req.method === 'POST') {
    const { title, severity } = req.body;
    if (!title || !severity) {
      res.status(400).json({ error: 'Title and severity are required' });
      return;
    }
  }
  next();
});
```

### 23.10 Required Permission

Plugins must declare `middleware:inject` permission in their manifest:

```json
{
  "permissions": ["middleware:inject"]
}
```

---

## 24. Hot Reload (Development)

Hot reload allows plugins to be updated without restarting the server. This feature is **only active in development mode** (`NODE_ENV !== 'production'`).

### 24.1 How It Works

1. **File Watching**: The system uses `chokidar` to watch plugin directories
2. **Change Detection**: When a file changes, the affected plugin is identified by path
3. **Debouncing**: Rapid changes are debounced (500ms default) to avoid multiple reloads
4. **Reload Sequence**:
   - Disable plugin (unregister event/filter handlers)
   - Unregister plugin from registry
   - Clear Node.js module cache for plugin files
   - Re-import the plugin module
   - Register the updated plugin
   - Re-enable if it was previously enabled

### 24.2 Configuration

Hot reload starts automatically in development mode. No configuration required.

**Environment Variables:**
| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Set to anything except `production` to enable hot reload |
| `DEBUG_HOT_RELOAD` | Set to `true` for verbose logging |

### 24.3 Watched Directories

By default, hot reload watches:
- `plugins/marketplace/` - Marketplace plugins
- `plugins/builtin/` - Built-in plugins

### 24.4 Example Output

```
[HotReload] Starting hot reload for: /app/plugins/marketplace, /app/plugins/builtin
[HotReload] Hot reload started - watching for plugin changes
...
[HotReload] Reloading plugin "my-plugin" due to change in index.ts
[HotReload] Plugin "my-plugin" reloaded successfully in 45ms
```

### 24.5 Limitations

- **Development only**: Disabled in production for security and stability
- **No database migrations**: Hot reload doesn't run `onInstall` again; data schema changes require server restart
- **Module cache**: Some edge cases with circular dependencies may require manual restart

### 24.6 API

```typescript
import { PluginHotReload, createHotReload } from './plugins/core';

// Manual creation (usually not needed - init.ts handles this)
const hotReload = new PluginHotReload({
  pluginManager,
  watchDirs: ['marketplace', 'builtin'],
  debounceMs: 500,
});

hotReload.start();
// ... later
await hotReload.stop();
```

---

## 25. Future Tasks

The following features are planned for future implementation:

| Feature | Priority | Description |
|---------|----------|-------------|
| ~~Plugin scheduled tasks~~ | ~~High~~ | ~~Allow plugins to schedule recurring jobs (cron)~~ ✅ Implemented |
| ~~Hot reload~~ | ~~High~~ | ~~Update plugins without server restart~~ ✅ Implemented |
| UI extension points | Medium | Allow plugins to inject UI components |

---

## Appendix A: Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Plugin ID | lowercase-with-hyphens | `slack-notifications` |
| Plugin folder | Same as ID | `/plugins/slack-notifications/` |
| Zip filename | `{id}-{version}.zip` | `slack-notifications-1.0.0.zip` |
| Database tables | `plugin_{id_underscored}_{table}` | `plugin_slack_notifications_logs` |
| Webhook endpoints | `/api/plugins/{id}/webhooks/{name}` | `/api/plugins/jira-integration/webhooks/sync` |

---

## Appendix B: Changelog Format

Use [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
# Changelog

All notable changes to this plugin will be documented in this file.

## [1.1.0] - 2024-12-15

### Added
- Support for multiple Slack channels
- New configuration option: `defaultChannel`

### Changed
- Improved error messages for webhook failures

### Fixed
- Connection timeout issue when Slack API is slow

## [1.0.0] - 2024-12-01

### Added
- Initial release
- Risk notification support
- Channel configuration
```

---

## Appendix C: Complete Example Plugin

### File Structure

```
hello-world/
├── src/
│   └── index.ts
├── manifest.json
├── icon.png
├── CHANGELOG.md
├── README.md
└── package.json
```

### manifest.json

```json
{
  "id": "hello-world",
  "name": "Hello World",
  "description": "A simple example plugin that logs messages on project events.",
  "version": "1.0.0",
  "author": {
    "name": "Developer Name",
    "url": "https://example.com"
  },
  "homepage": "https://github.com/bluewave-labs/verifywise-apps/tree/main/plugins/hello-world",
  "repository": "https://github.com/bluewave-labs/verifywise-apps",
  "support": "https://github.com/bluewave-labs/verifywise-apps/issues",
  "type": "feature",
  "tags": ["example", "demo", "starter"],
  "permissions": ["events:listen", "config:read"],
  "config": {
    "greeting": {
      "type": "string",
      "required": false,
      "default": "Hello",
      "description": "Custom greeting message"
    },
    "logLevel": {
      "type": "string",
      "required": false,
      "default": "info",
      "enum": ["debug", "info", "warn"],
      "description": "Logging verbosity"
    }
  },
  "compatibility": {
    "minVersion": "1.6.0"
  },
  "dependencies": {}
}
```

### src/index.ts

```typescript
import { Plugin, PluginContext } from '@verifywise/plugin-types';

const plugin: Plugin = {
  manifest: require('../manifest.json'),

  async onInstall(context: PluginContext) {
    context.logger.info('Hello World plugin installed');

    // Initialize metadata
    await context.metadata.set('system', 0, 'installDate', new Date().toISOString());
  },

  async onUninstall(context: PluginContext) {
    context.logger.info('Hello World plugin uninstalled');

    if (context.options?.deleteData) {
      await context.metadata.deleteByPlugin();
      context.logger.info('Plugin data deleted');
    }
  },

  async onLoad(context: PluginContext) {
    context.logger.info('Hello World plugin loaded');
  },

  async onUnload(context: PluginContext) {
    context.logger.info('Hello World plugin unloaded');
  },

  async onEnable(context: PluginContext) {
    const greeting = context.config.get<string>('greeting', 'Hello');
    context.logger.info(`${greeting}, World! Plugin enabled.`);

    // Subscribe to project events
    context.on('project:created', async (payload) => {
      context.logger.info(`${greeting}! New project created: ${payload.projectName}`);
    });

    context.on('project:updated', async (payload) => {
      context.logger.info(`Project updated: ${payload.projectId}`);
    });
  },

  async onDisable(context: PluginContext) {
    context.logger.info('Hello World plugin disabled');
    // Event handlers automatically unsubscribed
  }
};

module.exports = plugin;
```

### CHANGELOG.md

```markdown
# Changelog

All notable changes to the Hello World plugin will be documented in this file.

## [1.0.0] - 2024-12-07

### Added
- Initial release
- Configurable greeting message
- Project created/updated event logging
- Log level configuration
```

### README.md

```markdown
# Hello World Plugin

A simple example plugin demonstrating the VerifyWise plugin architecture.

## Features

- Logs custom greeting on plugin enable
- Subscribes to project events
- Configurable greeting message and log level

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `greeting` | string | "Hello" | Custom greeting message |
| `logLevel` | string | "info" | Logging verbosity (debug, info, warn) |

## Usage

1. Install the plugin from the Plugin Manager
2. Configure your greeting message (optional)
3. Enable the plugin
4. Create or update a project to see the logs

## Support

For issues, please visit the [GitHub repository](https://github.com/bluewave-labs/verifywise-apps/issues).
```

### package.json

```json
{
  "name": "hello-world-plugin",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "esbuild src/index.ts --bundle --platform=node --target=node18 --outfile=dist/index.js"
  },
  "devDependencies": {
    "@verifywise/plugin-types": "^1.0.0",
    "esbuild": "^0.19.0",
    "typescript": "^5.0.0"
  }
}
```
