/**
 * Generic Alerts/Banner Widget Template
 *
 * A reusable widget template that displays critical notifications and warnings.
 * Plugins can use this template by specifying "alerts" as the template type.
 *
 * Expected API Response:
 * {
 *   success: true,
 *   data: {
 *     alerts: [
 *       {
 *         id: "1",
 *         title: "Alert Title",
 *         message?: "Alert description",
 *         severity: "critical" | "warning" | "info" | "success",
 *         timestamp?: "2024-01-15T10:30:00Z",
 *         actionLabel?: "View Details",
 *         actionUrl?: "/risks/123",
 *         dismissible?: true
 *       },
 *       ...
 *     ],
 *     total: 5
 *   }
 * }
 */

import { useState, useEffect, useCallback } from "react";
import { Box, Typography, CircularProgress, Stack, IconButton } from "@mui/material";
import {
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  ExternalLink,
} from "lucide-react";
import { apiServices } from "../../../../infrastructure/api/networkServices";

interface Alert {
  id: string;
  title: string;
  message?: string;
  severity: "critical" | "warning" | "info" | "success";
  timestamp?: string;
  actionLabel?: string;
  actionUrl?: string;
  dismissible?: boolean;
}

interface AlertsData {
  alerts: Alert[];
  total: number;
}

interface AlertsWidgetProps {
  pluginId: string;
  endpoint: string;
  title?: string;
  config?: {
    maxItems?: number;
    refreshInterval?: number;
    compact?: boolean;
    showTimestamp?: boolean;
    emptyMessage?: string;
  };
}

// Severity configuration
const severityConfig: Record<
  string,
  { bg: string; border: string; color: string; icon: React.ReactNode }
> = {
  critical: {
    bg: "#fef2f2",
    border: "#dc2626",
    color: "#dc2626",
    icon: <AlertCircle size={16} />,
  },
  warning: {
    bg: "#fffbeb",
    border: "#d97706",
    color: "#d97706",
    icon: <AlertTriangle size={16} />,
  },
  info: {
    bg: "#eff6ff",
    border: "#2563eb",
    color: "#2563eb",
    icon: <Info size={16} />,
  },
  success: {
    bg: "#f0fdf4",
    border: "#16a34a",
    color: "#16a34a",
    icon: <CheckCircle size={16} />,
  },
};

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const AlertsWidget: React.FC<AlertsWidgetProps> = ({
  pluginId,
  endpoint,
  title = "Alerts",
  config = {},
}) => {
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    maxItems = 5,
    refreshInterval,
    compact = false,
    showTimestamp = true,
    emptyMessage = "No alerts",
  } = config;

  const fetchData = useCallback(async () => {
    try {
      const response = await apiServices.get(
        `/plugins/${pluginId}${endpoint}?limit=${maxItems}`
      );
      const data = response.data as { success: boolean; data?: AlertsData; error?: string };

      if (data.success && data.data) {
        setAlertsData(data.data);
        setError(null);
      } else {
        setError(data.error || "Failed to load alerts");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load alerts");
    } finally {
      setIsLoading(false);
    }
  }, [pluginId, endpoint, maxItems]);

  useEffect(() => {
    fetchData();

    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  const handleDismiss = (alertId: string) => {
    setDismissedIds((prev) => new Set([...prev, alertId]));
  };

  const handleAction = (url: string) => {
    window.location.href = url;
  };

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

  // Filter out dismissed alerts
  const visibleAlerts =
    alertsData?.alerts.filter((alert) => !dismissedIds.has(alert.id)) || [];

  if (visibleAlerts.length === 0) {
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
          <Stack alignItems="center" spacing={1}>
            <CheckCircle size={24} color="#16a34a" />
            <Typography sx={{ fontSize: 13, color: "#666" }}>{emptyMessage}</Typography>
          </Stack>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", p: 2, overflow: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#000" }}>{title}</Typography>
          {alertsData && alertsData.total > 0 && (
            <Box
              sx={{
                backgroundColor: "#dc2626",
                color: "#fff",
                fontSize: 10,
                fontWeight: 600,
                px: 0.75,
                py: 0.25,
                borderRadius: "10px",
                minWidth: 18,
                textAlign: "center",
              }}
            >
              {alertsData.total}
            </Box>
          )}
        </Stack>
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

      <Stack spacing={compact ? 1 : 1.5}>
        {visibleAlerts.map((alert) => {
          const config = severityConfig[alert.severity] || severityConfig.info;

          return (
            <Box
              key={alert.id}
              sx={{
                backgroundColor: config.bg,
                borderLeft: `3px solid ${config.border}`,
                borderRadius: "4px",
                p: compact ? 1 : 1.5,
                position: "relative",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Box sx={{ color: config.color, flexShrink: 0, mt: 0.25 }}>
                  {config.icon}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1}
                  >
                    <Typography
                      sx={{
                        fontSize: compact ? 12 : 13,
                        fontWeight: 600,
                        color: "#000",
                        lineHeight: 1.3,
                      }}
                    >
                      {alert.title}
                    </Typography>

                    {alert.dismissible !== false && (
                      <IconButton
                        size="small"
                        onClick={() => handleDismiss(alert.id)}
                        sx={{
                          p: 0.25,
                          color: "#999",
                          "&:hover": { color: "#666", backgroundColor: "transparent" },
                        }}
                      >
                        <X size={14} />
                      </IconButton>
                    )}
                  </Stack>

                  {alert.message && !compact && (
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: "#666",
                        mt: 0.5,
                        lineHeight: 1.4,
                      }}
                    >
                      {alert.message}
                    </Typography>
                  )}

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mt: compact ? 0.5 : 1 }}
                  >
                    {showTimestamp && alert.timestamp && (
                      <Typography sx={{ fontSize: 10, color: "#999" }}>
                        {formatRelativeTime(alert.timestamp)}
                      </Typography>
                    )}

                    {alert.actionLabel && alert.actionUrl && (
                      <Typography
                        onClick={() => handleAction(alert.actionUrl!)}
                        sx={{
                          fontSize: 11,
                          color: config.color,
                          fontWeight: 500,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        {alert.actionLabel}
                        <ExternalLink size={10} />
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Box>
          );
        })}
      </Stack>

      {alertsData && alertsData.total > visibleAlerts.length && (
        <Typography
          sx={{
            fontSize: 11,
            color: "#999",
            textAlign: "center",
            mt: 2,
          }}
        >
          +{alertsData.total - visibleAlerts.length} more alerts
        </Typography>
      )}
    </Box>
  );
};

export default AlertsWidget;
