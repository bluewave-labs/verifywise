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
} from "@mui/material";
import TablePaginationActions from "../../TablePagination";
import singleTheme from "../../../themes/v1SingleTheme";
import { useState, useEffect, useCallback } from "react";
import IconButton from "../../IconButton";
import { ExternalLink as LinkExternalIcon } from "lucide-react";
import { handleDownload, handleFileManagerDownload, handleFileDelete } from "../../../../application/tools/fileDownload";
import { FileData } from "../../../../domain/types/File";
import {
  getPaginationRowCount,
  setPaginationRowCount,
} from "../../../../application/utils/paginationStorage";
import { IFileBasicTableProps } from "../../../../domain/interfaces/i.table";

const DEFAULT_ROWS_PER_PAGE = 10;

const navigteToNewTab = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
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

  const paginatedRows = bodyData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleRowClick = (item: FileData, event: React.MouseEvent) => {
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
      case "File Manager":
        // File Manager files don't have a source to navigate to
        console.log("File Manager file - no source navigation available");
        break;
      default:
        console.warn("Unknown source type:", item.source);
    }
  };

  const handleFileDownload = (item: FileData) => {
    // Use different download function based on source
    if (item.source === "File Manager") {
      handleFileManagerDownload(item.id, item.fileName);
    } else {
      handleDownload(item.id, item.fileName);
    }
  };

  return (
    <>
      <TableContainer id={table}>
        <Table sx={singleTheme.tableStyles.primary.frame}>
          <TableHead
            sx={{
              backgroundColor:
                singleTheme.tableStyles.primary.header.backgroundColors,
            }}
          >
            <TableRow sx={singleTheme.tableStyles.primary.header.row}>
              {data.cols.map((col) => (
                <TableCell
                  key={col.id}
                  style={{
                    ...singleTheme.tableStyles.primary.header.cell,
                    ...col.sx,
                  }}
                >
                  {typeof col.name === 'string' ? col.name.toUpperCase() : col.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map((row) => (
              <TableRow
                key={row.id}
                sx={{
                  ...singleTheme.tableStyles.primary.body.row,
                  height: "36px",
                  "&:hover": { backgroundColor: "#FBFBFB" },
                }}
              >
                <TableCell>{row.fileName}</TableCell>
                <TableCell>{row.projectTitle}</TableCell>
                <TableCell>{row.uploadDate}</TableCell>
                <TableCell>{row.uploader}</TableCell>
                <TableCell>
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
                    <LinkExternalIcon size={16} />
                  </Box>
                </TableCell>
                {/* Add any additional cells here */}
                <TableCell>
                  <IconButton
                    id={Number(row.id)}
                    type="evidence"
                    onEdit={() => {}}
                    onDownload={() => handleFileDownload(row)}
                    onDelete={() => {
                      if (row.source === "File Manager") {
                        handleFileDelete(row.id, row.fileName, onFileDeleted);
                      }
                    }}
                    warningTitle="Are you sure you want to delete this file?"
                    warningMessage="This action will permanently delete the file and cannot be undone."
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
                  {Math.min(page * rowsPerPage + rowsPerPage, bodyData.length)}{" "}
                  of {bodyData.length} items
                </TableCell>
                <TablePagination
                  count={bodyData.length}
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
