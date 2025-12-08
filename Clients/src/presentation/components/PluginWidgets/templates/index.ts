/**
 * Plugin Widget Templates
 *
 * Export all available widget templates that plugins can use.
 * Marketplace plugins can specify these template names in their manifest.json.
 *
 * Available templates:
 * - "activity-feed" - Activity log with avatars and timestamps
 * - "list" - Generic list of items with icons
 * - "stats-card" - Single metric card with change indicator
 * - "table" - Tabular data display
 */

export { default as ListWidget } from "./ListWidget";
export { default as StatsCardWidget } from "./StatsCardWidget";
export { default as TableWidget } from "./TableWidget";
