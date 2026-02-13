import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Stack,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  useTheme,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Box,
} from "@mui/material";
import { Trash2, Eye } from "lucide-react";
import { CustomizableButton } from "../../components/button/customizable-button";
import SearchBox from "../../components/Search/SearchBox";
import { EmptyState } from "../../components/EmptyState";
import ConfirmationModal from "../../components/Dialogs/ConfirmationModal";
import NewBiasAuditModal from "./NewBiasAuditModal";
import { getStatusChip, getModeChip, formatDate } from "./biasAuditHelpers";
import {
  listBiasAudits,
  deleteBiasAudit,
  type BiasAuditSummary,
} from "../../../application/repository/deepEval.repository";

interface BiasAuditsListProps {
  orgId: string;
  onViewAudit: (auditId: string) => void;
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

export default function BiasAuditsList({ orgId, onViewAudit }: BiasAuditsListProps) {
  const theme = useTheme();
  const [audits, setAudits] = useState<BiasAuditSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [auditToDelete, setAuditToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAudits = useCallback(async () => {
    try {
      const data = await listBiasAudits({ org_id: orgId });
      setAudits(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load bias audits:", err);
      setError("Failed to load bias audits");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // Polling for running/pending audits (ref-based to avoid interval churn)
  useEffect(() => {
    const hasRunning = audits.some((a) => a.status === "running" || a.status === "pending");

    if (hasRunning && !pollingRef.current) {
      pollingRef.current = setInterval(fetchAudits, 5000);
    } else if (!hasRunning && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, [audits, fetchAudits]);

  const handleDelete = async () => {
    if (!auditToDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteBiasAudit(auditToDelete);
      setAudits((prev) => prev.filter((a) => a.id !== auditToDelete));
    } catch (err) {
      console.error("Failed to delete audit:", err);
      setError("Failed to delete audit. Please try again.");
    } finally {
      setAuditToDelete(null);
      setDeleting(false);
    }
  };

  const filteredAudits = useMemo(
    () => audits.filter((a) =>
      a.presetName.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [audits, searchQuery]
  );

  const headerCellSx = {
    fontSize: 12,
    fontWeight: 600,
    color: theme.palette.text.secondary,
    py: 1,
    px: 2,
    borderBottom: `1px solid ${theme.palette.border.dark}`,
  };

  const bodyCellSx = {
    fontSize: 13,
    py: 1.5,
    px: 2,
    borderBottom: `1px solid ${theme.palette.border.light}`,
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack spacing={0.5}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: theme.palette.text.primary }}>Bias audits</Typography>
          <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>
            Run compliance-aware bias audits against demographic datasets
          </Typography>
        </Stack>
        <CustomizableButton
          variant="contained"
          text="New bias audit"
          onClick={() => setModalOpen(true)}
          sx={{ height: 34, fontSize: 13 }}
        />
      </Stack>

      {/* Search */}
      <Box sx={{ mb: 2, maxWidth: 320 }}>
        <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Search audits..." />
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, fontSize: 13 }}>
          {error}
        </Alert>
      )}

      {/* Content */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={24} sx={{ color: theme.palette.primary.main }} />
        </Box>
      ) : filteredAudits.length === 0 ? (
        <EmptyState
          message="No bias audits yet. Create your first bias audit to get started."
          showBorder
        />
      ) : (
        <TableContainer
          sx={{
            border: `1px solid ${theme.palette.border.dark}`,
            borderRadius: "4px",
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ ...headerCellSx, width: "25%" }}>Framework</TableCell>
                <TableCell sx={{ ...headerCellSx, width: "15%" }}>Mode</TableCell>
                <TableCell sx={{ ...headerCellSx, width: "15%" }}>Status</TableCell>
                <TableCell sx={{ ...headerCellSx, width: "15%" }}>Result</TableCell>
                <TableCell sx={{ ...headerCellSx, width: "20%" }}>Date</TableCell>
                <TableCell sx={{ ...headerCellSx, width: "10%" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAudits.map((audit) => (
                <TableRow
                  key={audit.id}
                  onClick={() => onViewAudit(audit.id)}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: theme.palette.action.hover },
                    "&:last-child td": { borderBottom: 0 },
                  }}
                >
                  <TableCell sx={bodyCellSx}>
                    <Typography sx={{ fontSize: 13, color: theme.palette.text.primary }}>
                      {audit.presetName}
                    </Typography>
                  </TableCell>
                  <TableCell sx={bodyCellSx}>{getModeChip(audit.mode)}</TableCell>
                  <TableCell sx={bodyCellSx}>{getStatusChip(audit.status)}</TableCell>
                  <TableCell sx={bodyCellSx}>{getResultSummary(audit)}</TableCell>
                  <TableCell sx={bodyCellSx}>
                    <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>
                      {formatDate(audit.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={bodyCellSx} onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        size="small"
                        onClick={() => onViewAudit(audit.id)}
                        sx={{ padding: 0.5 }}
                      >
                        <Eye size={16} strokeWidth={1.5} color={theme.palette.text.secondary} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setAuditToDelete(audit.id)}
                        sx={{ padding: 0.5 }}
                      >
                        <Trash2 size={16} strokeWidth={1.5} color={theme.palette.text.secondary} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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
