import React from "react";
import { Box, Typography, Stack } from "@mui/material";
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
  BarChart3,
  DollarSign,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CustomizableButton } from "../../../components/button/customizable-button";
import palette from "../../../themes/palette";

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
}

// ─── Architecture diagram ─────────────────────────────────────────────────────

function ArchDiagram() {
  const cardBase = {
    background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
    border: `0.5px solid ${palette.border.light}`,
    borderRadius: "4px",
    p: "18px 22px",
    boxShadow: "0 1px 3px rgba(16,24,40,0.05)",
  };

  const featureIconBase = {
    width: 30,
    height: 30,
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  const obsIconBase = {
    width: 34,
    height: 34,
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  // Arrow components
  const HArrow = () => (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, flexShrink: 0 }}>
      <Box sx={{ position: "relative", width: 32, height: 1.5, backgroundColor: palette.border.dark }}>
        <Box sx={{
          position: "absolute",
          right: -1,
          top: "50%",
          transform: "translateY(-50%) rotate(-45deg)",
          width: 7,
          height: 7,
          borderRight: `1.5px solid ${palette.border.dark}`,
          borderBottom: `1.5px solid ${palette.border.dark}`,
        }} />
      </Box>
    </Box>
  );

  const VArrow = () => (
    <Box sx={{ display: "flex", justifyContent: "center", py: "8px" }}>
      <Box sx={{ position: "relative", width: 1.5, height: 28, backgroundColor: palette.border.dark }}>
        <Box sx={{
          position: "absolute",
          bottom: -1,
          left: "50%",
          transform: "translateX(-50%) rotate(45deg)",
          width: 7,
          height: 7,
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
    <Stack direction="row" alignItems="center" gap="8px" sx={{ py: "2px" }}>
      <Box sx={{ ...featureIconBase, background: colorScheme.bg, color: colorScheme.color }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: 13, fontWeight: 500, color: palette.text.secondary }}>
        {label}
      </Typography>
    </Stack>
  );

  const PROVIDER_LABELS = [
    "OpenAI",
    "Anthropic",
    "Google Gemini",
    "AWS Bedrock",
    "Azure OpenAI",
    "OpenRouter",
    "Mistral",
  ];

  const obsItems = [
    { icon: <BarChart3 size={16} strokeWidth={1.8} />, scheme: { bg: "#eff8ff", color: "#1570EF" }, title: "Analytics dashboard", sub: "Cost, tokens, latency by hour or day" },
    { icon: <DollarSign size={16} strokeWidth={1.8} />, scheme: { bg: "#ecfdf3", color: "#13715B" }, title: "Cost tracking", sub: "By model, endpoint, user, tag" },
    { icon: <FileText size={16} strokeWidth={1.8} />, scheme: { bg: "#fffaeb", color: "#B54708" }, title: "Request logs", sub: "Full prompt and response audit" },
    { icon: <ShieldAlert size={16} strokeWidth={1.8} />, scheme: { bg: "#fef3f2", color: "#d92d20" }, title: "Guardrail analytics", sub: "Blocked and masked request tracking" },
  ];

  return (
    <Box>
      {/* Top row: Your App → Gateway → Providers */}
      <Stack direction="row" alignItems="stretch" justifyContent="center">
        {/* Your App card */}
        <Box sx={{ ...cardBase, minWidth: 170, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: palette.text.primary, letterSpacing: "-0.2px", mb: "4px" }}>
            Your app
          </Typography>
          <Typography sx={{ fontSize: 11, color: palette.text.disabled, mb: "14px" }}>
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
              p: "8px 12px",
              fontSize: 13,
              fontWeight: 500,
              color: palette.text.secondary,
            }}
          >
            <Code2 size={13} color={palette.text.disabled} strokeWidth={1.8} />
            <Box component="code" sx={{ fontSize: 11, color: palette.text.tertiary, background: "#f2f4f7", px: "6px", py: "1px", borderRadius: "3px", fontFamily: "monospace" }}>
              REST API
            </Box>
          </Stack>
          <Typography sx={{ fontSize: 10, color: palette.text.disabled, mt: "6px" }}>
            OpenAI-compatible format
          </Typography>
        </Box>

        <HArrow />

        {/* Gateway card */}
        <Box sx={{
          ...cardBase,
          flex: 1,
          maxWidth: 360,
          borderColor: `${palette.brand.primary}28`,
          background: "linear-gradient(180deg, #ffffff 0%, #f7fdfb 100%)",
        }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: palette.brand.primary, letterSpacing: "-0.2px", mb: "4px" }}>
            VerifyWise AI gateway
          </Typography>
          <Typography sx={{ fontSize: 11, color: palette.text.disabled, mb: "8px" }}>
            Unified proxy with governance controls
          </Typography>

          {/* Security section */}
          <Typography sx={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: palette.text.disabled, borderTop: `0.5px solid #f2f4f7`, pt: "6px", mb: "4px" }}>
            Security &amp; guardrails
          </Typography>
          <FeatureRow icon={<Fingerprint size={14} strokeWidth={1.8} />} label="PII detection" colorScheme={{ bg: "#ecfdf3", color: "#13715B" }} />
          <FeatureRow icon={<ShieldCheck size={14} strokeWidth={1.8} />} label="Content filter" colorScheme={{ bg: "#ecfdf3", color: "#13715B" }} />

          {/* Traffic controls */}
          <Typography sx={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: palette.text.disabled, borderTop: `0.5px solid #f2f4f7`, pt: "6px", mt: "8px", mb: "4px" }}>
            Traffic controls
          </Typography>
          <FeatureRow icon={<Gauge size={14} strokeWidth={1.8} />} label="Rate limiting" colorScheme={{ bg: "#eff8ff", color: "#1570EF" }} />
          <FeatureRow icon={<Wallet size={14} strokeWidth={1.8} />} label="Budget controls" colorScheme={{ bg: "#eff8ff", color: "#1570EF" }} />
          <FeatureRow icon={<GitBranch size={14} strokeWidth={1.8} />} label="Fallback chains" colorScheme={{ bg: "#eff8ff", color: "#1570EF" }} />

          {/* Governance */}
          <Typography sx={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: palette.text.disabled, borderTop: `0.5px solid #f2f4f7`, pt: "6px", mt: "8px", mb: "4px" }}>
            Governance
          </Typography>
          <FeatureRow icon={<Lock size={14} strokeWidth={1.8} />} label="Role-based access" colorScheme={{ bg: "#fffaeb", color: "#B54708" }} />
          <FeatureRow icon={<History size={14} strokeWidth={1.8} />} label="Audit trail" colorScheme={{ bg: "#fffaeb", color: "#B54708" }} />
        </Box>

        <HArrow />

        {/* Providers card */}
        <Box sx={{ ...cardBase, minWidth: 200 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: palette.brand.primary, letterSpacing: "-0.2px", mb: "4px" }}>
            LLM providers
          </Typography>
          <Typography sx={{ fontSize: 11, color: palette.text.disabled, mb: "12px" }}>
            100+ supported models
          </Typography>
          <Stack gap="4px">
            {PROVIDER_LABELS.map((name) => (
              <Stack key={name} direction="row" alignItems="center" gap="8px">
                <Box sx={{
                  width: 24,
                  height: 24,
                  borderRadius: "4px",
                  background: palette.background.accent,
                  border: `0.5px solid ${palette.border.light}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Typography sx={{ fontSize: 8, fontWeight: 700, color: palette.text.tertiary, lineHeight: 1 }}>
                    {name.slice(0, 2).toUpperCase()}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 13, fontWeight: 500, color: palette.text.secondary }}>{name}</Typography>
              </Stack>
            ))}
            <Typography sx={{ fontSize: 11, color: palette.text.disabled, pl: "32px", mt: "4px" }}>
              + xAI, Cohere, Ollama, Groq…
            </Typography>
          </Stack>
        </Box>
      </Stack>

      {/* Vertical arrow */}
      <VArrow />

      {/* Observability row */}
      <Stack justifyContent="center" alignItems="center">
        <Box sx={{ ...cardBase, width: "100%", maxWidth: 730 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: palette.text.primary, letterSpacing: "-0.2px", mb: "4px" }}>
            VerifyWise observability
          </Typography>
          <Typography sx={{ fontSize: 11, color: palette.text.disabled, mb: "10px" }}>
            Full visibility into every AI request
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 36px" }}>
            {obsItems.map((item) => (
              <Stack key={item.title} direction="row" alignItems="center" gap="10px" sx={{ py: "8px" }}>
                <Box sx={{ ...obsIconBase, background: item.scheme.bg, color: item.scheme.color }}>
                  {item.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: palette.text.secondary }}>
                    {item.title}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: palette.text.disabled, mt: "1px" }}>
                    {item.sub}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}

// ─── Checklist item ───────────────────────────────────────────────────────────

interface ChecklistItemProps {
  label: string;
  done: boolean;
  navigateTo?: string;
}

function ChecklistItem({ label, done, navigateTo }: ChecklistItemProps) {
  const navigate = useNavigate();

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap="10px"
      onClick={() => navigateTo && navigate(navigateTo)}
      sx={{
        cursor: navigateTo ? "pointer" : "default",
        borderRadius: "6px",
        px: "4px",
        py: "3px",
        "&:hover": navigateTo
          ? { backgroundColor: palette.background.hover }
          : {},
        transition: "background-color 0.15s",
      }}
    >
      {done ? (
        <Box sx={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: palette.brand.primaryLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <Check size={12} color={palette.brand.primary} strokeWidth={2.5} />
        </Box>
      ) : (
        <Circle size={20} color={palette.border.dark} strokeWidth={1.5} style={{ flexShrink: 0 }} />
      )}
      <Typography
        sx={{
          fontSize: 14,
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

export default function OnboardingOverlay({ onGetStarted, setupStatus }: OnboardingOverlayProps) {
  const CHECKLIST_ITEMS: ChecklistItemProps[] = [
    { label: "Add a provider API key", done: setupStatus.hasApiKey, navigateTo: "/ai-gateway/settings" },
    { label: "Create an endpoint", done: setupStatus.hasEndpoint, navigateTo: "/ai-gateway/endpoints" },
    { label: "Create a virtual key", done: setupStatus.hasVirtualKey, navigateTo: "/ai-gateway/virtual-keys" },
    { label: "Make your first request", done: setupStatus.hasRequests },
  ];

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(1px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        zIndex: 10,
        overflowY: "auto",
        pt: "24px",
        pb: "40px",
        px: "16px",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 860 }}>
        {/* Heading */}
        <Stack gap="6px" sx={{ mb: "28px" }}>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: palette.text.primary, letterSpacing: "-0.3px" }}>
            Visualize your LLM traffic
          </Typography>
          <Typography sx={{ fontSize: 14, color: palette.text.tertiary }}>
            Make your first request to see a real-time map of your model connections
          </Typography>
        </Stack>

        {/* Checklist */}
        <Stack gap="4px" sx={{ mb: "24px" }}>
          {CHECKLIST_ITEMS.map((item) => (
            <ChecklistItem key={item.label} {...item} />
          ))}
        </Stack>

        {/* Get started button */}
        <Box sx={{ mb: "36px" }}>
          <CustomizableButton
            text="Get started"
            onClick={onGetStarted}
            endIcon={<ArrowRight size={15} strokeWidth={1.8} />}
            sx={{ height: "34px" }}
          />
        </Box>

        {/* Architecture diagram */}
        <ArchDiagram />
      </Box>
    </Box>
  );
}
