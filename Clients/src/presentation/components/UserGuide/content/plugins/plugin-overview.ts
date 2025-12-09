import type { ArticleContent } from '@user-guide-content/contentTypes';

export const pluginOverviewContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'Plugins extend VerifyWise with new features, integrations, and capabilities. Whether you want to connect with external services, add dashboard widgets, or automate workflows, plugins provide a flexible way to customize your AI governance platform.',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise supports two types of plugins: built-in plugins that ship with the platform and marketplace plugins that can be installed on-demand from the community registry.',
    },
    {
      type: 'heading',
      id: 'what-plugins-can-do',
      level: 2,
      text: 'What plugins can do',
    },
    {
      type: 'paragraph',
      text: 'Plugins can enhance your VerifyWise instance in several ways:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Dashboard widgets', text: 'Display custom metrics, charts, and activity feeds on your dashboard' },
        { bold: 'Custom pages', text: 'Add new pages to the sidebar navigation for specialized features' },
        { bold: 'Event handling', text: 'Respond to system events like model updates, compliance changes, or task completions' },
        { bold: 'External integrations', text: 'Connect with third-party services for notifications, data sync, or automation' },
        { bold: 'Webhooks', text: 'Receive and process incoming webhooks from external systems' },
        { bold: 'Data enrichment', text: 'Extend models with custom metadata and attributes' },
      ],
    },
    {
      type: 'heading',
      id: 'plugin-types',
      level: 2,
      text: 'Plugin types',
    },
    {
      type: 'paragraph',
      text: 'Plugins are categorized by their primary function:',
    },
    {
      type: 'icon-cards',
      items: [
        {
          icon: 'Plug',
          title: 'Integration',
          description: 'Connect with external services like Slack, Jira, or cloud providers.',
        },
        {
          icon: 'Sparkles',
          title: 'Feature',
          description: 'Add new functionality such as audit trails, analytics, or automation.',
        },
        {
          icon: 'Shield',
          title: 'Framework',
          description: 'Add compliance frameworks like GDPR, SOC2, or custom standards.',
        },
        {
          icon: 'FileText',
          title: 'Reporting',
          description: 'Generate custom reports and export data in various formats.',
        },
      ],
    },
    {
      type: 'heading',
      id: 'built-in-vs-marketplace',
      level: 2,
      text: 'Built-in vs marketplace plugins',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise provides plugins from two sources:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Built-in plugins', text: 'Pre-installed with VerifyWise and ready to enable. These plugins are maintained by the VerifyWise team and receive automatic updates.' },
        { bold: 'Marketplace plugins', text: 'Available for download from the VerifyWise plugin marketplace. These plugins extend functionality beyond the core platform.' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Built-in plugins are disabled by default and must be enabled by an administrator. Marketplace plugins must be installed before they can be enabled.',
    },
    {
      type: 'heading',
      id: 'plugin-states',
      level: 2,
      text: 'Plugin states',
    },
    {
      type: 'paragraph',
      text: 'Plugins progress through several states during their lifecycle:',
    },
    {
      type: 'ordered-list',
      items: [
        { bold: 'Registered', text: 'The plugin is known to the system but not yet installed (marketplace plugins only).' },
        { bold: 'Installed', text: 'The plugin files are present on the system and ready for use.' },
        { bold: 'Enabled', text: 'The plugin is active and running. Its features are available to users.' },
        { bold: 'Disabled', text: 'The plugin is installed but not running. No resources are consumed.' },
      ],
    },
    {
      type: 'heading',
      id: 'permissions',
      level: 2,
      text: 'Plugin permissions',
    },
    {
      type: 'paragraph',
      text: 'Each plugin declares the permissions it requires to function. Common permissions include:',
    },
    {
      type: 'table',
      columns: [
        { key: 'permission', label: 'Permission', width: '30%' },
        { key: 'description', label: 'Description', width: '70%' },
      ],
      rows: [
        { permission: 'events:listen', description: 'Receive notifications when system events occur' },
        { permission: 'events:emit', description: 'Trigger custom events for other plugins' },
        { permission: 'database:read', description: 'Read data from VerifyWise models' },
        { permission: 'database:write', description: 'Create or update data in VerifyWise' },
        { permission: 'config:read', description: 'Access plugin configuration settings' },
        { permission: 'http:outbound', description: 'Make outbound HTTP requests to external services' },
        { permission: 'models:define', description: 'Define custom database models for plugin data' },
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      text: 'Review plugin permissions carefully before installation. Only install plugins from trusted sources.',
    },
    {
      type: 'heading',
      id: 'who-can-manage',
      level: 2,
      text: 'Who can manage plugins',
    },
    {
      type: 'paragraph',
      text: 'Plugin management is restricted to administrators:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Administrators', text: 'Can install, uninstall, enable, disable, and configure all plugins' },
        { bold: 'Editors and Viewers', text: 'Can view installed plugins and their status but cannot make changes' },
      ],
    },
    {
      type: 'heading',
      id: 'security',
      level: 2,
      text: 'Security considerations',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise implements several security measures for the plugin system:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Permission isolation', text: 'Plugins can only access APIs they have been granted permission to use' },
        { bold: 'Trusted plugin model', text: 'Plugins come from verified sources: VerifyWise team, employees, or customers' },
        { bold: 'Checksum verification', text: 'Marketplace plugins are verified against their published checksums' },
        { bold: 'Error protection', text: 'Plugins that crash repeatedly are automatically disabled to protect system stability' },
        { bold: 'Tenant isolation', text: 'Each organization has independent plugin configurations and data' },
      ],
    },
    {
      type: 'heading',
      id: 'getting-started',
      level: 2,
      text: 'Getting started with plugins',
    },
    {
      type: 'paragraph',
      text: 'Ready to extend VerifyWise with plugins? Here is what to do next:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Navigate to Settings > Plugins to view available plugins' },
        { text: 'Enable a built-in plugin to try plugin features' },
        { text: 'Browse the marketplace for additional plugins' },
        { text: 'Configure plugin settings to customize behavior' },
      ],
    },
    {
      type: 'article-links',
      title: 'Next steps',
      items: [
        {
          collectionId: 'plugins',
          articleId: 'managing-plugins',
          title: 'Managing plugins',
          description: 'Learn how to install, enable, and configure plugins',
        },
        {
          collectionId: 'plugins',
          articleId: 'plugin-marketplace',
          title: 'Plugin marketplace',
          description: 'Browse and install community plugins',
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
