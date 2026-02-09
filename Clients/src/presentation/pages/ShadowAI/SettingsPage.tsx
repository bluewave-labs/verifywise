/**
 * Shadow AI Settings Page
 *
 * Configuration page with API key management, syslog config,
 * and connection status.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Stack,
  Typography,
  Paper,
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
  Chip,
} from "@mui/material";
import { Key, Trash2, Copy, Check, Server } from "lucide-react";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  getSyslogConfigs,
  createSyslogConfig,
  deleteSyslogConfig,
} from "../../../application/repository/shadowAi.repository";
import {
  IShadowAiApiKey,
  IShadowAiSyslogConfig,
} from "../../../domain/interfaces/i.shadowAi";
import { CustomizableButton } from "../../components/button/customizable-button";
import StandardModal from "../../components/Modals/StandardModal";
import Field from "../../components/Inputs/Field";

export default function SettingsPage() {
  return (
    <Stack gap={3}>
      <ApiKeysSection />
      <SyslogConfigSection />
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
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{ p: 3, border: "1px solid #d0d5dd", borderRadius: "4px" }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Key size={16} strokeWidth={1.5} color="#374151" />
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
            API keys
          </Typography>
        </Stack>
        <CustomizableButton
          label="Create API key"
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

      <Typography sx={{ fontSize: 13, color: "#6B7280", mb: 2 }}>
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
          <Stack gap={1}>
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
              API key created successfully
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
              Copy this key now. You won't be able to see it again.
            </Typography>
            <Stack direction="row" alignItems="center" gap={1}>
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
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["Key prefix", "Label", "Status", "Created", "Last used", ""].map(
                  (h) => (
                    <TableCell
                      key={h}
                      sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}
                    >
                      {h}
                    </TableCell>
                  )
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {keys.map((k) => (
                <TableRow key={k.id}>
                  <TableCell>
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontFamily: "monospace",
                        color: "#374151",
                      }}
                    >
                      {k.key_prefix}...
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{k.label || "—"}</TableCell>
                  <TableCell>
                    <Chip
                      label={k.is_active ? "Active" : "Revoked"}
                      size="small"
                      sx={{
                        fontSize: 11,
                        height: 20,
                        backgroundColor: k.is_active ? "#ECFDF5" : "#FEF2F2",
                        color: k.is_active ? "#10B981" : "#DC2626",
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>
                    {k.created_at
                      ? new Date(k.created_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>
                    {k.last_used_at
                      ? new Date(k.last_used_at).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell align="right">
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
        title="Revoke API key"
        description={`Are you sure you want to revoke the key "${revokeTarget?.label || revokeTarget?.key_prefix}"?`}
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
    </Paper>
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
    <Paper
      elevation={0}
      sx={{ p: 3, border: "1px solid #d0d5dd", borderRadius: "4px" }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Server size={16} strokeWidth={1.5} color="#374151" />
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
            Syslog sources
          </Typography>
        </Stack>
        <CustomizableButton
          label="Add source"
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

      <Typography sx={{ fontSize: 13, color: "#6B7280", mb: 2 }}>
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
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {["Source identifier", "Parser", "Status", "Created", ""].map(
                  (h) => (
                    <TableCell
                      key={h}
                      sx={{ fontSize: 12, fontWeight: 600, color: "#374151" }}
                    >
                      {h}
                    </TableCell>
                  )
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {configs.map((c) => (
                <TableRow key={c.id}>
                  <TableCell sx={{ fontSize: 13, fontFamily: "monospace" }}>
                    {c.source_identifier}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>
                    {PARSER_LABELS[c.parser_type]}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={c.is_active ? "Active" : "Inactive"}
                      size="small"
                      sx={{
                        fontSize: 11,
                        height: 20,
                        backgroundColor: c.is_active ? "#ECFDF5" : "#F9FAFB",
                        color: c.is_active ? "#10B981" : "#6B7280",
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>
                    {c.created_at
                      ? new Date(c.created_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => setDeleteTarget(c)}
                      sx={{ color: "#DC2626" }}
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </IconButton>
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
        <Stack gap={2}>
          <Field
            label="Source identifier"
            value={formSource}
            onChange={(e) => setFormSource(e.target.value)}
            placeholder="e.g., proxy-01.corp.com"
          />
          <Stack gap={0.5}>
            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
              Parser type
            </Typography>
            <Box
              component="select"
              value={formParser}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFormParser(e.target.value as IShadowAiSyslogConfig["parser_type"])
              }
              sx={{
                height: 40,
                px: 1.5,
                fontSize: 13,
                border: "1px solid #d0d5dd",
                borderRadius: "4px",
                backgroundColor: "#fff",
                outline: "none",
                "&:focus": { borderColor: "#13715B" },
              }}
            >
              {Object.entries(PARSER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Box>
          </Stack>
        </Stack>
      </StandardModal>

      {/* Delete confirmation */}
      <StandardModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove syslog source"
        description={`Remove "${deleteTarget?.source_identifier}"?`}
        submitButtonText="Remove"
        onSubmit={handleDelete}
        submitButtonColor="#DC2626"
        maxWidth="400px"
      >
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          This will stop processing events from this source.
        </Typography>
      </StandardModal>
    </Paper>
  );
}
