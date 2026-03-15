import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Stack, IconButton } from "@mui/material";
import {
  Check,
  Circle,
  ArrowRight,
  Code2,
  Fingerprint,
  ShieldCheck,
  Gauge,
  Wallet,
  GitBranch,
  Lock,
  History,
  Copy,
} from "lucide-react";
import { CustomizableButton } from "../../../components/button/customizable-button";
import Field from "../../../components/Inputs/Field";
import Select from "../../../components/Inputs/Select";
import StandardModal from "../../../components/Modals/StandardModal";
import palette from "../../../themes/palette";
import { apiServices } from "../../../../infrastructure/api/networkServices";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SetupStatus {
  hasApiKey: boolean;
  hasEndpoint: boolean;
  hasVirtualKey: boolean;
  hasRequests: boolean;
}

interface OnboardingOverlayProps {
  onGetStarted: () => void;
  setupStatus: SetupStatus;
  onStepCompleted: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOP_PROVIDERS = [
  { _id: "openai", name: "OpenAI" },
  { _id: "anthropic", name: "Anthropic" },
  { _id: "gemini", name: "Google Gemini" },
  { _id: "mistral", name: "Mistral" },
  { _id: "xai", name: "xAI" },
  { _id: "openrouter", name: "OpenRouter" },
  { _id: "bedrock", name: "AWS Bedrock" },
  { _id: "azure", name: "Azure OpenAI" },
  { _id: "together_ai", name: "Together AI" },
  { _id: "cohere", name: "Cohere" },
];

const QUICK_MODELS = [
  { _id: "openai/gpt-4o", name: "openai/gpt-4o" },
  { _id: "openai/gpt-4o-mini", name: "openai/gpt-4o-mini" },
  { _id: "anthropic/claude-sonnet-4-20250514", name: "anthropic/claude-sonnet-4-20250514" },
  { _id: "anthropic/claude-haiku-4-20250414", name: "anthropic/claude-haiku-4-20250414" },
  { _id: "gemini/gemini-2.5-flash-preview-05-20", name: "gemini/gemini-2.5-flash-preview-05-20" },
  { _id: "mistral/mistral-large-latest", name: "mistral/mistral-large-latest" },
];

const CODE_BLOCK_BG = "#1E1E1E";
const CODE_BLOCK_TEXT = "#D4D4D4";
const WARNING_BG = "#FFFAEB";
const WARNING_BORDER = "#FEDF89";
const WARNING_TEXT = "#B54708";
const KEY_DISPLAY_BG = "#F9FAFB";
const gatewayUrl = window.location.origin.replace(/:\d+$/, ":3000");

// ─── Architecture diagram ─────────────────────────────────────────────────────

function ArchDiagram() {
  const cardBase = {
    background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
    border: `0.5px solid ${palette.border.light}`,
    borderRadius: "4px",
    p: "14px 18px",
    boxShadow: "0 1px 3px rgba(16,24,40,0.05)",
  };

  const featureIconBase = {
    width: 26,
    height: 26,
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  const HArrow = () => (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, flexShrink: 0 }}>
      <Box sx={{ position: "relative", width: 26, height: 1.5, backgroundColor: palette.border.dark }}>
        <Box sx={{
          position: "absolute",
          right: -1,
          top: "50%",
          transform: "translateY(-50%) rotate(-45deg)",
          width: 6,
          height: 6,
          borderRight: `1.5px solid ${palette.border.dark}`,
          borderBottom: `1.5px solid ${palette.border.dark}`,
        }} />
      </Box>
    </Box>
  );

