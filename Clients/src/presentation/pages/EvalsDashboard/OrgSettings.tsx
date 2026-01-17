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
import { getAllLlmApiKeys, addLlmApiKey, deleteLlmApiKey } from "../../../application/repository/deepEval.repository";

interface SavedKey {
  provider: string;
  apiKey: string;
  maskedKey: string;
}

const LLM_PROVIDERS = [
  { _id: "openrouter", name: "OpenRouter" },
  { _id: "openai", name: "OpenAI" },
  { _id: "anthropic", name: "Anthropic" },
  { _id: "google", name: "Gemini" },
  { _id: "xai", name: "xAI" },
  { _id: "mistral", name: "Mistral" },
  { _id: "huggingface", name: "Hugging Face" },
  { _id: "bedrock", name: "AWS Bedrock" },
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
  bedrock: {
    pattern: /^(ABSK|bedrock-api-key-)[A-Za-z0-9+/=_-]{20,}$/,
    example: 'ABSK... or bedrock-api-key-...',
    description: 'Bedrock API keys start with "ABSK" (long-term) or "bedrock-api-key-" (short-term)',
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
  // AWS Bedrock specific fields
  const [bedrockAuthMethod, setBedrockAuthMethod] = useState<"iam_role" | "api_key" | "access_keys">("iam_role");
  const [awsRegion, setAwsRegion] = useState<string>("us-east-1");
  const [awsRoleArn, setAwsRoleArn] = useState("");
  const [awsExternalId, setAwsExternalId] = useState("");
  const [awsAccessKeyId, setAwsAccessKeyId] = useState("");
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState("");
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
      const keys = await getAllLlmApiKeys();
      setSavedKeys(keys.map((key: { provider: string; maskedKey: string }) => ({
        provider: key.provider,
        apiKey: '', // Never sent to frontend
        maskedKey: key.maskedKey,
      })));
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

    // Reset AWS settings when switching away from bedrock
    if (value !== "bedrock") {
      setAwsRegion("us-east-1");
      setBedrockAuthMethod("iam_role");
      setAwsRoleArn("");
      setAwsExternalId("");
      setAwsAccessKeyId("");
      setAwsSecretAccessKey("");
    }

    // Re-validate existing API key with new provider
    if (newApiKey.trim() && value) {
      const error = validateApiKeyFormat(value, newApiKey);
      setApiKeyError(error);
    } else {
      setApiKeyError(null);
    }
  };

  const handleAddKey = async () => {
    if (!selectedProvider) {
      setAlert({ variant: "error", body: "Please select a provider" });
      setTimeout(() => setAlert(null), 5000);
      return;
    }

    // Bedrock-specific validation
    if (selectedProvider === "bedrock") {
      if (bedrockAuthMethod === "iam_role" && !awsRoleArn.trim()) {
        setAlert({ variant: "error", body: "Please enter the IAM Role ARN" });
        setTimeout(() => setAlert(null), 5000);
        return;
      }
      if (bedrockAuthMethod === "api_key" && !newApiKey.trim()) {
        setAlert({ variant: "error", body: "Please enter the Bedrock API Key" });
        setTimeout(() => setAlert(null), 5000);
        return;
      }
      if (bedrockAuthMethod === "access_keys" && (!awsAccessKeyId.trim() || !awsSecretAccessKey.trim())) {
        setAlert({ variant: "error", body: "Please enter both AWS Access Key ID and Secret Access Key" });
        setTimeout(() => setAlert(null), 5000);
        return;
      }
    } else if (!newApiKey.trim()) {
      setAlert({ variant: "error", body: "Please enter an API key" });
      setTimeout(() => setAlert(null), 5000);
      return;
    }

    // Validate API key format for non-Bedrock IAM/access_keys methods
    if (selectedProvider !== "bedrock" || bedrockAuthMethod === "api_key") {
      if (newApiKey.trim()) {
        const formatError = validateApiKeyFormat(selectedProvider, newApiKey);
        if (formatError) {
          setApiKeyError(formatError);
          setAlert({ variant: "error", body: formatError });
          setTimeout(() => setAlert(null), 5000);
          return;
        }
      }
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
      const keyPayload: Parameters<typeof addLlmApiKey>[0] = {
        provider: selectedProvider as Parameters<typeof addLlmApiKey>[0]["provider"],
        apiKey: selectedProvider === "bedrock"
          ? (bedrockAuthMethod === "api_key" ? newApiKey : "BEDROCK_AUTH")
          : newApiKey,
      };

      // Add Bedrock-specific fields
      if (selectedProvider === "bedrock") {
        keyPayload.region = awsRegion;
        keyPayload.authMethod = bedrockAuthMethod;
        if (bedrockAuthMethod === "iam_role") {
          keyPayload.roleArn = awsRoleArn;
          keyPayload.externalId = awsExternalId || undefined;
        } else if (bedrockAuthMethod === "access_keys") {
          keyPayload.accessKeyId = awsAccessKeyId;
          keyPayload.secretAccessKey = awsSecretAccessKey;
        }
      }

      await addLlmApiKey(keyPayload);

      // Refresh the list
      await fetchSavedKeys();
      setSelectedProvider("");
      setNewApiKey("");
      setApiKeyError(null);
      setAwsRegion("us-east-1");
      setBedrockAuthMethod("iam_role");
      setAwsRoleArn("");
      setAwsExternalId("");
      setAwsAccessKeyId("");
      setAwsSecretAccessKey("");

      const successMessages: Record<string, string> = {
        iam_role: "AWS Bedrock configured with IAM Role",
        api_key: "AWS Bedrock API key saved successfully",
        access_keys: "AWS Bedrock configured with Access Keys",
      };
      setAlert({
        variant: "success",
        body: selectedProvider === "bedrock" ? successMessages[bedrockAuthMethod] : "API key added successfully",
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
      await deleteLlmApiKey(confirmDelete.provider as Parameters<typeof deleteLlmApiKey>[0]);

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
              AI Providers
            </Typography>
            <Stack spacing="8px">
              {savedKeys.map((key) => (
                <Box
                  key={key.provider}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: "8px",
                    gap: "8px",
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: "4px",
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
            {/* API Key - Non-Bedrock providers */}
            {selectedProvider && selectedProvider !== "bedrock" && (
              <Box>
                <Field
                  label="API key"
                  value={newApiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder={`Enter your ${LLM_PROVIDERS.find(p => p._id === selectedProvider)?.name || ''} API key...`}
                  type="password"
                  autoComplete="new-password"
                  error={apiKeyError || ""}
                />
                {!apiKeyError && newApiKey.trim() && (
                  <Typography sx={{ fontSize: 11, color: "#059669", mt: 0.5, ml: 0.5 }}>
                    Key format looks valid
                  </Typography>
                )}
                {!newApiKey.trim() && API_KEY_PATTERNS[selectedProvider] && (
                  <Typography sx={{ fontSize: 11, color: theme.palette.text.secondary, mt: 0.5, ml: 0.5 }}>
                    Expected format: {API_KEY_PATTERNS[selectedProvider]?.example || 'API key'}
                  </Typography>
                )}
              </Box>
            )}

            {/* AWS Bedrock Configuration */}
            {selectedProvider === "bedrock" && (
              <Box>
                {/* Authentication Method Selection */}
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.text.primary, mb: 1.5 }}>
                  Authentication method
                </Typography>
                <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                  {/* Option 1: IAM Role */}
                  <Box
                    onClick={() => {
                      setBedrockAuthMethod("iam_role");
                      setNewApiKey("");
                      setApiKeyError(null);
                    }}
                    sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, cursor: "pointer" }}
                  >
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: bedrockAuthMethod === "iam_role" ? "4px solid #13715B" : `1.5px solid ${theme.palette.text.disabled}`,
                        backgroundColor: theme.palette.background.paper,
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    />
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: bedrockAuthMethod === "iam_role" ? "#13715B" : theme.palette.text.primary }}>
                          IAM Role
                        </Typography>
                        <Box sx={{ fontSize: 10, fontWeight: 500, color: "#059669", bgcolor: "#DCFCE7", px: 0.5, py: 0.125, borderRadius: "3px" }}>
                          Recommended
                        </Box>
                      </Box>
                      <Typography sx={{ fontSize: 11, color: theme.palette.text.secondary, mt: 0.25 }}>
                        Most secure, no long-lived credentials
                      </Typography>
                    </Box>
                  </Box>

                  {/* Option 2: Bedrock API Key */}
                  <Box
                    onClick={() => {
                      setBedrockAuthMethod("api_key");
                      setNewApiKey("");
                      setApiKeyError(null);
                    }}
                    sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, cursor: "pointer" }}
                  >
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: bedrockAuthMethod === "api_key" ? "4px solid #13715B" : `1.5px solid ${theme.palette.text.disabled}`,
                        backgroundColor: theme.palette.background.paper,
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    />
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 500, color: bedrockAuthMethod === "api_key" ? "#13715B" : theme.palette.text.primary }}>
                        Bedrock API Key
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: theme.palette.text.secondary, mt: 0.25 }}>
                        Quick setup, scoped to Bedrock
                      </Typography>
                    </Box>
                  </Box>

                  {/* Option 3: AWS Access Keys */}
                  <Box
                    onClick={() => {
                      setBedrockAuthMethod("access_keys");
                      setNewApiKey("");
                      setApiKeyError(null);
                    }}
                    sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, cursor: "pointer" }}
                  >
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: bedrockAuthMethod === "access_keys" ? "4px solid #13715B" : `1.5px solid ${theme.palette.text.disabled}`,
                        backgroundColor: theme.palette.background.paper,
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    />
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: bedrockAuthMethod === "access_keys" ? "#13715B" : theme.palette.text.primary }}>
                          AWS Access Keys
                        </Typography>
                        <Box sx={{ fontSize: 10, fontWeight: 500, color: "#92400E", bgcolor: "#FEF3C7", px: 0.5, py: 0.125, borderRadius: "3px" }}>
                          Legacy
                        </Box>
                      </Box>
                      <Typography sx={{ fontSize: 11, color: theme.palette.text.secondary, mt: 0.25 }}>
                        Long-lived credentials
                      </Typography>
                    </Box>
                  </Box>
                </Stack>

                {/* IAM Role Configuration */}
                {bedrockAuthMethod === "iam_role" && (
                  <Stack spacing={2}>
                    <Box>
                      <Field
                        label="IAM Role ARN"
                        value={awsRoleArn}
                        onChange={(e) => setAwsRoleArn(e.target.value)}
                        placeholder="arn:aws:iam::123456789012:role/VerifyWiseBedrockRole"
                        autoComplete="off"
                        error=""
                      />
                      <Typography sx={{ fontSize: 11, color: theme.palette.text.secondary, mt: 0.5 }}>
                        The IAM Role in your AWS account that trusts VerifyWise
                      </Typography>
                    </Box>
                    <Box>
                      <Field
                        label="External ID (optional)"
                        value={awsExternalId}
                        onChange={(e) => setAwsExternalId(e.target.value)}
                        placeholder="verifywise-external-id"
                        autoComplete="off"
                        error=""
                      />
                      <Typography sx={{ fontSize: 11, color: theme.palette.text.secondary, mt: 0.5 }}>
                        Additional security identifier for cross-account access
                      </Typography>
                    </Box>
                  </Stack>
                )}

                {/* Bedrock API Key Configuration */}
                {bedrockAuthMethod === "api_key" && (
                  <Box>
                    <Field
                      label="Bedrock API Key"
                      value={newApiKey}
                      onChange={(e) => handleApiKeyChange(e.target.value)}
                      placeholder="ABSK... or bedrock-api-key-..."
                      type="password"
                      autoComplete="new-password"
                      error={apiKeyError || ""}
                    />
                    <Typography sx={{ fontSize: 11, color: theme.palette.text.secondary, mt: 0.5 }}>
                      Get your key from{" "}
                      <a href="https://console.aws.amazon.com/bedrock/home#/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: "#13715B" }}>
                        AWS Bedrock Console → API Keys
                      </a>
                    </Typography>
                  </Box>
                )}

                {/* AWS Access Keys Configuration */}
                {bedrockAuthMethod === "access_keys" && (
                  <Stack spacing={2}>
                    <Box>
                      <Field
                        label="AWS Access Key ID"
                        value={awsAccessKeyId}
                        onChange={(e) => setAwsAccessKeyId(e.target.value)}
                        placeholder="AKIAIOSFODNN7EXAMPLE"
                        autoComplete="off"
                        error=""
                      />
                    </Box>
                    <Box>
                      <Field
                        label="AWS Secret Access Key"
                        value={awsSecretAccessKey}
                        onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                        placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                        type="password"
                        autoComplete="new-password"
                        error=""
                      />
                    </Box>
                  </Stack>
                )}

                {/* Region Selection - Always shown */}
                <Box sx={{ mt: 2 }}>
                  <Select
                    id="aws-region-select"
                    label="AWS Region"
                    value={awsRegion}
                    onChange={(e) => setAwsRegion(e.target.value as string)}
                    items={[
                      // United States
                      { _id: "us-east-1", name: "US East (N. Virginia)" },
                      { _id: "us-east-2", name: "US East (Ohio)" },
                      { _id: "us-west-1", name: "US West (N. California)" },
                      { _id: "us-west-2", name: "US West (Oregon)" },
                      // Canada
                      { _id: "ca-central-1", name: "Canada (Central)" },
                      { _id: "ca-west-1", name: "Canada (Calgary)" },
                      // Europe
                      { _id: "eu-west-1", name: "Europe (Ireland)" },
                      { _id: "eu-west-2", name: "Europe (London)" },
                      { _id: "eu-west-3", name: "Europe (Paris)" },
                      { _id: "eu-central-1", name: "Europe (Frankfurt)" },
                      { _id: "eu-north-1", name: "Europe (Stockholm)" },
                      { _id: "eu-south-1", name: "Europe (Milan)" },
                      { _id: "eu-south-2", name: "Europe (Spain)" },
                      { _id: "eu-central-2", name: "Europe (Zurich)" },
                      // Asia Pacific
                      { _id: "ap-northeast-1", name: "Asia Pacific (Tokyo)" },
                      { _id: "ap-northeast-2", name: "Asia Pacific (Seoul)" },
                      { _id: "ap-northeast-3", name: "Asia Pacific (Osaka)" },
                      { _id: "ap-southeast-1", name: "Asia Pacific (Singapore)" },
                      { _id: "ap-southeast-2", name: "Asia Pacific (Sydney)" },
                      { _id: "ap-southeast-3", name: "Asia Pacific (Jakarta)" },
                      { _id: "ap-southeast-4", name: "Asia Pacific (Melbourne)" },
                      { _id: "ap-southeast-5", name: "Asia Pacific (Malaysia)" },
                      { _id: "ap-southeast-7", name: "Asia Pacific (Thailand)" },
                      { _id: "ap-south-1", name: "Asia Pacific (Mumbai)" },
                      { _id: "ap-south-2", name: "Asia Pacific (Hyderabad)" },
                      { _id: "ap-east-1", name: "Asia Pacific (Hong Kong)" },
                      { _id: "ap-northeast-4", name: "Asia Pacific (Taipei)" },
                      { _id: "ap-southeast-6", name: "Asia Pacific (New Zealand)" },
                      // South America
                      { _id: "sa-east-1", name: "South America (São Paulo)" },
                      // Middle East
                      { _id: "me-south-1", name: "Middle East (Bahrain)" },
                      { _id: "me-central-1", name: "Middle East (UAE)" },
                      { _id: "il-central-1", name: "Israel (Tel Aviv)" },
                      // Africa
                      { _id: "af-south-1", name: "Africa (Cape Town)" },
                      // Mexico
                      { _id: "mx-central-1", name: "Mexico (Central)" },
                    ]}
                  />
                </Box>
              </Box>
            )}
            <Box sx={{ pt: 3 }}>
              <CustomizableButton
                variant="contained"
                text="Add provider"
                loading={saving}
                onClick={handleAddKey}
                isDisabled={
                  !selectedProvider ||
                  (selectedProvider !== "bedrock" && !newApiKey.trim()) ||
                  (selectedProvider === "bedrock" && bedrockAuthMethod === "iam_role" && !awsRoleArn.trim()) ||
                  (selectedProvider === "bedrock" && bedrockAuthMethod === "api_key" && !newApiKey.trim()) ||
                  (selectedProvider === "bedrock" && bedrockAuthMethod === "access_keys" && (!awsAccessKeyId.trim() || !awsSecretAccessKey.trim())) ||
                  !!apiKeyError
                }
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

