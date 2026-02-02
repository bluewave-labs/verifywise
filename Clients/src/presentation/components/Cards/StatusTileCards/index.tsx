import React from "react";
import { Stack, Typography, Tooltip, Box } from "@mui/material";
import {
  projectRisksCard,
  projectRisksTileCard,
  projectRisksTileCardKey,
  projectRisksTileCardvalue,
} from "../RisksCard/style";

export interface StatusTileItem {
  key: string;
  label: string;
  count: number;
  color: string;
}

interface StatusTileCardsProps {
  items: StatusTileItem[];
  /** Optional: custom tooltip format. Default: "{count} {label}" */
  tooltipFormat?: (item: StatusTileItem) => string;
  /** Optional: entity name for pluralization in tooltip (e.g., "task", "model") */
  entityName?: string;
  /** Optional: custom styles to override individual card styling */
  cardSx?: Record<string, unknown>;
  /** Optional: callback when a card is clicked */
  onCardClick?: (key: string) => void;
  /** Optional: key of the currently selected card */
  selectedKey?: string | null;
}

const StatusTileCards: React.FC<StatusTileCardsProps> = ({
  items,
  tooltipFormat,
  entityName = "item",
  cardSx,
  onCardClick,
  selectedKey,
}) => {
  const getTooltip = (item: StatusTileItem): string => {
    if (tooltipFormat) {
      return tooltipFormat(item);
    }
    const pluralize = (name: string, count: number): string => {
      if (count === 1) return name;
      if (name.endsWith("y")) return name.slice(0, -1) + "ies";
      return name + "s";
    };
    return `${item.count} ${item.label.toLowerCase()} ${pluralize(entityName, item.count)}`;
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Stack className="vw-status-tile-cards" sx={projectRisksCard}>
        {items.map((item) => (
          <Tooltip
            key={item.key}
            title={getTooltip(item)}
            arrow
            placement="top"
          >
            <Stack
              className="vw-status-tile"
              sx={{
                ...projectRisksTileCard,
                color: item.color,
                border: selectedKey === item.key ? `2px solid ${item.color}` : "1px solid #d0d5dd",
                cursor: onCardClick ? "pointer" : "default",
                background: selectedKey === item.key ? "rgba(19, 113, 91, 0.15)" : undefined,
                ...cardSx,
              }}
              onClick={() => onCardClick?.(item.key)}
            >
              <Typography sx={projectRisksTileCardKey}>{item.label}</Typography>
              <Typography sx={projectRisksTileCardvalue}>{item.count}</Typography>
            </Stack>
          </Tooltip>
        ))}
      </Stack>
    </Box>
  );
};

export default StatusTileCards;
