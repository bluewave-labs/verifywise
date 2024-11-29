import { Stack, Typography, useTheme } from "@mui/material";
import ProgressBar from "../../../components/ProjectCard/ProgressBar";
import { FC, memo, useCallback, useEffect, useMemo, useState } from "react";
import { getEntityById } from "../../../../application/repository/entity.repository";
import { formatDate } from "../../../tools/isoDateToString";
import Risks from "../../../components/Risks";
import { ProjectOverview } from "../../../mocks/projects/project-overview.data";
import { useParams } from "react-router-dom";

interface OverviewProps {
  mocProject: ProjectOverview;
}

type ProjectData = {
  project_title: string;
  owner: string;
  last_updated: string;
  last_updated_by: string;
};

const Overview: FC<OverviewProps> = memo(({mocProject}) => {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { projectId = 2 } = useParams<{ projectId: string }>(); // default project ID is 2
  const theme = useTheme();
  const {
    controlsStatus,
    assessmentsStatus,
    projectRisks,
    vendorRisks,
  } = mocProject;
  
  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    getEntityById({ routeUrl: `/projects/${projectId}` })
      .then(({ data }) => {
        setProject(data);
        setError(null);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError("Failed to fetch the project: " + err.message);
          setProject(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

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
  
  if(!project){
    return "No project found";
  }

  return (
    <Stack>
      {isLoading ? (
        <Typography component="div" sx={{ mb: 12 }}>
          Project are loading...
        </Typography>
      ) : error ? (
        <Typography component="div" sx={{ mb: 12 }}>
          {error}
        </Typography>
      ) : null}
      <Stack direction="row" spacing={18} sx={{ pb: "31px" }}>
        <Stack sx={styles.block}>
          <Typography sx={styles.title}>Owner</Typography>
          <Typography sx={styles.value}>{project.owner}</Typography>
        </Stack>
        <Stack sx={styles.block}>
          <Typography sx={styles.title}>Last updated</Typography>
          <Typography sx={styles.value}>{formatDate(project.last_updated)}</Typography>
        </Stack>
        <Stack sx={styles.block}>
          <Typography sx={styles.title}>Last updated by</Typography>
          <Typography sx={styles.value}>{project.last_updated_by}</Typography>
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
