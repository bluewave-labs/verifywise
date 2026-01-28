/**
 * Fixed plugin slot identifiers
 * These are the only locations where plugins can inject UI
 */
export const PLUGIN_SLOTS = {
  // Risk Management Page
  RISKS_ACTIONS: "page.risks.actions", // Menu item in "Insert From" dropdown
  RISKS_TOOLBAR: "page.risks.toolbar", // Additional toolbar buttons

  // Model Inventory Page
  MODELS_TABS: "page.models.tabs", // Additional tabs in TabBar
  MODELS_TOOLBAR: "page.models.toolbar", // Toolbar buttons

  // Plugin Management Page (for plugin-specific config UI)
  PLUGIN_CONFIG: "page.plugin.config", // Config panel for each plugin

  // Dashboard (future)
  DASHBOARD_WIDGETS: "page.dashboard.widgets", // Dashboard widget area

  // Sidebar (future)
  SIDEBAR_ITEMS: "layout.sidebar.items", // Sidebar menu items
} as const;

export type PluginSlotId = (typeof PLUGIN_SLOTS)[keyof typeof PLUGIN_SLOTS];

/**
 * Render types for plugin components
 */
export type PluginRenderType =
  | "menuitem"
  | "modal"
  | "tab"
  | "card"
  | "button"
  | "widget"
  | "raw";
