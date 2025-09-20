import { Stack, Typography, Tooltip, Box } from "@mui/material";
import {
  projectRisksCard,
  projectRisksTileCard,
  projectRisksTileCardKey,
  projectRisksTileCardvalue,
} from "../../components/Cards/RisksCard/style";

import { IModelRisk, ModelRiskLevel } from "../../../domain/interfaces/i.modelRisk";

interface ModelRiskSummaryProps {
  modelRisks: IModelRisk[];
}

const ModelRiskSummary: React.FC<ModelRiskSummaryProps> = ({ modelRisks }) => {
  const riskLevels = [
    { key: ModelRiskLevel.LOW, label: "Low", color: "#4CAF50" },
    { key: ModelRiskLevel.MEDIUM, label: "Medium", color: "#FF9800" },
    { key: ModelRiskLevel.HIGH, label: "High", color: "#FF5722" },
    { key: ModelRiskLevel.CRITICAL, label: "Critical", color: "#F44336" },
  ];

  // Count how many risks per level
  const riskCounts = riskLevels.map((level) => ({
    ...level,
    count: modelRisks.filter((risk) => risk.riskLevel === level.key).length,
  }));

  return (
    <Box sx={{ width: "100%" }}>
      <Stack className="vw-model-risk-summary" sx={projectRisksCard}>
        {riskCounts.map((level) => (
          <Tooltip
            key={level.key}
            title={`${level.count} ${level.label} Risk${level.count !== 1 ? 's' : ''}`}
            arrow
            placement="top"
          >
            <Stack
              className="vw-model-risk-tile"
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

export default ModelRiskSummary;