import type { ArticleContent } from '@user-guide-content/contentTypes';
import { welcomeContent } from './getting-started/welcome';
import { installingContent } from './getting-started/installing';
import { dashboardContent } from './getting-started/dashboard';
import { quickStartContent } from './getting-started/quick-start';
import { navigationOverviewContent } from './getting-started/navigation-overview';
import { modelInventoryContent } from './ai-governance/model-inventory';
import { modelLifecycleContent } from './ai-governance/model-lifecycle';
import { taskManagementContent } from './ai-governance/task-management';
import { incidentManagementContent } from './ai-governance/incident-management';
import { evidenceCollectionContent } from './ai-governance/evidence-collection';
import { watchtowerContent } from './ai-governance/watchtower';
import { aiTrustCenterContent } from './ai-governance/ai-trust-center';
import { riskAssessmentContent } from './risk-management/risk-assessment';
import { riskMitigationContent } from './risk-management/risk-mitigation';
import { vendorManagementContent } from './risk-management/vendor-management';
import { vendorRisksContent } from './risk-management/vendor-risks';
import { euAiActContent } from './compliance/eu-ai-act';
import { iso42001Content } from './compliance/iso-42001';
import { iso27001Content } from './compliance/iso-27001';
import { nistAiRmfContent } from './compliance/nist-ai-rmf';
import { assessmentsContent } from './compliance/assessments';
import { policyManagementContent } from './policies/policy-management';
import { policyVersioningContent } from './policies/policy-versioning';
import { policyApprovalContent } from './policies/policy-approval';
import { trainingTrackingContent } from './training/training-tracking';
import { dashboardAnalyticsContent } from './reporting/dashboard-analytics';
import { generatingReportsContent } from './reporting/generating-reports';
import { organizationSettingsContent } from './settings/organization-settings';
import { userManagementContent } from './settings/user-management';
import { roleConfigurationContent } from './settings/role-configuration';
import { notificationsContent } from './settings/notifications';
import { multiOrganizationContent } from './settings/multi-organization';
import { emailConfigurationContent } from './settings/email-configuration';
import { integrationOverviewContent } from './integrations/integration-overview';
import { slackIntegrationContent } from './integrations/slack-integration';
import { apiAccessContent } from './integrations/api-access';
import { mlflowIntegrationContent } from './integrations/mlflow-integration';
import { llmEvalsOverviewContent } from './llm-evals/llm-evals-overview';
import { runningExperimentsContent } from './llm-evals/running-experiments';
import { managingDatasetsContent } from './llm-evals/managing-datasets';
import { configuringScorersContent } from './llm-evals/configuring-scorers';
import { pluginOverviewContent } from './plugins/plugin-overview';
import { managingPluginsContent } from './plugins/managing-plugins';
import { pluginMarketplaceContent } from './plugins/plugin-marketplace';
import { developingPluginsContent } from './plugins/developing-plugins';

// Map of article IDs to their content
// Format: 'collectionId/articleId': ArticleContent
export const articleContentMap: Record<string, ArticleContent> = {
  // Getting Started
  'getting-started/welcome': welcomeContent,
  'getting-started/installing': installingContent,
  'getting-started/dashboard': dashboardContent,
  'getting-started/quick-start': quickStartContent,
  'getting-started/navigation-overview': navigationOverviewContent,
  // AI Governance
  'ai-governance/model-inventory': modelInventoryContent,
  'ai-governance/model-lifecycle': modelLifecycleContent,
  'ai-governance/task-management': taskManagementContent,
  'ai-governance/incident-management': incidentManagementContent,
  'ai-governance/evidence-collection': evidenceCollectionContent,
  'ai-governance/watchtower': watchtowerContent,
  'ai-governance/ai-trust-center': aiTrustCenterContent,
  // Risk Management
  'risk-management/risk-assessment': riskAssessmentContent,
  'risk-management/risk-mitigation': riskMitigationContent,
  'risk-management/vendor-management': vendorManagementContent,
  'risk-management/vendor-risks': vendorRisksContent,
  // Compliance
  'compliance/eu-ai-act': euAiActContent,
  'compliance/iso-42001': iso42001Content,
  'compliance/iso-27001': iso27001Content,
  'compliance/nist-ai-rmf': nistAiRmfContent,
  'compliance/assessments': assessmentsContent,
  // Policies
  'policies/policy-management': policyManagementContent,
  'policies/policy-versioning': policyVersioningContent,
  'policies/policy-approval': policyApprovalContent,
  // Training
  'training/training-tracking': trainingTrackingContent,
  // Reporting
  'reporting/dashboard-analytics': dashboardAnalyticsContent,
  'reporting/generating-reports': generatingReportsContent,
  // Settings
  'settings/organization-settings': organizationSettingsContent,
  'settings/user-management': userManagementContent,
  'settings/role-configuration': roleConfigurationContent,
  'settings/notifications': notificationsContent,
  'settings/multi-organization': multiOrganizationContent,
  'settings/email-configuration': emailConfigurationContent,
  // Integrations
  'integrations/integration-overview': integrationOverviewContent,
  'integrations/slack-integration': slackIntegrationContent,
  'integrations/api-access': apiAccessContent,
  'integrations/mlflow-integration': mlflowIntegrationContent,
  // LLM Evals
  'llm-evals/llm-evals-overview': llmEvalsOverviewContent,
  'llm-evals/running-experiments': runningExperimentsContent,
  'llm-evals/managing-datasets': managingDatasetsContent,
  'llm-evals/configuring-scorers': configuringScorersContent,
  // Plugins
  'plugins/plugin-overview': pluginOverviewContent,
  'plugins/managing-plugins': managingPluginsContent,
  'plugins/plugin-marketplace': pluginMarketplaceContent,
  'plugins/developing-plugins': developingPluginsContent,
};

// Helper to get article content
export const getArticleContent = (
  collectionId: string,
  articleId: string
): ArticleContent | undefined => {
  const key = `${collectionId}/${articleId}`;
  return articleContentMap[key];
};
