import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  IconButton,
  Button,
  LinearProgress,
  Box,
  List,
  ListItem,
  ListItemText,
  useTheme,
} from "@mui/material";
import { Upload as UploadIcon, X as CloseIcon, Trash2 as DeleteIcon } from "lucide-react";
import { uploadFileToManager } from "../../../../application/repository/file.repository";
import { SUPPORTED_FILE_TYPES_STRING, MAX_FILE_SIZE_MB, validateFile } from "../../../../application/constants/fileManager";
import { formatBytes } from "../../../../application/tools/fileUtil";

interface FileManagerUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface UploadedFileInfo {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

const FileManagerUploadModal: React.FC<FileManagerUploadModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();
  const [fileList, setFileList] = useState<UploadedFileInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addFiles(Array.from(files));
    }
  };

  const addFiles = (files: File[]) => {
    // Validate each file and create entries with appropriate status (DRY: using shared validateFile)
    const newFiles = files.map((file) => {
      const validation = validateFile(file);

      if (!validation.valid) {
        // File failed validation - mark as error with validation message
        return {
          file,
          status: "error" as const,
          progress: 0,
          error: validation.error,
        };
      }

      // File passed validation - mark as pending for upload
      return {
        file,
        status: "pending" as const,
        progress: 0,
      };
    });

    setFileList((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFileList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    // Only upload files with "pending" status (i.e., valid files)
    const validFilesCount = fileList.filter((f) => f.status === "pending").length;
    if (validFilesCount === 0) return;

    setIsUploading(true);
    let successCount = 0;

    for (let i = 0; i < fileList.length; i++) {
      // Skip files that failed client-side validation or already uploaded
      if (fileList[i].status !== "pending") continue;

      try {
        // Update status to uploading
        setFileList((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: "uploading" as const, progress: 50 } : item
          )
        );

        // Upload the file and validate response
        const response = await uploadFileToManager({ file: fileList[i].file });

        // Validate server response structure
        // Backend returns: { message: "Created", data: { id, filename, ... } }
        if (!response || !response.data) {
          throw new Error("Server failed to store the file. Please try again.");
        }

        // Verify the uploaded file has an ID (successfully stored in database)
        if (!response.data.id) {
          throw new Error("File uploaded but not stored properly. Please contact support.");
        }

        // Update status to success
        setFileList((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: "success" as const, progress: 100 } : item
          )
        );

        successCount++;

        // Trigger immediate refresh after each successful upload
        if (onSuccess) {
          onSuccess();
        }
      } catch (error: any) {
        // Extract user-friendly error message
        // Check HTTP status codes first (most specific), then fallback to generic message
        let errorMessage = "Upload failed";

        if (error?.statusCode === 413) {
          errorMessage = `File too large (max ${MAX_FILE_SIZE_MB}MB)`;
        } else if (error?.statusCode === 415) {
          errorMessage = "Unsupported file type";
        } else if (error?.statusCode === 403) {
          errorMessage = "Permission denied";
        } else if (error?.statusCode === 500) {
          errorMessage = "Server error. Please try again.";
        } else if (error?.message) {
          errorMessage = error.message;
        }

        // Update status to error
        setFileList((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: "error" as const,
                  progress: 0,
                  error: errorMessage,
                }
              : item
          )
        );
      }
    }

    setIsUploading(false);

    // Remove successfully uploaded files after a short delay
    setTimeout(() => {
      setFileList((prev) => {
        const filtered = prev.filter((item) => item.status !== "success");

        // If no files remain (all were successful), close the modal
        if (filtered.length === 0 && successCount > 0) {
          setTimeout(() => handleClose(), 300);
        }

        return filtered;
      });
    }, 500); // Show a success state for 500 ms before removing
  };

  const handleClose = () => {
    if (!isUploading) {
      setFileList([]);
      onClose();
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      addFiles(Array.from(files));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return theme.palette.success.main;
      case "error":
        return theme.palette.error.main;
      case "uploading":
        return theme.palette.info.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  // Check if there are any valid files to upload
  const hasValidFiles = fileList.some((f) => f.status === "pending");

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            Upload Files
          </Typography>
          <IconButton onClick={handleClose} disabled={isUploading} size="small">
            <CloseIcon size={20} />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          {/* Drag and Drop Area */}
          <Box
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            sx={{
              border: `2px dashed ${isDragging ? theme.palette.primary.main : theme.palette.grey[300]}`,
              borderRadius: "8px",
              padding: "32px",
              textAlign: "center",
              backgroundColor: isDragging ? theme.palette.primary.light : theme.palette.grey[50],
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onClick={handleBrowseClick}
          >
            <Stack spacing={2} alignItems="center">
              <UploadIcon size={48} color={isDragging ? theme.palette.primary.main : theme.palette.text.disabled} />
              <Typography variant="body1" fontWeight={500}>
                Drag and drop files here
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or click to browse
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supports: {SUPPORTED_FILE_TYPES_STRING}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Maximum file size: {MAX_FILE_SIZE_MB}MB
              </Typography>
            </Stack>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
          </Box>

          {/* File List */}
          {fileList.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>
                Selected Files ({fileList.length})
              </Typography>
              <List sx={{ maxHeight: "300px", overflow: "auto" }}>
                {fileList.map((item, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      border: `1px solid ${theme.palette.grey[300]}`,
                      borderRadius: "4px",
                      mb: 1,
                      backgroundColor: theme.palette.grey[50],
                    }}
                    secondaryAction={
                      item.status !== "uploading" && (
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveFile(index)}
                          disabled={isUploading}
                          size="small"
                        >
                          <DeleteIcon size={16} />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={500}>
                          {item.file.name}
                        </Typography>
                      }
                      secondary={
                        <Stack spacing={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            {formatBytes(item.file.size)}
                          </Typography>
                          {item.status === "uploading" && (
                            <LinearProgress variant="indeterminate" sx={{ mt: 0.5 }} />
                          )}
                          {item.status === "success" && (
                            <Typography variant="caption" sx={{ color: theme.palette.success.main }}>
                              Uploaded successfully
                            </Typography>
                          )}
                          {item.status === "error" && (
                            <Typography variant="caption" sx={{ color: theme.palette.error.main }}>
                              {item.error || "Upload failed"}
                            </Typography>
                          )}
                        </Stack>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: getStatusColor(item.status),
                        ml: 1,
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!hasValidFiles || isUploading}
              sx={{
                backgroundColor: theme.palette.primary.main,
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default FileManagerUploadModal;
