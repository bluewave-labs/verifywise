import { Integration, IntegrationCategory, IntegrationStatus } from '../domain/types/Integrations';

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
    status: IntegrationStatus.NOT_CONFIGURED,
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
    status: IntegrationStatus.NOT_CONFIGURED,
    features: [
      'models',
      'experiment tracking',
      'model lifecycle management'
    ],
    documentationUrl: 'https://docs.example.com/integrations/mlflow',
    setupRequired: true,
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
 * Get configured integrations
 */
export const getConfiguredIntegrations = (): Integration[] => {
  return AVAILABLE_INTEGRATIONS.filter(integration => integration.status === IntegrationStatus.CONFIGURED);
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
