/**
 * @fileoverview Plugin Page Component
 *
 * Renders plugin-provided pages based on their configured display type.
 * Supports three rendering modes:
 *
 * 1. **Template**: Uses built-in widget templates (table, list, chart, etc.)
 * 2. **Iframe**: Embeds an external URL in an iframe
 * 3. **API**: Fetches custom React content from a plugin API endpoint
 *
 * ## Route
 *
 * This component is rendered at `/plugins/:pluginId`
 *
 * ## Data Flow
 *
 * 1. Gets pluginId from URL params
 * 2. Fetches plugin page config from context
 * 3. Renders content based on page.type
 *
 * @module pages/PluginPage
 */

import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, IconButton } from "@mui/material";
import { ArrowLeft, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { usePluginPages } from "../../../application/contexts/PluginExtensions.context";
import { useState, useEffect, useCallback } from "react";
import { apiServices } from "../../../infrastructure/api/networkServices";

// Import widget templates
import TableWidget from "../../components/PluginWidgets/templates/TableWidget";
import ListWidget from "../../components/PluginWidgets/templates/ListWidget";
import ChartWidget from "../../components/PluginWidgets/templates/ChartWidget";
import StatsCardWidget from "../../components/PluginWidgets/templates/StatsCardWidget";
import TimelineWidget from "../../components/PluginWidgets/templates/TimelineWidget";
import CalendarWidget from "../../components/PluginWidgets/templates/CalendarWidget";
import AlertsWidget from "../../components/PluginWidgets/templates/AlertsWidget";
import CardGridWidget from "../../components/PluginWidgets/templates/CardGridWidget";
import ProgressWidget from "../../components/PluginWidgets/templates/ProgressWidget";
import EmptyPageTemplate from "../../components/PluginWidgets/templates/EmptyPageTemplate";

/**
 * Template registry mapping template names to components.
 * Plugins specify one of these template names in their manifest.
 */
const TEMPLATE_REGISTRY: Record<string, React.ComponentType<{
  pluginId: string;
  endpoint: string;
  title?: string;
  config?: Record<string, unknown>;
}>> = {
  table: TableWidget,
  list: ListWidget,
  chart: ChartWidget,
  "stats-card": StatsCardWidget,
  timeline: TimelineWidget,
  calendar: CalendarWidget,
  alerts: AlertsWidget,
  "card-grid": CardGridWidget,
  progress: ProgressWidget,
};

/**
 * Templates that require the full page context (pluginName, description, icon).
 * These templates are rendered differently from standard widget templates.
 */
const FULL_PAGE_TEMPLATES = ["empty-page"];

/**
 * Props for the PluginPage component.
 */
interface PluginPageProps {
  /** Optional override for pluginId (useful for testing) */
  pluginIdOverride?: string;
}

/**
 * API content response structure.
 * Used when page type is "api".
 */
interface ApiContentResponse {
  success: boolean;
  data?: {
    html?: string;
    title?: string;
    styles?: string;
  };
  error?: string;
}

/**
 * Plugin Page component that renders plugin-provided pages.
 *
 * @example
 * ```tsx
 * // In routes.tsx
 * <Route path="/plugins/:pluginId" element={<PluginPage />} />
 * ```
 */
const PluginPage: React.FC<PluginPageProps> = ({ pluginIdOverride }) => {
  const { pluginId: urlPluginId } = useParams<{ pluginId: string }>();
  const pluginId = pluginIdOverride || urlPluginId;
  const navigate = useNavigate();
  const { pages, isLoading: pagesLoading } = usePluginPages();

  // State for API-loaded content
  const [apiContent, setApiContent] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Find the page configuration for this plugin
  const page = pages.find((p) => p.pluginId === pluginId);

  /**
   * Fetches content from plugin API endpoint (for "api" type pages).
   */
  const fetchApiContent = useCallback(async () => {
    if (!page || page.type !== "api" || !page.apiEndpoint) return;

    setApiLoading(true);
    setApiError(null);

    try {
      const response = await apiServices.get<ApiContentResponse>(
        `/plugins/${pluginId}${page.apiEndpoint}`
      );

      if (response.data.success && response.data.data?.html) {
        setApiContent(response.data.data.html);
      } else {
        setApiError(response.data.error || "Failed to load page content");
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to load page content");
    } finally {
      setApiLoading(false);
    }
  }, [page, pluginId]);

  // Fetch API content when page type is "api"
  useEffect(() => {
    if (page?.type === "api") {
      fetchApiContent();
    }
  }, [page, fetchApiContent]);

  // Loading state
  if (pagesLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          minHeight: 400,
        }}
      >
        <CircularProgress size={32} sx={{ color: "#13715B" }} />
      </Box>
    );
  }

  // Plugin page not found
  if (!page) {
    return (
      <Box sx={{ p: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} size="small">
            <ArrowLeft size={20} />
          </IconButton>
          <Typography sx={{ fontSize: 18, fontWeight: 600 }}>
            Plugin not found
          </Typography>
        </Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 8,
            backgroundColor: "#f9fafb",
            borderRadius: 2,
            border: "1px solid #d0d5dd",
          }}
        >
          <AlertCircle size={48} color="#9ca3af" />
          <Typography sx={{ mt: 2, fontSize: 16, fontWeight: 500, color: "#374151" }}>
            Plugin page not available
          </Typography>
          <Typography sx={{ mt: 1, fontSize: 14, color: "#6b7280" }}>
            The plugin "{pluginId}" doesn't have a page configured or is not enabled.
          </Typography>
          <Box
            onClick={() => navigate("/")}
            sx={{
              mt: 3,
              px: 3,
              py: 1,
              backgroundColor: "#13715B",
              color: "#fff",
              borderRadius: 1,
              fontSize: 14,
              cursor: "pointer",
              "&:hover": { backgroundColor: "#0f5f4c" },
            }}
          >
            Go to dashboard
          </Box>
        </Box>
      </Box>
    );
  }

  /**
   * Renders the page header with back navigation and title.
   */
  const renderHeader = () => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 3,
        pb: 2,
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <IconButton
          onClick={() => navigate(-1)}
          size="small"
          sx={{
            backgroundColor: "#f3f4f6",
            "&:hover": { backgroundColor: "#e5e7eb" },
          }}
        >
          <ArrowLeft size={18} />
        </IconButton>
        <Box>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#111827" }}>
            {page.title}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#6b7280" }}>
            {page.pluginName}
          </Typography>
        </Box>
      </Box>

      {page.type === "api" && (
        <IconButton
          onClick={fetchApiContent}
          size="small"
          disabled={apiLoading}
          sx={{ color: "#6b7280" }}
        >
          <RefreshCw size={16} className={apiLoading ? "animate-spin" : ""} />
        </IconButton>
      )}
    </Box>
  );

  /**
   * Renders template-based page content.
   */
  const renderTemplateContent = () => {
    if (!page.template) {
      return (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography sx={{ color: "#6b7280" }}>
            No template specified for this plugin page.
          </Typography>
        </Box>
      );
    }

    // Handle full-page templates (like empty-page) that need extra props
    if (FULL_PAGE_TEMPLATES.includes(page.template)) {
      if (page.template === "empty-page") {
        return (
          <EmptyPageTemplate
            pluginId={pluginId || ""}
            pluginName={page.pluginName}
            title={page.title}
            description={page.description}
            icon={page.icon}
            endpoint={page.endpoint}
            config={page.config as Record<string, unknown>}
          />
        );
      }
    }

    // Handle standard widget templates
    const TemplateComponent = TEMPLATE_REGISTRY[page.template];
    if (!TemplateComponent) {
      return (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography sx={{ color: "#dc2626" }}>
            Unknown template: {page.template}
          </Typography>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          backgroundColor: "#fff",
          border: "1px solid #d0d5dd",
          borderRadius: 2,
          minHeight: 400,
          overflow: "hidden",
        }}
      >
        <TemplateComponent
          pluginId={pluginId || ""}
          endpoint={page.endpoint || "/page"}
          title={page.title}
          config={page.config as Record<string, unknown>}
        />
      </Box>
    );
  };

  /**
   * Renders iframe-based page content.
   */
  const renderIframeContent = () => {
    if (!page.url) {
      return (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography sx={{ color: "#6b7280" }}>
            No URL specified for this plugin page.
          </Typography>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          position: "relative",
          backgroundColor: "#fff",
          border: "1px solid #d0d5dd",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 1,
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Typography sx={{ fontSize: 12, color: "#6b7280" }}>
            External content from {new URL(page.url).hostname}
          </Typography>
          <Box
            component="a"
            href={page.url}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              fontSize: 12,
              color: "#13715B",
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Open in new tab <ExternalLink size={12} />
          </Box>
        </Box>
        <iframe
          src={page.url}
          title={page.title}
          style={{
            width: "100%",
            height: "calc(100vh - 220px)",
            minHeight: 500,
            border: "none",
          }}
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </Box>
    );
  };

  /**
   * Renders API-loaded page content.
   */
  const renderApiContent = () => {
    if (apiLoading) {
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 400,
            backgroundColor: "#fff",
            border: "1px solid #d0d5dd",
            borderRadius: 2,
          }}
        >
          <CircularProgress size={32} sx={{ color: "#13715B" }} />
        </Box>
      );
    }

    if (apiError) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 400,
            backgroundColor: "#fff",
            border: "1px solid #d0d5dd",
            borderRadius: 2,
          }}
        >
          <AlertCircle size={32} color="#dc2626" />
          <Typography sx={{ mt: 2, fontSize: 14, color: "#dc2626" }}>
            {apiError}
          </Typography>
          <Box
            onClick={fetchApiContent}
            sx={{
              mt: 2,
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              fontSize: 13,
              color: "#13715B",
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            <RefreshCw size={14} /> Try again
          </Box>
        </Box>
      );
    }

    if (!apiContent) {
      return (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <Typography sx={{ color: "#6b7280" }}>
            No content available.
          </Typography>
        </Box>
      );
    }

    // Render HTML content safely
    return (
      <Box
        sx={{
          backgroundColor: "#fff",
          border: "1px solid #d0d5dd",
          borderRadius: 2,
          p: 3,
          minHeight: 400,
          "& img": { maxWidth: "100%" },
          "& table": { width: "100%", borderCollapse: "collapse" },
          "& th, & td": {
            border: "1px solid #e5e7eb",
            padding: "8px 12px",
            textAlign: "left",
          },
          "& th": { backgroundColor: "#f9fafb", fontWeight: 600 },
        }}
        dangerouslySetInnerHTML={{ __html: apiContent }}
      />
    );
  };

  /**
   * Renders page content based on type.
   */
  const renderContent = () => {
    switch (page.type) {
      case "template":
        return renderTemplateContent();
      case "iframe":
        return renderIframeContent();
      case "api":
        return renderApiContent();
      default:
        return (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography sx={{ color: "#6b7280" }}>
              Unknown page type: {page.type}
            </Typography>
          </Box>
        );
    }
  };

  // For full-page templates, render without the wrapper header
  // These templates handle their own breadcrumb and header
  const isFullPageTemplate = page.type === "template" && page.template && FULL_PAGE_TEMPLATES.includes(page.template);

  if (isFullPageTemplate) {
    return renderContent();
  }

  return (
    <Box sx={{ p: 3, height: "100%" }}>
      {renderHeader()}
      {renderContent()}
    </Box>
  );
};

export default PluginPage;
