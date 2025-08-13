import React from "react";
import { Stack, Box, Typography, useTheme } from "@mui/material";
import { ModelInventorySummary as Summary } from "../../../domain/interfaces/i.modelInventory";
import { 
  summaryContainerStyle, 
  summaryCardBoxStyle, 
  summaryCardNumberStyle, 
  summaryCardLabelStyle 
} from "./style";

interface ModelInventorySummaryProps {
  summary: Summary;
}

const ModelInventorySummary: React.FC<ModelInventorySummaryProps> = ({
  summary,
}) => {
  const theme = useTheme();

  const summaryCards = [
    {
      title: "Approved",
      count: summary.approved,
      color: "#388e3c",
      bgColor: "#c8e6c9",
    },
    {
      title: "Restricted",
      count: summary.restricted,
      color: "#e64a19",
      bgColor: "#ffccbc",
    },
    {
      title: "Pending",
      count: summary.pending,
      color: "#fbc02d",
      bgColor: "#fff9c4",
    },
    {
      title: "Blocked",
      count: summary.blocked,
      color: "#d32f2f",
      bgColor: "#ffcdd2",
    },
  ];

  return (
    <Stack
      direction="row"
      gap={2}
      sx={summaryContainerStyle}
    >
      {summaryCards.map((card) => (
        <Box
          key={card.title}
          sx={summaryCardBoxStyle(theme)}
        >
          <Typography
            variant="h4"
            sx={summaryCardNumberStyle(card.color)}
          >
            {card.count}
          </Typography>
          <Typography
            sx={summaryCardLabelStyle(theme)}
          >
            {card.title}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
};

export default ModelInventorySummary;
