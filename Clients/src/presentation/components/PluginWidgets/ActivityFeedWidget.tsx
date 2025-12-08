/**
 * Activity Feed Widget Template
 *
 * A pre-built widget template that plugins can use to display activity feeds.
 * Fetches data from the plugin's API endpoint and renders it.
 */

import { useState, useEffect, useCallback } from "react";
import { Stack, Box, Typography, CircularProgress, Avatar } from "@mui/material";
import {
  FolderPlus,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckSquare,
  Users,
  RefreshCw,
} from "lucide-react";
import { apiServices } from "../../../infrastructure/api/networkServices";

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  entityId: number;
  entityType: string;
  userId?: number;
  userName?: string;
  timestamp: string;
  relativeTime: string;
}

interface ActivityFeedWidgetProps {
  pluginId: string;
  endpoint: string;
  title?: string;
  config?: {
    maxItems?: number;
    showTimestamp?: boolean;
    showAvatar?: boolean;
    refreshInterval?: number;
  };
}

// Get icon based on activity type
function getActivityIcon(type: string) {
  if (type.includes("created") || type.includes("added")) {
    return <FolderPlus size={14} color="#16a34a" />;
  }
  if (type.includes("updated")) {
    return <Edit3 size={14} color="#2563eb" />;
  }
  if (type.includes("deleted") || type.includes("removed")) {
    return <Trash2 size={14} color="#dc2626" />;
  }
  if (type.includes("risk")) {
    return <AlertTriangle size={14} color="#ea580c" />;
  }
  if (type.includes("task")) {
    return <CheckSquare size={14} color="#7c3aed" />;
  }
  if (type.includes("vendor")) {
    return <Users size={14} color="#0891b2" />;
  }
  return <Edit3 size={14} color="#6b7280" />;
}

// Get avatar background color based on entity type
function getAvatarColor(entityType: string): string {
  switch (entityType) {
    case "project":
      return "#dbeafe";
    case "risk":
      return "#fef3c7";
    case "task":
      return "#f3e8ff";
    case "vendor":
      return "#cffafe";
    default:
      return "#f3f4f6";
  }
}

const ActivityFeedWidget: React.FC<ActivityFeedWidgetProps> = ({
  pluginId,
  endpoint,
  title = "Recent activity",
  config = {},
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { maxItems = 10, showTimestamp = true, showAvatar = true, refreshInterval } = config;

  const fetchActivities = useCallback(async () => {
    try {
      const response = await apiServices.get(
        `/plugins/${pluginId}${endpoint}?limit=${maxItems}`
      );

      const data = response.data as { success: boolean; data?: { activities: Activity[] }; error?: string };

      if (data.success && data.data?.activities) {
        setActivities(data.data.activities);
        setError(null);
      } else {
        setError(data.error || "Failed to load activities");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activities");
    } finally {
      setIsLoading(false);
    }
  }, [pluginId, endpoint, maxItems]);

  useEffect(() => {
    fetchActivities();

    // Set up auto-refresh if configured
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchActivities, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchActivities, refreshInterval]);

  if (isLoading) {
    return (
      <Box
        sx={{
          border: "1px solid #d0d5dd",
          borderRadius: "4px",
          p: 2,
          minHeight: 200,
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
          border: "1px solid #d0d5dd",
          borderRadius: "4px",
          p: 2,
          minHeight: 200,
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>{title}</Typography>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 4,
            color: "#666",
          }}
        >
          <Typography sx={{ fontSize: 13, color: "#dc2626", mb: 1 }}>{error}</Typography>
          <Typography
            onClick={fetchActivities}
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

  return (
    <Box
      sx={{
        border: "1px solid #d0d5dd",
        borderRadius: "4px",
        p: 2,
        minHeight: 200,
        backgroundColor: "#fff",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#000" }}>{title}</Typography>
        <Typography
          onClick={fetchActivities}
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

      {activities.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 4,
            color: "#999",
          }}
        >
          <Typography sx={{ fontSize: 13 }}>No activity yet</Typography>
          <Typography sx={{ fontSize: 11, mt: 0.5 }}>
            Activity will appear here as you use VerifyWise
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {activities.map((activity) => (
            <Stack
              key={activity.id}
              direction="row"
              spacing={1.5}
              sx={{
                py: 1,
                borderBottom: "1px solid #f3f4f6",
                "&:last-child": { borderBottom: "none" },
              }}
            >
              {showAvatar && (
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    backgroundColor: getAvatarColor(activity.entityType),
                    flexShrink: 0,
                  }}
                >
                  {getActivityIcon(activity.type)}
                </Avatar>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#000",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {activity.title}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#666",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {activity.description}
                </Typography>
                {showTimestamp && (
                  <Typography sx={{ fontSize: 11, color: "#999", mt: 0.25 }}>
                    {activity.relativeTime}
                    {activity.userName && ` by ${activity.userName}`}
                  </Typography>
                )}
              </Box>
            </Stack>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default ActivityFeedWidget;
