import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Typography, Stack, IconButton } from "@mui/material";
import Chip from "../../../components/Chip";
import {
  CirclePlus,
  ShieldCheck,
  Fingerprint,
  Filter,
  Trash2,
  FlaskConical,
  Lock,
  ScanLine,
  FileWarning,
} from "lucide-react";
import { CustomizableButton } from "../../../components/button/customizable-button";
import Field from "../../../components/Inputs/Field";
import Select from "../../../components/Inputs/Select";
import Toggle from "../../../components/Inputs/Toggle";
import StandardModal from "../../../components/Modals/StandardModal";
import { PageHeaderExtended } from "../../../components/Layout/PageHeaderExtended";
import { EmptyState } from "../../../components/EmptyState";
import EmptyStateTip from "../../../components/EmptyState/EmptyStateTip";
import { apiServices } from "../../../../infrastructure/api/networkServices";
import palette from "../../../themes/palette";
import { sectionTitleSx, useCardSx } from "../shared";

const PII_ENTITY_OPTIONS = [
  { _id: "EMAIL_ADDRESS", name: "Email address" },
  { _id: "PHONE_NUMBER", name: "Phone number" },
  { _id: "CREDIT_CARD", name: "Credit card" },
  { _id: "PERSON", name: "Person name" },
  { _id: "IBAN_CODE", name: "IBAN" },
  { _id: "TR_TCKN", name: "Turkish TCKN" },
  { _id: "EU_PHONE", name: "EU phone number" },
  { _id: "US_SSN", name: "US SSN" },
  { _id: "IP_ADDRESS", name: "IP address" },
  { _id: "LOCATION", name: "Location" },
  { _id: "DATE_TIME", name: "Date/time" },
  { _id: "NRP", name: "Nationality/religion/politics" },
  { _id: "MEDICAL_LICENSE", name: "Medical license" },
];

const ACTION_ITEMS = [
  { _id: "block", name: "Block" },
  { _id: "mask", name: "Mask" },
];

const FILTER_TYPE_ITEMS = [
  { _id: "keyword", name: "Keyword" },
  { _id: "regex", name: "Regex pattern" },
];

