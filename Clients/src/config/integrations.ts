import { Integration, IntegrationCategory, IntegrationStatus } from '../domain/types/integrations';

/**
 * Available integrations configuration
 * This file contains all available integrations with their metadata
 */
export const AVAILABLE_INTEGRATIONS: Integration[] = [
  {
    id: 'slack',
    name: 'slack',
    displayName: 'Slack',
    description: 'Get real-time notifications about AI model updates, risk assessments, and compliance changes directly in your Slack workspace.',
    logo: '/assets/slack_logo.svg',
    category: IntegrationCategory.COMMUNICATION,
    status: IntegrationStatus.DISCONNECTED,
    features: [
      'Notifications'
    ],
    documentationUrl: 'https://docs.example.com/integrations/slack',
    setupRequired: true,
  },
  {
    id: 'mlflow',
    name: 'mlflow',
    displayName: 'MLflow',
    description: 'Track and manage machine learning experiments, models, and deployments with comprehensive ML lifecycle management.',
    logo: '/assets/mlflow_logo.svg',
    category: IntegrationCategory.ML_OPS,
    status: IntegrationStatus.DISCONNECTED,
    features: [
      'models',
      'model registry'
    ],
    documentationUrl: 'https://docs.example.com/integrations/mlflow',
    setupRequired: true,
  },
  {
    id: 'github',
    name: 'github',
    displayName: 'GitHub',
    description: 'Connect your repositories to monitor AI models, track code changes, and automate governance workflows.',
    logo: '/assets/github_logo.svg',
    category: IntegrationCategory.VERSION_CONTROL,
    status: IntegrationStatus.DISCONNECTED,
    features: [
      'issue tracking'
    ],
    documentationUrl: 'https://docs.example.com/integrations/github',
    setupRequired: false,
  },
  {
    id: 'datadog',
    name: 'datadog',
    displayName: 'Datadog',
    description: 'Monitor AI model performance, track system metrics, and get insights into your ML infrastructure.',
    logo: '/assets/datadog_logo.svg',
    category: IntegrationCategory.MONITORING,
    status: IntegrationStatus.DISCONNECTED,
    features: [
      'Performance monitoring',
      'Custom metrics dashboards',
      'Alert management',
      'Infrastructure monitoring',
      'Log aggregation'
    ],
    documentationUrl: 'https://docs.example.com/integrations/datadog',
    setupRequired: true,
  },
  {
    id: 'jira',
    name: 'jira',
    displayName: 'Jira',
    description: 'Integrate with Jira to track AI model issues, manage governance tasks, and streamline workflows.',
    logo: '/assets/jira_logo.svg',
    category: IntegrationCategory.COMMUNICATION,
    status: IntegrationStatus.DISCONNECTED,
    features: [
      'Issue tracking',
      'Task management',
      'Workflow automation',
      'Custom field mapping',
      'Sprint planning integration'
    ],
    documentationUrl: 'https://docs.example.com/integrations/jira',
    setupRequired: false,
  },
];

/**
 * Get integrations by category
 */
export const getIntegrationsByCategory = (category: IntegrationCategory): Integration[] => {
  return AVAILABLE_INTEGRATIONS.filter(integration => integration.category === category);
};

/**
 * Get integration by ID
 */
export const getIntegrationById = (id: string): Integration | undefined => {
  return AVAILABLE_INTEGRATIONS.find(integration => integration.id === id);
};

/**
 * Get connected integrations
 */
export const getConnectedIntegrations = (): Integration[] => {
  return AVAILABLE_INTEGRATIONS.filter(integration => integration.status === IntegrationStatus.CONNECTED);
};

/**
 * Search integrations by name or description
 */
export const searchIntegrations = (query: string): Integration[] => {
  const lowerQuery = query.toLowerCase();
  return AVAILABLE_INTEGRATIONS.filter(integration =>
    integration.displayName.toLowerCase().includes(lowerQuery) ||
    integration.description.toLowerCase().includes(lowerQuery) ||
    integration.features.some(feature => feature.toLowerCase().includes(lowerQuery))
  );
};