/**
 * @fileoverview AI Detection Scan Details Page
 *
 * Page for viewing detailed scan results and findings.
 * Includes separate tabs for Libraries and Security findings.
 *
 * @module pages/AIDetection/ScanDetailsPage
 */

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, Typography, Collapse, IconButton, Tooltip, Popover } from "@mui/material";
import { TabContext } from "@mui/lab";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FileCode,
  CheckCircle2,
  ShieldCheck,
  Info,
  Package,
  AlertCircle,
  Eye,
  ThumbsUp,
  Flag,
  MoreHorizontal,
  Download,
  Network,
  Scale,
  FileText,
} from "lucide-react";
import { CustomizableButton } from "../../components/button/customizable-button";
import Chip from "../../components/Chip";
import TabBar from "../../components/TabBar";
import { VWLink } from "../../components/Link";
import { PageHeaderExtended } from "../../components/Layout/PageHeaderExtended";
// AI provider icons - lightweight local components (no external dependencies)
import { PROVIDER_ICONS } from "../../components/ProviderIcons";
// ML framework logos - for providers without lobehub icons
import scikitLearnLogo from "../../assets/ml-logos/scikit.png";
import numpyLogo from "../../assets/ml-logos/numpy.svg";
import pandasLogo from "../../assets/ml-logos/pandas.png";
import matplotlibLogo from "../../assets/ml-logos/matplotlib.png";
import mxnetLogo from "../../assets/ml-logos/mxnet.svg";
import scipyLogo from "../../assets/ml-logos/scipy.svg";
import daskLogo from "../../assets/ml-logos/dask.svg";
import qdrantLogo from "../../assets/ml-logos/qdrant.svg";
import chromaLogo from "../../assets/ml-logos/chroma.png";
import pineconeLogo from "../../assets/ml-logos/pinecone.png";
import weaviateLogo from "../../assets/ml-logos/weaviate.png";
import {
  getScan,
  getScanFindings,
  getScanSecurityFindings,
  getScanSecuritySummary,
  updateFindingGovernanceStatus,
  exportAIBOM,
  getComplianceMapping,
} from "../../../application/repository/aiDetection.repository";
import {
  ScanResponse,
  Finding,
  ConfidenceLevel,
  RiskLevel,
  SecurityFinding,
  SecuritySeverity,
  SecuritySummary,
  GovernanceStatus,
  ComplianceMappingResponse,
  ComplianceCategory,
} from "../../../domain/ai-detection/types";
import { formatDistanceToNow } from "date-fns";
import AIDepGraphModal from "../../components/AIDepGraphModal";
import { palette } from "../../themes/palette";

type TabValue =
  | "libraries"
  | "security"
  | "api-calls"
  | "secrets"
  | "models"
  | "rag"
  | "agents"
  | "compliance";


// ============================================================================
// Configuration
// ============================================================================

const CONFIDENCE_CHIP_VARIANT: Record<ConfidenceLevel, "high" | "medium" | "low"> = {
  high: "high",
  medium: "medium",
  low: "low",
};

const SEVERITY_CHIP_VARIANT: Record<SecuritySeverity, "critical" | "high" | "medium" | "low"> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
};

const SEVERITY_BORDER_COLORS: Record<SecuritySeverity, string> = {
  critical: palette.risk.critical.border,
  high: palette.risk.high.border,
  medium: palette.risk.medium.border,
  low: palette.status.info.border,
};

const CONFIDENCE_TOOLTIPS: Record<ConfidenceLevel, string> = {
  high: "The scanner is very confident this is an actual AI/ML library being used (e.g., direct import of tensorflow, pytorch, openai, etc.)",
  medium: "The scanner found patterns that likely indicate AI/ML usage but with less certainty",
  low: "The scanner found patterns that might indicate AI/ML usage but could be false positives",
};

const RISK_LEVEL_CONFIG: Record<RiskLevel, { label: string; color: string; bgColor: string; tooltip: string }> = {
  high: {
    label: "High risk",
    color: palette.status.error.text,
    bgColor: palette.status.error.bg,
    tooltip: "Data sent to external cloud APIs. Risk of data leakage, vendor lock-in, and compliance violations.",
  },
  medium: {
    label: "Medium risk",
    color: palette.status.warning.text,
    bgColor: palette.status.warning.bg,
    tooltip: "Framework that can connect to cloud APIs depending on configuration. Review usage to assess actual risk.",
  },
  low: {
    label: "Low risk",
    color: palette.status.success.text,
    bgColor: palette.status.success.bg,
    tooltip: "Local processing only. Data stays on your infrastructure with minimal external exposure.",
  },
};

// License risk configuration for inline badge display
const LICENSE_RISK_CONFIG: Record<string, { label: string; color: string; bgColor: string; tooltip: string }> = {
  high: {
    label: "Restrictive",
    color: palette.risk.high.text,
    bgColor: palette.risk.high.bg,
    tooltip: "Restrictive license (GPL, AGPL, CC-NC). May require code disclosure or prohibit commercial use.",
  },
  medium: {
    label: "Moderate",
    color: palette.risk.medium.text,
    bgColor: palette.risk.medium.bg,
    tooltip: "Moderate restrictions (LGPL, MPL, CC-BY-SA). Some obligations but generally allows commercial use.",
  },
  low: {
    label: "Permissive",
    color: palette.risk.low.text,
    bgColor: palette.risk.low.bg,
    tooltip: "Permissive license (MIT, Apache, BSD). Minimal restrictions, allows commercial use.",
  },
  unknown: {
    label: "Unknown",
    color: palette.status.default.text,
    bgColor: palette.status.default.bg,
    tooltip: "License could not be determined. Verify manually before commercial use.",
  },
};

const SEVERITY_TOOLTIPS: Record<SecuritySeverity, string> = {
  critical: "Critical severity: Immediate action required. This finding indicates a severe security vulnerability that could lead to remote code execution or complete system compromise.",
  high: "High severity: Urgent attention needed. This finding indicates a significant security risk that should be addressed promptly.",
  medium: "Medium severity: Should be addressed. This finding indicates a moderate security concern that requires attention.",
  low: "Low severity: Consider addressing. This finding indicates a minor security concern or informational issue.",
};

const GOVERNANCE_STATUS_CONFIG: Record<GovernanceStatus, { label: string; color: string; icon: React.ElementType }> = {
  reviewed: { label: "Reviewed", color: palette.status.info.text, icon: Eye },
  approved: { label: "Approved", color: palette.status.success.text, icon: ThumbsUp },
  flagged: { label: "Flagged", color: palette.status.error.text, icon: Flag },
};

const COMPLIANCE_CATEGORY_CONFIG: Record<ComplianceCategory, { label: string; color: string; bgColor: string; description: string }> = {
  transparency: { label: "Transparency", color: palette.accent.blue.text, bgColor: palette.accent.blue.bg, description: "Requirements for making AI systems understandable to users and deployers" },
  documentation: { label: "Documentation", color: palette.accent.indigo.text, bgColor: palette.accent.indigo.bg, description: "Requirements for maintaining technical records of AI components" },
  risk_management: { label: "Risk management", color: palette.status.error.text, bgColor: palette.status.error.bg, description: "Requirements for identifying and mitigating AI-related risks" },
  data_governance: { label: "Data governance", color: palette.accent.teal.text, bgColor: palette.accent.teal.bg, description: "Requirements for managing data used by AI systems" },
  human_oversight: { label: "Human oversight", color: palette.accent.amber.text, bgColor: palette.accent.amber.bg, description: "Requirements for human control over AI decisions" },
  security: { label: "Security", color: palette.accent.pink.text, bgColor: palette.accent.pink.bg, description: "Requirements for protecting AI systems from attacks" },
  monitoring: { label: "Monitoring", color: palette.accent.purple.text, bgColor: palette.accent.purple.bg, description: "Requirements for ongoing observation of AI performance" },
  accountability: { label: "Accountability", color: palette.accent.teal.text, bgColor: palette.accent.teal.bg, description: "Requirements for quality management and responsibility" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bgColor: string; description: string }> = {
  high: { label: "High", color: palette.risk.high.text, bgColor: palette.risk.high.bg, description: "Address immediately - critical for compliance" },
  medium: { label: "Medium", color: palette.risk.medium.text, bgColor: palette.risk.medium.bg, description: "Address soon - important for compliance" },
  low: { label: "Low", color: palette.risk.low.text, bgColor: palette.risk.low.bg, description: "Address when possible - recommended for compliance" },
};

// EU AI Act article descriptions for tooltips
const ARTICLE_DESCRIPTIONS: Record<string, string> = {
  "Article 9": "Risk Management System - Requires identifying and mitigating risks throughout the AI lifecycle",
  "Article 9(2)": "Risk Management - Specifically covers third-party and dependency risks",
  "Article 10": "Data Governance - Requires quality datasets and proper data management",
  "Article 10(3)": "Data Governance - Covers data processing and preparation requirements",
  "Article 11": "Technical Documentation - Requires comprehensive documentation before market placement",
  "Article 11(1)": "Technical Documentation - Covers minimum content standards",
  "Article 13": "Transparency - AI systems must be transparent enough for users to interpret outputs",
  "Article 13(3)": "Transparency - Requires clear information about AI model capabilities",
  "Article 14": "Human Oversight - AI systems must allow effective human supervision",
  "Article 14(4)": "Human Oversight - Covers autonomy controls and intervention capabilities",
  "Article 15": "Security - AI systems must achieve appropriate accuracy, robustness, and cybersecurity",
  "Article 15(5)": "Security - Covers AI-specific vulnerabilities like data poisoning and adversarial attacks",
  "Article 17": "Quality Management - Requires documented quality management systems",
  "Article 50": "Transparency Obligations - Users must know when interacting with AI; synthetic content must be marked",
  "Article 72": "Post-Market Monitoring - Requires ongoing monitoring of AI systems after deployment",
};

// ============================================================================
// Provider Icon Mapping
// ============================================================================

// Icon components from local SVG files (SVGR)
const PROVIDER_ICON_COMPONENTS: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  // Cloud AI Providers
  "AI21 Labs": PROVIDER_ICONS.Ai21,
  "Anthropic": PROVIDER_ICONS.Anthropic,
  "Anyscale": PROVIDER_ICONS.Anyscale,
  "AssemblyAI": PROVIDER_ICONS.AssemblyAI,
  "AWS": PROVIDER_ICONS.Aws,
  "Baseten": PROVIDER_ICONS.Baseten,
  "Cerebras": PROVIDER_ICONS.Cerebras,
  "Cohere": PROVIDER_ICONS.Cohere,
  "DeepSeek": PROVIDER_ICONS.DeepSeek,
  "ElevenLabs": PROVIDER_ICONS.ElevenLabs,
  "Fireworks AI": PROVIDER_ICONS.Fireworks,
  "Google": PROVIDER_ICONS.Google,
  "Groq": PROVIDER_ICONS.Groq,
  "HuggingFace": PROVIDER_ICONS.HuggingFace,
  "Jina AI": PROVIDER_ICONS.Jina,
  "LangFuse": PROVIDER_ICONS.Langfuse,
  "LangSmith": PROVIDER_ICONS.LangSmith,
  "Lepton AI": PROVIDER_ICONS.LeptonAI,
  "Meta": PROVIDER_ICONS.Meta,
  "Microsoft": PROVIDER_ICONS.Microsoft,
  "Mistral": PROVIDER_ICONS.Mistral,
  "Nvidia": PROVIDER_ICONS.Nvidia,
  "Ollama": PROVIDER_ICONS.Ollama,
  "OpenAI": PROVIDER_ICONS.OpenAI,
  "OpenRouter": PROVIDER_ICONS.OpenRouter,
  "Perplexity": PROVIDER_ICONS.Perplexity,
  "Replicate": PROVIDER_ICONS.Replicate,
  "SambaNova": PROVIDER_ICONS.SambaNova,
  "Stability AI": PROVIDER_ICONS.Stability,
  "Together AI": PROVIDER_ICONS.Together,
  "Vercel": PROVIDER_ICONS.Vercel,
  "Voyage AI": PROVIDER_ICONS.Voyage,
  // AI/ML Frameworks
  "CrewAI": PROVIDER_ICONS.CrewAI,
  "LangChain": PROVIDER_ICONS.LangChain,
  "LlamaIndex": PROVIDER_ICONS.LlamaIndex,
  "Phidata": PROVIDER_ICONS.Phidata,
  "Pydantic AI": PROVIDER_ICONS.PydanticAI,
  // Local ML
  "vLLM": PROVIDER_ICONS.Vllm,
};

