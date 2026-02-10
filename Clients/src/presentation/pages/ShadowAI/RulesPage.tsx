/**
 * Shadow AI Rules Page
 *
 * Manage alert rules and view alert history.
 * Tabs use URL-based routing: /shadow-ai/rules and /shadow-ai/rules/alerts
 */

import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Stack,
  Typography,
  Paper,
  Skeleton,
  IconButton,
  SelectChangeEvent,
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
import Toggle from "../../components/Inputs/Toggle";
import Chip from "../../components/Chip";
import TabContext from "@mui/lab/TabContext";
import { Trash2 } from "lucide-react";
import TabBar from "../../components/TabBar";
import TablePaginationActions from "../../components/TablePagination";
import singleTheme from "../../themes/v1SingleTheme";
import {
  getRules,
  createRule,
  updateRule,
  deleteRule,
  getAlertHistory,
} from "../../../application/repository/shadowAi.repository";
import {
  IShadowAiRule,
  IShadowAiAlertHistory,
  ShadowAiTriggerType,
} from "../../../domain/interfaces/i.shadowAi";
import EmptyState from "../../components/EmptyState";
import { CustomizableButton } from "../../components/button/customizable-button";
import StandardModal from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";
import Select from "../../components/Inputs/Select";
import PageHeader from "../../components/Layout/PageHeader";
import HelperIcon from "../../components/HelperIcon";
import { SelectorVertical } from "./constants";

const TRIGGER_LABELS: Record<ShadowAiTriggerType, string> = {
  new_tool_detected: "New tool detected",
  usage_threshold_exceeded: "Usage threshold exceeded",
  sensitive_department: "Sensitive department usage",
  blocked_attempt: "Blocked tool attempt",
  risk_score_exceeded: "Risk score exceeded",
  new_user_detected: "New user detected",
};

type ViewMode = "rules" | "history";

const ALERTS_PER_PAGE = 10;

const TABS = [
  { label: "Rules", value: "rules", icon: "Bell" as const },
  { label: "Alert history", value: "history", icon: "History" as const },
];

