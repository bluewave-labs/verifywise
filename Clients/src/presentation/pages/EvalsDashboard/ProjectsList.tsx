import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  useTheme,
} from "@mui/material";
import { CirclePlus, Beaker, Calendar, ChevronRight, Pencil } from "lucide-react";
import CustomizableButton from "../../components/Button/CustomizableButton";
import StandardModal from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";
import Alert from "../../components/Alert";
import EmptyState from "../../components/EmptyState";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";
import { experimentsService } from "../../../infrastructure/api/evaluationLogsService";
import type { DeepEvalProject } from "./types";

export default function ProjectsList() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [projects, setProjects] = useState<DeepEvalProject[]>([]);
  const [runsByProject, setRunsByProject] = useState<Record<string, number>>({});
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [alert, setAlert] = useState<{
    variant: "success" | "error";
    body: string;
  } | null>(null);

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
  });

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<DeepEvalProject | null>(null);
  const [editProjectData, setEditProjectData] = useState({
    name: "",
    description: "",
  });

  // Color palette for project icons
  const iconColors = [
    { bg: "rgba(19, 113, 91, 0.1)", color: "#13715B" },     // Green (default)
    { bg: "rgba(59, 130, 246, 0.1)", color: "#3B82F6" },    // Blue
    { bg: "rgba(168, 85, 247, 0.1)", color: "#A855F7" },    // Purple
    { bg: "rgba(249, 115, 22, 0.1)", color: "#F97316" },    // Orange
    { bg: "rgba(236, 72, 153, 0.1)", color: "#EC4899" },    // Pink
    { bg: "rgba(20, 184, 166, 0.1)", color: "#14B8A6" },    // Teal
    { bg: "rgba(245, 158, 11, 0.1)", color: "#F59E0B" },    // Amber
    { bg: "rgba(99, 102, 241, 0.1)", color: "#6366F1" },    // Indigo
  ];

  const getIconColor = (projectId: string) => {
    // Use project ID to deterministically pick a color
    let hash = 0;
    for (let i = 0; i < projectId.length; i++) {
      hash = projectId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % iconColors.length;
    return iconColors[index];
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await deepEvalProjectsService.getAllProjects();
      setProjects(data.projects);

      // Fetch run counts for each project in parallel (using experiments API)
      const statsArray = await Promise.all(
        (data.projects || []).map(async (p) => {
          try {
            const res = await experimentsService.getAllExperiments({ project_id: p.id });
            const total = Array.isArray(res?.experiments) ? res.experiments.length : (res?.length ?? 0);
            return { id: p.id, total };
          } catch {
            // Fallback to project stats if available
            try {
              const res = await deepEvalProjectsService.getProjectStats(p.id);
              return { id: p.id, total: res.stats.totalExperiments ?? 0 };
            } catch {
              return { id: p.id, total: 0 };
            }
          }
        })
      );
      const counts: Record<string, number> = {};
      statsArray.forEach((s) => {
        counts[s.id] = s.total;
      });
      setRunsByProject(counts);
    } catch (err) {
      console.error("Failed to load projects:", err);
      setProjects([]);
      setRunsByProject({});
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

  const handleEditClick = (e: React.MouseEvent, project: DeepEvalProject) => {
    e.stopPropagation();
    setEditingProject(project);
    setEditProjectData({
      name: project.name,
      description: project.description || "",
    });
    setEditModalOpen(true);
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    setLoading(true);
    try {
      await deepEvalProjectsService.updateProject(editingProject.id, editProjectData);
      setAlert({
        variant: "success",
        body: `Project "${editProjectData.name}" updated successfully!`,
      });
      setTimeout(() => setAlert(null), 5000);
      setEditModalOpen(false);
      setEditingProject(null);
      loadProjects();
    } catch (err) {
      setAlert({
        variant: "error",
        body: err instanceof Error ? err.message : "Failed to update project",
      });
      setTimeout(() => setAlert(null), 8000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {alert && <Alert variant={alert.variant} body={alert.body} />}

      {/* Header with Description */}
      <Stack spacing={2} mb={4}>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: "14px" }}>
          Comprehensive LLM evaluation platform powered by LLM-as-a-Judge methodology. Create projects to organize your evaluations, configure models and judge LLMs, select datasets, and run experiments with multiple fairness and performance metrics. Each project can contain multiple evaluation runs with different configurations to help you systematically assess model behavior, detect bias, and ensure quality outputs.
        </Typography>

        {/* Projects Title */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 2, pb: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6" fontSize={15} fontWeight="600" color="#111827">
              Projects
            </Typography>
            {projects.length > 0 && (
              <Chip
                label={projects.length}
                size="small"
                sx={{
                  backgroundColor: "#e0e0e0",
                  color: "#424242",
                  fontWeight: 600,
                  fontSize: "11px",
                  height: "20px",
                  minWidth: "20px",
                  borderRadius: "10px",
                  "& .MuiChip-label": {
                    padding: "0 6px",
                  },
                }}
              />
            )}
          </Box>
          
          {/* Organization Settings and Create Project Button - Right Aligned */}
          <Box display="flex" alignItems="center" gap={1}>
            <CustomizableButton
              onClick={() => navigate("/evals/settings")}
              variant="outlined"
              sx={{
                textTransform: "none",
                borderColor: "#D0D5DD",
                color: "#344054",
                "&:hover": {
                  backgroundColor: "#F9FAFB",
                  borderColor: "#D0D5DD",
                },
              }}
            >
              Organization settings
            </CustomizableButton>
            <CustomizableButton
              onClick={() => setCreateModalOpen(true)}
              variant="contained"
              startIcon={<CirclePlus size={20} />}
              sx={{
                textTransform: "none",
                backgroundColor: "#13715B",
                "&:hover": { backgroundColor: "0f5a47" },
              }}
            >
              Create project
            </CustomizableButton>
          </Box>
        </Stack>
      </Stack>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <EmptyState
          message="No projects yet. Create your first project to start evaluating LLMs."
          showBorder
        />
      ) : (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
          {projects.map((project) => (
            <Box
              key={project.id}
              sx={{
                width: { xs: "100%", md: "calc(50% - 8px)", lg: "calc(33.333% - 11px)" }
              }}
            >
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  border: "1px solid #E5E7EB",
                  borderRadius: theme.shape.borderRadius,
                  boxShadow: "none",
                  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #f9fafb 0%, #f1f5f9 100%)",
                    borderColor: "#D1D5DB",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                  },
                }}
                onMouseEnter={() => setHoveredCard(project.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleOpenProject(project.id)}
              >
                <CardContent
                  sx={{
                    p: 2,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                    backgroundColor: "transparent",
                    "&:last-child": {
                      paddingBottom: 2,
                    },
                  }}
                >
                  {/* Header Section: Icon and Name */}
                  <Box sx={{ p: 2, m: 3, backgroundColor: "transparent" }}>
                    {/* Project Icon */}
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        mb: 3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: getIconColor(project.id).bg,
                        borderRadius: "8px",
                      }}
                    >
                      <Beaker size={24} color={getIconColor(project.id).color} strokeWidth={2} />
                    </Box>

                    {/* Project Name */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: 2 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          fontSize: "15px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "calc(100% - 30px)",
                        }}
                      >
                        {project.name}
                      </Typography>
                      {/* Edit Button */}
                      <Box
                        onClick={(e) => handleEditClick(e, project)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          p: 0.5,
                          borderRadius: "4px",
                          color: "#6b7280",
                          cursor: "pointer",
                          flexShrink: 0,
                          opacity: hoveredCard === project.id ? 1 : 0,
                          transition: "opacity 0.2s ease",
                          "&:hover": {
                            color: theme.palette.primary.main,
                            backgroundColor: "rgba(19, 113, 91, 0.1)",
                          },
                        }}
                      >
                        <Pencil size={14} />
                      </Box>
                    </Box>
                  </Box>

                  {/* Content Section: Description and Date */}
                  <Box sx={{ backgroundColor: "transparent", mx: 3, mb: 4, px: 2, flexGrow: 1 }}>
                    {/* Project Description */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.palette.text.secondary,
                        fontSize: "13px",
                        mb: 2,
                        minHeight: 40,
                        lineHeight: 1.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {project.description || "No description provided"}
                    </Typography>

                    {/* Bottom Row: Date and Runs Count */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                      <Chip
                        size="small"
                        icon={<Calendar size={12} />}
                        label={new Date(project.createdAt).toLocaleDateString()}
                        sx={{
                          backgroundColor: "#f5f5f5",
                          color: "#616161",
                          fontWeight: 500,
                          fontSize: "11px",
                          letterSpacing: "0.5px",
                          borderRadius: "4px",
                          "& .MuiChip-label": {
                            padding: "4px 8px",
                          },
                          "& .MuiChip-icon": {
                            color: "#616161",
                          },
                        }}
                      />
                      <Chip
                        size="small"
                        label={`${runsByProject[project.id] ?? 0} ${
                          (runsByProject[project.id] ?? 0) === 1 ? "run" : "runs"
                        }`}
                        sx={{
                          backgroundColor: "#e0e0e0",
                          color: "#424242",
                          fontWeight: 500,
                          fontSize: "11px",
                          letterSpacing: "0.5px",
                          borderRadius: "4px",
                          "& .MuiChip-label": {
                            padding: "4px 8px",
                          },
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Top Right: Open Button */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 20,
                      right: 20,
                      display: "flex",
                      alignItems: "center",
                      color: theme.palette.primary.main,
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        fontSize: "13px",
                        opacity: hoveredCard === project.id ? 1 : 0,
                        transform: hoveredCard === project.id ? "translateX(0)" : "translateX(10px)",
                        transition: "all 0.3s ease",
                        whiteSpace: "nowrap",
                        mr: hoveredCard === project.id ? 1 : 0,
                      }}
                    >
                      Open
                    </Typography>
                    <ChevronRight
                      size={20}
                      style={{
                        transition: "all 0.3s ease",
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Create Project Modal */}
      <StandardModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create project"
        description="Create a new project to organize your LLM evaluations"
        onSubmit={handleCreateProject}
        submitButtonText="Create project"
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

      {/* Edit Project Modal */}
      <StandardModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingProject(null);
        }}
        title="Edit project"
        description="Update the project name and description"
        onSubmit={handleUpdateProject}
        submitButtonText="Save changes"
        isSubmitting={loading || !editProjectData.name}
      >
        <Stack spacing={3}>
          <Field
            label="Project name"
            value={editProjectData.name}
            onChange={(e) => setEditProjectData({ ...editProjectData, name: e.target.value })}
            placeholder="e.g., Coding Tasks Evaluation"
            isRequired
          />

          <Field
            label="Description"
            value={editProjectData.description}
            onChange={(e) => setEditProjectData({ ...editProjectData, description: e.target.value })}
            placeholder="Brief description of this project..."
          />
        </Stack>
      </StandardModal>
    </Box>
  );
}
