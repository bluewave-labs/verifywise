import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Chip,
  Stack,
} from "@mui/material";
import { CirclePlus, Beaker, Calendar, Settings } from "lucide-react";
import CustomizableButton from "../../components/Button/CustomizableButton";
import StandardModal from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";
import Alert from "../../components/Alert";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";
import type { DeepEvalProject } from "./types";

export default function ProjectsList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<DeepEvalProject[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "error";
    body: string;
  } | null>(null);

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await deepEvalProjectsService.getAllProjects();
      setProjects(data.projects);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setProjects([]);
    }
  };

  const handleCreateProject = async () => {
    setLoading(true);
    try {
      // Create project with only name and description
      // Model configs, datasets, and metrics will be configured per eval run
      const projectConfig = {
        name: newProject.name,
        description: newProject.description,
      };

      await deepEvalProjectsService.createProject(projectConfig);

      setAlert({
        variant: "success",
        body: `Project "${newProject.name}" created successfully!`,
      });
      setTimeout(() => setAlert(null), 5000);

      setCreateModalOpen(false);
      setNewProject({
        name: "",
        description: "",
      });

      loadProjects();
    } catch (err) {
      setAlert({
        variant: "error",
        body: err instanceof Error ? err.message : "Failed to create project",
      });
      setTimeout(() => setAlert(null), 8000);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProject = (projectId: string) => {
    navigate(`/evals/${projectId}#overview`);
  };

  return (
    <Box>
      {alert && <Alert variant={alert.variant} body={alert.body} />}

      {/* Header with Create button */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            DeepEval Projects
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Organize your LLM evaluations into projects
          </Typography>
        </Box>
        <CustomizableButton
          onClick={() => setCreateModalOpen(true)}
          variant="contained"
          startIcon={<CirclePlus size={20} />}
          sx={{
            textTransform: "none",
            backgroundColor: "#13715B",
            "&:hover": { backgroundColor: "#0f5a47" },
          }}
        >
          Create Project
        </CustomizableButton>
      </Box>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            px: 2,
            border: "2px dashed",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Beaker size={48} color="#999" style={{ marginBottom: 16 }} />
          <Typography variant="h6" gutterBottom>
            No projects yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first DeepEval project to start evaluating LLMs
          </Typography>
          <Button
            variant="contained"
            startIcon={<CirclePlus size={20} />}
            onClick={() => setCreateModalOpen(true)}
            sx={{
              textTransform: "none",
              backgroundColor: "#13715B",
              "&:hover": { backgroundColor: "#0f5a47" },
            }}
          >
            Create Your First Project
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  "&:hover": {
                    boxShadow: 4,
                    cursor: "pointer",
                  },
                }}
                onClick={() => handleOpenProject(project.id)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6" component="div">
                      {project.name}
                    </Typography>
                    <Beaker size={20} color="#13715B" />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 60 }}>
                    {project.description || "No description provided"}
                  </Typography>

                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Calendar size={14} color="#666" />
                      <Typography variant="caption" color="text.secondary">
                        Created {new Date(project.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Chip
                      label="0 runs"
                      size="small"
                      sx={{ fontSize: "0.7rem" }}
                    />
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: "flex-end", p: 2, pt: 0 }}>
                  <Button
                    size="small"
                    sx={{ textTransform: "none" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/evals/${project.id}#configuration`);
                    }}
                    startIcon={<Settings size={16} />}
                  >
                    Configure
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    sx={{
                      textTransform: "none",
                      backgroundColor: "#13715B",
                      "&:hover": { backgroundColor: "#0f5a47" },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenProject(project.id);
                    }}
                  >
                    Open
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Project Modal */}
      <StandardModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create DeepEval Project"
        description="Create a new project to organize your LLM evaluations"
        onSubmit={handleCreateProject}
        submitButtonText="Create Project"
        isSubmitting={loading || !newProject.name}
      >
        <Stack spacing={3}>
          <Typography variant="body2" color="text.secondary">
            Projects help you organize your LLM evaluations. You'll configure the model, 
            dataset, and metrics when creating individual evaluation runs within the project.
          </Typography>

          <Field
            label="Project Name"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            placeholder="e.g., Coding Tasks Evaluation"
            isRequired
          />

          <Field
            label="Description"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            placeholder="Brief description of this project..."
          />
        </Stack>
      </StandardModal>
    </Box>
  );
}

