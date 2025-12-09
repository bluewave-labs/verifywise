/**
 * @fileoverview Empty Page Template
 *
 * A flexible page template for plugins that provides:
 * - Breadcrumb navigation using VerifyWise Breadcrumbs component
 * - Dynamic title and description using PageHeader component
 * - Customizable content area (HTML or structured slots)
 *
 * @module templates/EmptyPageTemplate
 */

import { useState, useEffect, useCallback } from "react";
import { Box, Typography, CircularProgress, Chip, Stack } from "@mui/material";
import { RefreshCw, AlertCircle, Home, Puzzle } from "lucide-react";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import { getLucideIcon } from "../utils/iconMapping";
import PageBreadcrumbs from "../../Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../Layout/PageHeader";
import { IBreadcrumbItem } from "../../../../domain/interfaces/i.breadcrumbs";
import React from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Stats item for the stats slot type
 */
interface StatsItem {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  color?: string;
}

/**
 * Table column definition
 */
interface TableColumn {
  key: string;
  label: string;
  width?: string;
}

/**
 * Table row data
 */
interface TableRow {
  id: string;
  [key: string]: unknown;
}

/**
 * Chart data point for chart slots
 */
interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

/**
 * Chart item for chart-row slot
 */
interface ChartRowItem {
  title: string;
  chartType: "bar" | "pie" | "donut";
  chartData: ChartDataPoint[];
  chartHeight?: number;
}

/**
 * Slot type definitions
 */
type SlotType = "stats" | "table" | "text" | "list" | "chart" | "chart-row" | "custom";

/**
 * Individual slot configuration
 */
interface ContentSlot {
  type: SlotType;
  title?: string;
  data: {
    // For stats type
    items?: StatsItem[];
    // For table type
    columns?: TableColumn[];
    rows?: TableRow[];
    // For text type
    content?: string;
    // For list type
    listItems?: string[];
    // For chart type
    chartType?: "bar" | "pie" | "donut";
    chartData?: ChartDataPoint[];
    chartHeight?: number;
    // For chart-row type (side-by-side charts)
    charts?: ChartRowItem[];
    gap?: number;
    // For custom type
    html?: string;
  };
}

/**
 * API response for page content
 */
interface PageContentResponse {
  success: boolean;
  data?: {
    contentType: "html" | "slots";
    html?: string;
    slots?: ContentSlot[];
  };
  error?: string;
}

/**
 * Props for EmptyPageTemplate
 */
interface EmptyPageTemplateProps {
  pluginId: string;
  pluginName: string;
  title: string;
  description?: string;
  icon?: string;
  endpoint?: string;
  config?: Record<string, unknown>;
}

// =============================================================================
// STATUS COLORS
// =============================================================================

const trendColors = {
  up: { bg: "#dcfce7", color: "#16a34a" },
  down: { bg: "#fee2e2", color: "#dc2626" },
  neutral: { bg: "#f3f4f6", color: "#6b7280" },
};

const statusColors: Record<string, { bg: string; color: string }> = {
  active: { bg: "#dcfce7", color: "#16a34a" },
  inactive: { bg: "#f3f4f6", color: "#6b7280" },
  pending: { bg: "#fef3c7", color: "#d97706" },
  error: { bg: "#fee2e2", color: "#dc2626" },
  success: { bg: "#dcfce7", color: "#16a34a" },
  warning: { bg: "#fef3c7", color: "#d97706" },
};

// =============================================================================
// SLOT RENDERERS
// =============================================================================

/**
 * Renders a stats grid slot
 */
