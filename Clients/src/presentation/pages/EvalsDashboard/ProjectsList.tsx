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
  Divider,
  Select,
  MenuItem,
} from "@mui/material";
import { CirclePlus, Beaker, Calendar, Settings, Trash2, ChevronDown, Plus, Workflow, FileSearch, Bot } from "lucide-react";
import CustomizableButton from "../../components/Button/CustomizableButton";
import StandardModal from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";
import Alert from "../../components/Alert";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";
import { experimentsService } from "../../../infrastructure/api/evaluationLogsService";
import type { DeepEvalProject } from "./types";
import ConfirmableDeleteIconButton from "../../components/Modals/ConfirmableDeleteIconButton";
import { deepEvalOrgsService } from "../../../infrastructure/api/deepEvalOrgsService";

export default function ProjectsList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<DeepEvalProject[]>([]);
  const [runsByProject, setRunsByProject] = useState<Record<string, number>>({});
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState<{ id: string; name: string }[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [orgCreateOpen, setOrgCreateOpen] = useState(false);
  const [orgCreating, setOrgCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [alert, setAlert] = useState<{
    variant: "success" | "error";
    body: string;
  } | null>(null);

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    useCase: "chatbot" as "chatbot" | "rag" | "agent",
  });
  const [createStep, setCreateStep] = useState(0); // 0: details, 1: use case

  useEffect(() => {
    loadProjects();
    // Load orgs for inline org picker
    (async () => {
      const [{ orgs }, { org }] = await Promise.all([
        deepEvalOrgsService.getAllOrgs(),
        deepEvalOrgsService.getCurrentOrg(),
      ]);
      setOrgs(orgs);
      setCurrentOrgId(org?.id || null);
    })();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await deepEvalProjectsService.getAllProjects();
      let fetched = data.projects;
      // Filter by org when available
      try {
        const { org } = await deepEvalOrgsService.getCurrentOrg();
        const orgId = org?.id || null;
        if (orgId) {
          // If we're in VerifyWiseEvals, ensure all existing projects are attached to this org (one-time, idempotent)
          let allowedIds = await deepEvalOrgsService.getProjectsForOrg(orgId);
          if (org?.name === "VerifyWiseEvals") {
            const toAdd = (data.projects || [])
              .map((p) => p.id)
              .filter((id) => !allowedIds.includes(id));
            await Promise.all(
              toAdd.map((id) => deepEvalOrgsService.addProjectToOrg(orgId, id))
            );
            // refresh allowed list
            allowedIds = await deepEvalOrgsService.getProjectsForOrg(orgId);
          }
          fetched = (data.projects || []).filter(
            (p) => p.orgId === orgId || allowedIds.includes(p.id)
          );
        }
      } catch {
        // ignore filtering errors
      }
      setProjects(fetched);

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
        useCase: newProject.useCase,
        defaultDataset: newProject.useCase,
        orgId: currentOrgId || undefined,
      };

      const { project } = await deepEvalProjectsService.createProject(projectConfig);

      // Link project to current organization if available
      if (currentOrgId && project?.id) {
        await deepEvalOrgsService.addProjectToOrg(currentOrgId, project.id);
      }

      setAlert({
        variant: "success",
        body: `Project "${newProject.name}" created successfully!`,
      });
      setTimeout(() => setAlert(null), 5000);

      setCreateModalOpen(false);
      setCreateStep(0);
      setNewProject({
        name: "",
        description: "",
        useCase: "chatbot",
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

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deepEvalProjectsService.deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      const updated = { ...runsByProject };
      delete updated[projectId];
      setRunsByProject(updated);
      setAlert({ variant: "success", body: "Project deleted" });
      setTimeout(() => setAlert(null), 4000);
    } catch (err) {
      setAlert({ variant: "error", body: err instanceof Error ? err.message : "Failed to delete project" });
      setTimeout(() => setAlert(null), 6000);
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

        <Divider sx={{ mt: 3 }} />

        {/* Organization selector below divider */}
        {currentOrgId && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
            <Box>
              <Box sx={{ fontSize: "11px", color: "#6B7280", mb: 0.5, fontWeight: 600 }}>
                Organization
              </Box>
              <Select
                value={currentOrgId}
                onChange={async (e) => {
                  const val = e.target.value as string;
                  if (val === "manage_orgs") {
                    await deepEvalOrgsService.clearCurrentOrg();
                    setCurrentOrgId(null);
                    navigate("/evals?org=none"); // trigger parent to re-check org and show selector
                    return;
                  }
                  if (val === "create_new_org") {
                    setOrgCreateOpen(true);
                    return;
                  }
                  await deepEvalOrgsService.setCurrentOrg(val);
                  setCurrentOrgId(val);
                  navigate("/evals");
                }}
                IconComponent={() => <ChevronDown size={14} style={{ marginRight: 8 }} />}
                sx={{
                  fontSize: "14px",
                  fontWeight: 600,
                  minWidth: "260px",
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
                <Divider sx={{ my: 0.5 }} />
                <MenuItem value="create_new_org">
                  <Plus size={16} style={{ marginRight: 8 }} />
                  Create organization
                </MenuItem>
              </Select>
            </Box>
          </Box>
        )}

        {/* Projects Title - Below Divider */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pt: 2, pb: 2 }}>
          <Typography variant="h6" fontSize={15} fontWeight="600" color="#111827">
            Projects
          </Typography>
          
          {/* Create Project Button - Right Aligned */}
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
        </Stack>
      </Stack>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            py: 12,
            px: 3,
            border: "1px solid #E5E7EB",
            borderRadius: 2,
            backgroundColor: "#FFFFFF",
            minHeight: 400,
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Beaker size={64} color="#9CA3AF" strokeWidth={1.5} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: "18px", color: "#111827" }}>
            No projects yet
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 4, fontSize: "14px", maxWidth: 480, lineHeight: 1.6, color: "#6B7280" }}
          >
            Create your first project to start evaluating LLMs. Each project can contain multiple experiments with different configurations.
          </Typography>
          <CustomizableButton
            variant="contained"
            startIcon={<CirclePlus size={18} />}
            onClick={() => setCreateModalOpen(true)}
            sx={{
              textTransform: "none",
              backgroundColor: "#13715B",
              "&:hover": { backgroundColor: "0f5a47" },
              fontSize: "14px",
              fontWeight: 500,
              px: 3,
              py: 1.25,
            }}
          >
            Create your first project
          </CustomizableButton>
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
                  border: "1px solid #E5E7EB",
                  boxShadow: "none",
                  userSelect: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                    transform: "translateY(-2px)",
                    borderColor: "#13715B",
                  },
                }}
                onClick={() => handleOpenProject(project.id)}
              >
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6" sx={{ fontSize: "14px", fontWeight: 600, color: "#111827" }}>
                      {project.name}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {/* Delete project */}
                      <Box
                        onClick={(e) => e.stopPropagation()}
                        sx={{ ml: 0.5 }}
                      >
                        <ConfirmableDeleteIconButton
                          id={project.id}
                          title="Delete this project?"
                          message="This will remove the project and all its eval runs."
                          onConfirm={() => handleDeleteProject(project.id)}
                          customIcon={<Trash2 size={16} color="#D32F2F" />}
                        />
                      </Box>
                    </Box>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3, minHeight: 40, fontSize: "13px", lineHeight: 1.5, color: "#6B7280" }}
                  >
                    {project.description || "No description provided"}
                  </Typography>

                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Calendar size={13} color="#9CA3AF" />
                      <Typography variant="caption" sx={{ fontSize: "12px", color: "#9CA3AF" }}>
                        {new Date(project.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${runsByProject[project.id] ?? 0} ${
                        (runsByProject[project.id] ?? 0) === 1 ? "run" : "runs"
                      }`}
                      size="small"
                      sx={{
                        fontSize: "11px",
                        height: 22,
                        backgroundColor: "#F3F4F6",
                        color: "#6B7280",
                        fontWeight: 500,
                      }}
                    />
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: "flex-end", p: 2, pt: 0, gap: 1, borderTop: "1px solid #F3F4F6" }}>
                  <Button
                    size="small"
                    variant="contained"
                    sx={{
                      textTransform: "none",
                      fontSize: "13px",
                      fontWeight: 500,
                      backgroundColor: "#13715B",
                      "&:hover": { backgroundColor: "#0f5a47" },
                      px: 2.5,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenProject(project.id);
                    }}
                  >
                    Open
                  </Button>
                  <Button
                    size="small"
                    sx={{
                      textTransform: "none",
                      fontSize: "13px",
                      color: "#6B7280",
                      fontWeight: 500,
                      "&:hover": { backgroundColor: "F9FAFB" },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/evals/${project.id}/configuration`);
                    }}
                    startIcon={<Settings size={14} />}
                  >
                    Settings
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
        onClose={() => {
          setCreateModalOpen(false);
          setCreateStep(0);
          setNewProject({ name: "", description: "", useCase: "chatbot" });
        }}
        title={createStep === 0 ? "Create project" : "Select use case"}
        description={
          createStep === 0
            ? "Create a new project to organize your LLM evaluations"
            : "Choose the primary LLM use case for this project. You can change this later in Configuration."
        }
        onSubmit={async () => {
          if (createStep === 0) {
            if (!newProject.name.trim()) return;
            setCreateStep(1);
            return;
          }
          await handleCreateProject();
        }}
        submitButtonText={createStep === 0 ? "Next" : "Create project"}
        isSubmitting={loading || (createStep === 0 && !newProject.name)}
      >
        {createStep === 0 ? (
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
        ) : (
          <Box>
            <Box sx={{ fontSize: "12px", color: "#374151", mb: 1.5, fontWeight: 600 }}>
              LLM Use Case
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Card
                  onClick={() => setNewProject({ ...newProject, useCase: "chatbot" })}
                  sx={{
                    cursor: "pointer",
                    border: newProject.useCase === "chatbot" ? "2px solid #13715B" : "1px solid #E5E7EB",
                    backgroundColor: "#FFFFFF",
                    boxShadow: "none",
                    transition: "all 0.2s ease",
                    height: "100%",
                    "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)", transform: "translateY(-2px)" },
                  }}
                >
                  <CardContent>
                    <Box sx={{ mb: 1.5 }}><Bot size={24} color="#13715B" /></Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: "14px", mb: 0.5 }}>
                      Chatbots
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px" }}>
                      Multi-turn conversations, coherence, correctness, safety.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card
                  onClick={() => setNewProject({ ...newProject, useCase: "rag" })}
                  sx={{
                    cursor: "pointer",
                    border: newProject.useCase === "rag" ? "2px solid #13715B" : "1px solid #E5E7EB",
                    backgroundColor: "#FFFFFF",
                    boxShadow: "none",
                    transition: "all 0.2s ease",
                    height: "100%",
                    "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)", transform: "translateY(-2px)" },
                  }}
                >
                  <CardContent>
                    <Box sx={{ mb: 1.5 }}><FileSearch size={24} color="#13715B" /></Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: "14px", mb: 0.5 }}>
                      RAG
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px" }}>
                      Contextual recall/precision, relevancy, faithfulness.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card
                  onClick={() => setNewProject({ ...newProject, useCase: "agent" })}
                  sx={{
                    cursor: "pointer",
                    border: newProject.useCase === "agent" ? "2px solid #13715B" : "1px solid #E5E7EB",
                    backgroundColor: "#FFFFFF",
                    boxShadow: "none",
                    transition: "all 0.2s ease",
                    height: "100%",
                    "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)", transform: "translateY(-2px)" },
                  }}
                >
                  <CardContent>
                    <Box sx={{ mb: 1.5 }}><Workflow size={24} color="#13715B" /></Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: "14px", mb: 0.5 }}>
                      AI Agents
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px" }}>
                      Task completion, tool usage, safety, role adherence.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </StandardModal>

      {/* Inline Create Organization Modal */}
      <StandardModal
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
          const [{ orgs }, { org: current }] = await Promise.all([
            deepEvalOrgsService.getAllOrgs(),
            deepEvalOrgsService.getCurrentOrg(),
          ]);
          setOrgs(orgs);
          setCurrentOrgId(current?.id || org.id);
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
      </StandardModal>
    </Box>
  );
}
