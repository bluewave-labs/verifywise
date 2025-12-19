import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Layouts } from 'react-grid-layout';
import {
  DashboardConfig,
  DashboardState,
  DashboardContextValue,
  WidgetConfig,
  LayoutPersistence,
} from '../../../../domain/interfaces/i.dashboard';

// Local storage keys
const STORAGE_KEYS = {
  LAYOUTS: 'verifywise_dashboard_layouts',
  PREFERENCES: 'verifywise_dashboard_preferences',
  WIDGETS: 'verifywise_dashboard_widgets',
};

// Dashboard Context
const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

// Dashboard Provider Props
interface DashboardProviderProps {
  children: ReactNode;
  projectId: string;
  dashboardId?: string;
  userId: string;
  initialConfig?: DashboardConfig;
}

// Dashboard Provider Component
export const DashboardProvider: React.FC<DashboardProviderProps> = ({
  children,
  projectId,
  dashboardId = 'default',
  userId,
  initialConfig,
}) => {
  // Initial state
  const [state, setState] = useState<DashboardState>({
    config: initialConfig || null,
    widgets: new Map(),
    editMode: false,
    loading: false,
    error: null,
    isDirty: false,
  });

  // Load persisted layouts from localStorage
  const loadPersistedLayouts = useCallback((): Layouts | null => {
    try {
      const key = `${STORAGE_KEYS.LAYOUTS}_${projectId}_${dashboardId}_${userId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed: LayoutPersistence = JSON.parse(stored);
        return parsed.layouts;
      }
    } catch (error) {
      console.error('Failed to load persisted layouts:', error);
    }
    return null;
  }, [projectId, dashboardId, userId]);

  // Save layouts to localStorage
  const saveLayoutsToStorage = useCallback(
    (layouts: Layouts) => {
      try {
        const key = `${STORAGE_KEYS.LAYOUTS}_${projectId}_${dashboardId}_${userId}`;
        const persistence: LayoutPersistence = {
          version: '1.0.0',
          projectId,
          dashboardId,
          userId,
          layouts,
          widgets: state.config?.widgets.map(w => w.id) || [],
          lastModified: new Date().toISOString(),
        };
        localStorage.setItem(key, JSON.stringify(persistence));
      } catch (error) {
        console.error('Failed to save layouts:', error);
      }
    },
    [projectId, dashboardId, userId, state.config]
  );

  // Set edit mode
  const setEditMode = useCallback((editMode: boolean) => {
    setState(prev => ({ ...prev, editMode }));
  }, []);

  // Save layout
  const saveLayout = useCallback(
    async (layouts: Layouts) => {
      setState(prev => ({ ...prev, loading: true, isDirty: true }));

      try {
        // Save to localStorage
        saveLayoutsToStorage(layouts);

        // TODO: Save to backend API
        // await api.saveDashboardLayout(projectId, dashboardId, layouts);

        setState(prev => ({
          ...prev,
          loading: false,
          isDirty: false,
          config: prev.config ? {
            ...prev.config,
            layouts,
            updatedAt: new Date(),
          } : null,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error as Error,
        }));
        throw error;
      }
    },
    [saveLayoutsToStorage]
  );

  // Add widget
  const addWidget = useCallback((widget: WidgetConfig) => {
    setState(prev => {
      if (!prev.config) return prev;

      return {
        ...prev,
        isDirty: true,
        config: {
          ...prev.config,
          widgets: [...prev.config.widgets, widget],
        },
      };
    });
  }, []);

  // Remove widget
  const removeWidget = useCallback((widgetId: string) => {
    setState(prev => {
      if (!prev.config) return prev;

      const newWidgets = new Map(prev.widgets);
      newWidgets.delete(widgetId);

      return {
        ...prev,
        isDirty: true,
        config: {
          ...prev.config,
          widgets: prev.config.widgets.filter(w => w.id !== widgetId),
        },
        widgets: newWidgets,
      };
    });
  }, []);

  // Update widget
  const updateWidget = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    setState(prev => {
      if (!prev.config) return prev;

      return {
        ...prev,
        isDirty: true,
        config: {
          ...prev.config,
          widgets: prev.config.widgets.map(w =>
            w.id === widgetId ? { ...w, ...updates } : w
          ),
        },
      };
    });
  }, []);

  // Refresh widget data
  const refreshWidget = useCallback(async (widgetId: string) => {
    setState(prev => {
      const newWidgets = new Map(prev.widgets);
      const current = newWidgets.get(widgetId) || { widgetId, data: null, loading: false };
      newWidgets.set(widgetId, { ...current, loading: true, error: null });
      return { ...prev, widgets: newWidgets };
    });

    try {
      // TODO: Fetch widget data from API based on widget type
      // const data = await api.getWidgetData(widgetId);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockData = { value: Math.floor(Math.random() * 100) };

      setState(prev => {
        const newWidgets = new Map(prev.widgets);
        newWidgets.set(widgetId, {
          widgetId,
          data: mockData,
          loading: false,
          error: null,
          lastUpdated: new Date(),
        });
        return { ...prev, widgets: newWidgets };
      });
    } catch (error) {
      setState(prev => {
        const newWidgets = new Map(prev.widgets);
        newWidgets.set(widgetId, {
          widgetId,
          data: null,
          loading: false,
          error: error as Error,
        });
        return { ...prev, widgets: newWidgets };
      });
    }
  }, []);

  // Refresh all widgets
  const refreshAllWidgets = useCallback(async () => {
    if (!state.config) return;

    const promises = state.config.widgets.map(widget => refreshWidget(widget.id));
    await Promise.all(promises);
  }, [state.config, refreshWidget]);

  // Reset layout to default
  const resetLayout = useCallback(() => {
    if (!initialConfig) return;

    setState(prev => ({
      ...prev,
      config: initialConfig,
      isDirty: false,
    }));

    // Clear localStorage
    const key = `${STORAGE_KEYS.LAYOUTS}_${projectId}_${dashboardId}_${userId}`;
    localStorage.removeItem(key);
  }, [initialConfig, projectId, dashboardId, userId]);

  // Export dashboard configuration
  const exportDashboard = useCallback(() => {
    if (!state.config) return;

    const exportData = JSON.stringify(state.config, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_${dashboardId}_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.config, dashboardId]);

  // Import dashboard configuration
  const importDashboard = useCallback((config: DashboardConfig) => {
    setState(prev => ({
      ...prev,
      config,
      isDirty: true,
    }));
  }, []);

  // Load persisted layouts on mount
  useEffect(() => {
    const persistedLayouts = loadPersistedLayouts();
    if (persistedLayouts && state.config) {
      setState(prev => ({
        ...prev,
        config: prev.config ? {
          ...prev.config,
          layouts: persistedLayouts,
        } : null,
      }));
    }
  }, []);

  // Context value
  const contextValue: DashboardContextValue = {
    state,
    actions: {
      setEditMode,
      saveLayout,
      addWidget,
      removeWidget,
      updateWidget,
      refreshWidget,
      refreshAllWidgets,
      resetLayout,
      exportDashboard,
      importDashboard,
    },
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

// Custom hook to use dashboard context
export const useDashboardContext = (): DashboardContextValue => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboardContext must be used within DashboardProvider');
  }
  return context;
};

export default DashboardContext;