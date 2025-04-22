import React, { useState, useMemo } from "react";
import FileBasicTable from "../FilesBasicTable/FileBasicTable";
import { Stack, Box, Typography } from "@mui/material";
import AscendingIcon from "../../../assets/icons/up-arrow.svg";
import DescendingIcon from "../../../assets/icons/down-arrow.svg";
import EmptyTableImage from "../../../assets/imgs/empty-state.svg";
import { FileData } from "../../../../domain/File";

type SortDirection = "asc" | "desc" | null;

/**
 * Represents the props of the FileTable component.
 * @typedef {Object} FileTableProps
 * @property {Array} cols - The columns of the table.
 * @property {Array<FileData>} files - The list of files.
 * @property {Function} onRowClick - Callback to handle row selection.
 */
interface FileTableProps {
  cols: any[];
  files: FileData[];
}
/**
 *
 * Displays an empty state when no files are available.
 * @returns {JSX.Element} The empty state component.
 *
 */
const EmptyState: React.FC = (): JSX.Element => (
  <Stack
    direction="column"
    alignItems="center"
    justifyContent="center"
    sx={{
      flex: 1,
      height: "100%",
      width: "100%",
      textAlign: "center",
      border: "1px solid #eeeeee",
      padding: 4,
      boxSizing: "border-box",
    }}
  >
    <Box
      component="img"
      src={EmptyTableImage}
      alt="No files available"
      sx={{
        width: 250,
        height: 176,
        opacity: 0.7,
        mb: 4,
      }}
    />
    <Typography variant="body2" color="text.secondary" sx={{ margin: 0 }}>
      There are currently no pieces of evidence or other documents uploaded.
    </Typography>
  </Stack>
);

const FileTable: React.FC<FileTableProps> = ({ cols, files }) => {
  const [sortField, setSortField] = useState<keyof FileData | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: keyof FileData) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortField(field);
  };

  const sortedFiles = useMemo(() => {
    if (!sortField) return files;
    return [...files].sort((a, b) => {
      const aValue = a[sortField] ?? "";
      const bValue = b[sortField] ?? "";

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [files, sortField, sortDirection]);

  const sortedCols = useMemo(
    () =>
      cols.map((col) => {
        const colKey = col.name.toLowerCase();
        const isSortable = ["upload date", "uploader"].includes(col.name);

        return isSortable
          ? {
              ...col,
              name: (
                <Stack
                  direction="row"
                  alignItems="center"
                  onClick={() => handleSort(colKey as keyof FileData)}
                  sx={{ cursor: "pointer" }}
                >
                  {col.name}
                  <Box
                    component="img"
                    src={
                      sortField === colKey && sortDirection === "asc"
                        ? AscendingIcon
                        : DescendingIcon
                    }
                    alt="Sort"
                    sx={{ width: 16, height: 16, ml: 0.5 }}
                  />
                </Stack>
              ),
            }
          : col;
      }),
    [cols, sortField, sortDirection]
  );

  const rows = useMemo(
    () =>
      sortedFiles.map((file) => ({
        id: file.id,
        file: file.fileName,
        uploadDate: file.uploadDate,
        uploader: file.uploader,
      })),
    [sortedFiles]
  );

  return files.length === 0 ? (
    <EmptyState />
  ) : (
    <FileBasicTable
      data={{ cols: sortedCols, rows }}
      bodyData={sortedFiles}
      paginated={files.length > 0}
      table="fileManager"
    />
  );
};

export default FileTable;
