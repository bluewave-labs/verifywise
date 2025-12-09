# VerifyWise Plugin Development Guide

This directory contains templates and documentation for developing VerifyWise plugins.

> **Note**: This directory is excluded from the marketplace. Plugins here are templates only.

## Quick Start

### 1. Copy the Sample Plugin

```bash
# From the Servers directory
cp -r plugins/templates/sample-plugin plugins/marketplace/my-plugin
```

### 2. Update the Manifest

Edit `plugins/marketplace/my-plugin/manifest.json`:

```json
{
  "id": "my-plugin",           // Must be unique, lowercase, hyphenated
  "name": "My Plugin",         // Display name
  "description": "What your plugin does",
  "version": "1.0.0"
  // ... see sample for full schema
}
```

### 3. Implement Your Logic

Edit `plugins/marketplace/my-plugin/index.ts` and implement the lifecycle hooks and features you need.

### 4. Restart the Server

```bash
npm run dev
```

Your plugin will appear in Settings > Plugins.

---

## Directory Structure

```
plugins/
├── builtin/              # Official plugins that ship with VerifyWise
│   └── activity-feed/    # Example: Activity Feed plugin
├── marketplace/          # Downloaded/installed plugins
│   └── my-plugin/        # Your custom plugins go here
├── templates/            # Development templates (not loaded)
│   ├── README.md         # This file
│   └── sample-plugin/    # Comprehensive sample plugin
└── core/                 # Plugin system internals (don't modify)
```

---

## Plugin File Structure

Every plugin needs at minimum a `manifest.json`. For full functionality, include:

```
my-plugin/
├── manifest.json         # REQUIRED: Plugin metadata and configuration
├── index.ts              # RECOMMENDED: Plugin logic (TypeScript)
├── icon.svg              # OPTIONAL: Plugin icon (24x24 recommended)
└── README.md             # OPTIONAL: Plugin documentation
```

---

## Manifest Reference

The `manifest.json` file defines your plugin's metadata, permissions, and configuration.

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (lowercase, hyphens only) |
| `name` | string | Display name |
| `description` | string | Brief description (1-2 sentences) |
| `version` | string | Semantic version (e.g., "1.0.0") |
| `author` | string | Author name or organization |
| `type` | string | One of: `integration`, `feature`, `framework`, `reporting` |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `authorUrl` | string | Author's website |
| `homepage` | string | Plugin documentation URL |
| `repository` | string | Source code repository URL |
| `permissions` | string[] | Required permissions (see below) |
| `config` | object | Configuration schema (see below) |
| `ui` | object | UI extensions (dashboard widgets) |
| `compatibility` | object | Version requirements |
| `dependencies` | object | Other plugins this depends on |
| `tags` | string[] | Searchable tags |

### Permissions

Declare what your plugin needs access to:

| Permission | Description |
|------------|-------------|
| `events:listen` | Subscribe to system events |
| `events:emit` | Emit custom events |
| `database:read` | Read from database |
| `database:write` | Write to database |
| `config:read` | Read plugin configuration |
| `config:write` | Write plugin configuration |
| `http:outbound` | Make external HTTP requests |
| `scheduler:use` | Schedule recurring tasks |
| `models:use` | Use Sequelize models |

### Configuration Schema

Define user-configurable settings:

```json
{
  "config": {
    "webhookUrl": {
      "type": "string",
      "required": true,
      "secret": true,
      "label": "Webhook URL",
      "description": "The URL to send notifications to"
    },
    "enabled": {
      "type": "boolean",
      "default": true,
      "label": "Enable notifications"
    },
    "maxRetries": {
      "type": "number",
      "default": 3,
      "min": 1,
      "max": 10,
      "label": "Maximum retries"
    },
    "notifyOn": {
      "type": "select",
      "options": ["all", "errors", "warnings"],
      "default": "all",
      "label": "Notify on"
    }
  }
}
```

**Config Field Types:**
- `string` - Text input
- `number` - Numeric input (supports `min`, `max`)
- `boolean` - Toggle switch
- `select` - Dropdown (requires `options` array)

**Config Field Options:**
- `required` - Field must be filled
- `secret` - Value is encrypted at rest
- `default` - Default value
- `label` - UI label
- `description` - Help text
- `placeholder` - Input placeholder

---

## Plugin Lifecycle

Plugins go through defined lifecycle states:

```
Installed → Loaded → Enabled ⇄ Disabled → Unloaded → Uninstalled
```

### Lifecycle Hooks

Implement these methods to handle state changes:

```typescript
const myPlugin: Plugin = {
  manifest: { ... },

  // Called when plugin is first installed
  async onInstall(ctx: PluginContext): Promise<void> {
    // Run database migrations
    // Set up initial data
  },

  // Called when plugin is loaded into memory
  async onLoad(ctx: PluginContext): Promise<void> {
    // Initialize state
    // Load cached data
  },

  // Called when plugin is enabled (activated)
  async onEnable(ctx: PluginContext): Promise<void> {
    // Start processing
    // Register webhooks
  },

  // Called when plugin is disabled
  async onDisable(ctx: PluginContext): Promise<void> {
    // Pause processing
    // Clean up temporary resources
  },

  // Called when plugin is unloaded from memory
  async onUnload(ctx: PluginContext): Promise<void> {
    // Save state
    // Close connections
  },

  // Called when plugin is uninstalled
  async onUninstall(ctx: PluginContext): Promise<void> {
    // Delete plugin data
    // Remove database tables
  },
};
```

