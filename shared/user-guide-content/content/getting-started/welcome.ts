import type { ArticleContent } from '../../contentTypes';

export const welcomeContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'what-is-verifywise',
      level: 2,
      text: 'What is VerifyWise?',
    },
    {
      type: 'paragraph',
      text: "VerifyWise is an enterprise-ready AI governance platform that helps organizations manage AI systems safely and responsibly. Whether you're tracking AI models, managing compliance with regulations like the EU AI Act, or monitoring vendor risks, VerifyWise provides the tools you need to bring order to your AI governance program.",
    },
    {
      type: 'paragraph',
      text: 'The platform is designed to be deployed on-premises or in your private cloud environment, giving you complete control over your data and infrastructure. This approach ensures your sensitive AI governance information stays within your security perimeter.',
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'VerifyWise is source-available software, which means you can review the code, deploy it internally, and maintain full visibility into how your governance platform operates.',
    },
    {
      type: 'heading',
      id: 'core-capabilities',
      level: 2,
      text: 'Core capabilities',
    },
    {
      type: 'paragraph',
      text: "VerifyWise centralizes your AI governance activities in one platform. Here's what you can accomplish:",
    },
    {
      type: 'icon-cards',
      items: [
        {
          icon: 'Brain',
          title: 'AI model management',
          description: 'Register and track all AI systems across your organization. Monitor model lifecycle from development through deployment and retirement.',
        },
        {
          icon: 'AlertTriangle',
          title: 'Risk assessment',
          description: 'Identify, evaluate, and document risks associated with your AI systems. Track mitigations, approvals, and residual risk levels.',
        },
        {
          icon: 'Shield',
          title: 'Compliance tracking',
          description: 'Stay aligned with regulatory requirements. Map controls to frameworks and maintain audit-ready documentation.',
        },
        {
          icon: 'Rocket',
          title: 'Vendor oversight',
          description: 'Monitor third-party AI vendors, track agreements and renewals, and conduct due diligence activities.',
        },
      ],
    },
    {
      type: 'heading',
      id: 'supported-frameworks',
      level: 2,
      text: 'Supported compliance frameworks',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise provides built-in support for major AI governance and information security frameworks:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'EU AI Act', text: 'Navigate the requirements of European AI regulation with pre-built controls and assessment templates' },
        { bold: 'ISO 42001', text: 'Prepare for AI management system certification with structured documentation and evidence collection' },
        { bold: 'ISO 27001', text: 'Align AI governance with information security standards' },
        { bold: 'NIST AI RMF', text: 'Implement the NIST AI Risk Management Framework with guided workflows' },
      ],
    },
    {
      type: 'heading',
      id: 'key-features',
      level: 2,
      text: 'Key features',
    },
    {
      type: 'paragraph',
      text: 'Beyond core governance capabilities, VerifyWise includes features designed to streamline your workflow:',
    },
    {
      type: 'checklist',
      items: [
        'Policy manager for creating, versioning, and tracking internal AI policies',
        'Evidence center for centralizing compliance documentation',
        'AI trust center for public-facing transparency reporting',
        'Training registry to track staff completion and acknowledgments',
        'Incident management for recording AI incidents and corrective actions',
        'Role-based access control (RBAC) for secure team collaboration',
        'Event logging and audit trails for accountability',
        'Integrations with Slack, MLFlow, and custom webhooks',
      ],
    },
    {
      type: 'heading',
      id: 'deployment-options',
      level: 2,
      text: 'Deployment options',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise is designed for flexible deployment to match your infrastructure requirements:',
    },
    {
      type: 'grid-cards',
      items: [
        { title: 'Docker', description: 'Quick setup with containerized deployment' },
        { title: 'Kubernetes', description: 'Scalable orchestration for enterprise environments' },
        { title: 'Cloud platforms', description: 'Deploy on render.com, AWS, GCP, or Azure' },
      ],
    },
    {
      type: 'paragraph',
      text: 'The platform uses PostgreSQL for data storage and supports authentication via Google OAuth2 and Microsoft Entra ID.',
    },
    {
      type: 'heading',
      id: 'next-steps',
      level: 2,
      text: 'Next steps',
    },
    {
      type: 'paragraph',
      text: "Ready to get started? Here's what we recommend:",
    },
    {
      type: 'ordered-list',
      items: [
        { bold: 'Install VerifyWise', text: '— Follow our installation guide to deploy the platform in your environment' },
        { bold: 'Explore the dashboard', text: '— Learn how to navigate the interface and find what you need' },
        { bold: 'Complete the quick start', text: '— Get your first AI use case configured in under 10 minutes' },
      ],
    },
    {
      type: 'article-links',
      title: 'Continue reading',
      items: [
        {
          collectionId: 'getting-started',
          articleId: 'installing',
          title: 'Installing VerifyWise',
          description: 'Deploy the platform in your environment with Docker or Kubernetes',
        },
        {
          collectionId: 'getting-started',
          articleId: 'dashboard',
          title: 'Understanding the dashboard',
          description: 'Learn how to navigate the interface and find what you need',
        },
        {
          collectionId: 'getting-started',
          articleId: 'quick-start',
          title: 'Quick start guide',
          description: 'Get your first AI use case configured in under 10 minutes',
        },
      ],
    },
  ],
};
