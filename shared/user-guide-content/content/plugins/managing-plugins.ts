import type { ArticleContent } from '../../contentTypes';

export const managingPluginsContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'The Plugins settings page allows administrators to manage all plugins in your VerifyWise organization. From here you can view installed plugins, install new ones from the marketplace, configure plugin settings, test connections to external services, and uninstall plugins you no longer need.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Only users with the Admin role can install, configure, or uninstall plugins. Other roles can see installed plugins but cannot make changes.',
    },
    {
      type: 'heading',
      id: 'accessing-plugins',
      level: 2,
      text: 'Accessing the plugins page',
    },
    {
      type: 'paragraph',
      text: 'To access plugin management:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Click on Settings in the main navigation' },
        { text: 'Select the Plugins tab' },
        { text: 'View installed plugins in the Installed tab or browse the Marketplace tab' },
      ],
    },
    {
      type: 'heading',
      id: 'plugin-list',
      level: 2,
      text: 'Understanding the plugin list',
    },
    {
      type: 'paragraph',
      text: 'The Installed tab displays all plugins currently installed in your organization. Each plugin card shows:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Plugin name', text: 'The display name of the plugin' },
        { bold: 'Description', text: 'A brief summary of what the plugin does' },
        { bold: 'Version', text: 'The currently installed version number' },
        { bold: 'Category', text: 'The plugin category such as Communication, ML Operations, or Data Management' },
        { bold: 'Status', text: 'Whether the plugin is installed or has an error' },
      ],
    },
    {
      type: 'heading',
      id: 'installing-plugins',
      level: 2,
      text: 'Installing a plugin',
    },
    {
      type: 'paragraph',
      text: 'To install a plugin from the marketplace:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Go to Settings > Plugins and click the Marketplace tab' },
        { text: 'Find the plugin you want and click Install' },
        { text: 'Wait for the download and installation to complete' },
        { text: 'The plugin appears in your Installed tab' },
      ],
    },
    {
      type: 'paragraph',
      text: 'During installation, VerifyWise downloads the plugin code from the GitHub-based marketplace, installs any npm dependencies the plugin needs, downloads the UI bundle if the plugin has a frontend component, and runs the plugin install hook. The install hook may create database tables or perform other setup specific to the plugin.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Plugin installations are rate-limited to 20 per hour per IP address to prevent abuse.',
    },
    {
      type: 'heading',
      id: 'configuring-plugins',
      level: 2,
      text: 'Configuring plugin settings',
    },
    {
      type: 'paragraph',
      text: 'Plugins that connect to external services need configuration before they work. To configure a plugin:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Click on the plugin card in the Installed tab' },
        { text: 'Fill in the required configuration fields in the plugin configuration panel' },
        { text: 'Click Save to apply the configuration' },
      ],
    },
    {
      type: 'paragraph',
      text: 'The configuration fields vary by plugin. Here are some examples from the built-in plugins:',
    },
    {
      type: 'table',
      columns: [
        { key: 'plugin', label: 'Plugin', width: '25%' },
        { key: 'fields', label: 'Configuration fields', width: '75%' },
      ],
      rows: [
        { plugin: 'Slack', fields: 'OAuth workspace connection, notification channel routing' },
        { plugin: 'MLflow', fields: 'Tracking server URL, authentication method (none, basic, or token), credentials, SSL verification' },
        { plugin: 'Azure AI Foundry', fields: 'Azure subscription ID, resource group, workspace name, authentication credentials' },
        { plugin: 'Risk Import', fields: 'No configuration required' },
      ],
    },
    {
      type: 'paragraph',
      text: 'When you save configuration, VerifyWise stores it in the plugin installation record for your organization. If the plugin defines a configure hook, it runs after the configuration is saved to perform any plugin-specific setup.',
    },
    {
      type: 'heading',
      id: 'testing-connections',
      level: 2,
      text: 'Testing a connection',
    },
    {
      type: 'paragraph',
      text: 'Plugins that connect to external services may support connection testing. This lets you verify that your configuration is correct before relying on the plugin.',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Configure the plugin with your service credentials' },
        { text: 'Click the Test Connection button in the plugin configuration panel' },
        { text: 'The plugin attempts to connect to the external service using your configuration' },
        { text: 'A success or failure message is displayed with details' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Not all plugins support connection testing. Plugins like Risk Import that do not connect to external services will not have a Test Connection option.',
    },
    {
      type: 'heading',
      id: 'plugin-status',
      level: 2,
      text: 'Plugin status',
    },
    {
      type: 'paragraph',
      text: 'Each plugin installation has one of these statuses:',
    },
    {
      type: 'table',
      columns: [
        { key: 'status', label: 'Status', width: '25%' },
        { key: 'meaning', label: 'Meaning', width: '75%' },
      ],
      rows: [
        { status: 'Installing', meaning: 'The plugin is being downloaded and set up' },
        { status: 'Installed', meaning: 'The plugin is installed and ready to use' },
        { status: 'Failed', meaning: 'The installation encountered an error' },
        { status: 'Uninstalling', meaning: 'The plugin is being removed' },
      ],
    },
    {
      type: 'heading',
      id: 'uninstalling-plugins',
      level: 2,
      text: 'Uninstalling a plugin',
    },
    {
      type: 'paragraph',
      text: 'To uninstall a plugin you no longer need:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Find the plugin in the Installed tab' },
        { text: 'Click the Uninstall button on the plugin card' },
        { text: 'Confirm the uninstallation' },
      ],
    },
    {
      type: 'paragraph',
      text: 'When you uninstall a plugin, VerifyWise runs the plugin uninstall hook, which may clean up database tables or other resources the plugin created. The installation record is then deleted.',
    },
    {
      type: 'callout',
      variant: 'warning',
      text: 'Uninstalling a plugin may remove data that the plugin created, such as database tables for synced model records. This cannot be undone.',
    },
    {
      type: 'heading',
      id: 'plugin-isolation',
      level: 2,
      text: 'Organization isolation',
    },
    {
      type: 'paragraph',
      text: 'Plugin installations are scoped to your organization. Each organization has its own independent set of installed plugins, configurations, and plugin data. Installing or uninstalling a plugin in one organization has no effect on other organizations.',
    },
    {
      type: 'paragraph',
      text: 'Plugins that create database tables do so within your organization tenant schema, keeping all data isolated.',
    },
    {
      type: 'heading',
      id: 'plugin-caching',
      level: 2,
      text: 'Plugin caching',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise caches downloaded plugin code for 5 days to avoid re-downloading on every use. After 5 days, the plugin code is fetched again from the marketplace. This means plugin updates in the marketplace may take up to 5 days to propagate automatically.',
    },
    {
      type: 'heading',
      id: 'troubleshooting',
      level: 2,
      text: 'Troubleshooting',
    },
    {
      type: 'heading',
      id: 'installation-fails',
      level: 3,
      text: 'Plugin installation fails',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Check that your VerifyWise server has internet access to reach GitHub' },
        { text: 'Verify sufficient disk space for the plugin code and its npm dependencies' },
        { text: 'Check server logs for specific error messages from the PluginService' },
        { text: 'Confirm you have not hit the rate limit of 20 installations per hour' },
      ],
    },
    {
      type: 'heading',
      id: 'connection-test-fails',
      level: 3,
      text: 'Connection test fails',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Verify that the external service URL is reachable from your VerifyWise server' },
        { text: 'Double-check your credentials (API keys, tokens, usernames, passwords)' },
        { text: 'For MLflow, confirm the tracking server URL includes the protocol (http:// or https://)' },
        { text: 'For Slack, ensure the OAuth workspace connection is still valid' },
      ],
    },
    {
      type: 'heading',
      id: 'plugin-ui-not-loading',
      level: 3,
      text: 'Plugin UI not loading',
    },
    {
      type: 'paragraph',
      text: 'If a plugin tab or configuration panel does not appear after installation, the UI bundle may not have downloaded. The server will attempt to download it on first request. Check server logs for UI bundle download errors and verify the plugin marketplace repository is accessible.',
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'plugins',
          articleId: 'plugin-overview',
          title: 'Plugin overview',
          description: 'Learn about the plugin system and available plugins',
        },
        {
          collectionId: 'plugins',
          articleId: 'plugin-marketplace',
          title: 'Plugin marketplace',
          description: 'Browse and install plugins from the marketplace',
        },
        {
          collectionId: 'plugins',
          articleId: 'developing-plugins',
          title: 'Developing plugins',
          description: 'Create your own custom plugins',
        },
      ],
    },
  ],
};
