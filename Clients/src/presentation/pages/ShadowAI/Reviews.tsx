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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Card,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { Plus } from "lucide-react";
import { useReviews, useCreateReview, useUpdateReview } from "../../../application/hooks/useShadowAi";
import type { IShadowAiReview, ReviewStatus } from "../../../domain/interfaces/i.shadowAi";

const STATUS_COLORS: Record<string, "error" | "warning" | "info" | "success" | "default"> = {
  pending: "default",
  in_progress: "info",
  completed: "success",
  escalated: "error",
};

const TYPE_LABELS: Record<string, string> = {
  tool_approval: "Tool Approval",
  violation_review: "Violation Review",
  exception_request: "Exception Request",
  periodic_audit: "Periodic Audit",
};

const Reviews: React.FC = () => {
  const [filters, setFilters] = useState<any>({});
  const { data: reviews, isLoading } = useReviews(filters);
  const createReview = useCreateReview();
  const updateReview = useUpdateReview();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ review_type: "tool_approval", subject_id: "", subject_type: "inventory", notes: "" });

  const handleCreate = () => {
    createReview.mutate({
      ...form,
      subject_id: parseInt(form.subject_id) || 0,
    });
    setDialogOpen(false);
    setForm({ review_type: "tool_approval", subject_id: "", subject_type: "inventory", notes: "" });
  };

  const handleStatusChange = (id: number, status: ReviewStatus, decision?: string) => {
    updateReview.mutate({ id, body: { status, decision } });
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel sx={{ fontSize: 13 }}>Type</InputLabel>
            <Select
              value={filters.review_type || ""}
              label="Type"
              onChange={(e) => setFilters((prev: any) => ({ ...prev, review_type: e.target.value }))}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="" sx={{ fontSize: 13 }}>All</MenuItem>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <MenuItem key={k} value={k} sx={{ fontSize: 13 }}>{v}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: 13 }}>Status</InputLabel>
            <Select
              value={filters.status || ""}
              label="Status"
              onChange={(e) => setFilters((prev: any) => ({ ...prev, status: e.target.value }))}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="" sx={{ fontSize: 13 }}>All</MenuItem>
              {["pending", "in_progress", "completed", "escalated"].map((s) => (
                <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s.replace("_", " ")}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Button variant="contained" size="small" startIcon={<Plus size={16} />} onClick={() => setDialogOpen(true)} sx={{ fontSize: 13, textTransform: "none" }}>
          Create Review
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
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Subject</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Decision</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Notes</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Created</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(reviews || []).map((r: IShadowAiReview) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ fontSize: 12 }}>{TYPE_LABELS[r.review_type] || r.review_type}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{r.subject_type} #{r.subject_id}</TableCell>
                    <TableCell>
                      <Chip label={r.status.replace("_", " ")} size="small" color={STATUS_COLORS[r.status] || "default"} sx={{ fontSize: 11, height: 22 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{r.decision || "-"}</TableCell>
                    <TableCell sx={{ fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.notes || "-"}
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        {r.status === "pending" && (
                          <Button size="small" variant="text" sx={{ fontSize: 11, minWidth: 0, p: "2px 6px", textTransform: "none" }}
                            onClick={() => handleStatusChange(r.id, "in_progress")}>Start</Button>
                        )}
                        {r.status === "in_progress" && (
                          <>
                            <Button size="small" variant="text" color="success" sx={{ fontSize: 11, minWidth: 0, p: "2px 6px", textTransform: "none" }}
                              onClick={() => handleStatusChange(r.id, "completed", "Approved")}>Complete</Button>
                            <Button size="small" variant="text" color="error" sx={{ fontSize: 11, minWidth: 0, p: "2px 6px", textTransform: "none" }}
                              onClick={() => handleStatusChange(r.id, "escalated")}>Escalate</Button>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {(!reviews || reviews.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                      No review tasks. Reviews are created for tool approvals, violation reviews, and exception requests.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: 16 }}>Create Review</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Review Type</InputLabel>
              <Select value={form.review_type} label="Review Type" onChange={(e) => setForm((p) => ({ ...p, review_type: e.target.value }))}>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <MenuItem key={k} value={k}>{v}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField size="small" label="Subject ID" value={form.subject_id} onChange={(e) => setForm((p) => ({ ...p, subject_id: e.target.value }))} fullWidth />
            <TextField size="small" label="Subject Type" value={form.subject_type} onChange={(e) => setForm((p) => ({ ...p, subject_type: e.target.value }))} fullWidth />
            <TextField size="small" label="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} fullWidth multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!form.subject_id} sx={{ textTransform: "none" }}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reviews;
