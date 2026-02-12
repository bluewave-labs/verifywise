import React, { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Card,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  IconButton,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import {
  usePolicies,
  useCreatePolicy,
  useUpdatePolicy,
  useDeletePolicy,
} from "../../../application/hooks/useShadowAi";
import type { IShadowAiPolicy } from "../../../domain/interfaces/i.shadowAi";

const SEVERITY_COLORS: Record<string, "error" | "warning" | "info" | "success"> = {
  critical: "error",
  high: "warning",
  medium: "info",
  low: "success",
};

const EMPTY_POLICY = {
  name: "",
  description: "",
  severity: "medium" as const,
  is_active: true,
  department_scope: [] as string[],
  rules: { logic: "AND" as const, rules: [{ field: "ai_tool_category", operator: "equals" as const, value: "" }] },
};

const Policies: React.FC = () => {
  const { data: policies, isLoading } = usePolicies();
  const createPolicy = useCreatePolicy();
  const updatePolicy = useUpdatePolicy();
  const deletePolicy = useDeletePolicy();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_POLICY);

  const handleOpen = (policy?: IShadowAiPolicy) => {
    if (policy) {
      setEditingPolicy(policy);
      setForm({
        name: policy.name,
        description: policy.description || "",
        severity: policy.severity,
        is_active: policy.is_active,
        department_scope: policy.department_scope || [],
        rules: policy.rules || EMPTY_POLICY.rules,
      });
    } else {
      setEditingPolicy(null);
      setForm({ ...EMPTY_POLICY, rules: { ...EMPTY_POLICY.rules, rules: [{ field: "ai_tool_category", operator: "equals", value: "" }] } });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    const data = {
      ...form,
      department_scope: form.department_scope.length > 0 ? form.department_scope : null,
    };
    if (editingPolicy) {
      updatePolicy.mutate({ id: editingPolicy.id, body: data });
    } else {
      createPolicy.mutate(data);
    }
    setDialogOpen(false);
  };

  const updateRule = (idx: number, field: string, value: any) => {
    const newRules = [...form.rules.rules];
    newRules[idx] = { ...newRules[idx], [field]: value };
    setForm((prev: any) => ({ ...prev, rules: { ...prev.rules, rules: newRules } }));
  };

  const addRule = () => {
    setForm((prev: any) => ({
      ...prev,
      rules: { ...prev.rules, rules: [...prev.rules.rules, { field: "ai_tool_name", operator: "equals", value: "" }] },
    }));
  };

  const removeRule = (idx: number) => {
    if (form.rules.rules.length <= 1) return;
    const newRules = form.rules.rules.filter((_: any, i: number) => i !== idx);
    setForm((prev: any) => ({ ...prev, rules: { ...prev.rules, rules: newRules } }));
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 13 }}>
          Define AI usage policies to automatically detect violations
        </Typography>
        <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpen()} sx={{ fontSize: 13, textTransform: "none" }}>
          Create Policy
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
      ) : (
        <Card variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Severity</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Scope</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Active</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12, fontWeight: 600 }}>Violations</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(policies || []).map((p: IShadowAiPolicy) => (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{p.name}</TableCell>
                    <TableCell sx={{ fontSize: 12, color: "text.secondary", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Chip label={p.severity} size="small" color={SEVERITY_COLORS[p.severity]} sx={{ fontSize: 11, height: 22 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      {p.department_scope && p.department_scope.length > 0
                        ? p.department_scope.join(", ")
                        : "All departments"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={p.is_active ? "Active" : "Inactive"}
                        size="small"
                        color={p.is_active ? "success" : "default"}
                        sx={{ fontSize: 11, height: 22 }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: 13 }}>{p.violation_count || 0}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton size="small" onClick={() => handleOpen(p)}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => deletePolicy.mutate(p.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {(!policies || policies.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                      No policies defined. Create a policy to start monitoring AI usage compliance.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Policy Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 16 }}>{editingPolicy ? "Edit Policy" : "Create Policy"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Policy Name"
              size="small"
              value={form.name}
              onChange={(e) => setForm((prev: any) => ({ ...prev, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Description"
              size="small"
              value={form.description}
              onChange={(e) => setForm((prev: any) => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={form.severity}
                  label="Severity"
                  onChange={(e) => setForm((prev: any) => ({ ...prev, severity: e.target.value }))}
                >
                  {["critical", "high", "medium", "low"].map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControlLabel
                control={<Switch checked={form.is_active} onChange={(e) => setForm((prev: any) => ({ ...prev, is_active: e.target.checked }))} />}
                label="Active"
              />
            </Box>

            <Typography variant="subtitle2" sx={{ mt: 1, fontWeight: 600, fontSize: 13 }}>
              Rules ({form.rules.logic})
            </Typography>
            <FormControl size="small" sx={{ width: 120 }}>
              <InputLabel>Logic</InputLabel>
              <Select
                value={form.rules.logic}
                label="Logic"
                onChange={(e) => setForm((prev: any) => ({ ...prev, rules: { ...prev.rules, logic: e.target.value } }))}
              >
                <MenuItem value="AND">AND</MenuItem>
                <MenuItem value="OR">OR</MenuItem>
              </Select>
            </FormControl>

            {form.rules.rules.map((rule: any, idx: number) => (
              <Box key={idx} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Field</InputLabel>
                  <Select value={rule.field} label="Field" onChange={(e) => updateRule(idx, "field", e.target.value)}>
                    {["ai_tool_name", "ai_tool_category", "action_type", "data_classification", "destination_url", "user_identifier"].map((f) => (
                      <MenuItem key={f} value={f} sx={{ fontSize: 13 }}>{f.replace(/_/g, " ")}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 110 }}>
                  <InputLabel>Operator</InputLabel>
                  <Select value={rule.operator} label="Operator" onChange={(e) => updateRule(idx, "operator", e.target.value)}>
                    {["equals", "not_equals", "contains", "in", "not_in", "matches"].map((o) => (
                      <MenuItem key={o} value={o} sx={{ fontSize: 13 }}>{o.replace("_", " ")}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  label="Value"
                  value={rule.value}
                  onChange={(e) => updateRule(idx, "value", e.target.value)}
                  sx={{ flex: 1 }}
                />
                <IconButton size="small" onClick={() => removeRule(idx)} disabled={form.rules.rules.length <= 1}>
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            ))}
            <Button size="small" onClick={addRule} sx={{ alignSelf: "flex-start", fontSize: 12, textTransform: "none" }}>
              + Add Rule
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.name}
            sx={{ textTransform: "none" }}
          >
            {editingPolicy ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Policies;
