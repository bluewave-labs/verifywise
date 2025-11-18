import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Box, MenuItem, Select, Divider, Stack, Typography, useTheme, IconButton } from "@mui/material";
import { TabContext, TabPanel } from "@mui/lab";
import { ChevronDown, Plus, Bot, FileSearch, Workflow, Home, FlaskConical, Settings } from "lucide-react";
import { getSelectStyles } from "../../utils/inputStyles";
import TabBar from "../../components/TabBar";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import ModalStandard from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";

// Tab components
import ProjectsList from "./ProjectsList";
import ProjectOverview from "./ProjectOverview";
import ProjectExperiments from "./ProjectExperiments";
import ProjectMonitor from "./ProjectMonitor";
import ProjectConfiguration from "./ProjectConfiguration";
import { ProjectDatasets } from "./ProjectDatasets";
import type { DeepEvalProject } from "./types";
import OrganizationSelector from "./OrganizationSelector";
import { deepEvalOrgsService } from "../../../infrastructure/api/deepEvalOrgsService";

export default function EvalsDashboard() {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Determine tab from URL hash or default (only when viewing a project)
  const [tab, setTab] = useState(() => {
    if (!projectId) return "overview"; // Default, but won't be used
    const hash = location.hash.replace("#", "");
    return hash || "overview";
  });

  // Keep tab in sync with URL hash so external navigations (e.g., from Overview button) work
  useEffect(() => {
    if (!projectId) return;
    const hash = location.hash.replace("#", "");
    setTab(hash || "overview");
  }, [location.hash, projectId]);

  const [currentProject, setCurrentProject] = useState<DeepEvalProject | null>(null);
  const [allProjects, setAllProjects] = useState<DeepEvalProject[]>([]);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState<{ name: string; description: string; useCase: "chatbot" | "rag" | "agent" }>({ name: "", description: "", useCase: "chatbot" });
  const [loading, setLoading] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [orgCreateOpen, setOrgCreateOpen] = useState(false);
  const [orgCreating, setOrgCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

  // Load orgs and current org (re-run when URL search changes to support "Manage organizations" from children)
  useEffect(() => {
    const loadOrgs = async () => {
      const [{ orgs }, { org }] = await Promise.all([
        deepEvalOrgsService.getAllOrgs(),
        deepEvalOrgsService.getCurrentOrg(),
      ]);
      setOrgs(orgs);
      setOrgId(org?.id || null);
    };
    loadOrgs();
  }, [location.search]);

  // Load all projects for the dropdown and current project
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await deepEvalProjectsService.getAllProjects();
        // In future, filter by orgId if backend supports it or project.orgId is set.
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

  // Organization selection is handled in ProjectsList; keep org state here only

  const handleCreateProject = async () => {
    setLoading(true);
    try {
      await deepEvalProjectsService.createProject({
        name: newProject.name,
        description: newProject.description,
        useCase: newProject.useCase,
        defaultDataset: newProject.useCase, // align preset with use case by default
        orgId: orgId || undefined,
      });

      // Reload projects
      const data = await deepEvalProjectsService.getAllProjects();
      setAllProjects(data.projects);
      
      // Navigate to the newly created project
      const createdProject = data.projects.find((p) => p.name === newProject.name);
      if (createdProject) {
        if (orgId) {
          try {
            await deepEvalOrgsService.addProjectToOrg(orgId, createdProject.id);
          } catch (e) {
            console.warn("Failed to link project to org:", e);
          }
        }
        navigate(`/evals/${createdProject.id}#overview`);
      }

      setCreateProjectModalOpen(false);
      setNewProject({ name: "", description: "", useCase: "chatbot" });
    } catch (err) {
      console.error("Failed to create project:", err);
      alert("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  // Build breadcrumbs based on current view
  const breadcrumbItems =
    !orgId
      ? [
          { label: "Dashboard", path: "/", icon: <Home size={14} strokeWidth={1.5} />, onClick: () => navigate("/") },
          {
            label: "LLM Evals",
            path: "/evals",
            icon: <FlaskConical size={14} strokeWidth={1.5} />,
            onClick: async () => {
              // When in Organizations view with no org selected, choose first org so ProjectsList can render
              try {
                const { org } = await deepEvalOrgsService.getCurrentOrg();
                if (!org) {
                  const { orgs } = await deepEvalOrgsService.getAllOrgs();
                  if (orgs && orgs.length > 0) {
                    await deepEvalOrgsService.setCurrentOrg(orgs[0].id);
                    setOrgId(orgs[0].id);
                  }
                }
              } catch {
                // ignore
              }
              navigate("/evals");
            },
          },
          { label: "Organizations" },
        ]
      : projectId && currentProject
      ? [
          { label: "Dashboard", path: "/", icon: <Home size={14} strokeWidth={1.5} />, onClick: () => navigate("/") },
          { label: "LLM Evals", path: "/evals", icon: <FlaskConical size={14} strokeWidth={1.5} />, onClick: () => navigate("/evals") },
          { label: currentProject.name },
        ]
      : [
          { label: "Dashboard", path: "/", icon: <Home size={14} strokeWidth={1.5} />, onClick: () => navigate("/") },
          { label: "LLM Evals", path: "/evals", icon: <FlaskConical size={14} strokeWidth={1.5} /> },
        ];

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ userSelect: "none" }}>
          <PageBreadcrumbs items={breadcrumbItems} />
        </Box>

        {/* Top row: Project selector (when in project), Settings on right */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 2,
            mb: 2,
          }}
        >
        {projectId && allProjects.length > 0 ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 2,
              mb: 2,
            }}
          >

            {/* Project selector (only when in a project context) */}
            <Stack gap={theme.spacing(2)} className="select-wrapper" sx={{ mb: 2 }}>
              <Typography
                component="p"
                variant="body1"
                color={theme.palette.text.secondary}
                fontWeight={500}
                fontSize="13px"
                sx={{
                  margin: 0,
                  height: "22px",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                Project
              </Typography>
              <Select
                className="select-component"
                value={projectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                displayEmpty
                IconComponent={() => (
                  <ChevronDown
                    size={16}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      color: theme.palette.text.tertiary,
                    }}
                  />
                )}
                MenuProps={{
                  disableScrollLock: true,
                  PaperProps: {
                    sx: {
                      borderRadius: theme.shape.borderRadius,
                      boxShadow: theme.boxShadow,
                      mt: 1,
                      "& .MuiMenuItem-root": {
                        fontSize: 13,
                        color: theme.palette.text.primary,
                        "&:hover": {
                          backgroundColor: theme.palette.background.accent,
                        },
                        "&.Mui-selected": {
                          backgroundColor: theme.palette.background.accent,
                          "&:hover": {
                            backgroundColor: theme.palette.background.accent,
                          },
                        },
                        "& .MuiTouchRipple-root": {
                          display: "none",
                        },
                      },
                    },
                  },
                }}
                sx={{
                  fontSize: 13,
                  minWidth: "200px",
                  maxWidth: "300px",
                  backgroundColor: theme.palette.background.main,
                  position: "relative",
                  cursor: "pointer",
                  "& .MuiSelect-select": {
                    padding: "0 32px 0 10px !important",
                    height: "34px",
                    display: "flex",
                    alignItems: "center",
                    lineHeight: 2,
                  },
                  ...getSelectStyles(theme),
                }}
              >
                {allProjects.map((proj) => (
                  <MenuItem
                    key={proj.id}
                    value={proj.id}
                    sx={{
                      fontSize: 13,
                      color: theme.palette.text.tertiary,
                      borderRadius: theme.shape.borderRadius,
                      margin: theme.spacing(2),
                    }}
                  >
                    {proj.name}
                  </MenuItem>
                ))}
                <Divider sx={{ my: 0.5 }} />
                <MenuItem
                  value="create_new"
                  sx={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: theme.palette.primary.main,
                    borderRadius: theme.shape.borderRadius,
                    margin: theme.spacing(2),
                  }}
                >
                  <Plus size={14} style={{ marginRight: 8 }} />
                  Create project
                </MenuItem>
              </Select>
            </Stack>
          </Box>
          ) : (
            <PageHeader title="LLM Evals" />
          )}

          {/* Spacer pushes right-side controls */}
          <Box sx={{ flex: 1 }} />
          {/* Organization dropdown only on LLM Evals root (no project selected) */}
          {!projectId && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mr: 1 }}>
              <Box sx={{ fontSize: "11px", color: "#6B7280", mb: 0.5, fontWeight: 600 }}>
                Organization
              </Box>
              <Select
                value={orgId || ""}
                onChange={async (e) => {
                  const val = String(e.target.value);
                  if (val === "manage_orgs") {
                    await deepEvalOrgsService.clearCurrentOrg();
                    setOrgId(null);
                    navigate("/evals"); // shows org selector
                    return;
                  }
                  await deepEvalOrgsService.setCurrentOrg(val);
                  setOrgId(val);
                  navigate("/evals");
                }}
                displayEmpty
                IconComponent={() => <ChevronDown size={14} style={{ marginRight: 8 }} />}
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  minWidth: "220px",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  "& .MuiSelect-select": { py: 0.75, px: 1.5, display: "flex", alignItems: "center", gap: 1 },
                }}
              >
                <MenuItem value="manage_orgs">Manage organizations</MenuItem>
                <Divider sx={{ my: 0.5 }} />
                {orgs.map((o) => (
                  <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                ))}
              </Select>
            </Box>
          )}
          {/* Project settings button (visible when in a project) */}
          {projectId && (
            <IconButton
              aria-label="project-settings"
              onClick={() => navigate(`/evals/${projectId}/configuration`)}
              sx={{
                border: "1px solid #E5E7EB",
                width: 36,
                height: 36,
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
                "&:hover": { backgroundColor: "#F9FAFB", borderColor: "#D1D5DB" },
              }}
              title="Project settings"
            >
              <Settings size={20} />
            </IconButton>
          )}
        </Box>
      </Box>

      <Box sx={{ px: 3, py: 2, userSelect: "none" }}>
        {!orgId ? (
          <OrganizationSelector onSelected={async () => {
            const { org } = await deepEvalOrgsService.getCurrentOrg();
            setOrgId(org?.id || null);
          }} />
        ) : !projectId ? (
          <ProjectsList />
        ) : (
          // Project detail view with tabs
          <TabContext value={tab}>
          <Box sx={{ mb: 3 }}>
            <TabBar
              tabs={[
                { label: "Overview", value: "overview", icon: "LayoutDashboard" },
                { label: "Experiments", value: "experiments", icon: "FlaskConical" },
                { label: "Datasets", value: "datasets", icon: "Database" },
                { label: "Monitor", value: "monitor", icon: "Activity" },
                { label: "Configuration", value: "configuration", icon: "Settings" },
              ]}
              activeTab={tab}
              onChange={handleTabChange}
            />
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

          <TabPanel value="datasets" sx={{ p: 0 }}>
            <ProjectDatasets projectId={projectId} />
          </TabPanel>

          <TabPanel value="monitor" sx={{ p: 0 }}>
            <ProjectMonitor projectId={projectId} />
          </TabPanel>

          <TabPanel value="configuration" sx={{ p: 0 }}>
            <ProjectConfiguration />
          </TabPanel>
        </TabContext>
      )}

      {/* Create Project Modal */}
      <ModalStandard
        isOpen={createProjectModalOpen}
        onClose={() => {
          setCreateProjectModalOpen(false);
          setNewProject({ name: "", description: "", useCase: "chatbot" });
        }}
        title="Create project"
        description="Create a new project to organize your LLM evaluations"
        onSubmit={handleCreateProject}
        submitButtonText="Create project"
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

          {/* LLM Use Case - card selection */}
          <Box>
            <Box sx={{ fontSize: "12px", color: "#374151", mb: 1.5, fontWeight: 600 }}>
              LLM Use Case
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
              <Box
                onClick={() => setNewProject({ ...newProject, useCase: "agent" })}
                sx={{
                  border: newProject.useCase === "agent" ? "2px solid #13715B" : "1px solid #E5E7EB",
                  borderRadius: 2,
                  p: 2,
                  cursor: "pointer",
                  backgroundColor: "#FFFFFF",
                  transition: "all 0.2s ease",
                  "&:hover": { borderColor: "#13715B", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" },
                }}
              >
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                  <Box sx={{ mt: 0.25 }}>
                    <Workflow size={20} color="#13715B" />
                  </Box>
                  <Box>
                    <Box sx={{ fontWeight: 700, fontSize: "13.5px", mb: 0.5 }}>AI Agents</Box>
                    <Box sx={{ fontSize: "12.5px", color: "#6B7280", lineHeight: 1.6 }}>
                      Evaluate agentic workflows and end-to-end task completion, including tool usage and planning.
                    </Box>
                  </Box>
                </Box>
              </Box>
              <Box
                onClick={() => setNewProject({ ...newProject, useCase: "rag" })}
                sx={{
                  border: newProject.useCase === "rag" ? "2px solid #13715B" : "1px solid #E5E7EB",
                  borderRadius: 2,
                  p: 2,
                  cursor: "pointer",
                  backgroundColor: "#FFFFFF",
                  transition: "all 0.2s ease",
                  "&:hover": { borderColor: "#13715B", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" },
                }}
              >
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                  <Box sx={{ mt: 0.25 }}>
                    <FileSearch size={20} color="#13715B" />
                  </Box>
                  <Box>
                    <Box sx={{ fontWeight: 700, fontSize: "13.5px", mb: 0.5 }}>RAG</Box>
                    <Box sx={{ fontSize: "12.5px", color: "#6B7280", lineHeight: 1.6 }}>
                      Evaluate retrieval-augmented generation: recall, precision, relevancy and faithfulness.
                    </Box>
                  </Box>
                </Box>
              </Box>
              <Box
                onClick={() => setNewProject({ ...newProject, useCase: "chatbot" })}
                sx={{
                  border: newProject.useCase === "chatbot" ? "2px solid #13715B" : "1px solid #E5E7EB",
                  borderRadius: 2,
                  p: 2,
                  cursor: "pointer",
                  backgroundColor: "#FFFFFF",
                  transition: "all 0.2s ease",
                  "&:hover": { borderColor: "#13715B", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" },
                }}
              >
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                  <Box sx={{ mt: 0.25 }}>
                    <Bot size={20} color="#13715B" />
                  </Box>
                  <Box>
                    <Box sx={{ fontWeight: 700, fontSize: "13.5px", mb: 0.5 }}>Chatbots</Box>
                    <Box sx={{ fontSize: "12.5px", color: "#6B7280", lineHeight: 1.6 }}>
                      Evaluate conversational experiences for coherence, correctness and safety.
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Stack>
      </ModalStandard>
      
      {/* Create Organization Modal (inline) */}
      <ModalStandard
        isOpen={orgCreateOpen}
        onClose={() => {
          setOrgCreateOpen(false);
          setNewOrgName("");
        }}
        title="Create organization"
        description="Name your organization to begin organizing projects and experiments."
        onSubmit={async () => {
          if (!newOrgName.trim()) return;
          setOrgCreating(true);
          const { org } = await deepEvalOrgsService.createOrg(newOrgName.trim());
          setOrgCreating(false);
          setOrgCreateOpen(false);
          setNewOrgName("");
          setOrgId(org.id);
          navigate("/evals");
        }}
        submitButtonText="Create organization"
        isSubmitting={orgCreating || !newOrgName.trim()}
      >
        <Stack spacing={3}>
          <Field
            label="Organization name"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            placeholder="e.g., VerifyEvals"
            isRequired
          />
        </Stack>
      </ModalStandard>
    </Box>
    </Box>
  );
}

