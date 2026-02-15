import { Stack, Typography, useTheme } from "@mui/material";
import { smallStatsCardHeader, smallStatsCardStyle } from "./style";
import ProgressBar from "../../ProjectCard/ProgressBar";

interface SmallStatsCardProps {
  attributeTitle?: string;
  rate?: number;
  progress?: string;
}

export function SmallStatsCard({
  attributeTitle = "Compliance tracker",
  rate = 60,
  progress = "90/100",
}: SmallStatsCardProps) {
  const theme = useTheme();
  return (
    <Stack className="small-stats-card" sx={smallStatsCardStyle(theme)}>
      <Stack className="small-stats-card-header" sx={smallStatsCardHeader}>
        <Typography sx={{ fontSize: 13, color: theme.palette.text.accent }}>
          {attributeTitle} completion rate
        </Typography>
        <Typography sx={{ fontSize: 16, color: theme.palette.text.primary, fontWeight: 700 }}>
          {Math.floor(rate * 100)}%
        </Typography>
      </Stack>

      <ProgressBar progress={progress} />
    </Stack>
  );
}
