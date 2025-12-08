import type { ArticleContent } from '@user-guide-content/contentTypes';

export const dashboardContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Dashboard overview',
    },
    {
      type: 'paragraph',
      text: "The dashboard is your home base in VerifyWise. After logging in, this is the first screen you'll see — it provides a snapshot of your AI governance program across all projects and lets you quickly access the areas that need attention.",
    },
    {
      type: 'paragraph',
      text: 'You can return to the dashboard at any time by clicking the VerifyWise logo in the top-left corner or selecting "Dashboard" from the sidebar menu.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: "The dashboard automatically refreshes to show the latest data. If you've made changes elsewhere in the platform, they'll be reflected here when you return.",
    },
    {
      type: 'heading',
      id: 'use-case-cards',
      level: 2,
      text: 'Use case cards',
    },
    {
      type: 'paragraph',
      text: 'The main area of the dashboard displays cards for each of your AI use cases. Each card gives you a quick view of that use case\'s governance status.',
    },
    {
      type: 'info-box',
      icon: 'FolderKanban',
      title: 'What each use case card shows',
      items: [
        'Use case name and description',
        'Compliance status as a percentage',
        'Assessment progress (completed / total)',
        'Control completion metrics',
        'Last updated timestamp',
      ],
    },
    {
      type: 'paragraph',
      text: 'Click on any use case card to open that use case and view its full details, including assessments, controls, risks, and evidence.',
    },
    {
      type: 'heading',
      id: 'org-metrics',
      level: 2,
      text: 'Organization metrics',
    },
    {
      type: 'paragraph',
      text: "Above the use case cards, you'll find summary metrics that aggregate data across your entire organization. These give you an at-a-glance view of your overall AI governance posture.",
    },
    {
      type: 'grid-cards',
      items: [
        {
          icon: 'Gauge',
          title: 'Overall compliance',
          description: 'Average compliance percentage across all active use cases',
        },
        {
          icon: 'CheckCircle',
          title: 'Assessments completed',
          description: 'Number of assessments finished vs. total required',
        },
        {
          icon: 'FolderKanban',
          title: 'Control completion',
          description: 'Controls and sub-controls implemented across use cases',
        },
      ],
    },
    {
      type: 'heading',
      id: 'sidebar',
      level: 2,
      text: 'Sidebar navigation',
    },
    {
      type: 'paragraph',
      text: 'The sidebar on the left side of the screen is your primary navigation tool. It\'s organized into logical sections to help you quickly find what you need.',
    },
    {
      type: 'icon-cards',
      items: [
        {
          icon: 'LayoutDashboard',
          title: 'Quick access',
          description: 'Dashboard — return to this overview. Tasks — view your pending action items.',
        },
        {
          icon: 'Menu',
          title: 'Feature sections',
          description: 'Discovery — model inventory, vendor tracking. Assurance — assessments, compliance frameworks. Governance — policies, evidence, incidents.',
        },
        {
          icon: 'Settings',
          title: 'Management',
          description: 'Settings — organization and user configuration. Event tracker — audit log of system activities.',
        },
      ],
    },
    {
      type: 'image',
      src: '/images/user-guide/sidebar-navigation.png',
      alt: 'VerifyWise sidebar navigation showing Dashboard, Tasks, Discovery, Assurance, and Governance sections with expandable menus',
      caption: 'The sidebar provides access to all platform features organized by category.',
    },
    {
      type: 'paragraph',
      text: "At the bottom of the sidebar, you'll find your user profile section with access to account settings and support resources.",
    },
    {
      type: 'heading',
      id: 'quick-actions',
      level: 2,
      text: 'Quick actions',
    },
    {
      type: 'paragraph',
      text: 'The dashboard header includes buttons for common actions you might want to take:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Integrations', text: 'Connect VerifyWise with external tools (admin only)' },
        { bold: 'Automations', text: 'Set up automated workflows and triggers' },
        { bold: 'New use case', text: 'Register a new AI use case in the system' },
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Next step',
      text: 'Ready to start? Follow the quick start guide to set up your first AI governance use case in under 10 minutes.',
    },
  ],
};
