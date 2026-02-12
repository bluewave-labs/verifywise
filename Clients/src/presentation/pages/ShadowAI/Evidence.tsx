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
  Typography,
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
} from "@mui/material";
import { Plus, Download } from "lucide-react";
import { useEvidenceExports, useCreateEvidenceExport } from "../../../application/hooks/useShadowAi";
import type { IShadowAiEvidenceExport } from "../../../domain/interfaces/i.shadowAi";

const Evidence: React.FC = () => {
  const { data: exports, isLoading } = useEvidenceExports();
  const createExport = useCreateEvidenceExport();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    date_range_start: "",
    date_range_end: "",
    export_format: "csv" as "pdf" | "csv" | "json",
  });

  const handleCreate = () => {
    createExport.mutate(form);
    setDialogOpen(false);
    setForm({ name: "", date_range_start: "", date_range_end: "", export_format: "csv" });
  };

  // Set default dates for new export
  const handleOpenDialog = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    setForm({
      name: `Evidence Export - ${now.toISOString().split("T")[0]}`,
      date_range_start: thirtyDaysAgo.toISOString().split("T")[0],
      date_range_end: now.toISOString().split("T")[0],
      export_format: "csv",
    });
    setDialogOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 13 }}>
          Generate time-bounded evidence packages for audits and regulatory requests
        </Typography>
        <Button variant="contained" size="small" startIcon={<Plus size={16} />} onClick={handleOpenDialog} sx={{ fontSize: 13, textTransform: "none" }}>
          Generate Export
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
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Date Range</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Format</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Generated</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(exports || []).map((exp: IShadowAiEvidenceExport) => (
                  <TableRow key={exp.id} hover>
                    <TableCell sx={{ fontSize: 13 }}>{exp.name}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      {new Date(exp.date_range_start).toLocaleDateString()} - {new Date(exp.date_range_end).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip label={exp.export_format.toUpperCase()} size="small" variant="outlined" sx={{ fontSize: 11, height: 22 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      {exp.generated_at ? new Date(exp.generated_at).toLocaleString() : "-"}
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="text" startIcon={<Download size={14} />} sx={{ fontSize: 11, textTransform: "none" }}>
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(!exports || exports.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                      No evidence exports yet. Generate an export to create audit-ready evidence packages.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 16 }}>Generate Evidence Export</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField size="small" label="Export Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} fullWidth />
            <TextField
              size="small"
              label="Start Date"
              type="date"
              value={form.date_range_start}
              onChange={(e) => setForm((p) => ({ ...p, date_range_start: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              size="small"
              label="End Date"
              type="date"
              value={form.date_range_end}
              onChange={(e) => setForm((p) => ({ ...p, date_range_end: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Format</InputLabel>
              <Select value={form.export_format} label="Format" onChange={(e) => setForm((p) => ({ ...p, export_format: e.target.value as any }))}>
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!form.name || !form.date_range_start || !form.date_range_end}
            sx={{ textTransform: "none" }}
          >
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Evidence;
