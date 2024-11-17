import React, { useState, MouseEvent } from "react";
import BasicTable from "../../components/Table";
import { Box, Typography, IconButton, Menu, MenuItem} from "@mui/material";
import SettingsIcon from "../../assets/icons/setting.svg";
import EmptyTableImage from "../../assets/imgs/empty-state.svg";
import AscendingIcon from '../../assets/icons/up-arrow.svg';
import DescendingIcon from '../../assets/icons/down-arrow.svg';

interface File {
  id:string;
  name: string;
  type: string;
  uploadDate: string;
  uploader: string;
}

const FileManager: React.FC = (): JSX.Element => {
  const [files, setFiles] = useState<File[]>([
    // //filler data just to see populated table
    // {
    //   name: "AI Model Overview",
    //   type: "Evidence",
    //   uploadDate: "May 22, 2024",
    //   uploader: "Mert Can Boyar",
    // },
    // {
    //   name: "Fairness Evidence",
    //   type: "Evidence",
    //   uploadDate: "July 15, 2024",
    //   uploader: "Neeraj Sunil",
    // },
    // {
    //   name: "No Bias Evidence",
    //   type: "Evidence",
    //   uploadDate: "July 1, 2024",
    //   uploader: "You",
    // },
  ]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sortField, setSortField] = useState<keyof File | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null
  );

  //sorting functionality 
  const handleSort = (field: keyof File) => {
    const isAsc = sortField === field && sortDirection === "asc";
    const newDirection = isAsc ? "desc" : "asc";

    setSortDirection(newDirection);
    setSortField(field);

    setFiles(
      [...files].sort((a, b) => {
        if (newDirection === "asc") {
          return a[field] < b[field] ? -1 : 1;
        }
        return a[field] > b[field] ? -1 : 1;
      })
    );
  };

  const cols = [
    ,
    { id: 1, name: "File" },
    { id: 2, name: "Type" },
    {
      id: 3,
      name: (
        <Box
          display="flex"
          alignItems="center"
          onClick={() => handleSort("uploadDate")}
          sx={{ cursor: "pointer" }}
        >
          Upload Date
          <Box
            component="img"
            src={
              sortDirection === "asc" && sortField === "uploadDate"
                ? AscendingIcon
                : DescendingIcon
            }
            alt="Sort"
            sx={{ width: 16, height: 16, ml: 0.5 }}
          />
        </Box>
      ),
    },
    {
      id: 4,
      name: (
        <Box
          display="flex"
          alignItems="center"
          onClick={() => handleSort("uploader")}
          sx={{ cursor: "pointer" }}
        >
          Uploader
          <Box
            component="img"
            src={
              sortDirection === "asc" && sortField === "uploader"
                ? AscendingIcon
                : DescendingIcon
            }
            alt="Sort"
            sx={{ width: 16, height: 16, ml: 0.5 }}
          />
        </Box>
      ),
    },
    { id: 5, name: "Action" },
  ];

  const rows = files.map((file) => ({
    id: file.name,
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
    <Box sx={{ padding: 4, marginBottom: 10 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Evidences & documents
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={10}>
        This table lists all the files uploaded to the system.
      </Typography>

      <Box
        sx={{
          position: "relative",
          border: "1px solid #e0e0e0",
          borderRadius: "4px",
          overflow: "hidden",
          minHeight: "400px",
        }}
      >
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
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <Box
              component="img"
              src={EmptyTableImage}
              alt="No files available"
              sx={{ width: 250, height: 250, opacity: 0.7, mb: 6 }}
            />
            <Typography variant="body1" color="text.secondary" mt={2}>
              There are currently no evidences or documents uploaded
            </Typography>
          </Box>
        )}
      </Box>

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