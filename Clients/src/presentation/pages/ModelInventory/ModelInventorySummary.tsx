import React from "react";
import { Stack, Box, Typography, useTheme } from "@mui/material";
import { ModelInventorySummary as Summary } from "../../../domain/interfaces/i.modelInventory";

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
      sx={{
        mb: 3,
        flexWrap: "wrap",
      }}
    >
      {summaryCards.map((card) => (
        <Box
          key={card.title}
          sx={{
            flex: 1,
            minWidth: "200px",
            backgroundColor: "white",
            border: `1px solid ${theme.palette.border.light}`,
            borderRadius: theme.shape.borderRadius,
            padding: theme.spacing(3),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: card.color,
              fontSize: "2rem",
            }}
          >
            {card.count}
          </Typography>
          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: theme.palette.text.secondary,
              textTransform: "uppercase",
            }}
          >
            {card.title}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
};

export default ModelInventorySummary;
