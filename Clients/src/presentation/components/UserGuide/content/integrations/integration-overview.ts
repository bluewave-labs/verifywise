import type { ArticleContent } from '@user-guide-content/contentTypes';

export const integrationOverviewContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise integrations connect your AI governance platform with external tools and services. Integrations help streamline workflows, automate data synchronization, and keep your team informed through familiar channels.',
    },
    {
      type: 'paragraph',
      text: 'From the Integrations page, you can view available integrations, check their status, and configure connections to external services.',
    },
    {
      type: 'heading',
      id: 'accessing-integrations',
      level: 2,
      text: 'Accessing integrations',
    },
    {
      type: 'paragraph',
      text: 'To access integrations:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Click on Integrations in the main navigation' },
        { text: 'View the available integration cards' },
        { text: 'Click Configure or Manage to set up or modify an integration' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Only users with the Admin role can access and configure integrations. If you do not see the Integrations menu item, contact your administrator.',
    },
    {
      type: 'heading',
      id: 'available-integrations',
      level: 2,
      text: 'Available integrations',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise currently offers the following integrations:',
    },
    {
      type: 'icon-cards',
      items: [
        {
          icon: 'MessageSquare',
          title: 'Slack',
          description: 'Send real-time notifications about AI governance activities to your Slack workspace.',
        },
        {
          icon: 'Activity',
          title: 'MLflow',
          description: 'Sync machine learning models and experiments from your MLflow tracking server.',
        },
      ],
    },
    {
      type: 'image',
      src: '/images/user-guide/integrations.png',
      alt: 'Integrations page showing Slack and MLflow integration cards with configuration status and descriptions',
      caption: 'The Integrations page displays available integrations with their current configuration status.',
    },
    {
      type: 'heading',
      id: 'integration-status',
      level: 2,
      text: 'Integration status',
    },
    {
      type: 'paragraph',
      text: 'Each integration card displays its current status:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Not configured', text: 'The integration has not been set up yet. Click Configure to begin setup.' },
        { bold: 'Configured', text: 'The integration is active and connected. Click Manage to view or modify settings.' },
        { bold: 'Error', text: 'The integration encountered a problem. Click Manage to troubleshoot.' },
      ],
    },
    {
      type: 'heading',
      id: 'slack-integration',
      level: 2,
      text: 'Slack integration',
    },
    {
      type: 'paragraph',
      text: 'The Slack integration enables VerifyWise to send notifications directly to your Slack workspace. You can route different types of notifications to specific channels, keeping your team informed about governance activities without leaving Slack.',
    },
    {
      type: 'paragraph',
      text: 'Key features:',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Real-time notifications for governance events' },
        { text: 'Route notifications to specific channels' },
        { text: 'Multiple workspace connections' },
        { text: 'Customizable notification routing' },
      ],
    },
    {
      type: 'heading',
      id: 'mlflow-integration',
      level: 2,
      text: 'MLflow integration',
    },
    {
      type: 'paragraph',
      text: 'The MLflow integration connects VerifyWise to your MLflow tracking server, enabling automatic synchronization of machine learning models. This helps maintain an up-to-date model inventory without manual data entry.',
    },
    {
      type: 'paragraph',
      text: 'Key features:',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Automatic model synchronization' },
        { text: 'Multiple authentication methods (none, basic auth, API token)' },
        { text: 'Scheduled sync every hour' },
        { text: 'Connection status monitoring' },
        { text: 'Manual sync trigger' },
      ],
    },
    {
      type: 'heading',
      id: 'api-access',
      level: 2,
      text: 'API access',
    },
    {
      type: 'paragraph',
      text: 'In addition to pre-built integrations, VerifyWise provides API access for custom integrations. API keys allow you to programmatically interact with VerifyWise data and features from external applications or scripts.',
    },
    {
      type: 'paragraph',
      text: 'API keys are managed from Settings > API Keys. See the API access article for details on creating and managing API tokens.',
    },
    {
      type: 'heading',
      id: 'security',
      level: 2,
      text: 'Security considerations',
    },
    {
      type: 'paragraph',
      text: 'When configuring integrations, keep these security practices in mind:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Limit access', text: 'Only administrators can configure integrations, reducing the risk of unauthorized changes' },
        { bold: 'Review permissions', text: 'Understand what permissions each integration requires before connecting' },
        { bold: 'Monitor connections', text: 'Regularly review active integrations and disconnect any that are no longer needed' },
        { bold: 'Protect credentials', text: 'Never share API keys or integration credentials with unauthorized users' },
        { bold: 'Use SSL', text: 'Ensure external services use secure HTTPS connections' },
      ],
    },
    {
      type: 'heading',
      id: 'troubleshooting',
      level: 2,
      text: 'Troubleshooting',
    },
    {
      type: 'paragraph',
      text: 'If an integration is not working as expected:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Check the integration status on the Integrations page' },
        { text: 'Verify that connection credentials are correct' },
        { text: 'Test the connection using the built-in test feature' },
        { text: 'Check if the external service is accessible and running' },
        { text: 'Review any error messages displayed in the integration settings' },
      ],
    },
    {
      type: 'heading',
      id: 'faq',
      level: 2,
      text: 'Frequently asked questions',
    },
    {
      type: 'heading',
      id: 'faq-who-can-configure',
      level: 3,
      text: 'Who can configure integrations?',
    },
    {
      type: 'paragraph',
      text: 'Only users with the Admin role can access the Integrations page and configure connections. This ensures that integration credentials and settings are managed by authorized personnel.',
    },
    {
      type: 'heading',
      id: 'faq-multiple-connections',
      level: 3,
      text: 'Can I connect multiple Slack workspaces?',
    },
    {
      type: 'paragraph',
      text: 'Yes, you can add multiple Slack workspace connections. Each connection can be configured with its own notification routing rules.',
    },
    {
      type: 'heading',
      id: 'faq-disconnect',
      level: 3,
      text: 'How do I disconnect an integration?',
    },
    {
      type: 'paragraph',
      text: 'Navigate to the integration\'s management page and look for disconnect or delete options. For Slack, you can remove individual workspace connections. For MLflow, you can clear the configuration to disconnect.',
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'integrations',
          articleId: 'slack-integration',
          title: 'Slack integration',
          description: 'Set up Slack notifications',
        },
        {
          collectionId: 'integrations',
          articleId: 'api-access',
          title: 'API access',
          description: 'Manage API keys for custom integrations',
        },
      ],
    },
  ],
};
