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
  Pagination,
  CircularProgress,
  Card,
  Typography,
  Button,
} from "@mui/material";
import { useViolations, useUpdateViolation } from "../../../application/hooks/useShadowAi";
import type { IShadowAiViolation, ViolationStatus } from "../../../domain/interfaces/i.shadowAi";

const SEVERITY_COLORS: Record<string, "error" | "warning" | "info" | "success"> = {
  critical: "error",
  high: "warning",
  medium: "info",
  low: "success",
};

const STATUS_COLORS: Record<string, "error" | "warning" | "info" | "success" | "default"> = {
  open: "error",
  acknowledged: "warning",
  resolved: "success",
  excepted: "info",
};

const Violations: React.FC = () => {
  const [filters, setFilters] = useState<any>({ page: 1, limit: 25 });
  const { data, isLoading } = useViolations(filters);
  const updateViolation = useUpdateViolation();

  const violations = data?.violations || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / (filters.limit || 25));

  const updateFilter = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleStatusChange = (id: number, status: ViolationStatus) => {
    updateViolation.mutate({ id, body: { status } });
  };

  return (
    <Box>
      <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: 13 }}>Status</InputLabel>
            <Select
              value={filters.status || ""}
              label="Status"
              onChange={(e) => updateFilter("status", e.target.value)}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="" sx={{ fontSize: 13 }}>All</MenuItem>
              {["open", "acknowledged", "resolved", "excepted"].map((s) => (
                <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: 13 }}>Severity</InputLabel>
            <Select
              value={filters.severity || ""}
              label="Severity"
              onChange={(e) => updateFilter("severity", e.target.value)}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="" sx={{ fontSize: 13 }}>All</MenuItem>
              {["critical", "high", "medium", "low"].map((s) => (
                <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" sx={{ ml: "auto", color: "text.secondary", fontSize: 12 }}>
            {total} violations
          </Typography>
        </Box>
      </Card>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
      ) : (
        <Card variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Severity</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Policy</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>User</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Department</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {violations.map((v: IShadowAiViolation) => (
                  <TableRow key={v.id} hover>
                    <TableCell>
                      <Chip label={v.severity} size="small" color={SEVERITY_COLORS[v.severity]} sx={{ fontSize: 11, height: 22 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{v.policy_name || `Policy #${v.policy_id}`}</TableCell>
                    <TableCell sx={{ fontSize: 12, maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {v.description}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{v.user_identifier || "-"}</TableCell>
                    <TableCell sx={{ fontSize: 13 }}>{v.department || "-"}</TableCell>
                    <TableCell>
                      <Chip label={v.status} size="small" color={STATUS_COLORS[v.status] || "default"} sx={{ fontSize: 11, height: 22 }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{new Date(v.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        {v.status === "open" && (
                          <Button size="small" variant="text" sx={{ fontSize: 11, minWidth: 0, p: "2px 6px", textTransform: "none" }}
                            onClick={() => handleStatusChange(v.id, "acknowledged")}>Acknowledge</Button>
                        )}
                        {(v.status === "open" || v.status === "acknowledged") && (
                          <Button size="small" variant="text" color="success" sx={{ fontSize: 11, minWidth: 0, p: "2px 6px", textTransform: "none" }}
                            onClick={() => handleStatusChange(v.id, "resolved")}>Resolve</Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {violations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                      No violations found. Policies will generate violations when events match defined rules.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 1.5 }}>
              <Pagination
                count={totalPages}
                page={filters.page || 1}
                onChange={(_, p) => setFilters((prev: any) => ({ ...prev, page: p }))}
                size="small"
              />
            </Box>
          )}
        </Card>
      )}
    </Box>
  );
};

export default Violations;
