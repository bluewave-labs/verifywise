/**
 * @fileoverview Plugin Extensions Context
 *
 * This module provides a React Context for managing plugin UI extensions across
 * the application. It implements a centralized state management pattern to avoid
 * duplicate API calls and ensure consistent plugin data across all components.
 *
 * ## Architecture
 *
 * The context follows a "fetch once, share everywhere" pattern:
 * 1. On app load, fetches all UI extensions from enabled plugins
 * 2. Stores the data in context state
 * 3. Components use hooks to access specific extension types
 * 4. After plugin enable/disable, call refresh() to update all consumers
 *
 * ## Extension Types
 *
 * - **Dashboard Widgets**: Rendered on the main dashboard using widget templates
 * - **Navigation Items**: Sidebar menu items injected by plugins (future)
 * - **Settings Pages**: Plugin configuration pages in Settings (future)
 *
 * ## Usage Example
 *
 * ```tsx
 * // In App.tsx - wrap the app
 * <PluginExtensionsProvider>
 *   <App />
 * </PluginExtensionsProvider>
 *
 * // In a component - use a hook
 * const { widgets, isLoading } = useDashboardWidgets();
 *
 * // After enabling/disabling a plugin
 * const refresh = useRefreshPluginExtensions();
 * await enablePlugin('my-plugin');
 * await refresh(); // Updates all components using plugin hooks
 * ```
 *
 * @module contexts/PluginExtensions
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  getPluginUIExtensions,
  DashboardWidgetExtension,
  PluginPageExtension,
} from "../repository/plugin.repository";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Navigation menu item extension contributed by a plugin.
 * Used to inject custom menu items into the sidebar navigation.
 *
 * @example
 * {
 *   pluginId: "gdpr-compliance",
 *   id: "gdpr-dashboard",
 *   label: "GDPR Dashboard",
 *   icon: "Shield",
 *   path: "/plugins/gdpr/dashboard",
 *   group: "Compliance",
 *   order: 10,
 *   roles: ["admin", "compliance-officer"]
 * }
 */
export interface NavigationExtension {
  /** ID of the plugin that registered this navigation item */
  pluginId: string;
  /** Unique identifier for this navigation item */
  id: string;
  /** Display label shown in the menu */
  label: string;
  /** Icon name or component (optional) */
  icon?: string;
  /** Route path to navigate to */
  path: string;
  /** Menu group/section for organization (optional) */
  group?: string;
  /** Sort order within the group (lower = higher) */
  order?: number;
  /** Role-based access control (optional) */
  roles?: string[];
}

/**
 * Settings page extension contributed by a plugin.
 * Used to inject plugin configuration pages into the Settings area.
 *
 * @example
 * {
 *   pluginId: "slack-integration",
 *   id: "slack-settings",
 *   label: "Slack",
 *   path: "integrations/slack",
 *   order: 20
 * }
 */
export interface SettingsPageExtension {
  /** ID of the plugin that registered this settings page */
  pluginId: string;
  /** Unique identifier for this settings page */
  id: string;
  /** Display label shown in settings navigation */
  label: string;
  /** Route path relative to /settings */
  path: string;
  /** Sort order in settings navigation */
  order?: number;
}

/**
 * Container for all UI extension types from plugins.
 * This is the main data structure stored in context state.
 */
export interface PluginExtensionsData {
  /** Dashboard widget extensions from enabled plugins */
  dashboardWidgets: DashboardWidgetExtension[];
  /** Plugin pages for sidebar navigation */
  pages: PluginPageExtension[];
  /** Navigation menu extensions (future implementation) */
  navigation: NavigationExtension[];
  /** Settings page extensions (future implementation) */
  settingsPages: SettingsPageExtension[];
}

/**
 * The complete context value exposed to consumers.
 * Provides both data and control functions.
 */
