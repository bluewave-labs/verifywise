import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Box, Stack, Typography, RadioGroup, FormControlLabel, Radio, Select as MuiSelect, MenuItem, Divider, Popover, Button, List, ListItemButton, ListItemText, useTheme, Card, CardContent, Grid } from "@mui/material";
import { ChevronDown, ChevronRight, Plus, Check } from "lucide-react";
import { getSelectStyles } from "../../utils/inputStyles";
import { Home, FlaskConical, FileSearch, Bot, LayoutDashboard, Database, Award, Settings, Save, Workflow } from "lucide-react";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import EvalsSidebar from "./EvalsSidebar";
import PageHeader from "../../components/Layout/PageHeader";
import HelperIcon from "../../components/HelperIcon";
import ModalStandard from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";
import Alert from "../../components/Alert";
import CustomizableButton from "../../components/Button/CustomizableButton";
import CustomAxios from "../../../infrastructure/api/customAxios";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";
import { experimentsService } from "../../../infrastructure/api/evaluationLogsService";
import { deepEvalDatasetsService } from "../../../infrastructure/api/deepEvalDatasetsService";
import { deepEvalScorersService } from "../../../infrastructure/api/deepEvalScorersService";
import { evaluationLlmApiKeysService, type LLMApiKey } from "../../../infrastructure/api/evaluationLlmApiKeysService";
import { Plus as PlusIcon, Trash2 as DeleteIcon } from "lucide-react";
import { Chip, Collapse, IconButton, CircularProgress } from "@mui/material";
import ConfirmationModal from "../../components/Dialogs/ConfirmationModal";

// Import provider logos
import { ReactComponent as OpenAILogo } from "../../assets/icons/openai_logo.svg";
import { ReactComponent as AnthropicLogo } from "../../assets/icons/anthropic_logo.svg";
import { ReactComponent as GeminiLogo } from "../../assets/icons/gemini_logo.svg";
import { ReactComponent as MistralLogo } from "../../assets/icons/mistral_logo.svg";
import { ReactComponent as XAILogo } from "../../assets/icons/xai_logo.svg";
import { ReactComponent as HuggingFaceLogo } from "../../assets/icons/huggingface_logo.svg";

// Tab components
import ProjectsList from "./ProjectsList";
import ProjectOverview from "./ProjectOverview";
import ProjectExperiments from "./ProjectExperiments";
import { ProjectDatasets } from "./ProjectDatasets";
import ProjectScorers from "./ProjectScorers";
import ExperimentDetailContent from "./ExperimentDetailContent";
import type { DeepEvalProject } from "./types";
import { deepEvalOrgsService } from "../../../infrastructure/api/deepEvalOrgsService";

const LLM_PROVIDERS = [
  { _id: "openai", name: "OpenAI", Logo: OpenAILogo },
  { _id: "anthropic", name: "Anthropic", Logo: AnthropicLogo },
  { _id: "google", name: "Google (Gemini)", Logo: GeminiLogo },
  { _id: "xai", name: "xAI", Logo: XAILogo },
  { _id: "mistral", name: "Mistral", Logo: MistralLogo },
  { _id: "huggingface", name: "Hugging Face", Logo: HuggingFaceLogo },
];

const LAST_PROJECT_KEY = "evals_last_project_id";
const RECENT_EXPERIMENTS_KEY = "evals_recent_experiments";
const RECENT_PROJECTS_KEY = "evals_recent_projects";

interface RecentExperiment {
  id: string;
  name: string;
  projectId: string;
}

interface RecentProject {
  id: string;
  name: string;
}

