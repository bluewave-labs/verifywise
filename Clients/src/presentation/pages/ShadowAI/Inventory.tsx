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
  TextField,
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
import { useInventory, useUpdateInventoryItem } from "../../../application/hooks/useShadowAi";
import type { IShadowAiInventoryItem, ApprovalStatus } from "../../../domain/interfaces/i.shadowAi";

const RISK_CHIP_COLOR: Record<string, "error" | "warning" | "info" | "success" | "default"> = {
  critical: "error",
  high: "warning",
  medium: "info",
  low: "success",
  unclassified: "default",
};

const APPROVAL_CHIP_COLOR: Record<string, "error" | "warning" | "info" | "success" | "default"> = {
  discovered: "default",
  under_review: "warning",
  approved: "success",
  blocked: "error",
};

const CATEGORY_LABELS: Record<string, string> = {
  generative_ai: "Generative AI",
  code_assistant: "Code Assistant",
  image_generation: "Image Generation",
  video_generation: "Video Generation",
  voice_ai: "Voice AI",
  translation: "Translation",
  data_analysis: "Data Analysis",
  search_ai: "Search AI",
  writing_assistant: "Writing Assistant",
  chatbot: "Chatbot",
  automation: "Automation",
  ml_platform: "ML Platform",
  other: "Other",
};

const Inventory: React.FC = () => {
  const [filters, setFilters] = useState<any>({ page: 1, limit: 25 });
  const { data, isLoading } = useInventory(filters);
  const updateItem = useUpdateInventoryItem();

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / (filters.limit || 25));

  const updateFilter = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleApprovalChange = (id: number, status: ApprovalStatus) => {
    updateItem.mutate({ id, body: { approval_status: status } });
  };

  return (
    <Box>
      <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            size="small"
            label="Search tools"
            value={filters.search || ""}
            onChange={(e) => updateFilter("search", e.target.value)}
            sx={{ width: 200, "& .MuiInputBase-root": { fontSize: 13 } }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel sx={{ fontSize: 13 }}>Category</InputLabel>
            <Select
              value={filters.category || ""}
              label="Category"
              onChange={(e) => updateFilter("category", e.target.value)}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="" sx={{ fontSize: 13 }}>All</MenuItem>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <MenuItem key={k} value={k} sx={{ fontSize: 13 }}>{v}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel sx={{ fontSize: 13 }}>Status</InputLabel>
            <Select
              value={filters.approval_status || ""}
              label="Status"
              onChange={(e) => updateFilter("approval_status", e.target.value)}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="" sx={{ fontSize: 13 }}>All</MenuItem>
              {["discovered", "under_review", "approved", "blocked"].map((s) => (
                <MenuItem key={s} value={s} sx={{ fontSize: 13 }}>{s.replace("_", " ")}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: 13 }}>Risk</InputLabel>
            <Select
              value={filters.risk_classification || ""}
              label="Risk"
              onChange={(e) => updateFilter("risk_classification", e.target.value)}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="" sx={{ fontSize: 13 }}>All</MenuItem>
              {["critical", "high", "medium", "low", "unclassified"].map((r) => (
                <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>{r}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" sx={{ ml: "auto", color: "text.secondary", fontSize: 12 }}>
            {total} tools discovered
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
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Tool Name</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Domain</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Category</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12, fontWeight: 600 }}>Events</TableCell>
                  <TableCell align="right" sx={{ fontSize: 12, fontWeight: 600 }}>Users</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Departments</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Risk</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item: IShadowAiInventoryItem) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{item.tool_name}</TableCell>
                    <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{item.tool_domain}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>{CATEGORY_LABELS[item.category] || item.category}</TableCell>
                    <TableCell align="right" sx={{ fontSize: 13 }}>{item.total_events.toLocaleString()}</TableCell>
                    <TableCell align="right" sx={{ fontSize: 13 }}>{item.unique_users}</TableCell>
                    <TableCell sx={{ fontSize: 12 }}>
                      {(item.departments || []).slice(0, 3).join(", ")}
                      {(item.departments || []).length > 3 && ` +${item.departments.length - 3}`}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.risk_classification}
                        size="small"
                        color={RISK_CHIP_COLOR[item.risk_classification] || "default"}
                        sx={{ fontSize: 11, height: 22 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.approval_status.replace("_", " ")}
                        size="small"
                        color={APPROVAL_CHIP_COLOR[item.approval_status] || "default"}
                        sx={{ fontSize: 11, height: 22 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        {item.approval_status !== "approved" && (
                          <Button size="small" variant="text" color="success" sx={{ fontSize: 11, minWidth: 0, p: "2px 6px" }}
                            onClick={() => handleApprovalChange(item.id, "approved")}>Approve</Button>
                        )}
                        {item.approval_status !== "blocked" && (
                          <Button size="small" variant="text" color="error" sx={{ fontSize: 11, minWidth: 0, p: "2px 6px" }}
                            onClick={() => handleApprovalChange(item.id, "blocked")}>Block</Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                      No AI tools discovered yet. Ingest events to auto-populate the inventory.
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

export default Inventory;
