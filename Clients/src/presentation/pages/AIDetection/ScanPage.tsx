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
} from "@mui/material";
import {
  Search,
  Github,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Field from "../../components/Inputs/Field";
import CustomizableButton from "../../components/Button/CustomizableButton";
import PageHeader from "../../components/Layout/PageHeader";
import HelperIcon from "../../components/HelperIcon";
import {
  startScan,
  pollScanStatus,
  getScan,
  cancelScan,
  getActiveScan,
} from "../../../application/repository/aiDetection.repository";
import {
  ScanStatusResponse,
  ScanResponse,
} from "../../../domain/ai-detection/types";

interface ScanPageProps {
  onScanComplete: () => void;
  onViewDetails: (scanId: number) => void;
}

type ScanState = "idle" | "scanning" | "completed" | "failed";

export default function ScanPage({ onScanComplete, onViewDetails }: ScanPageProps) {
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [progress, setProgress] = useState<ScanStatusResponse | null>(null);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingActive, setIsCheckingActive] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentScanIdRef = useRef<number | null>(null);

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
            p: "8px",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Field
                id="repository-url"
                label="Repository URL"
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
                sx={{ mb: 0, "& .MuiTypography-root": { fontWeight: 600 } }}
              />
              <Typography variant="caption" sx={{ color: "#667085", mt: 0.5, display: "block" }}>
                Configure a GitHub token in Settings to scan private repositories
              </Typography>
            </Box>
            <Box sx={{ pt: "24px" }}>
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
            <CircularProgress size={20} sx={{ color: "#13715B" }} />
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {progress.status === "cloning"
                ? "Cloning repository..."
                : `Scanning files... (${progress.files_scanned}${
                    progress.total_files ? `/${progress.total_files}` : ""
                  })`}
            </Typography>
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
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
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