const renderStatsSlot = (slot: ContentSlot) => {
  const items = slot.data.items || [];
  return (
    <Box sx={{ mb: 3 }}>
      {slot.title && (
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2, color: "#374151" }}>
          {slot.title}
        </Typography>
      )}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 2,
        }}
      >
        {items.map((item, idx) => (
          <Box
            key={idx}
            sx={{
              p: 2.5,
              backgroundColor: "#fff",
              border: "1px solid #d0d5dd",
              borderRadius: 1,
            }}
          >
            <Typography sx={{ fontSize: 12, color: "#6b7280", mb: 0.5 }}>
              {item.label}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
              <Typography
                sx={{
                  fontSize: 24,
                  fontWeight: 600,
                  color: item.color || "#111827",
                }}
              >
                {item.value}
              </Typography>
              {item.change && item.trend && (
                <Chip
                  label={item.change}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 11,
                    backgroundColor: trendColors[item.trend].bg,
                    color: trendColors[item.trend].color,
                  }}
                />
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/**
 * Renders a table slot
 */
const renderTableSlot = (slot: ContentSlot) => {
  const columns = slot.data.columns || [];
  const rows = slot.data.rows || [];

  const renderCellValue = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "string") {
      const lowerValue = value.toLowerCase();
      if (statusColors[lowerValue]) {
        return (
          <Chip
            label={value}
            size="small"
            sx={{
              height: 20,
              fontSize: 11,
              backgroundColor: statusColors[lowerValue].bg,
              color: statusColors[lowerValue].color,
              fontWeight: 500,
            }}
          />
        );
      }
      return value;
    }
    if (typeof value === "number") return value.toLocaleString();
    return String(value);
  };

  return (
    <Box sx={{ mb: 3 }}>
      {slot.title && (
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2, color: "#374151" }}>
          {slot.title}
        </Typography>
      )}
      <Box
        sx={{
          backgroundColor: "#fff",
          border: "1px solid #d0d5dd",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <Box sx={{ overflowX: "auto" }}>
          <Box
            component="table"
            sx={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <Box component="thead">
              <Box component="tr" sx={{ backgroundColor: "#f9fafb" }}>
                {columns.map((col) => (
                  <Box
                    component="th"
                    key={col.key}
                    sx={{
                      textAlign: "left",
                      py: 1.5,
                      px: 2,
                      borderBottom: "1px solid #e5e7eb",
                      fontWeight: 600,
                      color: "#374151",
                      whiteSpace: "nowrap",
                      width: col.width,
                    }}
                  >
                    {col.label}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {rows.length === 0 ? (
                <Box component="tr">
                  <Box
                    component="td"
                    colSpan={columns.length}
                    sx={{ py: 4, textAlign: "center", color: "#9ca3af" }}
                  >
                    No data available
                  </Box>
                </Box>
              ) : (
                rows.map((row) => (
                  <Box
                    component="tr"
                    key={row.id}
                    sx={{ "&:hover": { backgroundColor: "#f9fafb" } }}
                  >
                    {columns.map((col) => (
                      <Box
                        component="td"
                        key={`${row.id}-${col.key}`}
                        sx={{
                          py: 1.5,
                          px: 2,
                          borderBottom: "1px solid #f3f4f6",
                          color: "#4b5563",
                        }}
                      >
                        {renderCellValue(row[col.key])}
                      </Box>
                    ))}
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

/**
 * Renders a text slot
 */
const renderTextSlot = (slot: ContentSlot) => (
  <Box sx={{ mb: 3 }}>
    {slot.title && (
      <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2, color: "#374151" }}>
        {slot.title}
      </Typography>
    )}
    <Box
      sx={{
        p: 2.5,
        backgroundColor: "#fff",
        border: "1px solid #d0d5dd",
        borderRadius: 1,
      }}
    >
      <Typography sx={{ fontSize: 14, color: "#4b5563", lineHeight: 1.6 }}>
        {slot.data.content}
      </Typography>
    </Box>
  </Box>
);

/**
 * Renders a list slot
 */
const renderListSlot = (slot: ContentSlot) => {
  const items = slot.data.listItems || [];
  return (
    <Box sx={{ mb: 3 }}>
      {slot.title && (
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2, color: "#374151" }}>
          {slot.title}
        </Typography>
      )}
      <Box
        sx={{
          backgroundColor: "#fff",
          border: "1px solid #d0d5dd",
          borderRadius: 1,
        }}
      >
        {items.map((item, idx) => (
          <Box
            key={idx}
            sx={{
              px: 2.5,
              py: 1.5,
              borderBottom: idx < items.length - 1 ? "1px solid #f3f4f6" : "none",
              fontSize: 14,
              color: "#4b5563",
            }}
          >
            {item}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// Default chart colors
const chartColors = [
  "#13715B",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#0891b2",
];

/**
 * Renders a chart slot
 */
const renderChartSlot = (slot: ContentSlot) => {
  const chartData = slot.data.chartData || [];
  const chartType = slot.data.chartType || "bar";
  const height = slot.data.chartHeight || 250;

  // Assign colors to data points if not specified
  const dataWithColors = chartData.map((item, index) => ({
    ...item,
    color: item.color || chartColors[index % chartColors.length],
  }));

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={dataWithColors} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#666" }}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#666" }}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "4px",
            fontSize: 12,
          }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {dataWithColors.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = (innerRadius: string | number = 0) => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={dataWithColors}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius="80%"
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          label={({ name, percent, x, y }) => (
            <text
              x={x}
              y={y}
              fill="#374151"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: "13px" }}
            >
              {`${name} ${((percent || 0) * 100).toFixed(0)}%`}
            </text>
          )}
          labelLine={false}
        >
          {dataWithColors.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "4px",
            fontSize: 12,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderLegend = () => (
    <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" sx={{ mt: 1 }}>
      {dataWithColors.map((entry, index) => (
        <Stack key={index} direction="row" spacing={0.5} alignItems="center">
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "2px",
              backgroundColor: entry.color,
            }}
          />
          <Typography sx={{ fontSize: 12, color: "#666" }}>
            {entry.name}: {entry.value}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );

  return (
    <Box sx={{ mb: 3 }}>
      {slot.title && (
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2, color: "#374151" }}>
          {slot.title}
        </Typography>
      )}
      <Box
        sx={{
          p: 2.5,
          backgroundColor: "#fff",
          border: "1px solid #d0d5dd",
          borderRadius: 1,
        }}
      >
        {chartData.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography sx={{ fontSize: 13, color: "#999" }}>No data available</Typography>
          </Box>
        ) : (
          <>
            {chartType === "bar" && renderBarChart()}
            {chartType === "pie" && renderPieChart()}
            {chartType === "donut" && renderPieChart("50%")}
            {renderLegend()}
          </>
        )}
      </Box>
    </Box>
  );
};

/**
 * Renders a chart row slot (side-by-side charts)
 */
const renderChartRowSlot = (slot: ContentSlot) => {
  const charts = slot.data.charts || [];
  const gap = slot.data.gap || 16;

  if (charts.length === 0) {
    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ py: 4, textAlign: "center" }}>
          <Typography sx={{ fontSize: 13, color: "#999" }}>No charts configured</Typography>
        </Box>
      </Box>
    );
  }

  const renderSingleChart = (chart: ChartRowItem, index: number) => {
    const chartData = chart.chartData || [];
    const height = chart.chartHeight || 250;

    // Assign colors to data points if not specified
    const dataWithColors = chartData.map((item, idx) => ({
      ...item,
      color: item.color || chartColors[idx % chartColors.length],
    }));

    const renderBarChart = () => (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={dataWithColors} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#666" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#666" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "4px",
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {dataWithColors.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );

    const renderPieChart = (innerRadius: string | number = 0) => (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={dataWithColors}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={({ name, percent, x, y }) => (
              <text
                x={x}
                y={y}
                fill="#374151"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ fontSize: "13px" }}
              >
                {`${name} ${((percent || 0) * 100).toFixed(0)}%`}
              </text>
            )}
            labelLine={false}
          >
            {dataWithColors.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "4px",
              fontSize: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    );

    const renderLegend = () => (
      <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" sx={{ mt: 1 }}>
        {dataWithColors.map((entry, idx) => (
          <Stack key={idx} direction="row" spacing={0.5} alignItems="center">
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "2px",
                backgroundColor: entry.color,
              }}
            />
            <Typography sx={{ fontSize: 12, color: "#666" }}>
              {entry.name}: {entry.value}
            </Typography>
          </Stack>
        ))}
      </Stack>
    );

    return (
      <Box
        key={index}
        sx={{
          flex: 1,
          p: 2.5,
          backgroundColor: "#fff",
          border: "1px solid #d0d5dd",
          borderRadius: 1,
          outline: "none",
          "& *:focus": { outline: "none" },
          "& svg": { outline: "none" },
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2, color: "#374151" }}>
          {chart.title}
        </Typography>
        {chartData.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography sx={{ fontSize: 13, color: "#999" }}>No data available</Typography>
          </Box>
        ) : (
          <>
            {chart.chartType === "bar" && renderBarChart()}
            {chart.chartType === "pie" && renderPieChart()}
            {chart.chartType === "donut" && renderPieChart("50%")}
            {renderLegend()}
          </>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ mb: 3 }}>
      {slot.title && (
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2, color: "#374151" }}>
          {slot.title}
        </Typography>
      )}
      <Box
        sx={{
          display: "flex",
          gap: `${gap}px`,
        }}
      >
        {charts.map((chart, index) => renderSingleChart(chart, index))}
      </Box>
    </Box>
  );
};

/**
 * Renders a custom HTML slot
 */
const renderCustomSlot = (slot: ContentSlot) => (
  <Box sx={{ mb: 3 }}>
    {slot.title && (
      <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2, color: "#374151" }}>
        {slot.title}
      </Typography>
    )}
    <Box
      sx={{
        p: 2.5,
        backgroundColor: "#fff",
        border: "1px solid #d0d5dd",
        borderRadius: 1,
        "& img": { maxWidth: "100%" },
      }}
      dangerouslySetInnerHTML={{ __html: slot.data.html || "" }}
    />
  </Box>
);

