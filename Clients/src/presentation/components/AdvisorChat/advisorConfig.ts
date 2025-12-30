/**
 * Advisor Domain Configuration
 *
 * Central configuration for all Advisor domains. To add a new domain:
 * 1. Add a new entry to ADVISOR_DOMAINS with path, welcomeMessage, and suggestions
 * 2. Create corresponding backend tools in Servers/advisor/tools/
 * 3. Create corresponding backend functions in Servers/advisor/functions/
 * 4. Update Servers/advisor/prompts.ts to include the new tools
 * 5. Update Servers/controllers/advisor.ctrl.ts to import and merge the new tools
 */

export interface AdvisorSuggestion {
  prompt: string;
  label: string;
}

export interface AdvisorDomainConfig {
  path: string;
  displayName: string;
  welcomeMessage: string;
  suggestions: AdvisorSuggestion[];
}

export const ADVISOR_DOMAINS: Record<string, AdvisorDomainConfig> = {
  'risk-management': {
    path: '/risk-management',
    displayName: 'Risks',
    welcomeMessage: "Hello! I'm your AI Risk Management Advisor. I can help you analyze risk distributions, track mitigation progress, identify high-priority risks, and understand trends over time. What would you like to know about your risks?",
    suggestions: [
      { prompt: 'Give me an executive summary of our risk landscape', label: 'Summarize all risks' },
      { prompt: 'Show me the risk distribution by severity and likelihood', label: 'Show risk matrix' },
      { prompt: 'What risks have mitigations that are not started or in progress?', label: 'Find incomplete mitigations' },
      { prompt: 'How has the risk level changed over the past 2 weeks?', label: 'Show recent trends' },
      { prompt: 'What are the high and very high risk items?', label: 'List high-priority risks' },
      { prompt: 'Show risks by AI lifecycle phase', label: 'Group by lifecycle phase' },
      { prompt: 'Which risks are categorized under data privacy or security?', label: 'Find privacy & security risks' },
    ],
  },
  'model-inventory': {
    path: '/model-inventory',
    displayName: 'Models',
    welcomeMessage: "Hello! I'm your AI Model Inventory Advisor. I can help you understand your model landscape, check approval statuses, review security assessments, and analyze provider distributions. What would you like to know about your models?",
    suggestions: [
      { prompt: 'Give me an executive summary of our AI model inventory', label: 'Summarize all models' },
      { prompt: 'Which models are pending approval or blocked?', label: 'Find pending approvals' },
      { prompt: 'How many models have completed security assessments?', label: 'Check security status' },
      { prompt: 'Show me the breakdown of models by provider', label: 'Group by provider' },
      { prompt: 'Which models are hosted on-premises vs cloud?', label: 'Compare hosting types' },
      { prompt: 'List all approved models ready for use', label: 'List approved models' },
      { prompt: 'Which models have not undergone security assessment?', label: 'Find unassessed models' },
    ],
  },
  'model-risks': {
    path: '/model-inventory/model-risks',
    displayName: 'Model Risks',
    welcomeMessage: "Hello! I'm your AI Model Risk Advisor. I can help you analyze model-specific risks, track risk categories and severity levels, monitor mitigation progress, and identify risks needing attention. What would you like to know about your model risks?",
    suggestions: [
      { prompt: 'Give me an executive summary of our model risk landscape', label: 'Summarize all model risks' },
      { prompt: 'Show me the distribution of risks by severity level', label: 'Show severity breakdown' },
      { prompt: 'Which model risks are critical or high priority?', label: 'List critical risks' },
      { prompt: 'Show me risks grouped by category', label: 'Group by category' },
      { prompt: 'What risks are open or in progress?', label: 'Find active risks' },
      { prompt: 'Which owners have the most risks assigned?', label: 'Show owner workload' },
      { prompt: 'What is our overall risk resolution progress?', label: 'Check resolution progress' },
    ],
  },
  'vendors': {
    path: '/vendors',
    displayName: 'Vendors',
    welcomeMessage: "Hello! I'm your Vendor Management Advisor. I can help you analyze vendor risks, track review statuses, monitor compliance requirements, and identify vendors needing attention. What would you like to know about your vendors?",
    suggestions: [
      { prompt: 'Give me an executive summary of our vendor landscape', label: 'Summarize all vendors' },
      { prompt: 'Show me vendor distribution by review status', label: 'Show review status' },
      { prompt: 'Which vendors are high risk or require follow-up?', label: 'Find high-risk vendors' },
      { prompt: 'Show me vendors by data sensitivity level', label: 'Group by data sensitivity' },
      { prompt: 'Which vendors handle PII or sensitive data?', label: 'Find PII vendors' },
      { prompt: 'What is our vendor review completion rate?', label: 'Check review progress' },
      { prompt: 'Show me vendors by regulatory exposure', label: 'Group by regulation' },
    ],
  },
  'ai-incident-managements': {
    path: '/ai-incident-managements',
    displayName: 'AI Incidents',
    welcomeMessage: "Hello! I'm your AI Incident Management Advisor. I can help you analyze incident trends, track severity levels, monitor resolution progress, and identify incidents needing attention. What would you like to know about your AI incidents?",
    suggestions: [
      { prompt: 'Give me an executive summary of our incident landscape', label: 'Summarize all incidents' },
      { prompt: 'Show me incident distribution by severity', label: 'Show severity breakdown' },
      { prompt: 'Which incidents are open or under investigation?', label: 'Find active incidents' },
      { prompt: 'Show me incidents grouped by type', label: 'Group by incident type' },
      { prompt: 'What is our incident resolution rate?', label: 'Check resolution progress' },
      { prompt: 'Which AI projects have the most incidents?', label: 'Show incidents by project' },
      { prompt: 'Show me serious or very serious incidents', label: 'List critical incidents' },
    ],
  },
  'tasks': {
    path: '/tasks',
    displayName: 'Tasks',
    welcomeMessage: "Hello! I'm your Task Management Advisor. I can help you analyze task distributions, track progress, identify overdue items, and understand workload across your team. What would you like to know about your tasks?",
    suggestions: [
      { prompt: 'Give me an executive summary of our task landscape', label: 'Summarize all tasks' },
      { prompt: 'Show me task distribution by status', label: 'Show status breakdown' },
      { prompt: 'Which tasks are overdue or need attention?', label: 'Find overdue tasks' },
      { prompt: 'Show me tasks grouped by priority', label: 'Group by priority' },
      { prompt: 'What is our task completion rate?', label: 'Check completion progress' },
      { prompt: 'Show me high priority tasks that are still open', label: 'List high-priority open tasks' },
      { prompt: 'What categories have the most tasks?', label: 'Show top categories' },
    ],
  },
  'policies': {
    path: '/policies',
    displayName: 'Policies',
    welcomeMessage: "Hello! I'm your Policy Management Advisor. I can help you analyze policy coverage, track review schedules, find policy templates, and identify gaps in your governance framework. What would you like to know about your policies?",
    suggestions: [
      { prompt: 'Give me an executive summary of our policy landscape', label: 'Summarize all policies' },
      { prompt: 'Show me policy distribution by status', label: 'Show status breakdown' },
      { prompt: 'Which policies are overdue for review?', label: 'Find overdue reviews' },
      { prompt: 'What policy areas do we have coverage gaps in?', label: 'Find coverage gaps' },
      { prompt: 'Show me policies by tag', label: 'Group by tag' },
      { prompt: 'What policy templates are available for AI ethics?', label: 'Find AI ethics templates' },
      { prompt: 'Recommend policy templates based on our current coverage', label: 'Get recommendations' },
    ],
  },
};

