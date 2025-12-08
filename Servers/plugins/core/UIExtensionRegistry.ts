/**
 * VerifyWise Plugin System - UI Extension Registry
 *
 * Manages UI extensions from plugins including navigation items,
 * dashboard widgets, settings pages, routes, and detail tabs.
 */

// =============================================================================
// UI EXTENSION TYPES
// =============================================================================

export interface NavigationExtension {
  id: string;
  pluginId: string;
  label: string;
  icon: string;
  path: string;
  order?: number;
  parent?: string;
  requiredPermissions?: string[];
  badge?: {
    type: "count" | "dot" | "text";
    value?: number | string;
    color?: string;
  };
}

export interface DashboardWidgetExtension {
  id: string;
  pluginId: string;
  title: string;
  description?: string;
  componentPath: string; // Path to the component file
  defaultSize: "small" | "medium" | "large" | "full";
  defaultPosition?: { x: number; y: number };
  refreshInterval?: number;
  requiredPermissions?: string[];
  configSchema?: Record<string, unknown>;
}

export interface SettingsPageExtension {
  id: string;
  pluginId: string;
  title: string;
  description?: string;
  icon?: string;
  path: string;
  componentPath: string;
  order?: number;
  requiredPermissions?: string[];
}

export interface RouteExtension {
  id: string;
  pluginId: string;
  path: string;
  componentPath: string;
  exact?: boolean;
  requiredPermissions?: string[];
  layout?: "default" | "minimal" | "none";
}

export type DetailTabEntityType =
  | "project"
  | "risk"
  | "vendor"
  | "model"
  | "user"
  | "framework";

export interface DetailTabExtension {
  id: string;
  pluginId: string;
  entityType: DetailTabEntityType;
  label: string;
  icon?: string;
  componentPath: string;
  order?: number;
  requiredPermissions?: string[];
}

export interface PluginUIExtensions {
  navigation?: Omit<NavigationExtension, "pluginId">[];
  dashboardWidgets?: Omit<DashboardWidgetExtension, "pluginId">[];
  settingsPages?: Omit<SettingsPageExtension, "pluginId">[];
  routes?: Omit<RouteExtension, "pluginId">[];
  detailTabs?: Omit<DetailTabExtension, "pluginId">[];
}

export interface UIExtensionManifest {
  pluginId: string;
  navigation: NavigationExtension[];
  dashboardWidgets: DashboardWidgetExtension[];
  settingsPages: SettingsPageExtension[];
  routes: RouteExtension[];
  detailTabs: DetailTabExtension[];
}

// =============================================================================
// UI EXTENSION REGISTRY
// =============================================================================

export class UIExtensionRegistry {
  private extensions: Map<string, PluginUIExtensions> = new Map();
  private permissionChecker: ((userRole: string, required: string[]) => boolean) | null = null;

  /**
   * Set the permission checker function
   */
  setPermissionChecker(
    checker: (userRole: string, required: string[]) => boolean
  ): void {
    this.permissionChecker = checker;
  }

  /**
   * Register UI extensions for a plugin
   */
  register(pluginId: string, ui: PluginUIExtensions): void {
    this.extensions.set(pluginId, ui);
  }

  /**
   * Unregister UI extensions for a plugin
   */
  unregister(pluginId: string): void {
    this.extensions.delete(pluginId);
  }

  /**
   * Check if a plugin has registered UI extensions
   */
  has(pluginId: string): boolean {
    return this.extensions.has(pluginId);
  }

  /**
   * Get all navigation items visible to a user role
   */
  getNavigationItems(userRole?: string): NavigationExtension[] {
    const items: NavigationExtension[] = [];

    for (const [pluginId, ui] of Array.from(this.extensions.entries())) {
      if (ui.navigation) {
        for (const nav of ui.navigation) {
          if (this.hasPermission(userRole, nav.requiredPermissions)) {
            items.push({ ...nav, pluginId });
          }
        }
      }
    }

    return items.sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
  }

  /**
   * Get all dashboard widgets visible to a user role
   */
  getDashboardWidgets(userRole?: string): DashboardWidgetExtension[] {
    const widgets: DashboardWidgetExtension[] = [];

    for (const [pluginId, ui] of Array.from(this.extensions.entries())) {
      if (ui.dashboardWidgets) {
        for (const widget of ui.dashboardWidgets) {
          if (this.hasPermission(userRole, widget.requiredPermissions)) {
            widgets.push({ ...widget, pluginId });
          }
        }
      }
    }

    return widgets;
  }