---

## Plugin Context

The `PluginContext` object is passed to all lifecycle hooks and provides access to:

### Logger

```typescript
ctx.logger.info("Message");
ctx.logger.warn("Warning message");
ctx.logger.error("Error message", { details: "..." });
ctx.logger.debug("Debug info");
```

### Configuration

```typescript
// Get a config value (with optional default)
const webhookUrl = ctx.config.get("webhookUrl");
const maxRetries = ctx.config.get("maxRetries", 3);

// Get all config
const allConfig = ctx.config.getAll();

// Set a config value (requires config:write permission)
await ctx.config.set("lastSync", new Date().toISOString());
```

### Metadata Storage

Store arbitrary data associated with entities:

```typescript
// Store data for a specific entity
await ctx.metadata.set("project", projectId, "myPluginData", {
  score: 85,
  lastChecked: new Date()
});

// Retrieve data
const data = await ctx.metadata.get("project", projectId, "myPluginData");

// Delete data
await ctx.metadata.delete("project", projectId, "myPluginData");

// Entity types: "project", "risk", "vendor", "task", "user", "plugin"
```

### Tenant Information

```typescript
const tenantId = ctx.tenant.id;
const tenantName = ctx.tenant.name;
```

### Database Access

```typescript
// Get Sequelize models (requires models:use permission)
const { Project, Risk, Vendor } = ctx.models;

// Query data
const projects = await Project.findAll({
  where: { organization_id: ctx.tenant.id }
});
```

### HTTP Client

```typescript
// Make external requests (requires http:outbound permission)
const response = await ctx.http.post("https://api.example.com/webhook", {
  data: { message: "Hello" },
  headers: { "Authorization": "Bearer token" }
});
```

### Scheduler

```typescript
// Schedule recurring tasks (requires scheduler:use permission)
ctx.scheduler.register("daily-sync", "0 0 * * *", async () => {
  // Runs daily at midnight
  await syncData();
});

// Cancel a scheduled task
ctx.scheduler.cancel("daily-sync");
```

---

## Event System

Plugins can listen to and emit events.

### Available Events

| Event | Payload | Description |
|-------|---------|-------------|
| `project.created` | `{ projectId, project, triggeredBy }` | Project was created |
| `project.updated` | `{ projectId, project, changes, triggeredBy }` | Project was updated |
| `project.deleted` | `{ projectId, project, triggeredBy }` | Project was deleted |
| `risk.created` | `{ riskId, risk, triggeredBy }` | Risk was created |
| `risk.updated` | `{ riskId, risk, changes, triggeredBy }` | Risk was updated |
| `risk.deleted` | `{ riskId, risk, triggeredBy }` | Risk was deleted |
| `task.created` | `{ taskId, task, triggeredBy }` | Task was created |
| `task.updated` | `{ taskId, task, changes, triggeredBy }` | Task was updated |
| `task.deleted` | `{ taskId, task, triggeredBy }` | Task was deleted |
| `vendor.created` | `{ vendorId, vendor, triggeredBy }` | Vendor was created |
| `vendor.updated` | `{ vendorId, vendor, changes, triggeredBy }` | Vendor was updated |
| `vendor.deleted` | `{ vendorId, vendor, triggeredBy }` | Vendor was deleted |
| `user.login` | `{ userId, user }` | User logged in |
| `user.logout` | `{ userId }` | User logged out |

### Listening to Events

```typescript
import { PluginEvent, EventHandlerMap } from "../../core";

const myPlugin: Plugin = {
  // ...

  eventHandlers(): EventHandlerMap {
    return {
      [PluginEvent.RISK_CREATED]: async (payload) => {
        const { riskId, risk, triggeredBy } = payload;
        console.log(`Risk ${riskId} created by ${triggeredBy?.name}`);

        // Your logic here
        await notifySlack(`New risk: ${risk.risk_name}`);
      },

      [PluginEvent.PROJECT_UPDATED]: async (payload) => {
        // Handle project updates
      },
    };
  },
};
```

### Emitting Events

```typescript
// Emit custom events (requires events:emit permission)
await ctx.events.emit("my-plugin.sync-complete", {
  syncedItems: 42,
  timestamp: new Date()
});
```

---

## Custom Routes

Plugins can expose their own API endpoints.

```typescript
import { Router } from "express";

const myPlugin: Plugin = {
  // ...

  routes(router: Router): void {
    // GET /api/plugins/my-plugin/status
    router.get("/status", (req, res) => {
      res.json({
        success: true,
        data: { status: "healthy" }
      });
    });

    // POST /api/plugins/my-plugin/sync
    router.post("/sync", async (req, res) => {
      const { projectId } = req.body;

      // Your sync logic
      await performSync(projectId);

      res.json({
        success: true,
        message: "Sync started"
      });
    });

    // Routes automatically have:
    // - Authentication (req.user available)
    // - Tenant context (req.tenantId available)
    // - Rate limiting (100 req/min default)
  },
};
```

