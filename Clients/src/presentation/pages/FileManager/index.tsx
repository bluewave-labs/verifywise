import React, { useState, MouseEvent } from "react";
import BasicTable from "../../components/Table";
import { Box, Typography, IconButton, Menu, MenuItem } from "@mui/material";
import SettingsIcon from "../../assets/icons/setting.svg";
import EmptyTableImage from "../../assets/imgs/empty-state.svg";
import UploadIcon from "../../assets/icons/upload-icon.svg";

interface File {
  name: string;
  type: string;
  uploadDate: string;
  uploader: string;
}

const FileManager: React.FC = (): JSX.Element => {
  const [files, setFiles] = useState<File[]>([
    //filler data just to see populated table
    {
      name: "AI Model Overview",
      type: "Evidence",
      uploadDate: "May 22, 2024",
      uploader: "Mert Can Boyar",
    },
    {
      name: "Fairness Evidence",
      type: "Evidence",
      uploadDate: "July 15, 2024",
      uploader: "Neeraj Sunil",
    },
    {
      name: "No Bias Evidence",
      type: "Evidence",
      uploadDate: "July 1, 2024",
      uploader: "You",
    },
  ]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const cols = [
    { id: 1, name: "File" },
    { id: 2, name: "Type" },
    {
      id: 3,
      name: (
        <Box display="flex" alignItems="center">
          Upload Date
          <Box
            component="img"
            src={UploadIcon}
            alt="sort"
            sx={{ width: 16, height: 16, ml: 0.5, opacity: 0.6 }}
          />
        </Box>
      ),
    },
    {
      id: 4,
      name: (
        <Box display="flex" alignItems="center">
          Uploader
          <Box
            component="img"
            src={UploadIcon}
            alt="sort"
            sx={{ width: 16, height: 16, ml: 0.5, opacity: 0.6 }}
          />
        </Box>
      ),
    },
    { id: 5, name: "Action" },
  ];

  const rows = files.map((file, index) => ({
    id: index,
    data: [
      { id: 1, data: file.name },
      { id: 2, data: file.type },
      { id: 3, data: file.uploadDate },
      { id: 4, data: file.uploader },
      {
        id: 5,
        data: (
          <IconButton onClick={(event) => handleActionsClick(event, file)}>
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
  }));

  const handleActionsClick = (event: MouseEvent<HTMLElement>, file: File) => {
    setAnchorEl(event.currentTarget);
    setSelectedFile(file);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFile(null);
  };

  const handleDownload = () => {
    console.log(`Downloading ${selectedFile?.name}`);
    handleMenuClose();
  };

  const handleRemove = () => {
    setFiles(files.filter((f) => f !== selectedFile));
    handleMenuClose();
  };

  return (
    <Box position="relative">
      <BasicTable
        data={{ cols, rows }}
        paginated={files.length > 0}
        table="fileManager"
      />

      {files.length === 0 && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          sx={{
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            width: "100%",
            pointerEvents: "none",
          }}
        >
          <Box
            component="img"
            src={EmptyTableImage}
            alt="No files available"
            sx={{ width: 150, height: 150, opacity: 0.7 }}
          />
          <Typography variant="body1" color="text.secondary" mt={2}>
            There are currently no evidences or documents uploaded
          </Typography>
        </Box>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDownload}>Download</MenuItem>
        <MenuItem onClick={handleRemove}>Remove</MenuItem>
      </Menu>
    </Box>
  );
};

export default FileManager;
