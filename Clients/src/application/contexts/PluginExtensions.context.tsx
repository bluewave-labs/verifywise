/**
 * Plugin Extensions Context
 *
 * Provides plugin UI extension data to all components in the app.
 * Fetches data once on load and provides a refresh function for updates.
 *
 * Usage:
 * 1. Wrap app with <PluginExtensionsProvider>
 * 2. Use hooks: useDashboardWidgets(), usePluginNavigation(), etc.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  getPluginUIExtensions,
  DashboardWidgetExtension,
} from "../repository/plugin.repository";

// Navigation extension from plugins
export interface NavigationExtension {
  pluginId: string;
  id: string;
  label: string;
  icon?: string;
  path: string;
  group?: string;
  order?: number;
  roles?: string[];
}

// Settings page extension from plugins
export interface SettingsPageExtension {
  pluginId: string;
  id: string;
  label: string;
  path: string;
  order?: number;
}

// All UI extensions data
export interface PluginExtensionsData {
  dashboardWidgets: DashboardWidgetExtension[];
  navigation: NavigationExtension[];
  settingsPages: SettingsPageExtension[];
}

// Context value interface
export interface PluginExtensionsContextValue {
  /** All plugin UI extensions */
  extensions: PluginExtensionsData;
  /** Whether extensions are currently loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refresh extensions (call after enabling/disabling plugins) */
  refresh: () => Promise<void>;
  /** Last refresh timestamp */
  lastRefresh: number | null;
}

// Default empty state
const defaultExtensions: PluginExtensionsData = {
  dashboardWidgets: [],
  navigation: [],
  settingsPages: [],
};

// Create context with default values
const PluginExtensionsContext = createContext<PluginExtensionsContextValue>({
  extensions: defaultExtensions,
  isLoading: true,
  error: null,
  refresh: async () => {},
  lastRefresh: null,
});

// Provider props
interface PluginExtensionsProviderProps {
  children: React.ReactNode;
  /** Skip initial fetch (for testing) */
  skipInitialFetch?: boolean;
}

/**
 * Plugin Extensions Provider
 *
 * Wraps the app and provides plugin UI extension data to all components.
 */
export function PluginExtensionsProvider({
  children,
  skipInitialFetch = false,
}: PluginExtensionsProviderProps) {
  const [extensions, setExtensions] = useState<PluginExtensionsData>(defaultExtensions);
  const [isLoading, setIsLoading] = useState(!skipInitialFetch);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);

  // Fetch extensions from API
  const fetchExtensions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getPluginUIExtensions();

      if (response.success && response.data) {
        setExtensions({
          dashboardWidgets: response.data.dashboardWidgets || [],
          // These will be added when backend supports them
          navigation: (response.data as unknown as PluginExtensionsData).navigation || [],
          settingsPages: (response.data as unknown as PluginExtensionsData).settingsPages || [],
        });
        setLastRefresh(Date.now());
      } else {
        setError(response.error || "Failed to fetch plugin extensions");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch plugin extensions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh function exposed to consumers
  const refresh = useCallback(async () => {
    await fetchExtensions();
  }, [fetchExtensions]);

  // Initial fetch on mount
  useEffect(() => {
    if (!skipInitialFetch) {
      fetchExtensions();
    }
  }, [fetchExtensions, skipInitialFetch]);

  // Memoize context value to prevent unnecessary re-renders
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

  return (
    <PluginExtensionsContext.Provider value={contextValue}>
      {children}
    </PluginExtensionsContext.Provider>
  );
}

/**
 * Hook to access the full plugin extensions context
 */
export function usePluginExtensions(): PluginExtensionsContextValue {
  const context = useContext(PluginExtensionsContext);
  if (!context) {
    throw new Error("usePluginExtensions must be used within a PluginExtensionsProvider");
  }
  return context;
}

/**
 * Hook to get dashboard widgets from plugins
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
 * Hook to get navigation items from plugins
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
 * Hook to get settings pages from plugins
 */
export function usePluginSettingsPages(): SettingsPageExtension[] {
  const { extensions } = usePluginExtensions();
  return extensions.settingsPages;
}

/**
 * Hook to get the refresh function
 * Call this after enabling/disabling plugins to update all components
 */
export function useRefreshPluginExtensions(): () => Promise<void> {
  const { refresh } = usePluginExtensions();
  return refresh;
}

export { PluginExtensionsContext };
