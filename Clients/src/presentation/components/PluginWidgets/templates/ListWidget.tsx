/**
 * Generic List Widget Template
 *
 * A reusable widget template that displays a list of items.
 * Plugins can use this template by specifying "list" as the template type.
 *
 * Expected API Response:
 * {
 *   success: true,
 *   data: {
 *     items: [
 *       { id: "1", title: "Item 1", description: "Description", icon?: "folder", timestamp?: "2024-01-01" },
 *       ...
 *     ],
 *     total: 10
 *   }
 * }
 */

import { useState, useEffect, useCallback } from "react";
import { Stack, Box, Typography, CircularProgress, Avatar } from "@mui/material";
import {
  Folder,
  File,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  RefreshCw,
} from "lucide-react";
import { apiServices } from "../../../../infrastructure/api/networkServices";

interface ListItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  timestamp?: string;
  status?: "success" | "warning" | "error" | "info";
  metadata?: Record<string, unknown>;
}

interface ListWidgetProps {
  pluginId: string;
  endpoint: string;
  title?: string;
  config?: {
    maxItems?: number;
    showIcon?: boolean;
    showTimestamp?: boolean;
    refreshInterval?: number;
    emptyMessage?: string;
  };
}

// Icon mapping for list items
const iconMap: Record<string, React.ReactNode> = {
  folder: <Folder size={14} color="#6b7280" />,
  file: <File size={14} color="#6b7280" />,
  user: <User size={14} color="#6b7280" />,
  alert: <AlertTriangle size={14} color="#ea580c" />,
  check: <CheckCircle size={14} color="#16a34a" />,
  clock: <Clock size={14} color="#2563eb" />,
  star: <Star size={14} color="#eab308" />,
};

// Status colors
const statusColors: Record<string, string> = {
  success: "#dcfce7",
  warning: "#fef3c7",
  error: "#fee2e2",
  info: "#dbeafe",
};

const ListWidget: React.FC<ListWidgetProps> = ({
  pluginId,
  endpoint,
  title = "Items",
  config = {},
}) => {
  const [items, setItems] = useState<ListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    maxItems = 10,
    showIcon = true,
    showTimestamp = true,
    refreshInterval,
    emptyMessage = "No items to display",
  } = config;

  const fetchItems = useCallback(async () => {
    try {
      const response = await apiServices.get(
        `/plugins/${pluginId}${endpoint}?limit=${maxItems}`
      );

      const data = response.data as { success: boolean; data?: { items: ListItem[] }; error?: string };

      if (data.success && data.data?.items) {
        setItems(data.data.items);
        setError(null);
      } else {
        setError(data.error || "Failed to load items");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items");
    } finally {
      setIsLoading(false);
    }
  }, [pluginId, endpoint, maxItems]);

  useEffect(() => {
    fetchItems();

    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchItems, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchItems, refreshInterval]);

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
            color: "#666",
          }}
        >
          <Typography sx={{ fontSize: 13, color: "#dc2626", mb: 1 }}>{error}</Typography>
          <Typography
            onClick={fetchItems}
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
    <Box sx={{ height: "100%", p: 2, overflow: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#000" }}>{title}</Typography>
        <Typography
          onClick={fetchItems}
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

      {items.length === 0 ? (
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
          <Typography sx={{ fontSize: 13 }}>{emptyMessage}</Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {items.map((item) => (
            <Stack
              key={item.id}
              direction="row"
              spacing={1.5}
              sx={{
                py: 1,
                borderBottom: "1px solid #f3f4f6",
                "&:last-child": { borderBottom: "none" },
              }}
            >
              {showIcon && (
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    backgroundColor: item.status ? statusColors[item.status] : "#f3f4f6",
                    flexShrink: 0,
                  }}
                >
                  {iconMap[item.icon || "file"] || iconMap.file}
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
                  {item.title}
                </Typography>
                {item.description && (
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: "#666",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.description}
                  </Typography>
                )}
                {showTimestamp && item.timestamp && (
                  <Typography sx={{ fontSize: 11, color: "#999", mt: 0.25 }}>
                    {item.timestamp}
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

export default ListWidget;
