/**
 * @fileoverview Plugin Widget Renderer
 *
 * This component renders dashboard widgets contributed by enabled plugins.
 * It acts as the bridge between the plugin system and the React UI, mapping
 * widget extension data to the appropriate template components.
 *
 * ## How It Works
 *
 * 1. Uses the `useDashboardWidgets()` hook to get widget extensions from context
 * 2. For each widget, looks up the corresponding template component
 * 3. Renders the template with the plugin's endpoint and configuration
 * 4. The template fetches data from the plugin's API endpoint
 *
 * ## Available Widget Templates
 *
 * | Template       | Description                                    | Use Case                    |
 * |----------------|------------------------------------------------|-----------------------------|
 * | activity-feed  | Activity log with avatars and timestamps       | Recent changes, audit logs  |
 * | list           | Generic list with icons and descriptions       | Tasks, notifications        |
 * | stats-card     | Single metric with change indicator            | KPIs, counts                |
 * | table          | Tabular data with columns and rows             | Data grids, reports         |
 * | chart          | Bar, line, pie, donut charts (Recharts)        | Analytics, trends           |
 * | timeline       | Chronological events with icons                | History, milestones         |
 * | progress       | Circular, linear, gauge progress indicators    | Completion tracking         |
 * | alerts         | Severity-based notifications                   | Warnings, critical issues   |
 * | calendar       | Read-only calendar with events                 | Deadlines, schedules        |
 * | card-grid      | Multiple mini stats cards in a grid            | Dashboard overview          |
 *
 * ## Plugin Integration
 *
 * Plugins register widgets in their manifest:
 *
 * ```json
 * {
 *   "uiExtensions": {
 *     "dashboardWidgets": [{
 *       "id": "my-widget",
 *       "template": "stats-card",
 *       "title": "Total Items",
 *       "endpoint": "/dashboard/widget"
 *     }]
 *   }
 * }
 * ```
 *
 * The endpoint is relative to `/api/plugins/{pluginId}`.
 *
 * @module components/PluginWidgets/PluginWidgetRenderer
 */

import { Box, Typography, CircularProgress, Stack } from "@mui/material";
import { useDashboardWidgets } from "../../../application/contexts/PluginExtensions.context";
import ActivityFeedWidget from "./ActivityFeedWidget";
import {
  ListWidget,
  StatsCardWidget,
  TableWidget,
  ChartWidget,
  TimelineWidget,
  ProgressWidget,
  AlertsWidget,
  CalendarWidget,
  CardGridWidget,
} from "./templates";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Props for the PluginWidgetRenderer component.
 */
interface PluginWidgetRendererProps {
  /** Location where widgets should be rendered (currently only "dashboard") */
  location: "dashboard";
}

/**
 * Common props interface passed to all widget template components.
 * Templates receive these props and use them to fetch data and configure rendering.
 */
interface WidgetTemplateProps {
  /** ID of the plugin that provides this widget */
  pluginId: string;
  /** API endpoint to fetch widget data (relative to /api/plugins/{pluginId}) */
  endpoint: string;
  /** Display title for the widget header */
  title?: string;
  /** Template-specific configuration options */
  config?: Record<string, unknown>;
}

// =============================================================================
// TEMPLATE REGISTRY
// =============================================================================

/**
 * Registry mapping template names to their React components.
 *
 * This is the central registry that determines which component renders
 * for each template type. To add a new template:
 *
 * 1. Create the template component in ./templates/
 * 2. Import it above
 * 3. Add an entry to this registry
 *
 * Template components receive WidgetTemplateProps and are responsible for:
 * - Fetching data from the plugin's endpoint
 * - Rendering the data using the template's visual style
 * - Handling loading and error states
 */
