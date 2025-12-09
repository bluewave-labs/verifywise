import type { ArticleContent } from '@user-guide-content/contentTypes';

export const developingPluginsContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'Create custom plugins to extend VerifyWise with new features tailored to your organization. This guide covers the plugin architecture, available APIs, and best practices for plugin development.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Plugin development requires familiarity with JavaScript or TypeScript. For detailed technical documentation, refer to the PLUGIN_SPEC.md file in the VerifyWise repository.',
    },
    {
      type: 'heading',
      id: 'getting-started',
      level: 2,
      text: 'Getting started',
    },
    {
      type: 'paragraph',
      text: 'The fastest way to create a plugin is to start from a template:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Clone the plugin marketplace repository from GitHub' },
        { text: 'Copy a template that matches your use case' },
        { text: 'Modify the manifest.json with your plugin details' },
        { text: 'Implement your plugin logic in index.ts or index.js' },
        { text: 'Test by copying to your VerifyWise plugins directory' },
      ],
    },
    {
      type: 'code',
      language: 'bash',
      code: '# Clone the marketplace repository\ngit clone https://github.com/bluewave-labs/plugin-marketplace.git\n\n# Copy a template\ncp -r templates/template-basic-plugin plugins/my-plugin\n\n# Test locally\ncp -r plugins/my-plugin /path/to/verifywise/Servers/plugins/marketplace/',
    },
    {
      type: 'heading',
      id: 'plugin-structure',
      level: 2,
      text: 'Plugin structure',
    },
    {
      type: 'paragraph',
      text: 'Every plugin requires the following files:',
    },
    {
      type: 'code',
      language: 'text',
      code: 'my-plugin/\n├── manifest.json    # Plugin metadata and configuration schema\n├── index.ts         # Main plugin code (or index.js)\n└── icon.svg         # Optional plugin icon (24x24 recommended)',
    },
    {
      type: 'heading',
      id: 'manifest',
      level: 2,
      text: 'The manifest file',
    },
    {
      type: 'paragraph',
      text: 'The manifest.json file defines your plugin metadata, permissions, and configuration options:',
    },
    {
      type: 'code',
      language: 'json',
      code: '{\n  "id": "my-plugin",\n  "name": "My Plugin",\n  "description": "A brief description of what my plugin does",\n  "version": "1.0.0",\n  "author": {\n    "name": "Your Name",\n    "url": "https://your-website.com"\n  },\n  "type": "feature",\n  "tags": ["custom", "example"],\n  "permissions": [\n    "events:listen",\n    "database:read"\n  ],\n  "config": {\n    "apiKey": {\n      "type": "string",\n      "required": true,\n      "secret": true,\n      "label": "API key",\n      "description": "Your service API key"\n    }\n  },\n  "compatibility": {\n    "minVersion": "1.6.0"\n  }\n}',
    },
    {
      type: 'heading',
      id: 'manifest-fields',
      level: 3,
      text: 'Manifest fields',
    },
    {
      type: 'table',
      columns: [
        { key: 'field', label: 'Field', width: '25%' },
        { key: 'description', label: 'Description', width: '75%' },
      ],
      rows: [
        { field: 'id', description: 'Unique identifier using lowercase letters, numbers, and hyphens' },
        { field: 'name', description: 'Display name shown in the UI' },
        { field: 'description', description: 'Brief summary of plugin functionality' },
        { field: 'version', description: 'Semantic version (major.minor.patch)' },
        { field: 'type', description: 'Category: integration, feature, framework, or reporting' },
        { field: 'permissions', description: 'Array of required permissions' },
        { field: 'config', description: 'Configuration schema for plugin settings' },
      ],
    },
    {
      type: 'heading',
      id: 'plugin-code',
      level: 2,
      text: 'Plugin code',
    },
    {
      type: 'paragraph',
      text: 'Your plugin exports a default object that implements the Plugin interface:',
    },
    {
      type: 'code',
      language: 'typescript',
      code: 'import type { Plugin, PluginContext } from "../core";\n\nconst myPlugin: Plugin = {\n  id: "my-plugin",\n  name: "My Plugin",\n\n  // Called when plugin is loaded\n  async onLoad(context: PluginContext) {\n    console.log("Plugin loaded!");\n  },\n\n  // Called when plugin is unloaded\n  async onUnload(context: PluginContext) {\n    console.log("Plugin unloaded!");\n  },\n\n  // Called when plugin is enabled\n  async onEnable(context: PluginContext) {\n    console.log("Plugin enabled!");\n  },\n\n  // Called when plugin is disabled\n  async onDisable(context: PluginContext) {\n    console.log("Plugin disabled!");\n  },\n};\n\nexport default myPlugin;',
    },
    {
      type: 'heading',
      id: 'plugin-context',
      level: 2,
      text: 'Plugin context',
    },
    {
      type: 'paragraph',
      text: 'The PluginContext object provides access to VerifyWise APIs:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'context.config', text: 'Read plugin configuration values' },
        { bold: 'context.events', text: 'Subscribe to and emit events' },
        { bold: 'context.logger', text: 'Log messages with proper formatting' },
        { bold: 'context.storage', text: 'Store plugin-specific data' },
        { bold: 'context.models', text: 'Access Sequelize models (with permission)' },
        { bold: 'context.scheduler', text: 'Schedule recurring tasks' },
        { bold: 'context.metadata', text: 'Attach custom data to entities' },
      ],
    },
    {
      type: 'heading',
      id: 'event-system',
      level: 2,
      text: 'Event system',
    },
    {
      type: 'paragraph',
      text: 'Plugins can listen to system events and emit their own:',
    },
    {
      type: 'code',
      language: 'typescript',
      code: 'async onEnable(context: PluginContext) {\n  // Listen for model updates\n  context.events.on("model:updated", async (payload) => {\n    context.logger.info("Model updated:", payload.modelId);\n  });\n\n  // Listen for task completions\n  context.events.on("task:completed", async (payload) => {\n    // Send notification to external service\n    await notifyExternalService(payload);\n  });\n}',
    },
    {
      type: 'paragraph',
      text: 'Common events you can listen to:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'model:created, model:updated, model:deleted', text: 'AI model changes' },
        { bold: 'task:created, task:completed', text: 'Task lifecycle events' },
        { bold: 'risk:identified, risk:mitigated', text: 'Risk management events' },
        { bold: 'compliance:status-changed', text: 'Compliance status updates' },
        { bold: 'user:login, user:logout', text: 'Authentication events' },
      ],
    },
    {
      type: 'heading',
      id: 'dashboard-widgets',
      level: 2,
      text: 'Dashboard widgets',
    },
    {
      type: 'paragraph',
      text: 'Plugins can provide dashboard widgets that users can add to their view:',
    },
    {
      type: 'code',
      language: 'typescript',
      code: 'const myPlugin: Plugin = {\n  id: "my-plugin",\n  name: "My Plugin",\n\n  widgets: [\n    {\n      id: "my-widget",\n      name: "My Custom Widget",\n      description: "Displays custom metrics",\n      template: "stats-card",\n      defaultSize: { w: 2, h: 1 },\n      dataEndpoint: "/api/plugins/my-plugin/widget-data",\n    }\n  ],\n};',
    },
    {
      type: 'paragraph',
      text: 'Available widget templates:',
    },
    {
      type: 'table',
      columns: [
        { key: 'template', label: 'Template', width: '25%' },
        { key: 'use', label: 'Best for', width: '75%' },
      ],
      rows: [
        { template: 'stats-card', use: 'Displaying key metrics and statistics' },
        { template: 'list', use: 'Showing lists of items or activities' },
        { template: 'table', use: 'Tabular data with columns' },
        { template: 'chart', use: 'Visualizing trends and data over time' },
        { template: 'progress', use: 'Progress bars and completion status' },
        { template: 'timeline', use: 'Chronological events and activities' },
        { template: 'calendar', use: 'Date-based events and schedules' },
      ],
    },
    {
      type: 'heading',
      id: 'custom-pages',
      level: 2,
      text: 'Custom pages',
    },
    {
      type: 'paragraph',
      text: 'Add custom pages to the sidebar navigation:',
    },
    {
      type: 'code',
      language: 'typescript',
      code: 'const myPlugin: Plugin = {\n  id: "my-plugin",\n  name: "My Plugin",\n\n  pages: [\n    {\n      id: "my-page",\n      title: "My Custom Page",\n      icon: "Settings",\n      path: "/plugins/my-plugin",\n      // Use iframe to embed external content\n      iframe: {\n        src: "https://my-service.com/embed",\n        sandbox: ["allow-scripts", "allow-same-origin"],\n      },\n      // Or provide HTML content directly\n      // content: "<div>My page content</div>",\n    }\n  ],\n};',
    },
    {
      type: 'heading',
      id: 'api-routes',
      level: 2,
      text: 'Custom API routes',
    },
    {
      type: 'paragraph',
      text: 'Plugins can register custom API endpoints:',
    },
    {
      type: 'code',
      language: 'typescript',
      code: 'const myPlugin: Plugin = {\n  id: "my-plugin",\n  name: "My Plugin",\n\n  routes: [\n    {\n      method: "GET",\n      path: "/status",\n      handler: async (req, res, context) => {\n        res.json({ status: "ok", timestamp: Date.now() });\n      },\n    },\n    {\n      method: "POST",\n      path: "/webhook",\n      handler: async (req, res, context) => {\n        // Process incoming webhook\n        const data = req.body;\n        context.events.emit("my-plugin:webhook-received", data);\n        res.json({ received: true });\n      },\n    },\n  ],\n};',
    },
    {
      type: 'paragraph',
      text: 'Routes are automatically prefixed with /api/plugins/{plugin-id}/.',
    },
    {
      type: 'heading',
      id: 'scheduled-tasks',
      level: 2,
      text: 'Scheduled tasks',
    },
    {
      type: 'paragraph',
      text: 'Use the scheduler API to run periodic tasks:',
    },
    {
      type: 'code',
      language: 'typescript',
      code: 'async onEnable(context: PluginContext) {\n  // Run every hour\n  context.scheduler.register({\n    id: "hourly-sync",\n    cron: "0 * * * *",\n    handler: async () => {\n      context.logger.info("Running hourly sync...");\n      await syncData();\n    },\n  });\n}\n\nasync onDisable(context: PluginContext) {\n  // Clean up scheduled tasks\n  context.scheduler.unregister("hourly-sync");\n}',
    },
    {
      type: 'heading',
      id: 'configuration',
      level: 2,
      text: 'Configuration options',
    },
    {
      type: 'paragraph',
      text: 'Define configuration fields in your manifest for user-configurable settings:',
    },
    {
      type: 'code',
      language: 'json',
      code: '"config": {\n  "apiKey": {\n    "type": "string",\n    "required": true,\n    "secret": true,\n    "label": "API key",\n    "description": "Your service API key"\n  },\n  "syncInterval": {\n    "type": "number",\n    "default": 60,\n    "label": "Sync interval (minutes)",\n    "description": "How often to sync data"\n  },\n  "enableNotifications": {\n    "type": "boolean",\n    "default": true,\n    "label": "Enable notifications",\n    "description": "Send notifications for important events"\n  }\n}',
    },
    {
      type: 'paragraph',
      text: 'Access configuration values in your plugin code:',
    },
    {
      type: 'code',
      language: 'typescript',
      code: 'async onEnable(context: PluginContext) {\n  const apiKey = context.config.get("apiKey");\n  const interval = context.config.get("syncInterval") || 60;\n  \n  if (!apiKey) {\n    throw new Error("API key is required");\n  }\n}',
    },
    {
      type: 'heading',
      id: 'testing',
      level: 2,
      text: 'Testing your plugin',
    },
    {
      type: 'paragraph',
      text: 'To test your plugin during development:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Copy your plugin to the plugins/marketplace directory' },
        { text: 'Restart the VerifyWise server' },
        { text: 'Navigate to Settings > Plugins' },
        { text: 'Find and enable your plugin' },
        { text: 'Check server logs for errors' },
        { text: 'Test all plugin features' },
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      text: 'Use context.logger for debugging. Log messages appear in the server console and Event Tracker.',
    },
    {
      type: 'heading',
      id: 'publishing',
      level: 2,
      text: 'Publishing to the marketplace',
    },
    {
      type: 'paragraph',
      text: 'To share your plugin with the community:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Fork the plugin-marketplace repository on GitHub' },
        { text: 'Add your plugin to the plugins/ directory' },
        { text: 'Create a zip file of your plugin' },
        { text: 'Add an entry to registry.json' },
        { text: 'Submit a pull request' },
      ],
    },
    {
      type: 'heading',
      id: 'best-practices',
      level: 2,
      text: 'Best practices',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Request minimal permissions', text: 'Only request permissions your plugin actually needs' },
        { bold: 'Handle errors gracefully', text: 'Use try-catch and provide meaningful error messages' },
        { bold: 'Clean up on disable', text: 'Remove event listeners and scheduled tasks when disabled' },
        { bold: 'Use the logger', text: 'Log important events for debugging and auditing' },
        { bold: 'Validate configuration', text: 'Check required settings before enabling' },
        { bold: 'Document your plugin', text: 'Include clear descriptions and usage instructions' },
        { bold: 'Version semantically', text: 'Use semantic versioning for releases' },
      ],
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'plugins',
          articleId: 'plugin-overview',
          title: 'Plugin overview',
          description: 'Introduction to the plugin system',
        },
        {
          collectionId: 'plugins',
          articleId: 'plugin-marketplace',
          title: 'Plugin marketplace',
          description: 'Browse and install community plugins',
        },
        {
          collectionId: 'integrations',
          articleId: 'api-access',
          title: 'API access',
          description: 'Learn about VerifyWise APIs',
        },
      ],
    },
  ],
};
