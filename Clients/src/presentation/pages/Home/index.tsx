import { Box, Button, Stack, Typography, useTheme } from "@mui/material";
import ProjectCard, { ProjectCardProps } from "../../components/ProjectCard";
import { mockProjects } from "../../mocks/dashboard/project.data";
import { NoProjectBox, StyledStack, styles } from "./styles";
import dashboardData from "../../mocks/dashboard/dashboard.data";
import emptyState from "../../assets/imgs/empty-state.svg"
import Popup from "../../components/Popup";
import CreateProjectForm from "../../components/CreateProjectForm";

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
          <StyledStack key={index}>
            <Typography sx={styles.gridTitle}>{metric.title}</Typography>
            <Typography sx={styles.gridValue}>{metric.value}</Typography>
          </StyledStack>
        ))}
      </Stack>
    </>
  );

  const NoProjectsMessage = () => (
    <NoProjectBox>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <img src={emptyState} alt="Empty project state" />
      </Box>
      <Typography sx={{ textAlign: "center", mt: 13.5, color: theme.palette.text.tertiary }}>
        You have no projects, yet. Click on the "New Project" button to start
        one.
      </Typography>
    </NoProjectBox>
  );

  return (
    <Box>
      <Box sx={styles.projectBox}>
        <Typography variant="h1" component="div" sx={styles.title}>
          Projects overview
        </Typography>
        <Popup 
          popupId="create-project-popup" 
          popupContent={<CreateProjectForm/>} 
          openPopupButtonName="New project"
          actionButtonName="Create project"
          popupTitle="Create new project"
          popupSubtitle="Create a new project from scratch by filling in the following."
        />
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
