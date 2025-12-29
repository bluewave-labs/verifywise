/**
 * @fileoverview AI Detection History Page
 *
 * Page for viewing scan history.
 * Features list of past scans with status, results, and actions.
 *
 * @module pages/AIDetection/HistoryPage
 */

import { useState, useEffect, useCallback, Suspense } from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  TablePagination,
} from "@mui/material";
import Chip from "../../components/Chip";
import Alert from "../../components/Alert";
import { Trash2, ChevronsUpDown, Clock } from "lucide-react";
import ConfirmationModal from "../../components/Dialogs/ConfirmationModal";
import EmptyState from "../../components/EmptyState";
import TablePaginationActions from "../../components/TablePagination";
import singleTheme from "../../themes/v1SingleTheme";
import { getScans, deleteScan, getScanStatus } from "../../../application/repository/aiDetection.repository";
import { Scan, ScansResponse, ScanStatus } from "../../../domain/ai-detection/types";

const ACTIVE_STATUSES: ScanStatus[] = ["pending", "cloning", "scanning"];
const POLL_INTERVAL_MS = 3000;

const HISTORY_ROWS_PER_PAGE_KEY = "verifywise_ai_detection_history_rows_per_page";

const SelectorVertical = (props: React.SVGAttributes<SVGSVGElement>) => (
  <ChevronsUpDown size={16} {...props} />
);

interface HistoryPageProps {
  onScanClick: (scanId: number) => void;
  onScanDeleted: () => void;
}