export default function EvalsDashboard() {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Determine tab from URL hash or default
  const [tab, setTab] = useState(() => {
    const hash = location.hash.replace("#", "");
    // When no projectId, default to "overview" to show projects list
    if (!projectId) {
      return "overview";
    }
    return hash || "overview";
  });

  // Keep tab in sync with URL hash so external navigations (e.g., from Overview button) work
  useEffect(() => {
    if (!projectId) return;
    const hash = location.hash.replace("#", "");
    setTab(hash || "overview");
  }, [location.hash, projectId]);

  // Persist projectId to localStorage when it changes
  useEffect(() => {
    if (projectId) {
      localStorage.setItem(LAST_PROJECT_KEY, projectId);
    }
  }, [projectId]);

  const [currentProject, setCurrentProject] = useState<DeepEvalProject | null>(null);
  const [allProjects, setAllProjects] = useState<DeepEvalProject[]>([]);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState<{ name: string; description: string; useCase: "chatbot" | "rag" | "agent" }>({ name: "", description: "", useCase: "chatbot" });
  const [loading, setLoading] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [experimentsCount, setExperimentsCount] = useState<number>(0);
  const [datasetsCount, setDatasetsCount] = useState<number>(0);
  const [scorersCount, setScorersCount] = useState<number>(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);
  const [recentExperiments, setRecentExperiments] = useState<RecentExperiment[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_EXPERIMENTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_PROJECTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // API key modal state
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [apiKeySaving, setApiKeySaving] = useState(false);
  const [apiKeyAlert, setApiKeyAlert] = useState<{ variant: "success" | "error"; body: string } | null>(null);

  // LLM API keys list state (for Settings-style display)
  const [llmApiKeys, setLlmApiKeys] = useState<LLMApiKey[]>([]);
  const [llmApiKeysLoading, setLlmApiKeysLoading] = useState(false);
  const [deletingKeyProvider, setDeletingKeyProvider] = useState<string | null>(null);
  const [deleteKeyModalOpen, setDeleteKeyModalOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<LLMApiKey | null>(null);

  // Onboarding state: "project" | null (null = completed) - org is auto-created
  const [onboardingStep, setOnboardingStep] = useState<"project" | null>(null);
  const [onboardingProjectName, setOnboardingProjectName] = useState("");
  const [onboardingProjectDesc, setOnboardingProjectDesc] = useState("");
  const [onboardingProjectUseCase, setOnboardingProjectUseCase] = useState<"chatbot" | "rag" | "agent">("chatbot");
  const [serverConnectionError, setServerConnectionError] = useState(false);
  const [onboardingSubmitting, setOnboardingSubmitting] = useState(false);

  // Project actions state (rename, delete)
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameProjectId, setRenameProjectId] = useState<string | null>(null);
  const [renameProjectName, setRenameProjectName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [projectActionAlert, setProjectActionAlert] = useState<{ variant: "success" | "error"; body: string } | null>(null);

  // Project selector state (for dropdown above sidebar)
  const [selectOpen, setSelectOpen] = useState(false);
  const [actionsAnchor, setActionsAnchor] = useState<HTMLElement | null>(null);
  const preventCloseRef = useRef(false);

  // Helper function to add a recent experiment
  const addRecentExperiment = useCallback((experiment: RecentExperiment) => {
    setRecentExperiments((prev) => {
      const filtered = prev.filter((e) => e.id !== experiment.id);
      const updated = [experiment, ...filtered].slice(0, 10); // Keep max 10
      localStorage.setItem(RECENT_EXPERIMENTS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Helper function to add a recent project
  const addRecentProject = (project: RecentProject) => {
    setRecentProjects((prev) => {
      const filtered = prev.filter((p) => p.id !== project.id);
      const updated = [project, ...filtered].slice(0, 10); // Keep max 10
      localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Track current project as recent when viewed
  useEffect(() => {
    if (projectId && currentProject) {
      addRecentProject({ id: currentProject.id, name: currentProject.name });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, currentProject?.id]);

  // Track experiment as recent when viewed
  useEffect(() => {
    if (selectedExperimentId && projectId) {
      // Fetch the experiment to get its name
      experimentsService.getExperiment(selectedExperimentId).then((data) => {
        if (data.experiment && data.experiment.name) {
          addRecentExperiment({
            id: selectedExperimentId,
            name: data.experiment.name,
            projectId: projectId,
          });
        }
        // If no name, don't add to recent - wait until experiment has a proper name
      }).catch(() => {
        // If fetch fails, don't add to recent experiments
        console.error("Failed to fetch experiment for recent list:", selectedExperimentId);
      });
    }
  }, [selectedExperimentId, projectId, addRecentExperiment]);

  // Auto-fix recent experiments that have ID-like names by re-fetching
  useEffect(() => {
    const fixRecentExperimentNames = async () => {
      const needsUpdate: RecentExperiment[] = [];
      
      for (const exp of recentExperiments) {
        // Check if name looks like an experiment ID (starts with "exp_")
        if (exp.name.startsWith("exp_")) {
          try {
            const data = await experimentsService.getExperiment(exp.id);
            if (data.experiment && data.experiment.name && !data.experiment.name.startsWith("exp_")) {
              needsUpdate.push({
                id: exp.id,
                name: data.experiment.name,
                projectId: exp.projectId,
              });
            }
          } catch {
            // Experiment might be deleted, skip it
          }
        }
      }
      
      // Update the entries that need fixing
      if (needsUpdate.length > 0) {
        setRecentExperiments((prev) => {
          const updated = prev.map((exp) => {
            const fix = needsUpdate.find((n) => n.id === exp.id);
            return fix || exp;
          });
          localStorage.setItem(RECENT_EXPERIMENTS_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    };
    
    // Only run once on mount if there are experiments to check
    if (recentExperiments.some((exp) => exp.name.startsWith("exp_"))) {
      fixRecentExperimentNames();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Load LLM API keys when configuration tab is active
  const fetchLlmApiKeys = async () => {
    setLlmApiKeysLoading(true);
    try {
      const keys = await evaluationLlmApiKeysService.getAllKeys();
      setLlmApiKeys(keys);
    } catch (err) {
      console.error("Failed to fetch Provider API keys:", err);
    } finally {
      setLlmApiKeysLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "configuration") {
      fetchLlmApiKeys();
    }
  }, [tab]);

  // Delete LLM API key handler
  const handleDeleteLlmKey = async () => {
    if (!keyToDelete) return;

    setDeletingKeyProvider(keyToDelete.provider);
    setDeleteKeyModalOpen(false);

    try {
      await evaluationLlmApiKeysService.deleteKey(keyToDelete.provider);

      // Wait for animation then refresh
      setTimeout(async () => {
        setApiKeyAlert({ variant: "success", body: "API key deleted successfully" });
        setTimeout(() => setApiKeyAlert(null), 3000);
        await fetchLlmApiKeys();
        setDeletingKeyProvider(null);
        setKeyToDelete(null);
      }, 300);
    } catch {
      setDeletingKeyProvider(null);
      setApiKeyAlert({ variant: "error", body: "Failed to delete API key" });
      setTimeout(() => setApiKeyAlert(null), 5000);
    }
  };

  // Get provider display name
  const getProviderDisplayName = (provider: string): string => {
    const providerObj = LLM_PROVIDERS.find(p => p._id === provider);
    return providerObj?.name || provider.charAt(0).toUpperCase() + provider.slice(1);
  };

  // Format date for display
  const formatKeyDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  // Load current org on mount and auto-create default org if needed
  useEffect(() => {
    const loadAndCheckOnboarding = async () => {
      try {
        // Check if there are any organizations
        let { orgs } = await deepEvalOrgsService.getAllOrgs();

        if (!orgs || orgs.length === 0) {
          // No organizations - auto-create a default one
          try {
            const { org: newOrg } = await deepEvalOrgsService.createOrg("Default Organization");
            await deepEvalOrgsService.setCurrentOrg(newOrg.id);
            setOrgId(newOrg.id);
            orgs = [newOrg];
          } catch (createErr) {
            console.error("Failed to create default organization:", createErr);
            setServerConnectionError(true);
            setOnboardingStep(null);
            return;
          }
        }

        // Has organizations - check for current org
        const { org } = await deepEvalOrgsService.getCurrentOrg();
        if (org) {
          setOrgId(org.id);
        } else {
          // Has orgs but none selected - select first one
          await deepEvalOrgsService.setCurrentOrg(orgs[0].id);
          setOrgId(orgs[0].id);
        }

        // Check for last project - try to redirect regardless of org association
        const lastProjectId = localStorage.getItem(LAST_PROJECT_KEY);
        if (lastProjectId) {
          // Verify the project still exists
          try {
            const projectData = await deepEvalProjectsService.getProject(lastProjectId);
            if (projectData?.project) {
              navigate(`/evals/${lastProjectId}#overview`, { replace: true });
              return;
            }
          } catch {
            // Project doesn't exist anymore, clear from localStorage
            localStorage.removeItem(LAST_PROJECT_KEY);
          }
        }

        // No last project - check current org's projects for onboarding
        const currentOrgId = org?.id || orgs[0].id;
        const projectIds = await deepEvalOrgsService.getProjectsForOrg(currentOrgId);
        if (!projectIds || projectIds.length === 0) {
          // Org exists but no projects - go to project step
          setOnboardingStep("project");
        } else if (projectIds.length > 0) {
          // Redirect to first project in org
          navigate(`/evals/${projectIds[0]}#overview`, { replace: true });
          return;
        }
      } catch (err) {
        console.error("Failed to check onboarding:", err);
        // On error, set server connection error instead of forcing onboarding
        setServerConnectionError(true);
        setOnboardingStep(null);
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
  }, [projectId, navigate]);

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

        // Load datasets count - count built-in datasets (same as what's shown in the Datasets tab)
        const datasetsData = await deepEvalDatasetsService.list();
        const totalCount = Object.values(datasetsData).reduce((sum, datasets) => {
          return sum + (Array.isArray(datasets) ? datasets.length : 0);
        }, 0);
        setDatasetsCount(totalCount);

        // Load scorers count
        const scorersData = await deepEvalScorersService.list({ project_id: projectId });
        setScorersCount(scorersData.scorers?.length || 0);
      } catch (err) {
        console.error("Failed to load counts:", err);
        setDatasetsCount(0);
        setScorersCount(0);
      }
    };

    loadCounts();
  }, [projectId, currentProject]);

  const handleTabChange = (newValue: string) => {
    setTab(newValue);
    // Clear selected experiment when switching tabs
    setSelectedExperimentId(null);
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

  // Project action handlers
  const handleRenameProject = (projectIdToRename: string) => {
    const proj = allProjects.find((p) => p.id === projectIdToRename);
    if (proj) {
      setRenameProjectId(projectIdToRename);
      setRenameProjectName(proj.name);
      setRenameModalOpen(true);
    }
  };

  const handleCopyProjectId = (projectIdToCopy: string) => {
    navigator.clipboard.writeText(projectIdToCopy);
    setProjectActionAlert({ variant: "success", body: "Project ID copied to clipboard" });
    setTimeout(() => setProjectActionAlert(null), 3000);
  };

  const handleDeleteProject = (projectIdToDelete: string) => {
    setDeleteProjectId(projectIdToDelete);
    setDeleteModalOpen(true);
  };

  const handleConfirmRename = async () => {
    if (!renameProjectId || !renameProjectName.trim()) return;
    setRenaming(true);
    try {
      await deepEvalProjectsService.updateProject(renameProjectId, { name: renameProjectName.trim() });
      // Reload projects list
      const data = await deepEvalProjectsService.getAllProjects();
      setAllProjects(data.projects);
      // Update current project if it was renamed
      if (projectId === renameProjectId) {
        const updated = data.projects.find((p) => p.id === renameProjectId);
        if (updated) setCurrentProject(updated);
      }
      setProjectActionAlert({ variant: "success", body: "Project renamed successfully" });
      setTimeout(() => setProjectActionAlert(null), 3000);
      setRenameModalOpen(false);
      setRenameProjectId(null);
      setRenameProjectName("");
    } catch (err) {
      setProjectActionAlert({ variant: "error", body: err instanceof Error ? err.message : "Failed to rename project" });
      setTimeout(() => setProjectActionAlert(null), 5000);
    } finally {
      setRenaming(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteProjectId) return;
    setDeleting(true);
    try {
      await deepEvalProjectsService.deleteProject(deleteProjectId);
      // Reload projects list
      const data = await deepEvalProjectsService.getAllProjects();
      setAllProjects(data.projects);

      // Remove deleted project from recent projects
      setRecentProjects((prev) => {
        const filtered = prev.filter((p) => p.id !== deleteProjectId);
        localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(filtered));
        return filtered;
      });

      // If we deleted the current project, navigate away
      if (projectId === deleteProjectId) {
        if (data.projects.length > 0) {
          navigate(`/evals/${data.projects[0].id}#overview`);
        } else {
          navigate("/evals#overview");
        }
      }
      setProjectActionAlert({ variant: "success", body: "Project deleted successfully" });
      setTimeout(() => setProjectActionAlert(null), 3000);
      setDeleteModalOpen(false);
      setDeleteProjectId(null);
    } catch (err) {
      setProjectActionAlert({ variant: "error", body: err instanceof Error ? err.message : "Failed to delete project" });
      setTimeout(() => setProjectActionAlert(null), 5000);
    } finally {
      setDeleting(false);
    }
  };

  // Organization is auto-created, no user interaction needed

  const handleSkipOnboarding = () => {
    setOnboardingStep(null);
    navigate("/evals");
  };

  const handleRetryConnection = async () => {
    setServerConnectionError(false);
    setInitialLoading(true);
    try {
      let { orgs } = await deepEvalOrgsService.getAllOrgs();
      if (!orgs || orgs.length === 0) {
        // Auto-create default org
        try {
          const { org: newOrg } = await deepEvalOrgsService.createOrg("Default Organization");
          await deepEvalOrgsService.setCurrentOrg(newOrg.id);
          setOrgId(newOrg.id);
          orgs = [newOrg];
        } catch {
          setServerConnectionError(true);
          return;
        }
      }
      
      const { org } = await deepEvalOrgsService.getCurrentOrg();
      if (org) {
        setOrgId(org.id);
      } else {
        await deepEvalOrgsService.setCurrentOrg(orgs[0].id);
        setOrgId(orgs[0].id);
      }
      setOnboardingStep(null);
    } catch {
      setServerConnectionError(true);
    } finally {
      setInitialLoading(false);
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
      // Refresh the keys list
      await fetchLlmApiKeys();
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
    <Stack className="vwhome" gap={"16px"}>
      <PageBreadcrumbs items={breadcrumbItems} />

      {/* Server Connection Error Banner */}
      {serverConnectionError && (
        <Box
          sx={{
            p: 2,
            backgroundColor: "#FEF2F2",
            borderRadius: "8px",
            border: "1px solid #FECACA",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: "#FEE2E2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography sx={{ fontSize: "16px" }}>⚠️</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#DC2626" }}>
                Unable to connect to the evaluation server
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#7F1D1D" }}>
                Please make sure the backend server is running and try again.
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="outlined"
            size="small"
            onClick={handleRetryConnection}
            disabled={initialLoading}
            sx={{
              textTransform: "none",
              borderColor: "#DC2626",
              color: "#DC2626",
              "&:hover": { borderColor: "#B91C1C", backgroundColor: "#FEE2E2" },
            }}
          >
            {initialLoading ? "Retrying..." : "Retry Connection"}
          </Button>
        </Box>
      )}

      <PageHeader
        title="LLM evals"
        description="Evaluate and benchmark your LLM applications for quality, safety, and performance using customizable scorers and datasets."
        rightContent={<HelperIcon articlePath="llm-evals/llm-evals-overview" />}
      />

      <Box sx={{ display: "flex", gap: "16px" }}>
        {/* Left column: Project selector + Sidebar */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: "8px", width: "200px", minWidth: "200px" }}>
          {/* Project selector above sidebar */}
          {allProjects.length > 0 && (
            <Box>
              <MuiSelect
                value={projectId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && val !== "create_new") {
                    handleProjectChange(val);
                  }
                }}
                displayEmpty
                open={selectOpen}
                onOpen={() => setSelectOpen(true)}
                onClose={() => {
                  if (!actionsAnchor && !preventCloseRef.current) {
                    setSelectOpen(false);
                  }
                  preventCloseRef.current = false;
                }}
                renderValue={(value) => {
                  const project = allProjects.find((p) => p.id === value);
                  return project?.name || "Select project";
                }}
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
                      borderRadius: "4px",
                      boxShadow: theme.shadows[3],
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
                  width: "100%",
                  height: "34px",
                  backgroundColor: theme.palette.background.main,
                  position: "relative",
                  cursor: "pointer",
                  "& .MuiOutlinedInput-root": {
                    height: "34px",
                  },
                  "& .MuiSelect-select": {
                    padding: "0 32px 0 10px !important",
                    height: "34px !important",
                    minHeight: "34px !important",
                    display: "flex",
                    alignItems: "center",
                    lineHeight: 1,
                    boxSizing: "border-box",
                  },
                  ...getSelectStyles(theme),
                }}
              >
                {allProjects.map((proj) => {
                  const isSelected = proj.id === projectId;
                  const hasActions = true; // We have rename, copy, delete actions
                  return (
                    <MenuItem
                      key={proj.id}
                      value={proj.id}
                      onClick={(e) => {
                        if (isSelected && hasActions) {
                          e.stopPropagation();
                          e.preventDefault();
                          preventCloseRef.current = true;
                          setActionsAnchor(e.currentTarget as HTMLElement);
                        }
                      }}
                      sx={{
                        fontSize: 13,
                        color: theme.palette.text.tertiary,
                        borderRadius: "4px",
                        margin: theme.spacing(2),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {proj.name}
                      </span>
                      {isSelected && hasActions && (
                        <ChevronRight
                          size={14}
                          style={{ marginLeft: 8, flexShrink: 0, color: theme.palette.text.tertiary }}
                        />
                      )}
                    </MenuItem>
                  );
                })}
                <Divider sx={{ my: 0.5 }} />
                <MenuItem
                  value="create_new"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setSelectOpen(false);
                    setCreateProjectModalOpen(true);
                  }}
                  sx={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#13715B",
                    borderRadius: "4px",
                    margin: theme.spacing(2),
                  }}
                >
                  <Plus size={14} style={{ marginRight: 8 }} />
                  Create project
                </MenuItem>
              </MuiSelect>

              {/* Project actions popover */}
              <Popover
                open={Boolean(actionsAnchor)}
                anchorEl={actionsAnchor}
                onClose={() => {
                  setActionsAnchor(null);
                  setSelectOpen(false);
                }}
                anchorOrigin={{
                  vertical: "center",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "center",
                  horizontal: "left",
                }}
                slotProps={{
                  paper: {
                    sx: {
                      borderRadius: "4px",
                      boxShadow: theme.shadows[3],
                      ml: 0.5,
                      minWidth: 140,
                    },
                  },
                }}
              >
                <List disablePadding sx={{ py: 0.5 }}>
                  <ListItemButton
                    onClick={() => {
                      if (projectId) handleRenameProject(projectId);
                      setActionsAnchor(null);
                      setSelectOpen(false);
                    }}
                    sx={{
                      height: 32,
                      px: 1.5,
                      "&:hover": { backgroundColor: theme.palette.background.accent },
                    }}
                  >
                    <ListItemText
                      primary="Rename project"
                      primaryTypographyProps={{ fontSize: 13, color: theme.palette.text.primary }}
                    />
                  </ListItemButton>
                  <ListItemButton
                    onClick={() => {
                      if (projectId) handleCopyProjectId(projectId);
                      setActionsAnchor(null);
                      setSelectOpen(false);
                    }}
                    sx={{
                      height: 32,
                      px: 1.5,
                      "&:hover": { backgroundColor: theme.palette.background.accent },
                    }}
                  >
                    <ListItemText
                      primary="Copy project ID"
                      primaryTypographyProps={{ fontSize: 13, color: theme.palette.text.primary }}
                    />
                  </ListItemButton>
                  <ListItemButton
                    onClick={() => {
                      if (projectId) handleDeleteProject(projectId);
                      setActionsAnchor(null);
                      setSelectOpen(false);
                    }}
                    sx={{
                      height: 32,
                      px: 1.5,
                      "&:hover": { backgroundColor: theme.palette.background.accent },
                    }}
                  >
                    <ListItemText
                      primary="Delete project"
                      primaryTypographyProps={{ fontSize: 13, color: "#DC2626" }}
                    />
                  </ListItemButton>
                </List>
              </Popover>

            </Box>
          )}

          {/* Sidebar */}
          <EvalsSidebar
            activeTab={tab}
            onTabChange={handleTabChange}
            experimentsCount={experimentsCount}
            datasetsCount={datasetsCount}
            scorersCount={scorersCount}
            disabled={!projectId}
            recentExperiments={recentExperiments}
            recentProjects={recentProjects}
            onExperimentClick={(experimentId, expProjectId) => {
              if (expProjectId !== projectId) {
                navigate(`/evals/${expProjectId}#experiments`);
                setTimeout(() => {
                  setSelectedExperimentId(experimentId);
                  setTab("experiments");
                }, 100);
              } else {
                setSelectedExperimentId(experimentId);
                setTab("experiments");
                navigate(`${location.pathname}#experiments`, { replace: true });
              }
            }}
            onProjectClick={(clickedProjectId) => {
              navigate(`/evals/${clickedProjectId}#overview`);
            }}
          />
        </Box>

        {/* Main content */}
        <Box sx={{ flex: 1, margin: 0, padding: 0 }}>
          {/* Show nothing while initially loading to prevent flash */}
          {initialLoading && !projectId ? null : (
          !projectId ? (
            /* No project selected - show projects list */
            <ProjectsList />
          ) : (
            /* Project selected - show tab content */
            <>
              {tab === "overview" && (
                <ProjectOverview
                  projectId={projectId}
                  project={currentProject}
                  onProjectUpdate={setCurrentProject}
                  onViewExperiment={(experimentId) => {
                    setSelectedExperimentId(experimentId);
                    setTab("experiments");
                    navigate(`${location.pathname}#experiments`, { replace: true });
                  }}
                />
              )}

              {tab === "experiments" && (
                selectedExperimentId ? (
                  <ExperimentDetailContent
                    experimentId={selectedExperimentId}
                    projectId={projectId || ""}
                    onBack={() => setSelectedExperimentId(null)}
                  />
                ) : (
                  <ProjectExperiments
                    projectId={projectId}
                    onViewExperiment={(experimentId) => setSelectedExperimentId(experimentId)}
                  />
                )
              )}

              {tab === "datasets" && (
                <ProjectDatasets projectId={projectId} />
              )}

              {tab === "scorers" && projectId && (
                <ProjectScorers projectId={projectId} />
              )}

              {tab === "configuration" && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
                  {/* Header + description */}
                  <Stack spacing={1} mb={2}>
                    <Typography variant="h6" fontSize={15} fontWeight="600" color="#111827">
                      Configuration
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: "14px" }}>
                      Configure your project's LLM use case and manage API keys for running evaluations.
                    </Typography>
                  </Stack>

                  {/* LLM Use Case Card */}
                  <Box
                    sx={{
                      background: "#fff",
                      border: "1px solid #d0d5dd",
                      borderRadius: "4px",
                      p: "20px 24px",
                      boxShadow: "none",
                    }}
                  >
                    <Typography sx={{ fontWeight: 600, fontSize: 16, mb: 3, color: "#344054" }}>
                      LLM use case
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "220px 1fr",
                        rowGap: "20px",
                        columnGap: "80px",
                        alignItems: "flex-start",
                      }}
                    >
                      {/* Use Case Row */}
                      <Box>
                        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>Use case type</Typography>
                        <Typography sx={{ fontSize: 12, color: "#888" }}>
                          Select the type of LLM application you want to evaluate
                        </Typography>
                      </Box>
                      <RadioGroup
                        value={currentProject?.useCase || "chatbot"}
                        onChange={(e) => {
                          if (currentProject) {
                            setCurrentProject({ ...currentProject, useCase: e.target.value as "rag" | "chatbot" | "agent" });
                          }
                        }}
                      >
                        <FormControlLabel
                          value="rag"
                          control={
                            <Radio
                              sx={{
                                color: "#d0d5dd",
                                "&.Mui-checked": { color: "#13715B" },
                                "& .MuiSvgIcon-root": { fontSize: 20 },
                              }}
                            />
                          }
                          label={
                            <Box>
                              <Typography sx={{ fontWeight: 600, fontSize: "13px" }}>RAG</Typography>
                              <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>
                                Evaluate retrieval-augmented generation, including recall, precision, relevancy and faithfulness.
                              </Typography>
                            </Box>
                          }
                          sx={{ alignItems: "flex-start", mb: 1.5 }}
                        />
                        <FormControlLabel
                          value="chatbot"
                          control={
                            <Radio
                              sx={{
                                color: "#d0d5dd",
                                "&.Mui-checked": { color: "#13715B" },
                                "& .MuiSvgIcon-root": { fontSize: 20 },
                              }}
                            />
                          }
                          label={
                            <Box>
                              <Typography sx={{ fontWeight: 600, fontSize: "13px" }}>Chatbot</Typography>
                              <Typography sx={{ fontSize: "12px", color: "#6B7280" }}>
                                Evaluate single and multi-turn conversational experiences for coherence, correctness and safety.
                              </Typography>
                            </Box>
                          }
                          sx={{ alignItems: "flex-start" }}
                        />
                      </RadioGroup>
                    </Box>
                  </Box>

                  {/* LLM API Keys Card */}
                  <Box
                    sx={{
                      background: "#fff",
                      border: "1px solid #d0d5dd",
                      borderRadius: "4px",
                      p: "20px 24px",
                      boxShadow: "none",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: 16, color: "#344054" }}>
                          Provider API keys
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: "#666666", mt: 0.5 }}>
                          Encrypted keys for running evaluations
                        </Typography>
                      </Box>
                      {llmApiKeys.length > 0 && (
                        <CustomizableButton
                          variant="contained"
                          text="Add API key"
                          icon={<PlusIcon size={16} />}
                          onClick={() => setApiKeyModalOpen(true)}
                          sx={{
                            backgroundColor: "#13715B",
                            color: "#fff",
                            "&:hover": { backgroundColor: "#0e5c47" },
                          }}
                        />
                      )}
                    </Box>

                    {llmApiKeysLoading && llmApiKeys.length === 0 ? (
                      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : llmApiKeys.length === 0 ? (
                      <Box
                        sx={{
                          border: "2px dashed #e5e7eb",
                          borderRadius: "12px",
                          p: 6,
                          textAlign: "center",
                          backgroundColor: "#fafbfc",
                        }}
                      >
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: "50%",
                            backgroundColor: "#f0fdf4",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto",
                            mb: 2,
                          }}
                        >
                          <PlusIcon size={24} color="#13715B" />
                        </Box>
                        <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#000000", mb: 1 }}>
                          No API keys yet
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: "#666666", mb: 3 }}>
                          Add your first API key to enable LLM evaluations
                        </Typography>
                        <CustomizableButton
                          variant="contained"
                          text="Add API key"
                          icon={<PlusIcon size={16} />}
                          onClick={() => setApiKeyModalOpen(true)}
                          sx={{
                            backgroundColor: "#13715B",
                            color: "#fff",
                            "&:hover": { backgroundColor: "#0e5c47" },
                          }}
                        />
                      </Box>
                    ) : (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {llmApiKeys.map((key) => {
                          const providerConfig = LLM_PROVIDERS.find(p => p._id === key.provider);
                          const ProviderLogo = providerConfig?.Logo;
                          return (
                          <Collapse
                            key={key.provider}
                            in={deletingKeyProvider !== key.provider}
                            timeout={300}
                          >
                            <Box
                              sx={{
                                border: "1.5px solid #eaecf0",
                                borderRadius: "10px",
                                p: 2,
                                pl: 2.5,
                                backgroundColor: "#ffffff",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                cursor: "default",
                                opacity: deletingKeyProvider === key.provider ? 0 : 1,
                                transform: deletingKeyProvider === key.provider ? "translateY(-20px)" : "translateY(0)",
                                transition: "opacity 0.3s ease, transform 0.3s ease",
                              }}
                            >
                              <Stack direction="row" alignItems="center" spacing={2.5} sx={{ flex: 1 }}>
                                {/* Provider Logo */}
                                <Box
                                  sx={{
                                    width: 56,
                                    height: 56,
                                    minWidth: 56,
                                    minHeight: 56,
                                    borderRadius: "12px",
                                    backgroundColor: "#FAFAFA",
                                    border: "1px solid #E5E7EB",
                                    flexShrink: 0,
                                    overflow: "hidden",
                                    position: "relative",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      position: "absolute",
                                      top: "50%",
                                      left: "50%",
                                      transform: "translate(-50%, -50%)",
                                      width: 32,
                                      height: 32,
                                      "& svg": {
                                        width: "32px !important",
                                        height: "32px !important",
                                        maxWidth: "32px !important",
                                        maxHeight: "32px !important",
                                        display: "block !important",
                                      },
                                    }}
                                  >
                                    {ProviderLogo && <ProviderLogo />}
                                  </Box>
                                </Box>
                                
                                {/* Provider Info - Better formatted */}
                                <Box sx={{ flex: 1 }}>
                                  <Stack direction="row" alignItems="center" sx={{ mb: 1.5, gap: "10px" }}>
                                    <Typography sx={{
                                      fontSize: 15,
                                      fontWeight: 600,
                                      color: "#111827",
                                    }}>
                                      {getProviderDisplayName(key.provider)}
                                    </Typography>
                                    <Chip
                                      label="ACTIVE"
                                      sx={{
                                        backgroundColor: "#dcfce7",
                                        color: "#166534",
                                        fontWeight: 600,
                                        fontSize: "9px",
                                        height: "18px",
                                        borderRadius: "4px",
                                        "& .MuiChip-label": {
                                          padding: "0 6px",
                                          textTransform: "uppercase",
                                          letterSpacing: "0.5px",
                                        },
                                      }}
                                    />
                                  </Stack>
                                  <Stack direction="row" alignItems="center" sx={{ gap: "48px" }}>
                                    <Box>
                                      <Typography sx={{ fontSize: 11, color: "#9CA3AF", mb: 0.5 }}>API Key</Typography>
                                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#374151", fontFamily: "monospace" }}>
                                        {key.maskedKey}
                                      </Typography>
                                    </Box>
                                    <Box>
                                      <Typography sx={{ fontSize: 11, color: "#9CA3AF", mb: 0.5 }}>Added</Typography>
                                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>
                                        {formatKeyDate(key.createdAt)}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </Box>
                              </Stack>
                              
                              {/* Action buttons */}
                              <Stack direction="row" spacing={1} alignItems="center">
                                <IconButton
                                  onClick={() => {
                                    setSelectedProvider(key.provider);
                                    setNewApiKey("");
                                    setApiKeyModalOpen(true);
                                  }}
                                  sx={{
                                    color: "#6B7280",
                                    padding: "8px",
                                    "&:hover": {
                                      backgroundColor: "#F3F4F6",
                                      color: "#374151",
                                    },
                                  }}
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </IconButton>
                                <IconButton
                                  onClick={() => {
                                    setKeyToDelete(key);
                                    setDeleteKeyModalOpen(true);
                                  }}
                                  sx={{
                                    color: "#DC2626",
                                    padding: "8px",
                                    "&:hover": {
                                      backgroundColor: "#FEF2F2",
                                      color: "#B91C1C",
                                    },
                                  }}
                                >
                                  <DeleteIcon size={18} />
                                </IconButton>
                              </Stack>
                            </Box>
                          </Collapse>
                        );})}
                      </Box>
                    )}
                  </Box>

                  {/* Save Button */}
                  <Stack>
                    <CustomizableButton
                      sx={{
                        alignSelf: "flex-end",
                        width: "fit-content",
                        gap: 2,
                        backgroundColor: "#ccc",
                        border: "1px solid #ccc",
                      }}
                      icon={<Save size={16} />}
                      variant="contained"
                      onClick={() => {}}
                      isDisabled={true}
                      text="Save changes"
                    />
                  </Stack>
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
                    <Box sx={{ fontWeight: 700, fontSize: "13.5px", mb: 0.5 }}>Chatbot</Box>
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
      
      {/* Onboarding Modal: Create First Project (org is auto-created) */}
      <ModalStandard
        isOpen={onboardingStep === "project"}
        onClose={handleSkipOnboarding}
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
                    <Box sx={{ fontWeight: 700, fontSize: "13.5px", mb: 0.5 }}>Chatbot</Box>
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

      {/* Add API Key Modal - Using ModalStandard like experiment creation */}
      <ModalStandard
        isOpen={apiKeyModalOpen}
        onClose={() => {
          setApiKeyModalOpen(false);
          setSelectedProvider("");
          setNewApiKey("");
          setApiKeyAlert(null);
        }}
        title="Add API key"
        description="Configure API keys for LLM providers to run evaluations. Your keys are encrypted and stored securely."
        onSubmit={handleAddApiKey}
        submitButtonText={apiKeySaving ? "Adding..." : "Add API key"}
        isSubmitting={apiKeySaving || !selectedProvider || !newApiKey.trim()}
      >
        <Stack spacing={3}>
          {/* Provider Selection Grid - show ALL providers */}
          <Box>
            <Typography sx={{ mb: 2, fontSize: "14px", fontWeight: 500, color: "#374151" }}>
              Select Provider
            </Typography>
            <Grid container spacing={1.5}>
              {LLM_PROVIDERS.map((provider) => {
                const { Logo } = provider;
                const isSelected = selectedProvider === provider._id;
                const hasKey = llmApiKeys.some(k => k.provider === provider._id);
                
                return (
                  <Grid item xs={4} sm={4} key={provider._id}>
                    <Card
                      onClick={() => setSelectedProvider(provider._id)}
                      sx={{
                        cursor: "pointer",
                        border: "1px solid",
                        borderColor: isSelected ? "#13715B" : "#E5E7EB",
                        backgroundColor: "#FFFFFF",
                        boxShadow: "none",
                        transition: "all 0.2s ease",
                        position: "relative",
                        height: "100%",
                        "&:hover": {
                          borderColor: "#13715B",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                        },
                      }}
                    >
                      <CardContent
                        sx={{
                          textAlign: "center",
                          py: 3,
                          px: 2,
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          "&:last-child": { pb: 3 },
                        }}
                      >
                        {isSelected && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              backgroundColor: "#13715B",
                              borderRadius: "50%",
                              width: 20,
                              height: 20,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Check size={12} color="#FFFFFF" strokeWidth={3} />
                          </Box>
                        )}
                        
                        {/* Configured badge */}
                        {hasKey && !isSelected && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: 6,
                              left: 6,
                              backgroundColor: "#dcfce7",
                              borderRadius: "4px",
                              px: 0.75,
                              py: 0.25,
                            }}
                          >
                            <Typography sx={{ fontSize: "9px", fontWeight: 600, color: "#166534", textTransform: "uppercase" }}>
                              Active
                            </Typography>
                          </Box>
                        )}
                        
                        {/* Provider Logo */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "100%",
                            height: provider._id === "huggingface" || provider._id === "xai" ? 56 : 48,
                            mb: 1.5,
                            "& svg": {
                              maxWidth: provider._id === "huggingface" || provider._id === "xai" ? "100%" : "90%",
                              maxHeight: "100%",
                              width: "auto",
                              height: "auto",
                              objectFit: "contain",
                            },
                          }}
                        >
                          <Logo />
                        </Box>
                        
                        {/* Provider Name */}
                        <Typography
                          sx={{
                            fontSize: "12px",
                            fontWeight: isSelected ? 600 : 500,
                            color: isSelected ? "#13715B" : "#374151",
                            textAlign: "center",
                          }}
                        >
                          {provider.name}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          {/* API Key Input */}
          {selectedProvider && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
                  API key for {LLM_PROVIDERS.find(p => p._id === selectedProvider)?.name}
                </Typography>
                {llmApiKeys.some(k => k.provider === selectedProvider) && (
                  <Typography sx={{ fontSize: "11px", color: "#6B7280" }}>
                    This will replace the existing key
                  </Typography>
                )}
              </Stack>
              <Field
                label=""
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder="Enter your API key..."
                type="password"
                autoComplete="one-time-code"
              />
            </Box>
          )}

          {apiKeyAlert && (
            <Alert variant={apiKeyAlert.variant} body={apiKeyAlert.body} />
          )}
        </Stack>
      </ModalStandard>

      {/* Delete LLM API Key Modal */}
      {deleteKeyModalOpen && keyToDelete && (
        <ConfirmationModal
          title="Delete API key"
          body={
            <Typography fontSize={13}>
              Are you sure you want to delete the {getProviderDisplayName(keyToDelete.provider)} API key? Any evaluations using this key will no longer be able to run.
            </Typography>
          }
          cancelText="Cancel"
          proceedText="Delete"
          onCancel={() => {
            setDeleteKeyModalOpen(false);
            setKeyToDelete(null);
          }}
          onProceed={handleDeleteLlmKey}
          proceedButtonColor="error"
          proceedButtonVariant="contained"
          TitleFontSize={0}
        />
      )}

      {/* Project action alert */}
      {projectActionAlert && (
        <Box sx={{ position: "fixed", top: 16, right: 16, zIndex: 9999 }}>
          <Alert variant={projectActionAlert.variant} body={projectActionAlert.body} />
        </Box>
      )}

      {/* API key alert */}
      {apiKeyAlert && (
        <Box sx={{ position: "fixed", top: 16, right: 16, zIndex: 9999 }}>
          <Alert variant={apiKeyAlert.variant} body={apiKeyAlert.body} />
        </Box>
      )}

      {/* Rename Project Modal */}
      <ModalStandard
        isOpen={renameModalOpen}
        onClose={() => {
          setRenameModalOpen(false);
          setRenameProjectId(null);
          setRenameProjectName("");
        }}
        title="Rename project"
        description="Enter a new name for this project."
        onSubmit={handleConfirmRename}
        submitButtonText="Rename"
        isSubmitting={renaming || !renameProjectName.trim()}
      >
        <Field
          label="Project name"
          value={renameProjectName}
          onChange={(e) => setRenameProjectName(e.target.value)}
          placeholder="Enter project name..."
          isRequired
        />
      </ModalStandard>

      {/* Delete Project Modal */}
      <ModalStandard
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteProjectId(null);
        }}
        title="Delete project"
        description="Are you sure you want to delete this project? This will permanently remove all experiments, datasets, and scorers associated with this project. This action cannot be undone."
        onSubmit={handleConfirmDelete}
        submitButtonText="Delete project"
        isSubmitting={deleting}
      >
        <Typography variant="body2" color="text.secondary">
          To confirm, you are about to delete the project:{" "}
          <strong>{allProjects.find((p) => p.id === deleteProjectId)?.name}</strong>
        </Typography>
      </ModalStandard>
    </Stack>
  );
}