/**
 * Renders a slot based on its type
 */
const renderSlot = (slot: ContentSlot, index: number) => {
  switch (slot.type) {
    case "stats":
      return <Box key={index}>{renderStatsSlot(slot)}</Box>;
    case "table":
      return <Box key={index}>{renderTableSlot(slot)}</Box>;
    case "text":
      return <Box key={index}>{renderTextSlot(slot)}</Box>;
    case "list":
      return <Box key={index}>{renderListSlot(slot)}</Box>;
    case "chart":
      return <Box key={index}>{renderChartSlot(slot)}</Box>;
    case "chart-row":
      return <Box key={index}>{renderChartRowSlot(slot)}</Box>;
    case "custom":
      return <Box key={index}>{renderCustomSlot(slot)}</Box>;
    default:
      return null;
  }
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Empty Page Template component.
 *
 * Provides a structured page layout with breadcrumb navigation,
 * title, description, and flexible content area.
 */
const EmptyPageTemplate: React.FC<EmptyPageTemplateProps> = ({
  pluginId,
  pluginName,
  title,
  description,
  icon,
  endpoint,
  config = {},
}) => {
  const [content, setContent] = useState<PageContentResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(!!endpoint);
  const [error, setError] = useState<string | null>(null);

  const { refreshInterval } = config as { refreshInterval?: number };

  // Get the icon component
  const IconComponent = getLucideIcon(icon);

  /**
   * Fetches content from the plugin API endpoint
   */
  const fetchContent = useCallback(async () => {
    if (!endpoint) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiServices.get<PageContentResponse>(
        `/plugins/${pluginId}${endpoint}`
      );

      if (response.data.success && response.data.data) {
        setContent(response.data.data);
      } else {
        setError(response.data.error || "Failed to load content");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content");
    } finally {
      setIsLoading(false);
    }
  }, [pluginId, endpoint]);

  // Fetch content on mount and optionally refresh
  useEffect(() => {
    if (endpoint) {
      fetchContent();

      if (refreshInterval && refreshInterval > 0) {
        const interval = setInterval(fetchContent, refreshInterval * 1000);
        return () => clearInterval(interval);
      }
    }
    return undefined;
  }, [fetchContent, refreshInterval, endpoint]);

  /**
   * Build breadcrumb items for the Breadcrumbs component
   */
  const breadcrumbItems: IBreadcrumbItem[] = [
    {
      label: "Home",
      path: "/",
      icon: React.createElement(Home, { size: 14, strokeWidth: 1.5 }),
    },
    {
      label: "Plugins",
      icon: React.createElement(Puzzle, { size: 14, strokeWidth: 1.5 }),
      disabled: true,
    },
    {
      label: pluginName,
      icon: React.createElement(IconComponent, { size: 14, strokeWidth: 1.5 }),
      disabled: true,
    },
  ];

  /**
   * Renders the refresh button
   */
  const renderRefreshButton = () => {
    if (!endpoint) return null;

    return (
      <Box
        onClick={fetchContent}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 2,
          py: 1,
          fontSize: 13,
          color: "#6b7280",
          cursor: "pointer",
          borderRadius: 1,
          "&:hover": { backgroundColor: "#f3f4f6", color: "#13715B" },
        }}
      >
        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
        <span>Refresh</span>
      </Box>
    );
  };

  /**
   * Renders the content area
   */
  const renderContent = () => {
    // If no endpoint, show empty content area
    if (!endpoint) {
      return (
        <Box
          sx={{
            p: 4,
            backgroundColor: "#fff",
            border: "1px solid #d0d5dd",
            borderRadius: 1,
            minHeight: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography sx={{ fontSize: 14, color: "#9ca3af" }}>
            No content configured for this plugin page.
          </Typography>
        </Box>
      );
    }

    // Loading state
    if (isLoading && !content) {
      return (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 300,
          }}
        >
          <CircularProgress size={32} sx={{ color: "#13715B" }} />
        </Box>
      );
    }

    // Error state
    if (error) {
      return (
        <Box
          sx={{
            p: 4,
            backgroundColor: "#fff",
            border: "1px solid #d0d5dd",
            borderRadius: 1,
            minHeight: 300,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AlertCircle size={32} color="#dc2626" />
          <Typography sx={{ mt: 2, fontSize: 14, color: "#dc2626" }}>{error}</Typography>
          <Box
            onClick={fetchContent}
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

    // No content
    if (!content) {
      return (
        <Box
          sx={{
            p: 4,
            backgroundColor: "#fff",
            border: "1px solid #d0d5dd",
            borderRadius: 1,
            minHeight: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography sx={{ fontSize: 14, color: "#9ca3af" }}>
            No content available.
          </Typography>
        </Box>
      );
    }

    // HTML content
    if (content.contentType === "html" && content.html) {
      return (
        <Box
          sx={{
            p: 3,
            backgroundColor: "#fff",
            border: "1px solid #d0d5dd",
            borderRadius: 1,
            minHeight: 300,
            "& img": { maxWidth: "100%" },
            "& table": { width: "100%", borderCollapse: "collapse" },
            "& th, & td": {
              border: "1px solid #e5e7eb",
              padding: "8px 12px",
              textAlign: "left",
            },
            "& th": { backgroundColor: "#f9fafb", fontWeight: 600 },
          }}
          dangerouslySetInnerHTML={{ __html: content.html }}
        />
      );
    }

    // Slots content
    if (content.contentType === "slots" && content.slots) {
      return <Box>{content.slots.map((slot, idx) => renderSlot(slot, idx))}</Box>;
    }

    return null;
  };

  return (
    <Box sx={{ px: 3, minHeight: "100%" }}>
      {/* Breadcrumbs using VerifyWise PageBreadcrumbs component (includes divider) */}
      <PageBreadcrumbs items={breadcrumbItems} autoGenerate={false} />

      {/* Header using PageHeader component - mt: 4 (32px) matches /vendors page */}
      <Box sx={{ mt: 4 }}>
        <PageHeader title={title} description={description} rightContent={renderRefreshButton()} />
      </Box>

      {/* Content area */}
      <Box sx={{ mt: 3 }}>{renderContent()}</Box>
    </Box>
  );
};

export default EmptyPageTemplate;
