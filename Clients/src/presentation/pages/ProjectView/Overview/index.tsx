import { Stack, Typography, useTheme } from "@mui/material";
import { ProjectOverview } from "../../../mocks/projects/project-overview.data";
import ProgressBar from "../../../components/ProjectCard/ProgressBar";
import { FC, memo, useCallback, useMemo } from "react";
import Risks from "../../../components/Risks";

interface OverviewProps {
  project: ProjectOverview;
}

const Overview: FC<OverviewProps> = memo(({ project }) => {
  const {
    owner,
    lastUpdated,
    lastUpdatedBy,
    controlsStatus,
    assessmentsStatus,
    projectRisks,
    vendorRisks,
  } = project;
  const theme = useTheme();

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
    (progress: string, label: string) => (
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
          {progress} {label} completed
        </Typography>
      </Stack>
    ),
    [styles.block, styles.title]
  );

  return (
    <Stack>
      <Stack direction="row" spacing={18} sx={{ pb: "31px" }}>
        <Stack sx={styles.block}>
          <Typography sx={styles.title}>Owner</Typography>
          <Typography sx={styles.value}>{owner}</Typography>
        </Stack>
        <Stack sx={styles.block}>
          <Typography sx={styles.title}>Last updated</Typography>
          <Typography sx={styles.value}>{lastUpdated}</Typography>
        </Stack>
        <Stack sx={styles.block}>
          <Typography sx={styles.title}>Last updated by</Typography>
          <Typography sx={styles.value}>{lastUpdatedBy}</Typography>
        </Stack>
      </Stack>
      <Stack direction="row" spacing={18} sx={{ pb: "56px" }}>
        {progressBarCardRender(
          `${controlsStatus.completedControls}/${controlsStatus.totalControls}`,
          "controls"
        )}
        {progressBarCardRender(
          `${assessmentsStatus.completedAssessments}/${assessmentsStatus.totalAssessments}`,
          "assessments"
        )}
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
        <Risks {...projectRisks} />
      </Stack>
      <Stack>
        <Typography
          sx={{ color: "#1A1919", fontWeight: 600, mb: "10px", fontSize: 16 }}
        >
          Vendor risks
        </Typography>
        <Risks {...vendorRisks} />
      </Stack>
    </Stack>
  );
});

export default Overview;
