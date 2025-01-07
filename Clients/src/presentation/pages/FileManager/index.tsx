import React, { useState, useMemo, useCallback } from "react";
import {
  Stack,
  Box,
  Typography,
} from "@mui/material";
import BasicTable from "../../components/Table";


import EmptyTableImage from "../../assets/imgs/empty-state.svg";
import AscendingIcon from "../../assets/icons/up-arrow.svg";
import DescendingIcon from "../../assets/icons/down-arrow.svg";

/**
 * Represents a file with its metadata.
 * @typedef {Object} File
 * @property {string} id - The unique identifier of the file.
 * @property {string} name - The name of the file.
 * @property {string} type - The type of the file.
 * @property {string} uploadDate - The date the file was uploaded.
 * @property {string} uploader - The uploader of the file.
 */
interface File {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  uploader: string;
}

const COLUMN_NAMES = {
  FILE: "File",
  UPLOAD_DATE: "Upload Date",
  UPLOADER: "Uploader",
};

const SORT_DIRECTIONS = {
  ASC: "asc",
  DESC: "desc",
} as const;

type SortDirection = (typeof SORT_DIRECTIONS)[keyof typeof SORT_DIRECTIONS];

/**
 * Displays an empty state when no files are available.
 * @returns {JSX.Element} The empty state component.
 */
const EmptyState: React.FC = (): JSX.Element => (
  <Stack
    direction="column"
    alignItems="center"
    justifyContent="center"
    sx={{
      height: "100%",
      textAlign: "center",
      border: "1px solid #eeeeee",
      borderBottom: "1px solid #eeeeee",
      
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
    <Typography variant="body2" color="text.secondary">
      There are currently no pieces of evidence or other documents uploaded.
    </Typography>
  </Stack>
);

/**
 * Displays a table of files with sortable columns.
 * @param {Object} props - The component props.
 * @param {Array} props.cols - The columns of the table.
 * @param {Array} props.rows - The rows of the table.
 * @param {Array<File>} props.files - The list of files.
 * @param {Function} props.handleSort - Callback to handle sorting.
 * @param {keyof File|null} props.sortField - The field currently sorted by.
 * @param {SortDirection|null} props.sortDirection - The current sort direction.
 * @returns {JSX.Element} The file table component.
 */
const FileTable: React.FC<{
  cols: any[];
  rows: any[];
  files: File[];
  handleSort: (field: keyof File) => void;
  sortField: keyof File | null;
  sortDirection: SortDirection | null;
}> = ({ cols, rows, files, handleSort, sortField, sortDirection }) => {
  const sortedCols = useMemo(
    () =>
      cols.map((col) =>
        [COLUMN_NAMES.UPLOAD_DATE, COLUMN_NAMES.UPLOADER].includes(col.name)
          ? {
              ...col,
              name: (
                <Stack
                  direction="row"
                  alignItems="center"
                  onClick={() =>
                    handleSort(col.name.toLowerCase() as keyof File)
                  }
                  sx={{ cursor: "pointer" }}
                >
                  {col.name}
                  <Box
                    component="img"
                    src={
                      sortField === col.name.toLowerCase() &&
                      sortDirection === SORT_DIRECTIONS.ASC
                        ? AscendingIcon
                        : DescendingIcon
                    }
                    alt="Sort"
                    sx={{ width: 16, height: 16, ml: 0.5 }}
                  />
                </Stack>
              ),
            }
          : col
      ),
    [cols, handleSort, sortField, sortDirection]
  );

  return (
    <BasicTable
      data={{ cols: sortedCols, rows }}
      paginated={files.length > 0}
      table="fileManager"
    />
  );
};

/**
 * Main component for managing files, displaying a table,
 * sorting, and handling actions (Download/Remove).
 * @returns {JSX.Element} The FileManager component.
 */
const FileManager: React.FC = (): JSX.Element => {
  const [files, setFiles] = useState<File[]>([]);
  const [sortField, setSortField] = useState<keyof File | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(
    null
  );

  /**
   * Handles sorting of files by a specified field.
   * @param {keyof File} field - The field to sort by.
   */
  const handleSort = useCallback(
    (field: keyof File) => {
      const isAsc =
        sortField === field && sortDirection === SORT_DIRECTIONS.ASC;
      const newDirection = isAsc ? SORT_DIRECTIONS.DESC : SORT_DIRECTIONS.ASC;

      setSortDirection(newDirection);
      setSortField(field);

      setFiles(
        [...files].sort((a, b) => {
          if (typeof a[field] === "string" && typeof b[field] === "string") {
            return newDirection === SORT_DIRECTIONS.ASC
              ? a[field].localeCompare(b[field])
              : b[field].localeCompare(a[field]);
          }
          return newDirection === SORT_DIRECTIONS.ASC
            ? a[field] < b[field]
              ? -1
              : 1
            : a[field] > b[field]
            ? -1
            : 1;
        })
      );
    },
    [files, sortField, sortDirection]
  );

  const rows = useMemo(
    () =>
      files.map((file) => ({
        id: file.id,
        data: [
          { id: 1, data: file.name },
          { id: 2, data: file.uploadDate },
          { id: 3, data: file.uploader },
        ],
      })),
    [files]
  );

  const cols = [
    { id: 1, name: COLUMN_NAMES.FILE, sx: { width: "50%" } },
    { id: 2, name: COLUMN_NAMES.UPLOAD_DATE, sx: { width: "50%" } },
    { id: 3, name: COLUMN_NAMES.UPLOADER, sx: { width: "50%" } },
  ];

  return (
    <Stack spacing={4} sx={{ padding: 4, marginBottom: 10 }}>
      <Stack spacing={1}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Evidences & documents
        </Typography>
        <Typography variant="body2" color="text.secondary">
          This table lists all the files uploaded to the system.
        </Typography>
      </Stack>

      <Box
        sx={{
          position: "relative",
          borderRadius: "4px",
          overflow: "hidden",
          minHeight: "400px",
          borderBottom:
            files.length === 0 ? "1px solid #eeeeee" : "none",
            
        }}
      >
        <FileTable
          cols={cols}
          rows={rows}
          files={files}
          handleSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
        />
        {files.length === 0 && <EmptyState />}
      </Box>
    </Stack>
  );
};

export default FileManager;