// Derived types and helpers
export type AdvisorDomain = keyof typeof ADVISOR_DOMAINS;

export const ADVISOR_PATHS = Object.values(ADVISOR_DOMAINS).map(d => d.path);

export const DEFAULT_WELCOME_MESSAGE = "Hello! I'm your VerifyWise AI Advisor. I can help you with AI Risk Management, Model Inventory, Model Risks, Vendors, AI Incident Management, Tasks, and Policies. What would you like to know?";

/**
 * Get domain key by path
 */
export const getDomainByPath = (path: string): AdvisorDomain | undefined => {
  const entry = Object.entries(ADVISOR_DOMAINS).find(([, config]) => config.path === path);
  return entry?.[0] as AdvisorDomain | undefined;
};

/**
 * Get welcome message for a domain
 */
export const getWelcomeMessage = (domain?: AdvisorDomain): string => {
  if (!domain) return DEFAULT_WELCOME_MESSAGE;
  return ADVISOR_DOMAINS[domain]?.welcomeMessage ?? DEFAULT_WELCOME_MESSAGE;
};

/**
 * Get suggestions for a domain
 */
export const getSuggestions = (domain?: AdvisorDomain): AdvisorSuggestion[] => {
  if (!domain) return [];
  return ADVISOR_DOMAINS[domain]?.suggestions ?? [];
};

/**
 * Check if a path is advisor-eligible
 */
export const isAdvisorEligiblePath = (path: string): boolean => {
  return ADVISOR_PATHS.includes(path);
};
