import { Stack, Typography } from "@mui/material";
import {
  projectRisksCard,
  projectRisksTileCard,
  projectRisksTileCardKey,
  projectRisksTileCardvalue,
} from "./style";

type risksSummary = {
  veryHighRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  veryLowRisks: number;
};

const RisksCard = ({
  risksSummary,
}: {
  risksSummary: risksSummary;
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
          {getValidRiskValue(risksSummary.veryHighRisks)}
        </Typography>
      </Stack>
      <Stack
        className="vw-project-risks-tile"
        sx={{ ...projectRisksTileCard, color: "#D68B61" }}
      >
        <Typography sx={projectRisksTileCardKey}>High</Typography>
        <Typography sx={projectRisksTileCardvalue}>
          {getValidRiskValue(risksSummary.highRisks)}
        </Typography>
      </Stack>
      <Stack
        className="vw-project-risks-tile"
        sx={{ ...projectRisksTileCard, color: "#D6B971" }}
      >
        <Typography sx={projectRisksTileCardKey}>Medium</Typography>
        <Typography sx={projectRisksTileCardvalue}>
          {getValidRiskValue(risksSummary.mediumRisks)}
        </Typography>
      </Stack>
      <Stack
        className="vw-project-risks-tile"
        sx={{ ...projectRisksTileCard, color: "#52AB43" }}
      >
        <Typography sx={projectRisksTileCardKey}>Low</Typography>
        <Typography sx={projectRisksTileCardvalue}>
          {getValidRiskValue(risksSummary.lowRisks)}
        </Typography>
      </Stack>
      <Stack
        className="vw-project-risks-tile"
        sx={{ ...projectRisksTileCard, color: "#B8D39C" }}
      >
        <Typography sx={projectRisksTileCardKey}>Very Low</Typography>
        <Typography sx={projectRisksTileCardvalue}>
          {getValidRiskValue(risksSummary.veryLowRisks)}
        </Typography>
      </Stack>
    </Stack>
  );
};

export default RisksCard;