import React, { useState, useMemo } from "react";
import VWBasicTable from "../../../components/Table";
import { Stack, Box } from "@mui/material";
import AscendingIcon from "../../../../assets/icons/ascending.svg";
import DescendingIcon from "../../../../assets/icons/descending.svg";
import { File } from "../../../../domain/File";

type SortDirection = "asc" | "desc" | null;

/**
 * Represents the props of the FileTable component.
 * @typedef {Object} FileTableProps
 * @property {Array} cols - The columns of the table.
 * @property {Array} rows - The rows of the table.   
 * @property {Array<File>} files - The list of files.
 * @property {Function} handleSort - Callback to handle sorting.
 * @property {keyof File|null} sortField - The field currently sorted by.
 * @property {SortDirection|null} sortDirection - The current sort direction.
 * @property {Function} onRowClick - Callback to handle row selection.    
 */ 
interface FileTableProps {
  cols: any[];
  rows: any[];
  files: File[];
  onRowClick: (fileId: string) => void;
}

const FileTable: React.FC<FileTableProps> = ({ cols, files, onRowClick }) => {
  const [sortField, setSortField] = useState<keyof File | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: keyof File) => {
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
                  onClick={() => handleSort(colKey as keyof File)}
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
        file: file.name,
        uploadDate: file.uploadDate,
        uploader: file.uploader,
      })),
    [sortedFiles]
  );

  return (
    <VWBasicTable
      data={{ cols: sortedCols, rows }}
      paginated={files.length > 0}
      table="fileManager"
      setSelectedRow={(row) => onRowClick(row.id)}
      setAnchorEl={() => {}}
    />
  );
};

export default FileTable;