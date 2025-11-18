import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Stack, Card, CardContent, Typography, Grid, MenuItem, Select, FormControl, IconButton, Chip } from "@mui/material";
import { Trash2, Plus, ChevronDown } from "lucide-react";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import CustomizableButton from "../../components/Button/CustomizableButton";
import Field from "../../components/Inputs/Field";
import Alert from "../../components/Alert";
import ModalStandard from "../../components/Modals/StandardModal";
import DualButtonModal from "../../components/Dialogs/DualButtonModal";
import { deepEvalProjectsService } from "../../../infrastructure/api/deepEvalProjectsService";
import { evaluationLlmApiKeysService, type LLMProvider, type LLMApiKey } from "../../../infrastructure/api/evaluationLlmApiKeysService";
import type { DeepEvalProject } from "./types";
import { Bot, FileSearch, Home, FlaskConical } from "lucide-react";

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
  const [initialState, setInitialState] = useState<{
    useCase: "chatbot" | "rag" | "agent";
    defaultDataset: "chatbot" | "rag" | "agent" | "safety";
  } | null>(null);

  // API Keys management
  const [storedKeys, setStoredKeys] = useState<LLMApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider | "">("");
  const [newApiKey, setNewApiKey] = useState("");
  const [addKeyModalOpen, setAddKeyModalOpen] = useState(false);
  const [deleteKeyModalOpen, setDeleteKeyModalOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<LLMProvider | null>(null);
  const [alert, setAlert] = useState<{ variant: "success" | "error"; body: string } | null>(null);
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [isDeletingKey, setIsDeletingKey] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!projectId) return;
      try {
        const { project } = await deepEvalProjectsService.getProject(projectId);
        setProject(project);
        const loadedState = {
          useCase: (project.useCase as "chatbot" | "rag" | "agent") || "chatbot",
          defaultDataset:
            (project.defaultDataset as "chatbot" | "rag" | "agent" | "safety") ||
            ((project.useCase as "chatbot" | "rag" | "agent") || "chatbot"),
        };
        setState(loadedState);
        setInitialState(loadedState);
      } catch (e) {
        console.error("Failed to load project", e);
      }
    };
    load();
  }, [projectId]);

  // Load API keys from database
  useEffect(() => {
    const loadKeys = async () => {
      try {
        setLoadingKeys(true);
        const keys = await evaluationLlmApiKeysService.getAllKeys();
        setStoredKeys(keys);
      } catch (error) {
        console.error("Failed to load API keys:", error);
      } finally {
        setLoadingKeys(false);
      }
    };
    loadKeys();
  }, []);

  // Check if there are any changes
  const hasChanges = initialState && (
    state.useCase !== initialState.useCase ||
    state.defaultDataset !== initialState.defaultDataset
  );

  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      await deepEvalProjectsService.updateProject(projectId, {
        useCase: state.useCase,
        defaultDataset: state.defaultDataset,
      });
      // Update initial state to current state after successful save
      setInitialState({ ...state });
      setAlert({ variant: "success", body: "Configuration saved successfully" });
      setTimeout(() => setAlert(null), 3000);
    } catch (e) {
      console.error("Failed to save configuration", e);
      setAlert({ variant: "error", body: "Failed to save configuration" });
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleAddKey = async () => {
    if (!selectedProvider || !newApiKey.trim()) {
      setAlert({ variant: "error", body: "Please select a provider and enter an API key" });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    try {
      setIsAddingKey(true);
      await evaluationLlmApiKeysService.addKey({
        provider: selectedProvider as LLMProvider,
        apiKey: newApiKey.trim(),
      });

      // Reload keys
      const keys = await evaluationLlmApiKeysService.getAllKeys();
      setStoredKeys(keys);

      // Reset form and close modal
      setSelectedProvider("");
      setNewApiKey("");
      setAddKeyModalOpen(false);

      setAlert({ variant: "success", body: `${selectedProvider} API key added successfully` });
      setTimeout(() => setAlert(null), 3000);
    } catch (error: any) {
      console.error("Failed to add API key:", error);
      setAlert({
        variant: "error",
        body: error.response?.data?.message || "Failed to add API key"
      });
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setIsAddingKey(false);
    }
  };

  const handleCloseModal = () => {
    setAddKeyModalOpen(false);
    setSelectedProvider("");
    setNewApiKey("");
  };

  const handleDeleteKeyClick = (provider: LLMProvider) => {
    setKeyToDelete(provider);
    setDeleteKeyModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteKeyModalOpen(false);
    setKeyToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!keyToDelete) return;

    try {
      setIsDeletingKey(true);
      await evaluationLlmApiKeysService.deleteKey(keyToDelete);

      // Reload keys
      const keys = await evaluationLlmApiKeysService.getAllKeys();
      setStoredKeys(keys);

      setAlert({ variant: "success", body: `${keyToDelete} API key deleted` });
      setTimeout(() => setAlert(null), 3000);

      setDeleteKeyModalOpen(false);
      setKeyToDelete(null);
    } catch (error) {
      console.error("Failed to delete API key:", error);
      setAlert({ variant: "error", body: "Failed to delete API key" });
      setTimeout(() => setAlert(null), 5000);
    } finally {
      setIsDeletingKey(false);
    }
  };

  const providers: { value: LLMProvider; label: string }[] = [
    { value: "openai", label: "OpenAI" },
    { value: "anthropic", label: "Anthropic" },
    { value: "google", label: "Google (Gemini)" },
    { value: "xai", label: "xAI" },
    { value: "mistral", label: "Mistral" },
    { value: "huggingface", label: "Hugging Face" },
  ];

  const availableProviders = providers.filter(
    (p) => !storedKeys.some((k) => k.provider === p.value)
  );

  const breadcrumbs = [
    { label: "Dashboard", path: "/", icon: <Home size={14} strokeWidth={1.5} />, onClick: () => navigate("/") },
    { label: "LLM Evals", path: "/evals", icon: <FlaskConical size={14} strokeWidth={1.5} />, onClick: () => navigate("/evals") },
    { label: project?.name || "Project", onClick: () => navigate(`/evals/${projectId}#overview`) },
    { label: "Configuration" },
  ];

  return (
    <Box sx={{ py: 3 }}>
      {alert && <Alert variant={alert.variant} body={alert.body} />}

      {!hideHeader && (
        <Box sx={{ mb: 2 }}>
          <Box>
            <PageBreadcrumbs items={breadcrumbs} />
          </Box>
          <PageHeader title="Project configuration" />
        </Box>
      )}

      <Stack spacing={4}>
        <Box>
          <Box sx={{ fontSize: "13px", color: "#374151", fontWeight: 700, mb: 1, mt: "16px" }}>
            LLM Use Case
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: "13px" }}>
            Select the type of LLM application you want to evaluate
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={4}>
              <Card
                onClick={() => setState((s) => ({ ...s, useCase: "rag", defaultDataset: "rag" }))}
                sx={{
                  border: "1px solid",
                  borderColor: state.useCase === "rag" ? "#13715B" : "#E5E7EB",
                  backgroundColor: state.useCase === "rag" ? "#F7F9F8" : "#FFFFFF",
                  borderRadius: 2,
                  boxShadow: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": { borderColor: "#13715B", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" },
                }}
              >
                <CardContent sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                  <Box sx={{ mt: 0.25 }}>
                    <FileSearch size={22} color="#13715B" strokeWidth={1.5} />
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
                  border: "1px solid",
                  borderColor: state.useCase === "chatbot" ? "#13715B" : "#E5E7EB",
                  backgroundColor: state.useCase === "chatbot" ? "#F7F9F8" : "#FFFFFF",
                  borderRadius: 2,
                  boxShadow: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": { borderColor: "#13715B", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" },
                }}
              >
                <CardContent sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                  <Box sx={{ mt: 0.25 }}>
                    <Bot size={22} color="#13715B" strokeWidth={1.5} />
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
          <Box sx={{ fontSize: "13px", color: "#374151", fontWeight: 700, mb: 1, mt: "16px" }}>
            LLM API Keys
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontSize: "13px" }}>
            These keys are encrypted and stored securely in the database. They will be used for running evaluations.{" "}
            {availableProviders.length > 0 && (
              <Typography
                component="span"
                onClick={() => setAddKeyModalOpen(true)}
                sx={{
                  color: "#13715B",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "13px",
                  textDecoration: "underline",
                  "&:hover": {
                    color: "#0f5a47",
                  },
                }}
              >
                Add API key
              </Typography>
            )}
          </Typography>

          {/* Existing Keys */}
          {loadingKeys ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Loading API keys...
            </Typography>
          ) : storedKeys.length > 0 ? (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {storedKeys.map((key) => (
                <Grid item xs={12} key={key.provider}>
                  <Card sx={{ border: "1px solid #E5E7EB", boxShadow: "none", width: "50%", height: "34px" }}>
                    <CardContent sx={{ px: 2, py: 0, height: "100%", "&:last-child": { pb: 0 } }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontSize: "13px", fontWeight: 600 }}>
                            {providers.find(p => p.value === key.provider)?.label || key.provider}
                          </Typography>
                          <Chip
                            label="ACTIVE"
                            size="small"
                            sx={{
                              height: "20px",
                              fontSize: "10px",
                              backgroundColor: "#D1FAE5",
                              color: "#065F46",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              borderRadius: "4px",
                              letterSpacing: "0.5px",
                              "& .MuiChip-label": {
                                px: 1,
                              },
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "12px",
                              color: "#6B7280",
                              fontFamily: "monospace",
                            }}
                          >
                            ••••••••
                          </Typography>
                          <Typography variant="caption" sx={{ fontSize: "11px", color: "#9CA3AF", whiteSpace: "nowrap" }}>
                            Added {new Date(key.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteKeyClick(key.provider as LLMProvider)}
                          sx={{
                            color: "#DC2626",
                            "&:hover": { backgroundColor: "rgba(220, 38, 38, 0.1)" },
                            flexShrink: 0,
                            ml: "16px",
                          }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: "12px", fontStyle: "italic" }}>
              No API keys configured yet.
            </Typography>
          )}
        </Box>

        {/* Default dataset preset selection is hidden; it auto-syncs with the chosen use case. */}

        <Box>
          <CustomizableButton
            variant="contained"
            text="Save changes"
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
            sx={{
              backgroundColor: "#13715B",
              border: "1px solid #13715B",
              "&:hover": { backgroundColor: "#0f5a47" },
              textTransform: "none",
            }}
          />
        </Box>
      </Stack>

      {/* Add API Key Modal */}
      <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); handleAddKey(); }}>
        <ModalStandard
          isOpen={addKeyModalOpen}
          onClose={handleCloseModal}
          title="Add API key"
          description="Add a new LLM provider API key for running evaluations"
          onSubmit={handleAddKey}
          submitButtonText="Add key"
          isSubmitting={isAddingKey}
        >
          <Stack spacing={6}>
            <Box className="select-wrapper">
              <Stack gap={1}>
                <Typography
                  component="p"
                  variant="body1"
                  color="text.secondary"
                  fontWeight={500}
                  fontSize="13px"
                  sx={{
                    margin: 0,
                    height: "22px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  Provider
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value as LLMProvider)}
                    displayEmpty
                    IconComponent={() => <ChevronDown size={14} style={{ marginRight: 8 }} />}
                    sx={{
                      fontSize: "13px",
                      height: "40px",
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#E5E7EB",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#D1D5DB",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#13715B",
                        borderWidth: "1px",
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      <em>Select provider</em>
                    </MenuItem>
                    {availableProviders.map((provider) => (
                      <MenuItem key={provider.value} value={provider.value} sx={{ fontSize: "13px" }}>
                        {provider.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            <Field
              label="API Key"
              type="text"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              placeholder="Enter your API key"
              autoComplete="off"
              inputProps={{
                autoComplete: "off",
                "data-form-type": "other",
                "data-lpignore": "true",
                "data-1p-ignore": "true",
              }}
            />
          </Stack>
        </ModalStandard>
      </form>

      {/* Delete API Key Confirmation Modal */}
      <DualButtonModal
        isOpen={deleteKeyModalOpen}
        title="Confirm delete"
        body={
          <Typography fontSize={13}>
            Are you sure you want to delete the {keyToDelete ? providers.find(p => p.value === keyToDelete)?.label : ''} API key? This action cannot be undone.
          </Typography>
        }
        cancelText="Cancel"
        proceedText={isDeletingKey ? "Deleting..." : "Delete"}
        onCancel={handleCloseDeleteModal}
        onProceed={handleConfirmDelete}
        proceedButtonColor="error"
        proceedButtonVariant="contained"
        TitleFontSize={0}
      />
    </Box>
  );
}

