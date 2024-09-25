import { Box, Typography, Button } from "@mui/material";
import Grid from '@mui/material/Grid2';
import ProjectCard, { ProjectCardProps } from "../../components/ProjectCard";


const Home = ({projects}: any) => {
  return (
    <Box sx={{ pt: 44, paddingX: 27.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 11 }}>
          <Typography variant="h1" component="div" sx={{ color: '#1A1919', fontSize: 16, fontWeight: "bold" }}>
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
                <Typography>No projects available.</Typography>
              )}
      </Grid>
  </Box>
  )
};

export default Home;
