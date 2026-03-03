import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
  Stack,
  useTheme,
  type SelectChangeEvent,
} from "@mui/material";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CustomizableButton } from "../../components/button/customizable-button";
import { SearchBox } from "../../components/Search";
import { EmptyState } from "../../components/EmptyState";
import { useAuth } from "../../../application/hooks/useAuth";
import { useAuditLedger } from "./hooks/useAuditLedger";

const ENTITY_TYPES = [
  { value: "", label: "All entity types" },
  { value: "vendor", label: "Vendor" },
  { value: "vendor_risk", label: "Vendor risk" },
  { value: "project_risk", label: "Project risk" },
  { value: "policy", label: "Policy" },
  { value: "incident", label: "Incident" },
  { value: "use_case", label: "Use case" },
  { value: "model_inventory", label: "Model inventory" },
  { value: "file", label: "File" },
  { value: "dataset", label: "Dataset" },
];

const ENTRY_TYPES = [
  { value: "", label: "All entry types" },
  { value: "event_log", label: "Event log" },
  { value: "change_history", label: "Change history" },
];

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getUserDisplay(
  name: string | null,
  surname: string | null
): string {
  if (name || surname) {
    return `${name ?? ""} ${surname ?? ""}`.trim();
  }
  return "Unknown user";
}

