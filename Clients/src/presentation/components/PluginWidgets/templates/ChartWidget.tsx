/**
 * Generic Chart Widget Template
 *
 * A reusable widget template that displays various chart types using Recharts.
 * Plugins can use this template by specifying "chart" as the template type.
 *
 * Supported chart types: bar, line, pie, donut
 *
 * Expected API Response:
 * {
 *   success: true,
 *   data: {
 *     chartType: "bar" | "line" | "pie" | "donut",
 *     data: [
 *       { name: "Category 1", value: 100, color?: "#13715B" },
 *       { name: "Category 2", value: 80, color?: "#2563eb" },
 *       ...
 *     ],
 *     // For bar/line charts with multiple series:
 *     series?: ["value", "previousValue"],
 *     xAxisKey?: "name",
 *     total?: 180
 *   }
 * }
 */

import { useState, useEffect, useCallback } from "react";
import { Box, Typography, CircularProgress, Stack } from "@mui/material";
import { RefreshCw } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { apiServices } from "../../../../infrastructure/api/networkServices";

interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
  [key: string]: unknown;
}

interface ChartData {
  chartType: "bar" | "line" | "pie" | "donut";
  data: ChartDataPoint[];
  series?: string[];
  xAxisKey?: string;
  total?: number;
}

interface ChartWidgetProps {
  pluginId: string;
  endpoint: string;
  title?: string;
  config?: {
    refreshInterval?: number;
    height?: number;
    showLegend?: boolean;
    showGrid?: boolean;
    colors?: string[];
    emptyMessage?: string;
  };
}

// Default color palette
const defaultColors = [
  "#13715B",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#0891b2",
];

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          backgroundColor: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "4px",
          p: 1,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        {label && (
          <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 0.5 }}>
            {label}
          </Typography>
        )}
        {payload.map((entry, index) => (
          <Typography key={index} sx={{ fontSize: 11, color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

// Custom legend component for pie/donut
const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string }> }) => {
  if (!payload) return null;
  return (
    <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" sx={{ mt: 1 }}>
      {payload.map((entry, index) => (
        <Stack key={index} direction="row" spacing={0.5} alignItems="center">
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: entry.color,
            }}
          />
          <Typography sx={{ fontSize: 11, color: "#666" }}>{entry.value}</Typography>
        </Stack>
      ))}
    </Stack>
  );
};

const ChartWidget: React.FC<ChartWidgetProps> = ({
  pluginId,
  endpoint,
  title = "Chart",
  config = {},
}) => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    refreshInterval,
    height = 200,
    showLegend = true,
    showGrid = true,
    colors = defaultColors,
    emptyMessage = "No data available",
  } = config;

  const fetchData = useCallback(async () => {
    try {
      const response = await apiServices.get(`/plugins/${pluginId}${endpoint}`);
      const data = response.data as { success: boolean; data?: ChartData; error?: string };

      if (data.success && data.data) {
        setChartData(data.data);
        setError(null);
      } else {
        setError(data.error || "Failed to load chart data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chart data");
    } finally {
      setIsLoading(false);
    }
  }, [pluginId, endpoint]);

  useEffect(() => {
    fetchData();

    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [fetchData, refreshInterval]);

  if (isLoading) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={24} sx={{ color: "#13715B" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height: "100%", p: 2 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>{title}</Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 4,
          }}
        >
          <Typography sx={{ fontSize: 13, color: "#dc2626", mb: 1 }}>{error}</Typography>
          <Typography
            onClick={fetchData}
            sx={{
              fontSize: 12,
              color: "#13715B",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              "&:hover": { textDecoration: "underline" },
            }}
          >
            <RefreshCw size={12} /> Retry
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!chartData || chartData.data.length === 0) {
    return (
      <Box sx={{ height: "100%", p: 2 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>{title}</Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            py: 4,
          }}
        >
          <Typography sx={{ fontSize: 13, color: "#999" }}>{emptyMessage}</Typography>
        </Box>
      </Box>
    );
  }

  // Assign colors to data points if not specified
  const dataWithColors = chartData.data.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length],
  }));

  const renderChart = () => {
    const { chartType, series, xAxisKey = "name" } = chartData;

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={dataWithColors} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
              <XAxis
                dataKey={xAxisKey}
                tick={{ fontSize: 10, fill: "#666" }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#666" }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {series ? (
                series.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={colors[index % colors.length]}
                    radius={[2, 2, 0, 0]}
                  />
                ))
              ) : (
                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  {dataWithColors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              )}
              {showLegend && series && <Legend />}
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={dataWithColors} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
              <XAxis
                dataKey={xAxisKey}
                tick={{ fontSize: 10, fill: "#666" }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#666" }}
                axisLine={{ stroke: "#e5e7eb" }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {series ? (
                series.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))
              ) : (
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={colors[0]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: colors[0] }}
                  activeDot={{ r: 5 }}
                />
              )}
              {showLegend && series && <Legend />}
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie":
      case "donut":
        const innerRadius = chartType === "donut" ? "50%" : 0;
        return (
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
              <Tooltip content={<CustomTooltip />} />
              {showLegend && <Legend content={<CustomLegend />} />}
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return (
          <Typography sx={{ fontSize: 13, color: "#999", textAlign: "center", py: 4 }}>
            Unknown chart type: {chartType}
          </Typography>
        );
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        p: 2,
        overflow: "hidden",
        outline: "none",
        "& *:focus": { outline: "none" },
        "& svg": { outline: "none" },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#000" }}>{title}</Typography>
        <Typography
          onClick={fetchData}
          sx={{
            fontSize: 11,
            color: "#999",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            "&:hover": { color: "#13715B" },
          }}
        >
          <RefreshCw size={11} />
        </Typography>
      </Stack>

      {chartData.total !== undefined && (
        <Typography sx={{ fontSize: 11, color: "#666", mb: 1 }}>
          Total: {chartData.total.toLocaleString()}
        </Typography>
      )}

      {renderChart()}
    </Box>
  );
};

export default ChartWidget;
