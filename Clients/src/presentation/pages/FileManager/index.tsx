import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Button,
  Paper,
  TableContainer,
} from "@mui/material";
import { ReactComponent as EmptyStateImage } from "../../assets/imgs/empty-state.svg";
import { ReactComponent as FileActionIcon } from "../../assets/icons/setting.svg";

interface File {
  name: string;
  type: string;
  uploadDate: string;
  uploader: string;
}

const FileManager: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(
    null
  );

  const handleMenuClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    index: number
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedFileIndex(index);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFileIndex(null);
  };

  //adding and deleting files
  const handleDeleteFile = () => {
    if (selectedFileIndex !== null) {
      const updatedFiles = files.filter(
        (_, index) => index !== selectedFileIndex
      );
      setFiles(updatedFiles);
    }
    handleMenuClose();
  };

  const handleAddFile = () => {
    const newFile: File = {
      name: "new document",
      type: "document",
      uploadDate: new Date().toLocaleDateString(),
      uploader: "you",
    };
    setFiles([...files, newFile]);
  };

  //empty dashboard
  const renderEmptyState = () => (
    <Box display="flex" flexDirection="column" alignItems="center" paddingY={5}>
      <EmptyStateImage
        style={{ opacity: 0.6, maxWidth: "200px", alignItems: "center" }}
      />
      <Typography
        variant="body2"
        align="center"
        color="textSecondary"
        style={{ padding: "30px" }}
      >
        There are currently no evidences or documents
      </Typography>
    </Box>
  );

  return (
    <Box padding={2}>
      <Box marginBottom={2} display="flex" justifyContent="flex-end">
        <Button variant="contained" color="primary" onClick={handleAddFile}>
          Add new file
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>File</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Upload Date</TableCell>
              <TableCell>Uploader</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {renderEmptyState()}
                </TableCell>
              </TableRow>
            ) : (
              files.map((file, index) => (
              <TableRow key={index}>
                <TableCell>{file.name}</TableCell>
                <TableCell>{file.type}</TableCell>
                <TableCell>{file.uploadDate}</TableCell>
                <TableCell>{file.uploader}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={(event) => handleMenuClick(event, index)}>
                    <FileActionIcon />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}>
                    <MenuItem onClick={handleMenuClose}>Download</MenuItem>
                    <MenuItem onClick={handleDeleteFile}>Remove</MenuItem>
                  </Menu>
                </TableCell>
              </TableRow>
            ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
export default FileManager;
