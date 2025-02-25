import { Stack, Typography } from "@mui/material";
import { smallStatsCardHeader, smallStatsCardStyle } from "./style";
import ProgressBar from "../../ProjectCard/ProgressBar";

const SmallStatsCard = () => {
  return (
    <Stack className="small-stats-card" sx={smallStatsCardStyle}>
      <Stack className="small-stats-card-header" sx={smallStatsCardHeader}>
        <Typography sx={{ fontSize: 13, color: "#8594AC" }}>
          Compliance tracker completion rate
        </Typography>
        <Typography sx={{ fontSize: 13, color: "#2D3748", fontWeight: 700 }}>
          60%
        </Typography>
      </Stack>

      <ProgressBar progress={"90/100"} />
    </Stack>
  );
};

export default SmallStatsCard;
