import { Box, Typography, Button } from "@mui/material";
import Grid from '@mui/material/Grid2';
import ProjectCard, { ProjectCardProps } from "../../components/ProjectCard";

interface HomeProps {
    projects?: ProjectCardProps[];
}

const Home = ({projects = []}: HomeProps) => {
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
      
          {projects && projects.length > 0 ? (
              projects.map((item: ProjectCardProps) => (
                <Grid container spacing={10} sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Grid key={item.id}>
                        <ProjectCard {...item} />
                    </Grid>
                </Grid>
                  ))
              ) : (
                <Box sx={{ display: "block", height: "100%", width: "100%", border: "1px solid #EAECF0", borderRadius: 2, pt: 34, pb: 39.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "center" }}></Box>
                  <Typography sx={{textAlign: "center", mt: 13.5, color: "#475467" }}>You have no projects, yet. Click on the “New Project” button to start one.</Typography>
                </Box>
                
              )}
      
  </Box>
  )
};

export default Home;
