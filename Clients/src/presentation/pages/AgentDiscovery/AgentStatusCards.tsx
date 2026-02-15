import React from "react";
import { Stack, Typography, Box } from "@mui/material";
import VWTooltip from "../../components/VWTooltip";
import {
  statusCardsContainer,
  statusCardTile,
  statusCardKey,
  statusCardValue,
} from "./style";

interface AgentStats {
  total: number;
  unreviewed: number;
  confirmed: number;
  rejected: number;
  stale: number;
}

interface AgentStatusCardsProps {
  stats: AgentStats;
}

const AgentStatusCards: React.FC<AgentStatusCardsProps> = ({ stats }) => {
  const cards = [
    { key: "total", label: "Total", color: "#1976D2", count: stats.total },
    { key: "unreviewed", label: "Unreviewed", color: "#F9A825", count: stats.unreviewed },
    { key: "confirmed", label: "Confirmed", color: "#2E7D32", count: stats.confirmed },
    { key: "rejected", label: "Rejected", color: "#D32F2F", count: stats.rejected },
    { key: "stale", label: "Stale", color: "#455A64", count: stats.stale },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <Stack sx={statusCardsContainer} direction="row">
        {cards.map((card) => (
          <VWTooltip
            key={card.key}
            content={`${card.count} ${card.label} agent${card.count !== 1 ? "s" : ""}`}
            placement="top"
          >
            <Stack
              sx={{
                ...statusCardTile,
                color: card.color,
              }}
            >
              <Typography sx={statusCardKey}>{card.label}</Typography>
              <Typography sx={statusCardValue}>{card.count}</Typography>
            </Stack>
          </VWTooltip>
        ))}
      </Stack>
    </Box>
  );
};

export default AgentStatusCards;
