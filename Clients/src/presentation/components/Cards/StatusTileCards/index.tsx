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
}

const StatusTileCards: React.FC<StatusTileCardsProps> = ({
  items,
  tooltipFormat,
  entityName = "item",
  cardSx,
}) => {
  const getTooltip = (item: StatusTileItem): string => {
    if (tooltipFormat) {
      return tooltipFormat(item);
    }
    const plural = item.count !== 1 ? "s" : "";
    return `${item.count} ${item.label.toLowerCase()} ${entityName}${plural}`;
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
                border: "1px solid #d0d5dd",
                cursor: "default",
                ...cardSx,
              }}
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