const STATUS_CONFIG: Record<ScanStatus, string> = {
  pending: "Pending",
  cloning: "Cloning",
  scanning: "Scanning",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

export default function HistoryPage({ onScanClick, onScanDeleted }: HistoryPageProps) {
  const [scans, setScans] = useState<Scan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    const saved = localStorage.getItem(HISTORY_ROWS_PER_PAGE_KEY);
    return saved ? parseInt(saved, 10) : 10;
  });
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [scanToDelete, setScanToDelete] = useState<Scan | null>(null);
  const [alert, setAlert] = useState<{
    variant: "success" | "error";
    body: string;
  } | null>(null);

  // Save rowsPerPage to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(HISTORY_ROWS_PER_PAGE_KEY, rowsPerPage.toString());
  }, [rowsPerPage]);

  const loadScans = useCallback(async () => {
    setIsLoading(true);
    try {
      const response: ScansResponse = await getScans({ page: page + 1, limit: rowsPerPage });
      setScans(response.scans);
      setTotal(response.pagination.total);
    } catch (error) {
      console.error("Failed to load scans:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  // Poll for status updates on active scans
  useEffect(() => {
    const activeScans = scans.filter((scan) => ACTIVE_STATUSES.includes(scan.status));
    if (activeScans.length === 0) return;

    const pollActiveScans = async () => {
      const updates: Map<number, ScanStatus> = new Map();

      await Promise.all(
        activeScans.map(async (scan) => {
          try {
            const status = await getScanStatus(scan.id);
            if (status.status !== scan.status) {
              updates.set(scan.id, status.status);
            }
          } catch (error) {
            console.error(`Failed to poll status for scan ${scan.id}:`, error);
          }
        })
      );

      if (updates.size > 0) {
        setScans((prevScans) =>
          prevScans.map((scan) => {
            const newStatus = updates.get(scan.id);
            if (newStatus) {
              return { ...scan, status: newStatus };
            }
            return scan;
          })
        );

        // If any scan completed, reload to get full data
        const hasCompleted = Array.from(updates.values()).some(
          (status) => !ACTIVE_STATUSES.includes(status)
        );
        if (hasCompleted) {
          loadScans();
        }
      }
    };

    const intervalId = setInterval(pollActiveScans, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [scans, loadScans]);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    },
    []
  );

  const openDeleteModal = (scan: Scan, e: React.MouseEvent) => {
    e.stopPropagation();
    setScanToDelete(scan);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!scanToDelete || deletingId) return;

    const repoIdentifier = `${scanToDelete.repository_owner}/${scanToDelete.repository_name}`;
    setDeletingId(scanToDelete.id);
    try {
      await deleteScan(scanToDelete.id);
      setScans((prev) => prev.filter((s) => s.id !== scanToDelete.id));
      setTotal((prev) => prev - 1);
      onScanDeleted();
      setAlert({
        variant: "success",
        body: `Scan for ${repoIdentifier} deleted.`,
      });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      console.error("Failed to delete scan:", error);
      setAlert({
        variant: "error",
        body: `Failed to delete scan for ${repoIdentifier}.`,
      });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setDeletingId(null);
      setDeleteModalOpen(false);
      setScanToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setScanToDelete(null);
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return "-";
    const totalSeconds = Math.round(ms / 1000);
    if (totalSeconds < 60) return `${totalSeconds}s`;
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const columns = [
    {
      id: "repository",
      label: "REPOSITORY",
      render: (scan: Scan) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {scan.repository_owner}/{scan.repository_name}
        </Typography>
      ),
    },
    {
      id: "status",
      label: "STATUS",
      render: (scan: Scan) => (
        <Chip label={STATUS_CONFIG[scan.status]} size="small" />
      ),
    },
    {
      id: "findings",
      label: "FINDINGS",
      render: (scan: Scan) => (
        <Typography variant="body2">
          {scan.status === "completed" ? scan.findings_count : "-"}
        </Typography>
      ),
    },
    {
      id: "files",
      label: "FILES SCANNED",
      render: (scan: Scan) => (
        <Typography variant="body2">
          {scan.status === "completed" ? scan.files_scanned : "-"}
        </Typography>
      ),
    },
    {
      id: "duration",
      label: "DURATION",
      render: (scan: Scan) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Clock size={14} color="#667085" />
          <Typography variant="body2" sx={{ color: "#667085", fontFamily: "monospace" }}>
            {scan.status === "completed" ? formatDuration(scan.duration_ms) : "-"}
          </Typography>
        </Box>
      ),
    },
    {
      id: "triggered_by",
      label: "TRIGGERED BY",
      render: (scan: Scan) => (
        <Typography variant="body2">
          {scan.triggered_by.name}
          {scan.triggered_by.surname ? ` ${scan.triggered_by.surname}` : ""}
        </Typography>
      ),
    },
    {
      id: "actions",
      label: "",
      render: (scan: Scan) => (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
          {["completed", "failed", "cancelled"].includes(scan.status) && (
            <Tooltip title="Delete">
              <IconButton
                size="small"
                disableRipple
                disableFocusRipple
                onClick={(e) => openDeleteModal(scan, e)}
                disabled={deletingId === scan.id}
                sx={{
                  padding: "4px",
                  border: "none !important",
                  outline: "none !important",
                  boxShadow: "none !important",
                  backgroundColor: "transparent !important",
                  "&:focus": {
                    outline: "none !important",
                    border: "none !important",
                    boxShadow: "none !important",
                    backgroundColor: "transparent !important",
                  },
                  "&:hover": { backgroundColor: "transparent !important" },
                  "&:active": { backgroundColor: "transparent !important" },
                  "&.MuiIconButton-root": {
                    border: "none !important",
                    outline: "none !important",
                  },
                  "&.MuiIconButton-root:hover": { backgroundColor: "transparent !important" },
                  "&.Mui-focusVisible": {
                    outline: "none !important",
                    border: "none !important",
                    boxShadow: "none !important",
                  },
                }}
              >
                <Trash2 size={16} color="#d92d20" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  if (isLoading && scans.length === 0) {
    return (
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="body1" sx={{ color: "#667085" }}>
          Loading scan history...
        </Typography>
      </Box>
    );
  }

  if (!isLoading && scans.length === 0 && total === 0) {
    return (
      <>
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontSize: "15px", fontWeight: 600, mb: 1 }}>
            Scan history
          </Typography>
          <Typography variant="body2" sx={{ color: "#667085" }}>
            View past repository scans and their results.
          </Typography>
        </Box>

        <EmptyState
          message="No scans yet. Start your first scan to detect AI/ML libraries in a repository."
          showBorder
        />
      </>
    );
  }

  const getRange = () => {
    const start = page * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage + rowsPerPage, total);
    return `${start} - ${end}`;
  };

  return (
    <>
      {/* Toast notification */}
      {alert && (
        <Suspense fallback={null}>
          <Alert
            variant={alert.variant}
            body={alert.body}
            isToast={true}
            onClick={() => setAlert(null)}
          />
        </Suspense>
      )}

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography sx={{ fontSize: "15px", fontWeight: 600, mb: 1 }}>
          Scan history
        </Typography>
        <Typography variant="body2" sx={{ color: "#667085" }}>
          View past repository scans and their results.
        </Typography>
      </Box>

      {/* Table */}
      <TableContainer
        sx={{
          backgroundColor: "#fff",
          border: "1px solid #d0d5dd",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <Table>
            <TableHead
              sx={{
                backgroundColor:
                  singleTheme.tableStyles.primary.header.backgroundColors,
              }}
            >
              <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    sx={singleTheme.tableStyles.primary.header.cell}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody sx={singleTheme.tableStyles.primary.body}>
              {scans.map((scan) => (
                <TableRow
                  key={scan.id}
                  onClick={() => {
                    if (scan.status === "completed" || scan.status === "failed") {
                      onScanClick(scan.id);
                    }
                  }}
                  sx={{
                    ...singleTheme.tableStyles.primary.body.row,
                    cursor: ["completed", "failed"].includes(scan.status) ? "pointer" : "default",
                  }}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.id}
                      sx={singleTheme.tableStyles.primary.body.cell}
                    >
                      {col.render(scan)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow sx={{ borderTop: "none" }}>
                <TableCell
                  sx={{
                    px: 2,
                    fontSize: 12,
                    opacity: 0.7,
                    borderBottom: "none",
                  }}
                >
                  Showing {getRange()} of {total} scan(s)
                </TableCell>
                <TablePagination
                  count={total}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[5, 10, 15, 25]}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  ActionsComponent={(props) => (
                    <TablePaginationActions {...props} />
                  )}
                  labelRowsPerPage="Rows per page"
                  labelDisplayedRows={({ page: currentPage, count }) =>
                    `Page ${currentPage + 1} of ${Math.max(
                      1,
                      Math.ceil(count / rowsPerPage)
                    )}`
                  }
                  slotProps={{
                    select: {
                      MenuProps: {
                        keepMounted: true,
                        PaperProps: {
                          className: "pagination-dropdown",
                          sx: {
                            mt: 0,
                            mb: 2,
                          },
                        },
                        transformOrigin: {
                          vertical: "bottom",
                          horizontal: "left",
                        },
                        anchorOrigin: {
                          vertical: "top",
                          horizontal: "left",
                        },
                      },
                      inputProps: { id: "pagination-dropdown" },
                      IconComponent: SelectorVertical,
                      sx: {
                        ml: 4,
                        mr: 12,
                        minWidth: 20,
                        textAlign: "left",
                      },
                    },
                  }}
                  sx={{
                    mt: 6,
                    color: "text.secondary",
                    "& .MuiSelect-icon": {
                      width: "24px",
                      height: "fit-content",
                    },
                    "& .MuiSelect-select": {
                      width: 10,
                      borderRadius: "4px",
                      border: "1px solid #d0d5dd",
                      padding: 4,
                    },
                  }}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && scanToDelete && (
        <ConfirmationModal
          isOpen={deleteModalOpen}
          title="Delete scan?"
          body={
            <Typography fontSize={13} color="#344054">
              Are you sure you want to delete the scan for{" "}
              <strong>
                {scanToDelete.repository_owner}/{scanToDelete.repository_name}
              </strong>
              ? This action cannot be undone.
            </Typography>
          }
          cancelText="Cancel"
          proceedText="Delete"
          onCancel={handleCancelDelete}
          onProceed={handleConfirmDelete}
          proceedButtonColor="error"
          proceedButtonVariant="contained"
          TitleFontSize={0}
        />
      )}
    </>
  );
}
