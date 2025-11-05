import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Box, MenuItem, Select, Divider, Stack } from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import Tab from "@mui/material/Tab";
import { LayoutDashboard, FlaskConical, Activity, ChevronDown, Plus } from "lucide-react";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import StandardModal from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";

// Tab components
import ProjectsList from "./ProjectsList";
import ProjectOverview from "./ProjectOverview";
import ProjectExperiments from "./ProjectExperiments";
import ProjectMonitor from "./ProjectMonitor";
import type { DeepEvalProject } from "./types";

export default function EvalsDashboard() {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine tab from URL hash or default (only when viewing a project)
  const [tab, setTab] = useState(() => {
    if (!projectId) return "overview"; // Default, but won't be used
    const hash = location.hash.replace("#", "");
    return hash || "overview";
  });

  const [currentProject, setCurrentProject] = useState<DeepEvalProject | null>(null);
  const [allProjects, setAllProjects] = useState<DeepEvalProject[]>([]);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(false);

  // Load all projects for the dropdown and current project
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await deepEvalProjectsService.getAllProjects();
        setAllProjects(data.projects);
        
        // Find and set the current project
        if (projectId) {
          const project = data.projects.find((p) => p.id === projectId);
          if (project) {
            setCurrentProject(project);
          }
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
      }
    };
    if (projectId) {
      loadProjects();
    }
  }, [projectId]);

  const handleTabChange = (_: unknown, newValue: string) => {
    setTab(newValue);
    // Update URL hash
    navigate(`${location.pathname}#${newValue}`, { replace: true });
  };

  const handleProjectChange = (newProjectId: string) => {
    if (newProjectId === "create_new") {
      setCreateProjectModalOpen(true);
    } else {
      navigate(`/evals/${newProjectId}#${tab}`);
    }
  };

  const handleCreateProject = async () => {
    setLoading(true);
    try {
      await deepEvalProjectsService.createProject({
        name: newProject.name,
        description: newProject.description,
      });

      // Reload projects
      const data = await deepEvalProjectsService.getAllProjects();
      setAllProjects(data.projects);
      
      // Navigate to the newly created project
      const createdProject = data.projects.find((p) => p.name === newProject.name);
      if (createdProject) {
        navigate(`/evals/${createdProject.id}#overview`);
      }

      setCreateProjectModalOpen(false);
      setNewProject({ name: "", description: "" });
    } catch (err) {
      console.error("Failed to create project:", err);
      alert("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  // Build breadcrumbs based on current view
  const breadcrumbItems = projectId && currentProject
    ? [
        { label: "LLM Evals Dashboard", onClick: () => navigate("/evals") },
        { label: currentProject.name }
      ]
    : [{ label: "LLM Evals Dashboard" }];

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <PageBreadcrumbs items={breadcrumbItems} />
        
        {/* Project selector dropdown or Projects list title */}
        {projectId && allProjects.length > 0 ? (
          <Box sx={{ mb: 2 }}>
            <Select
              value={projectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              IconComponent={() => <ChevronDown size={14} style={{ marginRight: 8 }} />}
              sx={{
                fontSize: "16px",
                fontWeight: 600,
                maxWidth: "300px",
                border: "1px solid #E5E7EB",
                borderRadius: "6px",
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                "&:hover": { 
                  borderColor: "#13715B",
                },
                "&.Mui-focused": { 
                  borderColor: "#13715B",
                },
                "& .MuiSelect-select": {
                  py: 0.75,
                  px: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                },
              }}
            >
              {allProjects.map((proj) => (
                <MenuItem key={proj.id} value={proj.id}>
                  {proj.name}
                </MenuItem>
              ))}
              <Divider sx={{ my: 0.5 }} />
              <MenuItem 
                value="create_new"
              >
                <Plus size={16} style={{ marginRight: 8 }} />
                Create Project
              </MenuItem>
            </Select>
          </Box>
        ) : (
          <PageHeader title="LLM Evaluations" />
        )}
      </Box>

      <Box sx={{ px: 3, py: 2 }}>
        {!projectId ? (
          // Projects list view (no tabs)
          <ProjectsList />
        ) : (
          // Project detail view with tabs
          <TabContext value={tab}>
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
              <TabList
                onChange={handleTabChange}
                TabIndicatorProps={{
                  style: { backgroundColor: "#13715B", height: "2px" },
                }}
                sx={{
                  minHeight: 40,
                  "& .MuiTab-root": {
                    minHeight: 40,
                    py: 1,
                    px: 4,
                    mr: 4,
                  },
                }}
              >
                <Tab
                  icon={<LayoutDashboard size={16} />}
                  iconPosition="start"
                  label="Overview"
                  value="overview"
                  disableRipple
                  sx={{ textTransform: "none !important", fontSize: "14px", gap: 1.5 }}
                />
                <Tab
                  icon={<FlaskConical size={16} />}
                  iconPosition="start"
                  label="Evals"
                  value="experiments"
                  disableRipple
                  sx={{ textTransform: "none !important", fontSize: "14px", gap: 1.5 }}
                />
                <Tab
                  icon={<Activity size={16} />}
                  iconPosition="start"
                  label="Monitor"
                  value="monitor"
                  disableRipple
                  sx={{ textTransform: "none !important", fontSize: "14px", gap: 1.5 }}
                />
              </TabList>
            </Box>

            <TabPanel value="overview" sx={{ p: 0 }}>
              <ProjectOverview
                projectId={projectId}
                project={currentProject}
                onProjectUpdate={setCurrentProject}
              />
            </TabPanel>

            <TabPanel value="experiments" sx={{ p: 0 }}>
              <ProjectExperiments projectId={projectId} />
            </TabPanel>

            <TabPanel value="monitor" sx={{ p: 0 }}>
              <ProjectMonitor projectId={projectId} />
            </TabPanel>
          </TabContext>
        )}
      </Box>

      {/* Create Project Modal */}
      <StandardModal
        isOpen={createProjectModalOpen}
        onClose={() => {
          setCreateProjectModalOpen(false);
          setNewProject({ name: "", description: "" });
        }}
        title="Create Project"
        description="Create a new project to organize your LLM evaluations"
        onSubmit={handleCreateProject}
        submitButtonText="Create Project"
        isSubmitting={loading || !newProject.name}
      >
        <Stack spacing={3}>
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

