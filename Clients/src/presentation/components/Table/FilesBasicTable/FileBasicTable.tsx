import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  useTheme,
  Typography,
} from "@mui/material";
import TablePaginationActions from "../../TablePagination";
import singleTheme from "../../../themes/v1SingleTheme";
import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import IconButton from "../../IconButton";
import { handleDownload } from "../../../../application/tools/fileDownload";
import { deleteFileFromManager } from "../../../../application/repository/file.repository";
import { FileModel } from "../../../../domain/models/Common/file/file.model";
import {
  getPaginationRowCount,
  setPaginationRowCount,
} from "../../../../application/utils/paginationStorage";
import { IFileBasicTableProps } from "../../../../domain/interfaces/i.table";

const DEFAULT_ROWS_PER_PAGE = 10;
const FILES_BASIC_SORTING_KEY = "verifywise_files_basic_sorting";

type SortDirection = "asc" | "desc" | null;
type SortConfig = {
  key: string;
  direction: SortDirection;
};

const navigteToNewTab = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

// Helper function to match column name with sort key
const getSortMatchForColumn = (columnName: string, sortConfig?: SortConfig): boolean => {
  if (!sortConfig?.key || !columnName) return false;

  const sortKey = sortConfig.key.toLowerCase().trim();
  const colName = columnName.toString().toLowerCase().trim();

  // Handle flexible matching for different column name patterns
  return (
    sortKey === colName ||
    (sortKey.includes("file") && colName.includes("name")) ||
    (sortKey.includes("project") && colName.includes("project")) ||
    (sortKey.includes("date") || sortKey.includes("upload")) && (colName.includes("date") || colName.includes("upload")) ||
    (sortKey.includes("uploader") || sortKey.includes("user")) && (colName.includes("uploader") || colName.includes("user")) ||
    (sortKey.includes("source") || sortKey.includes("type")) && (colName.includes("source") || colName.includes("type"))
  );
};

