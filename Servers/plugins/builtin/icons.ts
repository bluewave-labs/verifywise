/**
 * Plugin Icons
 *
 * 64x64 SVG icons for built-in plugins.
 * Each icon uses a unique design and color scheme matching the plugin's purpose.
 */

// Sample Test Plugin - Test tube icon (purple)
export const sampleTestPluginIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="12" fill="#F3E8FF"/>
  <path d="M24 16H40V20H38L38 32L46 48C47.5 51 45.5 54 42 54H22C18.5 54 16.5 51 18 48L26 32L26 20H24V16Z" stroke="#7C3AED" stroke-width="2.5" fill="none"/>
  <path d="M26 32L20 44H44L38 32" fill="#E9D5FF"/>
  <circle cx="28" cy="40" r="2" fill="#7C3AED"/>
  <circle cx="34" cy="44" r="2.5" fill="#7C3AED"/>
  <circle cx="38" cy="38" r="1.5" fill="#7C3AED"/>
  <line x1="28" y1="16" x2="36" y2="16" stroke="#7C3AED" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

// Slack Notifications - Chat/message icon (purple/integration)
export const slackNotificationsIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="12" fill="#F3E8FF"/>
  <rect x="14" y="18" width="36" height="28" rx="4" stroke="#7C3AED" stroke-width="2.5" fill="none"/>
  <path d="M14 26L32 38L50 26" stroke="#7C3AED" stroke-width="2.5" fill="none"/>
  <circle cx="48" cy="18" r="8" fill="#22C55E"/>
  <path d="M44 18L47 21L53 15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Email Digest - Envelope with clock (green/feature)
export const emailDigestIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="12" fill="#E6F4EA"/>
  <rect x="12" y="20" width="32" height="24" rx="3" stroke="#138A5E" stroke-width="2.5" fill="none"/>
  <path d="M12 24L28 36L44 24" stroke="#138A5E" stroke-width="2.5" fill="none"/>
  <circle cx="46" cy="38" r="10" fill="white" stroke="#138A5E" stroke-width="2.5"/>
  <path d="M46 32V38L50 42" stroke="#138A5E" stroke-width="2" stroke-linecap="round"/>
</svg>`;

// Audit Trail - Clipboard with checkmarks (green/feature)
export const auditTrailIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="12" fill="#E6F4EA"/>
  <rect x="16" y="14" width="32" height="42" rx="3" stroke="#138A5E" stroke-width="2.5" fill="none"/>
  <rect x="24" y="10" width="16" height="8" rx="2" fill="white" stroke="#138A5E" stroke-width="2"/>
  <path d="M22 30L26 34L34 26" stroke="#138A5E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="38" y1="30" x2="42" y2="30" stroke="#138A5E" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M22 42L26 46L34 38" stroke="#138A5E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="38" y1="42" x2="42" y2="42" stroke="#138A5E" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

// Custom Reporting - Chart/bar graph (amber/reporting)
export const customReportingIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="12" fill="#FEF3C7"/>
  <rect x="14" y="14" width="36" height="36" rx="3" stroke="#D97706" stroke-width="2.5" fill="none"/>
  <rect x="20" y="32" width="6" height="12" rx="1" fill="#D97706"/>
  <rect x="29" y="24" width="6" height="20" rx="1" fill="#D97706"/>
  <rect x="38" y="28" width="6" height="16" rx="1" fill="#D97706"/>
  <line x1="14" y1="50" x2="50" y2="50" stroke="#D97706" stroke-width="2.5"/>
</svg>`;

// Jira Integration - Ticket/issue icon (purple/integration)
export const jiraIntegrationIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="12" fill="#F3E8FF"/>
  <rect x="14" y="14" width="36" height="36" rx="4" stroke="#7C3AED" stroke-width="2.5" fill="none"/>
  <line x1="14" y1="26" x2="50" y2="26" stroke="#7C3AED" stroke-width="2"/>
  <circle cx="22" cy="20" r="3" fill="#7C3AED"/>
  <rect x="20" y="32" width="24" height="4" rx="2" fill="#E9D5FF"/>
  <rect x="20" y="40" width="16" height="4" rx="2" fill="#E9D5FF"/>
  <path d="M40 38L44 42L48 34" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// AI Risk Scoring - Brain with gauge (green/feature)
export const aiRiskScoringIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="12" fill="#E6F4EA"/>
  <circle cx="32" cy="32" r="18" stroke="#138A5E" stroke-width="2.5" fill="none"/>
  <path d="M32 18C32 18 24 22 24 32C24 42 32 46 32 46" stroke="#138A5E" stroke-width="2" fill="none"/>
  <path d="M32 18C32 18 40 22 40 32C40 42 32 46 32 46" stroke="#138A5E" stroke-width="2" fill="none"/>
  <line x1="18" y1="32" x2="46" y2="32" stroke="#138A5E" stroke-width="2"/>
  <circle cx="32" cy="32" r="4" fill="#138A5E"/>
  <path d="M32 28L36 20" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="48" cy="16" r="8" fill="#138A5E"/>
  <text x="48" y="20" text-anchor="middle" fill="white" font-size="10" font-weight="bold">AI</text>
</svg>`;

/**
 * Icon map for easy lookup by plugin ID
 */
export const pluginIcons: Record<string, string> = {
  "sample-test-plugin": sampleTestPluginIcon,
  "slack-notifications": slackNotificationsIcon,
  "email-digest": emailDigestIcon,
  "audit-trail": auditTrailIcon,
  "custom-reporting": customReportingIcon,
  "jira-integration": jiraIntegrationIcon,
  "ai-risk-scoring": aiRiskScoringIcon,
};

export default pluginIcons;
