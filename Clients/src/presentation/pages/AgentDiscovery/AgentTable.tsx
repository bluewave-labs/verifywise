import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableFooter,
  TablePagination,
  TableRow,
  Stack,
  Chip as MuiChip,
  Box,
  useTheme,
} from "@mui/material";
import { ChevronsUpDown, ChevronUp, ChevronDown, AlertTriangle } from "lucide-react";
import { ReactComponent as SelectorVertical } from "../../assets/icons/selector-vertical.svg";
import { EmptyState } from "../../components/EmptyState";
import Chip from "../../components/Chip";
import TablePaginationActions from "../../components/TablePagination";
import { singleTheme } from "../../themes";
import {
  permissionChip,
  agentFooterRow,
  agentShowingText,
  agentPaginationMenu,
  agentPaginationSelect,
  agentPagination,
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

const cellStyle = singleTheme.tableStyles.primary.body.cell;

const TABLE_COLUMNS = [
  { id: "display_name", label: "NAME", sortable: true },
  { id: "source_system", label: "SOURCE", sortable: true },
  { id: "primitive_type", label: "TYPE", sortable: true },
  { id: "permissions", label: "PERMISSIONS", sortable: false },
  { id: "last_activity", label: "LAST ACTIVITY", sortable: true },
  { id: "review_status", label: "STATUS", sortable: true },
  { id: "stale", label: "", sortable: false },
];

type SortDirection = "asc" | "desc" | null;
type SortConfig = { key: string; direction: SortDirection };

const AgentTable: React.FC<AgentTableProps> = ({
  agents,
  isLoading,
  onRowClick,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "",
    direction: null,
  });

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

  const handleSort = useCallback((columnLabel: string) => {
    setSortConfig((prev) => {
      if (prev.key === columnLabel) {
        if (prev.direction === "asc") return { key: columnLabel, direction: "desc" };
        if (prev.direction === "desc") return { key: "", direction: null };
      }
      return { key: columnLabel, direction: "asc" };
    });
  }, []);

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return agents;

    const sorted = [...agents].sort((a, b) => {
      let aVal: string | null = null;
      let bVal: string | null = null;

      switch (sortConfig.key) {
        case "NAME":
          aVal = a.display_name;
          bVal = b.display_name;
          break;
        case "SOURCE":
          aVal = a.source_system;
          bVal = b.source_system;
          break;
        case "TYPE":
          aVal = a.primitive_type;
          bVal = b.primitive_type;
          break;
        case "LAST ACTIVITY":
          aVal = a.last_activity;
          bVal = b.last_activity;
          break;
        case "STATUS":
          aVal = a.review_status;
          bVal = b.review_status;
          break;
        default:
          return 0;
      }

      const strA = (aVal || "").toLowerCase();
      const strB = (bVal || "").toLowerCase();
      if (strA < strB) return sortConfig.direction === "asc" ? -1 : 1;
      if (strA > strB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [agents, sortConfig]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRange = useMemo(() => {
    const start = page * rowsPerPage + 1;
    const end = Math.min((page + 1) * rowsPerPage, sortedData.length);
    return `${start}–${end}`;
  }, [page, rowsPerPage, sortedData.length]);

  if (isLoading) {
    return <EmptyState message="Loading agents..." />;
  }

  if (!sortedData || sortedData.length === 0) {
    return <EmptyState message="No agents found. Trigger a sync or add one manually." />;
  }

  const tableHeader = (
    <TableHead
      sx={{
        backgroundColor: singleTheme.tableStyles.primary.header.backgroundColors,
      }}
    >
      <TableRow sx={singleTheme.tableStyles.primary.header.row}>
        {TABLE_COLUMNS.map((column) => {
          const sortable = column.sortable;
          return (
            <TableCell
              key={column.id}
              sx={{
                ...singleTheme.tableStyles.primary.header.cell,
                ...(sortable
                  ? {
                      cursor: "pointer",
                      userSelect: "none",
                      "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                      },
                    }
                  : {}),
              }}
              onClick={() => sortable && handleSort(column.label)}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: theme.spacing(2),
                }}
              >
                <div
                  style={{
                    fontWeight: 400,
                    color:
                      sortConfig.key === column.label
                        ? "primary.main"
                        : "inherit",
                  }}
                >
                  {column.label}
                </div>
                {sortable && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      color:
                        sortConfig.key === column.label
                          ? "primary.main"
                          : "#9CA3AF",
                    }}
                  >
                    {sortConfig.key === column.label &&
                      sortConfig.direction === "asc" && (
                        <ChevronUp size={16} />
                      )}
                    {sortConfig.key === column.label &&
                      sortConfig.direction === "desc" && (
                        <ChevronDown size={16} />
                      )}
                    {sortConfig.key !== column.label && (
                      <ChevronsUpDown size={16} />
                    )}
                  </Box>
                )}
              </Box>
            </TableCell>
          );
        })}
      </TableRow>
    </TableHead>
  );

  const tableBody = (
    <TableBody>
      {sortedData
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((agent) => (
          <TableRow
            key={agent.id}
            sx={singleTheme.tableStyles.primary.body.row}
            onClick={() => onRowClick(agent)}
          >
            <TableCell sx={cellStyle}>{agent.display_name}</TableCell>
            <TableCell sx={cellStyle}>{agent.source_system}</TableCell>
            <TableCell sx={cellStyle}>{agent.primitive_type}</TableCell>
            <TableCell sx={cellStyle}>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                {(agent.permission_categories || []).slice(0, 3).map((cat) => (
                  <MuiChip
                    key={cat}
                    label={cat}
                    size="small"
                    sx={permissionChip}
                  />
                ))}
                {(agent.permission_categories || []).length > 3 && (
                  <MuiChip
                    label={`+${agent.permission_categories.length - 3}`}
                    size="small"
                    sx={permissionChip}
                  />
                )}
              </Stack>
            </TableCell>
            <TableCell sx={cellStyle}>
              {formatDate(agent.last_activity)}
            </TableCell>
            <TableCell sx={cellStyle}>
              <Chip label={agent.review_status} />
            </TableCell>
            <TableCell sx={{ ...cellStyle, width: 40 }}>
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
  );

  return (
    <TableContainer sx={{ overflowX: "auto" }}>
      <Table sx={singleTheme.tableStyles.primary.frame}>
        {tableHeader}
        {tableBody}
        <TableFooter>
          <TableRow sx={agentFooterRow(theme)}>
            <TableCell colSpan={3} sx={agentShowingText(theme)}>
              Showing {getRange} of {sortedData.length} agent(s)
            </TableCell>
            <TablePagination
              count={sortedData.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[5, 10, 15, 25]}
              onRowsPerPageChange={handleChangeRowsPerPage}
              ActionsComponent={(props) => (
                <TablePaginationActions {...props} />
              )}
              labelRowsPerPage="Rows per page"
              labelDisplayedRows={({ page, count }) =>
                `Page ${page + 1} of ${Math.max(
                  0,
                  Math.ceil(count / rowsPerPage)
                )}`
              }
              slotProps={{
                select: {
                  MenuProps: agentPaginationMenu(theme),
                  inputProps: {
                    id: "agent-pagination-dropdown",
                  },
                  IconComponent: SelectorVertical,
                  sx: agentPaginationSelect(theme),
                },
              }}
              sx={agentPagination(theme)}
            />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

export default AgentTable;
