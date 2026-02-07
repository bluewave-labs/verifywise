import type { ArticleContent } from '../../contentTypes';

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
      type: 'heading',
      id: 'datasets',
      level: 2,
      text: 'Datasets',
    },
    {
      type: 'paragraph',
      text: 'The datasets tab within model inventory allows you to catalog and manage the data used for training, validating, and testing your AI models. Proper dataset management is essential for AI governance — understanding what data feeds your models helps ensure compliance, identify potential biases, and maintain data quality standards.',
    },
    {
      type: 'heading',
      id: 'accessing-datasets',
      level: 3,
      text: 'Accessing datasets',
    },
    {
      type: 'paragraph',
      text: 'Navigate to **Model inventory** from the main sidebar, then select the **Datasets** tab. The datasets view displays all registered datasets in a searchable table with status summary cards at the top.',
    },
    {
      type: 'heading',
      id: 'adding-dataset',
      level: 3,
      text: 'Adding a new dataset',
    },
    {
      type: 'paragraph',
      text: 'To add a new dataset to your inventory, click the **Add new dataset** button and provide the required information:',
    },
    {
      type: 'ordered-list',
      items: [
        { bold: 'Name', text: '— A descriptive name for the dataset' },
        { bold: 'Description', text: '— Detailed explanation of what the dataset contains and its intended use' },
        { bold: 'Version', text: '— The version identifier for tracking dataset iterations' },
        { bold: 'Owner', text: '— The person or team responsible for maintaining the dataset' },
        { bold: 'Type', text: '— The purpose of the dataset (training, validation, testing, production, or reference)' },
        { bold: 'Function', text: '— The dataset\'s role in AI model development' },
        { bold: 'Source', text: '— Where the data originated from' },
        { bold: 'Classification', text: '— The sensitivity level of the data' },
        { bold: 'Status', text: '— The current lifecycle stage of the dataset' },
        { bold: 'Status date', text: '— When the current status was set' },
      ],
    },
    {
      type: 'heading',
      id: 'dataset-types',
      level: 3,
      text: 'Dataset types',
    },
    {
      type: 'paragraph',
      text: 'Datasets can be categorized by their purpose in the machine learning lifecycle:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Training', text: 'Data used to train the model and learn patterns' },
        { bold: 'Validation', text: 'Data used to tune hyperparameters and prevent overfitting during training' },
        { bold: 'Testing', text: 'Data used to evaluate final model performance before deployment' },
        { bold: 'Production', text: 'Data that the deployed model processes in live environments' },
        { bold: 'Reference', text: 'Baseline or benchmark data used for comparison' },
      ],
    },
    {
      type: 'heading',
      id: 'data-classification',
      level: 3,
      text: 'Data classification',
    },
    {
      type: 'paragraph',
      text: 'Each dataset should be classified according to its sensitivity level:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Public', text: 'Data that can be freely shared without restrictions' },
        { bold: 'Internal', text: 'Data intended for use within the organization only' },
        { bold: 'Confidential', text: 'Sensitive data requiring access controls and handling procedures' },
        { bold: 'Restricted', text: 'Highly sensitive data with strict access limitations and regulatory requirements' },
      ],
    },
    {
      type: 'callout',
      variant: 'warning',
      title: 'PII handling',
      text: 'When a dataset contains personally identifiable information (PII), mark it accordingly and document the specific types of PII present. This is critical for GDPR, CCPA, and other privacy regulation compliance.',
    },
    {
      type: 'heading',
      id: 'dataset-status',
      level: 3,
      text: 'Dataset status',
    },
    {
      type: 'paragraph',
      text: 'Every dataset has a status indicating its current lifecycle stage:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'Draft', text: 'Dataset is being prepared or documented but not yet ready for use' },
        { bold: 'Active', text: 'Dataset is approved and currently in use for model development or production' },
        { bold: 'Deprecated', text: 'Dataset is no longer recommended for new use but may still be referenced by existing models' },
        { bold: 'Archived', text: 'Dataset is retained for historical purposes but not available for active use' },
      ],
    },
    {
      type: 'heading',
      id: 'dataset-attributes',
      level: 3,
      text: 'Dataset attributes',
    },
    {
      type: 'paragraph',
      text: 'Each dataset can include additional attributes to support governance and data quality:',
    },
    {
      type: 'grid-cards',
      columns: 2,
      items: [
        { icon: 'AlertTriangle', title: 'Known biases', description: 'Document any identified biases in the data that could affect model outcomes' },
        { icon: 'Shield', title: 'Bias mitigation', description: 'Record steps taken to identify, measure, and reduce bias in the dataset' },
        { icon: 'Database', title: 'Collection method', description: 'Describe how the data was gathered — surveys, scraping, APIs, manual entry, etc.' },
        { icon: 'Settings', title: 'Preprocessing steps', description: 'Document transformations, cleaning, and normalization applied to the raw data' },
      ],
    },
    {
      type: 'heading',
      id: 'linking-datasets',
      level: 3,
      text: 'Linking datasets to models',
    },
    {
      type: 'paragraph',
      text: 'When creating or editing a dataset, you can link it to one or more models in your inventory. This creates traceability between your data assets and the AI systems that use them — essential for impact assessments and understanding how data issues might propagate through your AI portfolio.',
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'Best practice',
      text: 'Link every training and validation dataset to its corresponding models. When data quality issues are discovered, you can quickly identify all affected models.',
    },
    {
      type: 'heading',
      id: 'linking-projects',
      level: 3,
      text: 'Linking datasets to use cases',
    },
    {
      type: 'paragraph',
      text: 'In addition to models, datasets can be linked to specific use cases (projects) in your organization. This helps maintain a clear view of which data supports which business applications, supporting both governance oversight and impact analysis.',
    },
    {
      type: 'heading',
      id: 'optional-fields',
      level: 3,
      text: 'Optional fields',
    },
    {
      type: 'paragraph',
      text: 'Beyond the required fields, you can document additional metadata to enhance governance:',
    },
    {
      type: 'bullet-list',
      items: [
        { bold: 'License', text: 'The licensing terms governing data use (e.g., CC BY 4.0, MIT, proprietary)' },
        { bold: 'Format', text: 'The data format (e.g., CSV, JSON, Parquet)' },
        { bold: 'PII types', text: 'Specific types of personally identifiable information when PII is present' },
      ],
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
