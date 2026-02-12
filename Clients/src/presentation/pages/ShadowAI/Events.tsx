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
  IconButton,
  Collapse,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { useEvents } from "../../../application/hooks/useShadowAi";
import type { IShadowAiEvent, RiskLevel } from "../../../domain/interfaces/i.shadowAi";

const RISK_CHIP_COLOR: Record<string, "error" | "warning" | "info" | "success" | "default"> = {
  critical: "error",
  high: "warning",
  medium: "info",
  low: "success",
  info: "default",
};

const EventRow: React.FC<{ event: IShadowAiEvent }> = ({ event }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TableRow hover sx={{ cursor: "pointer" }} onClick={() => setOpen(!open)}>
        <TableCell sx={{ width: 30, p: 0.5 }}>
          <IconButton size="small">{open ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}</IconButton>
        </TableCell>
        <TableCell sx={{ fontSize: 13 }}>{new Date(event.timestamp).toLocaleString()}</TableCell>
        <TableCell sx={{ fontSize: 13 }}>{event.ai_tool_name}</TableCell>
        <TableCell sx={{ fontSize: 13 }}>{event.user_identifier || "-"}</TableCell>
        <TableCell sx={{ fontSize: 13 }}>{event.department || "-"}</TableCell>
        <TableCell sx={{ fontSize: 13 }}>{event.action_type}</TableCell>
        <TableCell sx={{ fontSize: 13 }}>{event.data_classification || "-"}</TableCell>
        <TableCell>
          {event.risk_level && (
            <Chip label={event.risk_level} size="small" color={RISK_CHIP_COLOR[event.risk_level] || "default"} sx={{ fontSize: 11, height: 22 }} />
          )}
        </TableCell>
        <TableCell sx={{ fontSize: 13 }}>{event.risk_score ?? "-"}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={9} sx={{ py: 0, borderBottom: open ? undefined : "none" }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ py: 1, px: 2, fontSize: 12 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: 12 }}>Event Details</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.5 }}>
                <Box>Source IP: {event.source_ip || "-"}</Box>
                <Box>Destination: {event.destination_url || "-"}</Box>
                <Box>Category: {event.ai_tool_category || "-"}</Box>
                <Box>Connector ID: {event.connector_id}</Box>
              </Box>
              {event.metadata && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12 }}>Metadata</Typography>
                  <Box component="pre" sx={{ fontSize: 11, bgcolor: "action.hover", p: 1, borderRadius: 1, overflow: "auto", maxHeight: 120 }}>
                    {JSON.stringify(event.metadata, null, 2)}
                  </Box>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

const Events: React.FC = () => {
  const [filters, setFilters] = useState<any>({ page: 1, limit: 25 });
  const { data, isLoading } = useEvents(filters);

  const events = data?.events || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / (filters.limit || 25));

  const updateFilter = (key: string, value: any) => {
    setFilters((prev: any) => ({ ...prev, [key]: value, page: 1 }));
  };

  return (
    <Box>
      {/* Filters */}
      <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            size="small"
            label="Tool Name"
            value={filters.ai_tool_name || ""}
            onChange={(e) => updateFilter("ai_tool_name", e.target.value)}
            sx={{ width: 160, "& .MuiInputBase-root": { fontSize: 13 } }}
          />
          <TextField
            size="small"
            label="User"
            value={filters.user_identifier || ""}
            onChange={(e) => updateFilter("user_identifier", e.target.value)}
            sx={{ width: 160, "& .MuiInputBase-root": { fontSize: 13 } }}
          />
          <TextField
            size="small"
            label="Department"
            value={filters.department || ""}
            onChange={(e) => updateFilter("department", e.target.value)}
            sx={{ width: 140, "& .MuiInputBase-root": { fontSize: 13 } }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: 13 }}>Risk Level</InputLabel>
            <Select
              value={filters.risk_level || ""}
              label="Risk Level"
              onChange={(e) => updateFilter("risk_level", e.target.value)}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="" sx={{ fontSize: 13 }}>All</MenuItem>
              {["critical", "high", "medium", "low", "info"].map((r) => (
                <MenuItem key={r} value={r} sx={{ fontSize: 13 }}>{r}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel sx={{ fontSize: 13 }}>Action</InputLabel>
            <Select
              value={filters.action_type || ""}
              label="Action"
              onChange={(e) => updateFilter("action_type", e.target.value)}
              sx={{ fontSize: 13 }}
            >
              <MenuItem value="" sx={{ fontSize: 13 }}>All</MenuItem>
              {["access", "upload", "download", "prompt", "api_call", "login", "data_share"].map((a) => (
                <MenuItem key={a} value={a} sx={{ fontSize: 13 }}>{a}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" sx={{ ml: "auto", color: "text.secondary", fontSize: 12 }}>
            {total.toLocaleString()} events
          </Typography>
        </Box>
      </Card>

      {/* Table */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
      ) : (
        <Card variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 30 }} />
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Timestamp</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>AI Tool</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>User</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Department</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Action</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Data Class.</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Risk</TableCell>
                  <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.map((event: IShadowAiEvent) => (
                  <EventRow key={event.id} event={event} />
                ))}
                {events.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                      No events found. Configure a connector and ingest events to get started.
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

export default Events;
