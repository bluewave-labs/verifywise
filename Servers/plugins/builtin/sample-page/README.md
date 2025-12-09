# Sample Page Plugin

A built-in VerifyWise plugin that demonstrates the **empty-page template** with real database data. Use this plugin as a reference for building custom plugins that need their own dedicated page.

## Overview

| Property | Value |
|----------|-------|
| **ID** | `sample-page` |
| **Type** | Feature |
| **Template** | `empty-page` |
| **Author** | VerifyWise |

## Features

This plugin demonstrates:

- **Page template**: Uses the `empty-page` template for full-page plugin content
- **Breadcrumb navigation**: Dashboard > Plugins > Sample plugin page
- **Real database queries**: Fetches live data from your VerifyWise instance
- **Structured slots**: Stats, charts, tables, and text content
- **Tenant-aware queries**: Properly queries tenant-specific schemas

## What It Displays

### System Overview (Stats)
- Use cases count
- Vendors count
- Vendor risks count
- Users count
- Models count
- Incidents count

### Charts (Side-by-Side)
- **Vendor risks by level** (Bar chart) - Shows distribution of vendor risks by severity
- **Incidents by status** (Donut chart) - Shows incident status breakdown

### Tables
- **Recent use cases** - Lists recent projects with owner name and last updated date
- **Recent users** - Lists recently joined users with role information

### About Section
- Text description of the plugin's purpose

## File Structure

```
sample-page/
├── index.ts        # Main plugin logic and routes
├── manifest.json   # Plugin metadata and UI configuration
├── icon.svg        # Plugin icon (rocket)
└── README.md       # This documentation
```

## manifest.json

```json
{
  "id": "sample-page",
  "name": "Sample page",
  "description": "A sample plugin demonstrating the empty-page template...",
  "version": "1.0.0",
  "author": "VerifyWise",
  "type": "feature",
  "permissions": [],
  "ui": {
    "page": {
      "title": "Sample plugin page",
      "description": "This is a sample page created by a plugin...",
      "icon": "rocket",
      "type": "template",
      "template": "empty-page",
      "endpoint": "/page-content"
    }
  }
}
```

## API Endpoint

### GET /api/plugins/sample-page/page-content

Returns structured slot data for the empty-page template.

**Response Format:**
```json
{
  "success": true,
  "data": {
    "contentType": "slots",
    "slots": [
      {
        "type": "stats",
        "title": "System overview",
        "data": {
          "items": [
            { "label": "Use cases", "value": 3, "trend": "neutral" }
          ]
        }
      },
      {
        "type": "chart-row",
        "data": {
          "gap": 16,
          "charts": [
            {
              "title": "Vendor risks by level",
              "chartType": "bar",
              "chartData": [
                { "name": "High risk", "value": 1, "color": "#ea580c" }
              ]
            }
          ]
        }
      },
      {
        "type": "table",
        "title": "Recent use cases",
        "data": {
          "columns": [
            { "key": "name", "label": "Name" }
          ],
          "rows": [
            { "id": "1", "name": "Project A", "owner": "John Doe" }
          ]
        }
      }
    ]
  }
}
```

## Slot Types

| Type | Description |
|------|-------------|
| `stats` | Grid of stat cards with labels, values, and trends |
| `chart-row` | Side-by-side charts (bar, pie, donut) |
| `table` | Data table with columns and rows |
| `text` | Simple text content block |
| `list` | Bulleted list items |
| `custom` | Raw HTML content |

## Database Queries

The plugin queries the following tables:

| Table | Schema | Purpose |
|-------|--------|---------|
| `projects` | Tenant | Use cases list and count |
| `vendors` | Tenant | Vendor count |
| `vendorrisks` | Tenant | Vendor risks count and chart |
| `ai_incident_managements` | Tenant | Incidents count and chart |
| `model_inventories` | Tenant | Models count |
| `users` | Public | Users count and list |
| `roles` | Public | Role names for user display |

## Accessing the Plugin

1. Navigate to the sidebar
2. Click on **Plugins**
3. Select **Sample page** from the dropdown

Or directly visit: `/plugins/sample-page`

## Using as a Reference

To create your own plugin with a dedicated page:

1. **Copy this plugin** as a starting point
2. **Update manifest.json** with your plugin's metadata
3. **Modify the queries** in `index.ts` to fetch your data
4. **Customize the slots** returned by `/page-content`
5. **Register your plugin** in `plugins/builtin/index.ts`

### Key Patterns

**Tenant-aware queries:**
```typescript
const tenant = req.tenantId;
const result = await pluginContext.db.query(
  `SELECT * FROM "${tenant}".your_table`
);
```

**Public schema queries:**
```typescript
const result = await pluginContext.db.query(
  `SELECT * FROM public.users`
);
```

**Color mapping for charts:**
```typescript
const colors: Record<string, string> = {
  "High": "#ea580c",
  "Medium": "#ca8a04",
  "Low": "#16a34a",
};
```

## Lifecycle Methods

```typescript
const plugin: Plugin = {
  manifest: { ... },

  async onInstall(context): Promise<void> {
    // Called when plugin is first installed
  },

  async onUninstall(context): Promise<void> {
    // Called when plugin is removed
  },

  async onEnable(context): Promise<void> {
    // Called when plugin is enabled
    pluginContext = context; // Store for use in routes
  },

  async onDisable(context): Promise<void> {
    // Called when plugin is disabled
    pluginContext = null;
  },

  routes(router: Router): void {
    // Define API endpoints
    router.get("/page-content", async (req, res) => { ... });
  },
};
```

## Related Documentation

- [Plugin System Design](../../../docs/PLUGIN_SYSTEM_DESIGN.md)
- [Plugin Specification](../../PLUGIN_SPEC.md)
- [Activity Feed Plugin](../activity-feed/README.md)
