import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Stack, Card, CardContent, Typography, Grid } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import CustomizableButton from "../../components/Button/CustomizableButton";
import Field from "../../components/Inputs/Field";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";
import type { DeepEvalProject } from "./types";
import { Bot, FileSearch, Workflow, Home, FlaskConical } from "lucide-react";

type ProjectConfigurationProps = { hideHeader?: boolean };

export default function ProjectConfiguration({ hideHeader = false }: ProjectConfigurationProps) {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<DeepEvalProject | null>(null);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState<{
    useCase: "chatbot" | "rag" | "agent";
    defaultDataset: "chatbot" | "rag" | "agent" | "safety";
  }>({
    useCase: "chatbot",
    defaultDataset: "chatbot",
  });
  const [apiKeys, setApiKeys] = useState<{
    openai?: string;
    anthropic?: string;
    gemini?: string;
    xai?: string;
    mistral?: string;
    huggingface?: string;
  }>({});

  useEffect(() => {
    const load = async () => {
      if (!projectId) return;
      try {
        const { project } = await deepEvalProjectsService.getProject(projectId);
        setProject(project);
        setState({
          useCase: (project.useCase as "chatbot" | "rag" | "agent") || "chatbot",
          defaultDataset:
            (project.defaultDataset as "chatbot" | "rag" | "agent" | "safety") ||
            ((project.useCase as "chatbot" | "rag" | "agent") || "chatbot"),
        });
        // Load API keys from local storage (project-level)
        try {
          const raw = localStorage.getItem(`deepeval_project_api_keys_${projectId}`);
          if (raw) setApiKeys(JSON.parse(raw));
        } catch {
          // ignore
        }
      } catch (e) {
        console.error("Failed to load project", e);
      }
    };
    load();
  }, [projectId]);

  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      // Persist API keys locally for now (used during experiment runs)
      try {
        localStorage.setItem(`deepeval_project_api_keys_${projectId}`, JSON.stringify(apiKeys || {}));
      } catch {
        // ignore storage errors
      }
      await deepEvalProjectsService.updateProject(projectId, {
        useCase: state.useCase,
        defaultDataset: state.defaultDataset,
      });
      navigate(`/evals/${projectId}#overview`);
    } catch (e) {
      console.error("Failed to save configuration", e);
      alert("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [
    { label: "Dashboard", path: "/", icon: <Home size={14} strokeWidth={1.5} />, onClick: () => navigate("/") },
    { label: "LLM Evals", path: "/evals", icon: <FlaskConical size={14} strokeWidth={1.5} />, onClick: () => navigate("/evals") },
    { label: project?.name || "Project", onClick: () => navigate(`/evals/${projectId}#overview`) },
    { label: "Configuration" },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {!hideHeader && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ userSelect: "none" }}>
            <PageBreadcrumbs items={breadcrumbs} />
          </Box>
          <PageHeader title="Project configuration" />
        </Box>
      )}

      <Stack spacing={4}>
        <Box>
          <Box sx={{ fontSize: "13px", color: "#374151", fontWeight: 700, mb: 1 }}>
            LLM Use Case
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Card
                onClick={() => setState((s) => ({ ...s, useCase: "agent", defaultDataset: "agent" }))}
                sx={{
                  border: state.useCase === "agent" ? "2px solid #13715B" : "1px solid #E5E7EB",
                  borderRadius: 2,
                  boxShadow: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": { borderColor: "#13715B", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" },
                }}
              >
                <CardContent sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                  <Box sx={{ mt: 0.25 }}>
                    <Workflow size={22} color="#13715B" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "14px", mb: 0.5 }}>
                      AI Agents
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12.5px", lineHeight: 1.6 }}>
                      Evaluate agentic workflows and end-to-end task completion, including tool usage and planning.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card
                onClick={() => setState((s) => ({ ...s, useCase: "rag", defaultDataset: "rag" }))}
                sx={{
                  border: state.useCase === "rag" ? "2px solid #13715B" : "1px solid #E5E7EB",
                  borderRadius: 2,
                  boxShadow: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": { borderColor: "#13715B", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" },
                }}
              >
                <CardContent sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                  <Box sx={{ mt: 0.25 }}>
                    <FileSearch size={22} color="#13715B" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "14px", mb: 0.5 }}>
                      RAG
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12.5px", lineHeight: 1.6 }}>
                      Evaluate retrieval-augmented generation, including recall, precision, relevancy and faithfulness.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card
                onClick={() => setState((s) => ({ ...s, useCase: "chatbot", defaultDataset: "chatbot" }))}
                sx={{
                  border: state.useCase === "chatbot" ? "2px solid #13715B" : "1px solid #E5E7EB",
                  borderRadius: 2,
                  boxShadow: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": { borderColor: "#13715B", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" },
                }}
              >
                <CardContent sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                  <Box sx={{ mt: 0.25 }}>
                    <Bot size={22} color="#13715B" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "14px", mb: 0.5 }}>
                      Chatbots
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12.5px", lineHeight: 1.6 }}>
                      Evaluate single and multi-turn conversational experiences for coherence, correctness and safety.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* API Keys Section */}
        <Box>
          <Box sx={{ fontSize: "13px", color: "#374151", fontWeight: 700, mb: 1 }}>
            API Keys (optional)
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: "13px" }}>
            These keys are used at run-time for experiments in this project. They are stored locally in your browser.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Field
                label="OpenAI API Key"
                type="password"
                value={apiKeys.openai || ""}
                onChange={(e) => setApiKeys((k) => ({ ...k, openai: e.target.value }))}
                placeholder="sk-..."
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Field
                label="Anthropic API Key"
                type="password"
                value={apiKeys.anthropic || ""}
                onChange={(e) => setApiKeys((k) => ({ ...k, anthropic: e.target.value }))}
                placeholder="anthropic-key"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Field
                label="Google (Gemini) API Key"
                type="password"
                value={apiKeys.gemini || ""}
                onChange={(e) => setApiKeys((k) => ({ ...k, gemini: e.target.value }))}
                placeholder="AIza..."
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Field
                label="xAI API Key"
                type="password"
                value={apiKeys.xai || ""}
                onChange={(e) => setApiKeys((k) => ({ ...k, xai: e.target.value }))}
                placeholder="xai-key"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Field
                label="Mistral API Key"
                type="password"
                value={apiKeys.mistral || ""}
                onChange={(e) => setApiKeys((k) => ({ ...k, mistral: e.target.value }))}
                placeholder="mistral-key"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Field
                label="Hugging Face Access Token"
                type="password"
                value={apiKeys.huggingface || ""}
                onChange={(e) => setApiKeys((k) => ({ ...k, huggingface: e.target.value }))}
                placeholder="hf_..."
              />
            </Grid>
          </Grid>
        </Box>

        {/* Default dataset preset selection is hidden; it auto-syncs with the chosen use case. */}

        <Box>
          <CustomizableButton
            variant="contained"
            text="Save changes"
            onClick={handleSave}
            loading={saving}
            sx={{
              backgroundColor: "#13715B",
              border: "1px solid #13715B",
              "&:hover": { backgroundColor: "#0f5a47" },
              textTransform: "none",
            }}
          />
        </Box>
      </Stack>
    </Box>
  );
}

