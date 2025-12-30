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
  welcomeMessage: string;
  suggestions: AdvisorSuggestion[];
}

export const ADVISOR_DOMAINS: Record<string, AdvisorDomainConfig> = {
  'risk-management': {
    path: '/risk-management',
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
};

// Derived types and helpers
export type AdvisorDomain = keyof typeof ADVISOR_DOMAINS;

export const ADVISOR_PATHS = Object.values(ADVISOR_DOMAINS).map(d => d.path);

export const DEFAULT_WELCOME_MESSAGE = "Hello! I'm your VerifyWise AI Advisor. I can help you with AI Risk Management and Model Inventory. What would you like to know?";

/**
 * Get domain key by path
 */
export const getDomainByPath = (path: string): AdvisorDomain | undefined => {
  const entry = Object.entries(ADVISOR_DOMAINS).find(([_, config]) => config.path === path);
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
