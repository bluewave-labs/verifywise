/**
 * Generic Card Grid Widget Template
 *
 * A reusable widget template that displays multiple mini stats cards in a responsive grid.
 * Plugins can use this template by specifying "card-grid" as the template type.
 *
 * Expected API Response:
 * {
 *   success: true,
 *   data: {
 *     cards: [
 *       {
 *         id: "1",
 *         label: "Total Risks",
 *         value: 42,
 *         change?: "+5",
 *         changeType?: "increase" | "decrease" | "neutral",
 *         icon?: "shield" | "alert" | "check" | "clock" | "users" | "file" | "chart",
 *         color?: "#dc2626",
 *         url?: "/risks"
 *       },
 *       ...
 *     ]
 *   }
 * }
 */

import { useState, useEffect, useCallback } from "react";
import { Box, Typography, CircularProgress, Stack } from "@mui/material";
import {
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Target,
  Zap,
  Lock,
} from "lucide-react";
import { apiServices } from "../../../../infrastructure/api/networkServices";

interface CardData {
  id: string;
  label: string;
  value: number | string;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  icon?: string;
  color?: string;
  url?: string;
}

interface CardGridData {
  cards: CardData[];
}

interface CardGridWidgetProps {
  pluginId: string;
  endpoint: string;
  title?: string;
  config?: {
    columns?: 2 | 3 | 4;
    refreshInterval?: number;
    showChange?: boolean;
    compact?: boolean;
    emptyMessage?: string;
  };
}

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
  shield: <Shield size={18} />,
  alert: <AlertTriangle size={18} />,
  check: <CheckCircle size={18} />,
  clock: <Clock size={18} />,
  users: <Users size={18} />,
  file: <FileText size={18} />,
  chart: <BarChart3 size={18} />,
  activity: <Activity size={18} />,
  target: <Target size={18} />,
  zap: <Zap size={18} />,
  lock: <Lock size={18} />,
};

// Change type icons
const changeIcons: Record<string, React.ReactNode> = {
  increase: <TrendingUp size={12} />,
  decrease: <TrendingDown size={12} />,
  neutral: <Minus size={12} />,
};

// Change type colors
const changeColors: Record<string, string> = {
  increase: "#16a34a",
  decrease: "#dc2626",
  neutral: "#6b7280",
};

// Default colors for cards
const defaultColors = [
  "#13715B",
  "#2563eb",
  "#7c3aed",
  "#dc2626",
  "#d97706",
  "#16a34a",
];

const CardGridWidget: React.FC<CardGridWidgetProps> = ({
  pluginId,
  endpoint,
  title,
  config = {},
}) => {
  const [cardData, setCardData] = useState<CardGridData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    columns = 2,
    refreshInterval,
    showChange = true,
    compact = false,
    emptyMessage = "No data available",
  } = config;

  const fetchData = useCallback(async () => {
    try {
      const response = await apiServices.get(`/plugins/${pluginId}${endpoint}`);
      const data = response.data as { success: boolean; data?: CardGridData; error?: string };

      if (data.success && data.data) {
        setCardData(data.data);
        setError(null);
      } else {
        setError(data.error || "Failed to load card data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load card data");
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

  const handleCardClick = (url: string) => {
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
        {title && <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>{title}</Typography>}
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

  if (!cardData || cardData.cards.length === 0) {
    return (
      <Box sx={{ height: "100%", p: 2 }}>
        {title && <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 2 }}>{title}</Typography>}
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
      {title && (
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
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: compact ? 1 : 1.5,
        }}
      >
        {cardData.cards.map((card, index) => {
          const cardColor = card.color || defaultColors[index % defaultColors.length];
          const icon = card.icon ? iconMap[card.icon] : null;

          return (
            <Box
              key={card.id}
              sx={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "4px",
                p: compact ? 1.5 : 2,
                cursor: card.url ? "pointer" : "default",
                transition: "all 0.15s",
                "&:hover": card.url
                  ? {
                      borderColor: cardColor,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }
                  : {},
              }}
              onClick={() => card.url && handleCardClick(card.url)}
            >
              <Stack spacing={compact ? 0.5 : 1}>
                {/* Icon and label row */}
                <Stack direction="row" alignItems="center" spacing={1}>
                  {icon && (
                    <Box
                      sx={{
                        color: cardColor,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {icon}
                    </Box>
                  )}
                  <Typography
                    sx={{
                      fontSize: compact ? 10 : 11,
                      color: "#666",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {card.label}
                  </Typography>
                </Stack>

                {/* Value row */}
                <Stack direction="row" alignItems="baseline" spacing={1}>
                  <Typography
                    sx={{
                      fontSize: compact ? 20 : 24,
                      fontWeight: 700,
                      color: "#000",
                      lineHeight: 1,
                    }}
                  >
                    {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
                  </Typography>

                  {/* Change indicator */}
                  {showChange && card.change && (
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={0.25}
                      sx={{
                        color: changeColors[card.changeType || "neutral"],
                      }}
                    >
                      {changeIcons[card.changeType || "neutral"]}
                      <Typography
                        sx={{
                          fontSize: compact ? 10 : 11,
                          fontWeight: 500,
                        }}
                      >
                        {card.change}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default CardGridWidget;
