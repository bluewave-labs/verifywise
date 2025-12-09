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

// Activity Feed Plugin - Timeline icon (green/teal)
export const activityFeedPluginIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="12" fill="#E0F2F1"/>
  <line x1="22" y1="14" x2="22" y2="50" stroke="#13715B" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="22" cy="18" r="4" fill="#13715B"/>
  <rect x="30" y="14" rx="3" width="22" height="8" fill="#A7D7C5"/>
  <circle cx="22" cy="32" r="4" fill="#13715B"/>
  <rect x="30" y="28" rx="3" width="18" height="8" fill="#A7D7C5"/>
  <circle cx="22" cy="46" r="4" fill="#13715B"/>
  <rect x="30" y="42" rx="3" width="14" height="8" fill="#A7D7C5"/>
  <circle cx="22" cy="18" r="6" stroke="#13715B" stroke-width="1" opacity="0.4"/>
</svg>`;

// Sample Page Plugin - Document layout icon (blue)
export const samplePagePluginIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="12" fill="#EFF6FF"/>
  <rect x="14" y="10" width="36" height="44" rx="4" fill="#FFFFFF" stroke="#2563EB" stroke-width="2"/>
  <rect x="18" y="16" width="28" height="6" rx="2" fill="#BFDBFE"/>
  <rect x="18" y="26" width="8" height="8" rx="2" fill="#DBEAFE"/>
  <rect x="28" y="26" width="8" height="8" rx="2" fill="#DBEAFE"/>
  <rect x="38" y="26" width="8" height="8" rx="2" fill="#DBEAFE"/>
  <rect x="18" y="38" width="28" height="3" rx="1" fill="#2563EB" opacity="0.6"/>
  <rect x="18" y="43" width="24" height="2" rx="1" fill="#2563EB" opacity="0.3"/>
  <rect x="18" y="47" width="20" height="2" rx="1" fill="#2563EB" opacity="0.3"/>
</svg>`;

/**
 * Icon map for easy lookup by plugin ID
 */
export const pluginIcons: Record<string, string> = {
  "sample-test-plugin": sampleTestPluginIcon,
  "activity-feed": activityFeedPluginIcon,
  "sample-page": samplePagePluginIcon,
};

export default pluginIcons;
