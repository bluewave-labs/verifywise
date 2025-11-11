import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Stack, Card, CardContent, Typography, Grid } from "@mui/material";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import CustomizableButton from "../../components/Button/CustomizableButton";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";
import type { DeepEvalProject } from "./types";
import { Bot, FileSearch, Workflow } from "lucide-react";

export default function ProjectConfiguration() {
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
    { label: "LLM Evals Dashboard", onClick: () => navigate("/evals") },
    { label: project?.name || "Project", onClick: () => navigate(`/evals/${projectId}#overview`) },
    { label: "Configuration" },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 2, userSelect: "none" }}>
        <PageBreadcrumbs items={breadcrumbs} />
        <PageHeader title="Project configuration" />
      </Box>

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

