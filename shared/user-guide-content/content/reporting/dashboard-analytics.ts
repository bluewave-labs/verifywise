import type { ArticleContent } from '../../contentTypes';

export const dashboardAnalyticsContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'The VerifyWise dashboard is the first screen you see after logging in. It provides a real-time overview of your AI governance program, showing key metrics across all areas of the platform in a customizable layout.',
    },
    {
      type: 'paragraph',
      text: 'The dashboard gives you immediate visibility into your governance status, helping you quickly identify areas that need attention and track progress over time. Each widget links directly to its corresponding section, allowing you to navigate efficiently to any part of the platform.',
    },
    {
      type: 'image',
      src: '/images/user-guide/dashboard-overview.png',
      alt: 'VerifyWise dashboard showing widget cards with status charts for models, vendors, policies, trainings, and incidents',
      caption: 'The VerifyWise dashboard provides an at-a-glance view of your AI governance program.',
    },
    {
      type: 'heading',
      id: 'greeting',
      level: 2,
      text: 'Personalized greeting',
    },
    {
      type: 'paragraph',
      text: 'The dashboard welcomes you with a personalized greeting based on the time of day. Morning, afternoon, and evening greetings adapt automatically. On special occasions like international observance days, you may see themed greetings to mark the occasion.',
    },
    {
      type: 'heading',
      id: 'dashboard-widgets',
      level: 2,
      text: 'Dashboard widgets',
    },
    {
      type: 'paragraph',
      text: 'The dashboard displays widget cards that provide at-a-glance metrics for different areas of your governance program. Each card shows the total count for that category and, where applicable, a visual breakdown of status distribution.',
    },
    {
      type: 'icon-cards',
      items: [
        {
          icon: 'Lightbulb',
          title: 'Use cases',
          description: 'Total number of AI use cases registered in your organization.',
        },
        {
          icon: 'Brain',
          title: 'Models',
          description: 'AI models tracked in your model inventory with status breakdown.',
        },
        {
          icon: 'Building2',
          title: 'Vendors',
          description: 'Third-party AI vendors with their current status distribution.',
        },
        {
          icon: 'ShieldAlert',
          title: 'Vendor risks',
          description: 'Risks identified for your AI vendors with severity breakdown.',
        },
        {
          icon: 'ScrollText',
          title: 'Policies',
          description: 'Governance policies with their lifecycle status.',
        },
        {
          icon: 'GraduationCap',
          title: 'Trainings',
          description: 'AI training programs and their completion status.',
        },
        {
          icon: 'AlertCircle',
          title: 'Incidents',
          description: 'AI-related incidents with resolution status.',
        },
        {
          icon: 'Users',
          title: 'Users',
          description: 'Team members with access to the platform.',
        },
        {
          icon: 'FileText',
          title: 'Evidence',
          description: 'Documents and evidence files uploaded to the system.',
        },
        {
          icon: 'BarChart3',
          title: 'Reports',
          description: 'Generated governance and compliance reports.',
        },
      ],
    },
    {
      type: 'heading',
      id: 'status-charts',
      level: 2,
      text: 'Status breakdown charts',
    },
    {
      type: 'paragraph',
      text: 'Widgets for entities with status workflows display a donut chart showing how items are distributed across different statuses. This visual breakdown helps you quickly understand the health of each area:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Models', text: 'Shows distribution across lifecycle stages like Development, Testing, Production, and Retired' },
        { bold: 'Vendors', text: 'Displays vendor assessment status such as Pending review, Approved, Requires attention' },
        { bold: 'Vendor risks', text: 'Shows risk severity levels including Critical, High, Medium, Low' },
        { bold: 'Policies', text: 'Displays lifecycle status like Draft, Under review, Published, Archived' },
        { bold: 'Trainings', text: 'Shows completion status: Planned, In progress, Completed' },
        { bold: 'Incidents', text: 'Displays resolution status such as Open, Investigating, Resolved' },
      ],
    },
    {
      type: 'heading',
      id: 'priority-indicators',
      level: 2,
      text: 'Priority indicators',
    },
    {
      type: 'paragraph',
      text: 'Widgets automatically highlight items that may need immediate attention. Visual cues help you prioritize your work:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'High priority', text: 'Red highlight indicates critical items requiring immediate attention, such as critical vendor risks or overdue policies' },
        { bold: 'Medium priority', text: 'Amber highlight indicates items that need attention soon but are not urgent' },
        { bold: 'Quick actions', text: 'Some widgets display action buttons to help you address priority items directly from the dashboard' },
      ],
    },
    {
      type: 'heading',
      id: 'customizing-layout',
      level: 2,
      text: 'Customizing the dashboard layout',
    },
    {
      type: 'paragraph',
      text: 'You can personalize the dashboard to match your workflow by rearranging widgets and choosing which ones to display.',
    },
    {
      type: 'heading',
      id: 'edit-mode',
      level: 3,
      text: 'Entering edit mode',
    },
    {
      type: 'paragraph',
      text: 'To customize your dashboard:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Click the lock icon in the top right corner of the dashboard' },
        { text: 'The icon changes to an unlocked state, indicating edit mode is active' },
        { text: 'A "Show/hide cards" selector appears next to the lock icon' },
        { text: 'Make your changes (drag, resize, or hide widgets)' },
        { text: 'Click the lock icon again to save your layout and exit edit mode' },
      ],
    },
    {
      type: 'image',
      src: '/images/user-guide/dashboard-edit-mode.png',
      alt: 'Dashboard in edit mode showing the Show/hide cards dropdown menu with checkboxes for each widget type',
      caption: 'Use the Show/hide cards menu to control which widgets appear on your dashboard.',
    },
    {
      type: 'heading',
      id: 'rearranging-widgets',
      level: 3,
      text: 'Rearranging widgets',
    },
    {
      type: 'paragraph',
      text: 'While in edit mode, you can drag widgets to reposition them:',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Click and hold the widget header (the grip icon appears when in edit mode)' },
        { text: 'Drag the widget to your desired position' },
        { text: 'Other widgets automatically rearrange to accommodate the new position' },
        { text: 'Release to drop the widget in place' },
      ],
    },
    {
      type: 'heading',
      id: 'resizing-widgets',
      level: 3,
      text: 'Resizing widgets',
    },
    {
      type: 'paragraph',
      text: 'Some widgets can be resized while in edit mode:',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Drag any edge or corner of a widget to resize it' },
        { text: 'Widgets snap to a grid for consistent alignment' },
        { text: 'Some widgets have fixed sizes and cannot be resized (Use cases, Users, Evidence, Reports)' },
        { text: 'Widgets with status charts can be made larger to show more detail' },
      ],
    },
    {
      type: 'heading',
      id: 'showing-hiding',
      level: 3,
      text: 'Showing and hiding widgets',
    },
    {
      type: 'paragraph',
      text: 'Use the "Show/hide cards" selector to control which widgets appear:',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'Click the "Show/hide cards" dropdown that appears in edit mode' },
        { text: 'Check or uncheck widgets to show or hide them' },
        { text: 'Hidden widgets are removed from the dashboard but can be restored at any time' },
        { text: 'If you hide all widgets, a prompt appears to help you restore them' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Your dashboard layout is automatically saved and will be restored when you return. Each user has their own personalized layout.',
    },
    {
      type: 'heading',
      id: 'navigating',
      level: 2,
      text: 'Navigating from the dashboard',
    },
    {
      type: 'paragraph',
      text: 'Each widget is clickable and takes you directly to the corresponding section of the platform:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Use cases', text: 'Opens the use cases overview page' },
        { bold: 'Models', text: 'Opens the model inventory' },
        { bold: 'Vendors', text: 'Opens the vendor management page' },
        { bold: 'Vendor risks', text: 'Opens the vendor risks view' },
        { bold: 'Policies', text: 'Opens the policy manager' },
        { bold: 'Trainings', text: 'Opens the training registry' },
        { bold: 'Incidents', text: 'Opens incident management' },
        { bold: 'Users', text: 'Opens organization settings' },
        { bold: 'Evidence', text: 'Opens the file manager' },
        { bold: 'Reports', text: 'Opens the reporting section' },
      ],
    },
    {
      type: 'heading',
      id: 'add-new',
      level: 2,
      text: 'Quick add from dashboard',
    },
    {
      type: 'paragraph',
      text: 'The "Add new" dropdown in the top right corner provides quick access to create new items without leaving the dashboard. Use this to quickly add new use cases, models, vendors, policies, or other entities.',
    },
    {
      type: 'heading',
      id: 'first-login',
      level: 2,
      text: 'First login experience',
    },
    {
      type: 'paragraph',
      text: 'When you first log in to VerifyWise, you may be prompted to confirm or update your organization name. This ensures your governance documentation and reports display the correct organization identifier.',
    },
    {
      type: 'heading',
      id: 'faq',
      level: 2,
      text: 'Frequently asked questions',
    },
    {
      type: 'heading',
      id: 'faq-reset-layout',
      level: 3,
      text: 'How do I reset my dashboard to the default layout?',
    },
    {
      type: 'paragraph',
      text: 'To reset your dashboard, enter edit mode and use the "Show/hide cards" selector to hide all widgets. Then click the link to restore all cards, which resets them to the default layout. Alternatively, you can clear your browser\'s local storage for the VerifyWise site.',
    },
    {
      type: 'heading',
      id: 'faq-shared-layout',
      level: 3,
      text: 'Is the dashboard layout shared across my team?',
    },
    {
      type: 'paragraph',
      text: 'No, each user has their own personalized dashboard layout. Changes you make only affect your view and are saved in your browser. Other team members see their own customized layout.',
    },
    {
      type: 'heading',
      id: 'faq-data-real-time',
      level: 3,
      text: 'How current is the data on the dashboard?',
    },
    {
      type: 'paragraph',
      text: 'Dashboard data is fetched when you load the page and reflects the current state of your governance program. To see the latest data, refresh the page. Changes you make elsewhere in the platform will appear on the dashboard when you next visit or refresh it.',
    },
    {
      type: 'heading',
      id: 'faq-mobile',
      level: 3,
      text: 'Does the dashboard work on mobile devices?',
    },
    {
      type: 'paragraph',
      text: 'The dashboard is responsive and adapts to different screen sizes. On smaller screens, widgets automatically rearrange into a single-column layout for easier viewing. Full customization features are best accessed on larger screens.',
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'reporting',
          articleId: 'generating-reports',
          title: 'Generating reports',
          description: 'Create governance and compliance reports',
        },
        {
          collectionId: 'getting-started',
          articleId: 'quick-start',
          title: 'Quick start guide',
          description: 'Get started with VerifyWise',
        },
      ],
    },
  ],
};
