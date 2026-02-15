import type { ArticleContent } from '../../contentTypes';

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
      text: 'You can create custom plugins to extend VerifyWise with new integrations, data imports, and UI components. This guide covers the plugin interface, registry format, UI injection system, and how to publish your plugin to the marketplace.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Plugin development requires familiarity with TypeScript or JavaScript. Plugins with UI components also require React knowledge for building the frontend bundle.',
    },
    {
      type: 'heading',
      id: 'getting-started',
      level: 2,
      text: 'Getting started',
    },
    {
      type: 'paragraph',
      text: 'To create a new plugin:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Clone the plugin-marketplace repository from GitHub' },
        { text: 'Create a new directory under plugins/ for your plugin' },
        { text: 'Write the plugin entry point file (index.ts or index.js)' },
        { text: 'Add your plugin to the plugins.json registry file' },
        { text: 'Build a UI bundle if your plugin needs frontend components' },
        { text: 'Test locally by installing from the marketplace' },
      ],
    },
    {
      type: 'code',
      language: 'bash',
      code: '# Clone the marketplace repository\ngit clone https://github.com/bluewave-labs/plugin-marketplace.git\n\n# Create your plugin directory\nmkdir -p plugins/my-plugin',
    },
    {
      type: 'heading',
      id: 'plugin-structure',
      level: 2,
      text: 'Plugin structure',
    },
    {
      type: 'paragraph',
      text: 'A typical plugin directory contains:',
    },
    {
      type: 'code',
      language: 'text',
      code: 'my-plugin/\n├── index.ts           # Main plugin code with lifecycle hooks\n├── package.json       # Optional, only if plugin has npm dependencies\n└── ui/                # Optional, only if plugin has frontend components\n    └── dist/\n        └── index.esm.js   # Built IIFE UI bundle',
    },
    {
      type: 'paragraph',
      text: 'The only required file is the entry point (index.ts or index.js). The package.json and UI bundle are optional depending on whether your plugin has dependencies or frontend components.',
    },
    {
      type: 'heading',
      id: 'lifecycle-hooks',
      level: 2,
      text: 'Plugin lifecycle hooks',
    },
    {
      type: 'paragraph',
      text: 'Plugins export named functions that VerifyWise calls at specific points in the plugin lifecycle. All hooks are optional — implement only the ones your plugin needs.',
    },
    {
      type: 'heading',
      id: 'install-hook',
      level: 3,
      text: 'install()',
    },
    {
      type: 'paragraph',
      text: 'Called when a user installs the plugin. Use this to create database tables or perform one-time setup.',
    },
    {
      type: 'code',
      language: 'typescript',
      code: 'export async function install(\n  userId: number,\n  tenantId: string,\n  config: Record<string, any>,\n  context: PluginContext\n): Promise<InstallResult> {\n  const { sequelize } = context;\n\n  // Create a table for your plugin data\n  await sequelize.query(`\n    CREATE TABLE IF NOT EXISTS "${tenantId}".my_plugin_data (\n      id SERIAL PRIMARY KEY,\n      name VARCHAR(255) NOT NULL,\n      created_at TIMESTAMP DEFAULT NOW()\n    )\n  `);\n\n  return {\n    success: true,\n    message: "Plugin installed",\n    installedAt: new Date().toISOString(),\n  };\n}',
    },
    {
      type: 'heading',
      id: 'uninstall-hook',
      level: 3,
      text: 'uninstall()',
    },
    {
      type: 'paragraph',
      text: 'Called when a user uninstalls the plugin. Use this to clean up database tables or other resources.',
    },
    {
      type: 'code',
      language: 'typescript',
      code: 'export async function uninstall(\n  userId: number,\n  tenantId: string,\n  context: PluginContext\n): Promise<UninstallResult> {\n  const { sequelize } = context;\n\n  await sequelize.query(\n    `DROP TABLE IF EXISTS "${tenantId}".my_plugin_data`\n  );\n\n  return {\n    success: true,\n    message: "Plugin uninstalled",\n    uninstalledAt: new Date().toISOString(),\n  };\n}',
    },
    {
      type: 'heading',
      id: 'configure-hook',
      level: 3,
      text: 'configure()',
    },
    {
      type: 'paragraph',
      text: 'Called when a user saves new configuration for the plugin. Use this to validate settings or perform setup with the new config.',
    },
    {
      type: 'code',
      language: 'typescript',
      code: 'export async function configure(\n  userId: number,\n  tenantId: string,\n  config: Record<string, any>,\n  context: PluginContext\n): Promise<ConfigureResult> {\n  // Validate the configuration\n  if (!config.api_url) {\n    throw new Error("API URL is required");\n  }\n\n  return {\n    success: true,\n    message: "Plugin configured",\n    configuredAt: new Date().toISOString(),\n  };\n}',
    },
    {
      type: 'heading',
      id: 'test-connection-hook',
      level: 3,
      text: 'testConnection()',
    },
    {
      type: 'paragraph',
      text: 'Called when a user clicks the Test Connection button. Use this to verify the plugin can reach its external service.',
    },
    {
      type: 'code',
      language: 'typescript',
      code: 'export async function testConnection(\n  config: Record<string, any>,\n  context?: { sequelize: any; userId: number; tenantId: string }\n): Promise<{ success: boolean; message: string }> {\n  try {\n    const response = await fetch(config.api_url + "/health");\n    if (response.ok) {\n      return { success: true, message: "Connected" };\n    }\n    return { success: false, message: "Service returned " + response.status };\n  } catch (error: any) {\n    return { success: false, message: error.message };\n  }\n}',
    },
    {
      type: 'heading',
      id: 'plugin-context',
      level: 2,
      text: 'Plugin context',
    },
    {
      type: 'paragraph',
      text: 'Every lifecycle hook receives a PluginContext object. The context contains a single property:',
    },
    {
      type: 'code',
      language: 'typescript',
      code: 'interface PluginContext {\n  sequelize: any;  // Sequelize instance for database access\n}',
    },
    {
      type: 'paragraph',
      text: 'Use sequelize.query() to run SQL queries against the database. Always scope your queries to the tenant schema using the tenantId parameter passed to your hooks.',
    },
    {
      type: 'callout',
      variant: 'warning',
      text: 'Plugins have full database access through Sequelize. Always use the tenantId to scope queries to the correct tenant schema and avoid affecting other organizations.',
    },
    {
      type: 'heading',
      id: 'metadata',
      level: 2,
      text: 'Plugin metadata',
    },
    {
      type: 'paragraph',
      text: 'Every plugin must export a metadata constant:',
    },
    {
      type: 'code',
      language: 'typescript',
      code: 'interface PluginMetadata {\n  name: string;\n  version: string;\n  author: string;\n  description: string;\n}\n\nexport const metadata: PluginMetadata = {\n  name: "My Plugin",\n  version: "1.0.0",\n  author: "Your Name",\n  description: "What your plugin does",\n};',
    },
    {
      type: 'heading',
      id: 'custom-routes',
      level: 2,
      text: 'Custom API routes',
    },
    {
      type: 'paragraph',
      text: 'Plugins can define their own API routes by exporting a router object. The router maps route patterns to handler functions. Routes are accessible at /api/plugins/{plugin-key}/{path}.',
    },
    {
      type: 'code',
      language: 'typescript',
      code: 'import type { PluginRouter } from "../../Servers/services/plugin/pluginService";\n\nexport const router: PluginRouter = {\n  "GET /models": async (context) => {\n    const { sequelize, tenantId, configuration } = context;\n    // Fetch models from external service using configuration\n    const models = await fetchModels(configuration.api_url);\n    return { data: models };\n  },\n\n  "POST /sync": async (context) => {\n    const { sequelize, tenantId } = context;\n    // Sync data\n    const result = await syncData(sequelize, tenantId);\n    return { data: result };\n  },\n\n  "GET /template": async (context) => {\n    // Return a file download\n    const buffer = await generateTemplate();\n    return {\n      buffer,\n      filename: "template.xlsx",\n      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",\n    };\n  },\n};',
    },
    {
      type: 'heading',
      id: 'route-context',
      level: 3,
      text: 'Route handler context',
    },
    {
      type: 'paragraph',
      text: 'Each route handler receives a PluginRouteContext with:',
    },
    {
      type: 'table',
      columns: [
        { key: 'property', label: 'Property', width: '30%' },
        { key: 'description', label: 'Description', width: '70%' },
      ],
      rows: [
        { property: 'tenantId', description: 'The tenant hash for the current organization' },
        { property: 'userId', description: 'ID of the authenticated user making the request' },
        { property: 'organizationId', description: 'ID of the user organization' },
        { property: 'method', description: 'HTTP method (GET, POST, PUT, PATCH, DELETE)' },
        { property: 'path', description: 'Route path after /api/plugins/:key' },
        { property: 'params', description: 'URL parameters extracted from the route pattern' },
        { property: 'query', description: 'Query string parameters' },
        { property: 'body', description: 'Request body (for POST, PUT, PATCH)' },
        { property: 'sequelize', description: 'Sequelize instance for database access' },
        { property: 'configuration', description: 'The saved configuration for this plugin installation' },
      ],
    },
    {
      type: 'heading',
      id: 'route-responses',
      level: 3,
      text: 'Route responses',
    },
    {
      type: 'paragraph',
      text: 'Route handlers return a PluginRouteResponse object:',
    },
    {
      type: 'table',
      columns: [
        { key: 'property', label: 'Property', width: '30%' },
        { key: 'description', label: 'Description', width: '70%' },
      ],
      rows: [
        { property: 'status', description: 'HTTP status code (defaults to 200)' },
        { property: 'data', description: 'JSON response data' },
        { property: 'buffer', description: 'Binary data for file downloads' },
        { property: 'filename', description: 'Filename for Content-Disposition header' },
        { property: 'contentType', description: 'Custom content type' },
        { property: 'headers', description: 'Additional response headers' },
      ],
    },
    {
      type: 'heading',
      id: 'route-parameters',
      level: 3,
      text: 'Route parameters',
    },
    {
      type: 'paragraph',
      text: 'Routes support path parameters using the :param syntax:',
    },
    {
      type: 'code',
      language: 'typescript',
      code: 'export const router: PluginRouter = {\n  "GET /models/:modelId": async (context) => {\n    const modelId = context.params.modelId;\n    // Fetch specific model\n    return { data: model };\n  },\n\n  "DELETE /models/:modelId": async (context) => {\n    const modelId = context.params.modelId;\n    // Delete model\n    return { data: { deleted: true } };\n  },\n};',
    },
    {
      type: 'heading',
      id: 'registry-entry',
      level: 2,
      text: 'Registry entry format',
    },
    {
      type: 'paragraph',
      text: 'To make your plugin available in the marketplace, add an entry to plugins.json. Here is the schema:',
    },
    {
      type: 'code',
      language: 'json',
      code: '{\n  "key": "my-plugin",\n  "name": "My Plugin",\n  "displayName": "My Plugin",\n  "description": "Short description of what it does",\n  "longDescription": "Detailed description with more context",\n  "version": "1.0.0",\n  "author": "Your Name",\n  "category": "data_management",\n  "iconUrl": "/assets/my_plugin_logo.svg",\n  "isOfficial": false,\n  "isPublished": true,\n  "requiresConfiguration": true,\n  "installationType": "tenant_scoped",\n  "features": [\n    {\n      "name": "Feature Name",\n      "description": "What this feature does",\n      "displayOrder": 1\n    }\n  ],\n  "tags": ["keyword1", "keyword2"],\n  "pluginPath": "plugins/my-plugin",\n  "entryPoint": "index.ts",\n  "dependencies": {\n    "some-package": "^1.0.0"\n  }\n}',
    },
    {
      type: 'heading',
      id: 'registry-fields',
      level: 3,
      text: 'Registry fields',
    },
    {
      type: 'table',
      columns: [
        { key: 'field', label: 'Field', width: '25%' },
        { key: 'required', label: 'Required', width: '10%' },
        { key: 'description', label: 'Description', width: '65%' },
      ],
      rows: [
        { field: 'key', required: 'Yes', description: 'Unique identifier using lowercase letters, numbers, and hyphens' },
        { field: 'name', required: 'Yes', description: 'Plugin name as it appears in the marketplace' },
        { field: 'displayName', required: 'Yes', description: 'Display name shown in the UI' },
        { field: 'description', required: 'Yes', description: 'Short description (shown on plugin cards)' },
        { field: 'longDescription', required: 'No', description: 'Detailed description (shown on plugin detail view)' },
        { field: 'version', required: 'Yes', description: 'Semantic version (major.minor.patch)' },
        { field: 'category', required: 'Yes', description: 'One of: communication, ml_ops, data_management, security, monitoring, version_control' },
        { field: 'isPublished', required: 'Yes', description: 'Set to true to appear in the marketplace' },
        { field: 'requiresConfiguration', required: 'Yes', description: 'Whether the plugin needs configuration before use' },
        { field: 'installationType', required: 'Yes', description: 'Use "tenant_scoped" for organization-specific or "standard" for global' },
        { field: 'pluginPath', required: 'Yes', description: 'Path to the plugin directory relative to the repository root' },
        { field: 'entryPoint', required: 'Yes', description: 'Filename of the plugin entry point (e.g., index.ts)' },
        { field: 'dependencies', required: 'No', description: 'npm packages the plugin needs (downloaded during install)' },
        { field: 'features', required: 'No', description: 'Array of feature objects with name, description, and displayOrder' },
        { field: 'tags', required: 'No', description: 'Keywords for search' },
      ],
    },
    {
      type: 'heading',
      id: 'ui-bundles',
      level: 2,
      text: 'UI bundles',
    },
    {
      type: 'paragraph',
      text: 'Plugins can inject frontend components into the VerifyWise interface. UI components are built as IIFE bundles that register React components on the window object.',
    },
    {
      type: 'heading',
      id: 'ui-registry',
      level: 3,
      text: 'UI configuration in the registry',
    },
    {
      type: 'paragraph',
      text: 'Add a ui section to your plugins.json entry to define your UI components:',
    },
    {
      type: 'code',
      language: 'json',
      code: '"ui": {\n  "bundleUrl": "/api/plugins/my-plugin/ui/dist/index.esm.js",\n  "globalName": "PluginMyPlugin",\n  "slots": [\n    {\n      "slotId": "page.models.tabs",\n      "componentName": "MyPluginTab",\n      "renderType": "tab",\n      "props": {\n        "label": "My Plugin",\n        "icon": "Database"\n      }\n    },\n    {\n      "slotId": "page.plugin.config",\n      "componentName": "MyPluginConfiguration",\n      "renderType": "card"\n    }\n  ]\n}',
    },
    {
      type: 'heading',
      id: 'available-slots',
      level: 3,
      text: 'Available UI slots',
    },
    {
      type: 'paragraph',
      text: 'Plugins can inject components into these locations:',
    },
    {
      type: 'table',
      columns: [
        { key: 'slot', label: 'Slot ID', width: '40%' },
        { key: 'description', label: 'Location', width: '35%' },
        { key: 'renderType', label: 'Render type', width: '25%' },
      ],
      rows: [
        { slot: 'page.risks.actions', description: 'Items in the risk "Insert From" dropdown', renderType: 'menuitem, modal' },
        { slot: 'page.risks.toolbar', description: 'Toolbar buttons on risk management page', renderType: 'button' },
        { slot: 'page.models.tabs', description: 'Tabs in the model inventory TabBar', renderType: 'tab' },
        { slot: 'page.models.toolbar', description: 'Toolbar buttons on model inventory page', renderType: 'button' },
        { slot: 'page.settings.tabs', description: 'Tabs on the settings page', renderType: 'tab' },
        { slot: 'page.plugin.config', description: 'Config panel for each installed plugin', renderType: 'card' },
        { slot: 'modal.framework.selection', description: 'Cards in the Add Framework modal', renderType: 'card' },
        { slot: 'page.org-framework.management', description: 'Organizational framework management', renderType: 'raw' },
        { slot: 'page.controls.custom-framework', description: 'Custom framework viewer in Controls tab', renderType: 'raw' },
        { slot: 'page.project-controls.custom-framework', description: 'Custom framework viewer in project Controls', renderType: 'raw' },
        { slot: 'page.framework-dashboard.custom', description: 'Custom framework dashboard content', renderType: 'raw' },
        { slot: 'page.project-overview.custom-framework', description: 'Custom framework progress in use-case overview', renderType: 'raw' },
      ],
    },
    {
      type: 'heading',
      id: 'render-types',
      level: 3,
      text: 'Render types',
    },
    {
      type: 'paragraph',
      text: 'The renderType determines how the component is displayed in its slot:',
    },
    {
      type: 'table',
      columns: [
        { key: 'type', label: 'Type', width: '20%' },
        { key: 'description', label: 'Description', width: '80%' },
      ],
      rows: [
        { type: 'menuitem', description: 'A menu item in a dropdown menu' },
        { type: 'modal', description: 'A modal dialog triggered by another component' },
        { type: 'tab', description: 'A tab in a TabBar' },
        { type: 'card', description: 'A card component' },
        { type: 'button', description: 'A toolbar button' },
        { type: 'widget', description: 'A dashboard widget' },
        { type: 'raw', description: 'Raw component rendering with no wrapper' },
      ],
    },
    {
      type: 'heading',
      id: 'building-ui',
      level: 3,
      text: 'Building the UI bundle',
    },
    {
      type: 'paragraph',
      text: 'Your UI bundle must be a single JavaScript file that registers React components on the window object. The VerifyWise frontend loads this bundle via a script tag and reads components from the global name specified in your registry entry.',
    },
    {
      type: 'paragraph',
      text: 'Your build output should register components like this:',
    },
    {
      type: 'code',
      language: 'typescript',
      code: '// In your UI bundle entry point\nimport { MyPluginTab } from "./MyPluginTab";\nimport { MyPluginConfiguration } from "./MyPluginConfiguration";\n\n// Register on window with the globalName from your plugins.json\n(window as any).PluginMyPlugin = {\n  MyPluginTab,\n  MyPluginConfiguration,\n};',
    },
    {
      type: 'paragraph',
      text: 'The component names registered on window must match the componentName values in your slots configuration.',
    },
    {
      type: 'heading',
      id: 'complete-example',
      level: 2,
      text: 'Complete example',
    },
    {
      type: 'paragraph',
      text: 'Here is a minimal but complete plugin that demonstrates the core interface:',
    },
    {
      type: 'code',
      language: 'typescript',
      code: '// plugins/my-plugin/index.ts\n\ninterface PluginContext {\n  sequelize: any;\n}\n\ninterface PluginMetadata {\n  name: string;\n  version: string;\n  author: string;\n  description: string;\n}\n\n// Called when user installs the plugin\nexport async function install(\n  userId: number,\n  tenantId: string,\n  config: Record<string, any>,\n  context: PluginContext\n) {\n  const { sequelize } = context;\n  await sequelize.query(`\n    CREATE TABLE IF NOT EXISTS "${tenantId}".my_records (\n      id SERIAL PRIMARY KEY,\n      data JSONB DEFAULT \'{}\'::jsonb,\n      created_at TIMESTAMP DEFAULT NOW()\n    )\n  `);\n  return { success: true, message: "Installed", installedAt: new Date().toISOString() };\n}\n\n// Called when user uninstalls the plugin\nexport async function uninstall(\n  userId: number,\n  tenantId: string,\n  context: PluginContext\n) {\n  const { sequelize } = context;\n  await sequelize.query(`DROP TABLE IF EXISTS "${tenantId}".my_records`);\n  return { success: true, message: "Uninstalled", uninstalledAt: new Date().toISOString() };\n}\n\n// Called when user saves configuration\nexport async function configure(\n  userId: number,\n  tenantId: string,\n  config: Record<string, any>,\n  context: PluginContext\n) {\n  return { success: true, message: "Configured", configuredAt: new Date().toISOString() };\n}\n\n// Called when user clicks Test Connection\nexport async function testConnection(\n  config: Record<string, any>\n) {\n  return { success: true, message: "Connection OK", testedAt: new Date().toISOString() };\n}\n\nexport const metadata: PluginMetadata = {\n  name: "My Plugin",\n  version: "1.0.0",\n  author: "Your Name",\n  description: "Example plugin",\n};',
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
        { text: 'Add your plugin entry to plugins.json in the marketplace repository' },
        { text: 'Push your code to a branch on GitHub' },
        { text: 'Update the PLUGIN_MARKETPLACE_URL in pluginService.ts to point to your branch' },
        { text: 'Install the plugin from the marketplace in your local VerifyWise instance' },
        { text: 'Check server console logs for [PluginService] messages' },
        { text: 'Test all lifecycle hooks: install, configure, test connection, uninstall' },
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      text: 'VerifyWise caches downloaded plugin code for 5 days. During development, delete the temp/plugins/your-plugin/ directory to force a fresh download.',
    },
    {
      type: 'heading',
      id: 'publishing',
      level: 2,
      text: 'Publishing to the marketplace',
    },
    {
      type: 'paragraph',
      text: 'To make your plugin available to all VerifyWise users:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Fork the bluewave-labs/plugin-marketplace repository on GitHub' },
        { text: 'Add your plugin directory under plugins/' },
        { text: 'Add your plugin entry to plugins.json with isPublished set to true' },
        { text: 'If your plugin has a UI, include the built bundle in ui/dist/' },
        { text: 'Submit a pull request to the main repository' },
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
        { bold: 'Scope all queries to the tenant', text: 'Always use the tenantId parameter when creating tables or querying data to maintain tenant isolation' },
        { bold: 'Handle errors in lifecycle hooks', text: 'Return descriptive error messages so administrators can troubleshoot installation or configuration problems' },
        { bold: 'Clean up on uninstall', text: 'Drop any database tables your plugin created when it is uninstalled' },
        { bold: 'Validate configuration', text: 'Check that all required fields are present before attempting to connect to external services' },
        { bold: 'Keep dependencies minimal', text: 'Each npm dependency adds download time during installation' },
        { bold: 'Use the existing plugin code as reference', text: 'Look at the Slack, MLflow, Azure AI Foundry, and Risk Import plugins in the marketplace repository for working examples of each pattern' },
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
          description: 'Browse and install plugins',
        },
        {
          collectionId: 'plugins',
          articleId: 'managing-plugins',
          title: 'Managing plugins',
          description: 'Configure and manage installed plugins',
        },
      ],
    },
  ],
};