export default function RulesPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const viewMode: ViewMode = location.pathname.includes("/rules/alerts")
    ? "history"
    : "rules";

  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<IShadowAiRule[]>([]);
  const [alerts, setAlerts] = useState<IShadowAiAlertHistory[]>([]);
  const [alertsTotal, setAlertsTotal] = useState(0);
  const [alertsPage, setAlertsPage] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IShadowAiRule | null>(null);

  // Create form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formTrigger, setFormTrigger] = useState<ShadowAiTriggerType>("new_tool_detected");
  const [formActive, setFormActive] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRules();
      setRules(data);
    } catch (error) {
      console.error("Failed to load rules:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAlertHistory(alertsPage + 1, ALERTS_PER_PAGE);
      setAlerts(data.alerts);
      setAlertsTotal(data.total);
    } catch (error) {
      console.error("Failed to load alert history:", error);
    } finally {
      setLoading(false);
    }
  }, [alertsPage]);

  useEffect(() => {
    if (viewMode === "rules") {
      fetchRules();
    } else {
      fetchAlerts();
    }
  }, [viewMode, fetchRules, fetchAlerts]);

  const handleTabChange = (_e: React.SyntheticEvent, newValue: string) => {
    if (newValue === "history") {
      navigate("/shadow-ai/rules/alerts");
    } else {
      navigate("/shadow-ai/rules");
    }
  };

  const handleToggleActive = async (rule: IShadowAiRule) => {
    try {
      await updateRule(rule.id, { is_active: !rule.is_active });
      setRules((prev) =>
        prev.map((r) =>
          r.id === rule.id ? { ...r, is_active: !r.is_active } : r
        )
      );
    } catch (error) {
      console.error("Failed to toggle rule:", error);
    }
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setCreating(true);
    try {
      await createRule({
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        is_active: formActive,
        trigger_type: formTrigger,
        trigger_config: {},
        actions: [{ type: "send_alert" }],
      });
      setCreateModalOpen(false);
      resetForm();
      fetchRules();
    } catch (error) {
      console.error("Failed to create rule:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRule(deleteTarget.id);
      setDeleteTarget(null);
      fetchRules();
    } catch (error) {
      console.error("Failed to delete rule:", error);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormTrigger("new_tool_detected");
    setFormActive(true);
  };

  const theme = useTheme();

  return (
    <TabContext value={viewMode}>
    <Stack gap="16px">
      <PageHeader
        title="Rules"
        description="Configure alert rules to get notified about Shadow AI activity. Set triggers for new tool detection, usage thresholds, sensitive department usage, and more."
        rightContent={
          <HelperIcon articlePath="shadow-ai/rules" size="small" />
        }
      />

      {/* Controls */}
      <Stack sx={{ position: "relative" }}>
        <TabBar
          tabs={TABS}
          activeTab={viewMode}
          onChange={handleTabChange}
        />
        {viewMode === "rules" && (
          <CustomizableButton
            text="Create rule"
            variant="contained"
            sx={{
              backgroundColor: "#13715B",
              "&:hover": { backgroundColor: "#0F5A47" },
              height: 34,
              fontSize: 13,
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
            }}
            onClick={() => setCreateModalOpen(true)}
          />
        )}
      </Stack>

      {/* Content */}
      {loading ? (
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: "4px" }} />
      ) : viewMode === "rules" ? (
        rules.length === 0 ? (
          <EmptyState
            message="No rules configured yet. Create a rule to get alerted about Shadow AI activity."
            showBorder
          />
        ) : (
          <Stack gap="12px">
            {rules.map((rule) => (
              <Paper
                key={rule.id}
                elevation={0}
                sx={{
                  p: "16px",
                  border: "1px solid #d0d5dd",
                  borderRadius: "4px",
                  opacity: rule.is_active ? 1 : 0.6,
                  transition: "opacity 0.2s ease",
                }}
              >
                <Stack gap="12px">
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Stack direction="row" alignItems="center" gap="8px">
                      <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
                        {rule.name}
                      </Typography>
                      <Chip
                        label={
                          TRIGGER_LABELS[rule.trigger_type] || rule.trigger_type
                        }
                        size="small"
                        variant="info"
                        uppercase={false}
                      />
                    </Stack>
                    <Stack direction="row" alignItems="center" gap="4px">
                      <Toggle
                        checked={rule.is_active}
                        onChange={() => handleToggleActive(rule)}
                        size="small"
                      />
                      <IconButton
                        size="small"
                        onClick={() => setDeleteTarget(rule)}
                        sx={{ color: "#DC2626" }}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </IconButton>
                    </Stack>
                  </Stack>
                  {rule.description && (
                    <Typography sx={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
                      {rule.description}
                    </Typography>
                  )}
                  <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
                    Actions:{" "}
                    {Array.isArray(rule.actions)
                      ? rule.actions.map((a: { type: string }) => a.type.replace(/_/g, " ")).join(", ")
                      : rule.actions && typeof rule.actions === "object"
                        ? Object.keys(rule.actions).map((k) => k.replace(/_/g, " ")).join(", ")
                        : "None"}
                  </Typography>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )
      ) : alerts.length === 0 ? (
        <EmptyState
          message="No alerts have been triggered yet."
          showBorder
        />
      ) : (
        <TableContainer sx={singleTheme.tableStyles.primary.frame}>
          <Table>
            <TableHead>
              <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                {["Rule", "Trigger", "Fired at"].map((h) => (
                  <TableCell
                    key={h}
                    sx={singleTheme.tableStyles.primary.header.cell}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {alerts.map((a) => (
                <TableRow key={a.id} sx={singleTheme.tableStyles.primary.body.row}>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    {a.rule_name || `Rule #${a.rule_id}`}
                  </TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    <Chip
                      label={
                        TRIGGER_LABELS[a.trigger_type as ShadowAiTriggerType] ||
                        a.trigger_type ||
                        "—"
                      }
                      size="small"
                      variant="info"
                      uppercase={false}
                    />
                  </TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    {a.fired_at ? new Date(a.fired_at).toLocaleString() : "—"}
                  </TableCell>
                </TableRow>
              ))}
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
                  Showing {alertsPage * ALERTS_PER_PAGE + 1} -{" "}
                  {Math.min((alertsPage + 1) * ALERTS_PER_PAGE, alertsTotal)} of{" "}
                  {alertsTotal} items
                </TableCell>
                <TablePagination
                  count={alertsTotal}
                  page={alertsPage}
                  onPageChange={(_e, newPage) => setAlertsPage(newPage)}
                  rowsPerPage={ALERTS_PER_PAGE}
                  rowsPerPageOptions={[ALERTS_PER_PAGE]}
                  ActionsComponent={(props) => (
                    <TablePaginationActions {...props} />
                  )}
                  labelRowsPerPage=""
                  labelDisplayedRows={({ page, count }) =>
                    `Page ${page + 1} of ${Math.max(0, Math.ceil(count / ALERTS_PER_PAGE))}`
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

      {/* Create rule modal */}
      <StandardModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          resetForm();
        }}
        title="Create alert rule"
        submitButtonText="Create"
        onSubmit={handleCreate}
        isSubmitting={creating}
        maxWidth="480px"
      >
        <Stack gap="16px">
          <Field
            label="Rule name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g., Alert on new AI tools"
          />
          <Field
            label="Description"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="Optional description"
          />
          <Select
            id="trigger-type-select"
            label="Trigger type"
            value={formTrigger}
            onChange={(e: SelectChangeEvent<string | number>) =>
              setFormTrigger(e.target.value as ShadowAiTriggerType)
            }
            items={Object.entries(TRIGGER_LABELS).map(([value, label]) => ({
              _id: value,
              name: label,
            }))}
          />
          <Stack direction="row" alignItems="center" gap="8px">
            <Typography sx={{ fontSize: 13 }}>Active</Typography>
            <Toggle
              checked={formActive}
              onChange={(e) => setFormActive(e.target.checked)}
              size="small"
            />
          </Stack>
        </Stack>
      </StandardModal>

      {/* Delete confirmation modal */}
      <StandardModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        submitButtonText="Delete"
        onSubmit={handleDelete}
        submitButtonColor="#DC2626"
        maxWidth="400px"
      >
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          This action cannot be undone. All alert history for this rule will be
          preserved.
        </Typography>
      </StandardModal>
    </Stack>
    </TabContext>
  );
}
