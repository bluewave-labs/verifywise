import { Box, Typography } from "@mui/material";
import Grid from '@mui/material/Grid2';
import ProjectCard, { ProjectCardProps } from "../../components/ProjectCard";
import { mockProjects } from "./projectData";
import { styles } from "./styles";
import Popup from "../../components/Popup";
import CreateProjectForm from "../../components/CreateProjectForm";

interface HomeProps {
    projects?: ProjectCardProps[]
}

interface MetricSectionProps {
  title: string,
  metrics: {
    title: string,
    value: string
  }[]
}

const Home = ({projects = mockProjects}: HomeProps) => {
  const complianceMetrics = [
    { title: "Completed requirements", value: "85%" },
    { title: "Completed assessments", value: "24" },
    { title: "Assessment completion rate", value: "10%" },
  ];
  
  const riskMetrics = [
    { title: "Acceptable risks", value: "31" },
    { title: "Residual risks", value: "1" },
    { title: "Unacceptable risks", value: "14" },
  ];

  const MetricSection = ({ title, metrics }: MetricSectionProps) => (
    <>
      <Typography variant="h2" component="div" sx={styles.title2}>{title}</Typography>
      <Grid container spacing={10} sx={{ display: "flex", justifyContent: "space-between" }}>
        {metrics.map((metric, index) => (
          <Grid key={index} sx={styles.grid}>
            <Typography sx={styles.gridTitle}>{metric.title}</Typography>
            <Typography sx={styles.gridValue}>{metric.value}</Typography>
          </Grid>
        ))}
      </Grid>
    </>
  );

  const NoProjectsMessage  = () => (
    <Box sx={styles.noProjectBox}>
      <Box sx={{ display: "flex", justifyContent: "center" }}></Box>
      <Typography sx={{textAlign: "center", mt: 13.5, color: "#475467" }}>
        You have no projects, yet. Click on the "New Project" button to start one.
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ mt: 47, ml: 15.5, mr: 62 }}>
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
          <Grid container spacing={10} sx={{ display: "flex", justifyContent: "space-between" }}>
            {projects.map((item: ProjectCardProps) => (
                <Grid key={item.id}>
                  <ProjectCard {...item} />
                </Grid>
            ))}
          </Grid>
          <MetricSection title="All projects compliance status" metrics={complianceMetrics} />
          <MetricSection title="All projects risk status" metrics={riskMetrics} />
        </>
      ) : <NoProjectsMessage /> } 
    </Box>
  )
};

export default Home;
