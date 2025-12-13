import type { ArticleContent } from '@User-guide-content/contentTypes';

export const modelInventoryContent: ArticleContent = {
  blocks: [
    {
      type: 'heading',
      id: 'overview',
      level: 2,
      text: 'Overview',
    },
    {
      type: 'paragraph',
      text: 'A model inventory is a comprehensive catalog of all AI models and systems used within your organization. Just as financial assets require tracking for accounting and compliance, AI models require similar oversight to ensure proper governance, risk management, and regulatory compliance.',
    },
    {
      type: 'paragraph',
      text: 'Without a centralized inventory, organizations often lose track of which AI models are in use, who is responsible for them, and what data they process. This lack of visibility creates compliance risks, security blind spots, and operational inefficiencies. A well-maintained inventory answers fundamental questions: What AI do we have? Where is it deployed? Who owns it? What risks does it present?',
    },
    {
      type: 'heading',
      id: 'why-inventory',
      level: 2,
      text: 'Why maintain a model inventory?',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Regulatory compliance', text: 'The EU AI Act and other regulations require organizations to maintain records of AI systems, especially high-risk applications' },
        { bold: 'Risk visibility', text: 'You cannot manage risks you do not know exist. An inventory surfaces all AI systems for risk assessment' },
        { bold: 'Accountability', text: 'Clear ownership ensures someone is responsible for each model\'s performance, compliance, and maintenance' },
        { bold: 'Audit readiness', text: 'When auditors or regulators ask about your AI use, you can provide immediate, accurate answers' },
        { bold: 'Resource planning', text: 'Understanding your AI landscape helps allocate governance resources where they matter most' },
      ],
    },
    {
      type: 'callout',
      variant: 'info',
      text: 'Maintaining an accurate model inventory is a core requirement for EU AI Act compliance and ISO 42001 certification. VerifyWise automatically tracks changes to your inventory for audit purposes.',
    },
    {
      type: 'heading',
      id: 'accessing-inventory',
      level: 2,
      text: 'Accessing the model inventory',
    },
    {
      type: 'paragraph',
      text: 'Navigate to **Model inventory** from the main sidebar. The inventory displays all registered models in a searchable table with filtering options for status, provider, and other attributes.',
    },
    {
      type: 'image',
      src: '/images/user-guide/model-inventory.png',
      alt: 'Model inventory page showing status cards for Approved, Restricted, Pending, and Blocked models, plus a table listing models with provider, version, approver, and security assessment columns',
      caption: 'The model inventory provides a centralized view of all AI models in your organization.',
    },
    {
      type: 'heading',
      id: 'registering-model',
      level: 2,
      text: 'Registering a new model',
    },
    {
      type: 'paragraph',
      text: 'To add a new AI model to your inventory, click the **Add model** button and provide the required information:',
    },
    {
      type: 'ordered-list',
      items: [
        { bold: 'Provider', text: '— The organization or service that provides the model (e.g., OpenAI, Anthropic, internal team)' },
        { bold: 'Model name', text: '— The specific model identifier (e.g., GPT-4, Claude 3, custom-classifier-v2)' },
        { bold: 'Version', text: '— The version number or release identifier' },
        { bold: 'Approver', text: '— The person responsible for approving this model for use' },
      ],
    },
    {
      type: 'image',
      src: '/images/user-guide/add-new-model.png',
      alt: 'Add a new model form with fields for provider, model name, version, approver, status, capabilities, use cases, frameworks, reference link, biases, hosting provider, and limitations',
      caption: 'The model registration form captures comprehensive metadata for governance tracking.',
    },
    {
      type: 'heading',
      id: 'model-attributes',
      level: 2,
      text: 'Model attributes',
    },
    {
      type: 'paragraph',
      text: 'Each model in your inventory can include detailed attributes to support governance and risk assessment:',
    },
    {
      type: 'grid-cards',
      columns: 2,
      items: [
        { icon: 'Brain', title: 'Capabilities', description: 'Document what the model can do — text generation, classification, image analysis, etc.' },
        { icon: 'AlertTriangle', title: 'Known biases', description: 'Record any identified biases or fairness concerns with the model' },
        { icon: 'Info', title: 'Limitations', description: 'Document constraints and scenarios where the model should not be used' },
        { icon: 'Server', title: 'Hosting provider', description: 'Where the model is hosted — cloud provider, on-premises, or hybrid' },
      ],
    },
    {
      type: 'heading',
      id: 'approval-status',
      level: 2,
      text: 'Approval status',
    },
    {
      type: 'paragraph',
      text: 'Every model in the inventory has an approval status that controls whether it can be used in your organization:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Pending', text: 'Model is awaiting review and approval before use' },
        { bold: 'Approved', text: 'Model has been reviewed and authorized for production use' },
        { bold: 'Restricted', text: 'Model is approved for limited use cases or specific projects only' },
        { bold: 'Blocked', text: 'Model is not authorized for use in the organization' },
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Best practice',
      text: 'Establish clear criteria for each approval status in your AI governance policy. This ensures consistent decision-making when evaluating new models.',
    },
    {
      type: 'heading',
      id: 'security-assessment',
      level: 2,
      text: 'Security assessment',
    },
    {
      type: 'paragraph',
      text: 'Models can be flagged as having completed a security assessment. When enabled, you can attach security assessment documentation directly to the model record for easy reference during audits.',
    },
    {
      type: 'heading',
      id: 'linking-evidence',
      level: 2,
      text: 'Linking evidence',
    },
    {
      type: 'paragraph',
      text: 'The model inventory integrates with the Evidence Hub, allowing you to link supporting documentation to each model:',
    },
    {
      type: 'checklist',
      items: [
        'Model cards and technical documentation',
        'Vendor contracts and data processing agreements',
        'Security assessment reports',
        'Bias testing results and fairness evaluations',
        'Performance benchmarks and validation studies',
      ],
    },
    {
      type: 'heading',
      id: 'mlflow-integration',
      level: 2,
      text: 'MLFlow integration',
    },
    {
      type: 'paragraph',
      text: 'For organizations using MLFlow for ML operations, VerifyWise can import model training data directly. This provides visibility into model development metrics including training timestamps, parameters, and lifecycle stages.',
    },
    {
      type: 'heading',
      id: 'change-history',
      level: 2,
      text: 'Change history',
    },
    {
      type: 'paragraph',
      text: 'VerifyWise automatically maintains a complete audit trail for every model in your inventory. Each change records:',
    },
    {
      type: 'bullet-list',
      items: [
        { text: 'The field that was modified' },
        { text: 'Previous and new values' },
        { text: 'Who made the change' },
        { text: 'When the change occurred' },
      ],
    },
    {
      type: 'paragraph',
      text: 'This history is essential for demonstrating governance practices during compliance audits and regulatory reviews.',
    },
    {
      type: 'article-links',
      title: 'Related articles',
      items: [
        {
          collectionId: 'ai-governance',
          articleId: 'model-lifecycle',
          title: 'Model lifecycle management',
          description: 'Learn how to track models from development through retirement',
        },
        {
          collectionId: 'ai-governance',
          articleId: 'evidence-collection',
          title: 'Evidence collection',
          description: 'Organize documentation for compliance and audits',
        },
        {
          collectionId: 'risk-management',
          articleId: 'risk-assessment',
          title: 'Conducting risk assessments',
          description: 'Evaluate risks associated with your AI models',
        },
      ],
    },
  ],
};
