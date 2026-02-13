import { useState, useEffect, useCallback } from "react";
import { Box, Stack, Typography, Chip, IconButton, CircularProgress } from "@mui/material";
import { Plus, Trash2, Eye, RefreshCw, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import { CustomizableButton } from "../../components/button/customizable-button";
import SearchBox from "../../components/Search/SearchBox";
import ConfirmationModal from "../../components/Dialogs/ConfirmationModal";
import NewBiasAuditModal from "./NewBiasAuditModal";
import {
  listBiasAudits,
  deleteBiasAudit,
  type BiasAuditSummary,
} from "../../../application/repository/deepEval.repository";

interface BiasAuditsListProps {
  orgId: string;
  onViewAudit: (auditId: string) => void;
}

function getStatusChip(status: string) {
  switch (status) {
    case "completed":
      return (
        <Chip
          label="Completed"
          size="small"
          icon={<CheckCircle size={12} />}
          sx={{ backgroundColor: "#ECFDF5", color: "#065F46", fontSize: 11, height: 22 }}
        />
      );
    case "running":
      return (
        <Chip
          label="Running"
          size="small"
          icon={<RefreshCw size={12} />}
          sx={{ backgroundColor: "#EFF6FF", color: "#1E40AF", fontSize: 11, height: 22 }}
        />
      );
    case "pending":
      return (
        <Chip
          label="Pending"
          size="small"
          icon={<Clock size={12} />}
          sx={{ backgroundColor: "#F9FAFB", color: "#374151", fontSize: 11, height: 22 }}
        />
      );
    case "failed":
      return (
        <Chip
          label="Failed"
          size="small"
          icon={<XCircle size={12} />}
          sx={{ backgroundColor: "#FEF2F2", color: "#991B1B", fontSize: 11, height: 22 }}
        />
      );
    default:
      return <Chip label={status} size="small" sx={{ fontSize: 11, height: 22 }} />;
  }
}

function getModeChip(mode: string) {
  const labels: Record<string, string> = {
    quantitative_audit: "Quantitative",
    impact_assessment: "Assessment",
    compliance_checklist: "Checklist",
    framework_assessment: "Framework",
    custom: "Custom",
  };
  return (
    <Chip
      label={labels[mode] || mode}
      size="small"
      variant="outlined"
      sx={{ fontSize: 11, height: 22, borderColor: "#d0d5dd" }}
    />
  );
}

function getResultSummary(audit: BiasAuditSummary) {
  if (audit.status !== "completed" || !audit.results) return "—";
  const flags = audit.results.flags_count;
  if (flags === 0) return <Typography sx={{ fontSize: 13, color: "#065F46" }}>No flags</Typography>;
  return (
    <Typography sx={{ fontSize: 13, color: "#991B1B", fontWeight: 500 }}>
      {flags} flag{flags !== 1 ? "s" : ""}
    </Typography>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function BiasAuditsList({ orgId, onViewAudit }: BiasAuditsListProps) {
  const [audits, setAudits] = useState<BiasAuditSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [auditToDelete, setAuditToDelete] = useState<string | null>(null);

  const fetchAudits = useCallback(async () => {
    try {
      const data = await listBiasAudits({ org_id: orgId });
      setAudits(data);
    } catch (err) {
      console.error("Failed to load bias audits:", err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  // Polling for running/pending audits
  useEffect(() => {
    const hasRunning = audits.some((a) => a.status === "running" || a.status === "pending");
    if (!hasRunning) return;
    const interval = setInterval(fetchAudits, 5000);
    return () => clearInterval(interval);
  }, [audits, fetchAudits]);

  const handleDelete = async () => {
    if (!auditToDelete) return;
    try {
      await deleteBiasAudit(auditToDelete);
      setAudits((prev) => prev.filter((a) => a.id !== auditToDelete));
    } catch (err) {
      console.error("Failed to delete audit:", err);
    } finally {
      setAuditToDelete(null);
    }
  };

  const filteredAudits = audits.filter((a) =>
    a.presetName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack spacing={0.5}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>Bias audits</Typography>
          <Typography sx={{ fontSize: 13, color: "#667085" }}>
            Run compliance-aware bias audits against demographic datasets
          </Typography>
        </Stack>
        <CustomizableButton
          variant="contained"
          text="New bias audit"
          onClick={() => setModalOpen(true)}
          sx={{ height: 34, fontSize: 13, backgroundColor: "#13715B", "&:hover": { backgroundColor: "#0F5A47" } }}
        />
      </Stack>

      {/* Search */}
      <Box sx={{ mb: 2, maxWidth: 320 }}>
        <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Search audits..." />
      </Box>

      {/* Content */}
      <Box sx={{ border: "1px solid #d0d5dd", borderRadius: "4px", backgroundColor: "#fff" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={24} sx={{ color: "#13715B" }} />
          </Box>
        ) : filteredAudits.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 8,
              gap: 2,
            }}
          >
            <AlertTriangle size={40} color="#d0d5dd" strokeWidth={1} />
            <Typography sx={{ fontSize: 14, color: "#667085" }}>No bias audits yet</Typography>
            <Typography sx={{ fontSize: 13, color: "#98a2b3" }}>
              Create your first bias audit to get started
            </Typography>
          </Box>
        ) : (
          <>
            {/* Table Header */}
            <Stack direction="row" sx={{ borderBottom: "1px solid #d0d5dd", py: 1, px: 2 }}>
              <Typography sx={{ width: "25%", fontSize: 12, fontWeight: 600, color: "#475467" }}>
                Framework
              </Typography>
              <Typography sx={{ width: "15%", fontSize: 12, fontWeight: 600, color: "#475467" }}>Mode</Typography>
              <Typography sx={{ width: "15%", fontSize: 12, fontWeight: 600, color: "#475467" }}>
                Status
              </Typography>
              <Typography sx={{ width: "15%", fontSize: 12, fontWeight: 600, color: "#475467" }}>
                Result
              </Typography>
              <Typography sx={{ width: "20%", fontSize: 12, fontWeight: 600, color: "#475467" }}>Date</Typography>
              <Typography sx={{ width: "10%", fontSize: 12, fontWeight: 600, color: "#475467" }}>
                Actions
              </Typography>
            </Stack>

            {/* Table Rows */}
            {filteredAudits.map((audit) => (
              <Stack
                key={audit.id}
                direction="row"
                alignItems="center"
                sx={{
                  borderBottom: "1px solid #f2f4f7",
                  py: 1.5,
                  px: 2,
                  cursor: "pointer",
                  "&:hover": { backgroundColor: "#f9fafb" },
                }}
                onClick={() => onViewAudit(audit.id)}
              >
                <Typography sx={{ width: "25%", fontSize: 13, color: "#111827" }}>{audit.presetName}</Typography>
                <Box sx={{ width: "15%" }}>{getModeChip(audit.mode)}</Box>
                <Box sx={{ width: "15%" }}>{getStatusChip(audit.status)}</Box>
                <Box sx={{ width: "15%" }}>{getResultSummary(audit)}</Box>
                <Typography sx={{ width: "20%", fontSize: 13, color: "#667085" }}>
                  {formatDate(audit.createdAt)}
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ width: "10%" }}>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewAudit(audit.id);
                    }}
                    sx={{ padding: 0.5 }}
                  >
                    <Eye size={16} strokeWidth={1.5} color="#667085" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAuditToDelete(audit.id);
                    }}
                    sx={{ padding: 0.5 }}
                  >
                    <Trash2 size={16} strokeWidth={1.5} color="#667085" />
                  </IconButton>
                </Stack>
              </Stack>
            ))}
          </>
        )}
      </Box>

      {/* New Bias Audit Modal */}
      <NewBiasAuditModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        orgId={orgId}
        onAuditCreated={(auditId) => {
          setModalOpen(false);
          fetchAudits();
        }}
      />

      {/* Delete Confirmation Modal */}
      {!!auditToDelete && (
        <ConfirmationModal
          isOpen={!!auditToDelete}
          title="Delete bias audit"
          body="Are you sure you want to delete this bias audit? This action cannot be undone."
          proceedText="Delete"
          cancelText="Cancel"
          onProceed={handleDelete}
          onCancel={() => setAuditToDelete(null)}
          proceedButtonVariant="contained"
          proceedButtonColor="error"
        />
      )}
    </Box>
  );
}
