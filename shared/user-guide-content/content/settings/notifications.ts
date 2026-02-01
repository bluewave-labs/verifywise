import type { ArticleContent } from '../../contentTypes';

export const notificationsContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise provides notification capabilities to keep you informed about important governance activities. Notifications help ensure that team members are aware of updates, deadlines, and actions that require attention.',
    },
    {
      type: 'heading',
      id: 'notification-types',
      level: 2,
      text: 'Types of notifications',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise can notify you about various governance events:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Model updates', text: 'Changes to AI models in your inventory' },
        { bold: 'Risk assessments', text: 'New risks identified or risk status changes' },
        { bold: 'Compliance changes', text: 'Updates to assessment progress or control status' },
        { bold: 'Policy updates', text: 'Changes to policy status or upcoming reviews' },
        { bold: 'Vendor changes', text: 'Vendor status updates or new vendor risks' },
        { bold: 'Training reminders', text: 'Training programs approaching or past due' },
      ],
    },
    {
      type: 'heading',
      id: 'slack-notifications',
      level: 2,
      text: 'Slack notifications',
    },
    {
      type: 'paragraph',
      text: 'The primary way to receive notifications from VerifyWise is through the Slack integration. When configured, VerifyWise can send real-time notifications directly to your Slack workspace.',
    },
    {
      type: 'paragraph',
      text: 'To set up Slack notifications:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Navigate to Integrations from the main menu' },
        { text: 'Click on the Slack integration card' },
        { text: 'Authorize VerifyWise to connect to your Slack workspace' },
        { text: 'Configure which channels receive notifications' },
        { text: 'Set up notification routing for different event types' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Only administrators can configure the Slack integration. Once configured, notifications are sent to the designated channels for all team members to see.',
    },
    {
      type: 'heading',
      id: 'notification-routing',
      level: 2,
      text: 'Notification routing',
    },
    {
      type: 'paragraph',
      text: 'When using the Slack integration, you can route different types of notifications to different channels. This helps organize notifications so relevant team members see the updates that matter to them.',
    },
    {
      type: 'paragraph',
      text: 'Example routing configurations:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: '#ai-governance', text: 'All governance-related notifications' },
        { bold: '#compliance-team', text: 'Compliance assessment updates and deadlines' },
        { bold: '#risk-alerts', text: 'New risks and critical risk updates' },
        { bold: '#model-updates', text: 'Model inventory changes and lifecycle events' },
      ],
    },
    {
      type: 'heading',
      id: 'in-app-indicators',
      level: 2,
      text: 'In-app indicators',
    },
    {
      type: 'paragraph',
      text: 'In addition to external notifications, VerifyWise displays visual indicators within the platform to highlight items needing attention:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Dashboard widgets', text: 'Priority indicators and status charts on the main dashboard' },
        { bold: 'Status badges', text: 'Visual badges showing item status throughout the platform' },
        { bold: 'Review dates', text: 'Policies and assessments show when reviews are due' },
        { bold: 'Risk severity', text: 'Color-coded indicators for risk levels' },
      ],
    },
    {
      type: 'heading',
      id: 'staying-informed',
      level: 2,
      text: 'Staying informed',
    },
    {
      type: 'paragraph',
      text: 'To ensure you stay informed about your governance program:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Check the dashboard regularly', text: 'The dashboard provides a real-time overview of your governance status' },
        { bold: 'Set up Slack integration', text: 'Receive notifications in your daily workflow tool' },
        { bold: 'Review status cards', text: 'Status breakdowns help you identify areas needing attention' },
        { bold: 'Monitor review dates', text: 'Keep track of when policies and assessments need review' },
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
      id: 'faq-email-notifications',
      level: 3,
      text: 'Does VerifyWise send email notifications?',
    },
    {
      type: 'paragraph',
      text: 'Currently, VerifyWise uses Slack as the primary notification channel. Email is used for account-related communications like invitations and password resets, but not for governance notifications.',
    },
    {
      type: 'heading',
      id: 'faq-disable-notifications',
      level: 3,
      text: 'Can I turn off certain notifications?',
    },
    {
      type: 'paragraph',
      text: 'Notification filtering is managed through the Slack integration settings. You can configure which notification types are sent and which channels receive them. Contact your administrator to adjust notification settings.',
    },
    {
      type: 'heading',
      id: 'faq-who-receives',
      level: 3,
      text: 'Who receives notifications?',
    },
    {
      type: 'paragraph',
      text: 'Slack notifications are sent to channels, so anyone with access to those channels will see the notifications. Channel membership is managed within Slack. In-app indicators are visible to all users who can view the relevant content.',
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
          collectionId: 'reporting',
          articleId: 'dashboard-analytics',
          title: 'Dashboard overview',
          description: 'Monitor governance status',
        },
      ],
    },
  ],
};