### Route Best Practices

1. **Always return JSON** with `success` field
2. **Handle errors** gracefully
3. **Validate input** before processing
4. **Use appropriate HTTP methods** (GET for read, POST for create, etc.)

---

## Dashboard Widgets

Plugins can add widgets to the main dashboard.

### Widget Configuration

In `manifest.json`:

```json
{
  "ui": {
    "dashboardWidgets": [
      {
        "id": "my-stats-widget",
        "template": "stats-card",
        "title": "My Stats",
        "endpoint": "/stats",
        "config": {
          "refreshInterval": 60
        }
      }
    ]
  }
}
```

### Available Templates

| Template | Description | Data Format |
|----------|-------------|-------------|
| `stats-card` | Single metric with change indicator | `{ value, label, change, changeType }` |
| `list` | List of items | `{ items: [{ title, subtitle, icon }] }` |
| `table` | Tabular data | `{ columns, rows }` |
| `chart` | Charts (bar, line, pie) | `{ type, data, labels }` |
| `activity-feed` | Activity timeline | `{ activities: [{ title, description, timestamp }] }` |
| `progress` | Progress indicators | `{ items: [{ label, value, max }] }` |
| `alerts` | Alert/notification list | `{ alerts: [{ severity, title, message }] }` |
| `calendar` | Calendar view | `{ events: [{ date, title, type }] }` |
| `card-grid` | Grid of stat cards | `{ cards: [{ title, value, icon }] }` |
| `timeline` | Vertical timeline | `{ events: [{ date, title, icon, status }] }` |

### Widget Endpoint

Your endpoint must return data in the expected format:

```typescript
// For stats-card template
router.get("/stats", async (req, res) => {
  const count = await getCount();
  const previousCount = await getPreviousCount();

  res.json({
    success: true,
    data: {
      value: count,
      label: "Total Items",
      change: `+${count - previousCount}`,
      changeType: count >= previousCount ? "increase" : "decrease"
    }
  });
});
```

---

## Testing Your Plugin

### Manual Testing Checklist

- [ ] Plugin appears in Settings > Plugins
- [ ] Plugin can be enabled/disabled
- [ ] Configuration form renders correctly
- [ ] Configuration saves and persists
- [ ] Event handlers fire on relevant events
- [ ] Custom routes return expected data
- [ ] Dashboard widgets display correctly
- [ ] Plugin handles errors gracefully
- [ ] Uninstall cleans up all data

### Debug Logging

Enable verbose logging in development:

```typescript
async onLoad(ctx: PluginContext): Promise<void> {
  ctx.logger.debug("Plugin loaded with config:", ctx.config.getAll());
}
```

Check server logs for `[plugin:my-plugin]` entries.

---

## Common Patterns

### Caching Data

```typescript
let cachedData: MyData | null = null;
let cacheExpiry = 0;

async function getData(ctx: PluginContext): Promise<MyData> {
  if (cachedData && Date.now() < cacheExpiry) {
    return cachedData;
  }

  cachedData = await fetchData();
  cacheExpiry = Date.now() + 60000; // 1 minute

  return cachedData;
}
```

### External API Integration

```typescript
async function syncWithExternalService(ctx: PluginContext) {
  const apiKey = ctx.config.get("apiKey");

  try {
    const response = await ctx.http.get("https://api.external.com/data", {
      headers: { "X-API-Key": apiKey }
    });

    await processData(response.data);
    ctx.logger.info("Sync completed successfully");
  } catch (error) {
    ctx.logger.error("Sync failed", { error: error.message });
    throw error;
  }
}
```

### Scheduled Tasks

```typescript
async onEnable(ctx: PluginContext): Promise<void> {
  // Run every hour
  ctx.scheduler.register("hourly-sync", "0 * * * *", async () => {
    await syncWithExternalService(ctx);
  });
}

async onDisable(ctx: PluginContext): Promise<void> {
  ctx.scheduler.cancel("hourly-sync");
}
```

---

## Troubleshooting

### Plugin Not Loading

1. Check `manifest.json` is valid JSON
2. Verify `id` is unique and lowercase
3. Check server logs for errors
4. Ensure `index.ts` exports default plugin

### Events Not Firing

1. Verify `events:listen` permission is declared
2. Check event name matches exactly (use `PluginEvent` enum)
3. Ensure plugin is enabled, not just loaded

### Configuration Not Saving

1. Verify config schema in manifest is correct
2. Check for validation errors in UI
3. Ensure `secret` fields have proper type

### Widget Not Appearing

1. Verify widget endpoint returns valid JSON
2. Check browser console for errors
3. Ensure widget template matches data format

---

## Getting Help

- **Documentation**: See `PLUGIN_SPEC.md` for full specification
- **Examples**: Check `builtin/activity-feed/` for a working example
- **Issues**: Report bugs at https://github.com/bluewave-labs/verifywise/issues
