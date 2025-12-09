// Icon names as strings - resolved to actual components by the consuming application
export type IconName =
  | 'Rocket'
  | 'Shield'
  | 'AlertTriangle'
  | 'Brain'
  | 'Settings'
  | 'Plug'
  | 'FileText'
  | 'GraduationCap'
  | 'BarChart3'
  | 'FlaskConical'
  | 'Puzzle';

export interface Article {
  id: string;
  title: string;
  description: string;
  keywords: string[];
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  articleCount: number;
  articles: Article[];
}

export interface FastFind {
  id: string;
  title: string;
  collectionId: string;
  articleId: string;
}

// Collections configuration
export const collections: Collection[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    description: 'Learn the basics of VerifyWise and get up and running quickly with your AI governance journey.',
    icon: 'Rocket',
    articleCount: 5,
    articles: [
      {
        id: 'welcome',
        title: 'Welcome to VerifyWise',
        description: 'An introduction to the VerifyWise platform and its core capabilities.',
        keywords: ['welcome', 'introduction', 'overview', 'platform'],
      },
      {
        id: 'installing',
        title: 'Installing VerifyWise',
        description: 'Step-by-step guide to deploy VerifyWise in your environment.',
        keywords: ['install', 'setup', 'deploy', 'docker', 'configuration'],
      },
      {
        id: 'dashboard',
        title: 'Navigating the dashboard',
        description: 'Understand the main dashboard and how to find what you need.',
        keywords: ['dashboard', 'navigation', 'interface', 'home'],
      },
      {
        id: 'quick-start',
        title: 'Quick start guide',
        description: 'Get your first project configured in under 10 minutes.',
        keywords: ['quick', 'start', 'first', 'project', 'setup'],
      },
      {
        id: 'navigation-overview',
        title: 'Platform navigation',
        description: 'Tour of all major sections and how to find what you need.',
        keywords: ['navigation', 'sections', 'tour', 'overview', 'sidebar', 'menu', 'find'],
      },
    ],
  },
  {
    id: 'ai-governance',
    title: 'AI governance',
    description: 'Manage your AI models, track their lifecycle, and maintain comprehensive documentation.',
    icon: 'Brain',
    articleCount: 7,
    articles: [
      {
        id: 'model-inventory',
        title: 'Managing model inventory',
        description: 'Register and track all AI models across your organization.',
        keywords: ['model', 'inventory', 'register', 'ai', 'catalog'],
      },
      {
        id: 'model-lifecycle',
        title: 'Model lifecycle management',
        description: 'Track models from development through deployment and retirement.',
        keywords: ['lifecycle', 'development', 'deployment', 'retirement'],
      },
      {
        id: 'task-management',
        title: 'Task management',
        description: 'Coordinate AI governance activities and compliance tasks across your teams.',
        keywords: ['task', 'tasks', 'assignment', 'compliance', 'governance', 'deadline', 'priority'],
      },
      {
        id: 'incident-management',
        title: 'AI incident management',
        description: 'Document, track, and resolve AI-related incidents effectively.',
        keywords: ['incident', 'issue', 'problem', 'resolution', 'tracking'],
      },
      {
        id: 'evidence-collection',
        title: 'Evidence collection',
        description: 'Gather and organize evidence for compliance and audits.',
        keywords: ['evidence', 'documentation', 'proof', 'audit', 'collection', 'file', 'manager'],
      },
      {
        id: 'watchtower',
        title: 'Event Tracker',
        description: 'Track user actions, system events, and application logs.',
        keywords: ['event', 'tracker', 'events', 'logs', 'activity', 'audit', 'troubleshooting'],
      },
      {
        id: 'ai-trust-center',
        title: 'AI Trust Center',
        description: 'Public transparency portal for sharing your AI governance practices.',
        keywords: ['trust', 'center', 'transparency', 'public', 'stakeholders', 'disclosure'],
      },
    ],
  },
  {
    id: 'llm-evals',
    title: 'LLM Evals',
    description: 'Evaluate and benchmark your LLM applications for quality, safety, and performance.',
    icon: 'FlaskConical',
    articleCount: 4,
    articles: [
      {
        id: 'llm-evals-overview',
        title: 'LLM Evals overview',
        description: 'Introduction to the LLM evaluation platform and key concepts.',
        keywords: ['llm', 'evals', 'evaluation', 'benchmark', 'overview', 'introduction'],
      },
      {
        id: 'running-experiments',
        title: 'Running experiments',
        description: 'Create and run evaluation experiments to test your models.',
        keywords: ['experiment', 'run', 'evaluate', 'test', 'wizard', 'model', 'judge'],
      },
      {
        id: 'managing-datasets',
        title: 'Managing datasets',
        description: 'Upload, browse, and manage evaluation datasets.',
        keywords: ['dataset', 'upload', 'prompts', 'data', 'json', 'custom', 'builtin'],
      },
      {
        id: 'configuring-scorers',
        title: 'Configuring scorers',
        description: 'Set up evaluation metrics and scoring thresholds.',
        keywords: ['scorer', 'metric', 'threshold', 'judge', 'llm', 'bias', 'toxicity', 'hallucination'],
      },
    ],
  },
  {
    id: 'risk-management',
    title: 'Risk management',
    description: 'Identify, assess, and mitigate risks across your AI systems and vendors.',
    icon: 'AlertTriangle',
    articleCount: 4,
    articles: [
      {
        id: 'risk-assessment',
        title: 'Conducting risk assessments',
        description: 'Learn how to identify and evaluate risks in your AI projects.',
        keywords: ['risk', 'assessment', 'evaluate', 'identify', 'analysis'],
      },
      {
        id: 'risk-mitigation',
        title: 'Risk mitigation strategies',
        description: 'Implement controls to reduce and manage identified risks.',
        keywords: ['mitigation', 'control', 'reduce', 'manage', 'strategy'],
      },
      {
        id: 'vendor-management',
        title: 'Vendor management',
        description: 'Evaluate and monitor third-party AI vendors and suppliers.',
        keywords: ['vendor', 'supplier', 'third-party', 'evaluate', 'monitor'],
      },
      {
        id: 'vendor-risks',
        title: 'Vendor risk assessment',
        description: 'Assess and track risks associated with your AI vendors.',
        keywords: ['vendor', 'risk', 'supplier', 'assessment', 'third-party'],
      },
    ],
  },
  {
    id: 'compliance',
    title: 'Compliance frameworks',
    description: 'Stay compliant with AI regulations including EU AI Act, ISO 42001, and more.',
    icon: 'Shield',
    articleCount: 5,
    articles: [
      {
        id: 'assessments',
        title: 'Compliance overview',
        description: 'Understand available compliance frameworks and how to choose between them.',
        keywords: ['compliance', 'framework', 'overview', 'choose', 'comparison'],
      },
      {
        id: 'eu-ai-act',
        title: 'EU AI Act compliance',
        description: 'Navigate the requirements of the European AI regulation.',
        keywords: ['eu', 'ai act', 'regulation', 'europe', 'compliance'],
      },
      {
        id: 'iso-42001',
        title: 'ISO 42001 certification',
        description: 'Prepare for AI management system certification.',
        keywords: ['iso', '42001', 'certification', 'management', 'system'],
      },
      {
        id: 'iso-27001',
        title: 'ISO 27001 integration',
        description: 'Align AI governance with information security standards.',
        keywords: ['iso', '27001', 'security', 'information', 'integration'],
      },
      {
        id: 'nist-ai-rmf',
        title: 'NIST AI RMF',
        description: 'Implement the NIST AI Risk Management Framework.',
        keywords: ['nist', 'rmf', 'framework', 'risk', 'management'],
      },
    ],
  },
  {
    id: 'policies',
    title: 'Policies',
    description: 'Create, manage, and enforce AI governance policies across your organization.',
    icon: 'FileText',
    articleCount: 3,
    articles: [
      {
        id: 'policy-management',
        title: 'Policy management basics',
        description: 'Create and organize policies for AI governance.',
        keywords: ['policy', 'create', 'manage', 'governance', 'document'],
      },
      {
        id: 'policy-versioning',
        title: 'Policy lifecycle',
        description: 'Understand the policy status workflow and review scheduling.',
        keywords: ['lifecycle', 'status', 'draft', 'review', 'publish', 'archive'],
      },
      {
        id: 'policy-approval',
        title: 'Policy templates',
        description: 'Use pre-built templates to create common governance policies.',
        keywords: ['template', 'pre-built', 'ethics', 'compliance', 'starter'],
      },
    ],
  },
  {
    id: 'training',
    title: 'Training registry',
    description: 'Track team training and ensure accountability across your organization.',
    icon: 'GraduationCap',
    articleCount: 1,
    articles: [
      {
        id: 'training-tracking',
        title: 'Training registry',
        description: 'Track AI training programs and team competency development.',
        keywords: ['training', 'track', 'completion', 'team', 'program', 'competency', 'registry'],
      },
    ],
  },
  {
    id: 'reporting',
    title: 'Reporting',
    description: 'Generate reports and gain insights into your AI governance program.',
    icon: 'BarChart3',
    articleCount: 2,
    articles: [
      {
        id: 'dashboard-analytics',
        title: 'Dashboard overview',
        description: 'Navigate the dashboard and customize your governance view.',
        keywords: ['dashboard', 'home', 'widgets', 'metrics', 'overview', 'customize', 'layout'],
      },
      {
        id: 'generating-reports',
        title: 'Generating reports',
        description: 'Create project and organization reports for compliance and audits.',
        keywords: ['report', 'generate', 'create', 'project', 'organization', 'compliance', 'audit', 'download'],
      },
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Connect VerifyWise with your existing tools and workflows.',
    icon: 'Plug',
    articleCount: 4,
    articles: [
      {
        id: 'integration-overview',
        title: 'Integration overview',
        description: 'View available integrations and their connection status.',
        keywords: ['integration', 'connect', 'tools', 'setup', 'overview', 'slack', 'mlflow'],
      },
      {
        id: 'slack-integration',
        title: 'Slack integration',
        description: 'Send governance notifications to your Slack workspace.',
        keywords: ['slack', 'notification', 'workspace', 'messaging', 'channel', 'routing'],
      },
      {
        id: 'api-access',
        title: 'API access',
        description: 'Create and manage API keys for programmatic access.',
        keywords: ['api', 'access', 'keys', 'token', 'developer', 'integration', 'programmatic'],
      },
      {
        id: 'mlflow-integration',
        title: 'MLflow integration',
        description: 'Sync your MLflow model registry with VerifyWise.',
        keywords: ['mlflow', 'model', 'registry', 'sync', 'integration', 'training', 'experiment'],
      },
    ],
  },
  {
    id: 'plugins',
    title: 'Plugins',
    description: 'Extend VerifyWise functionality with built-in and marketplace plugins.',
    icon: 'Puzzle',
    articleCount: 4,
    articles: [
      {
        id: 'plugin-overview',
        title: 'Plugin overview',
        description: 'Introduction to the plugin system and how plugins extend VerifyWise.',
        keywords: ['plugin', 'plugins', 'overview', 'extension', 'addon', 'customize', 'extend'],
      },
      {
        id: 'managing-plugins',
        title: 'Managing plugins',
        description: 'Install, enable, configure, and manage plugins in your organization.',
        keywords: ['plugin', 'manage', 'install', 'enable', 'disable', 'configure', 'settings', 'admin'],
      },
      {
        id: 'plugin-marketplace',
        title: 'Plugin marketplace',
        description: 'Browse and install plugins from the VerifyWise marketplace.',
        keywords: ['plugin', 'marketplace', 'browse', 'install', 'download', 'community', 'registry'],
      },
      {
        id: 'developing-plugins',
        title: 'Developing plugins',
        description: 'Create custom plugins to extend VerifyWise with new features.',
        keywords: ['plugin', 'develop', 'create', 'build', 'custom', 'developer', 'api', 'template'],
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings & configuration',
    description: 'Configure VerifyWise to match your organization\'s needs.',
    icon: 'Settings',
    articleCount: 6,
    articles: [
      {
        id: 'organization-settings',
        title: 'Organization settings',
        description: 'Set your organization name and branding.',
        keywords: ['organization', 'settings', 'name', 'logo', 'branding'],
      },
      {
        id: 'user-management',
        title: 'User management',
        description: 'Manage profile, password, team, and preferences.',
        keywords: ['user', 'management', 'profile', 'password', 'team', 'invite', 'preferences'],
      },
      {
        id: 'role-configuration',
        title: 'Role configuration',
        description: 'Understand Admin, Editor, and Viewer roles.',
        keywords: ['role', 'permission', 'admin', 'editor', 'viewer', 'access'],
      },
      {
        id: 'notifications',
        title: 'Notification settings',
        description: 'Configure how you receive governance notifications.',
        keywords: ['notification', 'slack', 'alerts', 'configure', 'settings'],
      },
      {
        id: 'multi-organization',
        title: 'Multi-organization setup',
        description: 'Manage multiple organizations with isolated data and users.',
        keywords: ['multi-organization', 'multi-tenant', 'organization', 'isolation', 'enterprise'],
      },
      {
        id: 'email-configuration',
        title: 'Email configuration',
        description: 'Configure email providers for self-hosted deployments.',
        keywords: ['email', 'smtp', 'resend', 'ses', 'exchange', 'provider', 'configuration'],
      },
    ],
  },
];

// Fast Finds - Popular/quick access articles
export const fastFinds: FastFind[] = [
  {
    id: 'ff-1',
    title: 'Getting started with your first project',
    collectionId: 'getting-started',
    articleId: 'quick-start',
  },
  {
    id: 'ff-2',
    title: 'How to register an AI model',
    collectionId: 'ai-governance',
    articleId: 'model-inventory',
  },
  {
    id: 'ff-3',
    title: 'Understanding EU AI Act requirements',
    collectionId: 'compliance',
    articleId: 'eu-ai-act',
  },
  {
    id: 'ff-4',
    title: 'Creating your first policy',
    collectionId: 'policies',
    articleId: 'policy-management',
  },
  {
    id: 'ff-5',
    title: 'Setting up Slack notifications',
    collectionId: 'integrations',
    articleId: 'slack-integration',
  },
  {
    id: 'ff-6',
    title: 'Conducting a risk assessment',
    collectionId: 'risk-management',
    articleId: 'risk-assessment',
  },
];

// Helper functions
export const getCollection = (collectionId: string): Collection | undefined => {
  return collections.find((c) => c.id === collectionId);
};

export const getArticle = (collectionId: string, articleId: string): Article | undefined => {
  const collection = getCollection(collectionId);
  return collection?.articles.find((a) => a.id === articleId);
};

export const getTotalArticleCount = (): number => {
  return collections.reduce((sum, collection) => sum + collection.articleCount, 0);
};

export interface SearchResult {
  collectionId: string;
  collectionTitle: string;
  articleId: string;
  articleTitle: string;
  articleDescription: string;
  matchType: 'title' | 'description' | 'keyword';
}

export const searchArticles = (query: string): SearchResult[] => {
  if (!query || query.trim().length < 2) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const results: SearchResult[] = [];

  for (const collection of collections) {
    for (const article of collection.articles) {
      let matchType: 'title' | 'description' | 'keyword' | null = null;

      // Check title match (highest priority)
      if (article.title.toLowerCase().includes(normalizedQuery)) {
        matchType = 'title';
      }
      // Check description match
      else if (article.description.toLowerCase().includes(normalizedQuery)) {
        matchType = 'description';
      }
      // Check keywords match
      else if (article.keywords.some(kw => kw.toLowerCase().includes(normalizedQuery))) {
        matchType = 'keyword';
      }

      if (matchType) {
        results.push({
          collectionId: collection.id,
          collectionTitle: collection.title,
          articleId: article.id,
          articleTitle: article.title,
          articleDescription: article.description,
          matchType,
        });
      }
    }
  }

  // Sort by match type priority: title > description > keyword
  return results.sort((a, b) => {
    const priority = { title: 0, description: 1, keyword: 2 };
    return priority[a.matchType] - priority[b.matchType];
  });
};
