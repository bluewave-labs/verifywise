import { Stack, Typography } from "@mui/material";
import {
  projectRisksCard,
  projectRisksTileCard,
  projectRisksTileCardKey,
  projectRisksTileCardvalue,
} from "./style";

type projectRisksSummary = {
  veryHighRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  veryLowRisks: number;
};

const RisksCard = ({
  projectRisksSummary,
}: {
  projectRisksSummary: projectRisksSummary;
}) => {
  const getValidRiskValue = (value: number) => (isNaN(value) ? 0 : value);

  return (
    <Stack className="vw-project-risks" sx={projectRisksCard}>
      <Stack
        className="vw-project-risks-tile"
        sx={{ ...projectRisksTileCard, color: "#C63622" }}
      >
        <Typography sx={projectRisksTileCardKey}>Very High</Typography>
        <Typography sx={projectRisksTileCardvalue}>
          {getValidRiskValue(projectRisksSummary.veryHighRisks)}
        </Typography>
      </Stack>
      <Stack
        className="vw-project-risks-tile"
        sx={{ ...projectRisksTileCard, color: "#D68B61" }}
      >
        <Typography sx={projectRisksTileCardKey}>High</Typography>
        <Typography sx={projectRisksTileCardvalue}>
          {getValidRiskValue(projectRisksSummary.highRisks)}
        </Typography>
      </Stack>
      <Stack
        className="vw-project-risks-tile"
        sx={{ ...projectRisksTileCard, color: "#D6B971" }}
      >
        <Typography sx={projectRisksTileCardKey}>Medium</Typography>
        <Typography sx={projectRisksTileCardvalue}>
          {getValidRiskValue(projectRisksSummary.mediumRisks)}
        </Typography>
      </Stack>
      <Stack
        className="vw-project-risks-tile"
        sx={{ ...projectRisksTileCard, color: "#B8D39C" }}
      >
        <Typography sx={projectRisksTileCardKey}>Low</Typography>
        <Typography sx={projectRisksTileCardvalue}>
          {getValidRiskValue(projectRisksSummary.lowRisks)}
        </Typography>
      </Stack>
      <Stack
        className="vw-project-risks-tile"
        sx={{ ...projectRisksTileCard, color: "#52AB43" }}
      >
        <Typography sx={projectRisksTileCardKey}>Very Low</Typography>
        <Typography sx={projectRisksTileCardvalue}>
          {getValidRiskValue(projectRisksSummary.veryLowRisks)}
        </Typography>
      </Stack>
    </Stack>
  );
};

export default RisksCard;
