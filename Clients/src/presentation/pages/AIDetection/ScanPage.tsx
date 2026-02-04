/**
 * @fileoverview AI Detection Scan Page
 *
 * Page for initiating repository scans.
 * Features URL input, scan progress, and results summary.
 *
 * @module pages/AIDetection/ScanPage
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  LinearProgress,
  CircularProgress,
  InputAdornment,
  Skeleton,
  Tooltip,
} from "@mui/material";
import {
  Search,
  Github,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileSearch,
  FolderGit2,
  Cpu,
  Library,
  Webhook,
  ShieldAlert,
  Info,
} from "lucide-react";
import Field from "../../components/Inputs/Field";
import { CustomizableButton } from "../../components/Button/CustomizableButton";
import PageHeader from "../../components/Layout/PageHeader";
import HelperIcon from "../../components/HelperIcon";
import {
  startScan,
  pollScanStatus,
  getScan,
  cancelScan,
  getActiveScan,
  getAIDetectionStats,
} from "../../../application/repository/aiDetection.repository";
import {
  ScanStatusResponse,
  ScanResponse,
  AIDetectionStats,
} from "../../../domain/ai-detection/types";

interface ScanPageProps {
  onScanComplete: () => void;
  onViewDetails: (scanId: number) => void;
}

type ScanState = "idle" | "scanning" | "completed" | "failed";

// Stat card component matching Evals ProjectOverview style
interface StatCardProps {
  title: string;
  value: number | string;
  Icon: React.ComponentType<{ size?: number | string }>;
  subtitle?: string;
  tooltip?: string;
}

function StatCard({ title, value, Icon, subtitle, tooltip }: StatCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        background: "linear-gradient(135deg, #FEFFFE 0%, #F8F9FA 100%)",
        border: "1px solid #E5E7EB",
        borderRadius: "8px",
        p: "16px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        minHeight: "80px",
        transition: "all 0.2s ease",
        boxSizing: "border-box",
        "&:hover": {
          background: "linear-gradient(135deg, #F9FAFB 0%, #F1F5F9 100%)",
          borderColor: "#D1D5DB",
        },
      }}
    >
      {/* Background Icon */}
      <Box
        sx={{
          position: "absolute",
          bottom: "-20px",
          right: "-20px",
          opacity: isHovered ? 0.06 : 0.03,
          transform: isHovered ? "translateY(-4px)" : "translateY(0px)",
          zIndex: 0,
          pointerEvents: "none",
          transition: "opacity 0.2s ease, transform 0.3s ease",
        }}
      >
        <Icon size={64} />
      </Box>

      {/* Content */}
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "4px", mb: 0.5 }}>
          <Typography
            sx={{
              color: "#6B7280",
              fontSize: "11px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {title}
          </Typography>
          {tooltip && (
            <Tooltip title={tooltip} arrow placement="top">
              <Box sx={{ display: "flex", alignItems: "center", cursor: "help", ml: "2px" }}>
                <Info size={14} color="#9CA3AF" />
              </Box>
            </Tooltip>
          )}
        </Box>
        <Typography
          sx={{
            fontSize: "20px",
            fontWeight: 600,
            color: "#111827",
            lineHeight: 1.3,
          }}
        >
          {value}
        </Typography>
        {subtitle && (
          <Typography
            sx={{
              fontSize: "10px",
              color: "#9CA3AF",
              mt: 0.25,
              fontWeight: 400,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default function ScanPage({ onScanComplete, onViewDetails }: ScanPageProps) {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [progress, setProgress] = useState<ScanStatusResponse | null>(null);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingActive, setIsCheckingActive] = useState(true);
  const [stats, setStats] = useState<AIDetectionStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentScanIdRef = useRef<number | null>(null);

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAIDetectionStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Check for active scans on mount and resume polling if found
  useEffect(() => {
    const checkForActiveScan = async () => {
      try {
        const activeScan = await getActiveScan();
        if (activeScan) {
          // Set the repository URL from active scan
          setRepositoryUrl(
            `https://github.com/${activeScan.repository_owner}/${activeScan.repository_name}`
          );
          currentScanIdRef.current = activeScan.id;
          setScanState("scanning");

          // Create abort controller for polling
          abortControllerRef.current = new AbortController();

          // Resume polling
          const finalStatus = await pollScanStatus(
            activeScan.id,
            (status) => setProgress(status),
            1000,
            abortControllerRef.current.signal
          );

          if (finalStatus.status === "completed") {
            const scanResult = await getScan(
              activeScan.id,
              abortControllerRef.current.signal
            );
            setResult(scanResult);
            setScanState("completed");
            onScanComplete();
          } else if (finalStatus.status === "failed") {
            setScanState("failed");
            setError(finalStatus.error_message || "Scan failed");
          } else if (finalStatus.status === "cancelled") {
            setScanState("idle");
          }
        }
      } catch (err) {
        // Ignore errors from checking - user may have navigated away
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Error checking for active scan:", err);
        }
      } finally {
        setIsCheckingActive(false);
      }
    };

    checkForActiveScan();

    return () => {
      // Cleanup on unmount
      abortControllerRef.current?.abort();
    };
  }, [onScanComplete]);

  /**
   * Normalizes a repository input to a full GitHub URL.
   * Accepts formats: "owner/repo" or full GitHub URL
   */
  const normalizeRepositoryUrl = (input: string): string => {
    const trimmed = input.trim();

    // If it's already a full URL, return as-is
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }

    // Check if it matches the "owner/repo" pattern
    const ownerRepoPattern = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
    if (ownerRepoPattern.test(trimmed)) {
      return `https://github.com/${trimmed}`;
    }

    // Return as-is for other cases (will be validated by backend)
    return trimmed;
  };

  const handleStartScan = useCallback(async () => {
    if (!repositoryUrl.trim()) {
      setError("Please enter a repository URL");
      return;
    }

    setError(null);
    setScanState("scanning");
    setProgress(null);
    setResult(null);

    // Abort any existing operation before starting new one
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    // Normalize the URL (convert owner/repo to full GitHub URL)
    const normalizedUrl = normalizeRepositoryUrl(repositoryUrl);

    try {
      // Start the scan
      const scan = await startScan(
        normalizedUrl,
        abortControllerRef.current.signal
      );

      // Store scan ID for cancellation
      currentScanIdRef.current = scan.id!;

      // Poll for status
      const finalStatus = await pollScanStatus(
        scan.id!,
        (status) => setProgress(status),
        1000,
        abortControllerRef.current.signal
      );

      if (finalStatus.status === "completed") {
        // Get full scan details
        const scanResult = await getScan(
          scan.id!,
          abortControllerRef.current.signal
        );
        setResult(scanResult);
        setScanState("completed");
        onScanComplete();
      } else if (finalStatus.status === "failed") {
        setScanState("failed");
        setError(finalStatus.error_message || "Scan failed");
      } else if (finalStatus.status === "cancelled") {
        setScanState("idle");
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("aborted")) {
        setScanState("idle");
        return;
      }
      setScanState("failed");
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }, [repositoryUrl, onScanComplete]);

  const handleCancel = useCallback(async () => {
    // Abort local HTTP requests
    abortControllerRef.current?.abort();

    // Call backend to cancel the scan
    if (currentScanIdRef.current) {
      try {
        await cancelScan(currentScanIdRef.current);
      } catch {
        // Scan may have already completed or failed
      }
    }

    // Reset state
    currentScanIdRef.current = null;
    setScanState("idle");
    setProgress(null);
  }, []);

  const handleReset = useCallback(() => {
    setScanState("idle");
    setProgress(null);
    setResult(null);
    setError(null);
    setRepositoryUrl("");
  }, []);

  return (
    <>
      {/* Header */}
      <PageHeader
        title="Scan repository"
        description="Enter a public GitHub repository URL to detect AI/ML libraries and frameworks."
        rightContent={<HelperIcon articlePath="ai-detection/scanning" size="small" />}
      />

      {/* Statistics Cards - 6 cards in 3x2 grid (only show if there are scans) */}
      {!isCheckingActive && scanState === "idle" && !statsLoading && stats && stats.total_scans > 0 && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            mb: "16px",
          }}
        >
          <StatCard
            title="Total scans"
            value={stats.total_scans}
            Icon={FileSearch}
            subtitle={`${stats.completed_scans} completed`}
            tooltip="Total number of repository scans performed, including completed, failed, and cancelled scans."
          />
          <StatCard
            title="Repositories"
            value={stats.unique_repositories}
            Icon={FolderGit2}
            subtitle="Unique repos scanned"
            tooltip="Number of unique repositories that have been scanned. Multiple scans of the same repo count as one."
          />
          <StatCard
            title="Total findings"
            value={stats.total_findings}
            Icon={Cpu}
            subtitle="All detections"
            tooltip="Combined count of all AI/ML detections across completed scans, including libraries, API calls, and secrets."
          />
          <StatCard
            title="Libraries"
            value={stats.findings_by_type.library}
            Icon={Library}
            subtitle="AI/ML imports"
            tooltip="AI/ML library imports and framework dependencies detected in source code (e.g., TensorFlow, PyTorch, OpenAI SDK)."
          />
          <StatCard
            title="API calls"
            value={stats.findings_by_type.api_call}
            Icon={Webhook}
            subtitle="Provider integrations"
            tooltip="Direct API calls to AI providers detected in code, including REST endpoints and SDK method invocations."
          />
          <StatCard
            title="Security issues"
            value={stats.security_findings}
            Icon={ShieldAlert}
            subtitle="Vulnerabilities found"
            tooltip="Security concerns including hardcoded API keys/secrets and model file vulnerabilities that could pose risks."
          />
        </Box>
      )}

      {/* Skeleton loading state for stats */}
      {!isCheckingActive && scanState === "idle" && statsLoading && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            mb: "16px",
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={90}
              sx={{ borderRadius: "8px" }}
            />
          ))}
        </Box>
      )}

      {/* Loading state while checking for active scans */}
      {isCheckingActive && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {/* Scan Form */}
      {!isCheckingActive && scanState === "idle" && (
        <Box
          sx={{
            backgroundColor: "#fff",
            border: "1px solid #d0d5dd",
            borderRadius: "4px",
            p: "16px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: "13px", fontWeight: 600, mb: 0.5 }}>
                Repository URL
              </Typography>
              <Typography sx={{ fontSize: "13px", color: "#667085", mb: "8px" }}>
                Configure a GitHub token in Settings to scan private repositories.{" "}
                Try these examples:{" "}
                {[
                  "Shubhamsaboo/awesome-llm-apps",
                  "langchain-ai/chat-langchain",
                  "GitGuardian/sample_secrets",
                  "nomic-ai/gpt4all",
                ].map((repo, idx, arr) => (
                  <span key={repo}>
                    <span
                      onClick={() => setRepositoryUrl(repo)}
                      style={{
                        color: "#13715B",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      {repo}
                    </span>
                    {idx < arr.length - 1 && ", "}
                  </span>
                ))}
              </Typography>
              <Field
                id="repository-url"
                placeholder="e.g., https://github.com/owner/repo or owner/repo"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Github size={16} color="#6c757d" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 0 }}
              />
            </Box>
            <Box sx={{ alignSelf: "flex-end" }}>
              <CustomizableButton
                text="Scan"
                onClick={handleStartScan}
                isDisabled={!repositoryUrl.trim()}
                startIcon={<Search size={16} />}
                sx={{ height: 34 }}
              />
            </Box>
          </Box>

          {error && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: "#fef3f2",
                border: "1px solid #fecdca",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <AlertCircle size={16} color="#d92d20" />
              <Typography variant="body2" sx={{ color: "#b42318" }}>
                {error}
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {/* Scanning Progress */}
      {scanState === "scanning" && progress && (
        <Box
          sx={{
            backgroundColor: "#fff",
            border: "1px solid #d0d5dd",
            borderRadius: "4px",
            p: "8px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 500, fontSize: "13px" }}>
              {progress.status === "cloning"
                ? "Cloning repository..."
                : `Scanning files... (${progress.files_scanned}${
                    progress.total_files ? `/${progress.total_files}` : ""
                  })`}
            </Typography>
            <CircularProgress size={16} sx={{ color: "#13715B" }} />
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress.progress}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: "#e4e7ec",
              "& .MuiLinearProgress-bar": {
                backgroundColor: "#13715B",
                borderRadius: 4,
              },
            }}
          />

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
            <Typography variant="caption" sx={{ color: "#667085" }}>
              {progress.current_file || "Processing..."}
            </Typography>
            <Typography variant="caption" sx={{ color: "#667085" }}>
              {progress.progress}%
            </Typography>
          </Box>

          {progress.findings_count > 0 && (
            <Typography variant="body2" sx={{ mt: 2, color: "#13715B" }}>
              Found {progress.findings_count} AI/ML {progress.findings_count === 1 ? "library" : "libraries"} so far
            </Typography>
          )}

          <Box sx={{ mt: 3, textAlign: "right" }}>
            <CustomizableButton
              text="Cancel"
              onClick={handleCancel}
              variant="outlined"
              sx={{ height: 34 }}
            />
          </Box>
        </Box>
      )}

      {/* Scan Complete */}
      {scanState === "completed" && result && (
        <Box
          sx={{
            backgroundColor: "#fff",
            border: "1px solid #d0d5dd",
            borderRadius: "4px",
            p: "8px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <CheckCircle2 size={24} color="#039855" />
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Scan completed
              </Typography>
              <Typography variant="body2" sx={{ color: "#667085" }}>
                {result.scan.repository_owner}/{result.scan.repository_name}
              </Typography>
            </Box>
          </Box>

          {/* Summary */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 2,
              mb: 3,
            }}
          >
            <Box
              sx={{
                p: 2,
                backgroundColor: "#f9fafb",
                borderRadius: "4px",
                textAlign: "center",
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 600, color: "#101828" }}>
                {result.summary.total}
              </Typography>
              <Typography variant="body2" sx={{ color: "#667085" }}>
                Total findings
              </Typography>
            </Box>
            <Box
              sx={{
                p: 2,
                backgroundColor: "#f9fafb",
                borderRadius: "4px",
                textAlign: "center",
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 600, color: "#d92d20" }}>
                {result.summary.by_confidence.high}
              </Typography>
              <Typography variant="body2" sx={{ color: "#667085" }}>
                High confidence
              </Typography>
            </Box>
            <Box
              sx={{
                p: 2,
                backgroundColor: "#f9fafb",
                borderRadius: "4px",
                textAlign: "center",
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 600, color: "#101828" }}>
                {result.scan.files_scanned}
              </Typography>
              <Typography variant="body2" sx={{ color: "#667085" }}>
                Files scanned
              </Typography>
            </Box>
          </Box>

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: "16px" }}>
            <CustomizableButton
              text="Scan another"
              onClick={handleReset}
              variant="outlined"
              sx={{ height: 34 }}
            />
            <CustomizableButton
              text="View details"
              onClick={() => onViewDetails(result.scan.id)}
              sx={{ height: 34 }}
            />
          </Box>
        </Box>
      )}

      {/* Scan Failed */}
      {scanState === "failed" && (
        <Box
          sx={{
            backgroundColor: "#fff",
            border: "1px solid #fecdca",
            borderRadius: "4px",
            p: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <XCircle size={24} color="#d92d20" />
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 500, color: "#b42318" }}>
                Scan failed
              </Typography>
              <Typography variant="body2" sx={{ color: "#667085" }}>
                {error || "An error occurred during the scan"}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ textAlign: "right" }}>
            <CustomizableButton
              text="Try again"
              onClick={handleReset}
              sx={{ height: 34 }}
            />
          </Box>
        </Box>
      )}
    </>
  );
}
