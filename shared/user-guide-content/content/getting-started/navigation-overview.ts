import type { ArticleContent } from '../../contentTypes';

export const navigationOverviewContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise organizes AI governance activities into distinct sections, each focused on a specific aspect of your program. This guide walks through the main areas of the platform and explains what you will find in each one.',
    },
    {
      type: 'paragraph',
      text: 'The sidebar on the left provides access to all major sections. As you work through your governance program, you will move between these areas depending on what you need to accomplish.',
    },
    {
      type: 'image',
      src: '/images/user-guide/sidebar-navigation.png',
      alt: 'VerifyWise sidebar showing main navigation sections',
      caption: 'The sidebar provides quick access to all platform sections.',
    },
    {
      type: 'heading',
      id: 'home-dashboard',
      level: 2,
      text: 'Home dashboard',
    },
    {
      type: 'paragraph',
      text: 'The Home dashboard is your starting point. It provides a summary view of your governance program with key metrics and recent activity. You will see compliance progress, open tasks, risk summaries, and quick access to items that need attention.',
    },
    {
      type: 'paragraph',
      text: 'The dashboard is customizable. You can rearrange widgets, show or hide sections, and configure what appears based on your role and priorities. Changes you make persist across sessions.',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Compliance progress', text: 'Visual indicators showing how complete your framework implementations are' },
        { bold: 'Risk overview', text: 'Summary of open risks by severity level' },
        { bold: 'Recent activity', text: 'Latest changes across your governance program' },
        { bold: 'Tasks', text: 'Items assigned to you or your team that need action' },
      ],
    },
    {
      type: 'heading',
      id: 'projects',
      level: 2,
      text: 'Projects',
    },
    {
      type: 'paragraph',
      text: 'Projects are the primary organizational unit in VerifyWise. A project groups related AI systems, risks, controls, and compliance activities together. Most organizations create one project per AI initiative, product, or business unit.',
    },
    {
      type: 'paragraph',
      text: 'Within a project, you will find:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Overview', text: 'Project summary with key metrics and status' },
        { bold: 'Use cases', text: 'Specific applications of AI within this project' },
        { bold: 'Risks', text: 'Identified risks associated with the project' },
        { bold: 'Controls', text: 'Measures implemented to manage risks' },
        { bold: 'Assessments', text: 'Compliance evaluations and their results' },
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      text: 'Create separate projects for distinct AI initiatives. This keeps governance activities organized and makes it easier to generate focused reports.',
    },
    {
      type: 'heading',
      id: 'model-inventory',
      level: 2,
      text: 'Model inventory',
    },
    {
      type: 'paragraph',
      text: 'The Model Inventory is your catalog of AI models. Every model your organization develops, deploys, or uses from third parties should be registered here. The inventory tracks model details, ownership, deployment status, and risk classification.',
    },
    {
      type: 'paragraph',
      text: 'From the Model Inventory, you can:',
    },
    {
      type: 'checklist',
      items: [
        'Register new models with complete metadata',
        'Track model versions and changes over time',
        'Associate models with vendors and use cases',
        'View risk classifications and compliance status',
        'Filter and search across your model portfolio',
      ],
    },
    {
      type: 'heading',
      id: 'risk-management',
      level: 2,
      text: 'Risk management',
    },
    {
      type: 'paragraph',
      text: 'The Risk Management section contains tools for identifying, assessing, and tracking risks across your AI systems. You will find both project-specific risks and organization-wide risk views.',
    },
    {
      type: 'paragraph',
      text: 'Key capabilities include:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Risk register', text: 'Complete list of identified risks with severity, likelihood, and status' },
        { bold: 'Risk assessments', text: 'Structured evaluations of risk factors' },
        { bold: 'Mitigation tracking', text: 'Monitor progress on risk reduction activities' },
        { bold: 'Risk linking', text: 'Connect risks to specific models, vendors, or controls' },
      ],
    },
    {
      type: 'heading',
      id: 'vendors',
      level: 2,
      text: 'Vendors',
    },
    {
      type: 'paragraph',
      text: 'The Vendor section tracks third-party providers of AI services, models, data, or infrastructure. Each vendor record includes contact information, service descriptions, risk scores, and review status.',
    },
    {
      type: 'paragraph',
      text: 'Vendor management helps you:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Maintain visibility', text: 'Know who provides what across your AI portfolio' },
        { bold: 'Assess vendor risk', text: 'Score vendors based on data sensitivity, criticality, and past issues' },
        { bold: 'Track reviews', text: 'Schedule and document periodic vendor assessments' },
        { bold: 'Link dependencies', text: 'Understand which projects rely on which vendors' },
      ],
    },
    {
      type: 'heading',
      id: 'policies',
      level: 2,
      text: 'Policies',
    },
    {
      type: 'paragraph',
      text: 'The Policy Manager houses your AI governance policies. You can create policies from scratch, use templates, and manage the full policy lifecycle from draft through publication and eventual retirement.',
    },
    {
      type: 'paragraph',
      text: 'Policies progress through defined states:',
    },
    {
      type: 'icon-cards',
      items: [
        {
          icon: 'FileText',
          title: 'Draft',
          description: 'Policy is being written or revised.',
        },
        {
          icon: 'Clock',
          title: 'In review',
          description: 'Policy is under stakeholder review.',
        },
        {
          icon: 'CheckCircle',
          title: 'Published',
          description: 'Policy is active and in effect.',
        },
        {
          icon: 'Archive',
          title: 'Archived',
          description: 'Policy is no longer active.',
        },
      ],
    },
    {
      type: 'heading',
      id: 'compliance',
      level: 2,
      text: 'Compliance frameworks',
    },
    {
      type: 'paragraph',
      text: 'The Compliance section provides structured views of regulatory and standard requirements. VerifyWise supports multiple frameworks including EU AI Act, ISO 42001, ISO 27001, and NIST AI RMF.',
    },
    {
      type: 'paragraph',
      text: 'For each framework, you can:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'View requirements', text: 'See all controls and requirements organized by category' },
        { bold: 'Track compliance', text: 'Monitor which requirements are addressed' },
        { bold: 'Map controls', text: 'Link your existing controls to framework requirements' },
        { bold: 'Generate reports', text: 'Create compliance summaries for auditors' },
      ],
    },
    {
      type: 'heading',
      id: 'evidence-hub',
      level: 2,
      text: 'Evidence hub',
    },
    {
      type: 'paragraph',
      text: 'The Evidence Hub is a centralized repository for compliance documentation. Upload files, attach them to specific controls or requirements, and maintain an organized audit trail.',
    },
    {
      type: 'paragraph',
      text: 'Evidence can include:',
    },
    {
      type: 'checklist',
      items: [
        'Policy documents and approvals',
        'Risk assessment reports',
        'Testing results and validation records',
        'Training completion certificates',
        'Vendor due diligence documentation',
        'Audit findings and remediation records',
      ],
    },
    {
      type: 'heading',
      id: 'incidents',
      level: 2,
      text: 'Incidents',
    },
    {
      type: 'paragraph',
      text: 'The Incident Management section tracks AI-related issues, failures, and near-misses. When something goes wrong with an AI system, create an incident record to document what happened, how it was resolved, and what was learned.',
    },
    {
      type: 'paragraph',
      text: 'Each incident record captures:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Description', text: 'What happened and when' },
        { bold: 'Severity', text: 'Impact level of the incident' },
        { bold: 'Affected systems', text: 'Which models or use cases were involved' },
        { bold: 'Resolution', text: 'How the issue was addressed' },
        { bold: 'Lessons learned', text: 'Improvements to prevent recurrence' },
      ],
    },
    {
      type: 'heading',
      id: 'reports',
      level: 2,
      text: 'Reports',
    },
    {
      type: 'paragraph',
      text: 'The Reporting section generates summaries of your governance program. You can create project-level reports for specific initiatives or organization-wide reports that span your entire AI portfolio.',
    },
    {
      type: 'paragraph',
      text: 'Reports are useful for:',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Board and executive presentations' },
        { text: 'Regulatory submissions' },
        { text: 'Audit preparation' },
        { text: 'Periodic governance reviews' },
      ],
    },
    {
      type: 'heading',
      id: 'settings',
      level: 2,
      text: 'Settings',
    },
    {
      type: 'paragraph',
      text: 'The Settings area contains configuration options for your organization and user account. Here you can:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Organization settings', text: 'Update organization name and branding' },
        { bold: 'User management', text: 'Invite team members and manage accounts' },
        { bold: 'Role configuration', text: 'Assign Admin, Editor, or Viewer roles' },
        { bold: 'Notifications', text: 'Configure how you receive alerts' },
        { bold: 'API keys', text: 'Manage programmatic access credentials' },
        { bold: 'Integrations', text: 'Connect to external tools like Slack' },
      ],
    },
    {
      type: 'heading',
      id: 'event-tracker',
      level: 2,
      text: 'Event tracker',
    },
    {
      type: 'paragraph',
      text: 'The Event Tracker provides an audit log of actions taken within VerifyWise. You can see who changed what and when, which is essential for compliance and troubleshooting.',
    },
    {
      type: 'paragraph',
      text: 'Events are filterable by user, action type, and date range. This makes it easy to investigate specific activities or review changes during a particular period.',
    },
    {
      type: 'heading',
      id: 'ai-trust-center',
      level: 2,
      text: 'AI Trust Center',
    },
    {
      type: 'paragraph',
      text: 'The AI Trust Center is your public-facing transparency portal. Configure what governance information to share externally, then publish a page that customers, partners, and regulators can access.',
    },
    {
      type: 'paragraph',
      text: 'The Trust Center helps demonstrate your commitment to responsible AI without exposing sensitive internal details.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'You control exactly what appears in your Trust Center. Enable or disable sections based on what you want to share publicly.',
    },
    {
      type: 'heading',
      id: 'getting-around',
      level: 2,
      text: 'Getting around quickly',
    },
    {
      type: 'paragraph',
      text: 'A few shortcuts to help you navigate efficiently:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Global search', text: 'Press Cmd+K (Mac) or Ctrl+K (Windows) to search across the entire platform' },
        { bold: 'Breadcrumbs', text: 'Use the breadcrumb trail at the top to move up the hierarchy' },
        { bold: 'Recent items', text: 'The dashboard shows your recent activity for quick access' },
        { bold: 'Sidebar collapse', text: 'Collapse the sidebar to gain screen space when needed' },
      ],
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'getting-started',
          articleId: 'dashboard',
          title: 'Navigating the dashboard',
          description: 'Customize your home dashboard view',
        },
        {
          collectionId: 'getting-started',
          articleId: 'quick-start',
          title: 'Quick start guide',
          description: 'Set up your first project',
        },
        {
          collectionId: 'ai-governance',
          articleId: 'model-inventory',
          title: 'Managing model inventory',
          description: 'Register and organize AI models',
        },
      ],
    },
  ],
};
