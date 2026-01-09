import React from "react";
import { Box, Stack, Typography } from "@mui/material";

interface ActivityItemProps {
  title: string;
  timestamp: string;
  type: string;
  isLast?: boolean;
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  title,
  timestamp,
  type,
  isLast = false,
}) => (
  <Stack
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    sx={{ py: 1, borderBottom: isLast ? "none" : "1px solid #F3F4F6" }}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: 13,
          color: "#1F2937",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {title}
      </Typography>
      <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>{type}</Typography>
    </Box>
    <Typography sx={{ fontSize: 11, color: "#9CA3AF", ml: 2, flexShrink: 0 }}>
      {timestamp}
    </Typography>
  </Stack>
);

export default ActivityItem;
