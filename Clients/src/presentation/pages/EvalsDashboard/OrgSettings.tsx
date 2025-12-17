import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Stack, Typography, IconButton, useTheme, Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { Home, FlaskConical, Settings, Trash2, Plus } from "lucide-react";
import PageBreadcrumbs from "../../components/Breadcrumbs/PageBreadcrumbs";
import PageHeader from "../../components/Layout/PageHeader";
import HelperIcon from "../../components/HelperIcon";
import Field from "../../components/Inputs/Field";
import Select from "../../components/Inputs/Select";
import CustomizableButton from "../../components/Button/CustomizableButton";
import Alert from "../../components/Alert";
import CustomAxios from "../../../infrastructure/api/customAxios";

interface SavedKey {
  provider: string;
  apiKey: string;
  maskedKey: string;
}

const LLM_PROVIDERS = [
  { _id: "openrouter", name: "OpenRouter" },
  { _id: "openai", name: "OpenAI" },
  { _id: "anthropic", name: "Anthropic" },
  { _id: "google", name: "Google (Gemini)" },
  { _id: "xai", name: "xAI" },
  { _id: "mistral", name: "Mistral" },
  { _id: "huggingface", name: "Hugging Face" },
];

/**
 * API key format patterns for validation
 */
const API_KEY_PATTERNS: Record<string, { pattern: RegExp; example: string; description: string }> = {
  openai: {
    pattern: /^sk-(proj-)?[a-zA-Z0-9_-]{20,}$/,
    example: 'sk-... or sk-proj-...',
    description: 'OpenAI keys start with "sk-" or "sk-proj-"',
  },
  anthropic: {
    pattern: /^sk-ant-(api\d+-)?[a-zA-Z0-9_-]{20,}$/,
    example: 'sk-ant-api03-...',
    description: 'Anthropic keys start with "sk-ant-" (typically "sk-ant-api03-")',
  },
  google: {
    pattern: /^AIza[a-zA-Z0-9_-]{35,}$/,
    example: 'AIza...',
    description: 'Google API keys start with "AIza"',
  },
  xai: {
    pattern: /^xai-[a-zA-Z0-9_-]{20,}$/,
    example: 'xai-...',
    description: 'xAI keys start with "xai-"',
  },
  mistral: {
    pattern: /^[a-zA-Z0-9]{32,}$/,
    example: '32+ character alphanumeric string',
    description: 'Mistral keys are alphanumeric strings (32+ characters)',
  },
  huggingface: {
    pattern: /^hf_[a-zA-Z0-9]{20,}$/,
    example: 'hf_...',
    description: 'Hugging Face keys start with "hf_"',
  },
  openrouter: {
    pattern: /^sk-or-v1-[a-zA-Z0-9]{40,}$/,
    example: 'sk-or-v1-...',
    description: 'OpenRouter keys start with "sk-or-v1-"',
  },
};

/**
 * Validate API key format for a specific provider
 * @returns null if valid, or error message if invalid
 */
function validateApiKeyFormat(provider: string, apiKey: string): string | null {
  const config = API_KEY_PATTERNS[provider];
  if (!config) {
    return null; // Unknown provider, skip format validation
  }

  const trimmedKey = apiKey.trim();
  
  if (!config.pattern.test(trimmedKey)) {
    return `Invalid format. ${config.description}`;
  }

  return null; // Valid
}

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
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
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
      const response = await CustomAxios.get('/evaluation-llm-keys');

      if (response.data.success && response.data.data) {
        setSavedKeys(response.data.data.map((key: any) => ({
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

  // Validate API key when it changes
  const handleApiKeyChange = (value: string) => {
    setNewApiKey(value);
    
    // Clear error if field is empty
    if (!value.trim()) {
      setApiKeyError(null);
      return;
    }
    
    // Validate if provider is selected
    if (selectedProvider) {
      const error = validateApiKeyFormat(selectedProvider, value);
      setApiKeyError(error);
    }
  };

  // Re-validate when provider changes
  const handleProviderChange = (value: string) => {
    setSelectedProvider(value);
    
    // Re-validate existing API key with new provider
    if (newApiKey.trim() && value) {
      const error = validateApiKeyFormat(value, newApiKey);
      setApiKeyError(error);
    } else {
      setApiKeyError(null);
    }
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

    // Validate API key format
    const formatError = validateApiKeyFormat(selectedProvider, newApiKey);
    if (formatError) {
      setApiKeyError(formatError);
      setAlert({
        variant: "error",
        body: formatError,
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
      const response = await CustomAxios.post('/evaluation-llm-keys', {
        provider: selectedProvider,
        apiKey: newApiKey,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to add API key');
      }

      // Refresh the list
      await fetchSavedKeys();
      setSelectedProvider("");
      setNewApiKey("");
      setApiKeyError(null);

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
      const response = await CustomAxios.delete(`/evaluation-llm-keys/${confirmDelete.provider}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to remove API key');
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
        <Box>
          <PageBreadcrumbs items={breadcrumbs} />
        </Box>
        <PageHeader
          title="Organization settings"
          description="Configure LLM provider API keys for running evaluations across your organization"
          rightContent={<HelperIcon articlePath="llm-evals/configuration" />}
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
              id="provider-select"
              label="Select provider"
              placeholder="Select a provider from the list"
              value={selectedProvider}
              onChange={(e) => handleProviderChange(e.target.value as string)}
              items={availableProviders}
              disabled={availableProviders.length === 0}
            />
            <Box>
              <Field
                label="API key"
                value={newApiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder={selectedProvider ? `Enter your ${LLM_PROVIDERS.find(p => p._id === selectedProvider)?.name || ''} API key...` : "Enter your API key..."}
                type="password"
                autoComplete="off"
                disabled={!selectedProvider}
                error={apiKeyError || ""}
              />
              {selectedProvider && !apiKeyError && newApiKey.trim() && (
                <Typography
                  sx={{
                    fontSize: 11,
                    color: "#059669",
                    mt: 0.5,
                    ml: 0.5,
                  }}
                >
                  ✓ Key format looks valid
                </Typography>
              )}
              {selectedProvider && !newApiKey.trim() && API_KEY_PATTERNS[selectedProvider] && (
                <Typography
                  sx={{
                    fontSize: 11,
                    color: theme.palette.text.secondary,
                    mt: 0.5,
                    ml: 0.5,
                  }}
                >
                  Expected format: {API_KEY_PATTERNS[selectedProvider]?.example || 'API key'}
                </Typography>
              )}
            </Box>
            <Box sx={{ pt: 3 }}>
              <CustomizableButton
                variant="contained"
                text="Add API key"
                loading={saving}
                onClick={handleAddKey}
                isDisabled={!selectedProvider || !newApiKey.trim() || !!apiKeyError}
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

