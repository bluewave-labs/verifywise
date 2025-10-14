import React, { useState, useMemo } from "react";
import FileBasicTable from "../FilesBasicTable/FileBasicTable";
import { Stack } from "@mui/material";
import { ArrowUp as AscendingIcon, ArrowDown as DescendingIcon } from "lucide-react";
import EmptyState from "../../EmptyState";
import { FileData } from "../../../../domain/types/File";

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
                  {sortField === colKey && sortDirection === "asc" ? (
                    <AscendingIcon size={16} style={{ marginLeft: 4 }} />
                  ) : (
                    <DescendingIcon size={16} style={{ marginLeft: 4 }} />
                  )}
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
    <EmptyState
      message="There are currently no pieces of evidence or other documents uploaded."
      imageAlt="No files available"
    />
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