  const FeatureRow = ({ icon, label, colorScheme }: {
    icon: React.ReactNode;
    label: string;
    colorScheme: { bg: string; color: string };
  }) => (
    <Stack direction="row" alignItems="center" gap="6px" sx={{ py: "1px" }}>
      <Box sx={{ ...featureIconBase, background: colorScheme.bg, color: colorScheme.color }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: 12, fontWeight: 500, color: palette.text.secondary }}>
        {label}
      </Typography>
    </Stack>
  );

  const SectionLabel = ({ children }: { children: string }) => (
    <Typography sx={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: palette.text.disabled, borderTop: `0.5px solid #f2f4f7`, pt: "4px", mt: "6px", mb: "2px" }}>
      {children}
    </Typography>
  );

  const PROVIDER_LABELS = ["OpenAI", "Anthropic", "Google Gemini", "AWS Bedrock", "Azure OpenAI", "Mistral"];

  return (
    <Stack direction="row" alignItems="stretch" justifyContent="center">
      {/* Your App card */}
      <Box sx={{ ...cardBase, minWidth: 150, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: palette.text.primary, letterSpacing: "-0.2px", mb: "2px" }}>
          Your app
        </Typography>
        <Typography sx={{ fontSize: 11, color: palette.text.disabled, mb: "10px" }}>
          Any language or framework
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
          gap="6px"
          sx={{
            background: palette.background.accent,
            border: `0.5px solid ${palette.border.light}`,
            borderRadius: "4px",
            p: "6px 10px",
          }}
        >
          <Code2 size={12} color={palette.text.disabled} strokeWidth={1.8} />
          <Box component="code" sx={{ fontSize: 10, color: palette.text.tertiary, background: "#f2f4f7", px: "5px", py: "1px", borderRadius: "3px", fontFamily: "monospace" }}>
            REST API
          </Box>
        </Stack>
        <Typography sx={{ fontSize: 9, color: palette.text.disabled, mt: "4px" }}>
          OpenAI-compatible format
        </Typography>
      </Box>

      <HArrow />

      {/* Gateway card */}
      <Box sx={{
        ...cardBase,
        flex: 1,
        maxWidth: 320,
        borderColor: `${palette.brand.primary}28`,
        background: "linear-gradient(180deg, #ffffff 0%, #f7fdfb 100%)",
      }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: palette.brand.primary, letterSpacing: "-0.2px", mb: "2px" }}>
          VerifyWise AI gateway
        </Typography>
        <Typography sx={{ fontSize: 10, color: palette.text.disabled, mb: "4px" }}>
          Unified proxy with governance controls
        </Typography>

        <SectionLabel>Security &amp; guardrails</SectionLabel>
        <FeatureRow icon={<Fingerprint size={12} strokeWidth={1.8} />} label="PII detection" colorScheme={{ bg: "#ecfdf3", color: "#13715B" }} />
        <FeatureRow icon={<ShieldCheck size={12} strokeWidth={1.8} />} label="Content filter" colorScheme={{ bg: "#ecfdf3", color: "#13715B" }} />

        <SectionLabel>Traffic controls</SectionLabel>
        <FeatureRow icon={<Gauge size={12} strokeWidth={1.8} />} label="Rate limiting" colorScheme={{ bg: "#eff8ff", color: "#1570EF" }} />
        <FeatureRow icon={<Wallet size={12} strokeWidth={1.8} />} label="Budget controls" colorScheme={{ bg: "#eff8ff", color: "#1570EF" }} />
        <FeatureRow icon={<GitBranch size={12} strokeWidth={1.8} />} label="Fallback chains" colorScheme={{ bg: "#eff8ff", color: "#1570EF" }} />

        <SectionLabel>Governance</SectionLabel>
        <FeatureRow icon={<Lock size={12} strokeWidth={1.8} />} label="Role-based access" colorScheme={{ bg: "#fffaeb", color: "#B54708" }} />
        <FeatureRow icon={<History size={12} strokeWidth={1.8} />} label="Audit trail" colorScheme={{ bg: "#fffaeb", color: "#B54708" }} />
      </Box>

      <HArrow />

      {/* Providers card */}
      <Box sx={{ ...cardBase, minWidth: 170 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: palette.brand.primary, letterSpacing: "-0.2px", mb: "2px" }}>
          LLM providers
        </Typography>
        <Typography sx={{ fontSize: 10, color: palette.text.disabled, mb: "8px" }}>
          100+ supported models
        </Typography>
        <Stack gap="3px">
          {PROVIDER_LABELS.map((name) => (
            <Stack key={name} direction="row" alignItems="center" gap="6px">
              <Box sx={{
                width: 20,
                height: 20,
                borderRadius: "3px",
                background: palette.background.accent,
                border: `0.5px solid ${palette.border.light}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <Typography sx={{ fontSize: 7, fontWeight: 700, color: palette.text.tertiary, lineHeight: 1 }}>
                  {name.slice(0, 2).toUpperCase()}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 12, fontWeight: 500, color: palette.text.secondary }}>{name}</Typography>
            </Stack>
          ))}
          <Typography sx={{ fontSize: 10, color: palette.text.disabled, pl: "26px", mt: "2px" }}>
            + xAI, Cohere, Ollama, Groq...
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}

// ─── Checklist item ───────────────────────────────────────────────────────────

interface ChecklistItemProps {
  label: string;
  done: boolean;
  onClick?: () => void;
}

function ChecklistItem({ label, done, onClick }: ChecklistItemProps) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap="8px"
      onClick={() => !done && onClick && onClick()}
      sx={{
        cursor: !done && onClick ? "pointer" : "default",
        borderRadius: "4px",
        px: "2px",
        py: "2px",
        "&:hover": !done && onClick
          ? { backgroundColor: palette.background.hover }
          : {},
        transition: "background-color 0.15s",
      }}
    >
      {done ? (
        <Box sx={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: palette.brand.primaryLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <Check size={11} color={palette.brand.primary} strokeWidth={2.5} />
        </Box>
      ) : (
        <Circle size={18} color={palette.border.dark} strokeWidth={1.5} style={{ flexShrink: 0 }} />
      )}
      <Typography
        sx={{
          fontSize: 13,
          color: done ? palette.text.tertiary : palette.text.primary,
          textDecoration: done ? "line-through" : "none",
          textDecorationColor: palette.text.disabled,
        }}
      >
        {label}
      </Typography>
    </Stack>
  );
}

// ─── Main overlay ─────────────────────────────────────────────────────────────

export default function OnboardingOverlay({ onGetStarted, setupStatus, onStepCompleted }: OnboardingOverlayProps) {
  const [activeModal, setActiveModal] = useState<"api-key" | "endpoint" | "virtual-key" | null>(null);

  // ── API key modal state ──
  const [keyForm, setKeyForm] = useState({ key_name: "", provider: "", api_key: "" });
  const [keyError, setKeyError] = useState("");
  const [keySubmitting, setKeySubmitting] = useState(false);

  // ── Endpoint modal state ──
  const [endpointForm, setEndpointForm] = useState({ display_name: "", slug: "", model: "", api_key_id: "" });
  const [endpointError, setEndpointError] = useState("");
  const [endpointSubmitting, setEndpointSubmitting] = useState(false);
  const [availableKeys, setAvailableKeys] = useState<{ _id: string; name: string }[]>([]);

  // ── Virtual key modal state ──
  const [vkeyName, setVkeyName] = useState("");
  const [vkeyError, setVkeyError] = useState("");
  const [vkeySubmitting, setVkeySubmitting] = useState(false);
  // Two-phase: form → display
  const [createdKey, setCreatedKey] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch available keys when endpoint modal opens
  useEffect(() => {
    if (activeModal === "endpoint") {
      apiServices.get("/ai-gateway/keys").then((res) => {
        const keys = (res?.data?.data || []).filter((k: any) => k.is_active);
        setAvailableKeys(keys.map((k: any) => ({ _id: String(k.id), name: `${k.key_name} (${k.provider})` })));
      }).catch(() => {});
    }
  }, [activeModal]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // ── Helpers ──

  const handleNameChange = (value: string) => {
    setEndpointForm((p) => ({
      ...p,
      display_name: value,
      slug: value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    }));
  };

  const closeModal = () => {
    setActiveModal(null);
    setKeyForm({ key_name: "", provider: "", api_key: "" });
    setKeyError("");
    setEndpointForm({ display_name: "", slug: "", model: "", api_key_id: "" });
    setEndpointError("");
    setVkeyName("");
    setVkeyError("");
    setCreatedKey("");
    setCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(createdKey);
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  // ── Submit handlers ──

  const handleCreateKey = async () => {
    if (!keyForm.key_name || !keyForm.provider || !keyForm.api_key) {
      setKeyError("All fields are required");
      return;
    }
    setKeySubmitting(true);
    setKeyError("");
    try {
      await apiServices.post("/ai-gateway/keys", keyForm);
      closeModal();
      onStepCompleted();
    } catch (err: any) {
      setKeyError(err?.response?.data?.message || "Failed to create API key");
    } finally {
      setKeySubmitting(false);
    }
  };

  const handleCreateEndpoint = async () => {
    if (!endpointForm.display_name || !endpointForm.slug || !endpointForm.model || !endpointForm.api_key_id) {
      setEndpointError("Name, model, and API key are required");
      return;
    }
    setEndpointSubmitting(true);
    setEndpointError("");
    try {
      const provider = endpointForm.model.includes("/") ? endpointForm.model.split("/")[0] : "";
      await apiServices.post("/ai-gateway/endpoints", {
        display_name: endpointForm.display_name,
        slug: endpointForm.slug,
        provider,
        model: endpointForm.model,
        api_key_id: Number(endpointForm.api_key_id),
      });
      closeModal();
      onStepCompleted();
    } catch (err: any) {
      setEndpointError(err?.response?.data?.message || "Failed to create endpoint");
    } finally {
      setEndpointSubmitting(false);
    }
  };

  const handleCreateVirtualKey = async () => {
    if (!vkeyName.trim()) {
      setVkeyError("Name is required");
      return;
    }
    setVkeySubmitting(true);
    setVkeyError("");
    try {
      const res = await apiServices.post("/ai-gateway/virtual-keys", { name: vkeyName.trim() });
      const created = res?.data?.data;
      if (created?.key) {
        setCreatedKey(created.key);
      }
      onStepCompleted();
    } catch (err: any) {
      setVkeyError(err?.response?.data?.message || "Failed to create virtual key");
    } finally {
      setVkeySubmitting(false);
    }
  };

  const CHECKLIST_ITEMS: ChecklistItemProps[] = [
    {
      label: "Add a provider API key",
      done: setupStatus.hasApiKey,
      onClick: () => setActiveModal("api-key"),
    },
    {
      label: "Create an endpoint",
      done: setupStatus.hasEndpoint,
      onClick: () => setActiveModal("endpoint"),
    },
    {
      label: "Create a virtual key",
      done: setupStatus.hasVirtualKey,
      onClick: () => setActiveModal("virtual-key"),
    },
    {
      label: "Make your first request",
      done: setupStatus.hasRequests,
    },
  ];

  const isKeyDisplayPhase = activeModal === "virtual-key" && createdKey !== "";

  return (
    <>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(240,242,245,0.92)",
          backdropFilter: "blur(1px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          zIndex: 10,
          overflowY: "auto",
          pt: "20px",
          pb: "24px",
          px: "16px",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 820 }}>
          {/* Heading + checklist + button in a row */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: "24px" }}>
            {/* Left: heading + checklist */}
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: palette.text.primary, letterSpacing: "-0.2px", mb: "4px" }}>
                Visualize your LLM traffic
              </Typography>
              <Typography sx={{ fontSize: 13, color: palette.text.tertiary, mb: "14px" }}>
                Make your first request to see a real-time map of your model connections
              </Typography>
              <Stack gap="2px">
                {CHECKLIST_ITEMS.map((item) => (
                  <ChecklistItem key={item.label} {...item} />
                ))}
              </Stack>
            </Box>

            {/* Right: Get started button */}
            <Box sx={{ flexShrink: 0, pt: "2px" }}>
              <CustomizableButton
                text="Get started"
                onClick={onGetStarted}
                endIcon={<ArrowRight size={14} strokeWidth={1.8} />}
              />
            </Box>
          </Stack>

          {/* Architecture diagram */}
          <ArchDiagram />
        </Box>
      </Box>

      {/* ── Modal 1: Add API key ── */}
      <StandardModal
        isOpen={activeModal === "api-key"}
        onClose={closeModal}
        title="Add API key"
        description="Add a provider API key for your gateway endpoints"
        onSubmit={handleCreateKey}
        submitButtonText="Add key"
        isSubmitting={keySubmitting}
        maxWidth="480px"
      >
        <Stack gap="16px">
          <Field
            label="Key name"
            placeholder="e.g., Production OpenAI key"
            value={keyForm.key_name}
            onChange={(e) => setKeyForm((p) => ({ ...p, key_name: e.target.value }))}
            isRequired
          />
          <Select
            id="onboarding-provider"
            label="Provider"
            placeholder="Select provider"
            value={keyForm.provider}
            items={TOP_PROVIDERS}
            onChange={(e) => setKeyForm((p) => ({ ...p, provider: e.target.value as string }))}
            getOptionValue={(item) => item._id}
            isRequired
          />
          <Field
            label="API key"
            placeholder="sk-..."
            value={keyForm.api_key}
            onChange={(e) => setKeyForm((p) => ({ ...p, api_key: e.target.value }))}
            autoComplete="off"
            isRequired
          />
          {keyError && (
            <Typography sx={{ fontSize: 12, color: palette.status.error.text }}>
              {keyError}
            </Typography>
          )}
        </Stack>
      </StandardModal>

      {/* ── Modal 2: Create endpoint ── */}
      <StandardModal
        isOpen={activeModal === "endpoint"}
        onClose={closeModal}
        title="Create endpoint"
        description="Configure a new LLM provider endpoint"
        onSubmit={handleCreateEndpoint}
        submitButtonText="Create endpoint"
        isSubmitting={endpointSubmitting}
        maxWidth="480px"
      >
        <Stack gap="16px">
          <Field
            label="Endpoint name"
            placeholder="e.g., Production GPT-4o"
            value={endpointForm.display_name}
            onChange={(e) => handleNameChange(e.target.value)}
            isRequired
          />
          {endpointForm.slug && (
            <Typography sx={{ fontSize: 11, color: palette.text.tertiary, mt: "-8px" }}>
              Endpoint slug: <strong>{endpointForm.slug}</strong>
            </Typography>
          )}
          <Select
            id="onboarding-model"
            label="Model"
            placeholder="Select a model"
            value={endpointForm.model}
            items={QUICK_MODELS}
            onChange={(e) => setEndpointForm((p) => ({ ...p, model: e.target.value as string }))}
            getOptionValue={(item) => item._id}
            isRequired
          />
          {availableKeys.length > 0 ? (
            <Select
              id="onboarding-api-key"
              label="API key"
              placeholder="Select an API key"
              value={endpointForm.api_key_id}
              items={availableKeys}
              onChange={(e) => setEndpointForm((p) => ({ ...p, api_key_id: e.target.value as string }))}
              getOptionValue={(item) => item._id}
              isRequired
            />
          ) : (
            <Stack
              direction="row"
              alignItems="flex-start"
              gap="6px"
              sx={{
                p: "8px 12px",
                bgcolor: palette.background.accent,
                borderRadius: "4px",
                border: `1px solid ${palette.border.light}`,
              }}
            >
              <Typography sx={{ fontSize: 12, lineHeight: 1.5, color: palette.text.tertiary }}>
                No API keys available. Add an API key first using the checklist above.
              </Typography>
            </Stack>
          )}
          {endpointError && (
            <Typography sx={{ fontSize: 12, color: palette.status.error.text }}>
              {endpointError}
            </Typography>
          )}
        </Stack>
      </StandardModal>

      {/* ── Modal 3a: Create virtual key (form phase) ── */}
      <StandardModal
        isOpen={activeModal === "virtual-key" && !isKeyDisplayPhase}
        onClose={closeModal}
        title="Create virtual key"
        description="Generate an API key for developers to use the gateway with the OpenAI SDK."
        onSubmit={handleCreateVirtualKey}
        submitButtonText="Create key"
        isSubmitting={vkeySubmitting}
        maxWidth="480px"
      >
        <Stack gap="16px">
          <Field
            label="Name"
            placeholder="e.g., Backend production key"
            value={vkeyName}
            onChange={(e) => setVkeyName(e.target.value)}
            isRequired
          />
          {vkeyError && (
            <Typography sx={{ fontSize: 12, color: palette.status.error.text }}>
              {vkeyError}
            </Typography>
          )}
        </Stack>
      </StandardModal>

      {/* ── Modal 3b: Virtual key display (post-creation) ── */}
      <StandardModal
        isOpen={isKeyDisplayPhase}
        onClose={closeModal}
        title="Virtual key created"
        description="Copy the key below. It will not be shown again."
        maxWidth="560px"
      >
        <Stack gap="16px">
          <Box
            sx={{
              p: "12px 16px",
              backgroundColor: KEY_DISPLAY_BG,
              border: `1px solid ${palette.border.dark}`,
              borderRadius: "4px",
              fontFamily: "monospace",
              fontSize: 13,
              wordBreak: "break-all",
              position: "relative",
            }}
          >
            {createdKey}
            <IconButton
              size="small"
              onClick={copyToClipboard}
              sx={{ position: "absolute", top: 8, right: 8, p: 0.5 }}
              aria-label="Copy key"
            >
              {copied ? (
                <Check size={14} strokeWidth={1.5} color={palette.status.success.text} />
              ) : (
                <Copy size={14} strokeWidth={1.5} color={palette.text.tertiary} />
              )}
            </IconButton>
          </Box>

          <Box
            sx={{
              p: "12px 16px",
              backgroundColor: WARNING_BG,
              border: `1px solid ${WARNING_BORDER}`,
              borderRadius: "4px",
            }}
          >
            <Typography sx={{ fontSize: 12, color: WARNING_TEXT, fontWeight: 500 }}>
              This key will not be shown again. Store it securely.
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 500, mb: 1 }}>Usage example</Typography>
            <Box
              sx={{
                p: "12px 16px",
                backgroundColor: CODE_BLOCK_BG,
                borderRadius: "4px",
                fontFamily: "monospace",
                fontSize: 12,
                color: CODE_BLOCK_TEXT,
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                overflow: "auto",
              }}
            >
              {`from openai import OpenAI\n\nclient = OpenAI(\n    base_url="${gatewayUrl}/v1",\n    api_key="${createdKey}"\n)\n\nresponse = client.chat.completions.create(\n    model="your-endpoint-slug",\n    messages=[{"role": "user", "content": "Hello"}]\n)`}
            </Box>
          </Box>

          <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
            CORS is disabled on gateway routes. Use virtual keys from backend services only.
          </Typography>
        </Stack>
      </StandardModal>
    </>
  );
}
