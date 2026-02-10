import type { ArticleContent } from '../../contentTypes';

export const rulesContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'The Rules page lets you configure automated alerts for Shadow AI activity. When a rule\'s conditions are met, the system sends notifications so you can respond to new risks or policy violations without manually monitoring dashboards.',
    },
    {
      type: 'heading',
      id: 'rules-tab',
      level: 2,
      text: 'Rules tab',
    },
    {
      type: 'paragraph',
      text: 'The default view displays all configured alert rules as cards. Each card shows the rule name, trigger type, threshold values, notification settings, and an active/inactive toggle.',
    },
    {
      type: 'paragraph',
      text: 'You can enable or disable a rule at any time using the toggle switch. Disabled rules do not fire alerts but are preserved for future use.',
    },
    {
      type: 'heading',
      id: 'creating-rules',
      level: 2,
      text: 'Creating a rule',
    },
    {
      type: 'paragraph',
      text: 'Click "Create rule" to open the creation modal. Fill in the following fields:',
    },
    {
      type: 'ordered-list',
      items: [
        { bold: 'Rule name', text: 'A descriptive name (required)' },
        { bold: 'Description', text: 'Optional notes about the rule\'s purpose' },
        { bold: 'Trigger type', text: 'The condition that fires the alert (see below)' },
        { bold: 'Configuration', text: 'Threshold or parameters specific to the trigger type' },
        { bold: 'Notify me', text: 'Check this to receive in-app and email notifications when the rule fires' },
        { bold: 'Active', text: 'Toggle whether the rule is active immediately after creation' },
      ],
    },
    {
      type: 'heading',
      id: 'trigger-types',
      level: 2,
      text: 'Trigger types',
    },
    {
      type: 'paragraph',
      text: 'Each rule monitors one type of event. The available triggers are:',
    },
    {
      type: 'icon-cards',
      items: [
        {
          icon: 'Radar',
          title: 'New tool detected',
          description: 'Fires when a previously unseen AI tool appears in network traffic.',
        },
        {
          icon: 'TrendingUp',
          title: 'Usage threshold exceeded',
          description: 'Fires when a tool\'s cumulative event count exceeds the configured threshold.',
        },
        {
          icon: 'Building2',
          title: 'Sensitive department usage',
          description: 'Fires when users from specified departments access AI tools.',
        },
        {
          icon: 'ShieldAlert',
          title: 'Blocked tool attempt',
          description: 'Fires when someone attempts to access a tool with "Blocked" status.',
        },
      ],
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Risk score exceeded', text: 'Fires when a tool\'s nightly risk score meets or exceeds the minimum threshold you set (1-100).' },
        { bold: 'New user detected', text: 'Fires when a previously unseen user is observed accessing any AI tool.' },
      ],
    },
    {
      type: 'heading',
      id: 'usage-threshold',
      level: 3,
      text: 'Understanding usage thresholds',
    },
    {
      type: 'paragraph',
      text: 'The usage threshold is the cumulative number of network events (API calls, page visits) recorded for a single AI tool across all users. For example, setting the threshold to 100 means the alert fires once a tool has been accessed 100 times total.',
    },
    {
      type: 'heading',
      id: 'risk-score-trigger',
      level: 3,
      text: 'Understanding risk score triggers',
    },
    {
      type: 'paragraph',
      text: 'The risk score (0-100) is calculated nightly using a weighted formula: approval status (40%), data and compliance policies (25%), usage volume (15%), and department sensitivity (20%). Tools that are unapproved with weak compliance posture in sensitive departments score highest.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'For a detailed breakdown of how risk scores are calculated, visit the Settings page and see the "Risk score calculation" section.',
    },
    {
      type: 'heading',
      id: 'deleting-rules',
      level: 2,
      text: 'Deleting a rule',
    },
    {
      type: 'paragraph',
      text: 'Click the trash icon on a rule card to delete it. You will be asked to confirm. Deleting a rule removes the rule definition but preserves any alert history that was already generated.',
    },
    {
      type: 'heading',
      id: 'alert-history',
      level: 2,
      text: 'Alert history tab',
    },
    {
      type: 'paragraph',
      text: 'Switch to the "Alert history" tab to view a chronological log of all triggered alerts. The table shows:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Rule', text: 'Name of the rule that fired' },
        { bold: 'Trigger', text: 'The trigger type that caused the alert' },
        { bold: 'Fired at', text: 'Timestamp of when the alert was triggered' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Click column headers to sort. The table supports pagination for large alert volumes.',
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'shadow-ai',
          articleId: 'ai-tools',
          title: 'AI tools',
          description: 'Review and manage detected tools',
        },
        {
          collectionId: 'shadow-ai',
          articleId: 'settings',
          title: 'Settings',
          description: 'Configure API keys and data retention',
        },
        {
          collectionId: 'shadow-ai',
          articleId: 'insights',
          title: 'Insights',
          description: 'View dashboard metrics and trends',
        },
      ],
    },
  ],
};
