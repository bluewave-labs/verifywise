import { Stack, Typography } from "@mui/material";
import { smallStatsCardHeader, smallStatsCardStyle } from "./style";
import ProgressBar from "../../ProjectCard/ProgressBar";

const SmallStatsCard = ({
  attributeTitle = "Compliance tracker",
  rate = 60,
  progress = "90/100",
}) => {
  return (
    <Stack className="small-stats-card" sx={smallStatsCardStyle}>
      <Stack className="small-stats-card-header" sx={smallStatsCardHeader}>
        <Typography sx={{ fontSize: 13, color: "#8594AC" }}>
          {attributeTitle} completion rate
        </Typography>
        <Typography sx={{ fontSize: 16, color: "#2D3748", fontWeight: 700 }}>
          {Math.floor(rate * 100)}%
        </Typography>
      </Stack>

      <ProgressBar progress={progress} />
    </Stack>
  );
};

export default SmallStatsCard;