const widgetTemplates: Record<string, React.ComponentType<WidgetTemplateProps>> = {
  // Activity and lists
  "activity-feed": ActivityFeedWidget,  // Timeline of recent activities with avatars
  "list": ListWidget,                   // Generic list with icons and descriptions

  // Metrics and stats
  "stats-card": StatsCardWidget,        // Single metric with trend indicator
  "card-grid": CardGridWidget,          // Multiple mini stat cards in a grid

  // Data visualization
  "table": TableWidget,                 // Tabular data with sortable columns
  "chart": ChartWidget,                 // Bar, line, pie, donut charts
  "progress": ProgressWidget,           // Circular, linear, gauge indicators

  // Time-based
  "timeline": TimelineWidget,           // Chronological events with milestones
  "calendar": CalendarWidget,           // Month view with events

  // Notifications
  "alerts": AlertsWidget,               // Severity-based alert notifications
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Returns an array of all available template names.
 *
 * Use this to display available options in the UI or for validation.
 *
 * @returns Array of template name strings
 *
 * @example
 * ```typescript
 * const templates = getAvailableTemplates();
 * // ["activity-feed", "list", "stats-card", ...]
 * ```
 */
export function getAvailableTemplates(): string[] {
  return Object.keys(widgetTemplates);
}

/**
 * Checks if a template with the given name exists in the registry.
 *
 * @param templateName - Name of the template to check
 * @returns True if the template exists, false otherwise
 *
 * @example
 * ```typescript
 * if (hasTemplate('stats-card')) {
 *   // Template is available
 * }
 * ```
 */
export function hasTemplate(templateName: string): boolean {
  return templateName in widgetTemplates;
}

/**
 * Retrieves a template component by name.
 *
 * @param templateName - Name of the template to retrieve
 * @returns The template component, or null if not found
 *
 * @example
 * ```typescript
 * const Template = getTemplate('chart');
 * if (Template) {
 *   return <Template pluginId="..." endpoint="..." />;
 * }
 * ```
 */
export function getTemplate(templateName: string): React.ComponentType<WidgetTemplateProps> | null {
  return widgetTemplates[templateName] || null;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Renders all dashboard widgets from enabled plugins.
 *
 * This component:
 * 1. Gets widget extensions from the PluginExtensionsContext
 * 2. Maps each widget to its corresponding template component
 * 3. Renders widgets in a vertical stack with spacing
 * 4. Shows loading state while context is fetching
 * 5. Shows fallback for unknown templates
 *
 * ## Integration with Dashboard
 *
 * This component is typically placed in the dashboard layout:
 *
 * ```tsx
 * <Dashboard>
 *   <BuiltInWidgets />
 *   <PluginWidgetRenderer location="dashboard" />
 * </Dashboard>
 * ```
 *
 * ## Error Handling
 *
 * - If the context fails to load, renders nothing (graceful degradation)
 * - If no widgets are registered, renders nothing
 * - If a widget uses an unknown template, shows a helpful error message
 *
 * @param props - Component props
 * @param props.location - Currently only "dashboard" is supported
 */
const PluginWidgetRenderer: React.FC<PluginWidgetRendererProps> = ({ location: _location }) => {
  // ---------------------------------------------------------------------------
  // DATA FETCHING
  // ---------------------------------------------------------------------------

  // Get widget extensions from the shared context
  // This avoids duplicate API calls when multiple components need widget data
  const { widgets, isLoading, error } = useDashboardWidgets();

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------

  // Show a loading spinner while the context is fetching extensions
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <CircularProgress size={20} sx={{ color: "#13715B" }} />
      </Box>
    );
  }

  // ---------------------------------------------------------------------------
  // ERROR HANDLING
  // ---------------------------------------------------------------------------

  // If there's an error, fail silently (don't break the dashboard)
  // The error is logged by the context and could be shown elsewhere
  if (error) {
    return null;
  }

  // If no plugins have registered widgets, render nothing
  if (widgets.length === 0) {
    return null;
  }

  // ---------------------------------------------------------------------------
  // RENDER WIDGETS
  // ---------------------------------------------------------------------------

  return (
    <Stack spacing={2}>
      {widgets.map((widget) => {
        // Look up the template component for this widget
        const WidgetComponent = widgetTemplates[widget.template];

        // Handle unknown template names gracefully
        // This helps plugin developers debug issues
        if (!WidgetComponent) {
          return (
            <Box
              key={widget.widgetId}
              sx={{
                border: "1px solid #d0d5dd",
                borderRadius: "4px",
                p: 2,
                backgroundColor: "#fff",
              }}
            >
              <Typography sx={{ fontSize: 13, color: "#666" }}>
                Unknown widget template: {widget.template}
              </Typography>
              <Typography sx={{ fontSize: 11, color: "#999", mt: 0.5 }}>
                Available templates: {getAvailableTemplates().join(", ")}
              </Typography>
            </Box>
          );
        }

        // Render the widget using the appropriate template
        // Each template is responsible for fetching its own data
        return (
          <WidgetComponent
            key={widget.widgetId}
            pluginId={widget.pluginId}
            endpoint={widget.endpoint}
            title={widget.title}
            config={widget.config}
          />
        );
      })}
    </Stack>
  );
};

export default PluginWidgetRenderer;
