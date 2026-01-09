import type { ArticleContent } from '../../contentTypes';

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
      id: 'dashboard-views',
      level: 2,
      text: 'Dashboard views',
    },
    {
      type: 'paragraph',
      text: 'The dashboard offers two viewing modes to suit different needs: Operations view and Executive view. You can switch between them using the toggle in the top-right corner of the dashboard.',
    },
    {
      type: 'grid-cards',
      items: [
        {
          icon: 'Settings',
          title: 'Operations view',
          description: 'Focuses on actionable items like tasks, incidents, and day-to-day metrics. Best for team members managing ongoing governance activities.',
        },
        {
          icon: 'BarChart3',
          title: 'Executive view',
          description: 'Prioritizes organizational frameworks and compliance status. Best for leadership reviewing overall governance posture.',
        },
      ],
    },
    {
      type: 'paragraph',
      text: 'Your view preference is saved automatically, so the dashboard will remember your choice the next time you log in.',
    },
    {
      type: 'heading',
      id: 'header-cards',
      level: 2,
      text: 'Header cards',
    },
    {
      type: 'paragraph',
      text: 'At the top of the dashboard, you\'ll find summary cards that provide quick access to key areas of the platform:',
    },
    {
      type: 'grid-cards',
      items: [
        {
          icon: 'Brain',
          title: 'Models',
          description: 'Total number of AI models in your inventory. Click to access model inventory.',
        },
        {
          icon: 'Building2',
          title: 'Vendors',
          description: 'Number of vendors you work with. Click to access vendor management.',
        },
        {
          icon: 'ScrollText',
          title: 'Policies',
          description: 'Total policies and pending reviews. Click to access policy management.',
        },
        {
          icon: 'GraduationCap',
          title: 'Training',
          description: 'Training sessions and completion status. Click to access training management.',
        },
        {
          icon: 'AlertCircle',
          title: 'Incidents',
          description: 'Open incidents requiring attention. Click to access incident management.',
        },
      ],
    },
    {
      type: 'heading',
      id: 'framework-cards',
      level: 2,
      text: 'Organizational framework cards',
    },
    {
      type: 'paragraph',
      text: 'If your organization has enabled compliance frameworks (ISO 42001, ISO 27001, or NIST AI RMF), you\'ll see dedicated cards showing your progress against each framework.',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'ISO 42001 and ISO 27001', text: 'Use the arrow buttons in the card header to switch between viewing clauses and annexes progress.' },
        { bold: 'NIST AI RMF', text: 'Shows a breakdown of control implementation status across all functions.' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Click on any framework card to navigate to the detailed framework management page.',
    },
    {
      type: 'heading',
      id: 'risk-cards',
      level: 2,
      text: 'Risk overview cards',
    },
    {
      type: 'paragraph',
      text: 'The dashboard displays risk distribution across three categories:',
    },
    {
      type: 'grid-cards',
      items: [
        {
          icon: 'AlertTriangle',
          title: 'Use case and framework risks',
          description: 'Risks identified in your AI use cases and compliance assessments.',
        },
        {
          icon: 'Building2',
          title: 'Vendor risks',
          description: 'Risks associated with third-party vendors and their AI systems.',
        },
        {
          icon: 'Brain',
          title: 'Model risks',
          description: 'Risks specific to AI models in your inventory.',
        },
      ],
    },
    {
      type: 'paragraph',
      text: 'Each card shows a donut chart with the distribution of risk levels (critical, high, medium, low). Click on any card to navigate to the corresponding risk management page.',
    },
    {
      type: 'heading',
      id: 'task-radar',
      level: 2,
      text: 'Task radar',
    },
    {
      type: 'paragraph',
      text: 'The task radar card helps you stay on top of your governance tasks by showing:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Overdue', text: 'Tasks that have passed their due date and need immediate attention.' },
        { bold: 'Due soon', text: 'Tasks due within the next 7 days.' },
        { bold: 'Upcoming', text: 'Tasks scheduled for more than 7 days from now.' },
      ],
    },
    {
      type: 'paragraph',
      text: 'Click on the task radar card to navigate to the full tasks page where you can manage all your pending items.',
    },
    {
      type: 'heading',
      id: 'metrics-cards',
      level: 2,
      text: 'Metrics cards',
    },
    {
      type: 'paragraph',
      text: 'Additional dashboard cards provide insights into various aspects of your governance program:',
    },
    {
      type: 'grid-cards',
      items: [
        {
          icon: 'GraduationCap',
          title: 'Training completion',
          description: 'Shows planned, in-progress, and completed training sessions.',
        },
        {
          icon: 'ScrollText',
          title: 'Policy status',
          description: 'Distribution of policies by status: published, approved, under review, draft, and archived.',
        },
        {
          icon: 'AlertCircle',
          title: 'Incident status',
          description: 'Breakdown of incidents: open, investigating, mitigated, and closed.',
        },
        {
          icon: 'FileCheck',
          title: 'Evidence coverage',
          description: 'Percentage of models with supporting evidence and total evidence items.',
        },
        {
          icon: 'Brain',
          title: 'Model lifecycle',
          description: 'Distribution of models by approval status: approved, pending, restricted, and blocked.',
        },
      ],
    },
    {
      type: 'heading',
      id: 'use-cases-table',
      level: 2,
      text: 'Recent use cases',
    },
    {
      type: 'paragraph',
      text: 'The recent use cases table shows your most recently updated AI use cases with key information at a glance:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Use case name', text: 'The name of the AI use case.' },
        { bold: 'Framework', text: 'The compliance framework(s) applied to this use case.' },
        { bold: 'Progress', text: 'Overall completion percentage of sub-controls.' },
        { bold: 'Status', text: 'Current status of the use case.' },
        { bold: 'Updated', text: 'When the use case was last modified.' },
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
      text: 'The dashboard header includes the "Add new" button for quick access to common actions:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'New use case', text: 'Register a new AI use case in the system.' },
        { bold: 'New vendor', text: 'Add a new vendor to your vendor registry.' },
        { bold: 'New model', text: 'Add a new AI model to your inventory.' },
        { bold: 'New policy', text: 'Create a new governance policy.' },
        { bold: 'New incident', text: 'Report a new AI-related incident.' },
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
