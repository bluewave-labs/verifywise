import React, { useState, useEffect, useMemo } from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { Container, DragDropArea, Icon } from "./FileUpload.styles";
import DeleteIcon from "@mui/icons-material/Delete";
import { createUppyInstance } from "./uppyConfig";
import { DragDrop } from "@uppy/react";
import StatusBar from "@uppy/status-bar";
import "@uppy/status-bar/dist/style.css";
import UploadSmallIcon from "../../assets/icons/folder-upload.svg";
import { FileUploadProps } from "./types";
import { useDispatch } from "react-redux";
import {
  addFile,
  removeFile as removeFileFromRedux,
} from "../../../application/redux/slices/fileSlice";

const FileUploadComponent: React.FC<FileUploadProps> = ({
  open,
  onSuccess,
  onError,
  onStart,
  onClose,
  allowedFileTypes = ["application/pdf"],
  onHeightChange,
  assessmentId,
}) => {
  if (!open) {
    return null;
  }
  const dispatch = useDispatch();

  // Local state to display uploaded files
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [errorNoFiles, setErrorNoFiles] = useState<string | null>(null);

  // State to control popup visibility
  const [openPopup, setOpenPopup] = useState(false);

  // Initialize Uppy
  const uppy = useMemo(() => createUppyInstance(assessmentId), [assessmentId]);

  const locale = useMemo(
    () => ({
      strings: {
        dropHereOr: "Click to upload or drag and drop",
      },
      pluralize: (count: number) => count,
    }),
    []
  );

  // File upload logic
  const handleFileAdded = (file: any) => {
    console.log("File added:", file);

    if (!file || !file.data || !(file.data instanceof Blob)) {
      setErrorNoFiles(errorNoFiles);
      console.error(`Invalid file data for ${file.name}`);
      onError?.("invalid file data");
      return;
    }

    if (!allowedFileTypes.includes(file.type)) {
      console.error(`invalid file type: ${file.type}`);
      onError?.("Invalid file type.");

      return;
    }

    const fileSizeInMB = file.size
      ? (file.size / (1024 * 1024)).toFixed(2)
      : "0.00";

    // Prevent duplicate files
    setUploadedFiles((prevFiles) => {
      const fileExists = prevFiles.some((f) => f.id === file.id);
      if (fileExists) {
        console.warn(`File ${file.name} already exists.`);
        return prevFiles;
      }
      return [
        ...prevFiles,
        {
          id: file.id,
          name: file.name,
          size: `${fileSizeInMB} MB`,
          data: file.data,
        },
      ];
    });
    onStart?.();
  };

  const handleUploadSuccess = (file: any) => {
    console.log("upload success:", file);
    onSuccess?.(file);
    onClose?.();

    // Update Redux state
    dispatch(
      addFile({
        id: file.id,
        name: file.name,
        type: file.type,
        uploadDate: new Date().toISOString(),
        uploader: "placeholder user",
      })
    );

    // Close the popup after successful upload
    setOpenPopup(false);
  };

  const handleUploadError = (error: any, file: any) => {
    console.log("upload error", { error, file });
    onError?.("upload failed");
  };
  const handleUploadComplete = (result: any) => {
    console.log("all uploads complete", result);
  };

  //file removal logic
  const handleRemoveFile = (fileId: string) => {
    uppy.removeFile(fileId);
    setUploadedFiles((prevFiles) =>
      prevFiles.filter((file) => file.id !== fileId)
    );
    dispatch(removeFileFromRedux(fileId));
  };

  // Dynamically adjust based on uploaded files
  useEffect(() => {
    if (onHeightChange) {
      const baseHeight = 338;
      const fileHeightIncrement = 50;
      const maxHeight = 600;

      const newHeight = Math.min(
        baseHeight + uploadedFiles.length * fileHeightIncrement,
        maxHeight
      );

      onHeightChange?.(newHeight);
    }
  }, [uploadedFiles.length, onHeightChange]);

  useEffect(() => {
    console.log("status bar started");
    uppy.use(StatusBar, {
      target: "#status-bar",
      hideUploadButton: true,
      hideAfterFinish: false,
      hideRetryButton: true,
      hidePauseResumeButton: true,
      hideCancelButton: true,
    });

    uppy.on("file-added", handleFileAdded);
    uppy.on("upload-success", handleUploadSuccess);
    uppy.on("upload-error", handleUploadError);
    uppy.on("complete", handleUploadComplete);

    return () => {
      uppy.off("file-added", handleFileAdded);
      uppy.off("upload-success", handleUploadSuccess);
      uppy.off("upload-error", handleUploadError);
      uppy.off("complete", handleUploadComplete);
      uppy.cancelAll();
      console.log("uppy cleanup");
    };
  }, [uppy]);

  const handleUploadClick = () => {
    console.log("upload clicked");
    if (uploadedFiles.length === 0) {
      setOpenPopup(true); // Open popup if no file is selected
      return;
    }
    uppy.upload();

    if (onClose) {
      onClose();
    }
  };

  return (
    <Stack
      className="file-upload-overlay"
      sx={{
        width: "100%",
        maxWidth: "100%",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,

        backdropFilter: "blur(8px)", // Glass effect
        background: "rgba(0, 0, 0, 0.5)", // Slightly dark and blue with opacity
      }}
      onClick={onClose}
    >
      <Container
        className="file-upload-container"
        sx={{
          width: "fit-content",
          height: "fit-content",
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          backgroundColor: "white",
          padding: "20px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          borderRadius: "8px",
        }}
      >
        <Stack
          className="file-upload-stack"
          spacing={3}
          sx={{
            width: "fit-content",
            mt: 0,
            pt: 0,
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, fontSize: "16px", pb: 2 }}
          >
            Upload a new file
          </Typography>

          <DragDropArea uploadedFilesCount={uploadedFiles.length}>
            <Icon src={UploadSmallIcon} alt="Upload Icon" sx={{ mb: 2 }} />
            <DragDrop uppy={uppy} locale={locale} />

            <input
              type="file"
              hidden
              id="fileInput"
              onChange={(e) => {
                if (e.target.files) {
                  Array.from(e.target.files).forEach((file) => {
                    try {
                      uppy.addFile({
                        name: file.name,
                        type: file.type,
                        data: file,
                      });
                    } catch (err) {
                      console.error("Error adding file:", err);
                    }
                  });
                }
              }}
            />

            <label
              htmlFor="fileInput"
              style={{ cursor: "pointer", textAlign: "center" }}
            >
              <Typography variant="body2">
                <span style={{ color: "#3b82f6" }}>Click to upload</span> or
                drag and drop
              </Typography>
            </label>

            {/* status bar */}
            <Stack sx={{ marginTop: 2, marginBottom: 1 }}>
              <div
                id="status-bar"
                style={{ marginTop: "8px", marginBottom: "0", padding: "4px" }}
              ></div>
            </Stack>

            {uploadedFiles.length > 0 && (
              <Stack
                sx={{
                  mt: 2,
                  borderTop: "1px solid #e5e7eb",
                  width: "100%",
                  padding: "8px",
                  maxHeight: "300px",
                  overflowY: "auto",
                  boxSizing: "border-box",
                }}
              >
                <List>
                  {uploadedFiles.map((file, index) => (
                    <ListItem
                      key={file.id || index}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0",
                      }}
                    >
                      <ListItemText
                        primary={file.name}
                        secondary={`Size: ${file.size}`}
                        sx={{
                          fontSize: "12px",
                          wordBreak: "break-word",
                          maxWidth: "100%",
                        }}
                      />

                      <IconButton
                        onClick={() => handleRemoveFile(file.id)}
                        edge="end"
                        size="small"
                        sx={{ padding: "4px" }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              </Stack>
            )}
          </DragDropArea>

          <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ fontSize: "12px" }}>
              Supported formats: PDF
            </Typography>

            <Button
              variant="contained"
              sx={{ marginTop: "8px", width: "100px", height: "34px" }}
              onClick={handleUploadClick}
            >
              Upload
            </Button>
          </Stack>

          {/* Popup when no file is selected */}
          <Dialog open={openPopup} onClose={() => setOpenPopup(false)}>
            <DialogTitle>No file selected</DialogTitle>
            <DialogContent>
              <Typography variant="body2">No file is selected yet.</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenPopup(false)} color="primary">
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Stack>
      </Container>
    </Stack>
  );
};

export default FileUploadComponent;