// SVG/PNG logo mappings for providers without lobehub icons
const PROVIDER_SVG_LOGOS: Record<string, string> = {
  // Local ML libraries
  "scikit-learn": scikitLearnLogo,
  "NumPy": numpyLogo,
  "Pandas": pandasLogo,
  "Matplotlib": matplotlibLogo,
  "MXNet": mxnetLogo,
  "SciPy": scipyLogo,
  "Dask": daskLogo,
  // Vector databases
  "Chroma": chromaLogo,
  "Pinecone": pineconeLogo,
  "Qdrant": qdrantLogo,
  "Weaviate": weaviateLogo,
};

function getProviderIcon(provider?: string, size: number = 16): React.ReactNode {
  if (!provider) return <Package size={size} color={palette.text.tertiary} strokeWidth={1.5} />;

  // Check for SVGR icon component first
  const IconComponent = PROVIDER_ICON_COMPONENTS[provider];
  if (IconComponent) return <IconComponent width={size} height={size} />;

  // Check for SVG/PNG logo
  const svgLogo = PROVIDER_SVG_LOGOS[provider];
  if (svgLogo) {
    return <img src={svgLogo} alt={provider} width={size} height={size} style={{ objectFit: "contain" }} />;
  }

  return <Package size={size} color={palette.text.tertiary} strokeWidth={1.5} />;
}

// ============================================================================
// File Path Item Component (with click-to-show code preview)
// ============================================================================

interface FilePathItemProps {
  path: string;
  lineNumber: number | null;
  matchedText: string;
  fileUrl: string | null;
}

function FilePathItem({ path, lineNumber, matchedText, fileUrl }: FilePathItemProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const hasCodeContext = matchedText && matchedText.includes("│");
  const hasContent = !!matchedText;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (hasContent) {
      event.preventDefault();
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const codePreviewContent = hasCodeContext ? (
    <Box
      sx={{
        backgroundColor: "#1e1e1e",
        color: "#d4d4d4",
        p: "12px",
        fontFamily: "monospace",
        fontSize: "11px",
        whiteSpace: "pre",
        maxWidth: "600px",
        overflow: "auto",
      }}
    >
      {matchedText}
    </Box>
  ) : matchedText ? (
    <Box
      sx={{
        backgroundColor: "#1e1e1e",
        color: "#ce9178",
        p: "8px 12px",
        fontFamily: "monospace",
        fontSize: "12px",
        maxWidth: "400px",
        wordBreak: "break-all",
      }}
    >
      {matchedText}
    </Box>
  ) : null;

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          py: 0.5,
          px: 1,
          fontFamily: "monospace",
          fontSize: 13,
          cursor: hasContent ? "pointer" : "default",
          "&:hover": hasContent ? {
            backgroundColor: palette.background.hover,
            "& .click-for-code-hint": { opacity: 0.7 },
          } : {},
          borderRadius: "4px",
          backgroundColor: anchorEl ? palette.border.light : "transparent",
        }}
      >
        {fileUrl ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              fontFamily: "monospace",
              color: palette.text.primary,
              wordBreak: "break-all",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            {path}
            {lineNumber && (
              <span style={{ color: palette.text.tertiary, marginLeft: "4px" }}>
                :{lineNumber}
              </span>
            )}
          </a>
        ) : (
          <span style={{ fontFamily: "monospace", color: palette.text.primary, wordBreak: "break-all" }}>
            {path}
            {lineNumber && (
              <span style={{ color: palette.text.tertiary, marginLeft: "4px" }}>
                :{lineNumber}
              </span>
            )}
          </span>
        )}
        {hasContent && (
          <Box
            component="span"
            className="click-for-code-hint"
            sx={{
              ml: "auto",
              color: palette.text.tertiary,
              fontSize: "11px",
              opacity: 0,
              transition: "opacity 0.15s ease",
            }}
          >
            (click for code)
          </Box>
        )}
      </Box>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        disableScrollLock={false}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              borderRadius: "6px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              overflow: "hidden",
              position: "fixed",
            },
          },
        }}
      >
        {codePreviewContent}
      </Popover>
    </>
  );
}

// ============================================================================
// Finding Row Component (for Library findings)
// ============================================================================

interface FindingRowProps {
  finding: Finding;
  repositoryOwner: string;
  repositoryName: string;
  scanId: number;
  onGovernanceChange?: (findingId: number, status: GovernanceStatus | null) => void;
}

