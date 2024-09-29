import { Box, Typography, Button } from "@mui/material";
import Grid from '@mui/material/Grid2';
import ProjectCard, { ProjectCardProps } from "../../components/ProjectCard";
import { mockProjects } from "./projectData";
import { styles } from "./styles";

interface HomeProps {
    projects?: ProjectCardProps[]
}

const Home = ({projects = mockProjects}: HomeProps) => {
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
        <Typography variant="h1" component="div" sx={styles.tytle}>
          Projects overview
        </Typography>
        <Button variant="contained" sx={{ textTransform: "none", borderRadius: 2, maxHeight: 34 }} onClick={() => {}}>
          New project
        </Button>
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

          <Typography variant="h2" component="div" sx={styles.tytle2}>All projects compliance status</Typography>
          <Grid container spacing={10} sx={{ display: "flex", justifyContent: "space-between" }}>
            <Grid sx={styles.grid}>
              <Typography sx={styles.gridTytle}>Completed requirements</Typography>
              <Typography sx={styles.gridValue}>85%</Typography>
            </Grid>
            <Grid sx={styles.grid}>
              <Typography sx={styles.gridTytle}>Completed assessments</Typography>
              <Typography sx={styles.gridValue}>24</Typography>
            </Grid>
            <Grid sx={styles.grid}>
              <Typography sx={styles.gridTytle}>Assessment completion rate</Typography>
              <Typography sx={styles.gridValue}>10%</Typography>
            </Grid>
          </Grid>

          <Typography variant="h2" component="div" sx={styles.tytle2}>All projects risk status</Typography>
          <Grid container spacing={10} sx={{ display: "flex", justifyContent: "space-between" }}>
            <Grid sx={styles.grid}>
              <Typography sx={styles.gridTytle}>Acceptable risks</Typography>
              <Typography sx={styles.gridValue}>31</Typography>
            </Grid>
            <Grid sx={styles.grid}>
              <Typography sx={styles.gridTytle}>Residual risks</Typography>
              <Typography sx={styles.gridValue}>1</Typography>
            </Grid>
            <Grid sx={styles.grid}>
              <Typography sx={styles.gridTytle}>Unacceptable risks</Typography>
              <Typography sx={styles.gridValue}>14</Typography>
            </Grid>
          </Grid>
        </>
      ) : <NoProjectsMessage /> } 
    </Box>
  )
};

export default Home;
