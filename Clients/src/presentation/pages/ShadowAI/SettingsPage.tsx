/**
 * Shadow AI Settings Page
 *
 * Configuration page with API key management, syslog config,
 * rate limiting, data retention, and connection status.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Stack,
  Typography,
  Skeleton,
  Box,
  IconButton,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from "@mui/material";
import Chip from "../../components/Chip";
import { Trash2, Copy, Check, Pencil } from "lucide-react";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  getSyslogConfigs,
  createSyslogConfig,
  updateSyslogConfig,
  deleteSyslogConfig,
  getSettingsConfig,
  updateSettingsConfig,
} from "../../../application/repository/shadowAi.repository";
import {
  IShadowAiApiKey,
  IShadowAiSyslogConfig,
  IShadowAiSettings,
} from "../../../domain/interfaces/i.shadowAi";
import singleTheme from "../../themes/v1SingleTheme";
import { CustomizableButton } from "../../components/button/customizable-button";
import StandardModal from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";
import Select from "../../components/Inputs/Select";
import PageHeader from "../../components/Layout/PageHeader";
import HelperIcon from "../../components/HelperIcon";
import TipBox from "../../components/TipBox";

const sectionTitleSx = {
  fontWeight: 600,
  fontSize: 15,
};

export default function SettingsPage() {
  return (
    <Stack gap="32px">
      <PageHeader
        title="Settings"
        description="Manage API keys for syslog integration and configure syslog sources to feed network traffic data into Shadow AI detection."
        rightContent={
          <HelperIcon articlePath="shadow-ai/settings" size="small" />
        }
      />
      <TipBox entityName="shadow-ai-settings" />
      <ApiKeysSection />
      <SyslogConfigSection />
      <RateLimitSection />
      <DataRetentionSection />
    </Stack>
  );
}

// ─── API Keys Section ───────────────────────────────────────────────

function ApiKeysSection() {
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<IShadowAiApiKey[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<IShadowAiApiKey | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup copy timer on unmount
  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listApiKeys();
      setKeys(data);
    } catch (error) {
      console.error("Failed to load API keys:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const result = await createApiKey(newKeyLabel.trim() || undefined);
      setNewlyCreatedKey(result.key);
      setCreateModalOpen(false);
      setNewKeyLabel("");
      fetchKeys();
    } catch (error) {
      console.error("Failed to create API key:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeApiKey(revokeTarget.id);
      setRevokeTarget(null);
      fetchKeys();
    } catch (error) {
      console.error("Failed to revoke API key:", error);
    }
  };

  const handleCopy = () => {
    if (newlyCreatedKey) {
      navigator.clipboard.writeText(newlyCreatedKey);
      setCopied(true);
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Stack gap="12px">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={sectionTitleSx}>API keys</Typography>
        <CustomizableButton
          text="Create API key"
          variant="contained"
          sx={{
            backgroundColor: "#13715B",
            "&:hover": { backgroundColor: "#0F5A47" },
            height: 34,
            fontSize: 13,
          }}
          onClick={() => setCreateModalOpen(true)}
        />
      </Stack>

      <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
        API keys are used to authenticate Shadow AI event ingestion from your
        network proxy, SIEM, or browser extension.
      </Typography>

      {/* Newly created key banner */}
      {newlyCreatedKey && (
        <Alert
          severity="success"
          sx={{ mb: 2, fontSize: 13 }}
          onClose={() => setNewlyCreatedKey(null)}
        >
          <Stack gap="8px">
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
              API key created successfully
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
              Copy this key now. You won't be able to see it again.
            </Typography>
            <Stack direction="row" alignItems="center" gap="8px">
              <Box
                sx={{
                  fontFamily: "monospace",
                  fontSize: 12,
                  backgroundColor: "#F3F4F6",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "4px",
                  border: "1px solid #d0d5dd",
                  wordBreak: "break-all",
                  flex: 1,
                }}
              >
                {newlyCreatedKey}
              </Box>
              <IconButton size="small" onClick={handleCopy}>
                {copied ? (
                  <Check size={14} color="#10B981" />
                ) : (
                  <Copy size={14} />
                )}
              </IconButton>
            </Stack>
          </Stack>
        </Alert>
      )}

      {loading ? (
        <Skeleton variant="rectangular" height={150} sx={{ borderRadius: "4px" }} />
      ) : keys.length === 0 ? (
        <Box
          sx={{
            py: 4,
            textAlign: "center",
            border: "1px dashed #d0d5dd",
            borderRadius: "4px",
          }}
        >
          <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>
            No API keys created yet
          </Typography>
        </Box>
      ) : (
        <TableContainer sx={singleTheme.tableStyles.primary.frame}>
          <Table>
            <TableHead>
              <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                {["Key prefix", "Label", "Status", "Created", "Last used", ""].map(
                  (h) => (
                    <TableCell
                      key={h}
                      sx={singleTheme.tableStyles.primary.header.cell}
                    >
                      {h}
                    </TableCell>
                  )
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {keys.map((k) => (
                <TableRow key={k.id} sx={singleTheme.tableStyles.primary.body.row}>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, fontFamily: "monospace" }}>
                    {k.key_prefix}...
                  </TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>{k.label || "—"}</TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    <Chip
                      label={k.is_active ? "Active" : "Revoked"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    {k.created_at
                      ? new Date(k.created_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    {k.last_used_at
                      ? new Date(k.last_used_at).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell align="right" sx={singleTheme.tableStyles.primary.body.cell}>
                    {k.is_active && (
                      <IconButton
                        size="small"
                        onClick={() => setRevokeTarget(k)}
                        sx={{ color: "#DC2626" }}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create modal */}
      <StandardModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setNewKeyLabel("");
        }}
        title="Create API key"
        submitButtonText="Create"
        onSubmit={handleCreate}
        isSubmitting={creating}
        maxWidth="400px"
      >
        <Field
          label="Label (optional)"
          value={newKeyLabel}
          onChange={(e) => setNewKeyLabel(e.target.value)}
          placeholder="e.g., Zscaler proxy"
        />
      </StandardModal>

      {/* Revoke confirmation */}
      <StandardModal
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        title={`Revoke "${revokeTarget?.label || revokeTarget?.key_prefix}"?`}
        submitButtonText="Revoke"
        onSubmit={handleRevoke}
        submitButtonColor="#DC2626"
        maxWidth="400px"
      >
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          This action cannot be undone. Any integrations using this key will stop
          working.
        </Typography>
      </StandardModal>
    </Stack>
  );
}

// ─── Syslog Config Section ──────────────────────────────────────────

function SyslogConfigSection() {
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<IShadowAiSyslogConfig[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formSource, setFormSource] = useState("");
  const [formParser, setFormParser] = useState<IShadowAiSyslogConfig["parser_type"]>("generic_kv");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IShadowAiSyslogConfig | null>(null);
  const [editTarget, setEditTarget] = useState<IShadowAiSyslogConfig | null>(null);
  const [editSource, setEditSource] = useState("");
  const [editParser, setEditParser] = useState<IShadowAiSyslogConfig["parser_type"]>("generic_kv");
  const [editing, setEditing] = useState(false);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSyslogConfigs();
      setConfigs(data);
    } catch (error) {
      console.error("Failed to load syslog configs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleCreate = async () => {
    if (!formSource.trim()) return;
    setCreating(true);
    try {
      await createSyslogConfig({
        source_identifier: formSource.trim(),
        parser_type: formParser,
        is_active: true,
      });
      setCreateModalOpen(false);
      setFormSource("");
      setFormParser("generic_kv");
      fetchConfigs();
    } catch (error) {
      console.error("Failed to create syslog config:", error);
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (config: IShadowAiSyslogConfig) => {
    setEditTarget(config);
    setEditSource(config.source_identifier);
    setEditParser(config.parser_type);
  };

  const handleEdit = async () => {
    if (!editTarget || !editSource.trim()) return;
    setEditing(true);
    try {
      await updateSyslogConfig(editTarget.id, {
        source_identifier: editSource.trim(),
        parser_type: editParser,
      });
      setEditTarget(null);
      fetchConfigs();
    } catch (error) {
      console.error("Failed to update syslog config:", error);
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSyslogConfig(deleteTarget.id);
      setDeleteTarget(null);
      fetchConfigs();
    } catch (error) {
      console.error("Failed to delete syslog config:", error);
    }
  };

  const PARSER_LABELS: Record<IShadowAiSyslogConfig["parser_type"], string> = {
    zscaler: "Zscaler",
    netskope: "Netskope",
    squid: "Squid proxy",
    generic_kv: "Generic key-value",
  };

  return (
    <Stack gap="12px">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={sectionTitleSx}>Syslog sources</Typography>
        <CustomizableButton
          text="Add source"
          variant="contained"
          sx={{
            backgroundColor: "#13715B",
            "&:hover": { backgroundColor: "#0F5A47" },
            height: 34,
            fontSize: 13,
          }}
          onClick={() => setCreateModalOpen(true)}
        />
      </Stack>

      <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
        Configure syslog sources to ingest network traffic data from your proxy
        or firewall.
      </Typography>

      {loading ? (
        <Skeleton variant="rectangular" height={100} sx={{ borderRadius: "4px" }} />
      ) : configs.length === 0 ? (
        <Box
          sx={{
            py: 4,
            textAlign: "center",
            border: "1px dashed #d0d5dd",
            borderRadius: "4px",
          }}
        >
          <Typography sx={{ fontSize: 13, color: "#9CA3AF" }}>
            No syslog sources configured
          </Typography>
        </Box>
      ) : (
        <TableContainer sx={singleTheme.tableStyles.primary.frame}>
          <Table>
            <TableHead>
              <TableRow sx={singleTheme.tableStyles.primary.header.row}>
                {["Source identifier", "Parser", "Status", "Created", ""].map(
                  (h) => (
                    <TableCell
                      key={h}
                      sx={singleTheme.tableStyles.primary.header.cell}
                    >
                      {h}
                    </TableCell>
                  )
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {configs.map((c) => (
                <TableRow key={c.id} sx={singleTheme.tableStyles.primary.body.row}>
                  <TableCell sx={{ ...singleTheme.tableStyles.primary.body.cell, fontFamily: "monospace" }}>
                    {c.source_identifier}
                  </TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    {PARSER_LABELS[c.parser_type]}
                  </TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    <Chip
                      label={c.is_active ? "Active" : "Inactive"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={singleTheme.tableStyles.primary.body.cell}>
                    {c.created_at
                      ? new Date(c.created_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell align="right" sx={singleTheme.tableStyles.primary.body.cell}>
                    <Stack direction="row" gap="4px" justifyContent="flex-end">
                      <IconButton
                        size="small"
                        onClick={() => openEdit(c)}
                        sx={{ color: "#6B7280" }}
                      >
                        <Pencil size={14} strokeWidth={1.5} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteTarget(c)}
                        sx={{ color: "#DC2626" }}
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create modal */}
      <StandardModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setFormSource("");
          setFormParser("generic_kv");
        }}
        title="Add syslog source"
        submitButtonText="Add"
        onSubmit={handleCreate}
        isSubmitting={creating}
        maxWidth="400px"
      >
        <Stack gap="16px">
          <Field
            label="Source identifier"
            value={formSource}
            onChange={(e) => setFormSource(e.target.value)}
            placeholder="e.g., proxy-01.corp.com"
          />
          <Select
            id="parser-type-select"
            label="Parser type"
            value={formParser}
            onChange={(e) =>
              setFormParser(e.target.value as IShadowAiSyslogConfig["parser_type"])
            }
            items={Object.entries(PARSER_LABELS).map(([value, label]) => ({
              _id: value,
              name: label,
            }))}
          />
        </Stack>
      </StandardModal>

      {/* Edit modal */}
      <StandardModal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit syslog source"
        submitButtonText="Save"
        onSubmit={handleEdit}
        isSubmitting={editing}
        maxWidth="400px"
      >
        <Stack gap="16px">
          <Field
            label="Source identifier"
            value={editSource}
            onChange={(e) => setEditSource(e.target.value)}
            placeholder="e.g., proxy-01.corp.com"
          />
          <Select
            id="edit-parser-type-select"
            label="Parser type"
            value={editParser}
            onChange={(e) =>
              setEditParser(e.target.value as IShadowAiSyslogConfig["parser_type"])
            }
            items={Object.entries(PARSER_LABELS).map(([value, label]) => ({
              _id: value,
              name: label,
            }))}
          />
        </Stack>
      </StandardModal>

      {/* Delete confirmation */}
      <StandardModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={`Remove "${deleteTarget?.source_identifier}"?`}
        submitButtonText="Remove"
        onSubmit={handleDelete}
        submitButtonColor="#DC2626"
        maxWidth="400px"
      >
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          This will stop processing events from this source.
        </Typography>
      </StandardModal>
    </Stack>
  );
}

// ─── Rate Limit Section ─────────────────────────────────────────────

function RateLimitSection() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<IShadowAiSettings | null>(null);
  const [rateLimit, setRateLimit] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getSettingsConfig();
        if (cancelled) return;
        setSettings(data);
        setRateLimit(
          data.rate_limit_max_events_per_hour === 0
            ? ""
            : String(data.rate_limit_max_events_per_hour)
        );
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const value = rateLimit.trim() === "" ? 0 : parseInt(rateLimit, 10);
      if (isNaN(value) || value < 0) return;
      const updated = await updateSettingsConfig({
        rate_limit_max_events_per_hour: value,
      });
      setSettings(updated);
    } catch (error) {
      console.error("Failed to update rate limit:", error);
    } finally {
      setSaving(false);
    }
  };

  const currentValue = settings?.rate_limit_max_events_per_hour ?? 0;
  const inputValue = rateLimit.trim() === "" ? 0 : parseInt(rateLimit, 10) || 0;
  const hasChanged = inputValue !== currentValue;

  return (
    <Stack gap="12px">
      <Typography sx={sectionTitleSx}>Rate limiting</Typography>
      <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
        Limit the number of events that can be ingested per hour. Leave empty or
        set to 0 to allow unlimited ingestion.
      </Typography>

      {loading ? (
        <Skeleton variant="rectangular" height={40} sx={{ borderRadius: "4px", maxWidth: 300 }} />
      ) : (
        <Stack direction="row" alignItems="flex-end" gap="12px">
          <Field
            label="Max events per hour"
            value={rateLimit}
            onChange={(e) => setRateLimit(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="0 (unlimited)"
            sx={{ maxWidth: 200 }}
          />
          <CustomizableButton
            text={saving ? "Saving..." : "Save"}
            variant="contained"
            disabled={!hasChanged || saving}
            sx={{
              backgroundColor: "#13715B",
              "&:hover": { backgroundColor: "#0F5A47" },
              height: 34,
              fontSize: 13,
              mb: "2px",
            }}
            onClick={handleSave}
          />
        </Stack>
      )}

      {settings && currentValue > 0 && (
        <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
          Currently limited to {currentValue.toLocaleString()} events/hour
        </Typography>
      )}
      {settings && currentValue === 0 && (
        <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
          No rate limit applied
        </Typography>
      )}
    </Stack>
  );
}

// ─── Data Retention Section ─────────────────────────────────────────

function DataRetentionSection() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<IShadowAiSettings | null>(null);
  const [eventsDays, setEventsDays] = useState("");
  const [rollupsDays, setRollupsDays] = useState("");
  const [alertsDays, setAlertsDays] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getSettingsConfig();
        if (cancelled) return;
        setSettings(data);
        setEventsDays(data.retention_events_days === 0 ? "" : String(data.retention_events_days));
        setRollupsDays(data.retention_daily_rollups_days === 0 ? "" : String(data.retention_daily_rollups_days));
        setAlertsDays(data.retention_alert_history_days === 0 ? "" : String(data.retention_alert_history_days));
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const parseVal = (v: string) => {
        const n = v.trim() === "" ? 0 : parseInt(v, 10);
        return isNaN(n) || n < 0 ? 0 : n;
      };
      const updated = await updateSettingsConfig({
        retention_events_days: parseVal(eventsDays),
        retention_daily_rollups_days: parseVal(rollupsDays),
        retention_alert_history_days: parseVal(alertsDays),
      });
      setSettings(updated);
    } catch (error) {
      console.error("Failed to update retention settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const parseOrZero = (v: string) => {
    const n = v.trim() === "" ? 0 : parseInt(v, 10);
    return isNaN(n) ? 0 : n;
  };

  const hasChanged = settings
    ? parseOrZero(eventsDays) !== settings.retention_events_days ||
      parseOrZero(rollupsDays) !== settings.retention_daily_rollups_days ||
      parseOrZero(alertsDays) !== settings.retention_alert_history_days
    : false;

  const RETENTION_FIELDS = [
    {
      label: "Raw events",
      description: "Individual event records from ingestion",
      value: eventsDays,
      setter: setEventsDays,
      defaultVal: 30,
    },
    {
      label: "Daily rollups",
      description: "Aggregated daily statistics",
      value: rollupsDays,
      setter: setRollupsDays,
      defaultVal: 365,
    },
    {
      label: "Alert history",
      description: "Records of triggered alerts",
      value: alertsDays,
      setter: setAlertsDays,
      defaultVal: 90,
    },
  ];

  return (
    <Stack gap="12px">
      <Typography sx={sectionTitleSx}>Data retention</Typography>
      <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
        Configure how long Shadow AI data is retained. Set to 0 or leave empty
        to keep data indefinitely. Changes take effect on the next cleanup cycle.
      </Typography>

      {loading ? (
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: "4px" }} />
      ) : (
        <Stack gap="16px">
          {RETENTION_FIELDS.map((field) => (
            <Stack key={field.label} direction="row" alignItems="flex-end" gap="12px">
              <Box sx={{ flex: 1, maxWidth: 280 }}>
                <Field
                  label={`${field.label} (days)`}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder={`${field.defaultVal} (default)`}
                />
                <Typography sx={{ fontSize: 11, color: "#9CA3AF", mt: 0.5 }}>
                  {field.description}
                </Typography>
              </Box>
            </Stack>
          ))}

          <CustomizableButton
            text={saving ? "Saving..." : "Save retention settings"}
            variant="contained"
            disabled={!hasChanged || saving}
            sx={{
              backgroundColor: "#13715B",
              "&:hover": { backgroundColor: "#0F5A47" },
              height: 34,
              fontSize: 13,
              alignSelf: "flex-start",
            }}
            onClick={handleSave}
          />
        </Stack>
      )}
    </Stack>
  );
}