export default function AuditLedger() {
  const theme = useTheme();
  const { userRoleName } = useAuth();

  // Admin-only page: redirect non-admins to dashboard
  if (userRoleName && userRoleName !== "Admin") {
    return <Navigate to="/" replace />;
  }

  const {
    entries,
    total,
    isLoading,
    filters,
    updateFilters,
    offset,
    pageSize,
    nextPage,
    prevPage,
    verify,
    verifyResult,
    isVerifying,
  } = useAuditLedger();

  const currentPage = Math.floor(offset / pageSize) + 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const verifyBanner = useMemo(() => {
    if (!verifyResult) {
      return {
        icon: <ShieldQuestion size={18} strokeWidth={1.5} />,
        label: "Chain integrity not yet verified",
        color: theme.palette.text.accent,
        bg: theme.palette.background.alt,
      };
    }
    if (
      verifyResult.status === "intact" ||
      verifyResult.status === "partial"
    ) {
      const suffix =
        verifyResult.status === "partial"
          ? ` (verified ${verifyResult.totalEntries.toLocaleString()} entries)`
          : ` (${verifyResult.totalEntries.toLocaleString()} entries)`;
      return {
        icon: <ShieldCheck size={18} strokeWidth={1.5} />,
        label: `Chain intact${suffix}`,
        color: theme.palette.status.success.text,
        bg: theme.palette.status.success.bg,
      };
    }
    if (verifyResult.status === "empty") {
      return {
        icon: <ShieldQuestion size={18} strokeWidth={1.5} />,
        label: "Ledger is empty",
        color: theme.palette.text.accent,
        bg: theme.palette.background.alt,
      };
    }
    // compromised
    return {
      icon: <ShieldAlert size={18} strokeWidth={1.5} />,
      label: `Chain compromised at entry #${verifyResult.brokenAtId}`,
      color: theme.palette.status.error.text,
      bg: theme.palette.status.error.bg,
    };
  }, [verifyResult, theme]);

  const selectSx = {
    height: 34,
    fontSize: 13,
    "& .MuiSelect-select": { py: "6px" },
  };

  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          Audit ledger
        </Typography>
      </Stack>

      {/* Verification banner */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2,
          py: 1.5,
          mb: 2,
          borderRadius: "4px",
          border: `1px solid ${theme.palette.border.light}`,
          backgroundColor: verifyBanner.bg,
        }}
      >
        <Stack direction="row" alignItems="center" gap={1}>
          <Box sx={{ color: verifyBanner.color, display: "flex" }}>
            {verifyBanner.icon}
          </Box>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 500,
              color: verifyBanner.color,
            }}
          >
            {verifyBanner.label}
          </Typography>
        </Stack>
        <CustomizableButton
          text={isVerifying ? "Verifying..." : "Verify chain"}
          variant="contained"
          onClick={verify}
          disabled={isVerifying}
          sx={{ height: 34, minWidth: 120 }}
        />
      </Stack>

      {/* Filters */}
      <Stack direction="row" alignItems="center" gap={1.5} sx={{ mb: 2 }}>
        <Select
          value={filters.entity_type}
          onChange={(e: SelectChangeEvent) =>
            updateFilters({ entity_type: e.target.value })
          }
          displayEmpty
          size="small"
          sx={{ ...selectSx, minWidth: 160 }}
        >
          {ENTITY_TYPES.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
        <Select
          value={filters.entry_type}
          onChange={(e: SelectChangeEvent) =>
            updateFilters({ entry_type: e.target.value })
          }
          displayEmpty
          size="small"
          sx={{ ...selectSx, minWidth: 150 }}
        >
          {ENTRY_TYPES.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
        <SearchBox
          value={filters.searchUser}
          onChange={(val: string) => updateFilters({ searchUser: val })}
          placeholder="Search by user name..."
        />
      </Stack>

      {/* Table */}
      {isLoading ? (
        <Stack alignItems="center" sx={{ py: 8 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : entries.length === 0 ? (
        <EmptyState
          message="No audit ledger entries found."
          showBorder
        />
      ) : (
        <>
          <TableContainer
            sx={{
              border: `1px solid ${theme.palette.border.light}`,
              borderRadius: "4px",
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{ backgroundColor: theme.palette.background.alt }}
                >
                  <TableCell sx={headerCellSx}>Timestamp</TableCell>
                  <TableCell sx={headerCellSx}>User</TableCell>
                  <TableCell sx={headerCellSx}>Action</TableCell>
                  <TableCell sx={headerCellSx}>Entity type</TableCell>
                  <TableCell sx={headerCellSx}>Entity ID</TableCell>
                  <TableCell sx={headerCellSx}>Entry type</TableCell>
                  <TableCell sx={headerCellSx}>Hash</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell sx={cellSx}>
                      {formatTimestamp(entry.occurred_at)}
                    </TableCell>
                    <TableCell sx={cellSx}>
                      {getUserDisplay(entry.user_name, entry.user_surname)}
                    </TableCell>
                    <TableCell sx={cellSx}>
                      {entry.event_type ?? entry.action ?? "-"}
                    </TableCell>
                    <TableCell sx={cellSx}>
                      {entry.entity_type ?? "-"}
                    </TableCell>
                    <TableCell sx={cellSx}>
                      {entry.entity_id ?? "-"}
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Typography
                        component="span"
                        sx={{
                          fontSize: 12,
                          px: 1,
                          py: 0.25,
                          borderRadius: "4px",
                          backgroundColor:
                            entry.entry_type === "event_log"
                              ? theme.palette.background.fill
                              : theme.palette.status.warning.bg,
                          color:
                            entry.entry_type === "event_log"
                              ? theme.palette.primary.main
                              : theme.palette.status.warning.text,
                          fontWeight: 500,
                        }}
                      >
                        {entry.entry_type === "event_log"
                          ? "Event log"
                          : "Change history"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={cellSx}>
                      <Tooltip title={entry.entry_hash.trim()} arrow>
                        <Typography
                          component="span"
                          sx={{
                            fontSize: 12,
                            fontFamily: "monospace",
                            color: theme.palette.text.accent,
                            cursor: "default",
                          }}
                        >
                          {entry.entry_hash.trim().slice(0, 12)}...
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: 1.5 }}
          >
            <Typography
              sx={{ fontSize: 13, color: theme.palette.text.accent }}
            >
              {filters.searchUser
                ? `${entries.length} matching of ${total.toLocaleString()} entries`
                : `${total.toLocaleString()} total entries`}
            </Typography>
            <Stack direction="row" alignItems="center" gap={1}>
              <CustomizableButton
                variant="outlined"
                onClick={prevPage}
                disabled={offset === 0}
                sx={{ height: 30, minWidth: 30, px: 1 }}
              >
                <ChevronLeft size={16} />
              </CustomizableButton>
              <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>
                Page {currentPage} of {totalPages}
              </Typography>
              <CustomizableButton
                variant="outlined"
                onClick={nextPage}
                disabled={offset + pageSize >= total}
                sx={{ height: 30, minWidth: 30, px: 1 }}
              >
                <ChevronRight size={16} />
              </CustomizableButton>
            </Stack>
          </Stack>
        </>
      )}
    </Box>
  );
}

const headerCellSx = {
  fontSize: 12,
  fontWeight: 600,
  color: "text.tertiary",
  py: 1,
  whiteSpace: "nowrap" as const,
};

const cellSx = {
  fontSize: 13,
  py: 1,
  borderBottom: "1px solid",
  borderBottomColor: "border.light",
};
