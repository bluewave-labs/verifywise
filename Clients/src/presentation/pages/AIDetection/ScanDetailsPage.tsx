/**
 * @fileoverview AI Detection Scan Details Page
 *
 * Page for viewing detailed scan results and findings.
 * Includes separate tabs for Libraries and Security findings.
 *
 * @module pages/AIDetection/ScanDetailsPage
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Collapse, IconButton, Tooltip } from "@mui/material";
import { TabContext } from "@mui/lab";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FileCode,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Info,
  Package,
  AlertCircle,
} from "lucide-react";
import CustomizableButton from "../../components/Button/CustomizableButton";
import Chip from "../../components/Chip";
import TabBar from "../../components/TabBar";
import { VWLink } from "../../components/Link";
// AI provider icons (importing Mono variants directly to avoid @lobehub/ui dependency)
import Anthropic from "@lobehub/icons/es/Anthropic/components/Mono";
import Anyscale from "@lobehub/icons/es/Anyscale/components/Mono";
import Aws from "@lobehub/icons/es/Aws/components/Mono";
import Cohere from "@lobehub/icons/es/Cohere/components/Mono";
import CrewAI from "@lobehub/icons/es/CrewAI/components/Mono";
import Google from "@lobehub/icons/es/Google/components/Mono";
import HuggingFace from "@lobehub/icons/es/HuggingFace/components/Mono";
import LangChain from "@lobehub/icons/es/LangChain/components/Mono";
import LlamaIndex from "@lobehub/icons/es/LlamaIndex/components/Mono";
import Meta from "@lobehub/icons/es/Meta/components/Mono";
import Microsoft from "@lobehub/icons/es/Microsoft/components/Mono";
import Mistral from "@lobehub/icons/es/Mistral/components/Mono";
import Nvidia from "@lobehub/icons/es/Nvidia/components/Mono";
import Ollama from "@lobehub/icons/es/Ollama/components/Mono";
import OpenAI from "@lobehub/icons/es/OpenAI/components/Mono";
import Replicate from "@lobehub/icons/es/Replicate/components/Mono";
// ML framework logos - for providers without lobehub icons
import scikitLearnLogo from "../../assets/ml-logos/scikit.png";
import numpyLogo from "../../assets/ml-logos/numpy.svg";
import pandasLogo from "../../assets/ml-logos/pandas.png";
import matplotlibLogo from "../../assets/ml-logos/matplotlib.png";
import mxnetLogo from "../../assets/ml-logos/mxnet.svg";
import scipyLogo from "../../assets/ml-logos/scipy.svg";
import daskLogo from "../../assets/ml-logos/dask.svg";
import {
  getScan,
  getScanFindings,
  getScanSecurityFindings,
  getScanSecuritySummary,
} from "../../../application/repository/aiDetection.repository";
import {
  ScanResponse,
  Finding,
  ConfidenceLevel,
  SecurityFinding,
  SecuritySeverity,
  SecuritySummary,
} from "../../../domain/ai-detection/types";
import { formatDistanceToNow } from "date-fns";

interface ScanDetailsPageProps {
  scanId: number;
  onBack: () => void;
  initialTab?: "libraries" | "security";
}

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
  critical: "#fecdca",
  high: "#fed7aa",
  medium: "#fedf89",
  low: "#b2ddff",
};

const CONFIDENCE_TOOLTIPS: Record<ConfidenceLevel, string> = {
  high: "The scanner is very confident this is an actual AI/ML library being used (e.g., direct import of tensorflow, pytorch, openai, etc.)",
  medium: "The scanner found patterns that likely indicate AI/ML usage but with less certainty",
  low: "The scanner found patterns that might indicate AI/ML usage but could be false positives",
};

const SEVERITY_TOOLTIPS: Record<SecuritySeverity, string> = {
  critical: "Critical severity: Immediate action required. This finding indicates a severe security vulnerability that could lead to remote code execution or complete system compromise.",
  high: "High severity: Urgent attention needed. This finding indicates a significant security risk that should be addressed promptly.",
  medium: "Medium severity: Should be addressed. This finding indicates a moderate security concern that requires attention.",
  low: "Low severity: Consider addressing. This finding indicates a minor security concern or informational issue.",
};

// ============================================================================
// Provider Icon Mapping
// ============================================================================

// Lobehub icon components
const PROVIDER_ICON_COMPONENTS: Record<string, React.ComponentType<{ size?: number | string }>> = {
  "Anthropic": Anthropic,
  "Anyscale": Anyscale,
  "AWS": Aws,
  "Cohere": Cohere,
  "CrewAI": CrewAI,
  "Google": Google,
  "HuggingFace": HuggingFace,
  "LangChain": LangChain,
  "LlamaIndex": LlamaIndex,
  "Meta": Meta,
  "Microsoft": Microsoft,
  "Mistral": Mistral,
  "Nvidia": Nvidia,
  "Ollama": Ollama,
  "OpenAI": OpenAI,
  "Replicate": Replicate,
};

// SVG logo mappings for ML frameworks (provider names must match backend aiDetectionPatterns.ts)
const PROVIDER_SVG_LOGOS: Record<string, string> = {
  // These providers don't have lobehub icons, so we use SVG/PNG logos
  "scikit-learn": scikitLearnLogo,
  "NumPy": numpyLogo,
  "Pandas": pandasLogo,
  "Matplotlib": matplotlibLogo,
  "MXNet": mxnetLogo,
  "SciPy": scipyLogo,
  "Dask": daskLogo,
};

function getProviderIcon(provider?: string, size: number = 16): React.ReactNode {
  if (!provider) return <Package size={size} color="#667085" strokeWidth={1.5} />;

  // Check for lobehub icon component first
  const IconComponent = PROVIDER_ICON_COMPONENTS[provider];
  if (IconComponent) return <IconComponent size={size} />;

  // Check for SVG logo
  const svgLogo = PROVIDER_SVG_LOGOS[provider];
  if (svgLogo) {
    return <img src={svgLogo} alt={provider} width={size} height={size} style={{ objectFit: "contain" }} />;
  }

  return <Package size={size} color="#667085" strokeWidth={1.5} />;
}

// ============================================================================
// Finding Row Component (for Library findings)
// ============================================================================

interface FindingRowProps {
  finding: Finding;
  repositoryOwner: string;
  repositoryName: string;
}

function FindingRow({ finding, repositoryOwner, repositoryName }: FindingRowProps) {
  const [expanded, setExpanded] = useState(false);

  const getFileUrl = (filePath: string, lineNumber: number | null): string | null => {
    if (!repositoryOwner || !repositoryName) return null;
    const baseUrl = `https://github.com/${repositoryOwner}/${repositoryName}/blob/main/${filePath}`;
    return lineNumber ? `${baseUrl}#L${lineNumber}` : baseUrl;
  };

  return (
    <Box
      sx={{
        border: "1px solid #e4e7ec",
        borderRadius: "4px",
        mb: "8px",
        backgroundColor: "#fff",
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
            backgroundColor: "#f9fafb",
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
              <Typography variant="body2" sx={{ color: "#667085", mt: 0.5 }}>
                {finding.description}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ minWidth: 75, display: "flex", justifyContent: "center" }}>
            <Tooltip title={CONFIDENCE_TOOLTIPS[finding.confidence]} arrow placement="top">
              <span>
                <Chip
                  label={finding.confidence.charAt(0).toUpperCase() + finding.confidence.slice(1)}
                  variant={CONFIDENCE_CHIP_VARIANT[finding.confidence]}
                  size="small"
                />
              </span>
            </Tooltip>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 85, justifyContent: "flex-end" }}>
            <FileCode size={14} color="#667085" />
            <Typography variant="body2" sx={{ color: "#667085" }}>
              {finding.file_count} {finding.file_count === 1 ? "file" : "files"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Expanded Content */}
      <Collapse in={expanded}>
        <Box sx={{ p: "8px", borderTop: "1px solid #e4e7ec" }}>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Found in:
          </Typography>
          <Box
            sx={{
              maxHeight: 200,
              overflow: "auto",
              backgroundColor: "#f9fafb",
              borderRadius: "4px",
              p: 1,
            }}
          >
            {finding.file_paths.slice(0, 20).map((fp, idx) => {
              const fileUrl = getFileUrl(fp.path, fp.line_number);
              return (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    py: 0.5,
                    px: 1,
                    fontFamily: "monospace",
                    fontSize: 13,
                  }}
                >
                  {fileUrl ? (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "monospace",
                        color: "#101828",
                        wordBreak: "break-all",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                    >
                      {fp.path}
                      {fp.line_number && (
                        <span style={{ color: "#667085", marginLeft: "4px" }}>
                          :{fp.line_number}
                        </span>
                      )}
                    </a>
                  ) : (
                    <span style={{ fontFamily: "monospace", color: "#101828", wordBreak: "break-all" }}>
                      {fp.path}
                      {fp.line_number && (
                        <span style={{ color: "#667085", marginLeft: "4px" }}>
                          :{fp.line_number}
                        </span>
                      )}
                    </span>
                  )}
                </Box>
              );
            })}
            {finding.file_paths.length > 20 && (
              <Typography
                variant="body2"
                sx={{ color: "#667085", fontStyle: "italic", mt: 1, px: 1 }}
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
        backgroundColor: "#fff",
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
            backgroundColor: "#f9fafb",
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
            <Typography sx={{ fontSize: "13px", color: "#667085" }}>
              in {finding.module_name}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 0.5 }}>
            <Typography sx={{ fontSize: "13px", color: "#667085" }}>
              {finding.cwe_id}
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#667085" }}>
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
            <FileCode size={14} color="#667085" />
            <Typography sx={{ fontSize: "13px", color: "#667085" }}>
              {finding.file_count} {finding.file_count === 1 ? "file" : "files"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Expanded Content */}
      <Collapse in={expanded}>
        <Box sx={{ p: "8px", borderTop: "1px solid #e4e7ec" }}>
          {/* Description */}
          {finding.description && (
            <Typography variant="body2" sx={{ color: "#344054", mb: "8px" }}>
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
                sx={{ fontWeight: 500, color: "#344054" }}
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
                sx={{ fontWeight: 500, color: "#344054" }}
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
                sx={{ fontWeight: 500, color: "#344054" }}
              >
                Threat type
              </Typography>
              <Typography variant="body2" sx={{ color: "#667085" }}>
                {finding.threat_type}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, color: "#344054" }}
              >
                Operator
              </Typography>
              <Typography variant="body2" sx={{ color: "#667085" }}>
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
              backgroundColor: "#f9fafb",
              borderRadius: "4px",
              p: 1,
            }}
          >
            {finding.file_paths.slice(0, 20).map((fp, idx) => {
              const fileUrl = getFileUrl(fp.path, fp.line_number);
              return (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    py: 0.5,
                    px: 1,
                    fontFamily: "monospace",
                    fontSize: 13,
                  }}
                >
                  {fileUrl ? (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: "monospace",
                        color: "#101828",
                        wordBreak: "break-all",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                    >
                      {fp.path}
                      {fp.line_number && (
                        <span style={{ color: "#667085", marginLeft: "4px" }}>
                          :{fp.line_number}
                        </span>
                      )}
                    </a>
                  ) : (
                    <span style={{ fontFamily: "monospace", color: "#101828", wordBreak: "break-all" }}>
                      {fp.path}
                      {fp.line_number && (
                        <span style={{ color: "#667085", marginLeft: "4px" }}>
                          :{fp.line_number}
                        </span>
                      )}
                    </span>
                  )}
                </Box>
              );
            })}
            {finding.file_paths.length > 20 && (
              <Typography
                variant="body2"
                sx={{ color: "#667085", fontStyle: "italic", mt: 1, px: 1 }}
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

export default function ScanDetailsPage({
  scanId,
  onBack,
  initialTab = "libraries",
}: ScanDetailsPageProps) {
  const navigate = useNavigate();
  const [scan, setScan] = useState<ScanResponse | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
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
    setActiveTab(newValue as "libraries" | "security");
    if (newValue === "libraries") {
      navigate(`/ai-detection/scans/${scanId}/libraries`, { replace: true });
    } else if (newValue === "security") {
      navigate(`/ai-detection/scans/${scanId}/security`, { replace: true });
    }
  };

  // Sync activeTab when initialTab changes (URL navigation)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const [page, setPage] = useState(1);
  const [securityPage, setSecurityPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [securityTotalPages, setSecurityTotalPages] = useState(1);
  const [confidenceFilter, setConfidenceFilter] =
    useState<ConfidenceLevel | null>(null);
  const [severityFilter, setSeverityFilter] = useState<SecuritySeverity | null>(
    null
  );

  // Initial load - only loads scan data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [scanResponse, findingsResponse, securityFindingsResponse, summaryResponse] =
          await Promise.all([
            getScan(scanId),
            getScanFindings(scanId, { page: 1, limit: 50 }),
            getScanSecurityFindings(scanId, { page: 1, limit: 50 }),
            getScanSecuritySummary(scanId),
          ]);
        setScan(scanResponse);
        setFindings(findingsResponse.findings);
        setTotalPages(findingsResponse.pagination.total_pages);
        setSecurityFindings(securityFindingsResponse.findings);
        setSecurityTotalPages(securityFindingsResponse.pagination.total_pages);
        setSecuritySummary(summaryResponse);
      } catch (error) {
        console.error("Failed to load scan details:", error);
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
        });
        setFindings(findingsResponse.findings);
        setTotalPages(findingsResponse.pagination.total_pages);
      } catch (error) {
        console.error("Failed to load library findings:", error);
      }
    };

    loadLibraryFindings();
  }, [scanId, page, confidenceFilter, scan]);

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
      } catch (error) {
        console.error("Failed to load security findings:", error);
      }
    };

    loadSecurityFindings();
  }, [scanId, securityPage, severityFilter, scan]);

  const formatDuration = (ms?: number): string => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (isLoading && !scan) {
    return (
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="body1" sx={{ color: "#667085" }}>
          Loading scan details...
        </Typography>
      </Box>
    );
  }

  if (!scan) {
    return (
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="body1" sx={{ color: "#d92d20" }}>
          Failed to load scan details
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Back Button */}
      <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
        <CustomizableButton
          text="Back to history"
          onClick={onBack}
          variant="text"
          startIcon={<ArrowLeft size={16} />}
          sx={{ mb: 3 }}
        />
      </Box>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          {scan.scan.status === "failed" ? (
            <AlertCircle size={24} color="#d92d20" />
          ) : (
            <CheckCircle2 size={24} color="#039855" />
          )}
          <Typography sx={{ fontSize: "15px", fontWeight: 600 }}>
            {scan.scan.repository_owner}/{scan.scan.repository_name}
          </Typography>
          {scan.scan.status === "failed" && (
            <Chip label="Failed" size="small" />
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 3, ml: "28px" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Clock size={14} color="#667085" />
            <Typography variant="body2" sx={{ color: "#667085" }}>
              {formatDuration(scan.scan.duration_ms)}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#667085" }}>
            {scan.scan.status === "failed" ? "Failed" : "Scanned"}{" "}
            {formatDistanceToNow(new Date(scan.scan.created_at), {
              addSuffix: true,
            })}
          </Typography>
          <Typography variant="body2" sx={{ color: "#667085" }}>
            by {scan.scan.triggered_by.name}
          </Typography>
        </Box>
      </Box>

      {/* Error Message Alert */}
      {scan.scan.status === "failed" && scan.scan.error_message && (
        <Box
          sx={{
            mb: 4,
            p: 2,
            backgroundColor: "#fef3f2",
            border: "1px solid #fecdca",
            borderRadius: "4px",
            display: "flex",
            alignItems: "flex-start",
            gap: 2,
          }}
        >
          <AlertCircle size={20} color="#d92d20" style={{ flexShrink: 0, marginTop: 2 }} />
          <Box>
            <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#b42318", mb: 0.5 }}>
              Scan failed
            </Typography>
            <Typography sx={{ fontSize: "13px", color: "#b42318" }}>
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
              count: scan.summary.total,
            },
            {
              label: "Security",
              value: "security",
              icon: "Shield",
              count: securitySummary?.total || 0,
            },
          ]}
          activeTab={activeTab}
          onChange={handleTabChange}
        />

        {/* Libraries Tab */}
        {activeTab === "libraries" && (
          <Box sx={{ mt: "8px" }}>
            <Typography variant="body2" sx={{ color: "#667085", mb: "16px" }}>
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
                  backgroundColor: "#fff",
                  border: "1px solid #d0d5dd",
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
                    color: confidenceFilter === null ? "#13715B" : "#101828",
                  }}
                >
                  {scan.summary.total}
                </Typography>
                <Typography variant="body2" sx={{ color: "#667085" }}>
                  Total findings
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: "#fef3f2",
                  border: "1px solid #fecdca",
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
                    color: confidenceFilter === "high" ? "#d92d20" : "#101828",
                  }}
                >
                  {scan.summary.by_confidence.high}
                </Typography>
                <Typography variant="body2" sx={{ color: "#667085" }}>
                  High confidence
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: "#fffaeb",
                  border: "1px solid #fedf89",
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
                    color: confidenceFilter === "medium" ? "#dc6803" : "#101828",
                  }}
                >
                  {scan.summary.by_confidence.medium}
                </Typography>
                <Typography variant="body2" sx={{ color: "#667085" }}>
                  Medium confidence
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: "#fff",
                  border: "1px solid #d0d5dd",
                  borderRadius: "4px",
                  p: 2,
                  textAlign: "center",
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {scan.scan.files_scanned}
                </Typography>
                <Typography variant="body2" sx={{ color: "#667085" }}>
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
                    backgroundColor: "#fff",
                    border: "1px solid #d0d5dd",
                    borderRadius: "4px",
                    p: 4,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="body1" sx={{ color: "#667085" }}>
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
                        sx={{ lineHeight: "34px", px: 2, color: "#667085" }}
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

        {/* Security Tab */}
        {activeTab === "security" && (
          <Box sx={{ mt: "8px" }}>
            <Typography variant="body2" sx={{ color: "#667085", mb: "16px" }}>
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
                  backgroundColor: "#fff",
                  border: "1px solid #d0d5dd",
                  borderRadius: "4px",
                  p: 2,
                  textAlign: "center",
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {securitySummary?.total || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: "#667085" }}>
                  Total findings
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: "#fef3f2",
                  border: "1px solid #fecdca",
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
                      severityFilter === "critical" ? "#b42318" : "#101828",
                  }}
                >
                  {securitySummary?.by_severity.critical || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: "#667085" }}>
                  Critical
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: "#fff6ed",
                  border: "1px solid #fed7aa",
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
                      severityFilter === "high" ? "#c4320a" : "#101828",
                  }}
                >
                  {securitySummary?.by_severity.high || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: "#667085" }}>
                  High
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: "#fffaeb",
                  border: "1px solid #fedf89",
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
                      severityFilter === "medium" ? "#b54708" : "#101828",
                  }}
                >
                  {securitySummary?.by_severity.medium || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: "#667085" }}>
                  Medium
                </Typography>
              </Box>
              <Box
                sx={{
                  backgroundColor: "#eff8ff",
                  border: "1px solid #b2ddff",
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
                      severityFilter === "low" ? "#175cd3" : "#101828",
                  }}
                >
                  {securitySummary?.by_severity.low || 0}
                </Typography>
                <Typography variant="body2" sx={{ color: "#667085" }}>
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
                    backgroundColor: "#ecfdf3",
                    border: "1px solid #a6f4c5",
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
                    <ShieldCheck size={48} color="#039855" />
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 500, color: "#039855", mb: 1 }}
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
                      <Info size={14} color="#667085" />
                      <Typography variant="body2" sx={{ color: "#667085" }}>
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
                        sx={{ lineHeight: "34px", px: 2, color: "#667085" }}
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
                <Typography variant="body2" sx={{ color: "#667085" }}>
                  {securitySummary.model_files_scanned} model{" "}
                  {securitySummary.model_files_scanned === 1 ? "file" : "files"}{" "}
                  scanned
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </TabContext>
    </>
  );
}
