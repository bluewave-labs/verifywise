import { TableHead, TableRow, TableCell, Box, Typography, useTheme } from "@mui/material";
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import singleTheme from "../../../../themes/v1SingleTheme";

// Column width definitions for consistent spacing
const columnWidths: Record<string, string> = {
  "EXPERIMENT ID": "18%",
  "MODEL": "10%",
  "JUDGE/SCORER": "16%",
  "# PROMPTS": "7%",
  "DATASET": "12%",
  "STATUS": "9%",
  "DATE": "14%",
  "ACTION": "60px",
};

// Map column labels to sortable field keys
const columnSortKeys: Record<string, string> = {
  "EXPERIMENT ID": "id",
  "MODEL": "model",
  "JUDGE/SCORER": "judge",
  "# PROMPTS": "prompts",
  "DATASET": "dataset",
  "STATUS": "status",
  "DATE": "date",
};

export type SortDirection = "asc" | "desc" | null;
export type SortConfig = {
  key: string;
  direction: SortDirection;
};

interface TableHeaderProps {
  columns: string[];
  sortConfig?: SortConfig;
  onSort?: (columnKey: string) => void;
}

const TableHeader = ({ columns, sortConfig, onSort }: TableHeaderProps) => {
  const theme = useTheme();
  // Columns that should be center-aligned
  const centerAlignedColumns = ["MODEL", "JUDGE/SCORER", "# PROMPTS", "DATASET", "STATUS", "DATE", "ACTION"];

  return (
    <TableHead
      sx={{
        backgroundColor:
          singleTheme.tableStyles.primary.header.backgroundColors,
      }}
    >
      <TableRow sx={singleTheme.tableStyles.primary.header.row}>
        {columns.map((column, index) => {
          const isActionColumn = column === "ACTION" || column === "Actions";
          const isCenterAligned = centerAlignedColumns.includes(column);
          const isFirstColumn = index === 0;
          const width = columnWidths[column];
          const sortKey = columnSortKeys[column];
          const isSortable = !!sortKey && onSort;
          
          return (
            <TableCell
              key={index}
              sx={{
                ...singleTheme.tableStyles.primary.header.cell,
                width: width || "auto",
                ...(isActionColumn
                  ? {
                      minWidth: "60px",
                      maxWidth: "60px",
                    }
                  : {}),
                ...(isSortable
                  ? {
                      cursor: "pointer",
                      userSelect: "none",
                      "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                      },
                    }
                  : {}),
              }}
              onClick={() => isSortable && onSort(sortKey)}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isFirstColumn ? "flex-start" : isCenterAligned ? "center" : "flex-start",
                  gap: theme.spacing(2),
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    fontSize: "13px",
                    color: sortConfig?.key === sortKey ? "primary.main" : "inherit",
                  }}
                >
                  {column}
                </Typography>
                {isSortable && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      color: sortConfig?.key === sortKey ? "primary.main" : "#9CA3AF",
                    }}
                  >
                    {sortConfig?.key === sortKey && sortConfig?.direction === "asc" && (
                      <ChevronUp size={14} />
                    )}
                    {sortConfig?.key === sortKey && sortConfig?.direction === "desc" && (
                      <ChevronDown size={14} />
                    )}
                    {sortConfig?.key !== sortKey && (
                      <ChevronsUpDown size={14} />
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
};

export default TableHeader;

