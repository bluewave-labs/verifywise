/**
 * Plugin Widget Renderer
 *
 * Renders UI extensions from enabled plugins using the appropriate
 * widget templates. Uses the PluginExtensionsContext for shared state.
 *
 * Available Templates:
 * - "activity-feed" - Activity log with avatars and timestamps
 * - "list" - Generic list of items with icons
 * - "stats-card" - Single metric card with change indicator
 * - "table" - Tabular data display
 * - "chart" - Bar, line, pie, and donut charts (Recharts)
 * - "timeline" - Chronological events with icons and avatars
 * - "progress" - Circular, linear, gauge, and multi-progress indicators
 * - "alerts" - Critical notifications and warnings with severity levels
 * - "calendar" - Read-only calendar with events and deadlines
 * - "card-grid" - Multiple mini stats cards in a responsive grid
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

interface PluginWidgetRendererProps {
  location: "dashboard";
}

// Common props interface for all widget templates
interface WidgetTemplateProps {
  pluginId: string;
  endpoint: string;
  title?: string;
  config?: Record<string, unknown>;
}

// Widget template registry - maps template names to components
const widgetTemplates: Record<string, React.ComponentType<WidgetTemplateProps>> = {
  "activity-feed": ActivityFeedWidget,
  "list": ListWidget,
  "stats-card": StatsCardWidget,
  "table": TableWidget,
  "chart": ChartWidget,
  "timeline": TimelineWidget,
  "progress": ProgressWidget,
  "alerts": AlertsWidget,
  "calendar": CalendarWidget,
  "card-grid": CardGridWidget,
};

/**
 * Get available template names for documentation
 */
export function getAvailableTemplates(): string[] {
  return Object.keys(widgetTemplates);
}

/**
 * Check if a template exists
 */
export function hasTemplate(templateName: string): boolean {
  return templateName in widgetTemplates;
}

/**
 * Get a template component by name
 */
export function getTemplate(templateName: string): React.ComponentType<WidgetTemplateProps> | null {
  return widgetTemplates[templateName] || null;
}

const PluginWidgetRenderer: React.FC<PluginWidgetRendererProps> = ({ location: _location }) => {
  // Use shared context instead of local fetch
  const { widgets, isLoading, error } = useDashboardWidgets();

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <CircularProgress size={20} sx={{ color: "#13715B" }} />
      </Box>
    );
  }

  if (error) {
    return null;
  }

  if (widgets.length === 0) {
    return null;
  }

  return (
    <Stack spacing={2}>
      {widgets.map((widget) => {
        const WidgetComponent = widgetTemplates[widget.template];

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
