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

// File interface for type safety
interface File {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  uploader: string;
}

/**
 * Component for displaying an empty state w no files
 */
const EmptyState: React.FC = () => (
  <Stack
    direction="column"
    alignItems="center"
    justifyContent="center"
    sx={{ height: "100%", textAlign: "center" }}
  >
    <Box
      component="img"
      src={EmptyTableImage}
      alt="No files available"
      sx={{ width: 250, height: 250, opacity: 0.7, mb: 4 }}
    />
    <Typography variant="body1" color="text.secondary">
      There are currently no evidences or documents uploaded.
    </Typography>
      
  </Stack>
);

/**
 * Component for displaying the action menu (Download/Remove)
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
 * Component for the main file table w sortable columns
 */
const FileTable: React.FC<{
  cols: any[];
  rows: any[];
  files: File[];
  handleSort: (field: keyof File) => void;
  sortField: keyof File | null;
  sortDirection: "asc" | "desc" | null;
}> = ({ cols, rows, files, handleSort, sortField, sortDirection }) => {
  // sorting logic for "Upload Date" and "Uploader"
  const sortedCols = cols.map((col) =>
    ["Upload Date", "Uploader"].includes(col.name)
      ? {
          ...col,
          name: (
            <Stack
              direction="row"
              alignItems="center"
              onClick={() => handleSort(col.name.toLowerCase() as keyof File)}
              sx={{ cursor: "pointer" }}
            >
              {col.name}
              <Box
                component="img"
                src={
                  sortField === col.name.toLowerCase() &&
                  sortDirection === "asc"
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
 * Main FileManager component for managing files, displaying a table,
 * sorting, and handling actions (Download/Remove).
 */
const FileManager: React.FC = (): JSX.Element => {
  // State management
  const [files, setFiles] = useState<File[]>([
    // {
    //   id: "1",
    //   name: "AI Model Overview",
    //   type: "Evidence",
    //   uploadDate: "May 22, 2024",
    //   uploader: "Mert Can Boyar",
    // },
    // {
    //   id: "2",
    //   name: "Fairness Evidence",
    //   type: "Evidence",
    //   uploadDate: "July 15, 2024",
    //   uploader: "Neeraj Sunil",
    // },
    // {
    //   id: "3",
    //   name: "No Bias Evidence",
    //   type: "Document",
    //   uploadDate: "July 1, 2024",
    //   uploader: "You",
    // },
  ]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sortField, setSortField] = useState<keyof File | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null
  ); // Handle sorting logic

  const handleSort = useCallback(
    (field: keyof File) => {
      const isAsc = sortField === field && sortDirection === "asc";
      const newDirection = isAsc ? "desc" : "asc";

      setSortDirection(newDirection);
      setSortField(field);

      setFiles(
        [...files].sort((a, b) => {
          if (typeof a[field] === "string" && typeof b[field] === "string") {
            return newDirection === "asc"
              ? a[field].localeCompare(b[field])
              : b[field].localeCompare(a[field]);
          }
          return newDirection === "asc"
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
  ); // Memoize rows to prevent unnecessary recalculations

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
  ); // Handle action menu logic

  const handleActionsClick = useCallback(
    (event: MouseEvent<HTMLElement>, file: File) => {
      setAnchorEl(event.currentTarget);
      setSelectedFile(file);
    },
    []
  );

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedFile(null);
  }, []);

  const handleDownload = useCallback(() => {
    console.log(`Downloading ${selectedFile?.name}`);
    handleMenuClose();
  }, [selectedFile, handleMenuClose]);

  const handleRemove = useCallback(() => {
    if (selectedFile) {
      setFiles(files.filter((file) => file.id !== selectedFile.id));
    }
    handleMenuClose();
  }, [files, selectedFile, handleMenuClose]); // Define table columns

  const cols = [
    { id: 1, name: "File" },
    { id: 2, name: "Type" },
    { id: 3, name: "Upload Date" },
    { id: 4, name: "Uploader" },
    { id: 5, name: "Action" },
  ]; // Render FileManager UI

  return (
    <Stack spacing={4} sx={{ padding: 4, marginBottom: 10 }}>
      {/* Header Section */}
      <Stack spacing={1}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Evidences & documents
        </Typography>

        <Typography variant="body2" color="text.secondary">
          This table lists all the files uploaded to the system.
        </Typography>
      </Stack>
      {/* Table Container */}

      <Box
        sx={{
          position: "relative",
          border: "1px solid #e0e0e0",
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
      {/* Action Menu */}

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
