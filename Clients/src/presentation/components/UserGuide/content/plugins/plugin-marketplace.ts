import type { ArticleContent } from '@user-guide-content/contentTypes';

export const pluginMarketplaceContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'The VerifyWise plugin marketplace is a community-driven repository of plugins that extend the platform with additional features, integrations, and capabilities. Browse available plugins, review their descriptions, and install them directly from within VerifyWise.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'The marketplace requires an internet connection to browse and download plugins. Only administrators can install plugins from the marketplace.',
    },
    {
      type: 'heading',
      id: 'accessing-marketplace',
      level: 2,
      text: 'Accessing the marketplace',
    },
    {
      type: 'paragraph',
      text: 'To browse the plugin marketplace:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Navigate to Settings > Plugins' },
        { text: 'Click on the Marketplace tab' },
        { text: 'Browse or search for plugins' },
      ],
    },
    {
      type: 'heading',
      id: 'browsing-plugins',
      level: 2,
      text: 'Browsing plugins',
    },
    {
      type: 'paragraph',
      text: 'The marketplace displays available plugins as cards. Each card shows:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Plugin name', text: 'The official name of the plugin' },
        { bold: 'Description', text: 'A brief summary of plugin functionality' },
        { bold: 'Author', text: 'The developer or organization that created the plugin' },
        { bold: 'Type', text: 'The plugin category (integration, feature, framework, or reporting)' },
        { bold: 'Version', text: 'The latest available version' },
        { bold: 'Status', text: 'Whether the plugin is already installed' },
      ],
    },
    {
      type: 'heading',
      id: 'filtering-plugins',
      level: 2,
      text: 'Filtering and searching',
    },
    {
      type: 'paragraph',
      text: 'Use the marketplace filters to find plugins:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Search', text: 'Enter keywords to search plugin names and descriptions' },
        { bold: 'Type filter', text: 'Show only integration, feature, framework, or reporting plugins' },
        { bold: 'Tag filter', text: 'Filter by specific tags like "slack", "compliance", or "dashboard"' },
      ],
    },
    {
      type: 'heading',
      id: 'plugin-details',
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
        { bold: 'Full description', text: 'Complete information about what the plugin does' },
        { bold: 'Features', text: 'List of capabilities and functionality' },
        { bold: 'Screenshots', text: 'Visual preview of the plugin interface' },
        { bold: 'Permissions', text: 'What access the plugin requires' },
        { bold: 'Compatibility', text: 'Minimum VerifyWise version required' },
        { bold: 'Author information', text: 'Developer details and support links' },
        { bold: 'Version history', text: 'Changelog and release notes' },
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      text: 'Review the permissions section carefully before installing. Only install plugins from trusted sources.',
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
        { text: 'Find the plugin you want to install' },
        { text: 'Click the Install button on the plugin card' },
        { text: 'Review the permissions and confirm installation' },
        { text: 'Wait for the download and installation to complete' },
        { text: 'The plugin appears in your Installed tab' },
      ],
    },
    {
      type: 'paragraph',
      text: 'During installation, VerifyWise:',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Downloads the plugin package from the registry' },
        { text: 'Verifies the checksum to ensure integrity' },
        { text: 'Extracts plugin files to the plugins directory' },
        { text: 'Validates the plugin manifest and structure' },
        { text: 'Registers the plugin with the system' },
      ],
    },
    {
      type: 'heading',
      id: 'after-installation',
      level: 2,
      text: 'After installation',
    },
    {
      type: 'paragraph',
      text: 'Newly installed plugins are disabled by default. To start using the plugin:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Go to Settings > Plugins > Installed' },
        { text: 'Find the newly installed plugin' },
        { text: 'Configure any required settings' },
        { text: 'Enable the plugin' },
      ],
    },
    {
      type: 'heading',
      id: 'updating-plugins',
      level: 2,
      text: 'Updating plugins',
    },
    {
      type: 'paragraph',
      text: 'When a new version is available for an installed plugin, you will see an Update badge on the plugin card.',
    },
    {
      type: 'paragraph',
      text: 'To update a plugin:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Click the Update button on the plugin card' },
        { text: 'Review the changelog for the new version' },
        { text: 'Confirm the update' },
        { text: 'The plugin will be disabled during the update' },
        { text: 'Re-enable the plugin after the update completes' },
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      text: 'Plugin updates may include configuration changes. Review the changelog and test in a non-production environment when possible.',
    },
    {
      type: 'heading',
      id: 'security',
      level: 2,
      text: 'Security and trust',
    },
    {
      type: 'paragraph',
      text: 'The VerifyWise marketplace implements several security measures:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Checksum verification', text: 'Downloaded plugins are verified against published SHA-256 checksums' },
        { bold: 'Permission declarations', text: 'Plugins must declare all permissions they require' },
        { bold: 'Community registry', text: 'Plugins are hosted on the official VerifyWise registry' },
        { bold: 'Open source', text: 'Plugin source code is available for review on GitHub' },
      ],
    },
    {
      type: 'heading',
      id: 'evaluating-plugins',
      level: 3,
      text: 'Evaluating plugins before installation',
    },
    {
      type: 'paragraph',
      text: 'Before installing a plugin, consider:',
    },
    {
      type: 'checklist',
      items: [
        'Is the plugin author trusted or well-known?',
        'Are the requested permissions appropriate for the functionality?',
        'Is the plugin actively maintained with recent updates?',
        'Does the plugin have documentation and support options?',
        'Is the source code available for review?',
      ],
    },
    {
      type: 'heading',
      id: 'offline-installation',
      level: 2,
      text: 'Uploading plugins manually',
    },
    {
      type: 'paragraph',
      text: 'For environments without marketplace access, or to install custom plugins, you can upload a plugin ZIP file directly:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Download or create a plugin ZIP file containing a manifest.json' },
        { text: 'Go to Settings > Plugins' },
        { text: 'Click the Upload plugin button' },
        { text: 'Select your ZIP file and confirm the upload' },
        { text: 'The plugin will be validated and installed automatically' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Uploaded plugins are marked as "Manually installed" in the UI to distinguish them from marketplace plugins.',
    },
    {
      type: 'heading',
      id: 'available-templates',
      level: 2,
      text: 'Plugin templates',
    },
    {
      type: 'paragraph',
      text: 'The marketplace repository includes templates for creating your own plugins:',
    },
    {
      type: 'table',
      columns: [
        { key: 'template', label: 'Template', width: '35%' },
        { key: 'description', label: 'Description', width: '65%' },
      ],
      rows: [
        { template: 'template-basic-plugin', description: 'Simple plugin with lifecycle hooks and event handlers' },
        { template: 'template-custom-page', description: 'Plugin with a custom page in the sidebar' },
        { template: 'template-iframe-page', description: 'Embed external content via iframe' },
        { template: 'template-notification-sender', description: 'Send notifications to external services' },
        { template: 'template-webhook-receiver', description: 'Receive and process webhooks from external systems' },
      ],
    },
    {
      type: 'heading',
      id: 'troubleshooting',
      level: 2,
      text: 'Troubleshooting',
    },
    {
      type: 'heading',
      id: 'cannot-access-marketplace',
      level: 3,
      text: 'Cannot access the marketplace',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Verify your VerifyWise server has internet access' },
        { text: 'Check if the registry URL is accessible from your network' },
        { text: 'Ensure you are logged in as an administrator' },
      ],
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
        { text: 'Check server logs for specific error messages' },
        { text: 'Verify sufficient disk space on the server' },
        { text: 'Ensure the plugins directory has write permissions' },
        { text: 'Try downloading and installing manually' },
      ],
    },
    {
      type: 'heading',
      id: 'checksum-mismatch',
      level: 3,
      text: 'Checksum verification failed',
    },
    {
      type: 'paragraph',
      text: 'If checksum verification fails, the download may be corrupted or tampered with. Try again or download directly from the GitHub repository.',
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
          articleId: 'managing-plugins',
          title: 'Managing plugins',
          description: 'Enable, configure, and manage plugins',
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
