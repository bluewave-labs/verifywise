import type { ArticleContent } from '@User-guide-content/contentTypes';

export const modelLifecycleContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'AI model lifecycle management is the practice of governing AI systems from conception through retirement. Unlike traditional software that may remain stable for years, AI models require continuous attention — they can degrade over time, their training data may become outdated, and their real-world performance may drift from initial expectations.',
    },
    {
      type: 'paragraph',
      text: 'Understanding where each model sits in its lifecycle is essential for effective governance. A model in development requires different oversight than one in production. A model being retired needs careful attention to ensure continuity. By tracking lifecycle phases, you can apply the right controls at the right time.',
    },
    {
      type: 'heading',
      id: 'why-lifecycle',
      level: 2,
      text: 'Why track model lifecycle?',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Right-sized governance', text: 'Apply controls appropriate to each phase — development needs flexibility, production needs stability' },
        { bold: 'Risk awareness', text: 'Each phase introduces different risks that require different mitigation strategies' },
        { bold: 'Resource allocation', text: 'Focus monitoring and maintenance resources on models that need them most' },
        { bold: 'Compliance evidence', text: 'Document the journey of each model for regulatory audits and reviews' },
        { bold: 'Retirement planning', text: 'Ensure orderly transitions when models are replaced or decommissioned' },
      ],
    },
    {
      type: 'heading',
      id: 'lifecycle-phases',
      level: 2,
      text: 'Lifecycle phases',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise recognizes the following phases in the AI model lifecycle, aligned with industry standards and regulatory expectations:',
    },
    {
      type: 'icon-cards',
      items: [
        {
          icon: 'FileText',
          title: 'Problem definition and planning',
          description: 'Initial scoping, requirements gathering, and project planning before development begins.',
        },
        {
          icon: 'Database',
          title: 'Data collection and processing',
          description: 'Gathering, cleaning, and preparing training data with appropriate data governance.',
        },
        {
          icon: 'Brain',
          title: 'Model development and training',
          description: 'Building, training, and iterating on model architecture and parameters.',
        },
        {
          icon: 'CheckCircle',
          title: 'Model validation and testing',
          description: 'Evaluating model performance, fairness, and safety before deployment.',
        },
        {
          icon: 'Rocket',
          title: 'Deployment and integration',
          description: 'Moving models into production environments and integrating with business processes.',
        },
        {
          icon: 'Gauge',
          title: 'Monitoring and maintenance',
          description: 'Ongoing observation of model performance, drift detection, and updates.',
        },
        {
          icon: 'AlertTriangle',
          title: 'Decommissioning and retirement',
          description: 'Safely retiring models and managing the transition to replacement systems.',
        },
      ],
    },
    {
      type: 'heading',
      id: 'project-status',
      level: 2,
      text: 'Project status tracking',
    },
    {
      type: 'paragraph',
      text: 'Each AI project in VerifyWise has a status that indicates its current state in the governance workflow:',
    },
    {
      type: 'table',
      columns: [
        { key: 'status', label: 'Status', width: '1fr' },
        { key: 'description', label: 'Description', width: '2fr' },
        { key: 'next', label: 'Typical next step', width: '1.5fr' },
      ],
      rows: [
        { status: 'Not started', description: 'Project has been registered but work has not begun', next: 'Begin development' },
        { status: 'In progress', description: 'Active development or implementation is underway', next: 'Submit for review' },
        { status: 'Under review', description: 'Project is being evaluated for compliance or approval', next: 'Address feedback' },
        { status: 'Completed', description: 'Project has met all requirements and is in production', next: 'Monitor performance' },
        { status: 'On hold', description: 'Work has been temporarily paused', next: 'Resume when ready' },
        { status: 'Closed', description: 'Project has been concluded or archived', next: '—' },
        { status: 'Rejected', description: 'Project did not pass review and will not proceed', next: 'Revise or discontinue' },
      ],
    },
    {
      type: 'heading',
      id: 'model-approval-status',
      level: 2,
      text: 'Model approval status',
    },
    {
      type: 'paragraph',
      text: 'Independent of project status, individual models have their own approval workflow:',
    },
    {
      type: 'table',
      columns: [
        { key: 'status', label: 'Status', width: '120px' },
        { key: 'meaning', label: 'Meaning' },
        { key: 'action', label: 'Typical action' },
      ],
      rows: [
        { status: 'Pending', meaning: 'Awaiting governance review', action: 'Complete risk assessment' },
        { status: 'Approved', meaning: 'Authorized for production use', action: 'Deploy with monitoring' },
        { status: 'Restricted', meaning: 'Limited use cases only', action: 'Document restrictions' },
        { status: 'Blocked', meaning: 'Not authorized for use', action: 'Seek alternative models' },
      ],
    },
    {
      type: 'heading',
      id: 'mlflow-lifecycle',
      level: 2,
      text: 'MLFlow lifecycle integration',
    },
    {
      type: 'paragraph',
      text: 'For teams using MLFlow, VerifyWise imports lifecycle stage information directly from your ML platform:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Staging', text: 'Model is being prepared for production evaluation' },
        { bold: 'Production', text: 'Model is actively serving predictions' },
        { bold: 'Archived', text: 'Model has been retired from active use' },
      ],
    },
    {
      type: 'paragraph',
      text: 'This integration provides visibility into training timestamps, model parameters, and version history without manual data entry.',
    },
    {
      type: 'heading',
      id: 'risk-classification',
      level: 2,
      text: 'AI risk classification',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise supports EU AI Act risk classification for projects, which influences governance requirements throughout the lifecycle:',
    },
    {
      type: 'grid-cards',
      columns: 2,
      items: [
        { icon: 'AlertTriangle', title: 'Prohibited', description: 'AI systems banned under EU AI Act (social scoring, real-time biometric identification in public spaces)' },
        { icon: 'Shield', title: 'High risk', description: 'Systems requiring conformity assessment and ongoing monitoring' },
        { icon: 'Info', title: 'Limited risk', description: 'Systems with transparency obligations (chatbots, emotion recognition)' },
        { icon: 'CheckCircle', title: 'Minimal risk', description: 'Low-risk applications with voluntary code of conduct' },
      ],
    },
    {
      type: 'heading',
      id: 'high-risk-roles',
      level: 2,
      text: 'High-risk system roles',
    },
    {
      type: 'paragraph',
      text: 'For high-risk AI systems, VerifyWise tracks your organization\'s role in the AI value chain, as different roles carry different compliance obligations:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Provider', text: 'Develops or places the AI system on the market' },
        { bold: 'Deployer', text: 'Uses an AI system under their authority' },
        { bold: 'Importer', text: 'Brings AI systems into the EU market' },
        { bold: 'Distributor', text: 'Makes AI systems available on the market' },
        { bold: 'Product manufacturer', text: 'Integrates AI into products under their own name' },
        { bold: 'Authorized representative', text: 'Acts on behalf of a non-EU provider' },
      ],
    },
    {
      type: 'heading',
      id: 'audit-trail',
      level: 2,
      text: 'Lifecycle audit trail',
    },
    {
      type: 'paragraph',
      text: 'All status changes and lifecycle transitions are automatically logged with timestamps and user attribution. This audit trail demonstrates governance oversight and is essential for regulatory compliance.',
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Best practice',
      text: 'Define clear criteria for each lifecycle transition in your AI governance policy. Document who has authority to approve status changes and what evidence is required.',
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'ai-governance',
          articleId: 'model-inventory',
          title: 'Managing model inventory',
          description: 'Register and track AI models across your organization',
        },
        {
          collectionId: 'compliance',
          articleId: 'eu-ai-act',
          title: 'EU AI Act compliance',
          description: 'Navigate European AI regulation requirements',
        },
        {
          collectionId: 'risk-management',
          articleId: 'risk-assessment',
          title: 'Conducting risk assessments',
          description: 'Evaluate risks at each lifecycle stage',
        },
      ],
    },
  ],
};
