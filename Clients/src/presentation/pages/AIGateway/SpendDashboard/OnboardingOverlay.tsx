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

// ─── Architecture diagram (compact, no observability block) ──────────────────

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
  navigateTo?: string;
}

function ChecklistItem({ label, done, navigateTo }: ChecklistItemProps) {
  const navigate = useNavigate();

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap="8px"
      onClick={() => navigateTo && navigate(navigateTo)}
      sx={{
        cursor: navigateTo ? "pointer" : "default",
        borderRadius: "4px",
        px: "2px",
        py: "2px",
        "&:hover": navigateTo
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
  );
}
