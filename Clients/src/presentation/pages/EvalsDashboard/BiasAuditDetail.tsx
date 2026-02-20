import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Stack, Typography, Card, CardContent, CircularProgress, useTheme } from "@mui/material";
import Chip from "../../components/Chip";
import { ArrowLeft, XCircle, Users, UserCheck, Percent, AlertTriangle, HelpCircle, LucideIcon } from "lucide-react";
import { cardStyles } from "../../themes";
import { CustomizableButton } from "../../components/button/customizable-button";
import { getStatusChip, getModeChip } from "./biasAuditHelpers";
import ConfirmationModal from "../../components/Dialogs/ConfirmationModal";
import {
  getBiasAuditResults,
  getBiasAuditStatus,
  deleteBiasAudit,
  type BiasAuditDetailResponse,
  type CategoryTableResult,
} from "../../../application/repository/deepEval.repository";

interface BiasAuditDetailProps {
  auditId: string;
  onBack: () => void;
}

function StatCard({ title, value, Icon, highlight }: { title: string; value: string; Icon: LucideIcon; highlight?: boolean }) {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      elevation={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        ...(cardStyles.base(theme) as Record<string, unknown>),
        background: "linear-gradient(135deg, #FEFFFE 0%, #F8F9FA 100%)",
        border: "1px solid #E5E7EB",
        height: "100%",
        minHeight: "80px",
        position: "relative",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        borderRadius: "8px",
        overflow: "hidden",
        "&:hover": {
          background: "linear-gradient(135deg, #F9FAFB 0%, #F1F5F9 100%)",
          borderColor: "#D1D5DB",
        },
      }}
    >
      <CardContent
        sx={{
          p: "14px 16px",
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
          "&:last-child": { pb: "14px" },
        }}
      >
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
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            sx={{
              color: "#6B7280",
              fontSize: "11px",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              mb: 0.5,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: "20px",
              fontWeight: 600,
              color: highlight ? "#B42318" : "#111827",
              lineHeight: 1.3,
            }}
          >
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function ResultsTable({ table, threshold: _threshold }: { table: CategoryTableResult; threshold: number }) {
  const theme = useTheme();
  const headerCellSx = {
    fontSize: 12,
    fontWeight: 600,
    color: theme.palette.text.secondary,
    textAlign: "right" as const,
    py: 1,
    px: 2,
  };

  return (
    <Box sx={{ border: `1px solid ${theme.palette.border.dark}`, borderRadius: "4px", mb: "16px", overflow: "hidden" }}>
      <Box sx={{ px: 2, py: 1.5, backgroundColor: "#F9FAFB", borderBottom: `1px solid ${theme.palette.border.dark}` }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.palette.text.primary }}>{table.title}</Typography>
        {table.highest_group && (
          <Typography sx={{ fontSize: 11, color: theme.palette.text.secondary }}>
            Highest rate: {table.highest_group} ({((table.highest_rate || 0) * 100).toFixed(1)}%)
          </Typography>
        )}
      </Box>

      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
        <Box component="thead">
          <Box component="tr" sx={{ borderBottom: `1px solid ${theme.palette.border.light}` }}>
            <Box component="th" sx={{ ...headerCellSx, textAlign: "left", width: "25%" }}>Group</Box>
            <Box component="th" sx={{ ...headerCellSx, width: "15%" }}>Applicants</Box>
            <Box component="th" sx={{ ...headerCellSx, width: "15%" }}>Selected</Box>
            <Box component="th" sx={{ ...headerCellSx, width: "15%" }}>Selection rate</Box>
            <Box component="th" sx={{ ...headerCellSx, width: "15%" }}>Impact ratio</Box>
            <Box component="th" sx={{ ...headerCellSx, width: "15%" }}>Status</Box>
          </Box>
        </Box>
        <Box component="tbody">
          {table.rows.map((row, idx) => (
            <Box
              component="tr"
              key={idx}
              sx={{
                borderBottom: idx < table.rows.length - 1 ? `1px solid ${theme.palette.border.light}` : "none",
                backgroundColor: row.flagged ? "#FEF2F2" : theme.palette.background.paper,
              }}
            >
              <Box component="td" sx={{ py: 1.25, px: 2 }}>
                <Typography sx={{ fontSize: 13, color: theme.palette.text.primary }}>{row.category_name}</Typography>
              </Box>
              <Box component="td" sx={{ py: 1.25, px: 2, textAlign: "right" }}>
                <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>{row.applicant_count.toLocaleString()}</Typography>
              </Box>
              <Box component="td" sx={{ py: 1.25, px: 2, textAlign: "right" }}>
                <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>{row.selected_count.toLocaleString()}</Typography>
              </Box>
              <Box component="td" sx={{ py: 1.25, px: 2, textAlign: "right" }}>
                <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>{(row.selection_rate * 100).toFixed(1)}%</Typography>
              </Box>
              <Box component="td" sx={{ py: 1.25, px: 2, textAlign: "right" }}>
                <Typography sx={{ fontSize: 13, color: row.excluded ? "#98a2b3" : row.flagged ? "#B42318" : theme.palette.text.secondary, fontWeight: row.flagged ? 600 : 400 }}>
                  {row.excluded ? "Excluded (<2%)" : row.impact_ratio != null ? row.impact_ratio.toFixed(3) : "—"}
                </Typography>
              </Box>
              <Box component="td" sx={{ py: 1.25, px: 2, textAlign: "right" }}>
                {row.excluded ? (
                  <Chip label="N/A" size="small" uppercase={false} backgroundColor="#F3F4F6" textColor="#6B7280" />
                ) : row.flagged ? (
                  <Chip label="Flag" size="small" uppercase={false} backgroundColor="#FEE2E2" textColor="#991B1B" />
                ) : (
                  <Chip label="Pass" size="small" uppercase={false} variant="success" />
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default function BiasAuditDetail({ auditId, onBack }: BiasAuditDetailProps) {
  const theme = useTheme();
  const [audit, setAudit] = useState<BiasAuditDetailResponse | null>(null);
  const [status, setStatus] = useState<string>("pending");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const networkRetryCount = useRef(0);
  const MAX_NETWORK_RETRIES = 3;

  const fetchResults = useCallback(async () => {
    try {
      const data = await getBiasAuditResults(auditId);
      setAudit(data);
      setStatus(data.status);
      setLoading(false);
      networkRetryCount.current = 0;
    } catch (err: any) {
      if (err?.response?.status === 202) {
        const statusData = await getBiasAuditStatus(auditId);
        setStatus(statusData.status);
        setLoading(false);
        networkRetryCount.current = 0;
      } else if (err?.response?.status === 500) {
        setError(err.response?.data?.detail || "Audit failed");
        setStatus("failed");
        setLoading(false);
      } else if (!err?.response) {
        // Network error (no response) — retry silently up to MAX_NETWORK_RETRIES
        networkRetryCount.current += 1;
        if (networkRetryCount.current >= MAX_NETWORK_RETRIES) {
          setError("Network error. Please check your connection and try again.");
          setLoading(false);
        }
        // Otherwise let polling retry on next interval
      } else {
        setError("Failed to load audit results");
        setLoading(false);
      }
    }
  }, [auditId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // Polling while pending/running (ref-based to avoid interval churn)
  // Stop polling on error to prevent infinite retry loops
  useEffect(() => {
    const shouldPoll = (status === "pending" || status === "running") && !error;

    if (shouldPoll && !pollingRef.current) {
      pollingRef.current = setInterval(fetchResults, 3000);
    } else if (!shouldPoll && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, [status, error, fetchResults]);

  const handleDownload = () => {
    if (!audit?.results) return;
    try {
      const json = JSON.stringify(audit.results, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bias-audit-${auditId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download results:", err);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteBiasAudit(auditId);
      onBack();
    } catch (err) {
      console.error("Failed to delete audit:", err);
      setError("Failed to delete audit. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Box
          onClick={onBack}
          sx={{ cursor: "pointer", display: "flex", alignItems: "center", p: 0.5, borderRadius: "4px", "&:hover": { backgroundColor: theme.palette.action.hover } }}
        >
          <ArrowLeft size={18} color={theme.palette.text.secondary} strokeWidth={1.5} />
        </Box>
        <Stack spacing={0.5} flex={1}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.text.primary }}>
              {audit?.presetName || "Bias audit"}
            </Typography>
            {audit?.mode && getModeChip(audit.mode)}
            {getStatusChip(status)}
          </Stack>
          {audit?.createdAt && (
            <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
              Created {new Date(audit.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </Typography>
          )}
        </Stack>
        <Stack direction="row" spacing={1}>
          {audit?.results && (
            <CustomizableButton
              variant="outlined"
              text="Download JSON"
              onClick={handleDownload}
              sx={{ height: 34, fontSize: 13, border: `1px solid ${theme.palette.border.dark}`, color: theme.palette.text.primary }}
            />
          )}
          <CustomizableButton
            variant="outlined"
            text={isDeleting ? "Deleting..." : "Delete"}
            onClick={() => setShowDeleteConfirm(true)}
            isDisabled={isDeleting}
            sx={{ height: 34, fontSize: 13, border: `1px solid ${theme.palette.border.dark}`, color: "#B42318", "&:hover": { backgroundColor: "#FEF3F2", border: "1px solid #FCA5A5" } }}
          />
        </Stack>
      </Stack>

      {/* Loading/pending/running state */}
      {(loading || status === "pending" || status === "running") && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 2 }}>
          <CircularProgress size={32} sx={{ color: theme.palette.primary.main }} />
          <Typography sx={{ fontSize: 14, color: theme.palette.text.secondary }}>
            {status === "running" ? "Audit is running..." : "Waiting to start..."}
          </Typography>
        </Box>
      )}

      {/* Failed state */}
      {status === "failed" && (
        <Box sx={{ border: "1px solid #FCA5A5", borderRadius: "4px", p: 3, backgroundColor: "#FEF2F2" }}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <XCircle size={18} color="#991B1B" strokeWidth={1.5} />
            <Stack spacing={0.5}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#991B1B" }}>Audit failed</Typography>
              <Typography sx={{ fontSize: 13, color: "#7F1D1D" }}>{error || "An unknown error occurred"}</Typography>
            </Stack>
          </Stack>
        </Box>
      )}

      {/* Completed state */}
      {status === "completed" && audit?.results && (
        <>
          {/* Summary cards */}
          <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${audit.results.unknown_count > 0 ? 5 : 4}, 1fr)`, gap: "16px", mb: "16px" }}>
            <StatCard title="Total applicants" value={audit.results.total_applicants.toLocaleString()} Icon={Users} />
            <StatCard title="Total selected" value={audit.results.total_selected.toLocaleString()} Icon={UserCheck} />
            <StatCard title="Selection rate" value={`${(audit.results.overall_selection_rate * 100).toFixed(1)}%`} Icon={Percent} />
            <StatCard title="Flags" value={audit.results.flags_count.toString()} Icon={AlertTriangle} highlight={audit.results.flags_count > 0} />
            {audit.results.unknown_count > 0 && (
              <StatCard title="Unknown" value={audit.results.unknown_count.toLocaleString()} Icon={HelpCircle} />
            )}
          </Box>

          {/* Summary text */}
          <Box sx={{ border: `1px solid ${theme.palette.border.dark}`, borderRadius: "4px", p: 2, mb: "16px", backgroundColor: "#F9FAFB" }}>
            <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary, lineHeight: 1.6 }}>{audit.results.summary}</Typography>
          </Box>

          {/* Results tables */}
          {audit.results.tables.map((table, index) => (
            <ResultsTable key={index} table={table} threshold={audit.config?.threshold ?? 0.80} />
          ))}
        </>
      )}

      {showDeleteConfirm && (
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          title="Delete bias audit"
          body="Are you sure you want to delete this bias audit? This action cannot be undone."
          proceedText="Delete"
          cancelText="Cancel"
          onProceed={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          proceedButtonVariant="contained"
          proceedButtonColor="error"
        />
      )}
    </Box>
  );
}
