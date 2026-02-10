/**
 * Shadow AI Tools Page
 *
 * Lists detected AI tools with status management and detail view.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Stack,
  Typography,
  Paper,
  Skeleton,
  SelectChangeEvent,
  Box,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  TableFooter,
  useTheme,
} from "@mui/material";
import Chip from "../../components/Chip";
import {
  ArrowLeft,
  Globe,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ChevronsUpDown,
} from "lucide-react";
import {
  getTools,
  getToolById,
  updateToolStatus,
  GetToolsParams,
} from "../../../application/repository/shadowAi.repository";
import {
  IShadowAiTool,
  ShadowAiToolStatus,
} from "../../../domain/interfaces/i.shadowAi";
import singleTheme from "../../themes/v1SingleTheme";
import EmptyState from "../../components/EmptyState";
import { CustomizableButton } from "../../components/button/customizable-button";
import Select from "../../components/Inputs/Select";
import RiskBadge from "../../components/RiskBadge";
import { DashboardHeaderCard } from "../../components/Cards/DashboardHeaderCard";
import TablePaginationActions from "../../components/TablePagination";
import GovernanceWizardModal from "./GovernanceWizardModal";

const ROWS_PER_PAGE = 20;

const SelectorVertical = (props: React.SVGAttributes<SVGSVGElement>) => (
  <ChevronsUpDown size={16} {...props} />
);

const STATUS_OPTIONS = [
  { _id: "all", name: "All statuses" },
  { _id: "detected", name: "Detected" },
  { _id: "under_review", name: "Under review" },
  { _id: "approved", name: "Approved" },
  { _id: "restricted", name: "Restricted" },
  { _id: "blocked", name: "Blocked" },
  { _id: "dismissed", name: "Dismissed" },
];

const STATUS_CONFIG: Record<
  ShadowAiToolStatus,
  { label: string; color: string; bg: string }
> = {
  detected: { label: "Detected", color: "#3B82F6", bg: "#EFF6FF" },
  under_review: { label: "Under review", color: "#F59E0B", bg: "#FFFBEB" },
  approved: { label: "Approved", color: "#10B981", bg: "#ECFDF5" },
  restricted: { label: "Restricted", color: "#F97316", bg: "#FFF7ED" },
  blocked: { label: "Blocked", color: "#DC2626", bg: "#FEF2F2" },
  dismissed: { label: "Dismissed", color: "#6B7280", bg: "#F9FAFB" },
};

export default function AIToolsPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [tools, setTools] = useState<IShadowAiTool[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ShadowAiToolStatus | "all">("all");
  const [selectedTool, setSelectedTool] = useState<(IShadowAiTool & {
    departments?: { department: string; user_count: number }[];
    top_users?: { user_email: string; event_count: number }[];
  }) | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [governanceModalOpen, setGovernanceModalOpen] = useState(false);

  const fetchTools = useCallback(async () => {
    setLoading(true);
    try {
      const params: GetToolsParams = {
        page,
        limit: ROWS_PER_PAGE,
        sort_by: "risk_score",
        order: "desc",
      };
      if (statusFilter !== "all") params.status = statusFilter;
      const result = await getTools(params);
      setTools(result.tools);
      setTotal(result.total);
    } catch (error) {
      console.error("Failed to load tools:", error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchTools();
  }, [fetchTools]);

  const handleToolClick = async (tool: IShadowAiTool) => {
    setDetailLoading(true);
    try {
      const detail = await getToolById(tool.id);
      setSelectedTool(detail);
    } catch (error) {
      console.error("Failed to load tool detail:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (
    toolId: number,
    newStatus: ShadowAiToolStatus
  ) => {
    try {
      await updateToolStatus(toolId, newStatus);
      // Refresh the list
      fetchTools();
      // If viewing detail, refresh it too
      if (selectedTool?.id === toolId) {
        const detail = await getToolById(toolId);
        setSelectedTool(detail);
      }
    } catch (error) {
      console.error("Failed to update tool status:", error);
    }
  };

  const handleBack = () => {
    setSelectedTool(null);
  };

  // ─── Detail view ───
  if (selectedTool) {
    const cfg = STATUS_CONFIG[selectedTool.status];
    return (
      <Stack gap="16px">
        <Stack direction="row" alignItems="center" gap="8px">
          <IconButton onClick={handleBack} size="small">
            <ArrowLeft size={16} strokeWidth={1.5} />
          </IconButton>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
            {selectedTool.name}
          </Typography>
          <Chip
            label={cfg.label}
            size="small"
            backgroundColor={cfg.bg}
            textColor={cfg.color}
            uppercase={false}
          />
        </Stack>

        {detailLoading ? (
          <Skeleton height={300} />
        ) : (
          <Stack gap="16px">
            {/* Summary cards */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                "& > *": {
                  flex: "1 1 0",
                  minWidth: "120px",
                },
              }}
            >
              <DashboardHeaderCard
                title="Vendor"
                count={selectedTool.vendor || "Unknown"}
                disableNavigation
              />
              <DashboardHeaderCard
                title="Total users"
                count={selectedTool.total_users}
                disableNavigation
              />
              <DashboardHeaderCard
                title="Total events"
                count={selectedTool.total_events}
                disableNavigation
              />
              <DashboardHeaderCard
                title="Risk score"
                count={selectedTool.risk_score ?? "—"}
                disableNavigation
              />
              <DashboardHeaderCard
                title="First detected"
                count={
                  selectedTool.first_detected_at
                    ? new Date(selectedTool.first_detected_at).toLocaleDateString()
                    : "—"
                }
                disableNavigation
              />
              <DashboardHeaderCard
                title="Last seen"
                count={
                  selectedTool.last_seen_at
                    ? new Date(selectedTool.last_seen_at).toLocaleDateString()
                    : "—"
                }
                disableNavigation
              />
            </Box>

            {/* Tool details card */}
            <Paper
              elevation={0}
              sx={{ p: 2, border: "1px solid #d0d5dd", borderRadius: "4px" }}
            >
              <Stack gap="16px">
                {/* Domains */}
                {selectedTool.domains?.length > 0 && (
                  <Stack gap="4px">
                    <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
                      Domains
                    </Typography>
                    <Stack direction="row" gap="4px" flexWrap="wrap">
                      {selectedTool.domains.map((d) => (
                        <Stack
                          key={d}
                          direction="row"
                          alignItems="center"
                          gap="4px"
                          sx={{
                            display: "inline-flex",
                            height: 24,
                            px: 1,
                            borderRadius: "4px",
                            border: "1px solid #d0d5dd",
                            backgroundColor: "#F9FAFB",
                            fontSize: 11,
                            color: "#374151",
                          }}
                        >
                          <Globe size={12} />
                          {d}
                        </Stack>
                      ))}
                    </Stack>
                  </Stack>
                )}

                {/* Security flags */}
                <Stack gap="4px">
                  <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
                    Security & compliance
                  </Typography>
                  <Stack direction="row" gap="12px" flexWrap="wrap">
                    <SecurityFlag
                      label="SOC 2"
                      value={selectedTool.soc2_certified}
                    />
                    <SecurityFlag
                      label="GDPR"
                      value={selectedTool.gdpr_compliant}
                    />
                    <SecurityFlag
                      label="SSO"
                      value={selectedTool.sso_support}
                    />
                    <SecurityFlag
                      label="Encryption at rest"
                      value={selectedTool.encryption_at_rest}
                    />
                    <SecurityFlag
                      label="Trains on data"
                      value={selectedTool.trains_on_data}
                      inverted
                    />
                  </Stack>
                </Stack>

                {/* Status change */}
                <Stack direction="row" alignItems="center" gap="8px">
                  <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
                    Change status:
                  </Typography>
                  <Select
                    id="tool-status-select"
                    value={selectedTool.status}
                    onChange={(e: SelectChangeEvent<string | number>) =>
                      handleStatusChange(
                        selectedTool.id,
                        e.target.value as ShadowAiToolStatus
                      )
                    }
                    items={Object.entries(STATUS_CONFIG).map(([key, val]) => ({
                      _id: key,
                      name: val.label,
                    }))}
                    sx={{ width: 160 }}
                  />

                  {!selectedTool.model_inventory_id && (
                    <CustomizableButton
                      text="Start governance"
                      variant="contained"
                      sx={{
                        backgroundColor: "#13715B",
                        "&:hover": { backgroundColor: "#0F5A47" },
                        height: 30,
                        fontSize: 12,
                      }}
                      onClick={() => setGovernanceModalOpen(true)}
                    />
                  )}
                  {selectedTool.model_inventory_id && (
                    <Chip
                      label="Governed"
                      size="small"
                    />
                  )}
                </Stack>
              </Stack>
            </Paper>

            {/* Governance wizard modal */}
            <GovernanceWizardModal
              isOpen={governanceModalOpen}
              onClose={() => setGovernanceModalOpen(false)}
              tool={selectedTool}
              onSuccess={async () => {
                const detail = await getToolById(selectedTool.id);
                setSelectedTool(detail);
              }}
            />

            {/* Departments */}
            {selectedTool.departments && selectedTool.departments.length > 0 && (
              <Paper
                elevation={0}
                sx={{ p: 2, border: "1px solid #d0d5dd", borderRadius: "4px" }}
              >
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1.5 }}>
                  Departments
                </Typography>
                <TableContainer sx={singleTheme.tableStyles.primary.frame}>
                  <Table>
                    <TableHead>
                      <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                        <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Department</TableCell>
                        <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Users</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedTool.departments.map((d) => (
                        <TableRow key={d.department} sx={singleTheme.tableStyles.primary.body.row}>
                          <TableCell sx={singleTheme.tableStyles.primary.body.cell}>{d.department}</TableCell>
                          <TableCell sx={singleTheme.tableStyles.primary.body.cell}>{d.user_count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            {/* Top users */}
            {selectedTool.top_users && selectedTool.top_users.length > 0 && (
              <Paper
                elevation={0}
                sx={{ p: 2, border: "1px solid #d0d5dd", borderRadius: "4px" }}
              >
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1.5 }}>
                  Top users
                </Typography>
                <TableContainer sx={singleTheme.tableStyles.primary.frame}>
                  <Table>
                    <TableHead>
                      <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                        <TableCell sx={singleTheme.tableStyles.primary.header.cell}>User</TableCell>
                        <TableCell sx={singleTheme.tableStyles.primary.header.cell}>Events</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedTool.top_users.map((u) => (
                        <TableRow key={u.user_email} sx={singleTheme.tableStyles.primary.body.row}>
                          <TableCell sx={singleTheme.tableStyles.primary.body.cell}>{u.user_email}</TableCell>
                          <TableCell sx={singleTheme.tableStyles.primary.body.cell}>{u.event_count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </Stack>
        )}
      </Stack>
    );
  }

  // ─── List view ───
  return (
    <Stack gap="16px">
      <Stack direction="row" justifyContent="flex-end">
        <Select
          id="tools-status-filter"
          value={statusFilter}
          onChange={(e: SelectChangeEvent<string | number>) => {
            setStatusFilter(e.target.value as ShadowAiToolStatus | "all");
            setPage(1);
          }}
          items={STATUS_OPTIONS}
          sx={{ width: 160 }}
        />
      </Stack>

      {loading ? (
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: "4px" }} />
      ) : tools.length === 0 ? (
        <EmptyState
          message="No AI tools detected yet. Connect a data source to start monitoring."
          showBorder
        />
      ) : (
        <TableContainer sx={singleTheme.tableStyles.primary.frame}>
          <Table>
            <TableHead>
              <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                {["Tool", "Status", "Users", "Events", "Risk score", "Last seen"].map((h) => (
                  <TableCell key={h} sx={singleTheme.tableStyles.primary.header.cell}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tools.map((t) => {
                const cfg = STATUS_CONFIG[t.status];
                return (
                  <TableRow key={t.id} hover sx={{ ...singleTheme.tableStyles.primary.body.row, cursor: "pointer" }}>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <Typography
                        sx={{
                          fontSize: 13,
                          color: "#13715B",
                          cursor: "pointer",
                          "&:hover": { textDecoration: "underline" },
                        }}
                        onClick={() => handleToolClick(t)}
                      >
                        {t.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      <Chip
                        label={cfg.label}
                        size="small"
                        backgroundColor={cfg.bg}
                        textColor={cfg.color}
                        uppercase={false}
                      />
                    </TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>{t.total_users}</TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>{t.total_events}</TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}><RiskBadge score={t.risk_score ?? 0} /></TableCell>
                    <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                      {t.last_seen_at ? new Date(t.last_seen_at).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow
                sx={{
                  "& .MuiTableCell-root.MuiTableCell-footer": {
                    paddingX: theme.spacing(8),
                    paddingY: theme.spacing(4),
                  },
                }}
              >
                <TableCell
                  sx={{
                    paddingX: theme.spacing(2),
                    fontSize: 12,
                    opacity: 0.7,
                  }}
                >
                  Showing {(page - 1) * ROWS_PER_PAGE + 1} -{" "}
                  {Math.min(page * ROWS_PER_PAGE, total)} of {total} tool(s)
                </TableCell>
                <TablePagination
                  count={total}
                  page={page - 1}
                  onPageChange={(_e, newPage) => setPage(newPage + 1)}
                  rowsPerPage={ROWS_PER_PAGE}
                  rowsPerPageOptions={[ROWS_PER_PAGE]}
                  ActionsComponent={(props) => (
                    <TablePaginationActions {...props} />
                  )}
                  labelRowsPerPage=""
                  labelDisplayedRows={({ page: p, count }) =>
                    `Page ${p + 1} of ${Math.max(0, Math.ceil(count / ROWS_PER_PAGE))}`
                  }
                  slotProps={{
                    select: {
                      MenuProps: {
                        keepMounted: true,
                        PaperProps: {
                          className: "pagination-dropdown",
                          sx: { mt: 0, mb: theme.spacing(2) },
                        },
                        transformOrigin: { vertical: "bottom", horizontal: "left" },
                        anchorOrigin: { vertical: "top", horizontal: "left" },
                        sx: { mt: theme.spacing(-2) },
                      },
                      inputProps: { id: "pagination-dropdown" },
                      IconComponent: SelectorVertical,
                      sx: {
                        ml: theme.spacing(4),
                        mr: theme.spacing(12),
                        minWidth: theme.spacing(20),
                        textAlign: "left",
                        "&.Mui-focused > div": {
                          backgroundColor: theme.palette.background.main,
                        },
                      },
                    },
                  }}
                  sx={{
                    mt: theme.spacing(6),
                    color: theme.palette.text.secondary,
                    "& .MuiSelect-icon": { width: "24px", height: "fit-content" },
                    "& .MuiSelect-select": {
                      width: theme.spacing(10),
                      borderRadius: theme.shape.borderRadius,
                      border: `1px solid ${theme.palette.border.light}`,
                      padding: theme.spacing(4),
                    },
                  }}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function SecurityFlag({
  label,
  value,
  inverted = false,
}: {
  label: string;
  value?: boolean;
  inverted?: boolean;
}) {
  const isPositive = inverted ? value === false : value === true;
  const isNegative = inverted ? value === true : value === false;

  const icon = isPositive ? (
    <CheckCircle2 size={12} color="#10B981" />
  ) : isNegative ? (
    <XCircle size={12} color="#DC2626" />
  ) : (
    <MinusCircle size={12} color="#9CA3AF" />
  );

  return (
    <Stack direction="row" alignItems="center" gap="4px">
      {icon}
      <Typography sx={{ fontSize: 12, color: "#374151" }}>{label}</Typography>
    </Stack>
  );
}

