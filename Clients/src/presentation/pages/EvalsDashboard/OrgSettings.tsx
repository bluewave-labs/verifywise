import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Stack, Typography, IconButton, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { Home, FlaskConical, Settings, Trash2, Plus } from "lucide-react";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import Field from "../../components/Inputs/Field";
import Select from "../../components/Inputs/Select";
import CustomizableButton from "../../components/Button/CustomizableButton";
import Alert from "../../components/Alert";

interface SavedKey {
  provider: string;
  apiKey: string;
  maskedKey: string;
}

const LLM_PROVIDERS = [
  { _id: "openai", name: "OpenAI" },
  { _id: "anthropic", name: "Anthropic" },
  { _id: "google", name: "Google (Gemini)" },
  { _id: "xai", name: "xAI" },
  { _id: "mistral", name: "Mistral" },
  { _id: "huggingface", name: "Hugging Face" },
];

export default function OrgSettings() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{
    variant: "success" | "error";
    body: string;
  } | null>(null);
  const [savedKeys, setSavedKeys] = useState<SavedKey[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [newApiKey, setNewApiKey] = useState<string>("");
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; provider: string | null }>({
    open: false,
    provider: null,
  });

  const breadcrumbs = [
    { label: "Dashboard", path: "/", icon: <Home size={14} strokeWidth={1.5} />, onClick: () => navigate("/") },
    { label: "LLM Evals", path: "/evals", icon: <FlaskConical size={14} strokeWidth={1.5} />, onClick: () => navigate("/evals") },
    { label: "Organization settings", icon: <Settings size={14} strokeWidth={1.5} /> },
  ];

  // Fetch saved keys on mount
  useEffect(() => {
    fetchSavedKeys();
  }, []);

  const fetchSavedKeys = async () => {
    try {
      const response = await fetch('/api/evaluation-llm-keys', {
        credentials: 'include',
      });
      const result = await response.json();

      if (result.success && result.data) {
        setSavedKeys(result.data.map((key: any) => ({
          provider: key.provider,
          apiKey: '', // Never sent to frontend
          maskedKey: key.maskedKey,
        })));
      }
    } catch (err) {
      console.error("Failed to fetch keys:", err);
      setAlert({
        variant: "error",
        body: "Failed to load API keys",
      });
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const maskApiKey = (key: string): string => {
    if (key.length <= 8) return "***";
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  const handleAddKey = async () => {
    if (!selectedProvider || !newApiKey.trim()) {
      setAlert({
        variant: "error",
        body: "Please select a provider and enter an API key",
      });
      setTimeout(() => setAlert(null), 5000);
      return;
    }

    // Check if provider already has a key
    if (savedKeys.some(k => k.provider === selectedProvider)) {
      setAlert({
        variant: "error",
        body: "This provider already has a key configured. Remove it first to add a new one.",
      });
      setTimeout(() => setAlert(null), 5000);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/evaluation-llm-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ provider: selectedProvider, apiKey: newApiKey }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to add API key');
      }

      // Refresh the list
      await fetchSavedKeys();
      setSelectedProvider("");
      setNewApiKey("");

      setAlert({
        variant: "success",
        body: "API key added successfully",
      });
      setTimeout(() => setAlert(null), 5000);
    } catch (err) {
      setAlert({
        variant: "error",
        body: err instanceof Error ? err.message : "Failed to add API key",
      });
      setTimeout(() => setAlert(null), 8000);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveKeyClick = (provider: string) => {
    setConfirmDelete({ open: true, provider });
  };

  const handleConfirmRemove = async () => {
    if (!confirmDelete.provider) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/evaluation-llm-keys/${confirmDelete.provider}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to remove API key');
      }

      // Refresh the list
      await fetchSavedKeys();

      setAlert({
        variant: "success",
        body: "API key removed successfully",
      });
      setTimeout(() => setAlert(null), 5000);
    } catch (err) {
      setAlert({
        variant: "error",
        body: err instanceof Error ? err.message : "Failed to remove API key",
      });
      setTimeout(() => setAlert(null), 8000);
    } finally {
      setSaving(false);
      setConfirmDelete({ open: false, provider: null });
    }
  };

  const handleCancelRemove = () => {
    setConfirmDelete({ open: false, provider: null });
  };

  const getProviderName = (providerId: string): string => {
    return LLM_PROVIDERS.find(p => p._id === providerId)?.name || providerId;
  };

  const availableProviders = LLM_PROVIDERS.filter(
    p => !savedKeys.some(k => k.provider === p._id)
  );

  return (
    <Box sx={{ p: 3 }}>
      {alert && <Alert variant={alert.variant} body={alert.body} />}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ userSelect: "none" }}>
          <PageBreadcrumbs items={breadcrumbs} />
        </Box>
        <PageHeader
          title="Organization settings"
          description="Configure LLM provider API keys for running evaluations across your organization"
        />
      </Box>

      <Stack spacing={4} sx={{ maxWidth: 700 }}>
        {/* Saved Keys List */}
        {savedKeys.length > 0 && (
          <Box>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 2,
              }}
            >
              Configured LLM providers
            </Typography>
            <Stack spacing={1.5}>
              {savedKeys.map((key) => (
                <Box
                  key={key.provider}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: theme.palette.text.primary,
                        mb: 0.5,
                      }}
                    >
                      {getProviderName(key.provider)}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontFamily: "monospace",
                        color: theme.palette.text.secondary,
                      }}
                    >
                      {key.maskedKey}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveKeyClick(key.provider)}
                    disabled={saving}
                    sx={{
                      color: theme.palette.error.main,
                      "&:hover": {
                        backgroundColor: theme.palette.error.light + "20",
                      },
                    }}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Add New Key Section */}
        <Box>
          <Stack spacing={2}>
            <Select
              label="Select provider"
              placeholder="Select a provider from the list"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as string)}
              items={availableProviders}
              disabled={availableProviders.length === 0}
            />
            <Field
              label="API key"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              placeholder="Enter your API key..."
              type="password"
              disabled={!selectedProvider}
            />
            <Box sx={{ pt: 3 }}>
              <CustomizableButton
                variant="contained"
                text="Add API key"
                loading={saving}
                onClick={handleAddKey}
                isDisabled={!selectedProvider || !newApiKey.trim()}
                startIcon={<Plus size={16} />}
                sx={{
                  backgroundColor: "#13715B",
                  border: "1px solid #13715B",
                  "&:hover": { backgroundColor: "#0f5a47" },
                  "&:disabled": {
                    backgroundColor: theme.palette.action.disabledBackground,
                    color: theme.palette.action.disabled,
                  },
                  textTransform: "none",
                }}
              />
            </Box>
          </Stack>

          {availableProviders.length === 0 && (
            <Typography
              sx={{
                fontSize: 13,
                color: theme.palette.text.secondary,
                mt: 2,
                fontStyle: "italic",
              }}
            >
              All available providers have been configured. Remove a key to add a different one.
            </Typography>
          )}
        </Box>
      </Stack>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDelete.open}
        onClose={handleCancelRemove}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: 16, fontWeight: 600 }}>
          Remove API key
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: theme.palette.text.secondary }}>
            Are you sure you want to remove the API key for{" "}
            <strong>{confirmDelete.provider ? getProviderName(confirmDelete.provider) : ""}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleCancelRemove}
            sx={{
              textTransform: "none",
              color: theme.palette.text.secondary,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRemove}
            variant="contained"
            color="error"
            disabled={saving}
            sx={{
              textTransform: "none",
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

