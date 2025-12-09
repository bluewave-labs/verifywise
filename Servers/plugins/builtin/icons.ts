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

/**
 * Icon map for easy lookup by plugin ID
 */
export const pluginIcons: Record<string, string> = {
  "sample-test-plugin": sampleTestPluginIcon,
};

export default pluginIcons;
