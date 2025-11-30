import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Box, Stack, Typography } from "@mui/material";
import { Workflow, Home, FlaskConical, FileSearch, Bot, LayoutDashboard, Database, Award, Settings, Building2 } from "lucide-react";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import EvalsSidebar from "./EvalsSidebar";
import PageHeader from "../../components/Layout/PageHeader";
import ModalStandard from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";
import Select from "../../components/Inputs/Select";
import VWLink from "../../components/Link/VWLink";
import Alert from "../../components/Alert";
import CustomAxios from "../../../infrastructure/api/customAxios";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";
import { experimentsService } from "../../../infrastructure/api/evaluationLogsService";
import { deepEvalDatasetsService } from "../../../infrastructure/api/deepEvalDatasetsService";

// Tab components
import ProjectsList from "./ProjectsList";
import ProjectOverview from "./ProjectOverview";
import ProjectExperiments from "./ProjectExperiments";
import { ProjectDatasets } from "./ProjectDatasets";
import ProjectScorers from "./ProjectScorers";
import type { DeepEvalProject } from "./types";
import OrganizationSelector from "./OrganizationSelector";
import { deepEvalOrgsService } from "../../../infrastructure/api/deepEvalOrgsService";

const LLM_PROVIDERS = [
  { _id: "openai", name: "OpenAI" },
  { _id: "anthropic", name: "Anthropic" },
  { _id: "google", name: "Google (Gemini)" },
  { _id: "xai", name: "xAI" },
  { _id: "mistral", name: "Mistral" },
  { _id: "huggingface", name: "Hugging Face" },
];

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
  const [orgCreateOpen, setOrgCreateOpen] = useState(false);
  const [orgCreating, setOrgCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [experimentsCount, setExperimentsCount] = useState<number>(0);
  const [datasetsCount, setDatasetsCount] = useState<number>(0);
  const [initialLoading, setInitialLoading] = useState(true);

  // API key modal state
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [apiKeyAlert, setApiKeyAlert] = useState<{ variant: "success" | "error"; body: string } | null>(null);

  // Onboarding state: "org" | "project" | null (null = completed)
  const [onboardingStep, setOnboardingStep] = useState<"org" | "project" | null>(null);
  const [onboardingOrgName, setOnboardingOrgName] = useState("");
  const [onboardingProjectName, setOnboardingProjectName] = useState("");
  const [onboardingProjectDesc, setOnboardingProjectDesc] = useState("");
  const [onboardingProjectUseCase, setOnboardingProjectUseCase] = useState<"chatbot" | "rag" | "agent">("chatbot");
  const [onboardingSubmitting, setOnboardingSubmitting] = useState(false);

  // Load current org on mount and check if onboarding is needed
  useEffect(() => {
    const loadAndCheckOnboarding = async () => {
      try {
        // Check if there are any organizations
        const { orgs } = await deepEvalOrgsService.getAllOrgs();

        if (!orgs || orgs.length === 0) {
          // No organizations - start onboarding
          setOnboardingStep("org");
          setOrgId(null);
        } else {
          // Has organizations - check for current org
          const { org } = await deepEvalOrgsService.getCurrentOrg();
          if (org) {
            setOrgId(org.id);
            // Check if this org has any projects
            const projectIds = await deepEvalOrgsService.getProjectsForOrg(org.id);
            if (!projectIds || projectIds.length === 0) {
              // Org exists but no projects - go to project step
              setOnboardingStep("project");
            }
          } else {
            // Has orgs but none selected - select first one
            await deepEvalOrgsService.setCurrentOrg(orgs[0].id);
            setOrgId(orgs[0].id);
            // Check if this org has any projects
            const projectIds = await deepEvalOrgsService.getProjectsForOrg(orgs[0].id);
            if (!projectIds || projectIds.length === 0) {
              setOnboardingStep("project");
            }
          }
        }
      } catch (err) {
        console.error("Failed to check onboarding:", err);
        // On error, show org creation
        setOnboardingStep("org");
      } finally {
        setInitialLoading(false);
      }
    };

    // Only run onboarding check when not viewing a specific project
    if (!projectId) {
      loadAndCheckOnboarding();
    } else {
      setInitialLoading(false);
    }
  }, [projectId]);

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

  // Load experiments and datasets counts for the current project
  useEffect(() => {
    const loadCounts = async () => {
      if (!projectId || !currentProject) return;

      try {
        // Load experiments count
        const experimentsData = await experimentsService.getAllExperiments({
          project_id: projectId
        });
        setExperimentsCount(experimentsData.experiments?.length || 0);

        // Load datasets count - count all datasets across all categories
        const datasetsData = await deepEvalDatasetsService.list();
        const totalCount = Object.values(datasetsData).reduce((sum, datasets) => {
          return sum + (Array.isArray(datasets) ? datasets.length : 0);
        }, 0);
        setDatasetsCount(totalCount);
      } catch (err) {
        console.error("Failed to load counts:", err);
        setDatasetsCount(0);
      }
    };

    loadCounts();
  }, [projectId, currentProject]);

  const handleTabChange = (newValue: string) => {
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

  // Onboarding: Create organization
  const handleOnboardingCreateOrg = async () => {
    if (!onboardingOrgName.trim()) return;
    setOnboardingSubmitting(true);
    try {
      const { org } = await deepEvalOrgsService.createOrg(onboardingOrgName.trim());
      await deepEvalOrgsService.setCurrentOrg(org.id);
      setOrgId(org.id);
      setOnboardingStep("project");
      setOnboardingOrgName("");
    } catch (err) {
      console.error("Failed to create organization:", err);
    } finally {
      setOnboardingSubmitting(false);
    }
  };

  // Onboarding: Create project
  const handleOnboardingCreateProject = async () => {
    if (!onboardingProjectName.trim() || !orgId) return;
    setOnboardingSubmitting(true);
    try {
      await deepEvalProjectsService.createProject({
        name: onboardingProjectName.trim(),
        description: onboardingProjectDesc,
        useCase: onboardingProjectUseCase,
        defaultDataset: onboardingProjectUseCase,
        orgId: orgId,
      });

      // Reload projects
      const data = await deepEvalProjectsService.getAllProjects();
      setAllProjects(data.projects);

      // Link project to org and navigate
      const createdProject = data.projects.find((p) => p.name === onboardingProjectName.trim());
      if (createdProject) {
        try {
          await deepEvalOrgsService.addProjectToOrg(orgId, createdProject.id);
        } catch (e) {
          console.warn("Failed to link project to org:", e);
        }
        // Onboarding complete - close modal and navigate
        setOnboardingStep(null);
        setOnboardingProjectName("");
        setOnboardingProjectDesc("");
        setOnboardingProjectUseCase("chatbot");
        navigate(`/evals/${createdProject.id}#overview`);
      } else {
        // If project not found, just close onboarding
        setOnboardingStep(null);
      }
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setOnboardingSubmitting(false);
    }
  };

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

  // Tab label and icon mapping for breadcrumbs
  const getTabInfo = (tabValue: string): { label: string; icon: React.ReactNode } => {
    const tabMap: Record<string, { label: string; icon: React.ReactNode }> = {
      overview: { label: "Overview", icon: <LayoutDashboard size={14} strokeWidth={1.5} /> },
      experiments: { label: "Experiments", icon: <FlaskConical size={14} strokeWidth={1.5} /> },
      datasets: { label: "Datasets", icon: <Database size={14} strokeWidth={1.5} /> },
      scorers: { label: "Scorers", icon: <Award size={14} strokeWidth={1.5} /> },
      configuration: { label: "Configuration", icon: <Settings size={14} strokeWidth={1.5} /> },
      organizations: { label: "Organizations", icon: <Building2 size={14} strokeWidth={1.5} /> },
    };
    return tabMap[tabValue] || { label: tabValue, icon: <Workflow size={14} strokeWidth={1.5} /> };
  };

  // Handle API key modal submission
  const handleAddApiKey = async () => {
    if (!selectedProvider || !newApiKey.trim()) {
      setApiKeyAlert({
        variant: "error",
        body: "Please select a provider and enter an API key",
      });
      setTimeout(() => setApiKeyAlert(null), 5000);
      return;
    }

    setApiKeySaving(true);
    try {
      const response = await CustomAxios.post('/evaluation-llm-keys', {
        provider: selectedProvider,
        apiKey: newApiKey,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to add API key');
      }

      setApiKeyAlert({
        variant: "success",
        body: "API key added successfully",
      });
      setTimeout(() => {
        setApiKeyAlert(null);
        setApiKeyModalOpen(false);
        setSelectedProvider("");
        setNewApiKey("");
      }, 1500);
    } catch (err) {
      setApiKeyAlert({
        variant: "error",
        body: err instanceof Error ? err.message : "Failed to add API key",
      });
      setTimeout(() => setApiKeyAlert(null), 5000);
    } finally {
      setApiKeySaving(false);
    }
  };

  // Build breadcrumbs based on current view
  const tabInfo = getTabInfo(tab);
  const breadcrumbItems =
    !orgId
      ? [
          { label: "Dashboard", path: "/", icon: <Home size={14} strokeWidth={1.5} />, onClick: () => navigate("/") },
          {
            label: "LLM evals",
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
          { label: tabInfo.label, icon: tabInfo.icon },
        ]
      : projectId && currentProject
      ? [
          { label: "Dashboard", path: "/", icon: <Home size={14} strokeWidth={1.5} />, onClick: () => navigate("/") },
          { label: "LLM evals", path: "/evals", icon: <FlaskConical size={14} strokeWidth={1.5} />, onClick: () => navigate("/evals") },
          { label: tabInfo.label, icon: tabInfo.icon },
        ]
      : [
          { label: "Dashboard", path: "/", icon: <Home size={14} strokeWidth={1.5} />, onClick: () => navigate("/") },
          { label: "LLM evals", path: "/evals", icon: <FlaskConical size={14} strokeWidth={1.5} />, onClick: () => navigate("/evals") },
          { label: tabInfo.label, icon: tabInfo.icon },
        ];

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Box>
          <PageBreadcrumbs items={breadcrumbItems} />
        </Box>

        {/* Page header (only for projects list view) */}
        {!projectId && orgId && (
          <Box sx={{ mt: 4 }}>
            <PageHeader title="LLM evals" />
          </Box>
        )}

      </Box>

      <Box sx={{ px: 3, py: 2, display: "flex", gap: 3 }}>
        {/* Sidebar - always visible, disabled items when no project selected */}
        <EvalsSidebar
          activeTab={tab}
          onTabChange={handleTabChange}
          experimentsCount={experimentsCount}
          datasetsCount={datasetsCount}
          disabled={!projectId}
          allProjects={allProjects}
          selectedProjectId={projectId}
          onProjectChange={handleProjectChange}
        />

        {/* Main content */}
        <Box sx={{ flex: 1 }}>
          {/* Show nothing while initially loading to prevent flash */}
          {initialLoading && !projectId ? null : (
          /* Organizations tab - always accessible, shows org management */
          tab === "organizations" ? (
            <OrganizationSelector onSelected={async () => {
              const { org } = await deepEvalOrgsService.getCurrentOrg();
              setOrgId(org?.id || null);
              // Navigate back to projects list after selecting an org
              if (!projectId) {
                setTab("overview");
                navigate("/evals#overview", { replace: true });
              }
            }} />
          ) : !projectId ? (
            /* No project selected - show projects list (or org selector if no org) */
            !orgId ? (
              <OrganizationSelector onSelected={async () => {
                const { org } = await deepEvalOrgsService.getCurrentOrg();
                setOrgId(org?.id || null);
              }} />
            ) : (
              <ProjectsList />
            )
          ) : (
            /* Project selected - show tab content */
            <>
              {tab === "overview" && (
                <ProjectOverview
                  projectId={projectId}
                  project={currentProject}
                  onProjectUpdate={setCurrentProject}
                />
              )}

              {tab === "experiments" && (
                <ProjectExperiments projectId={projectId} />
              )}

              {tab === "datasets" && (
                <ProjectDatasets projectId={projectId} />
              )}

              {tab === "scorers" && projectId && (
                <ProjectScorers projectId={projectId} />
              )}

              {tab === "configuration" && (
                <Box sx={{ p: 4 }}>
                  <Typography variant="h6" sx={{ mb: 1, fontSize: "18px", fontWeight: 600 }}>
                    Project configuration
                  </Typography>

                  {/* LLM Use Case */}
                  <Box sx={{ mt: 4, mb: 4 }}>
                    <Typography sx={{ fontSize: "14px", fontWeight: 600, mb: 2 }}>
                      LLM use case
                    </Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                      <Box
                        sx={{
                          border: currentProject?.useCase === "rag" ? "2px solid #13715B" : "1px solid #E5E7EB",
                          borderRadius: 2,
                          p: 2,
                          backgroundColor: "#FFFFFF",
                        }}
                      >
                        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                          <Box sx={{ mt: 0.25 }}>
                            <FileSearch size={20} color="#13715B" />
                          </Box>
                          <Box>
                            <Box sx={{ fontWeight: 700, fontSize: "13.5px", mb: 0.5 }}>RAG</Box>
                            <Box sx={{ fontSize: "12.5px", color: "#6B7280", lineHeight: 1.6 }}>
                              Evaluate retrieval-augmented generation, including recall, precision, relevancy and faithfulness.
                            </Box>
                          </Box>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          border: currentProject?.useCase === "chatbot" ? "2px solid #13715B" : "1px solid #E5E7EB",
                          borderRadius: 2,
                          p: 2,
                          backgroundColor: "#FFFFFF",
                        }}
                      >
                        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                          <Box sx={{ mt: 0.25 }}>
                            <Bot size={20} color="#13715B" />
                          </Box>
                          <Box>
                            <Box sx={{ fontWeight: 700, fontSize: "13.5px", mb: 0.5 }}>Chatbots</Box>
                            <Box sx={{ fontSize: "12.5px", color: "#6B7280", lineHeight: 1.6 }}>
                              Evaluate single and multi-turn conversational experiences for coherence, correctness and safety.
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* LLM API Keys */}
                  <Box sx={{ mt: 4 }}>
                    <Typography sx={{ fontSize: "14px", fontWeight: 600, mb: 1 }}>
                      LLM API keys
                    </Typography>
                    <Typography sx={{ fontSize: "13px", color: "#6B7280", mb: 2 }}>
                      These keys are encrypted and stored securely in the database. They will be used for running evaluations.{" "}
                      <VWLink onClick={() => setApiKeyModalOpen(true)} showIcon={false}>
                        Add API key
                      </VWLink>
                    </Typography>
                    <Typography sx={{ fontSize: "13px", color: "#9CA3AF", fontStyle: "italic" }}>
                      No API keys configured yet.
                    </Typography>
                  </Box>

                  {/* Save Changes Button */}
                  <Box sx={{ mt: 4 }}>
                    <button
                      disabled
                      style={{
                        backgroundColor: "#E5E7EB",
                        color: "#9CA3AF",
                        border: "none",
                        borderRadius: "6px",
                        padding: "8px 16px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "not-allowed",
                      }}
                    >
                      Save changes
                    </button>
                  </Box>
                </Box>
              )}
            </>
          ))}
        </Box>
      </Box>

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
            label="Project name"
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
              LLM use case
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <Box
                onClick={() => setNewProject({ ...newProject, useCase: "rag" })}
                sx={{
                  border: "1px solid",
                  borderColor: newProject.useCase === "rag" ? "#13715B" : "#E5E7EB",
                  borderRadius: 2,
                  p: 2,
                  cursor: "pointer",
                  backgroundColor: newProject.useCase === "rag" ? "#F7F9F8" : "#FFFFFF",
                  boxShadow: newProject.useCase === "rag" ? "0 0 0 1px #13715B" : "none",
                  transition: "background-color 0.2s ease, border-color 0.2s ease",
                  "&:hover": {
                    borderColor: "#13715B",
                    backgroundColor: "#F7F9F8",
                  },
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
                  border: "1px solid",
                  borderColor: newProject.useCase === "chatbot" ? "#13715B" : "#E5E7EB",
                  borderRadius: 2,
                  p: 2,
                  cursor: "pointer",
                  backgroundColor: newProject.useCase === "chatbot" ? "#F7F9F8" : "#FFFFFF",
                  boxShadow: newProject.useCase === "chatbot" ? "0 0 0 1px #13715B" : "none",
                  transition: "background-color 0.2s ease, border-color 0.2s ease",
                  "&:hover": {
                    borderColor: "#13715B",
                    backgroundColor: "#F7F9F8",
                  },
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

      {/* Onboarding Modal - Step 1: Create Organization */}
      <ModalStandard
        isOpen={onboardingStep === "org"}
        onClose={() => {}} // Cannot be dismissed
        title="Welcome to LLM evals"
        description="Let's get started by creating your first organization. Organizations help you group projects and manage access."
        onSubmit={handleOnboardingCreateOrg}
        submitButtonText="Create organization"
        isSubmitting={onboardingSubmitting || !onboardingOrgName.trim()}
      >
        <Stack spacing={3}>
          <Field
            label="Organization name"
            value={onboardingOrgName}
            onChange={(e) => setOnboardingOrgName(e.target.value)}
            placeholder="e.g., My Company"
            isRequired
          />
        </Stack>
      </ModalStandard>

      {/* Onboarding Modal - Step 2: Create Project */}
      <ModalStandard
        isOpen={onboardingStep === "project"}
        onClose={() => {}} // Cannot be dismissed
        title="Create your first project"
        description="Projects help you organize your LLM evaluations. Each project can have its own datasets, experiments, and configurations."
        onSubmit={handleOnboardingCreateProject}
        submitButtonText="Create project"
        isSubmitting={onboardingSubmitting || !onboardingProjectName.trim()}
      >
        <Stack spacing={3}>
          <Field
            label="Project name"
            value={onboardingProjectName}
            onChange={(e) => setOnboardingProjectName(e.target.value)}
            placeholder="e.g., Coding Tasks Evaluation"
            isRequired
          />

          <Field
            label="Description"
            value={onboardingProjectDesc}
            onChange={(e) => setOnboardingProjectDesc(e.target.value)}
            placeholder="Brief description of this project..."
          />

          {/* LLM Use Case - card selection */}
          <Box>
            <Box sx={{ fontSize: "12px", color: "#374151", mb: 1.5, fontWeight: 600 }}>
              LLM use case
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <Box
                onClick={() => setOnboardingProjectUseCase("rag")}
                sx={{
                  border: "1px solid",
                  borderColor: onboardingProjectUseCase === "rag" ? "#13715B" : "#E5E7EB",
                  borderRadius: 2,
                  p: 2,
                  cursor: "pointer",
                  backgroundColor: onboardingProjectUseCase === "rag" ? "#F7F9F8" : "#FFFFFF",
                  boxShadow: onboardingProjectUseCase === "rag" ? "0 0 0 1px #13715B" : "none",
                  transition: "background-color 0.2s ease, border-color 0.2s ease",
                  "&:hover": {
                    borderColor: "#13715B",
                    backgroundColor: "#F7F9F8",
                  },
                }}
              >
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                  <Box sx={{ mt: 0.25 }}>
                    <FileSearch size={20} color="#13715B" />
                  </Box>
                  <Box>
                    <Box sx={{ fontWeight: 700, fontSize: "13.5px", mb: 0.5 }}>RAG</Box>
                    <Box sx={{ fontSize: "12.5px", color: "#6B7280", lineHeight: 1.6 }}>
                      Evaluate retrieval-augmented generation
                    </Box>
                  </Box>
                </Box>
              </Box>
              <Box
                onClick={() => setOnboardingProjectUseCase("chatbot")}
                sx={{
                  border: "1px solid",
                  borderColor: onboardingProjectUseCase === "chatbot" ? "#13715B" : "#E5E7EB",
                  borderRadius: 2,
                  p: 2,
                  cursor: "pointer",
                  backgroundColor: onboardingProjectUseCase === "chatbot" ? "#F7F9F8" : "#FFFFFF",
                  boxShadow: onboardingProjectUseCase === "chatbot" ? "0 0 0 1px #13715B" : "none",
                  transition: "background-color 0.2s ease, border-color 0.2s ease",
                  "&:hover": {
                    borderColor: "#13715B",
                    backgroundColor: "#F7F9F8",
                  },
                }}
              >
                <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                  <Box sx={{ mt: 0.25 }}>
                    <Bot size={20} color="#13715B" />
                  </Box>
                  <Box>
                    <Box sx={{ fontWeight: 700, fontSize: "13.5px", mb: 0.5 }}>Chatbots</Box>
                    <Box sx={{ fontSize: "12.5px", color: "#6B7280", lineHeight: 1.6 }}>
                      Evaluate conversational experiences
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Stack>
      </ModalStandard>

      {/* Add API Key Modal */}
      <ModalStandard
        isOpen={apiKeyModalOpen}
        onClose={() => {
          setApiKeyModalOpen(false);
          setSelectedProvider("");
          setNewApiKey("");
          setApiKeyAlert(null);
        }}
        title="Add API key"
        description="Add an LLM provider API key to use for running evaluations."
        onSubmit={handleAddApiKey}
        submitButtonText="Add API key"
        isSubmitting={apiKeySaving || !selectedProvider || !newApiKey.trim()}
      >
        {apiKeyAlert && <Alert variant={apiKeyAlert.variant} body={apiKeyAlert.body} />}
        <Stack spacing={3}>
          <Select
            id="provider-select"
            label="Select provider"
            placeholder="Select a provider from the list"
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value as string)}
            items={LLM_PROVIDERS}
          />
          <Field
            label="API key"
            value={newApiKey}
            onChange={(e) => setNewApiKey(e.target.value)}
            placeholder="Enter your API key..."
            type="password"
            autoComplete="off"
            isDisabled={!selectedProvider}
          />
        </Stack>
      </ModalStandard>
    </Box>
  );
}

