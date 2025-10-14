import { Stack, Typography, Tooltip, Box } from "@mui/material";
import {
  projectRisksCard,
  projectRisksTileCard,
  projectRisksTileCardKey,
  projectRisksTileCardvalue,
} from "../../components/Cards/RisksCard/style"; // ✅ reuse same styles as ProjectRiskView Cards

import { Policy } from "../../../domain/types/Policy";

interface PolicyStatusCardProps {
  policies: Policy[];
}

const PolicyStatusCard: React.FC<PolicyStatusCardProps> = ({ policies }) => {
  const statusLevels = [
    { key: "Draft", label: "Draft", color: "#9E9E9E" },
    { key: "Under Review", label: "Under Review", color: "#FF9800" },
    { key: "Approved", label: "Approved", color: "#4CAF50" },
    { key: "Published", label: "Published", color: "#2196F3" },
    { key: "Archived", label: "Archived", color: "#757575" },
  ];

  // Count how many policies per status
  const statusCounts = statusLevels.map((level) => ({
    ...level,
    count: policies.filter((p) => p.status === level.key).length,
  }));

  return (
    <Box sx={{ width: "100%" }}>
      <Stack className="vw-policy-status" sx={projectRisksCard}>
        {statusCounts.map((level) => (
          <Tooltip
            key={level.key}
            title={`${level.count} ${level.label} Policy`}
            arrow
            placement="top"
          >
            <Stack
              className="vw-policy-status-tile"
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

export default PolicyStatusCard;
