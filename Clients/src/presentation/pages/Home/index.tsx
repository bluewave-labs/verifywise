import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import ProjectCard, { ProjectCardProps } from "../../components/ProjectCard";
import { mockProjects } from "../../mocks/dashboard/project.data";
import { styles } from "./styles";
import dashboardData from "../../mocks/dashboard/dashboard.data";
import emptyState from "../../assets/imgs/empty-state.svg"

interface HomeProps {
  projects?: ProjectCardProps[];
}

interface MetricSectionProps {
  title: string;
  metrics: {
    title: string;
    value: string | number;
  }[];
}

const Home = ({ projects = mockProjects }: HomeProps) => {
  const theme = useTheme();
  const { complianceStatus, riskStatus } = dashboardData;
  const complianceMetrics = [
    { title: "Completed requirements", value: `${complianceStatus.assessmentCompletionRate}%` },
    { title: "Completed assessments", value: complianceStatus.completedAssessments },
    { title: "Assessment completion rate", value: `${complianceStatus.completedRequirementsPercentage}%` },
  ];
  const riskMetrics = [
    { title: "Acceptable risks", value: riskStatus.acceptableRisks },
    { title: "Residual risks", value: riskStatus.residualRisks },
    { title: "Unacceptable risks", value: riskStatus.unacceptableRisks },
  ];

  const MetricSection = ({ title, metrics }: MetricSectionProps) => (
    <>
      <Typography variant="h2" component="div" sx={styles.title2}>
        {title}
      </Typography>
      <Stack direction="row" justifyContent="space-between" spacing={15}>
        {metrics.map((metric, index) => (
          <Stack key={index} sx={styles.grid}>
            <Typography sx={styles.gridTitle}>{metric.title}</Typography>
            <Typography sx={styles.gridValue}>{metric.value}</Typography>
          </Stack>
        ))}
      </Stack>
    </>
  );

  const NoProjectsMessage = () => (
    <Box sx={styles.noProjectBox}>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <img src={emptyState} alt="Empty project state" />
      </Box>
      <Typography sx={{ textAlign: "center", mt: 13.5, color: theme.palette.text.tertiary }}>
        You have no projects, yet. Click on the "New Project" button to start
        one.
      </Typography>
    </Box>
  );

  return (
    <Box>
      <Box sx={styles.projectBox}>
        <Typography variant="h1" component="div" sx={styles.title}>
          Projects overview
        </Typography>
        <Button
          variant="contained"
          sx={{ textTransform: "none", borderRadius: 2, maxHeight: 34 }}
          onClick={() => {}}
        >
          New project
        </Button>
      </Box>
      {projects && projects.length > 0 ? (
        <>
          <Stack direction="row" justifyContent="space-between" spacing={15}>
            {projects.map((item: ProjectCardProps) => (
                <ProjectCard key={item.id} {...item} />
            ))}
          </Stack>
          <MetricSection
            title="All projects compliance status"
            metrics={complianceMetrics}
          />
          <MetricSection
            title="All projects risk status"
            metrics={riskMetrics}
          />
        </>
      ) : (
        <NoProjectsMessage />
      )}
    </Box>
  );
};

export default Home;
