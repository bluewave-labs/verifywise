# Sample Plugin

A comprehensive example plugin demonstrating all VerifyWise plugin capabilities.

## Features Demonstrated

- **Lifecycle Hooks** - Install, load, enable, disable, unload, uninstall
- **Event Handlers** - Listening to project, risk, task, and vendor events
- **Custom Routes** - REST API endpoints with proper error handling
- **Dashboard Widgets** - Stats card and list widgets
- **Configuration** - User-configurable settings with various field types
- **Data Persistence** - Using the metadata API for durable storage

## Quick Start

### 1. Copy to Marketplace

```bash
cd /path/to/verifywise/Servers
cp -r plugins/templates/sample-plugin plugins/marketplace/my-plugin
```

### 2. Update Plugin ID

Edit `plugins/marketplace/my-plugin/manifest.json`:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "My custom plugin description"
}
```

### 3. Restart Server

```bash
npm run dev
```

### 4. Enable Plugin

Go to **Settings > Plugins** and enable your plugin.

## File Structure

```
sample-plugin/
├── manifest.json    # Plugin metadata, permissions, config schema
├── index.ts         # Main plugin logic
├── icon.svg         # Plugin icon (24x24 recommended)
└── README.md        # This file
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiEndpoint` | string | - | External API URL |
| `apiKey` | string (secret) | - | API authentication key |
| `enableNotifications` | boolean | true | Enable event notifications |
| `maxItems` | number | 50 | Maximum items to store |
| `logLevel` | select | info | Minimum log level |

## API Endpoints

All endpoints are prefixed with `/api/plugins/sample-plugin/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Get statistics (for dashboard widget) |
| GET | `/items` | List tracked items |
| GET | `/items/:id` | Get specific item |
| DELETE | `/items` | Clear all items |
| POST | `/test` | Create a test item |
| GET | `/health` | Health check |

### Example: Get Stats

```bash
curl http://localhost:3000/api/plugins/sample-plugin/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "value": 42,
    "label": "Total items tracked",
    "change": "+5",
    "changeType": "increase"
  }
}
```

### Example: List Items

```bash
curl "http://localhost:3000/api/plugins/sample-plugin/items?limit=5&type=risk" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "1699123456789-a1b2c3d4",
        "title": "Risk identified",
        "subtitle": "New risk \"Data breach\" was added",
        "icon": "AlertTriangle",
        "timestamp": "2024-11-04T12:00:00.000Z"
      }
    ],
    "total": 15,
    "limit": 5,
    "offset": 0
  }
}
```

## Events Handled

This plugin listens to the following events:

| Event | Action |
|-------|--------|
| `project.created` | Logs "Project created" item |
| `project.updated` | Logs "Project updated" item |
| `project.deleted` | Logs "Project deleted" item |
| `risk.created` | Logs "Risk identified" item |
| `risk.updated` | Logs "Risk updated" item |
| `risk.deleted` | Logs "Risk resolved" item |
| `task.created` | Logs "Task created" item |
| `task.updated` | Logs "Task updated" item |
| `task.deleted` | Logs "Task completed" item |
| `vendor.created` | Logs "Vendor added" item |
| `vendor.updated` | Logs "Vendor updated" item |
| `vendor.deleted` | Logs "Vendor removed" item |

## Dashboard Widgets

### Stats Card Widget

Shows the total number of tracked items with a change indicator.

**Template:** `stats-card`
**Endpoint:** `/stats`

### List Widget

Shows recent items as a scrollable list.

**Template:** `list`
**Endpoint:** `/items`

## Development Tips

### Debugging

Enable debug logging in the plugin configuration, then check server logs:

```bash
# Filter logs for this plugin
npm run dev 2>&1 | grep "sample-plugin"
```

### Testing Events

Create a test item via API:

```bash
curl -X POST http://localhost:3000/api/plugins/sample-plugin/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test event from curl"}'
```

Or trigger real events by creating/updating/deleting entities in the UI.

### Inspecting Data

Check stored items:

```bash
curl http://localhost:3000/api/plugins/sample-plugin/items \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Clearing Data

Reset the plugin data:

```bash
curl -X DELETE http://localhost:3000/api/plugins/sample-plugin/items \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Common Modifications

### Adding a New Event Handler

In `index.ts`, add to the `eventHandlers()` return object:

```typescript
[PluginEvent.YOUR_EVENT]: async (payload) => {
  await addItem({
    title: "Event title",
    description: "Event description",
    entityType: "entity",
    entityId: payload.entityId,
    createdBy: payload.triggeredBy,
  });
},
```

### Adding a New Route

In `index.ts`, add to the `routes()` function:

```typescript
router.get("/my-route", (req, res) => {
  res.json({
    success: true,
    data: { /* your data */ }
  });
});
```

### Adding a New Config Field

In `manifest.json`, add to the `config` object:

```json
"myField": {
  "type": "string",
  "required": true,
  "label": "My Field",
  "description": "Description of my field"
}
```

Then use it in code:

```typescript
const value = ctx.config.get("myField");
```

## Troubleshooting

### Plugin Not Loading

1. Check `manifest.json` is valid JSON (use a JSON validator)
2. Verify the `id` is unique and lowercase
3. Check server logs for errors
4. Ensure `index.ts` has a default export

### Events Not Firing

1. Verify `events:listen` is in permissions
2. Check event name spelling matches `PluginEvent` enum
3. Ensure plugin is **enabled**, not just loaded

### Widget Not Showing

1. Check endpoint returns valid JSON
2. Verify data format matches template requirements
3. Check browser console for errors

## License

MIT
