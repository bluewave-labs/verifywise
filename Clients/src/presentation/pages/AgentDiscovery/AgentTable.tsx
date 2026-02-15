import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Stack,
  Chip,
  Box,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { AlertTriangle } from "lucide-react";
import {
  agentRowHover,
  agentEmptyContainer,
  agentEmptyText,
  agentLoadingContainer,
  reviewStatusBadge,
  permissionChip,
  agentPagination,
  agentShowingText,
} from "./style";

export interface AgentPrimitiveRow {
  id: number;
  source_system: string;
  primitive_type: string;
  external_id: string;
  display_name: string;
  owner_id: string | null;
  permissions: any[];
  permission_categories: string[];
  last_activity: string | null;
  metadata: Record<string, any>;
  review_status: string;
  reviewed_by: number | null;
  reviewed_at: string | null;
  linked_model_inventory_id: number | null;
  is_stale: boolean;
  is_manual: boolean;
  created_at: string;
  updated_at: string;
}

interface AgentTableProps {
  agents: AgentPrimitiveRow[];
  isLoading: boolean;
  onRowClick: (agent: AgentPrimitiveRow) => void;
}

const AgentTable: React.FC<AgentTableProps> = ({
  agents,
  isLoading,
  onRowClick,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Reset to first page when agents list changes (e.g., filter applied)
  useEffect(() => {
    setPage(0);
  }, [agents]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedAgents = agents.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={agentLoadingContainer()}
      >
        <CircularProgress size={32} />
      </Stack>
    );
  }

  if (agents.length === 0) {
    return (
      <Stack
        alignItems="center"
        justifyContent="center"
        sx={agentEmptyContainer()}
      >
        <Typography sx={agentEmptyText}>
          No agent primitives found. Trigger a sync or add one manually.
        </Typography>
      </Stack>
    );
  }

  return (
    <Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Source</TableCell>
              <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Permissions</TableCell>
              <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Last activity</TableCell>
              <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontSize: 12, fontWeight: 600, width: 40 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedAgents.map((agent) => (
              <TableRow
                key={agent.id}
                sx={agentRowHover}
                onClick={() => onRowClick(agent)}
              >
                <TableCell sx={{ fontSize: 13 }}>
                  {agent.display_name}
                </TableCell>
                <TableCell sx={{ fontSize: 13 }}>
                  {agent.source_system}
                </TableCell>
                <TableCell sx={{ fontSize: 13 }}>
                  {agent.primitive_type}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                    {(agent.permission_categories || []).slice(0, 3).map((cat) => (
                      <Chip
                        key={cat}
                        label={cat.replace(/_/g, " ")}
                        size="small"
                        sx={permissionChip}
                      />
                    ))}
                    {(agent.permission_categories || []).length > 3 && (
                      <Chip
                        label={`+${agent.permission_categories.length - 3}`}
                        size="small"
                        sx={permissionChip}
                      />
                    )}
                  </Stack>
                </TableCell>
                <TableCell sx={{ fontSize: 13 }}>
                  {formatDate(agent.last_activity)}
                </TableCell>
                <TableCell>
                  <Typography
                    component="span"
                    sx={reviewStatusBadge(agent.review_status)}
                  >
                    {agent.review_status}
                  </Typography>
                </TableCell>
                <TableCell>
                  {agent.is_stale && (
                    <AlertTriangle
                      size={14}
                      strokeWidth={1.5}
                      color="#F9A825"
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mt: 1 }}
      >
        <Typography sx={agentShowingText(theme)}>
          Showing {page * rowsPerPage + 1}–
          {Math.min((page + 1) * rowsPerPage, agents.length)} of{" "}
          {agents.length}
        </Typography>
        <TablePagination
          component="div"
          count={agents.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          sx={agentPagination(theme)}
        />
      </Stack>
    </Box>
  );
};

export default AgentTable;
