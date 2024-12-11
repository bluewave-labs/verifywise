import React, { useState, useEffect, useMemo } from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Stack,
} from "@mui/material";
import { Container, DragDropArea, Icon} from "./FileUpload.styles";
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
  onSuccess,
  onError,
  onStart,
  allowedFileTypes = ["application/pdf"],
  maxFileSize = 5 * 1024 * 1024,
}) => {
  const dispatch = useDispatch();

  // Local state to display uploaded files
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  // Initialize Uppy
  const uppy = useMemo(() => createUppyInstance(), []);

  const locale = useMemo(
    () => ({
      strings: {
        dropHereOr: "Click to upload or drag and drop",
      },
      pluralize: (count: number) => count,
    }),
    []
  );

  //local storage
  const uploadToLocalStorage = () => {
    if (!uploadedFiles.length) {
      alert("No files to upload");
      return;
    }
    uploadedFiles.forEach((file) => {
      if (file.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result === "string") {
            localStorage.setItem(
              file.id,
              JSON.stringify({
                name: file.name,
                type: file.type,
                data: reader.result,
              })
            );
            console.log(`file ${file.name} saved to local storage`);
          } else {
            console.error(`failed to process file ${file.name}`);
          }
        };
        reader.readAsDataURL(file.data);
      } else {
        console.error(`Invalid file data for ${file.name}`);
      }
    });
  };

  // File upload logic
  const handleFileAdded = (file: any) => {
    console.log("File added:", file);

    if (!file || !file.data || !(file.data instanceof Blob)) {
      console.error(`Invalid file data for ${file.name}`);
      onError?.("invalid file data");

      return;
    }

    if (file.size > maxFileSize) {
      console.error(`File size exceeds the limit ${file.size}`);
      onError?.("File size exceeds the allowed limit.");

      return;
    }

    if (!allowedFileTypes.includes(file.type)) {
      console.error(`invalid file type: ${file.type}`);
      onError?.("Invalid file type.");

      return;
    }

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
          size: file.size
            ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
            : "Unknown size",
          data: file.data,
        },
      ];
    });
    onStart?.();
  };

  const handleUploadSuccess = (file: any) => {
    console.log("upload success:", file);

    onSuccess?.(file);

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

  useEffect(() => {
    console.log("status bar started");
    uppy.use(StatusBar, {
      target:"#status-bar",
      hideUploadButton: true,
      hideAfterFinish: false,
      hideRetryButton: true,
      hidePauseResumeButton: true,
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

  return (
    <Container>
      <Typography
        variant="h6"
        sx={{ fontWeight: 600, fontSize: "16px", pb: 2 }}
      >
        Upload a new file
      </Typography>

      <DragDropArea
        sx={{
          width: "100%",

          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "150px",
          height: uploadedFiles.length > 0 ? "auto" : "150px",
          transition: "height 0.3s ease",
        }}
      >
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
            <span style={{ color: "#3b82f6" }}>Click to upload</span> or drag
            and drop
          </Typography>
        </label>

        <Typography variant="body2" sx={{ fontSize: 12, textAlign: "center" }}>
          Maximum size: {maxFileSize / (1024 * 1024)} MB
        </Typography>

        {/* status bar */}
        <Stack sx={{marginTop:2, marginBottom:1}}>
          <div id="status-bar" style={{marginTop:'8px', marginBottom:'0',padding:'4px'}}>
           
          </div>
        </Stack>
        
        {uploadedFiles.length > 0 && (
          <Stack sx={{ mt: 2, borderTop: "1px solid #e5e7eb", pt: 2 }}>
            <List>
              {uploadedFiles.map((file, index) => (
                <ListItem key={file.id || index}>
                  <ListItemText
                    primary={file.name}
                    secondary={`Size: ${file.size}`}
                  />

                  <IconButton
                    onClick={() => handleRemoveFile(file.id)}
                    edge="end"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </Stack>
        )}
      </DragDropArea>

      <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
        <Typography variant="caption" sx={{ fontSize: 12 }}>
          Supported formats: {allowedFileTypes.join(", ")}
        </Typography>

        <Button variant="contained" onClick={() => uploadToLocalStorage()}>
          Upload
        </Button>
      </Stack>
    </Container>
  );
};

export default FileUploadComponent;
