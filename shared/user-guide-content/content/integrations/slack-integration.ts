import type { ArticleContent } from '../../contentTypes';

export const slackIntegrationContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'The Slack integration enables VerifyWise to send real-time notifications about AI governance activities directly to your Slack workspace. Keep your team informed about model updates, risk assessments, compliance changes, and more without leaving Slack.',
    },
    {
      type: 'heading',
      id: 'what-you-can-do',
      level: 2,
      text: 'What you can do with Slack integration',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Receive notifications', text: 'Get real-time alerts about governance events in Slack channels' },
        { bold: 'Route by channel', text: 'Send different notification types to specific channels' },
        { bold: 'Multiple workspaces', text: 'Connect multiple Slack workspaces if needed' },
        { bold: 'Stay informed', text: 'Keep your team updated without requiring them to log into VerifyWise' },
      ],
    },
    {
      type: 'heading',
      id: 'connecting-slack',
      level: 2,
      text: 'Connecting Slack',
    },
    {
      type: 'paragraph',
      text: 'To connect your Slack workspace to VerifyWise:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Navigate to Integrations from the main menu' },
        { text: 'Click Configure on the Slack integration card' },
        { text: 'You will be redirected to Slack to authorize the connection' },
        { text: 'Select the Slack workspace you want to connect' },
        { text: 'Review the permissions requested and click Allow' },
        { text: 'You will be redirected back to VerifyWise with the connection active' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'You must have permission to install apps in your Slack workspace. If you see an error during authorization, contact your Slack workspace administrator.',
    },
    {
      type: 'heading',
      id: 'required-permissions',
      level: 2,
      text: 'Required Slack permissions',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise requests the following Slack permissions:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'channels:read', text: 'View channels to allow notification routing' },
        { bold: 'chat:write', text: 'Send messages to channels' },
        { bold: 'incoming-webhook', text: 'Create webhooks for notifications' },
        { bold: 'groups:read', text: 'View private channels for routing options' },
      ],
    },
    {
      type: 'paragraph',
      text: 'These permissions allow VerifyWise to send notifications but do not give access to read your messages or user data.',
    },
    {
      type: 'heading',
      id: 'managing-connections',
      level: 2,
      text: 'Managing Slack connections',
    },
    {
      type: 'paragraph',
      text: 'After connecting Slack, you can manage your integrations from the Slack management page:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Navigate to Integrations' },
        { text: 'Click Manage on the Slack integration card' },
        { text: 'View your connected workspaces and their status' },
      ],
    },
    {
      type: 'heading',
      id: 'integration-table',
      level: 3,
      text: 'Integration table',
    },
    {
      type: 'paragraph',
      text: 'The integrations table displays:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Workspace', text: 'The name of the connected Slack workspace' },
        { bold: 'Channel', text: 'The default channel for notifications' },
        { bold: 'Status', text: 'Whether the connection is active' },
        { bold: 'Actions', text: 'Options to configure routing or delete the connection' },
      ],
    },
    {
      type: 'heading',
      id: 'notification-routing',
      level: 2,
      text: 'Notification routing',
    },
    {
      type: 'paragraph',
      text: 'Configure where different types of notifications are sent by setting up notification routing rules. This allows you to direct specific notifications to relevant channels.',
    },
    {
      type: 'paragraph',
      text: 'To configure notification routing:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Click the routing icon for a workspace connection' },
        { text: 'Select the notification types to route' },
        { text: 'Choose the target channel for each notification type' },
        { text: 'Save your routing configuration' },
      ],
    },
    {
      type: 'image',
      src: '/images/user-guide/slack-notifications.png',
      alt: 'Notification routing modal showing different notification types like Membership and roles, Projects and organizations, Policy reminders, and Evidence alerts with channel selection dropdowns',
      caption: 'Configure notification routing to send different types of alerts to specific Slack channels.',
    },
    {
      type: 'heading',
      id: 'notification-types',
      level: 3,
      text: 'Available notification types',
    },
    {
      type: 'paragraph',
      text: 'You can route the following notification types to specific channels:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Model updates', text: 'New models added, status changes, or lifecycle events' },
        { bold: 'Risk alerts', text: 'New risks identified or risk severity changes' },
        { bold: 'Compliance updates', text: 'Assessment progress or control status changes' },
        { bold: 'Policy changes', text: 'Policy status updates or approaching review dates' },
        { bold: 'Vendor updates', text: 'Vendor status changes or new vendor risks' },
        { bold: 'Training notifications', text: 'Training program updates or completions' },
      ],
    },
    {
      type: 'heading',
      id: 'adding-workspace',
      level: 2,
      text: 'Adding another workspace',
    },
    {
      type: 'paragraph',
      text: 'To connect an additional Slack workspace:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Navigate to the Slack management page' },
        { text: 'Click "Add to Slack" button' },
        { text: 'Follow the authorization flow for the new workspace' },
        { text: 'Configure notification routing for the new connection' },
      ],
    },
    {
      type: 'heading',
      id: 'removing-connection',
      level: 2,
      text: 'Removing a Slack connection',
    },
    {
      type: 'paragraph',
      text: 'To disconnect a Slack workspace:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Navigate to the Slack management page' },
        { text: 'Find the workspace connection in the table' },
        { text: 'Click the delete icon in the actions column' },
        { text: 'Confirm the removal when prompted' },
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      text: 'Removing a Slack connection stops all notifications to that workspace immediately. You can reconnect at any time by going through the authorization flow again.',
    },
    {
      type: 'heading',
      id: 'troubleshooting',
      level: 2,
      text: 'Troubleshooting',
    },
    {
      type: 'heading',
      id: 'troubleshoot-no-notifications',
      level: 3,
      text: 'Notifications are not appearing',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Verify the Slack connection is active in the integrations table' },
        { text: 'Check that notification routing is configured for the expected channel' },
        { text: 'Ensure the VerifyWise app has not been removed from your Slack workspace' },
        { text: 'Confirm that the target channel still exists' },
      ],
    },
    {
      type: 'heading',
      id: 'troubleshoot-auth-error',
      level: 3,
      text: 'Authorization failed',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Ensure you have permission to install apps in your Slack workspace' },
        { text: 'Try again after clearing your browser cache' },
        { text: 'Contact your Slack workspace administrator if restrictions are in place' },
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
      id: 'faq-private-channels',
      level: 3,
      text: 'Can I send notifications to private channels?',
    },
    {
      type: 'paragraph',
      text: 'Yes, if you grant the appropriate permissions during authorization. The VerifyWise Slack app will need to be invited to private channels to send messages there.',
    },
    {
      type: 'heading',
      id: 'faq-who-sees',
      level: 3,
      text: 'Who can see the notifications?',
    },
    {
      type: 'paragraph',
      text: 'Anyone with access to the Slack channel where notifications are sent can see the messages. Plan your notification routing accordingly to ensure appropriate visibility.',
    },
    {
      type: 'heading',
      id: 'faq-customize-messages',
      level: 3,
      text: 'Can I customize the notification messages?',
    },
    {
      type: 'paragraph',
      text: 'Notification messages use standard formats designed to be clear and actionable. Custom message formatting is not currently available.',
    },
    {
      type: 'heading',
      id: 'faq-frequency',
      level: 3,
      text: 'How often are notifications sent?',
    },
    {
      type: 'paragraph',
      text: 'Notifications are sent in real-time as events occur in VerifyWise. There is no batching or delay.',
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'integrations',
          articleId: 'integration-overview',
          title: 'Integration overview',
          description: 'View all available integrations',
        },
        {
          collectionId: 'settings',
          articleId: 'notifications',
          title: 'Notification settings',
          description: 'Configure how you receive notifications',
        },
      ],
    },
  ],
};
