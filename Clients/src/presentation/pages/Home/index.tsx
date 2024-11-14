import { Box, Stack, Typography, useTheme } from "@mui/material";
import ProjectCard, { ProjectCardProps } from "../../components/ProjectCard";
import { NoProjectBox, StyledStack, styles } from "./styles";
import dashboardData from "../../mocks/dashboard/dashboard.data";
import emptyState from "../../assets/imgs/empty-state.svg";
import Popup from "../../components/Popup";
import CreateProjectForm from "../../components/CreateProjectForm";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAllEntities } from "../../../application/repository/entity.repository";

interface MetricSectionProps {
  title: string;
  metrics: {
    title: string;
    value: string | number;
  }[];
}

const Home = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<ProjectCardProps[] | null>(null);
  useEffect(() => {
    getAllEntities({routeUrl: "/projects"})
        .then(({data}) => {
          console.log(data)
          setProjects(data);
        })
  }, []);

  const { complianceStatus, riskStatus } = dashboardData;
  const complianceMetrics = [
    {
      title: "Completed requirements",
      value: `${complianceStatus.assessmentCompletionRate}%`,
    },
    {
      title: "Completed assessments",
      value: complianceStatus.completedAssessments,
    },
    {
      title: "Assessment completion rate",
      value: `${complianceStatus.completedRequirementsPercentage}%`,
    },
  ];
  const riskMetrics = [
    { title: "Acceptable risks", value: riskStatus.acceptableRisks },
    { title: "Residual risks", value: riskStatus.residualRisks },
    { title: "Unacceptable risks", value: riskStatus.unacceptableRisks },
  ];

  const MetricSection = ({ title, metrics }: MetricSectionProps) => (
    <>
      <Typography
        variant="h2"
        component="div"
        sx={{ pb: 8.5, mt: 17, ...styles.title }}
      >
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
      <Typography
        sx={{
          textAlign: "center",
          mt: 13.5,
          color: theme.palette.text.tertiary,
        }}
      >
        You have no projects, yet. Click on the "New Project" button to start
        one.
      </Typography>
    </NoProjectBox>
  );

  const PopupRender = () => {
    const [anchor, setAnchor] = useState<null | HTMLElement>(null);
    const handleOpenOrClose = (event: React.MouseEvent<HTMLElement>) => {
        setAnchor(anchor ? null : event.currentTarget);
    };

    return (
      <Popup
          popupId="create-project-popup"
          popupContent={<CreateProjectForm />}
          openPopupButtonName="New project"
          popupTitle="Create new project"
          popupSubtitle="Create a new project from scratch by filling in the following."
          handleOpenOrClose={handleOpenOrClose}
          anchor={anchor}
      />
    )
  }

  return (
    <Box>
      <Box sx={styles.projectBox}>
        <Typography variant="h1" component="div" sx={styles.title}>
          Projects overview
        </Typography>
        <PopupRender />
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
