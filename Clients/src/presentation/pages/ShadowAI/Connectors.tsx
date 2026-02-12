import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from "@mui/material";
import { Plus, Trash2, RefreshCw, Play, CheckCircle, AlertCircle, PauseCircle } from "lucide-react";
import {
  useConnectors,
  useCreateConnector,
  useDeleteConnector,
  useTestConnector,
  useSyncConnector,
} from "../../../application/hooks/useShadowAi";
import type { IShadowAiConnector, ConnectorType } from "../../../domain/interfaces/i.shadowAi";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  active: <CheckCircle size={16} color="#2e7d32" />,
  paused: <PauseCircle size={16} color="#757575" />,
  error: <AlertCircle size={16} color="#d32f2f" />,
  configuring: <CircularProgress size={16} />,
};

const CONNECTOR_DESCRIPTIONS: Record<string, string> = {
  splunk: "Splunk SIEM - Search and ingest AI-related events from Splunk indexes",
  sentinel: "Microsoft Sentinel - Query AI usage events from Azure Sentinel workspace",
  qradar: "IBM QRadar - Fetch security events related to AI tool access",
  zscaler: "Zscaler ZIA - Ingest web traffic logs for AI domain detection",
  netskope: "Netskope CASB - Cloud security events for AI SaaS monitoring",
  syslog: "Syslog Receiver - Accept events via standard syslog protocol",
  webhook: "Webhook Receiver - Accept events via HTTP webhook push",
};

const Connectors: React.FC = () => {
  const { data: connectors, isLoading } = useConnectors();
  const createConnector = useCreateConnector();
  const deleteConnector = useDeleteConnector();
  const testConnector = useTestConnector();
  const syncConnector = useSyncConnector();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "webhook" as ConnectorType, config: {} as any });
  const [testResults, setTestResults] = useState<Record<number, { success: boolean; message: string }>>({});

  const handleCreate = () => {
    createConnector.mutate(form);
    setDialogOpen(false);
    setForm({ name: "", type: "webhook", config: {} });
  };

  const handleTest = async (id: number) => {
    try {
      const result = await testConnector.mutateAsync(id);
      setTestResults((prev) => ({ ...prev, [id]: result?.data || { success: true, message: "OK" } }));
    } catch {
      setTestResults((prev) => ({ ...prev, [id]: { success: false, message: "Test failed" } }));
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 13 }}>
          Configure data source connections to ingest AI usage events from your security stack
        </Typography>
        <Button variant="contained" size="small" startIcon={<Plus size={16} />} onClick={() => setDialogOpen(true)} sx={{ fontSize: 13, textTransform: "none" }}>
          Add Connector
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={2}>
          {(connectors || []).map((c: IShadowAiConnector) => (
            <Grid item xs={12} md={6} lg={4} key={c.id}>
              <Card variant="outlined" sx={{ height: "100%" }}>
                <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        {STATUS_ICONS[c.status]}
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: 14 }}>{c.name}</Typography>
                      </Box>
                      <Chip label={c.type} size="small" variant="outlined" sx={{ fontSize: 11, height: 20 }} />
                    </Box>
                    <IconButton size="small" color="error" onClick={() => deleteConnector.mutate(c.id)}>
                      <Trash2 size={16} />
                    </IconButton>
                  </Box>

                  <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary", mb: 1.5 }}>
                    {CONNECTOR_DESCRIPTIONS[c.type] || "Data source connector"}
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1, mb: 1, fontSize: 12 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">Events Ingested</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.events_ingested.toLocaleString()}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">Last Sync</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12 }}>
                        {c.last_sync_at ? new Date(c.last_sync_at).toLocaleString() : "Never"}
                      </Typography>
                    </Box>
                  </Box>

                  {c.last_error && (
                    <Typography variant="body2" sx={{ fontSize: 11, color: "error.main", mb: 1 }}>
                      Error: {c.last_error}
                    </Typography>
                  )}

                  {testResults[c.id] && (
                    <Chip
                      label={testResults[c.id].message}
                      size="small"
                      color={testResults[c.id].success ? "success" : "error"}
                      sx={{ fontSize: 11, height: 22, mb: 1 }}
                    />
                  )}

                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CheckCircle size={14} />}
                      onClick={() => handleTest(c.id)}
                      sx={{ fontSize: 11, textTransform: "none", flex: 1 }}
                    >
                      Test
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<RefreshCw size={14} />}
                      onClick={() => syncConnector.mutate(c.id)}
                      sx={{ fontSize: 11, textTransform: "none", flex: 1 }}
                    >
                      Sync
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {(!connectors || connectors.length === 0) && (
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ py: 4 }}>
                <Typography sx={{ textAlign: "center", color: "text.secondary", fontSize: 13 }}>
                  No connectors configured. Add a connector to start ingesting AI usage events.
                </Typography>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 16 }}>Add Connector</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField size="small" label="Connector Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} fullWidth />
            <FormControl size="small" fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={form.type} label="Type" onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as ConnectorType }))}>
                {["webhook", "splunk", "sentinel", "qradar", "zscaler", "netskope", "syslog"].map((t) => (
                  <MenuItem key={t} value={t}>
                    <Box>
                      <Typography sx={{ fontSize: 13 }}>{t.charAt(0).toUpperCase() + t.slice(1)}</Typography>
                      <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{CONNECTOR_DESCRIPTIONS[t]?.split(" - ")[1] || ""}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {(form.type === "splunk" || form.type === "sentinel" || form.type === "qradar") && (
              <>
                <TextField size="small" label="API URL" onChange={(e) => setForm((p) => ({ ...p, config: { ...p.config, api_url: e.target.value } }))} fullWidth />
                <TextField size="small" label="API Token" type="password" onChange={(e) => setForm((p) => ({ ...p, config: { ...p.config, auth_token: e.target.value } }))} fullWidth />
                <TextField size="small" label="Search Query / Index" onChange={(e) => setForm((p) => ({ ...p, config: { ...p.config, search_query: e.target.value } }))} fullWidth />
              </>
            )}

            {(form.type === "zscaler" || form.type === "netskope") && (
              <>
                <TextField size="small" label="Cloud URL" onChange={(e) => setForm((p) => ({ ...p, config: { ...p.config, cloud_url: e.target.value } }))} fullWidth />
                <TextField size="small" label="API Token" type="password" onChange={(e) => setForm((p) => ({ ...p, config: { ...p.config, api_token: e.target.value } }))} fullWidth />
              </>
            )}

            {form.type === "webhook" && (
              <TextField
                size="small"
                label="Webhook Secret (optional)"
                type="password"
                onChange={(e) => setForm((p) => ({ ...p, config: { ...p.config, webhook_secret: e.target.value } }))}
                fullWidth
                helperText="Optional shared secret for webhook authentication"
              />
            )}

            {form.type === "syslog" && (
              <>
                <TextField size="small" label="Port" type="number" defaultValue={514} onChange={(e) => setForm((p) => ({ ...p, config: { ...p.config, syslog_port: parseInt(e.target.value) } }))} fullWidth />
                <FormControl size="small" fullWidth>
                  <InputLabel>Protocol</InputLabel>
                  <Select defaultValue="tcp" label="Protocol" onChange={(e) => setForm((p) => ({ ...p, config: { ...p.config, syslog_protocol: e.target.value } }))}>
                    <MenuItem value="tcp">TCP</MenuItem>
                    <MenuItem value="udp">UDP</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.name} sx={{ textTransform: "none" }}>Add Connector</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Connectors;
