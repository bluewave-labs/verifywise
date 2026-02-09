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
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
  IconButton,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow as MuiTableRow,
  TableCell,
  TableContainer,
  TablePagination,
} from "@mui/material";
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
import EmptyState from "../../components/EmptyState";
import { CustomizableButton } from "../../components/button/customizable-button";
import GovernanceWizardModal from "./GovernanceWizardModal";

const STATUS_OPTIONS: { value: ShadowAiToolStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "detected", label: "Detected" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "restricted", label: "Restricted" },
  { value: "blocked", label: "Blocked" },
  { value: "dismissed", label: "Dismissed" },
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
      <Stack gap={2}>
        <Stack direction="row" alignItems="center" gap={1}>
          <IconButton onClick={handleBack} size="small">
            <ArrowLeft size={16} strokeWidth={1.5} />
          </IconButton>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
            {selectedTool.name}
          </Typography>
          <Chip
            label={cfg.label}
            size="small"
            sx={{
              fontSize: 11,
              height: 22,
              backgroundColor: cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.color}33`,
            }}
          />
        </Stack>

        {detailLoading ? (
          <Skeleton height={300} />
        ) : (
          <Stack gap={2}>
            {/* Info card */}
            <Paper
              elevation={0}
              sx={{ p: 2, border: "1px solid #d0d5dd", borderRadius: "4px" }}
            >
              <Stack gap={2}>
                <Stack direction="row" gap={4} flexWrap="wrap">
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
                  <Stack gap={0.5}>
                    <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
                      Domains
                    </Typography>
                    <Stack direction="row" gap={0.5} flexWrap="wrap">
                      {selectedTool.domains.map((d) => (
                        <Chip
                          key={d}
                          icon={<Globe size={12} />}
                          label={d}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: 11, height: 22 }}
                        />
                      ))}
                    </Stack>
                  </Stack>
                )}

                {/* Security flags */}
                <Stack gap={0.5}>
                  <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
                    Security & compliance
                  </Typography>
                  <Stack direction="row" gap={1.5} flexWrap="wrap">
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
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
                    Change status:
                  </Typography>
                  <Select
                    value={selectedTool.status}
                    onChange={(e) =>
                      handleStatusChange(
                        selectedTool.id,
                        e.target.value as ShadowAiToolStatus
                      )
                    }
                    size="small"
                    sx={{ fontSize: 12, height: 30, minWidth: 140 }}
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                      <MenuItem key={key} value={key} sx={{ fontSize: 12 }}>
                        {val.label}
                      </MenuItem>
                    ))}
                  </Select>

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
                      sx={{
                        fontSize: 11,
                        height: 22,
                        backgroundColor: "#ECFDF5",
                        color: "#10B981",
                      }}
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
    <Stack gap={2}>
      <Stack direction="row" justifyContent="flex-end">
        <Select
          value={statusFilter}
          onChange={(e: SelectChangeEvent) =>
            setStatusFilter(e.target.value as ShadowAiToolStatus | "all")
          }
          size="small"
          sx={{ minWidth: 150, fontSize: 13, height: 34 }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 13 }}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      {loading ? (
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: "4px" }} />
      ) : tools.length === 0 ? (
        <EmptyState
          message="No AI tools detected yet. Connect a data source to start monitoring."
          showBorder
          showHalo
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
                          sx={{
                            fontSize: 11,
                            height: 22,
                            backgroundColor: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.color}33`,
                          }}
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
    <Stack direction="row" alignItems="center" gap={0.5}>
      {icon}
      <Typography sx={{ fontSize: 12, color: "#374151" }}>{label}</Typography>
    </Stack>
  );
}

function RiskBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "#DC2626"
      : score >= 40
        ? "#F59E0B"
        : "#10B981";

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.25,
        borderRadius: "4px",
        backgroundColor: `${color}14`,
        border: `1px solid ${color}33`,
      }}
    >
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: color,
        }}
      />
      <Typography sx={{ fontSize: 12, fontWeight: 500, color }}>
        {score}
      </Typography>
    </Box>
  );
}
