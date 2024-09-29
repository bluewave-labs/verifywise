import { Box, Typography, Button } from "@mui/material";
import Grid from '@mui/material/Grid2';
import ProjectCard, { ProjectCardProps } from "../../components/ProjectCard";
import { mockProjects } from "./projectData";
import { styles } from "./styles";

interface HomeProps {
    projects?: ProjectCardProps[];
}

const Home = ({projects = mockProjects}: HomeProps) => {
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
      <Grid container spacing={10} sx={{ display: "flex", justifyContent: "space-between" }}>
          {projects && projects.length > 0 ? (
              projects.map((item: ProjectCardProps) => (
                  <Grid key={item.id}>
                      <ProjectCard {...item} />
                  </Grid>
                  ))
              ) : (
                <Box sx={styles.noProjectBox}>
                  <Box sx={{ display: "flex", justifyContent: "center" }}></Box>
                  <Typography sx={{textAlign: "center", mt: 13.5, color: "#475467" }}>
                    You have no projects, yet. Click on the “New Project” button to start one.
                  </Typography>
                </Box>
          )} 
      </Grid>
    </Box>
  )
};

export default Home;