export interface PluginExtensionsContextValue {
  /** All plugin UI extensions organized by type */
  extensions: PluginExtensionsData;
  /** True while fetching extensions from the API */
  isLoading: boolean;
  /** Error message if the last fetch failed, null otherwise */
  error: string | null;
  /** Re-fetch extensions from the API (call after plugin state changes) */
  refresh: () => Promise<void>;
  /** Unix timestamp of last successful refresh, null if never refreshed */
  lastRefresh: number | null;
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Empty extension data used as initial state and fallback.
 * Ensures all extension arrays are defined even before first fetch.
 */
const defaultExtensions: PluginExtensionsData = {
  dashboardWidgets: [],
  pages: [],
  navigation: [],
  settingsPages: [],
};

/**
 * Default context value used when provider is not present.
 * The refresh function is a no-op to prevent errors.
 */
const defaultContextValue: PluginExtensionsContextValue = {
  extensions: defaultExtensions,
  isLoading: true,
  error: null,
  refresh: async () => {},
  lastRefresh: null,
};

// =============================================================================
// CONTEXT CREATION
// =============================================================================

/**
 * React Context for plugin extensions.
 * Access this through the provided hooks, not directly.
 */
const PluginExtensionsContext = createContext<PluginExtensionsContextValue>(defaultContextValue);

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

/**
 * Props for the PluginExtensionsProvider component.
 */
interface PluginExtensionsProviderProps {
  /** Child components that will have access to plugin extensions */
  children: React.ReactNode;
  /** Skip the initial API fetch (useful for testing) */
  skipInitialFetch?: boolean;
}

/**
 * Provider component that fetches and manages plugin UI extensions.
 *
 * This component should wrap your app at a high level (typically in App.tsx)
 * to make plugin extension data available throughout the component tree.
 *
 * ## Behavior
 *
 * 1. On mount, fetches UI extensions from `/api/plugins/ui-extensions`
 * 2. Stores the response in state
 * 3. Provides a `refresh()` function for manual updates
 * 4. Handles loading and error states
 *
 * ## Performance
 *
 * - Uses `useCallback` to memoize the fetch function
 * - Uses `useMemo` to memoize the context value
 * - Only re-renders consumers when data actually changes
 *
 * @example
 * ```tsx
 * // In App.tsx
 * function App() {
 *   return (
 *     <PluginExtensionsProvider>
 *       <Router>
 *         <Routes />
 *       </Router>
 *     </PluginExtensionsProvider>
 *   );
 * }
 * ```
 */
export function PluginExtensionsProvider({
  children,
  skipInitialFetch = false,
}: PluginExtensionsProviderProps) {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------

  /** Current extension data from plugins */
  const [extensions, setExtensions] = useState<PluginExtensionsData>(defaultExtensions);

  /** Loading state - true during API calls */
  const [isLoading, setIsLoading] = useState(!skipInitialFetch);

  /** Error message from last failed fetch */
  const [error, setError] = useState<string | null>(null);

  /** Timestamp of last successful fetch */
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // FETCH LOGIC
  // ---------------------------------------------------------------------------

  /**
   * Fetches UI extensions from the backend API.
   *
   * This function:
   * 1. Sets loading state
   * 2. Calls the API endpoint
   * 3. Parses and stores the response
   * 4. Handles errors gracefully
   *
   * The function is memoized with useCallback to prevent unnecessary re-creation.
   */
  const fetchExtensions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the plugin repository API
      const response = await getPluginUIExtensions();

      if (response.success && response.data) {
        // Extract extension data from response
        // Note: navigation and settingsPages are future features,
        // so we use type casting as a temporary workaround
        setExtensions({
          dashboardWidgets: response.data.dashboardWidgets || [],
          pages: response.data.pages || [],
          navigation: (response.data as unknown as PluginExtensionsData).navigation || [],
          settingsPages: (response.data as unknown as PluginExtensionsData).settingsPages || [],
        });
        setLastRefresh(Date.now());
      } else {
        // API returned an error response
        setError(response.error || "Failed to fetch plugin extensions");
      }
    } catch (err) {
      // Network or parsing error
      setError(err instanceof Error ? err.message : "Failed to fetch plugin extensions");
    } finally {
      // Always clear loading state
      setIsLoading(false);
    }
  }, []);

  /**
   * Public refresh function exposed to consumers.
   * Call this after enabling or disabling plugins to update all components.
   */
  const refresh = useCallback(async () => {
    await fetchExtensions();
  }, [fetchExtensions]);

  // ---------------------------------------------------------------------------
  // EFFECTS
  // ---------------------------------------------------------------------------

  /**
   * Initial fetch on component mount.
   * Only runs if skipInitialFetch is false.
   */
  useEffect(() => {
    if (!skipInitialFetch) {
      fetchExtensions();
    }
  }, [fetchExtensions, skipInitialFetch]);

  // ---------------------------------------------------------------------------
  // CONTEXT VALUE
  // ---------------------------------------------------------------------------

  /**
   * Memoized context value to prevent unnecessary re-renders.
   * Only changes when any of the dependency values change.
   */
  const contextValue = useMemo<PluginExtensionsContextValue>(
    () => ({
      extensions,
      isLoading,
      error,
      refresh,
      lastRefresh,
    }),
    [extensions, isLoading, error, refresh, lastRefresh]
  );

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <PluginExtensionsContext.Provider value={contextValue}>
      {children}
    </PluginExtensionsContext.Provider>
  );
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to access the full plugin extensions context.
 *
 * Use this when you need access to all extension types or the refresh function.
 * For specific extension types, prefer the specialized hooks below.
 *
 * @throws Error if used outside of PluginExtensionsProvider
 *
 * @example
 * ```tsx
 * const { extensions, isLoading, refresh } = usePluginExtensions();
 * ```
 */
