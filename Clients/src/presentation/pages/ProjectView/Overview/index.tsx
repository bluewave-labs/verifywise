/**
 * This file is currently in use
 */

import { IconButton, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import ProgressBar from "../../../components/ProjectCard/ProgressBar";
import { FC, memo, useCallback, useContext, useMemo, useState } from "react";
import { displayFormattedDate } from "../../../tools/isoDateToString";
import Risks from "../../../components/Risks";
import { useSearchParams } from "react-router-dom";
import useProjectData from "../../../../application/hooks/useProjectData";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import getProjectData from "../../../../application/tools/getProjectData";
import { History as HistoryIcon } from "lucide-react";
import HistorySidebar from "../../../components/Common/HistorySidebar";
import { useEntityChangeHistory } from "../../../../application/hooks/useEntityChangeHistory";

export type RiskData = {
  veryHighRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  veryLowRisks: number;
};

interface OverviewProps {
  projectRisksSummary: RiskData;  
}

interface ProgressBarCardProps {
  progress: string;
  label: string;
  completed: number;
}

const Overview: FC<OverviewProps> = memo(({ projectRisksSummary }) => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "1"; // default project ID is 2
  const { project, projectOwner, error, isLoading } = useProjectData({
    projectId,
  });
  const theme = useTheme();
  const { projectStatus } = useContext(VerifyWiseContext);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);

  // Prefetch history data
  useEntityChangeHistory("use_case", parseInt(projectId));

  const {
    controlsProgress,
    requirementsProgress: assessmentsProgress,
    controlsCompleted,
    requirementsCompleted,
  } = getProjectData({
    projectId: parseInt(projectId),
    assessments: projectStatus.assessments,
    controls: projectStatus.controls,
  });

  const styles = useMemo(
    () => ({
      block: {
        borderRadius: 2,
        backgroundColor: theme.palette.background.main,
        minWidth: 228,
        width: "100%",
        padding: "8px 36px 14px 14px",
      },
      title: {
        fontSize: 12,
        color: "#8594AC",
        pb: "2px",
      },
      value: {
        fontSize: 16,
        fontWeight: 600,
        color: "#2D3748",
      },
    }),
    [theme]
  );

  const progressBarCardRender = useCallback(
    ({ progress, label, completed }: ProgressBarCardProps) => (
      <Stack sx={styles.block}>
        <Typography
          sx={{
            "&:first-letter": { textTransform: "uppercase" },
            ...styles.title,
          }}
        >
          {label} status
        </Typography>
        <ProgressBar progress={progress} />
        <Typography sx={{ fontSize: 11, color: "#8594AC" }}>
          {progress} {label}
          {completed > 1 && "s"} completed
        </Typography>
      </Stack>
    ),
    [styles.block, styles.title]
  );

  if (!project) {
    return "No project found";
  }

  return (
    <Stack direction="row" sx={{ width: "100%", alignItems: "flex-start" }}>
      {/* Main Content */}
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        {isLoading && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 12 }}>
            Project are loading...
          </Typography>
        )}
        {error && (
          <Typography variant="body1" color="error" sx={{ mb: 12 }}>
            {error}
          </Typography>
        )}
        <Stack direction="row" spacing={18} sx={{ pb: "31px" }}>
          <Stack sx={styles.block}>
            <Typography sx={styles.title}>Owner</Typography>
            <Typography sx={styles.value}>{projectOwner}</Typography>
          </Stack>
          <Stack sx={styles.block}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Typography sx={styles.title}>Last updated</Typography>
              <Tooltip title="View activity history" arrow>
                <IconButton
                  onClick={() => setIsHistorySidebarOpen((prev) => !prev)}
                  size="small"
                  sx={{
                    color: isHistorySidebarOpen ? "#13715B" : "#98A2B3",
                    padding: "4px",
                    borderRadius: "4px",
                    backgroundColor: isHistorySidebarOpen ? "#E6F4F1" : "transparent",
                    "&:hover": {
                      backgroundColor: isHistorySidebarOpen ? "#D1EDE6" : "#F2F4F7",
                    },
                    marginTop: "-4px",
                  }}
                >
                  <HistoryIcon size={20} />
                </IconButton>
              </Tooltip>
            </Stack>
            <Typography sx={styles.value}>
              {displayFormattedDate(project.last_updated.toISOString())}
            </Typography>
          </Stack>
          <Stack sx={styles.block}>
            <Typography sx={styles.title}>Last updated by</Typography>
            <Typography sx={styles.value}>{project.last_updated_by}</Typography>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={18} sx={{ pb: "56px" }} data-joyride-id="framework-progress">
          {progressBarCardRender({
            progress: controlsProgress,
            label: "control",
            completed: controlsCompleted,
          })}
          <Stack data-joyride-id="project-assessments">
            {progressBarCardRender({
              progress: assessmentsProgress,
              label: "assessment",
              completed: requirementsCompleted,
            })}
          </Stack>
          <Stack
            sx={{ minWidth: 228, width: "100%", p: "8px 36px 14px 14px" }}
          ></Stack>
        </Stack>
        <Stack sx={{ mb: 0 }} data-joyride-id="risk-summary">
          <Typography
            sx={{ color: "#1A1919", fontWeight: 600, mb: "10px", fontSize: 16 }}
          >
            Use case risks
          </Typography>
          <Risks {...projectRisksSummary} />
        </Stack>
      </Stack>

      {/* History Sidebar */}
      <HistorySidebar
        isOpen={isHistorySidebarOpen}
        entityType="use_case"
        entityId={parseInt(projectId)}
      />
    </Stack>
  );
});

export default Overview;
