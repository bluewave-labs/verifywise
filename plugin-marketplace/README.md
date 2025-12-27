# VerifyWise Plugin Marketplace

This repository contains the plugin marketplace for VerifyWise, including plugin metadata and implementation code.

## Structure

```
plugin-marketplace/
├── plugins.json           # Plugin registry with metadata
├── plugins/              # Plugin implementations
│   ├── slack/           # Slack plugin
│   │   ├── index.js     # Entry point
│   │   ├── package.json # Dependencies
│   │   └── README.md    # Plugin documentation
│   └── mlflow/          # MLflow plugin
│       ├── index.js     # Entry point
│       ├── package.json # Dependencies
│       └── README.md    # Plugin documentation
└── README.md            # This file
```

## plugins.json Format

The `plugins.json` file contains metadata for all available plugins:

```json
{
  "version": "1.0.0",
  "plugins": [
    {
      "key": "unique-plugin-key",
      "name": "Plugin Name",
      "description": "Short description",
      "longDescription": "Detailed description",
      "version": "1.0.0",
      "author": "Author Name",
      "category": "category_name",
      "iconUrl": "/path/to/icon.svg",
      "documentationUrl": "https://docs.example.com",
      "features": [...],
      "tags": [...],
      "pluginPath": "plugins/plugin-folder",
      "entryPoint": "index.js",
      "dependencies": {...}
    }
  ],
  "categories": [...]
}
```

## Plugin Implementation

Each plugin must export the following interface:

```javascript
module.exports = {
  // Called when plugin is installed
  install: async (userId, tenantId, config) => {},

  // Called when plugin is uninstalled
  uninstall: async (userId, tenantId) => {},

  // Called to validate configuration
  validateConfig: (config) => {},

  // Plugin-specific methods
  // ... (varies by plugin)
};
```

## Adding a New Plugin

1. Add plugin metadata to `plugins.json`
2. Create plugin folder in `plugins/`
3. Implement required exports in `index.js`
4. Add `package.json` with dependencies
5. Document in plugin's `README.md`

## Development vs Production

### Development (Local)
VerifyWise reads `plugins.json` directly from this folder.

### Production (Git Repository)
VerifyWise fetches `plugins.json` from a remote Git repository URL.

Configure via environment variable:
```bash
PLUGIN_MARKETPLACE_URL=https://raw.githubusercontent.com/org/plugin-marketplace/main/plugins.json
```

## Plugin Categories

- `communication` - Team communication and notifications
- `ml_ops` - Machine learning operations and model management
- `version_control` - Version control system integrations
- `monitoring` - System and application monitoring
- `security` - Security and compliance tools
