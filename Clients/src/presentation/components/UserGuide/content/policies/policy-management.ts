import type { ArticleContent } from '@user-guide-content/contentTypes';

export const policyManagementContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'The Policy Manager in VerifyWise helps you create, organize, and maintain AI governance policies for your organization. Well-documented policies are the foundation of effective AI governance, demonstrating your commitment to responsible AI and ensuring consistent practices across teams.',
    },
    {
      type: 'paragraph',
      text: 'Policies in VerifyWise can be created from scratch or built from pre-designed templates covering common AI governance topics. Each policy tracks its status through a defined lifecycle, from initial draft through review and approval to publication.',
    },
    {
      type: 'heading',
      id: 'why-policies',
      level: 2,
      text: 'Why manage AI policies?',
    },
    {
      type: 'paragraph',
      text: 'AI systems introduce unique governance challenges that traditional corporate policies may not address. From algorithmic bias to data privacy, from model transparency to human oversight, organizations need clear policies that define how AI should be developed, deployed, and monitored. Without documented policies, teams make inconsistent decisions, risks go unmanaged, and regulatory compliance becomes difficult to demonstrate.',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Regulatory compliance', text: 'Many AI regulations require documented policies covering AI development, deployment, and monitoring' },
        { bold: 'Consistent practices', text: 'Ensure all teams follow the same standards for AI development and use' },
        { bold: 'Risk management', text: 'Define acceptable uses, prohibited practices, and risk thresholds for AI systems' },
        { bold: 'Audit readiness', text: 'Demonstrate governance controls to auditors and regulators with documented policies' },
        { bold: 'Stakeholder trust', text: 'Show customers, partners, and the public that you take AI governance seriously' },
        { bold: 'Training foundation', text: 'Provide clear guidance that teams can reference and learn from' },
      ],
    },
    {
      type: 'heading',
      id: 'policy-manager-screen',
      level: 2,
      text: 'The policy manager screen',
    },
    {
      type: 'paragraph',
      text: 'The Policy Manager has two main tabs for organizing your work:',
    },
    {
      type: 'icon-cards',
      items: [
        {
          icon: 'Shield',
          title: 'Organizational policies',
          description: 'Your organization\'s custom policies. Create, edit, and manage policies that define your AI governance standards.',
        },
        {
          icon: 'FileText',
          title: 'Policy templates',
          description: 'Pre-built templates covering common AI governance topics. Use templates as starting points for your own policies.',
        },
      ],
    },
    {
      type: 'heading',
      id: 'status-cards',
      level: 2,
      text: 'Policy status overview',
    },
    {
      type: 'paragraph',
      text: 'At the top of the organizational policies tab, status cards show the distribution of your policies across each lifecycle stage:',
    },
    {
      type: 'checklist',
      items: [
        'Draft — Policies being written or edited, not yet ready for review',
        'Under review — Policies submitted for stakeholder review',
        'Approved — Policies that have passed review and are ready for publication',
        'Published — Active policies that apply to your organization',
        'Archived — Older policies retained for reference but no longer active',
        'Deprecated — Policies that have been superseded or are no longer relevant',
      ],
    },
    {
      type: 'image',
      src: '/images/user-guide/policy-manager.png',
      alt: 'Policy Manager page showing status cards for Draft, Under Review, Approved, Published, Archived, and Deprecated policies, along with a table listing organizational policies with their status, tags, next review date, and author',
      caption: 'The Policy Manager provides an overview of all organizational policies and their current status.',
    },
    {
      type: 'heading',
      id: 'creating-policy',
      level: 2,
      text: 'Creating a policy',
    },
    {
      type: 'paragraph',
      text: 'To create a new policy:',
    },
    {
      type: 'ordered-list',
      items: [
        { text: 'Click "Add new policy" in the organizational policies tab' },
        { text: 'Enter a title that clearly describes the policy\'s purpose' },
        { text: 'Write or paste the policy content using the rich text editor' },
        { text: 'Select relevant tags to categorize the policy' },
        { text: 'Set the initial status (typically Draft)' },
        { text: 'Optionally set a next review date' },
        { text: 'Save the policy' },
      ],
    },
    {
      type: 'image',
      src: '/images/user-guide/create-policy.png',
      alt: 'Create new policy modal with fields for policy title, next review date, status, team members, tags, and a rich text editor for policy content',
      caption: 'The policy creation form allows you to write or paste policy content with rich text formatting.',
    },
    {
      type: 'heading',
      id: 'policy-fields',
      level: 2,
      text: 'Policy fields',
    },
    {
      type: 'paragraph',
      text: 'Each policy includes the following information:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Title', text: 'A clear, descriptive name for the policy' },
        { bold: 'Content', text: 'The full policy text with rich formatting support' },
        { bold: 'Status', text: 'Current lifecycle stage (Draft, Under review, Approved, Published, Archived, Deprecated)' },
        { bold: 'Tags', text: 'Categories like AI ethics, Privacy, Security, EU AI Act, ISO 42001, etc.' },
        { bold: 'Next review date', text: 'When the policy should be reviewed for updates' },
        { bold: 'Author', text: 'The person who created the policy' },
        { bold: 'Last updated', text: 'When the policy was most recently modified' },
        { bold: 'Updated by', text: 'Who made the most recent changes' },
      ],
    },
    {
      type: 'heading',
      id: 'available-tags',
      level: 2,
      text: 'Available policy tags',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise provides predefined tags to help categorize your policies:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Governance topics', text: 'AI ethics, Fairness, Transparency, Explainability, Bias mitigation, Accountability, Human oversight' },
        { bold: 'Technical areas', text: 'Privacy, Data governance, Model risk, Security, LLM, Red teaming, Monitoring' },
        { bold: 'Compliance frameworks', text: 'EU AI Act, ISO 42001, NIST RMF, Audit, Vendor management' },
      ],
    },
    {
      type: 'heading',
      id: 'filtering-searching',
      level: 2,
      text: 'Filtering and searching',
    },
    {
      type: 'paragraph',
      text: 'The policy manager provides several ways to find specific policies:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Filter', text: 'Filter by title, status, author, or next review date' },
        { bold: 'Group by', text: 'Group policies by status or author for easier navigation' },
        { bold: 'Search', text: 'Search for policies by title' },
      ],
    },
    {
      type: 'heading',
      id: 'editing-deleting',
      level: 2,
      text: 'Editing and deleting policies',
    },
    {
      type: 'paragraph',
      text: 'To edit a policy, click on it in the table to open the detail view. Make your changes and save. The last updated timestamp and updated by fields will be automatically recorded.',
    },
    {
      type: 'paragraph',
      text: 'To delete a policy, use the delete action in the policy table. Deleted policies cannot be recovered, so consider archiving policies instead if you may need to reference them later.',
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Best practice',
      text: 'Instead of deleting outdated policies, change their status to Archived or Deprecated. This preserves the historical record and helps demonstrate how your governance has evolved.',
    },
    {
      type: 'heading',
      id: 'faq',
      level: 2,
      text: 'Frequently asked questions',
    },
    {
      type: 'heading',
      id: 'faq-existing',
      level: 3,
      text: 'Can we use our existing corporate policies?',
    },
    {
      type: 'paragraph',
      text: 'Yes. You can paste existing policy content into VerifyWise to centralize your AI governance documentation. Many organizations start by importing their current policies, then use VerifyWise to track their status, schedule reviews, and maintain a single source of truth for AI governance.',
    },
    {
      type: 'heading',
      id: 'faq-corporate-vs-ai',
      level: 3,
      text: 'How do AI policies relate to general corporate policies?',
    },
    {
      type: 'paragraph',
      text: 'AI policies should complement your existing corporate policies, not replace them. Your general data protection, information security, and ethics policies still apply. AI-specific policies address the unique challenges of AI systems, such as model transparency, algorithmic fairness, and automated decision-making. Reference your corporate policies where applicable and focus AI policies on what is different about AI.',
    },
    {
      type: 'heading',
      id: 'faq-how-many',
      level: 3,
      text: 'How many policies do we need?',
    },
    {
      type: 'paragraph',
      text: 'Start with the policies required by your regulatory environment and add others based on your risk assessment. Most organizations need at minimum an AI ethics policy, a model development policy, and a data governance policy for AI. Use the policy templates as a guide for what topics to cover, but do not create policies just to check a box. Each policy should address a real governance need.',
    },
    {
      type: 'heading',
      id: 'faq-who-writes',
      level: 3,
      text: 'Who should write AI policies?',
    },
    {
      type: 'paragraph',
      text: 'Policy development typically involves collaboration between technical teams who understand AI systems, legal and compliance teams who understand regulatory requirements, and business stakeholders who understand operational needs. Assign a policy owner responsible for drafting and maintaining each policy, with input from relevant subject matter experts.',
    },
    {
      type: 'heading',
      id: 'faq-review-frequency',
      level: 3,
      text: 'How often should policies be reviewed?',
    },
    {
      type: 'paragraph',
      text: 'Review policies at least annually, or more frequently for rapidly evolving areas. AI regulations and best practices are still developing, so policies may need more frequent updates than traditional corporate policies. Set review dates when you publish a policy and use VerifyWise to track when reviews are due.',
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'policies',
          articleId: 'policy-versioning',
          title: 'Policy lifecycle',
          description: 'Understand the policy status workflow',
        },
        {
          collectionId: 'policies',
          articleId: 'policy-approval',
          title: 'Policy templates',
          description: 'Use pre-built templates for common policies',
        },
      ],
    },
  ],
};