export default function GuardrailsPage() {
  const cardSx = useCardSx();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // PII modal
  const [isPiiModalOpen, setIsPiiModalOpen] = useState(false);
  const [piiForm, setPiiForm] = useState({
    name: "",
    entity: "EMAIL_ADDRESS",
    action: "block",
  });
  const [piiSubmitting, setPiiSubmitting] = useState(false);

  // Content filter modal
  const [isCfModalOpen, setIsCfModalOpen] = useState(false);
  const [cfForm, setCfForm] = useState({
    name: "",
    type: "keyword",
    pattern: "",
    action: "block",
  });
  const [cfError, setCfError] = useState("");
  const [cfSubmitting, setCfSubmitting] = useState(false);

  // Test modal
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [testText, setTestText] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  const loadRules = useCallback(async () => {
    try {
      const res = await apiServices.get("/ai-gateway/guardrails");
      setRules(res?.data?.data || []);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const piiRules = useMemo(() => rules.filter((r) => r.guardrail_type === "pii"), [rules]);
  const cfRules = useMemo(() => rules.filter((r) => r.guardrail_type === "content_filter"), [rules]);

  // ─── PII Handlers ──────────────────────────────────────────────────────────

  const handleCreatePii = async () => {
    if (!piiForm.name || !piiForm.entity) return;
    setPiiSubmitting(true);
    try {
      await apiServices.post("/ai-gateway/guardrails", {
        guardrail_type: "pii",
        name: piiForm.name,
        action: piiForm.action,
        config: {
          entities: { [piiForm.entity]: piiForm.action },
          score_thresholds: { ALL: 0.7 },
          language: "en",
        },
      });
      setIsPiiModalOpen(false);
      setPiiForm({ name: "", entity: "EMAIL_ADDRESS", action: "block" });
      await loadRules();
    } catch {
      // Silently handle
    } finally {
      setPiiSubmitting(false);
    }
  };

  // ─── Content Filter Handlers ───────────────────────────────────────────────

  const handleCreateCf = async () => {
    if (!cfForm.name || !cfForm.pattern) {
      setCfError("Name and pattern are required");
      return;
    }
    // Validate regex on client side
    if (cfForm.type === "regex") {
      try {
        new RegExp(cfForm.pattern);
      } catch {
        setCfError("Invalid regex pattern");
        return;
      }
    }
    setCfSubmitting(true);
    setCfError("");
    try {
      await apiServices.post("/ai-gateway/guardrails", {
        guardrail_type: "content_filter",
        name: cfForm.name,
        action: cfForm.action,
        config: {
          type: cfForm.type,
          pattern: cfForm.pattern,
        },
      });
      setIsCfModalOpen(false);
      setCfForm({ name: "", type: "keyword", pattern: "", action: "block" });
      await loadRules();
    } catch (err: any) {
      setCfError(err?.response?.data?.message || "Failed to create rule");
    } finally {
      setCfSubmitting(false);
    }
  };

  // ─── Common Handlers ───────────────────────────────────────────────────────

  const handleToggle = async (id: number, isActive: boolean) => {
    try {
      await apiServices.patch(`/ai-gateway/guardrails/${id}`, { is_active: !isActive });
      await loadRules();
    } catch {
      // Silently handle
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiServices.delete(`/ai-gateway/guardrails/${id}`);
      await loadRules();
    } catch {
      // Silently handle
    }
  };

  const handleTest = async () => {
    if (!testText.trim()) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await apiServices.post("/ai-gateway/guardrails/test", { text: testText });
      setTestResult(res?.data?.data);
    } catch (err: any) {
      setTestResult({ error: err?.response?.data?.message || "Test failed — is the AI Gateway service running?" });
    } finally {
      setTestLoading(false);
    }
  };

  const renderRuleRow = (rule: any) => (
    <Stack
      key={rule.id}
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{
        p: "12px 16px",
        border: `1px solid ${palette.border.dark}`,
        borderRadius: "4px",
        opacity: rule.is_active ? 1 : 0.6,
      }}
    >
      <Stack gap="4px">
        <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{rule.name}</Typography>
        <Typography sx={{ fontSize: 12, color: palette.text.tertiary }}>
          {rule.guardrail_type === "pii"
            ? `${Object.keys(rule.config?.entities || {}).join(", ")}`
            : `${rule.config?.type}: ${rule.config?.pattern}`}
        </Typography>
        <Box><Chip label={rule.action === "block" ? "Blocked" : "Masked"} size="small" /></Box>
      </Stack>
      <Stack direction="row" alignItems="center" gap="8px">
        <Toggle
          checked={rule.is_active}
          onChange={() => handleToggle(rule.id, rule.is_active)}
          size="small"
        />
        <IconButton size="small" onClick={() => handleDelete(rule.id)} sx={{ p: 0.5 }}>
          <Trash2 size={14} strokeWidth={1.5} color={palette.text.tertiary} />
        </IconButton>
      </Stack>
    </Stack>
  );

  return (
    <PageHeaderExtended
      title="Guardrails"
      description="Configure PII detection and content filtering rules for your AI Gateway."
      tipBoxEntity="ai-gateway-guardrails"
      helpArticlePath="ai-gateway/guardrails"
      actionButton={
        <CustomizableButton
          text="Test guardrails"
          icon={<FlaskConical size={14} strokeWidth={1.5} />}
          onClick={() => {
            setTestText("");
            setTestResult(null);
            setIsTestOpen(true);
          }}
        />
      }
    >
      {/* PII Detection Section */}
      <Box sx={cardSx}>
        <Stack gap="12px">
          <Stack gap="8px">
            <Typography sx={sectionTitleSx}>PII detection</Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Typography sx={{ fontSize: 13, color: palette.text.tertiary, maxWidth: "75%" }}>
                Detect and protect personal data such as emails, phone numbers, credit cards, and names. PII scanning runs in-process within your gateway — no data is sent to external services.
              </Typography>
              <CustomizableButton
                text="Add PII rule"
                icon={<CirclePlus size={14} strokeWidth={1.5} />}
                onClick={() => {
                  setPiiForm({ name: "", entity: "EMAIL_ADDRESS", action: "block" });
                  setIsPiiModalOpen(true);
                }}
              />
            </Stack>
          </Stack>

          {loading ? null : piiRules.length === 0 ? (
            <EmptyState
              icon={Fingerprint}
              message="No PII detection rules configured. Add rules to automatically detect and protect personal data in AI requests."
              showBorder
            >
              <EmptyStateTip
                icon={Lock}
                title="In-process PII scanning"
                description="PII detection runs within your gateway infrastructure. No data is sent to external services for scanning. Supports email, phone, credit card, names, IBAN, Turkish TCKN, and more."
              />
              <EmptyStateTip
                icon={ShieldCheck}
                title="Block or mask detected PII"
                description="Block requests containing personal data, or mask it with placeholders (e.g., <EMAIL_ADDRESS>) before sending to the LLM. Input is scanned before the model sees it."
              />
            </EmptyState>
          ) : (
            <Stack gap="8px">
              {piiRules.map(renderRuleRow)}
            </Stack>
          )}
        </Stack>
      </Box>

      {/* Content Filter Section */}
      <Box sx={cardSx}>
        <Stack gap="12px">
          <Stack gap="8px">
            <Typography sx={sectionTitleSx}>Content filter</Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Typography sx={{ fontSize: 13, color: palette.text.tertiary, maxWidth: "75%" }}>
                Block or mask content matching specific keywords or regex patterns. Use keywords for exact terms and regex for format detection (e.g., project codes, internal URLs).
              </Typography>
              <CustomizableButton
                text="Add filter rule"
                icon={<CirclePlus size={14} strokeWidth={1.5} />}
                onClick={() => {
                  setCfForm({ name: "", type: "keyword", pattern: "", action: "block" });
                  setCfError("");
                  setIsCfModalOpen(true);
                }}
              />
            </Stack>
          </Stack>

          {loading ? null : cfRules.length === 0 ? (
            <EmptyState
              icon={Filter}
              message="No content filter rules configured. Add keyword or regex rules to block or mask prohibited content."
              showBorder
            >
              <EmptyStateTip
                icon={ScanLine}
                title="Keyword and regex matching"
                description="Block specific words (exact match with word boundaries) or define custom regex patterns to catch formats like internal project codes, employee IDs, or confidential terms."
              />
              <EmptyStateTip
                icon={FileWarning}
                title="Runs on every request, zero latency"
                description="Content filters execute in-process with no external API calls. Rules are evaluated before the request reaches the LLM provider."
              />
            </EmptyState>
          ) : (
            <Stack gap="8px">
              {cfRules.map(renderRuleRow)}
            </Stack>
          )}
        </Stack>
      </Box>

      {/* ─── Add PII Rule Modal ─────────────────────────────────────────── */}
      <StandardModal
        isOpen={isPiiModalOpen}
        onClose={() => setIsPiiModalOpen(false)}
        title="Add PII detection rule"
        description="Configure which personal data types to detect"
        onSubmit={handleCreatePii}
        submitButtonText="Add rule"
        isSubmitting={piiSubmitting}
        maxWidth="480px"
      >
        <Stack gap="16px">
          <Field
            label="Rule name"
            placeholder="e.g., Block credit cards"
            value={piiForm.name}
            onChange={(e) => setPiiForm((p) => ({ ...p, name: e.target.value }))}
            isRequired
          />
          <Select
            id="pii-entity"
            label="Entity type"
            placeholder="Select entity"
            value={piiForm.entity}
            items={PII_ENTITY_OPTIONS}
            onChange={(e) => setPiiForm((p) => ({ ...p, entity: e.target.value as string }))}
            getOptionValue={(item) => item._id}
          />
          <Select
            id="pii-action"
            label="Action"
            placeholder="Select action"
            value={piiForm.action}
            items={ACTION_ITEMS}
            onChange={(e) => setPiiForm((p) => ({ ...p, action: e.target.value as string }))}
            getOptionValue={(item) => item._id}
          />
          {piiForm.action === "mask" && (
            <Typography sx={{ fontSize: 12, color: palette.status.warning?.text || palette.text.tertiary, lineHeight: 1.5 }}>
              Masking replaces personal data with placeholders before sending to the model. The response may be less relevant. Consider using "Block" for input scanning.
            </Typography>
          )}
        </Stack>
      </StandardModal>

      {/* ─── Add Content Filter Rule Modal ──────────────────────────────── */}
      <StandardModal
        isOpen={isCfModalOpen}
        onClose={() => setIsCfModalOpen(false)}
        title="Add content filter rule"
        description="Block or mask content matching a keyword or regex pattern"
        onSubmit={handleCreateCf}
        submitButtonText="Add rule"
        isSubmitting={cfSubmitting}
        maxWidth="480px"
      >
        <Stack gap="16px">
          <Field
            label="Rule name"
            placeholder="e.g., Block competitor names"
            value={cfForm.name}
            onChange={(e) => setCfForm((p) => ({ ...p, name: e.target.value }))}
            isRequired
          />
          <Select
            id="cf-type"
            label="Match type"
            placeholder="Select type"
            value={cfForm.type}
            items={FILTER_TYPE_ITEMS}
            onChange={(e) => setCfForm((p) => ({ ...p, type: e.target.value as string }))}
            getOptionValue={(item) => item._id}
          />
          <Field
            label={cfForm.type === "keyword" ? "Keyword" : "Regex pattern"}
            placeholder={cfForm.type === "keyword" ? "e.g., confidential" : "e.g., PROJECT-\\d{6}"}
            value={cfForm.pattern}
            onChange={(e) => setCfForm((p) => ({ ...p, pattern: e.target.value }))}
            isRequired
          />
          <Select
            id="cf-action"
            label="Action"
            placeholder="Select action"
            value={cfForm.action}
            items={ACTION_ITEMS}
            onChange={(e) => setCfForm((p) => ({ ...p, action: e.target.value as string }))}
            getOptionValue={(item) => item._id}
          />
          {cfForm.action === "mask" && (
            <Typography sx={{ fontSize: 12, color: palette.status.warning?.text || palette.text.tertiary, lineHeight: 1.5 }}>
              Masking replaces matched content with [REDACTED] before sending to the model. The response may be less relevant. Consider using "Block" for input scanning.
            </Typography>
          )}
          {cfError && (
            <Typography sx={{ fontSize: 12, color: palette.status.error.text }}>
              {cfError}
            </Typography>
          )}
        </Stack>
      </StandardModal>

      {/* ─── Test Guardrails Modal ──────────────────────────────────────── */}
      <StandardModal
        isOpen={isTestOpen}
        onClose={() => setIsTestOpen(false)}
        title="Test guardrails"
        description="Paste sample text to preview what your active guardrail rules would detect"
        onSubmit={handleTest}
        submitButtonText={testLoading ? "Scanning..." : "Run test"}
        isSubmitting={testLoading}
        maxWidth="560px"
      >
        <Stack gap="16px">
          <Field
            label="Sample text"
            placeholder="e.g., My email is john@example.com and my credit card is 4111-1111-1111-1111"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            isRequired
          />
          {testResult && !testResult.error && (
            <Box
              sx={{
                p: "12px 16px",
                border: `1px solid ${testResult.would_block ? palette.status.error.text : palette.border.light}`,
                borderRadius: "4px",
                backgroundColor: testResult.would_block ? `${palette.status.error.text}08` : palette.background.alt,
              }}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
                {testResult.would_block ? "Would be blocked" : testResult.detections?.length > 0 ? "Detections found" : "No detections"}
              </Typography>
              {testResult.detections?.map((d: any, i: number) => (
                <Typography key={i} sx={{ fontSize: 12, color: palette.text.tertiary, mb: 0.5 }}>
                  {d.entity_type}: "{d.matched_text}" → {d.action}
                </Typography>
              ))}
              {testResult.masked_preview && (
                <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${palette.border.light}` }}>
                  <Typography sx={{ fontSize: 11, color: palette.text.disabled, mb: 0.5 }}>Masked preview:</Typography>
                  <Typography sx={{ fontSize: 12, fontFamily: "monospace" }}>
                    {testResult.masked_preview}
                  </Typography>
                </Box>
              )}
              <Typography sx={{ fontSize: 11, color: palette.text.disabled, mt: 1 }}>
                {testResult.execution_time_ms}ms
              </Typography>
            </Box>
          )}
          {testResult?.error && (
            <Typography sx={{ fontSize: 12, color: palette.status.error.text }}>
              {testResult.error}
            </Typography>
          )}
        </Stack>
      </StandardModal>
    </PageHeaderExtended>
  );
}
