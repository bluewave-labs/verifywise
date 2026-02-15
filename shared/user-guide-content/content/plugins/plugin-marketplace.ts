import type { ArticleContent } from '../../contentTypes';

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
      text: 'The VerifyWise plugin marketplace is a GitHub-hosted registry of official plugins. It provides a central place to browse available plugins, view their descriptions and features, and install them into your VerifyWise organization.',
    },
    {
      type: 'paragraph',
      text: 'The marketplace is powered by a plugins.json file in the bluewave-labs/plugin-marketplace GitHub repository. VerifyWise fetches this file to display available plugins and downloads plugin code directly from the same repository.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'The marketplace requires an internet connection to browse and download plugins. Only administrators can install plugins.',
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
        { text: 'Browse available plugins or filter by category' },
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
        { bold: 'Plugin name', text: 'The display name of the plugin' },
        { bold: 'Description', text: 'A brief summary of what the plugin does' },
        { bold: 'Author', text: 'The developer or organization that created the plugin' },
        { bold: 'Category', text: 'The plugin category such as Communication, ML Operations, or Data Management' },
        { bold: 'Version', text: 'The latest available version' },
        { bold: 'Features', text: 'A list of the plugin capabilities' },
        { bold: 'Tags', text: 'Keywords that describe the plugin functionality' },
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
      text: 'You can narrow down the plugin list using:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Search', text: 'Enter keywords to search plugin names, descriptions, and tags' },
        { bold: 'Category filter', text: 'Show only plugins from a specific category' },
      ],
    },
    {
      type: 'paragraph',
      text: 'The search matches against the plugin name, description, and tags fields in the marketplace registry.',
    },
    {
      type: 'heading',
      id: 'available-plugins',
      level: 2,
      text: 'Currently available plugins',
    },
    {
      type: 'paragraph',
      text: 'The marketplace currently includes these official plugins:',
    },
    {
      type: 'table',
      columns: [
        { key: 'plugin', label: 'Plugin', width: '15%' },
        { key: 'category', label: 'Category', width: '15%' },
        { key: 'description', label: 'What it does', width: '40%' },
        { key: 'config', label: 'Requires config', width: '15%' },
        { key: 'ui', label: 'Has UI', width: '15%' },
      ],
      rows: [
        { plugin: 'Slack', category: 'Communication', description: 'Sends governance notifications to Slack channels via OAuth', config: 'Yes', ui: 'Config panel' },
        { plugin: 'MLflow', category: 'ML Operations', description: 'Syncs model metadata from MLflow tracking server into model inventory', config: 'Yes', ui: 'Tab + config' },
        { plugin: 'Azure AI Foundry', category: 'ML Operations', description: 'Imports model deployments from Azure AI Foundry into model inventory', config: 'Yes', ui: 'Tab + config' },
        { plugin: 'Risk Import', category: 'Data Management', description: 'Bulk imports project risks from Excel spreadsheets', config: 'No', ui: 'Menu + modal' },
      ],
    },
    {
      type: 'heading',
      id: 'plugin-categories',
      level: 2,
      text: 'Marketplace categories',
    },
    {
      type: 'paragraph',
      text: 'Plugins are organized into the following categories:',
    },
    {
      type: 'table',
      columns: [
        { key: 'category', label: 'Category', width: '25%' },
        { key: 'description', label: 'Description', width: '75%' },
      ],
      rows: [
        { category: 'Communication', description: 'Team communication and notification integrations' },
        { category: 'ML Operations', description: 'Machine learning workflow and model management tools' },
        { category: 'Data Management', description: 'Data import, export, and transformation tools' },
        { category: 'Security', description: 'Security and compliance tools' },
        { category: 'Monitoring', description: 'System and application monitoring integrations' },
        { category: 'Version Control', description: 'Source control and repository integrations' },
      ],
    },
    {
      type: 'heading',
      id: 'installing-plugins',
      level: 2,
      text: 'Installing from the marketplace',
    },
    {
      type: 'paragraph',
      text: 'To install a plugin:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Find the plugin you want in the Marketplace tab' },
        { text: 'Click the Install button on the plugin card' },
        { text: 'Wait for the download and installation to complete' },
        { text: 'The plugin moves to your Installed tab' },
      ],
    },
    {
      type: 'heading',
      id: 'installation-process',
      level: 3,
      text: 'What happens during installation',
    },
    {
      type: 'paragraph',
      text: 'When you click Install, VerifyWise performs these steps:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Downloads the plugin entry point file from the GitHub repository' },
        { text: 'Downloads the package.json if the plugin has npm dependencies' },
        { text: 'Runs npm install for any dependencies the plugin requires' },
        { text: 'Downloads the UI bundle if the plugin has frontend components' },
        { text: 'Runs the plugin install() hook, which may create database tables or perform other setup' },
        { text: 'Creates an installation record in the plugin_installations table for your tenant' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Downloaded plugin code is cached locally for 5 days. Subsequent uses of the plugin load from cache instead of re-downloading.',
    },
    {
      type: 'heading',
      id: 'after-installation',
      level: 2,
      text: 'After installation',
    },
    {
      type: 'paragraph',
      text: 'After installing a plugin, the next step depends on the plugin:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Plugins that require configuration', text: 'Go to the plugin configuration panel and enter your service credentials, then test the connection' },
        { bold: 'Plugins with no configuration', text: 'The plugin is ready to use immediately. For example, Risk Import adds a menu item to the risk management page right away.' },
      ],
    },
    {
      type: 'heading',
      id: 'how-registry-works',
      level: 2,
      text: 'How the registry works',
    },
    {
      type: 'paragraph',
      text: 'The marketplace is backed by a plugins.json file hosted in the bluewave-labs/plugin-marketplace GitHub repository. This file contains the metadata for every published plugin, including its name, description, version, category, features, tags, and the paths to its code and UI bundle.',
    },
    {
      type: 'paragraph',
      text: 'Only plugins with isPublished set to true in the registry appear in the marketplace. The VerifyWise server fetches this file over HTTPS from GitHub raw content URLs.',
    },
    {
      type: 'heading',
      id: 'security',
      level: 2,
      text: 'Security considerations',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Official registry', text: 'All plugins are hosted in the official VerifyWise plugin marketplace repository on GitHub' },
        { bold: 'Open source', text: 'Plugin source code is publicly available for review before you install' },
        { bold: 'Rate limiting', text: 'Installations are rate-limited to 20 per hour to prevent abuse' },
        { bold: 'JWT authentication', text: 'All plugin API endpoints require JWT authentication' },
        { bold: 'Tenant isolation', text: 'Each organization has independent installations and data' },
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      text: 'Plugins run server-side in the same Node.js process as VerifyWise and have access to the database through Sequelize. Review plugin source code on GitHub before installing.',
    },
    {
      type: 'heading',
      id: 'evaluating-plugins',
      level: 3,
      text: 'Before installing a plugin',
    },
    {
      type: 'paragraph',
      text: 'Consider the following before installing a plugin:',
    },
    {
      type: 'checklist',
      items: [
        'Is the plugin marked as official (created by VerifyWise)?',
        'Have you reviewed the plugin source code on GitHub?',
        'Does the plugin require external service credentials, and are you comfortable providing them?',
        'Is the plugin actively maintained with recent commits?',
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
        { text: 'Verify your VerifyWise server can reach GitHub over HTTPS' },
        { text: 'Check if raw.githubusercontent.com is accessible from your network' },
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
        { text: 'Check server logs for specific error messages from PluginService' },
        { text: 'Verify sufficient disk space for the plugin code and npm dependencies' },
        { text: 'Ensure the plugins directory has write permissions' },
        { text: 'Confirm you have not exceeded the 20 installations per hour rate limit' },
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
          articleId: 'managing-plugins',
          title: 'Managing plugins',
          description: 'Configure and manage installed plugins',
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
