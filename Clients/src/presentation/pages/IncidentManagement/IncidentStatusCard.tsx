import { Stack, Typography, Tooltip, Box } from "@mui/material";
import { IncidentManagementStatus } from "../../../domain/enums/aiIncidentManagement.enum";
import { incidentManagementCard, incidentManagementCardKey, incidentManagementCardValue, incidentManagementTileCard } from "./style";
import { AIIncidentManagementModel } from "../../../domain/models/Common/incidentManagement/incidentManagement.model";

interface IncidentStatusCardProps {
  incidents: AIIncidentManagementModel[];
}

const IncidentStatusCard: React.FC<IncidentStatusCardProps> = ({ incidents }) => {
  const statusLevels = [
    { key: IncidentManagementStatus.OPEN, label: "Open", color: "#F9A825" },
    { key: IncidentManagementStatus.INVESTIGATED, label: "Investigating", color: "#FB8C00" },
    { key: IncidentManagementStatus.MITIGATED, label: "Mitigated", color: "#2E7D32" },
    { key: IncidentManagementStatus.CLOSED, label: "Closed", color: "#455A64" },
  ];

  // Count incidents per status, excluding archived incidents
  const statusCounts = statusLevels.map((level) => ({
    ...level,
    count: incidents.filter((i) => i.status === level.key && !i.archived).length,
  }));

  return (
    <Box sx={{ width: "100%" }}>
      <Stack className="vw-incident-status" sx={incidentManagementCard} direction="row">
        {statusCounts.map((level) => (
          <Tooltip
            key={level.key}
            title={`${level.count} ${level.label} Incident${level.count !== 1 ? "s" : ""}`}
            arrow
            placement="top"
          >
            <Stack
              className="vw-incident-status-tile"
              sx={{
                ...incidentManagementTileCard,
                color: level.color,
                border: `1px solid #d0d5dd`,
                cursor: "default",
                borderRadius: 2
              }}
            >
              <Typography sx={incidentManagementCardKey}>{level.label}</Typography>
              <Typography sx={incidentManagementCardValue}>{level.count}</Typography>
            </Stack>
          </Tooltip>
        ))}
      </Stack>
    </Box>
  );
};

export default IncidentStatusCard;