function FindingRow({ finding, repositoryOwner, repositoryName, scanId, onGovernanceChange }: FindingRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [governanceAnchor, setGovernanceAnchor] = useState<HTMLElement | null>(null);
  const [localStatus, setLocalStatus] = useState<GovernanceStatus | null>(finding.governance_status || null);
  const [isUpdating, setIsUpdating] = useState(false);

  const getFileUrl = (filePath: string, lineNumber: number | null): string | null => {
    if (!repositoryOwner || !repositoryName) return null;
    const baseUrl = `https://github.com/${repositoryOwner}/${repositoryName}/blob/main/${filePath}`;
    return lineNumber ? `${baseUrl}#L${lineNumber}` : baseUrl;
  };

  const handleGovernanceClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setGovernanceAnchor(event.currentTarget);
  };

  const handleGovernanceClose = () => {
    setGovernanceAnchor(null);
  };

  const handleStatusChange = async (newStatus: GovernanceStatus | null) => {
    handleGovernanceClose();
    if (newStatus === localStatus) return;

    setIsUpdating(true);
    try {
      await updateFindingGovernanceStatus(scanId, finding.id, newStatus);
      setLocalStatus(newStatus);
      onGovernanceChange?.(finding.id, newStatus);
    } catch {
      // Revert to original status on failure - UI already reflects the local state
      setLocalStatus(finding.governance_status || null);
    } finally {
      setIsUpdating(false);
    }
  };

  const StatusIcon = localStatus ? GOVERNANCE_STATUS_CONFIG[localStatus].icon : MoreHorizontal;
  const statusColor = localStatus ? GOVERNANCE_STATUS_CONFIG[localStatus].color : palette.text.tertiary;

  return (
    <Box
      sx={{
        border: `1px solid ${palette.border.light}`,
        borderRadius: "4px",
        mb: "8px",
        backgroundColor: palette.background.main,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: "8px",
          cursor: "pointer",
          "&:hover": {
            backgroundColor: palette.background.accent,
          },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <IconButton size="small" sx={{ mr: 1 }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </IconButton>

        <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", mr: "8px" }}>
            {getProviderIcon(finding.provider, 32)}
          </Box>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {finding.name}
            </Typography>
            {finding.description && (
              <Typography variant="body2" sx={{ color: palette.text.tertiary, mt: 0.5 }}>
                {finding.description}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Risk Level Badge */}
          {finding.risk_level && (
            <Tooltip title={RISK_LEVEL_CONFIG[finding.risk_level].tooltip} arrow placement="top">
              <Box
                sx={{
                  px: "8px",
                  py: "2px",
                  borderRadius: "4px",
                  backgroundColor: RISK_LEVEL_CONFIG[finding.risk_level].bgColor,
                  border: `1px solid ${RISK_LEVEL_CONFIG[finding.risk_level].color}20`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: RISK_LEVEL_CONFIG[finding.risk_level].color,
                  }}
                >
                  {RISK_LEVEL_CONFIG[finding.risk_level].label}
                </Typography>
              </Box>
            </Tooltip>
          )}
          {/* License Badge */}
          {finding.license_id && finding.license_risk && (
            <Tooltip
              title={
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 12 }}>{finding.license_name || finding.license_id}</Typography>
                  <Typography sx={{ fontSize: 11, mt: 0.5 }}>
                    {LICENSE_RISK_CONFIG[finding.license_risk]?.tooltip || "License information available"}
                  </Typography>
                </Box>
              }
              arrow
              placement="top"
            >
              <Box
                sx={{
                  px: "8px",
                  py: "2px",
                  borderRadius: "4px",
                  backgroundColor: LICENSE_RISK_CONFIG[finding.license_risk]?.bgColor || palette.status.default.bg,
                  border: `1px solid ${LICENSE_RISK_CONFIG[finding.license_risk]?.color || palette.text.tertiary}20`,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Scale size={12} color={LICENSE_RISK_CONFIG[finding.license_risk]?.color || palette.text.tertiary} />
                <Typography
                  sx={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: LICENSE_RISK_CONFIG[finding.license_risk]?.color || palette.text.tertiary,
                  }}
                >
                  {finding.license_id}
                </Typography>
              </Box>
            </Tooltip>
          )}
          <Box sx={{ minWidth: 120, display: "flex", justifyContent: "center" }}>
            <Tooltip title={CONFIDENCE_TOOLTIPS[finding.confidence]} arrow placement="top">
              <span>
                <Chip
                  label={`${finding.confidence.charAt(0).toUpperCase() + finding.confidence.slice(1)} confidence`}
                  variant={CONFIDENCE_CHIP_VARIANT[finding.confidence]}
                  size="small"
                />
              </span>
            </Tooltip>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 85, justifyContent: "flex-end" }}>
            <FileCode size={14} color={palette.text.tertiary} />
            <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
              {finding.file_count} {finding.file_count === 1 ? "file" : "files"}
            </Typography>
          </Box>
          {/* Governance Status Button */}
          <Tooltip title={localStatus ? `Status: ${GOVERNANCE_STATUS_CONFIG[localStatus].label}` : "Set status"} arrow placement="top">
            <IconButton
              size="small"
              onClick={handleGovernanceClick}
              disabled={isUpdating}
              sx={{
                border: `1px solid ${palette.border.light}`,
                borderRadius: "4px",
                p: "4px",
                "&:hover": { backgroundColor: palette.background.hover },
              }}
            >
              <StatusIcon size={16} color={statusColor} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Governance Status Popover */}
      <Popover
        open={Boolean(governanceAnchor)}
        anchorEl={governanceAnchor}
        onClose={handleGovernanceClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              borderRadius: "4px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              border: `1px solid ${palette.border.light}`,
            },
          },
        }}
      >
        <Box sx={{ p: 1, minWidth: 140 }}>
          {(Object.entries(GOVERNANCE_STATUS_CONFIG) as [GovernanceStatus, typeof GOVERNANCE_STATUS_CONFIG[GovernanceStatus]][]).map(
            ([status, config]) => (
              <Box
                key={status}
                onClick={() => handleStatusChange(status)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: "6px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  backgroundColor: localStatus === status ? palette.background.hover : "transparent",
                  "&:hover": { backgroundColor: palette.background.hover },
                }}
              >
                <config.icon size={14} color={config.color} />
                <Typography sx={{ fontSize: "13px" }}>{config.label}</Typography>
              </Box>
            )
          )}
          {localStatus && (
            <>
              <Box sx={{ borderTop: `1px solid ${palette.border.light}`, my: 0.5 }} />
              <Box
                onClick={() => handleStatusChange(null)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  p: "6px 8px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  "&:hover": { backgroundColor: palette.background.hover },
                }}
              >
                <MoreHorizontal size={14} color={palette.text.tertiary} />
                <Typography sx={{ fontSize: "13px", color: palette.text.tertiary }}>Clear status</Typography>
              </Box>
            </>
          )}
        </Box>
      </Popover>

      {/* Expanded Content */}
      <Collapse in={expanded}>
        <Box sx={{ p: "8px", borderTop: `1px solid ${palette.border.light}` }}>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Found in:
          </Typography>
          <Box
            sx={{
              maxHeight: 200,
              overflow: "auto",
              backgroundColor: palette.background.accent,
              borderRadius: "4px",
              p: 1,
            }}
          >
            {finding.file_paths.slice(0, 20).map((fp, idx) => (
              <FilePathItem
                key={idx}
                path={fp.path}
                lineNumber={fp.line_number}
                matchedText={fp.matched_text}
                fileUrl={getFileUrl(fp.path, fp.line_number)}
              />
            ))}
            {finding.file_paths.length > 20 && (
              <Typography
                variant="body2"
                sx={{ color: palette.text.tertiary, fontStyle: "italic", mt: 1, px: 1 }}
              >
                And {finding.file_paths.length - 20} more files...
              </Typography>
            )}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

// ============================================================================
// Security Finding Row Component
// ============================================================================

interface SecurityFindingRowProps {
  finding: SecurityFinding;
  repositoryOwner: string;
  repositoryName: string;
}