// Sortable Table Header Component
const SortableTableHead: React.FC<{
  columns: any[];
  sortConfig: SortConfig;
  onSort: (columnId: string) => void;
}> = ({ columns, sortConfig, onSort }) => {
  const theme = useTheme();

  return (
    <TableHead
      sx={{
        backgroundColor:
          singleTheme.tableStyles.primary.header.backgroundColors,
      }}
    >
      <TableRow sx={singleTheme.tableStyles.primary.header.row}>
        {columns.map((col, index) => {
          const isLastColumn = index === columns.length - 1;
          const columnName = col.name.toString().toLowerCase();
          const sortable = !["actions", "action"].includes(columnName);

          return (
            <TableCell
              key={col.id}
              style={{
                ...singleTheme.tableStyles.primary.header.cell,
                ...col.sx,
                ...(isLastColumn && {
                  position: "sticky",
                  right: 0,
                  zIndex: 10,
                  backgroundColor:
                    singleTheme.tableStyles.primary.header.backgroundColors,
                }),
                ...(!isLastColumn && sortable
                  ? {
                      cursor: "pointer",
                      userSelect: "none",
                      "&:hover": {
                        backgroundColor: "rgba(0, 0, 0, 0.04)",
                      },
                    }
                  : {}),
              }}
              onClick={() => sortable && onSort(col.name)}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: theme.spacing(2),
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color:
                      sortConfig.key === col.name ? "primary.main" : "inherit",
                    textTransform: "uppercase",
                  }}
                >
                  {col.name.toString()}
                </Typography>
                {sortable && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      color:
                        sortConfig.key === col.name
                          ? "primary.main"
                          : "#9CA3AF",
                    }}
                  >
                    {sortConfig.key === col.name &&
                      sortConfig.direction === "asc" && <ChevronUp size={16} />}
                    {sortConfig.key === col.name &&
                      sortConfig.direction === "desc" && (
                        <ChevronDown size={16} />
                      )}
                    {sortConfig.key !== col.name && (
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
};

const FileBasicTable: React.FC<IFileBasicTableProps> = ({
  data,
  bodyData,
  paginated = false,
  table,
  onFileDeleted,
}) => {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    getPaginationRowCount("evidences", DEFAULT_ROWS_PER_PAGE)
  );

  // Initialize sorting state from localStorage or default to no sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    const saved = localStorage.getItem(FILES_BASIC_SORTING_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { key: "", direction: null };
      }
    }
    return { key: "", direction: null };
  });

  // Save sorting state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(FILES_BASIC_SORTING_KEY, JSON.stringify(sortConfig));
  }, [sortConfig]);

  useEffect(() => setPage(0), [data]);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newRowsPerPage = parseInt(event.target.value, 10);
      setRowsPerPage(newRowsPerPage);
      setPaginationRowCount("evidences", newRowsPerPage);
      setPage(0);
    },
    []
  );

  // Sorting handlers
  const handleSort = useCallback((columnId: string) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === columnId) {
        // Toggle direction if same column, or clear if already descending
        if (prevConfig.direction === "asc") {
          return { key: columnId, direction: "desc" };
        } else if (prevConfig.direction === "desc") {
          return { key: "", direction: null };
        }
      }
      // New column or first sort
      return { key: columnId, direction: "asc" };
    });
  }, []);

  // Sort the bodyData based on current sort configuration
  const sortedBodyData = useMemo(() => {
    if (!bodyData || !sortConfig.key || !sortConfig.direction) {
      return bodyData || [];
    }

    const sortableData = [...bodyData];

    return sortableData.sort((a: any, b: any) => {
      let aValue: string | number;
      let bValue: string | number;

      // Use exact column name matching - case insensitive
      const sortKey = sortConfig.key.trim().toLowerCase();

      // Handle different column types for files
      if (sortKey.includes("file") || sortKey.includes("name")) {
        aValue = a.fileName?.toLowerCase() || "";
        bValue = b.fileName?.toLowerCase() || "";
      } else if (sortKey.includes("project")) {
        aValue = a.projectTitle?.toLowerCase() || "";
        bValue = b.projectTitle?.toLowerCase() || "";
      } else if (sortKey.includes("date") || sortKey.includes("upload")) {
        aValue = new Date(a.uploadDate).getTime();
        bValue = new Date(b.uploadDate).getTime();
      } else if (sortKey.includes("uploader") || sortKey.includes("user")) {
        aValue = a.uploader?.toLowerCase() || "";
        bValue = b.uploader?.toLowerCase() || "";
      } else if (sortKey.includes("source") || sortKey.includes("type")) {
        aValue = a.source?.toLowerCase() || "";
        bValue = b.source?.toLowerCase() || "";
      } else {
        // Try to handle unknown columns by checking if they're properties of the row
        if (sortKey && sortKey in a && sortKey in b) {
          const aVal = (a as Record<string, unknown>)[sortKey];
          const bVal = (b as Record<string, unknown>)[sortKey];
          aValue = String(aVal).toLowerCase();
          bValue = String(bVal).toLowerCase();
          const comparison = aValue.localeCompare(bValue);
          return sortConfig.direction === "asc" ? comparison : -comparison;
        }
        return 0;
      }

      // Handle string comparisons
      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === "asc" ? comparison : -comparison;
      }

      // Handle number comparisons
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [bodyData, sortConfig]);

  const paginatedRows = sortedBodyData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleRowClick = (item: FileModel, event: React.MouseEvent) => {
    event.stopPropagation();
    switch (item.source) {
      case "Assessment tracker group":
        navigteToNewTab(
          `/project-view?projectId=${item.projectId}&tab=frameworks&framework=eu-ai-act&topicId=${item.parentId}&questionId=${item.metaId}`
        );
        break;
      case "Compliance tracker group":
        navigteToNewTab(
          `/project-view?projectId=${item.projectId}&tab=frameworks&framework=eu-ai-act&controlId=${item.parentId}&subControlId=${item.metaId}&isEvidence=${item.isEvidence}`
        );
        break;
      case "Management system clauses group":
        navigteToNewTab(
          `/framework?frameworkName=iso-42001&clauseId=${item.parentId}&subClauseId=${item.metaId}`
        );
        break;
      case "Main clauses group":
        navigteToNewTab(
          `/framework?frameworkName=iso-27001&clause27001Id=${item.parentId}&subClause27001Id=${item.metaId}`
        );
        break;
      case "Reference controls group":
        navigteToNewTab(
          `/framework?frameworkName=iso-42001&annexId=${item.parentId}&annexCategoryId=${item.metaId}`
        );
        break;
      case "Annex controls group":
        navigteToNewTab(
          `/framework?frameworkName=iso-27001&annex27001Id=${item.parentId}&annexControl27001Id=${item.metaId}`
        );
        break;
      default:
        console.warn("Unknown source type:", item.source);
    }
  };

  // Create delete handler for a specific file
  const createDeleteHandler = useCallback(
    (fileId: string, source?: string) => async () => {
      try {
        await deleteFileFromManager({ id: fileId, source });
        // After successful delete, refresh the list
        if (onFileDeleted) {
          onFileDeleted();
        }
      } catch (error) {
        console.error("Failed to delete file:", error);
        throw error; // Re-throw so IconButton can show error
      }
    },
    [onFileDeleted]
  );

  return (
    <>
      <TableContainer id={table}>
        <Table sx={singleTheme.tableStyles.primary.frame}>
          <SortableTableHead
            columns={data.cols}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
          <TableBody>
            {paginatedRows.map((row) => (
              <TableRow
                key={`${row.id}-${row.fileName}`}
                sx={{
                  ...singleTheme.tableStyles.primary.body.row,
                  height: "36px",
                  "&:hover": { backgroundColor: "#FBFBFB" },
                }}
              >
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    backgroundColor: getSortMatchForColumn(data.cols[0]?.name, sortConfig) ? "#e8e8e8" : "#fafafa",
                  }}
                >
                  {row.fileName}
                </TableCell>
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    backgroundColor: getSortMatchForColumn(data.cols[1]?.name, sortConfig) ? "#f5f5f5" : "inherit",
                  }}
                >
                  {row.projectTitle}
                </TableCell>
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    backgroundColor: getSortMatchForColumn(data.cols[2]?.name, sortConfig) ? "#f5f5f5" : "inherit",
                  }}
                >
                  {row.getFormattedUploadDate()}
                </TableCell>
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    backgroundColor: getSortMatchForColumn(data.cols[3]?.name, sortConfig) ? "#f5f5f5" : "inherit",
                  }}
                >
                  {row.uploaderName || row.uploader}
                </TableCell>
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    backgroundColor: getSortMatchForColumn(data.cols[4]?.name, sortConfig) ? "#f5f5f5" : "inherit",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-end",
                      gap: "4px",
                      textDecoration: "underline",
                      "& svg": { visibility: "hidden" },
                      "&:hover": {
                        cursor: "pointer",
                        "& svg": { visibility: "visible" },
                      },
                    }}
                    onClick={(event) => handleRowClick(row, event)}
                  >
                    {row.source}
                  </Box>
                </TableCell>
                {/* Add any additional cells here */}
                <TableCell
                  sx={{
                    ...singleTheme.tableStyles.primary.body.cell,
                    position: "sticky",
                    right: 0,
                    zIndex: 10,
                    minWidth: "50px",
                    backgroundColor: getSortMatchForColumn(data.cols[data.cols.length - 1]?.name, sortConfig) ? "#f5f5f5" : "inherit",
                  }}
                >
                  <IconButton
                    id={Number(row.id)}
                    type="report"
                    onEdit={() => {}}
                    onDownload={() => handleDownload(row.id, row.fileName, row.source)}
                    onDelete={createDeleteHandler(row.id, row.source)}
                    warningTitle="Delete this file?"
                    warningMessage="When you delete this file, it will be permanently removed from the system. This action cannot be undone."
                    onMouseEvent={() => {}}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {paginated && (
            <TableFooter>
              <TableRow
                sx={{
                  "& .MuiTableCell-root.MuiTableCell-footer": {
                    paddingX: theme.spacing(8),
                    paddingY: theme.spacing(4),
                  },
                }}
              >
                <TableCell
                  sx={{
                    paddingX: theme.spacing(2),
                    fontSize: 12,
                    opacity: 0.7,
                  }}
                >
                  Showing {page * rowsPerPage + 1} -
                  {Math.min(
                    page * rowsPerPage + rowsPerPage,
                    sortedBodyData.length
                  )}{" "}
                  of {sortedBodyData.length} items
                </TableCell>
                <TablePagination
                  count={sortedBodyData.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[5, 10, 15, 20, 25]}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  ActionsComponent={
                    TablePaginationActions as React.ComponentType<any>
                  }
                  labelRowsPerPage="Rows per page"
                  sx={{ mt: theme.spacing(6) }}
                />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </TableContainer>
    </>
  );
};

export default FileBasicTable;
