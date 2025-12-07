import type { ArticleContent } from '../../contentTypes';

export const watchtowerContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'WatchTower provides real-time monitoring and alerting for your AI governance program. It aggregates insights from across VerifyWise to surface compliance risks, upcoming deadlines, and governance issues that need attention.',
    },
    {
      type: 'paragraph',
      text: 'Think of WatchTower as your governance command center — a single view that highlights what matters most so you can take action before issues escalate.',
    },
    {
      type: 'heading',
      id: 'accessing-watchtower',
      level: 2,
      text: 'Accessing WatchTower',
    },
    {
      type: 'paragraph',
      text: 'Navigate to **WatchTower** from the main sidebar. The dashboard displays key metrics, alerts, and actionable insights organized by priority.',
    },
    {
      type: 'heading',
      id: 'key-features',
      level: 2,
      text: 'Key features',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Compliance alerts', text: 'Real-time notifications about compliance gaps, missing documentation, or overdue assessments' },
        { bold: 'Deadline tracking', text: 'Upcoming deadlines for reviews, certifications, and regulatory submissions' },
        { bold: 'Risk indicators', text: 'Aggregated risk scores and trends across your AI portfolio' },
        { bold: 'Activity feed', text: 'Recent changes and updates across your governance program' },
      ],
    },
    {
      type: 'heading',
      id: 'monitoring-alerts',
      level: 2,
      text: 'Monitoring and alerts',
    },
    {
      type: 'paragraph',
      text: 'WatchTower continuously monitors your governance data and surfaces alerts based on configurable thresholds:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Overdue tasks', text: 'Tasks that have passed their due date' },
        { bold: 'Expiring policies', text: 'Policies approaching their review date' },
        { bold: 'High-risk vendors', text: 'Vendors with elevated risk scores' },
        { bold: 'Incomplete assessments', text: 'Compliance assessments that need attention' },
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      text: 'Configure notification preferences in Settings to receive WatchTower alerts via Slack or email.',
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
        { bold: 'Daily review', text: 'Check WatchTower daily to stay on top of emerging issues' },
        { bold: 'Address high-priority items first', text: 'Focus on critical alerts before lower-priority notifications' },
        { bold: 'Set up notifications', text: 'Configure Slack integration to receive real-time alerts' },
        { bold: 'Track trends', text: 'Monitor risk trends over time to identify systemic issues' },
      ],
    },
  ],
};
