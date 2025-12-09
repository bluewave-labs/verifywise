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
      text: 'The Plugins settings page allows administrators to manage all plugins in your VerifyWise instance. From here you can view installed plugins, enable or disable them, configure settings, and monitor plugin status.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Only users with the Admin role can access plugin management. Editors and Viewers can see installed plugins but cannot make changes.',
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
      text: 'The Installed tab displays all plugins available in your VerifyWise instance. Each plugin card shows:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Plugin name', text: 'The display name of the plugin' },
        { bold: 'Description', text: 'A brief summary of what the plugin does' },
        { bold: 'Version', text: 'The currently installed version number' },
        { bold: 'Type', text: 'The plugin category (integration, feature, framework, or reporting)' },
        { bold: 'Status', text: 'Whether the plugin is enabled, disabled, or has an error' },
        { bold: 'Source', text: 'Built-in (pre-installed) or marketplace (downloaded)' },
      ],
    },
    {
      type: 'heading',
      id: 'enabling-plugins',
      level: 2,
      text: 'Enabling a plugin',
    },
    {
      type: 'paragraph',
      text: 'To enable a plugin and make its features available:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Locate the plugin in the Installed list' },
        { text: 'Click the toggle switch or Enable button on the plugin card' },
        { text: 'Wait for the plugin to initialize' },
        { text: 'Configure any required settings when prompted' },
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      text: 'Some plugins require configuration before they can be enabled. Check the plugin settings if the enable button is inactive.',
    },
    {
      type: 'heading',
      id: 'disabling-plugins',
      level: 2,
      text: 'Disabling a plugin',
    },
    {
      type: 'paragraph',
      text: 'To disable a plugin and stop its features:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Locate the plugin in the Installed list' },
        { text: 'Click the toggle switch or Disable button' },
        { text: 'Confirm the action if prompted' },
      ],
    },
    {
      type: 'paragraph',
      text: 'When a plugin is disabled:',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Its dashboard widgets are hidden' },
        { text: 'Custom pages are removed from navigation' },
        { text: 'Event handlers stop receiving events' },
        { text: 'Scheduled tasks are paused' },
        { text: 'Plugin configuration and data are preserved' },
      ],
    },
    {
      type: 'heading',
      id: 'configuring-plugins',
      level: 2,
      text: 'Configuring plugin settings',
    },
    {
      type: 'paragraph',
      text: 'Many plugins have configurable settings that customize their behavior. To configure a plugin:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Click on the plugin card or the Configure button' },
        { text: 'Review the available settings in the configuration panel' },
        { text: 'Modify settings as needed' },
        { text: 'Click Save to apply changes' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Common configuration options include:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'API keys', text: 'Credentials for external service connections' },
        { bold: 'Webhook URLs', text: 'Endpoints for sending or receiving data' },
        { bold: 'Feature toggles', text: 'Enable or disable specific plugin features' },
        { bold: 'Notification settings', text: 'Which events trigger notifications' },
        { bold: 'Data filters', text: 'Scope of data the plugin can access' },
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      text: 'Configuration changes may take effect immediately. Review settings carefully before saving, especially for production environments.',
    },
    {
      type: 'heading',
      id: 'plugin-status',
      level: 2,
      text: 'Plugin status indicators',
    },
    {
      type: 'paragraph',
      text: 'Each plugin displays its current status:',
    },
    {
      type: 'table',
      columns: [
        { key: 'status', label: 'Status', width: '25%' },
        { key: 'meaning', label: 'Meaning', width: '75%' },
      ],
      rows: [
        { status: 'Enabled', meaning: 'The plugin is active and its features are available' },
        { status: 'Disabled', meaning: 'The plugin is installed but not running' },
        { status: 'Error', meaning: 'The plugin encountered a problem and may need attention' },
        { status: 'Configuring', meaning: 'The plugin is being set up or updated' },
        { status: 'Auto-disabled', meaning: 'The plugin was disabled automatically due to repeated errors' },
      ],
    },
    {
      type: 'heading',
      id: 'troubleshooting-errors',
      level: 2,
      text: 'Troubleshooting plugin errors',
    },
    {
      type: 'paragraph',
      text: 'If a plugin shows an error status:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Click on the plugin to view error details' },
        { text: 'Check the error message for specific information' },
        { text: 'Verify that all required configuration is complete' },
        { text: 'Try disabling and re-enabling the plugin' },
        { text: 'Check Event Tracker for detailed error logs' },
      ],
    },
    {
      type: 'heading',
      id: 'auto-disable',
      level: 3,
      text: 'Auto-disabled plugins',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise automatically disables plugins that crash repeatedly to protect system stability. If a plugin is auto-disabled:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Review the error details in the plugin status' },
        { text: 'Check if the plugin needs updated configuration' },
        { text: 'Manually re-enable the plugin after addressing the issue' },
        { text: 'Contact the plugin developer if errors persist' },
      ],
    },
    {
      type: 'heading',
      id: 'uninstalling-plugins',
      level: 2,
      text: 'Uninstalling marketplace plugins',
    },
    {
      type: 'paragraph',
      text: 'Marketplace plugins can be uninstalled when no longer needed. Built-in plugins cannot be uninstalled, only disabled.',
    },
    {
      type: 'paragraph',
      text: 'To uninstall a marketplace plugin:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Disable the plugin if it is currently enabled' },
        { text: 'Click the Uninstall button on the plugin card' },
        { text: 'Confirm the uninstallation' },
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      text: 'Uninstalling a plugin removes its files and configuration. This action cannot be undone. Any data created by the plugin may be preserved in the database.',
    },
    {
      type: 'heading',
      id: 'viewing-plugin-details',
      level: 2,
      text: 'Viewing plugin details',
    },
    {
      type: 'paragraph',
      text: 'Click on a plugin card to view detailed information:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Description', text: 'Full description of plugin functionality' },
        { bold: 'Author', text: 'Developer or organization that created the plugin' },
        { bold: 'Version history', text: 'Current version and changelog' },
        { bold: 'Permissions', text: 'What the plugin can access' },
        { bold: 'Configuration', text: 'Current settings and options' },
        { bold: 'Dependencies', text: 'Other plugins or services required' },
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
        { bold: 'Start with built-in plugins', text: 'Try the pre-installed plugins before exploring the marketplace' },
        { bold: 'Enable one at a time', text: 'Enable plugins individually to identify any issues quickly' },
        { bold: 'Review permissions', text: 'Understand what access each plugin requires before enabling' },
        { bold: 'Keep plugins updated', text: 'Install updates when available for security and feature improvements' },
        { bold: 'Disable unused plugins', text: 'Reduce system overhead by disabling plugins you do not use' },
        { bold: 'Test in development first', text: 'Try new plugins in a non-production environment when possible' },
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
          description: 'Learn about the plugin system',
        },
        {
          collectionId: 'plugins',
          articleId: 'plugin-marketplace',
          title: 'Plugin marketplace',
          description: 'Browse and install community plugins',
        },
        {
          collectionId: 'settings',
          articleId: 'role-configuration',
          title: 'Role configuration',
          description: 'Understand admin permissions',
        },
      ],
    },
  ],
};
