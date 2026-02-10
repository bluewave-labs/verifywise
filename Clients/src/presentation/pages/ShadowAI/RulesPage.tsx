/**
 * Shadow AI Rules Page
 *
 * Manage alert rules and view alert history.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Stack,
  Typography,
  Paper,
  Skeleton,
  Switch,
  IconButton,
  SelectChangeEvent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  Chip,
} from "@mui/material";
import TabContext from "@mui/lab/TabContext";
import { Trash2 } from "lucide-react";
import TabBar from "../../components/TabBar";
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

const TRIGGER_LABELS: Record<ShadowAiTriggerType, string> = {
  new_tool_detected: "New tool detected",
  usage_threshold_exceeded: "Usage threshold exceeded",
  sensitive_department: "Sensitive department usage",
  blocked_attempt: "Blocked tool attempt",
  risk_score_exceeded: "Risk score exceeded",
  new_user_detected: "New user detected",
};

type ViewMode = "rules" | "history";

export default function RulesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("rules");
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<IShadowAiRule[]>([]);
  const [alerts, setAlerts] = useState<IShadowAiAlertHistory[]>([]);
  const [alertsTotal, setAlertsTotal] = useState(0);
  const [alertsPage, setAlertsPage] = useState(1);
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
      const data = await getAlertHistory(alertsPage, 20);
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

  const TABS = [
    { label: "Rules", value: "rules", icon: "Bell" as const },
    { label: "Alert history", value: "history", icon: "History" as const },
  ];

  return (
    <TabContext value={viewMode}>
    <Stack gap="16px">
      {/* Controls */}
      <Stack sx={{ position: "relative" }}>
        <TabBar
          tabs={TABS}
          activeTab={viewMode}
          onChange={(_e, newValue) => setViewMode(newValue as ViewMode)}
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
                  p: 2,
                  border: "1px solid #d0d5dd",
                  borderRadius: "4px",
                  opacity: rule.is_active ? 1 : 0.6,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                >
                  <Stack gap="4px" flex={1}>
                    <Stack direction="row" alignItems="center" gap="8px">
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                        {rule.name}
                      </Typography>
                      <Chip
                        label={
                          TRIGGER_LABELS[rule.trigger_type] || rule.trigger_type
                        }
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 11, height: 20 }}
                      />
                    </Stack>
                    {rule.description && (
                      <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
                        {rule.description}
                      </Typography>
                    )}
                    <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>
                      Actions:{" "}
                      {rule.actions?.map((a) => a.type.replace(/_/g, " ")).join(", ") ||
                        "None"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" gap="8px">
                    <Switch
                      checked={rule.is_active}
                      onChange={() => handleToggleActive(rule)}
                      size="small"
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: "#13715B",
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                          backgroundColor: "#13715B",
                        },
                      }}
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
        <Paper
          elevation={0}
          sx={{ border: "1px solid #d0d5dd", borderRadius: "4px", overflow: "hidden" }}
        >
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Rule", "Trigger", "Fired at"].map((h) => (
                    <TableCell key={h} sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {alerts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell sx={{ fontSize: 13 }}>
                      {a.rule_name || `Rule #${a.rule_id}`}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>
                      {TRIGGER_LABELS[a.trigger_type as ShadowAiTriggerType] ||
                        a.trigger_type ||
                        "—"}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>
                      {a.fired_at ? new Date(a.fired_at).toLocaleString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={alertsTotal}
            page={alertsPage - 1}
            onPageChange={(_e, newPage) => setAlertsPage(newPage + 1)}
            rowsPerPage={20}
            rowsPerPageOptions={[20]}
            sx={{ fontSize: 12 }}
          />
        </Paper>
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
            <Switch
              checked={formActive}
              onChange={(e) => setFormActive(e.target.checked)}
              size="small"
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: "#13715B" },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#13715B",
                },
              }}
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
