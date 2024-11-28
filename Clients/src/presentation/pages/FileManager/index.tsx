import React, { useState, MouseEvent, useMemo, useCallback } from "react";
import {
  Stack,
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import BasicTable from "../../components/Table";

import SettingsIcon from "../../assets/icons/setting.svg";
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
  TYPE: "Type",
  UPLOAD_DATE: "Upload Date",
  UPLOADER: "Uploader",
  ACTION: "Action",
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
const EmptyState: React.FC = () => (
  <Stack
    direction="column"
    alignItems="center"
    justifyContent="center"
    sx={{ height: "100%", textAlign: "center" }}
    border="1px solid #eeeeee"
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
      There are currently no evidences or documents uploaded.
    </Typography>
  </Stack>
);

/**
 * Displays a menu with actions for a file.
 * @param {Object} props - The component props.
 * @param {HTMLElement|null} props.anchorEl - The element to which the menu is anchored.
 * @param {Function} props.onClose - Callback to close the menu.
 * @param {Function} props.onDownload - Callback to download the file.
 * @param {Function} props.onRemove - Callback to remove the file.
 * @returns {JSX.Element} The file actions menu component.
 */
const FileActions: React.FC<{
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onDownload: () => void;
  onRemove: () => void;
}> = ({ anchorEl, onClose, onDownload, onRemove }) => (
  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
    <MenuItem onClick={onDownload} aria-label="Download File">
      Download
    </MenuItem>
    <MenuItem onClick={onRemove} aria-label="Remove File">
      Remove
    </MenuItem>
  </Menu>
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
          { id: 2, data: file.type },
          { id: 3, data: file.uploadDate },
          { id: 4, data: file.uploader },
          {
            id: 5,
            data: (
              <IconButton
                onClick={(event) => handleActionsClick(event, file)}
                aria-label="File Actions"
              >
                <Box
                  component="img"
                  src={SettingsIcon}
                  alt="Settings"
                  sx={{ width: 24, height: 24 }}
                />
              </IconButton>
            ),
          },
        ],
      })),
    [files]
  );

  /**
   * Handles the click event for file actions.
   * @param {MouseEvent<HTMLElement>} event - The click event.
   * @param {File} file - The file for which actions are being handled.
   */
  const handleActionsClick = useCallback(
    (event: MouseEvent<HTMLElement>, file: File) => {
      setAnchorEl(event.currentTarget);
      setSelectedFile(file);
    },
    []
  );

  /**
   * Closes the action menu.
   */
  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedFile(null);
  }, []);

  /**
   * Handles the download action for a file.
   */
  const handleDownload = useCallback(() => {
    console.log(`Downloading ${selectedFile?.name}`);
    handleMenuClose();
  }, [selectedFile, handleMenuClose]);

  /**
   * Handles the removal of a file.
   */
  const handleRemove = useCallback(() => {
    if (selectedFile) {
      setFiles(files.filter((file) => file.id !== selectedFile.id));
    }
    handleMenuClose();
  }, [files, selectedFile, handleMenuClose]);

  const cols = [
    { id: 1, name: COLUMN_NAMES.FILE },
    { id: 2, name: COLUMN_NAMES.TYPE },
    { id: 3, name: COLUMN_NAMES.UPLOAD_DATE },
    { id: 4, name: COLUMN_NAMES.UPLOADER },
    { id: 5, name: COLUMN_NAMES.ACTION },
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

      <FileActions
        anchorEl={anchorEl}
        onClose={handleMenuClose}
        onDownload={handleDownload}
        onRemove={handleRemove}
      />
    </Stack>
  );
};

export default FileManager;
