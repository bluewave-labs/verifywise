/**
 * Generic Stats Card Widget Template
 *
 * A reusable widget template that displays a single metric with optional change indicator.
 * Plugins can use this template by specifying "stats-card" as the template type.
 *
 * Expected API Response:
 * {
 *   success: true,
 *   data: {
 *     value: 42,
 *     label: "Total Items",
 *     change?: 5,
 *     changeType?: "increase" | "decrease",
 *     subtitle?: "Last 7 days"
 *   }
 * }
 */

import { useState, useEffect, useCallback } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { apiServices } from "../../../../infrastructure/api/networkServices";

interface StatsData {
  value: number | string;
  label: string;
  change?: number;
  changeType?: "increase" | "decrease";
  subtitle?: string;
}

interface StatsCardWidgetProps {
  pluginId: string;
  endpoint: string;
  title?: string;
  config?: {
    refreshInterval?: number;
    showChange?: boolean;
    valueColor?: string;
  };
}

const StatsCardWidget: React.FC<StatsCardWidgetProps> = ({
  pluginId,
  endpoint,
  title,
  config = {},
}) => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { refreshInterval, showChange = true, valueColor = "#13715B" } = config;

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiServices.get(`/plugins/${pluginId}${endpoint}`);

      const data = response.data;

      if (data.success && data.data) {
        setStats(data.data);
        setError(null);
      } else {
        setError(data.error || "Failed to load stats");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setIsLoading(false);
    }
  }, [pluginId, endpoint]);

  useEffect(() => {
    fetchStats();

    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchStats, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchStats, refreshInterval]);

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
      <Box
        sx={{
          height: "100%",
          p: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ fontSize: 13, color: "#dc2626", mb: 1 }}>{error}</Typography>
        <Typography
          onClick={fetchStats}
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
    );
  }

  if (!stats) return null;

  return (
    <Box
      sx={{
        height: "100%",
        p: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Typography sx={{ fontSize: 13, color: "#666", mb: 0.5 }}>
        {title || stats.label}
      </Typography>

      <Typography
        sx={{
          fontSize: 32,
          fontWeight: 600,
          color: valueColor,
          lineHeight: 1.2,
        }}
      >
        {stats.value}
      </Typography>

      {showChange && stats.change !== undefined && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
          {stats.changeType === "increase" ? (
            <TrendingUp size={14} color="#16a34a" />
          ) : (
            <TrendingDown size={14} color="#dc2626" />
          )}
          <Typography
            sx={{
              fontSize: 12,
              color: stats.changeType === "increase" ? "#16a34a" : "#dc2626",
              fontWeight: 500,
            }}
          >
            {stats.change}%
          </Typography>
          {stats.subtitle && (
            <Typography sx={{ fontSize: 12, color: "#999", ml: 0.5 }}>
              {stats.subtitle}
            </Typography>
          )}
        </Box>
      )}

      {!showChange && stats.subtitle && (
        <Typography sx={{ fontSize: 12, color: "#999", mt: 0.5 }}>
          {stats.subtitle}
        </Typography>
      )}
    </Box>
  );
};

export default StatsCardWidget;