function SecurityFindingRow({ finding, repositoryOwner, repositoryName }: SecurityFindingRowProps) {
  const [expanded, setExpanded] = useState(false);
  const borderColor = SEVERITY_BORDER_COLORS[finding.severity];

  const getFileUrl = (filePath: string, lineNumber: number | null): string | null => {
    if (!repositoryOwner || !repositoryName) return null;
    const baseUrl = `https://github.com/${repositoryOwner}/${repositoryName}/blob/main/${filePath}`;
    return lineNumber ? `${baseUrl}#L${lineNumber}` : baseUrl;
  };

  return (
    <Box
      sx={{
        border: `1px solid ${borderColor}`,
        borderRadius: "4px",
        mb: "8px",
        backgroundColor: palette.background.main,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          p: "8px",
          cursor: "pointer",
          "&:hover": {
            backgroundColor: palette.background.accent,
          },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <IconButton size="small" sx={{ mr: 1 }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </IconButton>

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography sx={{ fontSize: "13px", fontWeight: 500 }}>
              {finding.name}
            </Typography>
            <Typography sx={{ fontSize: "13px", color: palette.text.tertiary }}>
              in {finding.module_name}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 0.5 }}>
            <Typography sx={{ fontSize: "13px", color: palette.text.tertiary }}>
              {finding.cwe_id}
            </Typography>
            <Typography sx={{ fontSize: "13px", color: palette.text.tertiary }}>
              {finding.owasp_ml_id}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ minWidth: 75, display: "flex", justifyContent: "center" }}>
            <Tooltip title={SEVERITY_TOOLTIPS[finding.severity]} arrow placement="top">
              <span>
                <Chip
                  label={finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)}
                  variant={SEVERITY_CHIP_VARIANT[finding.severity]}
                  size="small"
                />
              </span>
            </Tooltip>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 85, justifyContent: "flex-end" }}>
            <FileCode size={14} color={palette.text.tertiary} />
            <Typography sx={{ fontSize: "13px", color: palette.text.tertiary }}>
              {finding.file_count} {finding.file_count === 1 ? "file" : "files"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Expanded Content */}
      <Collapse in={expanded}>
        <Box sx={{ p: "8px", borderTop: `1px solid ${palette.border.light}` }}>
          {/* Description */}
          {finding.description && (
            <Typography variant="body2" sx={{ color: palette.text.secondary, mb: "8px" }}>
              {finding.description}
            </Typography>
          )}

          {/* Security Details */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "8px",
              mb: "8px",
            }}
          >
            <Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, color: palette.text.secondary }}
              >
                CWE
              </Typography>
              <VWLink
                url={`https://cwe.mitre.org/data/definitions/${finding.cwe_id.replace("CWE-", "")}.html`}
                openInNewTab
              >
                {finding.cwe_id}: {finding.cwe_name}
              </VWLink>
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, color: palette.text.secondary }}
              >
                OWASP ML
              </Typography>
              <VWLink
                url="https://owasp.org/www-project-machine-learning-security-top-10/"
                openInNewTab
              >
                {finding.owasp_ml_id}: {finding.owasp_ml_name}
              </VWLink>
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, color: palette.text.secondary }}
              >
                Threat type
              </Typography>
              <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
                {finding.threat_type}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, color: palette.text.secondary }}
              >
                Operator
              </Typography>
              <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
                {finding.operator_name}
              </Typography>
            </Box>
          </Box>

          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Found in:
          </Typography>
          <Box
            sx={{
              maxHeight: 200,
              overflow: "auto",
              backgroundColor: palette.background.accent,
              borderRadius: "4px",
              p: 1,
            }}
          >
            {finding.file_paths.slice(0, 20).map((fp, idx) => (
              <FilePathItem
                key={idx}
                path={fp.path}
                lineNumber={fp.line_number}
                matchedText={fp.matched_text}
                fileUrl={getFileUrl(fp.path, fp.line_number)}
              />
            ))}
            {finding.file_paths.length > 20 && (
              <Typography
                variant="body2"
                sx={{ color: palette.text.tertiary, fontStyle: "italic", mt: 1, px: 1 }}
              >
                And {finding.file_paths.length - 20} more files...
              </Typography>
            )}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function ScanDetailsPage() {
  const navigate = useNavigate();
  const { scanId: scanIdParam, tab } = useParams<{ scanId: string; tab?: string }>();
  const scanId = parseInt(scanIdParam || "0", 10);
  const initialTab: TabValue = (tab as TabValue) || "libraries";
  const [scan, setScan] = useState<ScanResponse | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [apiCallFindings, setApiCallFindings] = useState<Finding[]>([]);
  const [secretFindings, setSecretFindings] = useState<Finding[]>([]);
  const [modelFindings, setModelFindings] = useState<Finding[]>([]);
  const [ragFindings, setRagFindings] = useState<Finding[]>([]);
  const [agentFindings, setAgentFindings] = useState<Finding[]>([]);
  const [securityFindings, setSecurityFindings] = useState<SecurityFinding[]>(
    []
  );
  const [securitySummary, setSecuritySummary] = useState<SecuritySummary | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Handle tab change with URL navigation
  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue as TabValue);
    navigate(`/ai-detection/scans/${scanId}/${newValue}`, { replace: true });
  };

  // Sync activeTab when initialTab changes (URL navigation)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [page, setPage] = useState(1);
  const [apiCallPage, setApiCallPage] = useState(1);
  const [secretPage, setSecretPage] = useState(1);
  const [modelPage, setModelPage] = useState(1);
  const [ragPage, setRagPage] = useState(1);
  const [agentPage, setAgentPage] = useState(1);
  const [securityPage, setSecurityPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [apiCallTotalPages, setApiCallTotalPages] = useState(1);
  const [secretTotalPages, setSecretTotalPages] = useState(1);
  const [modelTotalPages, setModelTotalPages] = useState(1);
  const [ragTotalPages, setRagTotalPages] = useState(1);
  const [agentTotalPages, setAgentTotalPages] = useState(1);
  const [securityTotalPages, setSecurityTotalPages] = useState(1);
  const [confidenceFilter, setConfidenceFilter] =
    useState<ConfidenceLevel | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SecuritySeverity | null>(
    null
  );
  const [isExporting, setIsExporting] = useState(false);
  const [showDepGraph, setShowDepGraph] = useState(false);
  const [complianceData, setComplianceData] = useState<ComplianceMappingResponse | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [expandedChecklist, setExpandedChecklist] = useState<Set<string>>(new Set());

  // Initial load - only loads scan data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [
          scanResponse,
          findingsResponse,
          apiCallFindingsResponse,
          secretFindingsResponse,
          modelFindingsResponse,
          ragFindingsResponse,
          agentFindingsResponse,
          securityFindingsResponse,
          summaryResponse,
        ] = await Promise.all([
          getScan(scanId),
          getScanFindings(scanId, { page: 1, limit: 50, finding_type: "library" }),
          getScanFindings(scanId, { page: 1, limit: 50, finding_type: "api_call" }),
          getScanFindings(scanId, { page: 1, limit: 50, finding_type: "secret" }),
          getScanFindings(scanId, { page: 1, limit: 50, finding_type: "model_ref" }),
          getScanFindings(scanId, { page: 1, limit: 50, finding_type: "rag_component" }),
          getScanFindings(scanId, { page: 1, limit: 50, finding_type: "agent" }),
          getScanSecurityFindings(scanId, { page: 1, limit: 50 }),
          getScanSecuritySummary(scanId),
        ]);
        setScan(scanResponse);
        setFindings(findingsResponse.findings);
        setTotalPages(findingsResponse.pagination.total_pages);
        setApiCallFindings(apiCallFindingsResponse.findings);
        setApiCallTotalPages(apiCallFindingsResponse.pagination.total_pages);
        setSecretFindings(secretFindingsResponse.findings);
        setSecretTotalPages(secretFindingsResponse.pagination.total_pages);
        setModelFindings(modelFindingsResponse.findings);
        setModelTotalPages(modelFindingsResponse.pagination.total_pages);
        setRagFindings(ragFindingsResponse.findings);
        setRagTotalPages(ragFindingsResponse.pagination.total_pages);
        setAgentFindings(agentFindingsResponse.findings);
        setAgentTotalPages(agentFindingsResponse.pagination.total_pages);
        setSecurityFindings(securityFindingsResponse.findings);
        setSecurityTotalPages(securityFindingsResponse.pagination.total_pages);
        setSecuritySummary(summaryResponse);
      } catch {
        // Error loading scan - component will show empty state
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [scanId]);

  // Reload library findings when page or filter changes
  useEffect(() => {
    if (!scan) return;

    const loadLibraryFindings = async () => {
      try {
        const findingsResponse = await getScanFindings(scanId, {
          page,
          limit: 50,
          confidence: confidenceFilter || undefined,
          finding_type: "library",
        });
        setFindings(findingsResponse.findings);
        setTotalPages(findingsResponse.pagination.total_pages);
      } catch {
        // Error loading findings - UI shows empty state
      }
    };

    loadLibraryFindings();
  }, [scanId, page, confidenceFilter, scan]);

  // Reload API call findings when page changes
  useEffect(() => {
    if (!scan) return;

    const loadApiCallFindings = async () => {
      try {
        const findingsResponse = await getScanFindings(scanId, {
          page: apiCallPage,
          limit: 50,
          finding_type: "api_call",
        });
        setApiCallFindings(findingsResponse.findings);
        setApiCallTotalPages(findingsResponse.pagination.total_pages);
      } catch {
        // Error loading findings - UI shows empty state
      }
    };

    loadApiCallFindings();
  }, [scanId, apiCallPage, scan]);

  // Reload secret findings when page changes
  useEffect(() => {
    if (!scan) return;

    const loadSecretFindings = async () => {
      try {
        const findingsResponse = await getScanFindings(scanId, {
          page: secretPage,
          limit: 50,
          finding_type: "secret",
        });
        setSecretFindings(findingsResponse.findings);
        setSecretTotalPages(findingsResponse.pagination.total_pages);
      } catch {
        // Error loading findings - UI shows empty state
      }
    };

    loadSecretFindings();
  }, [scanId, secretPage, scan]);

  // Reload model findings when page changes
  useEffect(() => {
    if (!scan) return;

    const loadModelFindings = async () => {
      try {
        const findingsResponse = await getScanFindings(scanId, {
          page: modelPage,
          limit: 50,
          finding_type: "model_ref",
        });
        setModelFindings(findingsResponse.findings);
        setModelTotalPages(findingsResponse.pagination.total_pages);
      } catch {
        // Error loading findings - UI shows empty state
      }
    };

    loadModelFindings();
  }, [scanId, modelPage, scan]);

  // Reload RAG findings when page changes
  useEffect(() => {
    if (!scan) return;

    const loadRagFindings = async () => {
      try {
        const findingsResponse = await getScanFindings(scanId, {
          page: ragPage,
          limit: 50,
          finding_type: "rag_component",
        });
        setRagFindings(findingsResponse.findings);
        setRagTotalPages(findingsResponse.pagination.total_pages);
      } catch {
        // Error loading findings - UI shows empty state
      }
    };

    loadRagFindings();
  }, [scanId, ragPage, scan]);

  // Reload agent findings when page changes
  useEffect(() => {
    if (!scan) return;

    const loadAgentFindings = async () => {
      try {
        const findingsResponse = await getScanFindings(scanId, {
          page: agentPage,
          limit: 50,
          finding_type: "agent",
        });
        setAgentFindings(findingsResponse.findings);
        setAgentTotalPages(findingsResponse.pagination.total_pages);
      } catch {
        // Error loading findings - UI shows empty state
      }
    };

    loadAgentFindings();
  }, [scanId, agentPage, scan]);

  // Reload security findings when page or filter changes
  useEffect(() => {
    if (!scan) return;

    const loadSecurityFindings = async () => {
      try {
        const [findingsResponse, summaryResponse] = await Promise.all([
          getScanSecurityFindings(scanId, {
            page: securityPage,
            limit: 50,
            severity: severityFilter || undefined,
          }),
          getScanSecuritySummary(scanId),
        ]);
        setSecurityFindings(findingsResponse.findings);
        setSecurityTotalPages(findingsResponse.pagination.total_pages);
        setSecuritySummary(summaryResponse);
      } catch {
        // Error loading findings - UI shows empty state
      }
    };

    loadSecurityFindings();
  }, [scanId, securityPage, severityFilter, scan]);

  // Load compliance data when tab is selected (lazy loading)
  useEffect(() => {
    if (activeTab !== "compliance" || !scan || complianceData) return;

    const loadComplianceData = async () => {
      setComplianceLoading(true);
      try {
        const data = await getComplianceMapping(scanId);
        setComplianceData(data);
      } catch {
        // Error loading compliance data - UI shows empty state
      } finally {
        setComplianceLoading(false);
      }
    };

    loadComplianceData();
  }, [activeTab, scanId, scan, complianceData]);

  const formatDuration = (ms?: number): string => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Handle AI-BOM export
  const handleExportAIBOM = async () => {
    if (!scan || isExporting) return;

    setIsExporting(true);
    try {
      const aiBomData = await exportAIBOM(scanId);

      // Create blob and download
      const blob = new Blob([JSON.stringify(aiBomData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ai-bom-${scan.scan.repository_owner}-${scan.scan.repository_name}-${scanId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Export failed - could show error toast here
      console.error("Failed to export AI-BOM");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && !scan) {
    return (
      <PageHeaderExtended title="Scan details">
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body1" sx={{ color: palette.text.tertiary }}>
            Loading scan details...
          </Typography>
        </Box>
      </PageHeaderExtended>
    );
  }

  if (!scan) {
    return (
      <PageHeaderExtended title="Scan details">
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="body1" sx={{ color: palette.status.error.text }}>
            Failed to load scan details
          </Typography>
        </Box>
      </PageHeaderExtended>
    );
  }

  return (
    <PageHeaderExtended
      title="Scan details"
      description={`${scan.scan.repository_owner}/${scan.scan.repository_name}`}
    >
      {/* Back Button */}
      <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
        <CustomizableButton
          text="Back to history"
          onClick={() => navigate("/ai-detection/history")}
          variant="text"
          startIcon={<ArrowLeft size={16} />}
          sx={{ mb: 3 }}
        />
      </Box>

      {/* Header */}
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            {scan.scan.status === "failed" ? (
              <AlertCircle size={24} color={palette.status.error.text} />
            ) : (
              <CheckCircle2 size={24} color={palette.status.success.text} />
            )}
            <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
              {scan.scan.repository_owner}/{scan.scan.repository_name}
            </Typography>
            {scan.scan.status === "failed" && (
              <Chip label="Failed" size="small" />
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: "28px" }}>
            <Typography variant="body2" sx={{ color: palette.text.primary, fontWeight: 500 }}>
              {formatDuration(scan.scan.duration_ms)}
            </Typography>
            <Typography sx={{ color: palette.border.dark, fontSize: "12px" }}>•</Typography>
            <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
              {scan.scan.status === "failed" ? "Failed" : "Scanned"}{" "}
              {formatDistanceToNow(new Date(scan.scan.created_at), {
                addSuffix: true,
              })}
            </Typography>
            <Typography sx={{ color: palette.border.dark, fontSize: "12px" }}>•</Typography>
            <Typography variant="body2" sx={{ color: palette.text.secondary }}>
              by {scan.scan.triggered_by.name}
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        {scan.scan.status === "completed" && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="View AI dependency graph" arrow placement="top">
              <span>
                <CustomizableButton
                  text="View graph"
                  onClick={() => setShowDepGraph(true)}
                  variant="outlined"
                  startIcon={<Network size={16} />}
                  sx={{ height: 34 }}
                />
              </span>
            </Tooltip>
            <Tooltip title="Export AI Bill of Materials (AI-BOM)" arrow placement="top">
              <span>
                <CustomizableButton
                  text="Export AI-BOM"
                  onClick={handleExportAIBOM}
                  variant="outlined"
                  startIcon={<Download size={16} />}
                  isDisabled={isExporting}
                  sx={{ height: 34 }}
                />
              </span>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* Error Message Alert */}
      {scan.scan.status === "failed" && scan.scan.error_message && (
        <Box
          sx={{
            mb: 4,
            p: 2,
            backgroundColor: palette.status.error.bg,
            border: `1px solid ${palette.status.error.border}`,
            borderRadius: "4px",
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
          }}
        >
          <AlertCircle size={20} color={palette.status.error.text} style={{ flexShrink: 0, marginTop: 2 }} />
          <Box>
            <Typography sx={{ fontSize: "14px", fontWeight: 600, color: palette.status.error.text, mb: 0.5 }}>
              Scan failed
            </Typography>
            <Typography sx={{ fontSize: "13px", color: palette.status.error.text }}>
              {scan.scan.error_message}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Tabs */}
      <TabContext value={activeTab}>
        <TabBar
          tabs={[
            {
              label: "Libraries",
              value: "libraries",
              icon: "Library",
              count: scan.summary.by_finding_type?.library || scan.summary.total,
              tooltip: "AI/ML libraries detected in this repository",
            },
            {
              label: "API calls",
              value: "api-calls",
              icon: "Globe",
              count: scan.summary.by_finding_type?.api_call || 0,
              tooltip: "External AI API calls found in the code",
            },
            {
              label: "Models",
              value: "models",
              icon: "Box",
              count: scan.summary.by_finding_type?.model_ref || 0,
              tooltip: "References to AI models in the codebase",
            },
            {
              label: "RAG",
              value: "rag",
              icon: "Database",
              count: scan.summary.by_finding_type?.rag_component || 0,
              tooltip: "Retrieval-augmented generation components",
            },
            {
              label: "Agents",
              value: "agents",
              icon: "Bot",
              count: scan.summary.by_finding_type?.agent || 0,
              tooltip: "Autonomous AI agent implementations",
            },
            {
              label: "Secrets",
              value: "secrets",
              icon: "Key",
              count: scan.summary.by_finding_type?.secret || 0,
              tooltip: "Exposed API keys and credentials",
            },
            {
              label: "Security",
              value: "security",
              icon: "Shield",
              count: securitySummary?.total || 0,
              tooltip: "Security vulnerabilities in AI dependencies",
            },
            {
              label: "Compliance",
              value: "compliance",
              icon: "ClipboardCheck",
              count: complianceData?.checklist?.length || 0,
              tooltip: "Regulatory compliance checks and mappings",
            },
          ]}
          activeTab={activeTab}
          onChange={handleTabChange}
        />

        {/* Libraries Tab */}
        {activeTab === "libraries" && (
          <Box sx={{ mt: "8px" }}>
            <Typography variant="body2" sx={{ color: palette.text.tertiary, mb: "16px" }}>
              AI and machine learning libraries detected in the repository. Click on a finding to see file locations.
            </Typography>
            {/* Summary Cards */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "8px",
                mb: "8px",
              }}
            >
              <Box
                sx={{
                  backgroundColor: palette.background.main,
                  border: `1px solid ${palette.border.dark}`,
                  borderRadius: "4px",
                  p: 2,
                  textAlign: "center",
                  cursor: "pointer",
                }}
                onClick={() => setConfidenceFilter(null)}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    color: confidenceFilter === null ? palette.brand.primary : palette.text.primary,
                  }}
                >
                  {scan.summary.total}
                </Typography>
                <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
                  Total findings
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: palette.status.error.bg,
                  border: `1px solid ${palette.status.error.border}`,
                  borderRadius: "4px",
                  p: 2,
                  textAlign: "center",
                  cursor: "pointer",
                }}
                onClick={() =>
                  setConfidenceFilter((f) => (f === "high" ? null : "high"))
                }
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    color: confidenceFilter === "high" ? palette.status.error.text : palette.text.primary,
                  }}
                >
                  {scan.summary.by_confidence.high}
                </Typography>
                <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
                  High confidence
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: palette.status.warning.bg,
                  border: `1px solid ${palette.status.warning.border}`,
                  borderRadius: "4px",
                  p: 2,
                  textAlign: "center",
                  cursor: "pointer",
                }}
                onClick={() =>
                  setConfidenceFilter((f) => (f === "medium" ? null : "medium"))
                }
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    color: confidenceFilter === "medium" ? palette.status.warning.text : palette.text.primary,
                  }}
                >
                  {scan.summary.by_confidence.medium}
                </Typography>
                <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
                  Medium confidence
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: palette.background.main,
                  border: `1px solid ${palette.border.dark}`,
                  borderRadius: "4px",
                  p: 2,
                  textAlign: "center",
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {scan.scan.files_scanned}
                </Typography>
                <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
                  Files scanned
                </Typography>
              </Box>
            </Box>

            {/* Findings List */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: "15px", fontWeight: 500, mt: "8px", mb: 2 }}>
                Detected libraries
              </Typography>

              {findings.length === 0 ? (
                <Box
                  sx={{
                    backgroundColor: palette.background.main,
                    border: `1px solid ${palette.border.dark}`,
                    borderRadius: "4px",
                    p: 4,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="body1" sx={{ color: palette.text.tertiary }}>
                    {confidenceFilter
                      ? `No ${confidenceFilter} confidence findings`
                      : "No AI/ML libraries detected"}
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {findings.map((finding) => (
                    <FindingRow
                      key={finding.id}
                      finding={finding}
                      repositoryOwner={scan.scan.repository_owner}
                      repositoryName={scan.scan.repository_name}
                      scanId={scanId}
                    />
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 1,
                        mt: 2,
                      }}
                    >
                      <CustomizableButton
                        text="Previous"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        isDisabled={page === 1}
                        variant="outlined"
                        sx={{ height: 34 }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ lineHeight: "34px", px: 2, color: palette.text.tertiary }}
                      >
                        Page {page} of {totalPages}
                      </Typography>
                      <CustomizableButton
                        text="Next"
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        isDisabled={page === totalPages}
                        variant="outlined"
                        sx={{ height: 34 }}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Box>

          </Box>
        )}

        {/* API Calls Tab */}
        {activeTab === "api-calls" && (
          <Box sx={{ mt: "8px" }}>
            <Typography variant="body2" sx={{ color: palette.text.tertiary, mb: "16px" }}>
              API calls to AI/ML services detected in the codebase. These represent active usage of AI models and services.
            </Typography>

            {/* Summary */}
            <Box
              sx={{
                backgroundColor: palette.background.main,
                border: `1px solid ${palette.border.dark}`,
                borderRadius: "4px",
                p: "16px",
                mb: "8px",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Info size={16} color={palette.text.tertiary} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {scan.summary.by_finding_type?.api_call || 0} API call{(scan.summary.by_finding_type?.api_call || 0) !== 1 ? "s" : ""} detected
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: palette.text.tertiary, mt: "8px" }}>
                All API call findings are marked as high confidence. These indicate direct integration with AI services.
              </Typography>
            </Box>

            {/* Findings List */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {apiCallFindings.map((finding) => (
                <FindingRow
                  key={finding.id}
                  finding={finding}
                  repositoryOwner={scan.scan.repository_owner}
                  repositoryName={scan.scan.repository_name}
                  scanId={scanId}
                />
              ))}
            </Box>

            {/* Empty State */}
            {apiCallFindings.length === 0 && (
              <Box
                sx={{
                  p: 4,
                  textAlign: "center",
                  backgroundColor: palette.background.accent,
                  borderRadius: "4px",
                  mt: "8px",
                }}
              >
                <Typography variant="body1" sx={{ color: palette.text.tertiary }}>
                  No API calls detected in this repository
                </Typography>
                <Typography variant="body2" sx={{ color: palette.text.accent, mt: 1 }}>
                  API calls to OpenAI, Anthropic, Google AI, and other AI services will appear here
                </Typography>
              </Box>
            )}

            {/* Pagination */}
            {apiCallTotalPages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                  mt: "16px",
                }}
              >
                <CustomizableButton
                  text="Previous"
                  onClick={() => setApiCallPage((p) => Math.max(1, p - 1))}
                  isDisabled={apiCallPage === 1}
                  variant="outlined"
                  sx={{ height: 34 }}
                />
                <Typography sx={{ lineHeight: "34px", color: palette.text.tertiary, fontSize: "13px" }}>
                  Page {apiCallPage} of {apiCallTotalPages}
                </Typography>
                <CustomizableButton
                  text="Next"
                  onClick={() => setApiCallPage((p) => Math.min(apiCallTotalPages, p + 1))}
                  isDisabled={apiCallPage === apiCallTotalPages}
                  variant="outlined"
                  sx={{ height: 34 }}
                />
              </Box>
            )}
          </Box>
        )}

        {/* Models Tab */}
        {activeTab === "models" && (
          <Box sx={{ mt: "8px" }}>
            <Typography variant="body2" sx={{ color: palette.text.tertiary, mb: "16px" }}>
              Pre-trained AI/ML model references detected in the codebase. These include Hugging Face models, Ollama models, and other model identifiers.
            </Typography>

            {/* Summary */}
            <Box
              sx={{
                backgroundColor: palette.background.main,
                border: `1px solid ${palette.border.dark}`,
                borderRadius: "4px",
                p: "16px",
                mb: "8px",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Package size={16} color={palette.text.tertiary} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {scan.summary.by_finding_type?.model_ref || 0} model reference{(scan.summary.by_finding_type?.model_ref || 0) !== 1 ? "s" : ""} detected
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: palette.text.tertiary, mt: "8px" }}>
                Model references indicate usage of pre-trained models from Hugging Face Hub, Ollama, and other sources.
              </Typography>
            </Box>

            {/* Findings List */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {modelFindings.map((finding) => (
                <FindingRow
                  key={finding.id}
                  finding={finding}
                  repositoryOwner={scan.scan.repository_owner}
                  repositoryName={scan.scan.repository_name}
                  scanId={scanId}
                />
              ))}
            </Box>

            {/* Empty State */}
            {modelFindings.length === 0 && (
              <Box
                sx={{
                  p: 4,
                  textAlign: "center",
                  backgroundColor: palette.background.accent,
                  borderRadius: "4px",
                  mt: "8px",
                }}
              >
                <Typography variant="body1" sx={{ color: palette.text.tertiary }}>
                  No model references detected in this repository
                </Typography>
                <Typography variant="body2" sx={{ color: palette.text.accent, mt: 1 }}>
                  References to Hugging Face models, Ollama models, and other pre-trained models will appear here
                </Typography>
              </Box>
            )}

            {/* Pagination */}
            {modelTotalPages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                  mt: "16px",
                }}
              >
                <CustomizableButton
                  text="Previous"
                  onClick={() => setModelPage((p) => Math.max(1, p - 1))}
                  isDisabled={modelPage === 1}
                  variant="outlined"
                  sx={{ height: 34 }}
                />
                <Typography sx={{ lineHeight: "34px", color: palette.text.tertiary, fontSize: "13px" }}>
                  Page {modelPage} of {modelTotalPages}
                </Typography>
                <CustomizableButton
                  text="Next"
                  onClick={() => setModelPage((p) => Math.min(modelTotalPages, p + 1))}
                  isDisabled={modelPage === modelTotalPages}
                  variant="outlined"
                  sx={{ height: 34 }}
                />
              </Box>
            )}
          </Box>
        )}

        {/* RAG Tab */}
        {activeTab === "rag" && (
          <Box sx={{ mt: "8px" }}>
            <Typography variant="body2" sx={{ color: palette.text.tertiary, mb: "16px" }}>
              RAG (Retrieval-Augmented Generation) pipeline components detected in the codebase. These include vector databases, document loaders, and embedding models.
            </Typography>

            {/* Summary */}
            <Box
              sx={{
                backgroundColor: palette.background.main,
                border: `1px solid ${palette.border.dark}`,
                borderRadius: "4px",
                p: "16px",
                mb: "8px",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Info size={16} color={palette.text.tertiary} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {scan.summary.by_finding_type?.rag_component || 0} RAG component{(scan.summary.by_finding_type?.rag_component || 0) !== 1 ? "s" : ""} detected
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: palette.text.tertiary, mt: "8px" }}>
                RAG components indicate usage of vector databases, document loaders, and embedding systems for retrieval-augmented generation.
              </Typography>
            </Box>

            {/* Findings List */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {ragFindings.map((finding) => (
                <FindingRow
                  key={finding.id}
                  finding={finding}
                  repositoryOwner={scan.scan.repository_owner}
                  repositoryName={scan.scan.repository_name}
                  scanId={scanId}
                />
              ))}
            </Box>

            {/* Empty State */}
            {ragFindings.length === 0 && (
              <Box
                sx={{
                  p: 4,
                  textAlign: "center",
                  backgroundColor: palette.background.accent,
                  borderRadius: "4px",
                  mt: "8px",
                }}
              >
                <Typography variant="body1" sx={{ color: palette.text.tertiary }}>
                  No RAG components detected in this repository
                </Typography>
                <Typography variant="body2" sx={{ color: palette.text.accent, mt: 1 }}>
                  Vector databases (Pinecone, Chroma, Qdrant), document loaders, and embedding models will appear here
                </Typography>
              </Box>
            )}

            {/* Pagination */}
            {ragTotalPages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                  mt: "16px",
                }}
              >
                <CustomizableButton
                  text="Previous"
                  onClick={() => setRagPage((p) => Math.max(1, p - 1))}
                  isDisabled={ragPage === 1}
                  variant="outlined"
                  sx={{ height: 34 }}
                />
                <Typography sx={{ lineHeight: "34px", color: palette.text.tertiary, fontSize: "13px" }}>
                  Page {ragPage} of {ragTotalPages}
                </Typography>
                <CustomizableButton
                  text="Next"
                  onClick={() => setRagPage((p) => Math.min(ragTotalPages, p + 1))}
                  isDisabled={ragPage === ragTotalPages}
                  variant="outlined"
                  sx={{ height: 34 }}
                />
              </Box>
            )}
          </Box>
        )}

        {/* Agents Tab */}
        {activeTab === "agents" && (
          <Box sx={{ mt: "8px" }}>
            <Typography variant="body2" sx={{ color: palette.text.tertiary, mb: "16px" }}>
              AI agent frameworks and autonomous systems detected in the codebase. These include LangChain agents, CrewAI, AutoGen, and MCP servers.
            </Typography>

            {/* Warning Box - agents carry high risk */}
            {agentFindings.length > 0 && (
              <Box
                sx={{
                  backgroundColor: palette.status.warning.bg,
                  border: `1px solid ${palette.status.warning.border}`,
                  borderRadius: "4px",
                  p: "16px",
                  mb: "16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <AlertCircle size={20} color={palette.status.warning.text} style={{ flexShrink: 0, marginTop: 2 }} />
                <Box>
                  <Typography sx={{ fontSize: "14px", fontWeight: 600, color: palette.status.warning.text, mb: 0.5 }}>
                    Autonomous AI systems detected
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: palette.status.warning.text }}>
                    AI agents can take autonomous actions and interact with external systems. Review these carefully for governance and security implications.
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Summary */}
            <Box
              sx={{
                backgroundColor: palette.background.main,
                border: `1px solid ${palette.border.dark}`,
                borderRadius: "4px",
                p: "16px",
                mb: "8px",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Info size={16} color={palette.text.tertiary} />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {scan.summary.by_finding_type?.agent || 0} agent framework{(scan.summary.by_finding_type?.agent || 0) !== 1 ? "s" : ""} detected
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: palette.text.tertiary, mt: "8px" }}>
                Agent findings are marked as high risk due to their autonomous nature and ability to interact with external systems.
              </Typography>
            </Box>

            {/* Findings List */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {agentFindings.map((finding) => (
                <FindingRow
                  key={finding.id}
                  finding={finding}
                  repositoryOwner={scan.scan.repository_owner}
                  repositoryName={scan.scan.repository_name}
                  scanId={scanId}
                />
              ))}
            </Box>

            {/* Empty State */}
            {agentFindings.length === 0 && (
              <Box
                sx={{
                  p: 4,
                  textAlign: "center",
                  backgroundColor: palette.background.accent,
                  borderRadius: "4px",
                  mt: "8px",
                }}
              >
                <Typography variant="body1" sx={{ color: palette.text.tertiary }}>
                  No AI agents detected in this repository
                </Typography>
                <Typography variant="body2" sx={{ color: palette.text.accent, mt: 1 }}>
                  LangChain agents, CrewAI, AutoGen, MCP servers, and other autonomous AI systems will appear here
                </Typography>
              </Box>
            )}

            {/* Pagination */}
            {agentTotalPages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                  mt: "16px",
                }}
              >
                <CustomizableButton
                  text="Previous"
                  onClick={() => setAgentPage((p) => Math.max(1, p - 1))}
                  isDisabled={agentPage === 1}
                  variant="outlined"
                  sx={{ height: 34 }}
                />
                <Typography sx={{ lineHeight: "34px", color: palette.text.tertiary, fontSize: "13px" }}>
                  Page {agentPage} of {agentTotalPages}
                </Typography>
                <CustomizableButton
                  text="Next"
                  onClick={() => setAgentPage((p) => Math.min(agentTotalPages, p + 1))}
                  isDisabled={agentPage === agentTotalPages}
                  variant="outlined"
                  sx={{ height: 34 }}
                />
              </Box>
            )}
          </Box>
        )}

        {/* Secrets Tab */}
        {activeTab === "secrets" && (
          <Box sx={{ mt: "8px" }}>
            <Typography variant="body2" sx={{ color: palette.text.tertiary, mb: "16px" }}>
              Hardcoded API keys and secrets detected in the codebase. These should be moved to environment variables or a secrets manager.
            </Typography>

            {/* Warning Box - only show when secrets are found */}
            {secretFindings.length > 0 && (
              <Box
                sx={{
                  backgroundColor: palette.status.error.bg,
                  border: `1px solid ${palette.status.error.border}`,
                  borderRadius: "4px",
                  p: "16px",
                  mb: "16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <AlertCircle size={20} color={palette.status.error.text} style={{ flexShrink: 0, marginTop: 2 }} />
                <Box>
                  <Typography sx={{ fontSize: "14px", fontWeight: 600, color: palette.status.error.text, mb: 0.5 }}>
                    Security risk detected
                  </Typography>
                  <Typography sx={{ fontSize: "13px", color: palette.status.error.text }}>
                    Hardcoded secrets in source code can be exposed if the repository is made public or accessed by unauthorized users.
                    Rotate any exposed credentials immediately.
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Findings List */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {secretFindings.map((finding) => (
                <FindingRow
                  key={finding.id}
                  finding={finding}
                  repositoryOwner={scan.scan.repository_owner}
                  repositoryName={scan.scan.repository_name}
                  scanId={scanId}
                />
              ))}
            </Box>

            {/* Empty State - only show when no secrets found */}
            {secretFindings.length === 0 && (
              <Box
                sx={{
                  p: "16px",
                  textAlign: "center",
                  backgroundColor: palette.status.success.bg,
                  border: `1px solid ${palette.status.success.border}`,
                  borderRadius: "4px",
                  mt: "8px",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                  <ShieldCheck size={48} color={palette.status.success.text} />
                </Box>
                <Typography sx={{ fontSize: "14px", fontWeight: 500, color: palette.status.success.text, mb: 1 }}>
                  No hardcoded secrets detected
                </Typography>
                <Typography sx={{ fontSize: "13px", color: palette.text.tertiary }}>
                  No API keys, tokens, or other secrets were found in the scanned code.
                </Typography>
              </Box>
            )}

            {/* Pagination */}
            {secretTotalPages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 2,
                  mt: "16px",
                }}
              >
                <CustomizableButton
                  text="Previous"
                  onClick={() => setSecretPage((p) => Math.max(1, p - 1))}
                  isDisabled={secretPage === 1}
                  variant="outlined"
                  sx={{ height: 34 }}
                />
                <Typography sx={{ lineHeight: "34px", color: palette.text.tertiary, fontSize: "13px" }}>
                  Page {secretPage} of {secretTotalPages}
                </Typography>
                <CustomizableButton
                  text="Next"
                  onClick={() => setSecretPage((p) => Math.min(secretTotalPages, p + 1))}
                  isDisabled={secretPage === secretTotalPages}
                  variant="outlined"
                  sx={{ height: 34 }}
                />
              </Box>
            )}
          </Box>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <Box sx={{ mt: "8px" }}>
            <Typography variant="body2" sx={{ color: palette.text.tertiary, mb: "16px" }}>
              Security vulnerabilities found in model files. Serialized models can contain malicious code that executes when loaded.
            </Typography>
            {/* Security Summary Cards */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "8px",
                mb: "8px",
              }}
            >
              <Box
                sx={{
                  backgroundColor: palette.background.main,
                  border: `1px solid ${palette.border.dark}`,
                  borderRadius: "4px",
                  p: 2,
                  textAlign: "center",
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {securitySummary?.total || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
                  Total findings
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: palette.status.error.bg,
                  border: `1px solid ${palette.status.error.border}`,
                  borderRadius: "4px",
                  p: 2,
                  textAlign: "center",
                  cursor: "pointer",
                }}
                onClick={() =>
                  setSeverityFilter((f) => (f === "critical" ? null : "critical"))
                }
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    color:
                      severityFilter === "critical" ? palette.status.error.text : palette.text.primary,
                  }}
                >
                  {securitySummary?.by_severity.critical || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
                  Critical
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: palette.risk.high.bg,
                  border: `1px solid ${palette.risk.high.border}`,
                  borderRadius: "4px",
                  p: 2,
                  textAlign: "center",
                  cursor: "pointer",
                }}
                onClick={() =>
                  setSeverityFilter((f) => (f === "high" ? null : "high"))
                }
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    color:
                      severityFilter === "high" ? palette.risk.high.text : palette.text.primary,
                  }}
                >
                  {securitySummary?.by_severity.high || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
                  High
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: palette.status.warning.bg,
                  border: `1px solid ${palette.status.warning.border}`,
                  borderRadius: "4px",
                  p: 2,
                  textAlign: "center",
                  cursor: "pointer",
                }}
                onClick={() =>
                  setSeverityFilter((f) => (f === "medium" ? null : "medium"))
                }
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    color:
                      severityFilter === "medium" ? palette.status.warning.text : palette.text.primary,
                  }}
                >
                  {securitySummary?.by_severity.medium || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
                  Medium
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: palette.status.info.bg,
                  border: `1px solid ${palette.status.info.border}`,
                  borderRadius: "4px",
                  p: 2,
                  textAlign: "center",
                  cursor: "pointer",
                }}
                onClick={() =>
                  setSeverityFilter((f) => (f === "low" ? null : "low"))
                }
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    color:
                      severityFilter === "low" ? palette.status.info.text : palette.text.primary,
                  }}
                >
                  {securitySummary?.by_severity.low || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
                  Low
                </Typography>
              </Box>
            </Box>

            {/* Security Findings List */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: "15px", fontWeight: 500, mt: "8px", mb: 2 }}>
                Security findings
              </Typography>

              {securityFindings.length === 0 ? (
                <Box
                  sx={{
                    backgroundColor: palette.status.success.bg,
                    border: `1px solid ${palette.status.success.border}`,
                    borderRadius: "4px",
                    p: 4,
                    textAlign: "center",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      mb: 2,
                    }}
                  >
                    <ShieldCheck size={48} color={palette.status.success.text} />
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 500, color: palette.status.success.text, mb: 1 }}
                  >
                    {severityFilter
                      ? `No ${severityFilter} severity findings`
                      : "No security issues detected"}
                  </Typography>
                  {!severityFilter && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.5,
                        mt: 1,
                      }}
                    >
                      <Info size={14} color={palette.text.tertiary} />
                      <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
                        Note: This scan checks for known malicious patterns only.
                        A clean result does not guarantee the model is safe.
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box>
                  {securityFindings.map((finding) => (
                    <SecurityFindingRow
                      key={finding.id}
                      finding={finding}
                      repositoryOwner={scan.scan.repository_owner}
                      repositoryName={scan.scan.repository_name}
                    />
                  ))}

                  {/* Pagination */}
                  {securityTotalPages > 1 && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 1,
                        mt: 2,
                      }}
                    >
                      <CustomizableButton
                        text="Previous"
                        onClick={() =>
                          setSecurityPage((p) => Math.max(1, p - 1))
                        }
                        isDisabled={securityPage === 1}
                        variant="outlined"
                        sx={{ height: 34 }}
                      />
                      <Typography
                        variant="body2"
                        sx={{ lineHeight: "34px", px: 2, color: palette.text.tertiary }}
                      >
                        Page {securityPage} of {securityTotalPages}
                      </Typography>
                      <CustomizableButton
                        text="Next"
                        onClick={() =>
                          setSecurityPage((p) =>
                            Math.min(securityTotalPages, p + 1)
                          )
                        }
                        isDisabled={securityPage === securityTotalPages}
                        variant="outlined"
                        sx={{ height: 34 }}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            {/* Model files scanned info */}
            {securitySummary && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
                  {securitySummary.model_files_scanned} model{" "}
                  {securitySummary.model_files_scanned === 1 ? "file" : "files"}{" "}
                  scanned
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Compliance Tab */}
        {activeTab === "compliance" && (
          <Box sx={{ mt: "8px" }}>
            <Typography variant="body2" sx={{ color: palette.text.tertiary, mb: "16px" }}>
              EU AI Act compliance mapping based on detected AI components. Review these requirements to ensure your AI system meets regulatory obligations.
            </Typography>

            {complianceLoading ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" sx={{ color: palette.text.tertiary }}>
                  Loading compliance data...
                </Typography>
              </Box>
            ) : !complianceData ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body1" sx={{ color: palette.text.tertiary }}>
                  Unable to load compliance data
                </Typography>
              </Box>
            ) : (
              <>
                {/* Summary Cards */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "8px",
                    mb: "16px",
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: palette.background.main,
                      border: `1px solid ${palette.border.dark}`,
                      borderRadius: "4px",
                      p: 2,
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>
                      {complianceData.summary.totalRequirements}
                    </Typography>
                    <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
                      Total requirements
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: palette.status.error.bg,
                      border: `1px solid ${palette.status.error.border}`,
                      borderRadius: "4px",
                      p: 2,
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 600, color: palette.status.error.text }}>
                      {complianceData.summary.byPriority.high}
                    </Typography>
                    <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
                      High priority
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: palette.status.warning.bg,
                      border: `1px solid ${palette.status.warning.border}`,
                      borderRadius: "4px",
                      p: 2,
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="h4" sx={{ fontWeight: 600, color: palette.status.warning.text }}>
                      {complianceData.summary.byPriority.medium}
                    </Typography>
                    <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
                      Medium priority
                    </Typography>
                  </Box>
                  <Tooltip
                    title="Percentage of EU AI Act requirements triggered by detected AI components"
                    arrow
                  >
                    <Box
                      sx={{
                        backgroundColor: palette.background.accent,
                        border: `1px solid ${palette.border.dark}`,
                        borderRadius: "4px",
                        p: 2,
                        textAlign: "center",
                        cursor: "help",
                      }}
                    >
                      <Typography variant="h4" sx={{ fontWeight: 600, color: palette.text.secondary }}>
                        {Math.round(complianceData.summary.coveragePercentage)}%
                      </Typography>
                      <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
                        Requirements scope
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>

                {/* Category breakdown */}
                <Box sx={{ mb: "16px" }}>
                  <Typography sx={{ fontSize: "15px", fontWeight: 500, mb: 2 }}>
                    Requirements by category
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {Object.entries(complianceData.summary.byCategory).map(([category, count]) => {
                      const config = COMPLIANCE_CATEGORY_CONFIG[category as ComplianceCategory];
                      if (!config || count === 0) return null;
                      return (
                        <Box
                          key={category}
                          sx={{
                            px: "12px",
                            py: "6px",
                            borderRadius: "4px",
                            backgroundColor: config.bgColor,
                            border: `1px solid ${config.color}30`,
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Typography sx={{ fontSize: "13px", fontWeight: 500, color: config.color }}>
                            {config.label}
                          </Typography>
                          <Typography sx={{ fontSize: "13px", color: config.color }}>
                            ({count})
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

                {/* Compliance Checklist */}
                <Box>
                  <Typography sx={{ fontSize: "15px", fontWeight: 500, mb: 2 }}>
                    Compliance checklist
                  </Typography>

                  {complianceData.checklist.length === 0 ? (
                    <Box
                      sx={{
                        backgroundColor: palette.status.success.bg,
                        border: `1px solid ${palette.status.success.border}`,
                        borderRadius: "4px",
                        p: 4,
                        textAlign: "center",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                        <CheckCircle2 size={48} color={palette.status.success.text} />
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: palette.status.success.text, mb: 1 }}>
                        No specific compliance actions needed
                      </Typography>
                      <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
                        Based on the scan results, no additional compliance requirements were identified.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {complianceData.checklist.map((item) => {
                        const priorityConfig = PRIORITY_CONFIG[item.priority];
                        const categoryConfig = COMPLIANCE_CATEGORY_CONFIG[item.category];
                        const isExpanded = expandedChecklist.has(item.id);

                        return (
                          <Box
                            key={item.id}
                            sx={{
                              border: `1px solid ${palette.border.light}`,
                              borderRadius: "4px",
                              backgroundColor: palette.background.main,
                            }}
                          >
                            {/* Checklist item header */}
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "flex-start",
                                p: "12px",
                                cursor: "pointer",
                                "&:hover": { backgroundColor: palette.background.accent },
                              }}
                              onClick={() => {
                                const newSet = new Set(expandedChecklist);
                                if (isExpanded) {
                                  newSet.delete(item.id);
                                } else {
                                  newSet.add(item.id);
                                }
                                setExpandedChecklist(newSet);
                              }}
                            >
                              <IconButton size="small" sx={{ mr: 1, mt: "-4px" }}>
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              </IconButton>

                              <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: "14px", fontWeight: 500, mb: "4px" }}>
                                  {item.text}
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                  {/* Article reference with tooltip */}
                                  <Tooltip
                                    title={ARTICLE_DESCRIPTIONS[item.articleRef] || `EU AI Act ${item.articleRef}`}
                                    arrow
                                    placement="top"
                                  >
                                    <Box
                                      sx={{
                                        px: "6px",
                                        py: "2px",
                                        borderRadius: "4px",
                                        backgroundColor: palette.status.default.bg,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        cursor: "help",
                                      }}
                                    >
                                      <FileText size={12} color={palette.text.tertiary} />
                                      <Typography sx={{ fontSize: "11px", color: palette.text.tertiary }}>
                                        {item.articleRef}
                                      </Typography>
                                    </Box>
                                  </Tooltip>
                                  {/* Category badge with tooltip */}
                                  {categoryConfig && (
                                    <Tooltip title={categoryConfig.description} arrow placement="top">
                                      <Box
                                        sx={{
                                          px: "6px",
                                          py: "2px",
                                          borderRadius: "4px",
                                          backgroundColor: categoryConfig.bgColor,
                                          cursor: "help",
                                        }}
                                      >
                                        <Typography sx={{ fontSize: "11px", color: categoryConfig.color }}>
                                          {categoryConfig.label}
                                        </Typography>
                                      </Box>
                                    </Tooltip>
                                  )}
                                </Box>
                              </Box>

                              {/* Priority badge with tooltip */}
                              {priorityConfig && (
                                <Tooltip title={priorityConfig.description} arrow placement="top">
                                  <Box
                                    sx={{
                                      px: "8px",
                                      py: "2px",
                                      borderRadius: "4px",
                                      backgroundColor: priorityConfig.bgColor,
                                      border: `1px solid ${priorityConfig.color}20`,
                                      cursor: "help",
                                    }}
                                  >
                                    <Typography sx={{ fontSize: "12px", fontWeight: 500, color: priorityConfig.color }}>
                                      {priorityConfig.label}
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              )}
                            </Box>

                            {/* Expanded content - actionable guidance */}
                            <Collapse in={isExpanded}>
                              <Box sx={{ px: "12px", pb: "12px", borderTop: `1px solid ${palette.border.light}`, pt: "12px" }}>
                                {(() => {
                                  // Group findings by type to show relevant documentation needs per type
                                  const findingsByType = item.relatedFindings.reduce(
                                    (acc, f) => {
                                      if (!acc[f.type]) acc[f.type] = [];
                                      acc[f.type].push(f);
                                      return acc;
                                    },
                                    {} as Record<string, typeof item.relatedFindings>
                                  );

                                  // Get unique documentation needs and risks per finding type
                                  const getInfoForType = (type: string) => {
                                    const findings = findingsByType[type] || [];
                                    const mappings = findings
                                      .map((f) => complianceData.mappings.find((m) => m.findingId === f.id))
                                      .filter(Boolean);
                                    return {
                                      documentationNeeds: [...new Set(mappings.flatMap((m) => m?.documentationNeeds || []))],
                                      riskFactors: [...new Set(mappings.flatMap((m) => m?.riskFactors || []))],
                                    };
                                  };

                                  const FINDING_TYPE_LABELS: Record<string, string> = {
                                    library: "AI/ML libraries",
                                    dependency: "Dependencies",
                                    api_call: "API calls",
                                    model_ref: "Model references",
                                    rag_component: "RAG components",
                                    agent: "AI agents",
                                    secret: "Secrets/credentials",
                                  };

                                  return (
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                      {/* Show findings grouped by type with their specific documentation needs */}
                                      {Object.entries(findingsByType).map(([type, findings]) => {
                                        const { documentationNeeds, riskFactors } = getInfoForType(type);
                                        const typeLabel = FINDING_TYPE_LABELS[type] || type;

                                        return (
                                          <Box key={type} sx={{ backgroundColor: palette.background.accent, borderRadius: "6px", p: "12px" }}>
                                            {/* Type header with count */}
                                            <Typography sx={{ fontSize: "13px", fontWeight: 600, color: palette.text.secondary, mb: "8px" }}>
                                              {typeLabel} ({findings.length})
                                            </Typography>

                                            {/* Component chips */}
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: documentationNeeds.length > 0 || riskFactors.length > 0 ? "12px" : 0 }}>
                                              {findings.slice(0, 10).map((finding) => (
                                                <Box
                                                  key={finding.id}
                                                  sx={{
                                                    px: "8px",
                                                    py: "4px",
                                                    borderRadius: "4px",
                                                    backgroundColor: palette.background.main,
                                                    border: `1px solid ${palette.border.light}`,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                  }}
                                                >
                                                  {getProviderIcon(finding.name, 14)}
                                                  <Typography sx={{ fontSize: "12px", color: palette.text.secondary }}>
                                                    {finding.name}
                                                  </Typography>
                                                </Box>
                                              ))}
                                              {findings.length > 10 && (
                                                <Typography sx={{ fontSize: "12px", color: palette.text.tertiary, alignSelf: "center" }}>
                                                  +{findings.length - 10} more
                                                </Typography>
                                              )}
                                            </Box>

                                            {/* Documentation needs for this type */}
                                            {documentationNeeds.length > 0 && (
                                              <Box sx={{ mt: "8px" }}>
                                                <Typography sx={{ fontSize: "12px", fontWeight: 500, color: palette.text.tertiary, mb: "4px" }}>
                                                  For each {typeLabel.toLowerCase()}, document:
                                                </Typography>
                                                <Box component="ul" sx={{ m: 0, pl: "16px" }}>
                                                  {documentationNeeds.map((need, idx) => (
                                                    <Typography component="li" key={idx} sx={{ fontSize: "12px", color: palette.text.tertiary }}>
                                                      {need}
                                                    </Typography>
                                                  ))}
                                                </Box>
                                              </Box>
                                            )}

                                            {/* Risk factors for this type */}
                                            {riskFactors.length > 0 && (
                                              <Box sx={{ mt: "8px" }}>
                                                <Typography sx={{ fontSize: "12px", fontWeight: 500, color: palette.status.warning.text, mb: "4px" }}>
                                                  Risks to consider:
                                                </Typography>
                                                <Box component="ul" sx={{ m: 0, pl: "16px" }}>
                                                  {riskFactors.map((risk, idx) => (
                                                    <Typography component="li" key={idx} sx={{ fontSize: "12px", color: palette.text.tertiary }}>
                                                      {risk}
                                                    </Typography>
                                                  ))}
                                                </Box>
                                              </Box>
                                            )}
                                          </Box>
                                        );
                                      })}

                                      {/* Fallback if no findings */}
                                      {item.relatedFindings.length === 0 && (
                                        <Typography sx={{ fontSize: "13px", color: palette.text.tertiary }}>
                                          This requirement applies to AI components detected in the scan. Review your implementation to ensure compliance.
                                        </Typography>
                                      )}
                                    </Box>
                                  );
                                })()}
                              </Box>
                            </Collapse>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Box>

                {/* Generated timestamp */}
                <Box sx={{ mt: 3, display: "flex", alignItems: "center", gap: 1 }}>
                  <Info size={14} color={palette.text.tertiary} />
                  <Typography variant="body2" sx={{ color: palette.text.tertiary }}>
                    Compliance mapping generated {formatDistanceToNow(new Date(complianceData.generatedAt), { addSuffix: true })}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        )}
      </TabContext>

      {/* AI Dependency Graph Modal */}
      <AIDepGraphModal
        open={showDepGraph}
        onClose={() => setShowDepGraph(false)}
        scanId={scanId}
        repositoryName={`${scan.scan.repository_owner}/${scan.scan.repository_name}`}
        repositoryUrl={scan.scan.repository_url}
      />
    </PageHeaderExtended>
  );
}
