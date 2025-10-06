import React from "react";
import { Stack, Typography, Tooltip, Box } from "@mui/material";
import { ModelInventorySummary as Summary } from "../../../domain/interfaces/i.modelInventory";
import {
  projectRisksCard,
  projectRisksTileCard,
  projectRisksTileCardKey,
  projectRisksTileCardvalue,
} from "../../components/Cards/RisksCard/style";

interface ModelInventorySummaryProps {
  summary: Summary;
}

const ModelInventorySummary: React.FC<ModelInventorySummaryProps> = ({
  summary,
}) => {
  const statusLevels = [
    { key: "approved", label: "Approved", color: "#4CAF50" },
    { key: "restricted", label: "Restricted", color: "#FF5722" },
    { key: "pending", label: "Pending", color: "#FF9800" },
    { key: "blocked", label: "Blocked", color: "#F44336" },
  ];

  // Map summary data to status counts
  const statusCounts = statusLevels.map((level) => ({
    ...level,
    count: summary[level.key as keyof Summary],
  }));

  return (
    <Box sx={{ width: "100%" }}>
      <Stack className="vw-model-inventory-summary" sx={projectRisksCard}>
        {statusCounts.map((level) => (
          <Tooltip
            key={level.key}
            title={`${level.count} ${level.label} Model${level.count !== 1 ? 's' : ''}`}
            arrow
            placement="top"
          >
            <Stack
              className="vw-model-inventory-tile"
              sx={{
                ...projectRisksTileCard,
                color: level.color,
                border: `1px solid #E5E7EB`,
                cursor: "default",
              }}
            >
              <Typography sx={projectRisksTileCardKey}>{level.label}</Typography>
              <Typography sx={projectRisksTileCardvalue}>
                {level.count}
              </Typography>
            </Stack>
          </Tooltip>
        ))}
      </Stack>
    </Box>
  );
};

export default ModelInventorySummary;
