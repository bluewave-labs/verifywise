import { useMemo } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
import { CustomizableButton } from "../../../components/button/customizable-button";
import SearchBox from "../../../components/Search/SearchBox";
import Select from "../../../components/Inputs/Select";
import { EmptyState } from "../../../components/EmptyState";
import InfoBox from "../../../components/InfoBox";
import singleTheme from "../../../themes/v1SingleTheme";
import { useAuditLedger } from "./hooks/useAuditLedger";

const ENTITY_TYPE_ITEMS = [
  { _id: "", name: "All entity types" },
  { _id: "vendor", name: "Vendor" },
  { _id: "vendor_risk", name: "Vendor risk" },
  { _id: "project_risk", name: "Project risk" },
  { _id: "policy", name: "Policy" },
  { _id: "incident", name: "Incident" },
  { _id: "use_case", name: "Use case" },
  { _id: "model_inventory", name: "Model inventory" },
  { _id: "file", name: "File" },
  { _id: "dataset", name: "Dataset" },
];

const ENTRY_TYPE_ITEMS = [
  { _id: "", name: "All entry types" },
  { _id: "event_log", name: "Event log" },
  { _id: "change_history", name: "Change history" },
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
        label: "Chain not yet verified — click 'Verify chain' to check integrity",
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
    return {
      icon: <ShieldAlert size={18} strokeWidth={1.5} />,
      label: `Chain compromised at entry #${verifyResult.brokenAtId}`,
      color: theme.palette.status.error.text,
      bg: theme.palette.status.error.bg,
    };
  }, [verifyResult, theme]);

  return (
    <Stack sx={{ gap: "16px" }}>
      {/* Info box */}
      <InfoBox
        header="Tamper-proof audit ledger"
        message="Every change made on the platform is recorded as an append-only, hash-chained entry. Each entry's cryptographic hash depends on the previous one, so any modification or deletion would break the chain. Click 'Verify chain' to confirm that no entries have been altered or removed since they were recorded."
        storageKey="audit-ledger-info"
        variant="info"
      />

      {/* Verification banner */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: "16px",
          py: "12px",
          borderRadius: "4px",
          border: `1px solid ${theme.palette.border.light}`,
          backgroundColor: verifyBanner.bg,
        }}
      >
        <Stack direction="row" alignItems="center" sx={{ gap: "8px" }}>
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

      {/* Filters row */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Stack direction="row" alignItems="center" sx={{ gap: "8px" }}>
          <Select
            id="audit-entity-type"
            placeholder="All entity types"
            value={filters.entity_type}
            items={ENTITY_TYPE_ITEMS}
            onChange={(e: SelectChangeEvent<string | number>) =>
              updateFilters({ entity_type: String(e.target.value) })
            }
            sx={{ minWidth: 170 }}
          />
          <Select
            id="audit-entry-type"
            placeholder="All entry types"
            value={filters.entry_type}
            items={ENTRY_TYPE_ITEMS}
            onChange={(e: SelectChangeEvent<string | number>) =>
              updateFilters({ entry_type: String(e.target.value) })
            }
            sx={{ minWidth: 160 }}
          />
          <SearchBox
            value={filters.searchUser}
            onChange={(val: string) => updateFilters({ searchUser: val })}
            placeholder="Search user..."
            fullWidth={false}
          />
        </Stack>
      </Stack>

      {/* Table */}
      {isLoading ? (
        <Stack alignItems="center" sx={{ py: "64px" }}>
          <CircularProgress size={28} />
        </Stack>
      ) : entries.length === 0 ? (
        <EmptyState
          message="No audit ledger entries found."
          showBorder
        />
      ) : (
        <Stack sx={{ gap: "16px" }}>
          <TableContainer sx={singleTheme.tableStyles.primary.frame}>
            <Table>
              <TableHead>
                <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                  <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Timestamp</TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.header.cell}>User</TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Action</TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Entity type</TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Entity ID</TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Entry type</TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Hash</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id} sx={singleTheme.tableStyles.primary.body.row}>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      {formatTimestamp(entry.occurred_at)}
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      {getUserDisplay(entry.user_name, entry.user_surname)}
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      {entry.event_type ?? entry.action ?? "-"}
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      {entry.entity_type ?? "-"}
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      {entry.entity_id ?? "-"}
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <Typography
                        component="span"
                        sx={{
                          fontSize: 12,
                          px: "8px",
                          py: "2px",
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
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
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
          >
            <Typography
              sx={{ fontSize: 13, color: theme.palette.text.accent }}
            >
              {filters.searchUser
                ? `${entries.length} matching of ${total.toLocaleString()} entries`
                : `${total.toLocaleString()} total entries`}
            </Typography>
            <Stack direction="row" alignItems="center" sx={{ gap: "8px" }}>
              <CustomizableButton
                variant="outlined"
                onClick={prevPage}
                disabled={offset === 0}
                sx={{ height: 30, minWidth: 30, px: "8px" }}
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
                sx={{ height: 30, minWidth: 30, px: "8px" }}
              >
                <ChevronRight size={16} />
              </CustomizableButton>
            </Stack>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
