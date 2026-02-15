import type { ArticleContent } from '../../contentTypes';

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
      text: 'Plugins extend VerifyWise with new integrations and capabilities. You can connect with external services like Slack or MLflow, import data from spreadsheets, add new tabs to existing pages, or inject custom UI components into specific areas of the platform.',
    },
    {
      type: 'paragraph',
      text: 'All plugins are hosted in the VerifyWise plugin marketplace, a GitHub-based registry. Administrators can browse available plugins, install them with one click, and configure them per organization.',
    },
    {
      type: 'heading',
      id: 'what-plugins-can-do',
      level: 2,
      text: 'What plugins can do',
    },
    {
      type: 'paragraph',
      text: 'Plugins can extend VerifyWise in the following ways:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'External integrations', text: 'Connect with third-party services like Slack, MLflow, or Azure AI Foundry to sync data and send notifications' },
        { bold: 'Data import', text: 'Bulk import risks, models, or other records from Excel spreadsheets or external systems' },
        { bold: 'Custom tabs', text: 'Add new tabs to the model inventory or settings pages to display plugin-specific data' },
        { bold: 'Configuration panels', text: 'Provide dedicated configuration UI for each plugin with connection testing' },
        { bold: 'Menu actions', text: 'Add items to dropdown menus such as the risk management "Insert From" menu' },
        { bold: 'Custom API routes', text: 'Expose plugin-specific API endpoints for webhooks, OAuth callbacks, or data retrieval' },
      ],
    },
    {
      type: 'heading',
      id: 'plugin-categories',
      level: 2,
      text: 'Plugin categories',
    },
    {
      type: 'paragraph',
      text: 'Plugins are organized into categories based on their primary function:',
    },
    {
      type: 'table',
      columns: [
        { key: 'category', label: 'Category', width: '30%' },
        { key: 'description', label: 'Description', width: '70%' },
      ],
      rows: [
        { category: 'Communication', description: 'Team communication and notification integrations such as Slack' },
        { category: 'ML Operations', description: 'Machine learning workflow tools such as MLflow and Azure AI Foundry' },
        { category: 'Data Management', description: 'Data import, export, and transformation tools such as Risk Import' },
        { category: 'Security', description: 'Security scanning and compliance verification tools' },
        { category: 'Monitoring', description: 'System and model monitoring integrations' },
        { category: 'Version Control', description: 'Source control and repository integrations' },
      ],
    },
    {
      type: 'heading',
      id: 'available-plugins',
      level: 2,
      text: 'Available plugins',
    },
    {
      type: 'paragraph',
      text: 'The following official plugins are currently available in the marketplace:',
    },
    {
      type: 'table',
      columns: [
        { key: 'plugin', label: 'Plugin', width: '20%' },
        { key: 'category', label: 'Category', width: '20%' },
        { key: 'description', label: 'What it does', width: '60%' },
      ],
      rows: [
        { plugin: 'Slack', category: 'Communication', description: 'Connects your Slack workspace via OAuth to send governance notifications to channels' },
        { plugin: 'MLflow', category: 'ML Operations', description: 'Syncs model metadata from your MLflow tracking server into the model inventory' },
        { plugin: 'Azure AI Foundry', category: 'ML Operations', description: 'Imports model data from Azure AI Foundry into the model inventory' },
        { plugin: 'Risk Import', category: 'Data Management', description: 'Bulk imports project risks from Excel spreadsheets using a downloadable template' },
      ],
    },
    {
      type: 'heading',
      id: 'how-plugins-work',
      level: 2,
      text: 'How plugins work',
    },
    {
      type: 'paragraph',
      text: 'When you install a plugin, VerifyWise downloads the plugin code from the marketplace repository, installs any required dependencies, and runs the plugin installation hook. The plugin can then create its own database tables, set up connections to external services, and register UI components.',
    },
    {
      type: 'paragraph',
      text: 'Plugin installations are scoped to your organization. Each organization has its own independent plugin configurations and data, completely isolated from other tenants.',
    },
    {
      type: 'heading',
      id: 'ui-injection',
      level: 2,
      text: 'UI injection slots',
    },
    {
      type: 'paragraph',
      text: 'Plugins can inject UI components into specific locations in the VerifyWise interface called slots. The current slots include:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Risk management', text: 'Menu items in the "Insert From" dropdown and toolbar buttons' },
        { bold: 'Model inventory', text: 'Additional tabs in the model TabBar and toolbar buttons' },
        { bold: 'Settings', text: 'Additional tabs on the settings page' },
        { bold: 'Plugin configuration', text: 'Dedicated configuration panel for each installed plugin' },
        { bold: 'Framework management', text: 'Custom framework cards in the Add Framework modal, framework dashboards, and controls viewers' },
      ],
    },
    {
      type: 'heading',
      id: 'who-can-manage',
      level: 2,
      text: 'Who can manage plugins',
    },
    {
      type: 'paragraph',
      text: 'Plugin management requires administrator access. Administrators can install, uninstall, and configure plugins. Other roles can see installed plugins but cannot make changes.',
    },
    {
      type: 'heading',
      id: 'security',
      level: 2,
      text: 'Security considerations',
    },
    {
      type: 'paragraph',
      text: 'Keep the following in mind when working with plugins:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Trusted sources', text: 'Only install plugins from the official VerifyWise marketplace. Official plugins are reviewed by the VerifyWise team.' },
        { bold: 'Tenant isolation', text: 'Each organization has independent plugin installations, configurations, and data stored in separate database schemas.' },
        { bold: 'Rate limiting', text: 'Plugin installations are rate-limited to 20 per hour to prevent abuse.' },
        { bold: 'Authentication', text: 'All plugin API endpoints require JWT authentication.' },
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      text: 'Plugins run in the same process as VerifyWise and have access to the database via Sequelize. Only install plugins you trust.',
    },
    {
      type: 'heading',
      id: 'getting-started',
      level: 2,
      text: 'Getting started with plugins',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Navigate to Settings > Plugins to view the marketplace' },
        { text: 'Browse available plugins or filter by category' },
        { text: 'Click Install on a plugin to add it to your organization' },
        { text: 'Configure the plugin with your service credentials if required' },
        { text: 'Test the connection to verify the plugin is working' },
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
          description: 'Learn how to install, configure, and uninstall plugins',
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