export function usePluginExtensions(): PluginExtensionsContextValue {
  const context = useContext(PluginExtensionsContext);
  if (!context) {
    throw new Error("usePluginExtensions must be used within a PluginExtensionsProvider");
  }
  return context;
}

/**
 * Hook to get dashboard widgets from enabled plugins.
 *
 * Returns only the widgets array plus loading/error states.
 * This is the most commonly used hook for the dashboard.
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { widgets, isLoading, error } = useDashboardWidgets();
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorMessage message={error} />;
 *
 *   return (
 *     <WidgetGrid>
 *       {widgets.map(widget => (
 *         <PluginWidget key={widget.widgetId} {...widget} />
 *       ))}
 *     </WidgetGrid>
 *   );
 * }
 * ```
 */
export function useDashboardWidgets(): {
  widgets: DashboardWidgetExtension[];
  isLoading: boolean;
  error: string | null;
} {
  const { extensions, isLoading, error } = usePluginExtensions();
  return {
    widgets: extensions.dashboardWidgets,
    isLoading,
    error,
  };
}

/**
 * Hook to get navigation items from enabled plugins.
 *
 * Used by the sidebar component to inject plugin menu items.
 * Note: This feature is planned for future implementation.
 *
 * @example
 * ```tsx
 * function Sidebar() {
 *   const { items, isLoading } = usePluginNavigation();
 *
 *   return (
 *     <nav>
 *       {items.map(item => (
 *         <NavLink key={item.id} to={item.path}>
 *           {item.label}
 *         </NavLink>
 *       ))}
 *     </nav>
 *   );
 * }
 * ```
 */
export function usePluginNavigation(): {
  items: NavigationExtension[];
  isLoading: boolean;
} {
  const { extensions, isLoading } = usePluginExtensions();
  return {
    items: extensions.navigation,
    isLoading,
  };
}

/**
 * Hook to get plugin pages for sidebar navigation.
 *
 * Returns pages from enabled plugins that have declared a page in their manifest.
 * Used by the Sidebar component to render the Plugins flyout menu.
 *
 * @example
 * ```tsx
 * function Sidebar() {
 *   const { pages, isLoading } = usePluginPages();
 *
 *   if (pages.length === 0) return null; // Don't show Plugins menu
 *
 *   return (
 *     <PluginsFlyout>
 *       {pages.map(page => (
 *         <MenuItem key={page.pluginId} to={`/plugins/${page.pluginId}`}>
 *           {page.title}
 *         </MenuItem>
 *       ))}
 *     </PluginsFlyout>
 *   );
 * }
 * ```
 */
export function usePluginPages(): {
  pages: PluginPageExtension[];
  isLoading: boolean;
} {
  const { extensions, isLoading } = usePluginExtensions();
  return {
    pages: extensions.pages,
    isLoading,
  };
}

/**
 * Hook to get settings pages from enabled plugins.
 *
 * Used by the Settings page to render plugin configuration tabs.
 * Note: This feature is planned for future implementation.
 *
 * @example
 * ```tsx
 * function SettingsPage() {
 *   const pluginPages = usePluginSettingsPages();
 *
 *   return (
 *     <TabList>
 *       {pluginPages.map(page => (
 *         <Tab key={page.id} to={page.path}>
 *           {page.label}
 *         </Tab>
 *       ))}
 *     </TabList>
 *   );
 * }
 * ```
 */
export function usePluginSettingsPages(): SettingsPageExtension[] {
  const { extensions } = usePluginExtensions();
  return extensions.settingsPages;
}

/**
 * Hook to get the refresh function for plugin extensions.
 *
 * Call this function after enabling or disabling plugins to update
 * all components that use plugin extension hooks.
 *
 * @example
 * ```tsx
 * function PluginToggle({ pluginId }: { pluginId: string }) {
 *   const refresh = useRefreshPluginExtensions();
 *
 *   const handleEnable = async () => {
 *     await enablePlugin(pluginId);
 *     await refresh(); // Updates all components using plugin hooks
 *   };
 *
 *   return <button onClick={handleEnable}>Enable</button>;
 * }
 * ```
 */
export function useRefreshPluginExtensions(): () => Promise<void> {
  const { refresh } = usePluginExtensions();
  return refresh;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { PluginExtensionsContext };
