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
  TableRow as MuiTableRow,
  TableCell,
  TableContainer,
  TablePagination,
} from "@mui/material";
import Chip from "../../components/Chip";
import {
  ArrowLeft,
  Globe,
  CheckCircle2,
  XCircle,
  MinusCircle,
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
import GovernanceWizardModal from "./GovernanceWizardModal";

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
        limit: 20,
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
            {/* Info card */}
            <Paper
              elevation={0}
              sx={{ p: 2, border: "1px solid #d0d5dd", borderRadius: "4px" }}
            >
              <Stack gap="16px">
                <Stack direction="row" gap="32px" flexWrap="wrap">
                  <InfoItem label="Vendor" value={selectedTool.vendor || "Unknown"} />
                  <InfoItem label="Total users" value={selectedTool.total_users} />
                  <InfoItem label="Total events" value={selectedTool.total_events} />
                  <InfoItem
                    label="Risk score"
                    value={selectedTool.risk_score ?? "—"}
                  />
                  <InfoItem
                    label="First detected"
                    value={
                      selectedTool.first_detected_at
                        ? new Date(selectedTool.first_detected_at).toLocaleDateString()
                        : "—"
                    }
                  />
                  <InfoItem
                    label="Last seen"
                    value={
                      selectedTool.last_seen_at
                        ? new Date(selectedTool.last_seen_at).toLocaleDateString()
                        : "—"
                    }
                  />
                </Stack>

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
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <MuiTableRow>
                        <TableCell sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Department</TableCell>
                        <TableCell sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Users</TableCell>
                      </MuiTableRow>
                    </TableHead>
                    <TableBody>
                      {selectedTool.departments.map((d) => (
                        <MuiTableRow key={d.department}>
                          <TableCell sx={{ fontSize: 13 }}>{d.department}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{d.user_count}</TableCell>
                        </MuiTableRow>
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
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <MuiTableRow>
                        <TableCell sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>User</TableCell>
                        <TableCell sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>Events</TableCell>
                      </MuiTableRow>
                    </TableHead>
                    <TableBody>
                      {selectedTool.top_users.map((u) => (
                        <MuiTableRow key={u.user_email}>
                          <TableCell sx={{ fontSize: 13 }}>{u.user_email}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{u.event_count}</TableCell>
                        </MuiTableRow>
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
        <Paper
          elevation={0}
          sx={{ border: "1px solid #d0d5dd", borderRadius: "4px", overflow: "hidden" }}
        >
          <TableContainer>
            <Table size="small">
              <TableHead>
                <MuiTableRow>
                  {["Tool", "Status", "Users", "Events", "Risk score", "Last seen"].map((h) => (
                    <TableCell key={h} sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{h}</TableCell>
                  ))}
                </MuiTableRow>
              </TableHead>
              <TableBody>
                {tools.map((t) => {
                  const cfg = STATUS_CONFIG[t.status];
                  return (
                    <MuiTableRow key={t.id} hover sx={{ cursor: "pointer" }}>
                      <TableCell>
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
                      <TableCell>
                        <Chip
                          label={cfg.label}
                          size="small"
                          backgroundColor={cfg.bg}
                          textColor={cfg.color}
                          uppercase={false}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{t.total_users}</TableCell>
                      <TableCell sx={{ fontSize: 13 }}>{t.total_events}</TableCell>
                      <TableCell><RiskBadge score={t.risk_score ?? 0} /></TableCell>
                      <TableCell sx={{ fontSize: 13 }}>
                        {t.last_seen_at ? new Date(t.last_seen_at).toLocaleDateString() : "—"}
                      </TableCell>
                    </MuiTableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page - 1}
            onPageChange={(_e, newPage) => setPage(newPage + 1)}
            rowsPerPage={20}
            rowsPerPageOptions={[20]}
            sx={{ fontSize: 12 }}
          />
        </Paper>
      )}
    </Stack>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function InfoItem({ label, value }: { label: string; value: string | number }) {
  return (
    <Stack>
      <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>{label}</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
        {value}
      </Typography>
    </Stack>
  );
}

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

