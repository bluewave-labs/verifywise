import React from "react";
import { Box, Stack, Typography, LinearProgress } from "@mui/material";

interface FrameworkProgressProps {
  name: string;
  progress: number;
  completed: number;
  total: number;
  isLast?: boolean;
}

const FrameworkProgress: React.FC<FrameworkProgressProps> = ({
  name,
  progress,
  completed,
  total,
  isLast = false,
}) => (
  <Box sx={{ mb: isLast ? 0 : 2 }}>
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      mb={0.5}
    >
      <Typography sx={{ fontSize: 13, color: "#1F2937", fontWeight: 500 }}>
        {name}
      </Typography>
      <Typography sx={{ fontSize: 12, color: "#667085" }}>
        {completed}/{total} ({Math.round(progress)}%)
      </Typography>
    </Stack>
    <LinearProgress
      variant="determinate"
      value={progress}
      sx={{
        height: 6,
        borderRadius: 3,
        backgroundColor: "#E5E7EB",
        "& .MuiLinearProgress-bar": {
          backgroundColor:
            progress >= 80 ? "#10B981" : progress >= 50 ? "#F59E0B" : "#13715B",
          borderRadius: 3,
        },
      }}
    />
  </Box>
);

export default FrameworkProgress;