  /**
   * Get all settings pages visible to a user role
   */
  getSettingsPages(userRole?: string): SettingsPageExtension[] {
    const pages: SettingsPageExtension[] = [];

    for (const [pluginId, ui] of Array.from(this.extensions.entries())) {
      if (ui.settingsPages) {
        for (const page of ui.settingsPages) {
          if (this.hasPermission(userRole, page.requiredPermissions)) {
            pages.push({ ...page, pluginId });
          }
        }
      }
    }

    return pages.sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
  }

  /**
   * Get all routes from plugins
   */
  getRoutes(userRole?: string): RouteExtension[] {
    const routes: RouteExtension[] = [];

    for (const [pluginId, ui] of Array.from(this.extensions.entries())) {
      if (ui.routes) {
        for (const route of ui.routes) {
          if (this.hasPermission(userRole, route.requiredPermissions)) {
            routes.push({ ...route, pluginId });
          }
        }
      }
    }

    return routes;
  }

  /**
   * Get detail tabs for a specific entity type
   */
  getDetailTabs(
    entityType: DetailTabEntityType,
    userRole?: string
  ): DetailTabExtension[] {
    const tabs: DetailTabExtension[] = [];

    for (const [pluginId, ui] of Array.from(this.extensions.entries())) {
      if (ui.detailTabs) {
        for (const tab of ui.detailTabs) {
          if (
            tab.entityType === entityType &&
            this.hasPermission(userRole, tab.requiredPermissions)
          ) {
            tabs.push({ ...tab, pluginId });
          }
        }
      }
    }

    return tabs.sort((a, b) => (a.order ?? 50) - (b.order ?? 50));
  }

  /**
   * Get complete UI extension manifest for all plugins
   */
  getAllExtensions(): UIExtensionManifest[] {
    const manifests: UIExtensionManifest[] = [];

    for (const [pluginId, ui] of Array.from(this.extensions.entries())) {
      manifests.push({
        pluginId,
        navigation: (ui.navigation || []).map((n) => ({ ...n, pluginId })),
        dashboardWidgets: (ui.dashboardWidgets || []).map((w) => ({
          ...w,
          pluginId,
        })),
        settingsPages: (ui.settingsPages || []).map((p) => ({ ...p, pluginId })),
        routes: (ui.routes || []).map((r) => ({ ...r, pluginId })),
        detailTabs: (ui.detailTabs || []).map((t) => ({ ...t, pluginId })),
      });
    }

    return manifests;
  }

  /**
   * Get UI extensions for a specific plugin
   */
  getPluginExtensions(pluginId: string): PluginUIExtensions | undefined {
    return this.extensions.get(pluginId);
  }

  /**
   * Get stats about registered UI extensions
   */
  getStats(): {
    totalPlugins: number;
    navigationItems: number;
    dashboardWidgets: number;
    settingsPages: number;
    routes: number;
    detailTabs: number;
  } {
    let navigationItems = 0;
    let dashboardWidgets = 0;
    let settingsPages = 0;
    let routes = 0;
    let detailTabs = 0;

    for (const ui of Array.from(this.extensions.values())) {
      navigationItems += ui.navigation?.length ?? 0;
      dashboardWidgets += ui.dashboardWidgets?.length ?? 0;
      settingsPages += ui.settingsPages?.length ?? 0;
      routes += ui.routes?.length ?? 0;
      detailTabs += ui.detailTabs?.length ?? 0;
    }

    return {
      totalPlugins: this.extensions.size,
      navigationItems,
      dashboardWidgets,
      settingsPages,
      routes,
      detailTabs,
    };
  }

  /**
   * Clear all registered extensions
   */
  clear(): void {
    this.extensions.clear();
  }

  /**
   * Check if user has required permissions
   */
  private hasPermission(userRole?: string, required?: string[]): boolean {
    if (!required || required.length === 0) {
      return true;
    }

    if (!userRole) {
      return false;
    }

    if (this.permissionChecker) {
      return this.permissionChecker(userRole, required);
    }

    // Default: admin has all permissions
    return userRole === "admin";
  }
}

// Singleton instance
export const uiExtensionRegistry = new UIExtensionRegistry();
