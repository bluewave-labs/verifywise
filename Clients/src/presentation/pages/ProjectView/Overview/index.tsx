import { Stack, Typography, useTheme } from "@mui/material";
import ProgressBar from "../../../components/ProjectCard/ProgressBar";
import { FC, memo, useCallback, useContext, useMemo } from "react";
import { formatDate } from "../../../tools/isoDateToString";
import Risks from "../../../components/Risks";
import { useSearchParams } from "react-router-dom";
import useProjectData from "../../../../application/hooks/useProjectData";
import { VerifyWiseContext } from "../../../../application/contexts/VerifyWise.context";
import getProjectData from "../../../../application/tools/getProjectData";

export type RiskData = {
  veryHighRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  veryLowRisks: number;
};

interface OverviewProps {
  projectRisksSummary: RiskData;
  vendorRisksSummary: RiskData;
}

interface ProgressBarCardProps {
  progress: string;
  label: string;
  completed: number;
}

const Overview: FC<OverviewProps> = memo(({ projectRisksSummary, vendorRisksSummary }) => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "1"; // default project ID is 2
  const { project, projectOwner, error, isLoading } = useProjectData({ projectId });
  const theme = useTheme();
  const { projectStatus } = useContext(VerifyWiseContext);

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
        border: `1px solid ${theme.palette.border.light}`,
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
          {progress} {label}{completed > 1 && 's'} completed
        </Typography>
      </Stack>
    ),
    [styles.block, styles.title]
  );

  if (!project) {
    return "No project found";
  }

  return (
    <Stack>
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
          <Typography sx={styles.title}>Last updated</Typography>
          <Typography sx={styles.value}>
            {formatDate(project.last_updated)}
          </Typography>
        </Stack>
        <Stack sx={styles.block}>
          <Typography sx={styles.title}>Last updated by</Typography>
          <Typography sx={styles.value}>{project.last_updated_by}</Typography>
        </Stack>
      </Stack>
      <Stack direction="row" spacing={18} sx={{ pb: "56px" }}>
        {progressBarCardRender({
          progress: controlsProgress,
          label: "control",
          completed: controlsCompleted,
        })}
        {progressBarCardRender({
          progress: assessmentsProgress,
          label: "assessment",
          completed: requirementsCompleted,
        })}
        <Stack
          sx={{ minWidth: 228, width: "100%", p: "8px 36px 14px 14px" }}
        ></Stack>
      </Stack>
      <Stack sx={{ mb: "37px" }}>
        <Typography
          sx={{ color: "#1A1919", fontWeight: 600, mb: "10px", fontSize: 16 }}
        >
          Project risks
        </Typography>
        <Risks {...projectRisksSummary} />
      </Stack>
      <Stack>
        <Typography
          sx={{ color: "#1A1919", fontWeight: 600, mb: "10px", fontSize: 16 }}
        >
          Vendor risks
        </Typography>
        <Risks {...vendorRisksSummary} />
      </Stack>
    </Stack>
  );
});

export default Overview;
