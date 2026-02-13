import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Stack, Typography, Chip, CircularProgress } from "@mui/material";
import { ArrowLeft, CheckCircle, XCircle, RefreshCw, Clock } from "lucide-react";
import { CustomizableButton } from "../../components/button/customizable-button";
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

// Helper: SummaryCard component
function SummaryCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Box sx={{ border: "1px solid #d0d5dd", borderRadius: "4px", p: 2, flex: 1, backgroundColor: "#fff" }}>
      <Typography sx={{ fontSize: 11, color: "#667085", mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: highlight ? "#B42318" : "#111827" }}>{value}</Typography>
    </Box>
  );
}

// Helper: ResultsTable component
function ResultsTable({ table, threshold }: { table: CategoryTableResult; threshold: number }) {
  return (
    <Box sx={{ border: "1px solid #d0d5dd", borderRadius: "4px", mb: 3, overflow: "hidden" }}>
      <Box sx={{ px: 2, py: 1.5, backgroundColor: "#F9FAFB", borderBottom: "1px solid #d0d5dd" }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#344054" }}>{table.title}</Typography>
        {table.highest_group && (
          <Typography sx={{ fontSize: 11, color: "#667085" }}>
            Highest rate: {table.highest_group} ({((table.highest_rate || 0) * 100).toFixed(1)}%)
          </Typography>
        )}
      </Box>

      {/* Table header */}
      <Stack direction="row" sx={{ borderBottom: "1px solid #e5e7eb", py: 1, px: 2, backgroundColor: "#fff" }}>
        <Typography sx={{ width: "25%", fontSize: 12, fontWeight: 600, color: "#475467" }}>Group</Typography>
        <Typography sx={{ width: "15%", fontSize: 12, fontWeight: 600, color: "#475467", textAlign: "right" }}>Applicants</Typography>
        <Typography sx={{ width: "15%", fontSize: 12, fontWeight: 600, color: "#475467", textAlign: "right" }}>Selected</Typography>
        <Typography sx={{ width: "15%", fontSize: 12, fontWeight: 600, color: "#475467", textAlign: "right" }}>Selection rate</Typography>
        <Typography sx={{ width: "15%", fontSize: 12, fontWeight: 600, color: "#475467", textAlign: "right" }}>Impact ratio</Typography>
        <Typography sx={{ width: "15%", fontSize: 12, fontWeight: 600, color: "#475467", textAlign: "right" }}>Status</Typography>
      </Stack>

      {/* Table rows */}
      {table.rows.map((row, idx) => (
        <Stack
          key={idx}
          direction="row"
          alignItems="center"
          sx={{
            borderBottom: idx < table.rows.length - 1 ? "1px solid #f2f4f7" : "none",
            py: 1.25,
            px: 2,
            backgroundColor: row.flagged ? "#FEF2F2" : "#fff",
          }}
        >
          <Typography sx={{ width: "25%", fontSize: 13, color: "#111827" }}>{row.category_name}</Typography>
          <Typography sx={{ width: "15%", fontSize: 13, color: "#475467", textAlign: "right" }}>{row.applicant_count.toLocaleString()}</Typography>
          <Typography sx={{ width: "15%", fontSize: 13, color: "#475467", textAlign: "right" }}>{row.selected_count.toLocaleString()}</Typography>
          <Typography sx={{ width: "15%", fontSize: 13, color: "#475467", textAlign: "right" }}>{(row.selection_rate * 100).toFixed(1)}%</Typography>
          <Typography sx={{ width: "15%", fontSize: 13, textAlign: "right", color: row.excluded ? "#98a2b3" : row.flagged ? "#B42318" : "#475467", fontWeight: row.flagged ? 600 : 400 }}>
            {row.excluded ? "Excluded (<2%)" : row.impact_ratio != null ? row.impact_ratio.toFixed(3) : "—"}
          </Typography>
          <Box sx={{ width: "15%", display: "flex", justifyContent: "flex-end" }}>
            {row.excluded ? (
              <Chip label="N/A" size="small" sx={{ fontSize: 10, height: 20, backgroundColor: "#F3F4F6", color: "#6B7280" }} />
            ) : row.flagged ? (
              <Chip label="Flag" size="small" sx={{ fontSize: 10, height: 20, backgroundColor: "#FEE2E2", color: "#991B1B" }} />
            ) : (
              <Chip label="Pass" size="small" sx={{ fontSize: 10, height: 20, backgroundColor: "#ECFDF5", color: "#065F46" }} />
            )}
          </Box>
        </Stack>
      ))}
    </Box>
  );
}

// Helper: getModeChip
function getModeChip(mode: string) {
  const labels: Record<string, string> = {
    quantitative_audit: "Quantitative",
    impact_assessment: "Assessment",
    compliance_checklist: "Checklist",
    framework_assessment: "Framework",
    custom: "Custom",
  };
  return <Chip label={labels[mode] || mode} size="small" variant="outlined" sx={{ fontSize: 11, height: 22, borderColor: "#d0d5dd" }} />;
}

// Helper: getStatusChip
function getStatusChip(status: string) {
  switch (status) {
    case "completed":
      return <Chip label="Completed" size="small" icon={<CheckCircle size={12} />} sx={{ backgroundColor: "#ECFDF5", color: "#065F46", fontSize: 11, height: 22 }} />;
    case "running":
      return <Chip label="Running" size="small" icon={<RefreshCw size={12} />} sx={{ backgroundColor: "#EFF6FF", color: "#1E40AF", fontSize: 11, height: 22 }} />;
    case "pending":
      return <Chip label="Pending" size="small" icon={<Clock size={12} />} sx={{ backgroundColor: "#F9FAFB", color: "#374151", fontSize: 11, height: 22 }} />;
    case "failed":
      return <Chip label="Failed" size="small" icon={<XCircle size={12} />} sx={{ backgroundColor: "#FEF2F2", color: "#991B1B", fontSize: 11, height: 22 }} />;
    default:
      return <Chip label={status} size="small" sx={{ fontSize: 11, height: 22 }} />;
  }
}

export default function BiasAuditDetail({ auditId, onBack }: BiasAuditDetailProps) {
  const [audit, setAudit] = useState<BiasAuditDetailResponse | null>(null);
  const [status, setStatus] = useState<string>("pending");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      const data = await getBiasAuditResults(auditId);
      setAudit(data);
      setStatus(data.status);
      setLoading(false);
    } catch (err: any) {
      if (err?.response?.status === 202) {
        // Still running
        const statusData = await getBiasAuditStatus(auditId);
        setStatus(statusData.status);
        setLoading(false);
      } else if (err?.response?.status === 500) {
        setError(err.response?.data?.detail || "Audit failed");
        setStatus("failed");
        setLoading(false);
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
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
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
          sx={{ cursor: "pointer", display: "flex", alignItems: "center", p: 0.5, borderRadius: "4px", "&:hover": { backgroundColor: "#f2f4f7" } }}
        >
          <ArrowLeft size={18} color="#475467" strokeWidth={1.5} />
        </Box>
        <Stack spacing={0.5} flex={1}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
              {audit?.presetName || "Bias audit"}
            </Typography>
            {audit?.mode && getModeChip(audit.mode)}
            {getStatusChip(status)}
          </Stack>
          {audit?.createdAt && (
            <Typography sx={{ fontSize: 12, color: "#667085" }}>
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
              sx={{ height: 34, fontSize: 13, border: "1px solid #d0d5dd", color: "#344054" }}
            />
          )}
          <CustomizableButton
            variant="outlined"
            text={isDeleting ? "Deleting..." : "Delete"}
            onClick={handleDelete}
            disabled={isDeleting}
            sx={{ height: 34, fontSize: 13, border: "1px solid #d0d5dd", color: "#B42318", "&:hover": { backgroundColor: "#FEF3F2", border: "1px solid #FCA5A5" } }}
          />
        </Stack>
      </Stack>

      {/* Loading/pending/running state */}
      {(loading || status === "pending" || status === "running") && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10, gap: 2 }}>
          <CircularProgress size={32} sx={{ color: "#13715B" }} />
          <Typography sx={{ fontSize: 14, color: "#475467" }}>
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
          <Stack direction="row" spacing={2} mb={3}>
            <SummaryCard label="Total applicants" value={audit.results.total_applicants.toLocaleString()} />
            <SummaryCard label="Total selected" value={audit.results.total_selected.toLocaleString()} />
            <SummaryCard label="Selection rate" value={`${(audit.results.overall_selection_rate * 100).toFixed(1)}%`} />
            <SummaryCard label="Flags" value={audit.results.flags_count.toString()} highlight={audit.results.flags_count > 0} />
            {audit.results.unknown_count > 0 && (
              <SummaryCard label="Unknown" value={audit.results.unknown_count.toLocaleString()} />
            )}
          </Stack>

          {/* Summary text */}
          <Box sx={{ border: "1px solid #d0d5dd", borderRadius: "4px", p: 2, mb: 3, backgroundColor: "#F9FAFB" }}>
            <Typography sx={{ fontSize: 13, color: "#475467", lineHeight: 1.6 }}>{audit.results.summary}</Typography>
          </Box>

          {/* Results tables */}
          {audit.results.tables.map((table, index) => (
            <ResultsTable key={index} table={table} threshold={audit.config?.threshold ?? 0.80} />
          ))}
        </>
      )}
    </Box>
  );
}
