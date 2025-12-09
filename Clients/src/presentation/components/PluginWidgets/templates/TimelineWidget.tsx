/**
 * Generic Timeline Widget Template
 *
 * A reusable widget template that displays chronological events.
 * Plugins can use this template by specifying "timeline" as the template type.
 *
 * Expected API Response:
 * {
 *   success: true,
 *   data: {
 *     events: [
 *       {
 *         id: "1",
 *         title: "Event Title",
 *         description?: "Event description",
 *         timestamp: "2024-01-15T10:30:00Z",
 *         type?: "created" | "updated" | "deleted" | "completed" | "info" | "warning" | "error",
 *         icon?: "check" | "alert" | "info" | "edit" | "trash" | "plus",
 *         user?: { name: "John Doe", avatar?: "https://..." }
 *       },
 *       ...
 *     ],
 *     total: 50
 *   }
 * }
 */

import { useState, useEffect, useCallback } from "react";
import { Box, Typography, CircularProgress, Stack, Avatar } from "@mui/material";
import {
  RefreshCw,
  Check,
  AlertTriangle,
  Info,
  Edit,
  Trash2,
  Plus,
  Circle,
  Clock,
} from "lucide-react";
import { apiServices } from "../../../../infrastructure/api/networkServices";

interface TimelineUser {
  name: string;
  avatar?: string;
}

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  type?: "created" | "updated" | "deleted" | "completed" | "info" | "warning" | "error";
  icon?: "check" | "alert" | "info" | "edit" | "trash" | "plus" | "clock";
  user?: TimelineUser;
}

interface TimelineData {
  events: TimelineEvent[];
  total: number;
}

interface TimelineWidgetProps {
  pluginId: string;
  endpoint: string;
  title?: string;
  config?: {
    maxItems?: number;
    refreshInterval?: number;
    showAvatar?: boolean;
    showDescription?: boolean;
    compact?: boolean;
    emptyMessage?: string;
  };
}

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
  check: <Check size={12} />,
  alert: <AlertTriangle size={12} />,
  info: <Info size={12} />,
  edit: <Edit size={12} />,
  trash: <Trash2 size={12} />,
  plus: <Plus size={12} />,
  clock: <Clock size={12} />,
};

// Type to icon mapping (default icons for each type)
const typeIconMap: Record<string, string> = {
  created: "plus",
  updated: "edit",
  deleted: "trash",
  completed: "check",
  info: "info",
  warning: "alert",
  error: "alert",
};

// Type to color mapping
const typeColors: Record<string, { bg: string; color: string; border: string }> = {
  created: { bg: "#dcfce7", color: "#16a34a", border: "#16a34a" },
  updated: { bg: "#dbeafe", color: "#2563eb", border: "#2563eb" },
  deleted: { bg: "#fee2e2", color: "#dc2626", border: "#dc2626" },
  completed: { bg: "#dcfce7", color: "#16a34a", border: "#16a34a" },
  info: { bg: "#f3f4f6", color: "#6b7280", border: "#6b7280" },
  warning: { bg: "#fef3c7", color: "#d97706", border: "#d97706" },
  error: { bg: "#fee2e2", color: "#dc2626", border: "#dc2626" },
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
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const TimelineWidget: React.FC<TimelineWidgetProps> = ({
  pluginId,
  endpoint,
  title = "Timeline",
  config = {},
}) => {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    maxItems = 10,
    refreshInterval,
    showAvatar = true,
    showDescription = true,
    compact = false,
    emptyMessage = "No events to display",
  } = config;

  const fetchData = useCallback(async () => {
    try {
      const response = await apiServices.get(
        `/plugins/${pluginId}${endpoint}?limit=${maxItems}`
      );
      const data = response.data as { success: boolean; data?: TimelineData; error?: string };

      if (data.success && data.data) {
        setTimelineData(data.data);
        setError(null);
      } else {
        setError(data.error || "Failed to load timeline");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timeline");
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

  if (!timelineData || timelineData.events.length === 0) {
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

  return (
    <Box sx={{ height: "100%", p: 2, overflow: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
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

      <Box sx={{ position: "relative" }}>
        {/* Timeline line */}
        <Box
          sx={{
            position: "absolute",
            left: showAvatar ? 14 : 10,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: "#e5e7eb",
          }}
        />

        {/* Timeline events */}
        <Stack spacing={compact ? 1.5 : 2}>
          {timelineData.events.map((event) => {
            const eventType = event.type || "info";
            const colors = typeColors[eventType] || typeColors.info;
            const iconName = event.icon || typeIconMap[eventType] || "circle";
            const icon = iconMap[iconName] || <Circle size={12} />;

            return (
              <Stack
                key={event.id}
                direction="row"
                spacing={1.5}
                sx={{ position: "relative" }}
              >
                {/* Icon or Avatar */}
                {showAvatar && event.user ? (
                  <Avatar
                    src={event.user.avatar}
                    sx={{
                      width: 28,
                      height: 28,
                      fontSize: 10,
                      fontWeight: 600,
                      backgroundColor: colors.bg,
                      color: colors.color,
                      border: `2px solid ${colors.border}`,
                      zIndex: 1,
                    }}
                  >
                    {getInitials(event.user.name)}
                  </Avatar>
                ) : (
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: colors.bg,
                      color: colors.color,
                      border: `2px solid ${colors.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 1,
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </Box>
                )}

                {/* Event content */}
                <Box sx={{ flex: 1, minWidth: 0, pt: showAvatar ? 0.25 : 0 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1}
                  >
                    <Typography
                      sx={{
                        fontSize: compact ? 12 : 13,
                        fontWeight: 500,
                        color: "#000",
                        lineHeight: 1.3,
                      }}
                    >
                      {event.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 10,
                        color: "#999",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {formatRelativeTime(event.timestamp)}
                    </Typography>
                  </Stack>

                  {showDescription && event.description && (
                    <Typography
                      sx={{
                        fontSize: compact ? 11 : 12,
                        color: "#666",
                        mt: 0.25,
                        lineHeight: 1.4,
                      }}
                    >
                      {event.description}
                    </Typography>
                  )}

                  {showAvatar && event.user && (
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: "#999",
                        mt: 0.25,
                      }}
                    >
                      by {event.user.name}
                    </Typography>
                  )}
                </Box>
              </Stack>
            );
          })}
        </Stack>
      </Box>

      {timelineData.total > timelineData.events.length && (
        <Typography
          sx={{
            fontSize: 11,
            color: "#999",
            textAlign: "center",
            mt: 2,
          }}
        >
          Showing {timelineData.events.length} of {timelineData.total} events
        </Typography>
      )}
    </Box>
  );
};

export default TimelineWidget;
