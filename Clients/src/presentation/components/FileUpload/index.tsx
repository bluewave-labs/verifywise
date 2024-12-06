import React, { useState } from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
} from "@mui/material";
import { Container, DragDropArea, Icon } from "./FileUpload.styles";
import DeleteIcon from "@mui/icons-material/Delete";
import { createUppyInstance } from "./uppyConfig";
import {
  handleUploadSuccess,
  handleUploadError,
  handleUploadProgress,
  uploadToLocalStorage,
} from "./eventHandlers";
import { DragDrop } from "@uppy/react";
import UploadSmallIcon from "../../assets/icons/file-upload.svg";
import { FileUploadProps } from "./types";

const FileUploadComponent: React.FC<FileUploadProps> = ({
  onSuccess,
  onError,
  onProgress,
}) => {
  //local state to display uploaded files in uppy dashboard
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  // Configure Uppy instance
  const uppy = React.useMemo(() => createUppyInstance(), []); // Attach event handlers

  const locale = React.useMemo(
    () => ({
      strings: {
        dropHereOr: "Click to upload or drag and drop",
      },
      pluralize: (count: number) => count,
    }),
    []
  );

  React.useEffect(() => {
    //debug
    console.log("uppy instance created");
    uppy.on("file-added", (file) => {
      //debug
      console.log("file added:", file);
      if (!file) {
        console.error("file is undefined in file added event");
        return;
      }

      setUploadedFiles((prevFiles) => [
        ...prevFiles,
        {
          id: file.id,
          name: file.name,
          size: file.size
            ? `${(file.size / 1024).toFixed(2)} MB`
            : "unknown size",
          status: "Queued",
        },
      ]);
    });

    // Handle upload-success using the event handler
    uppy.on("upload-success", (file, response) => {
      if (!file) {
        console.error("file is undefined in upload success event");
        return;
      }
      console.log("Upload Success:", { file, response });
      handleUploadSuccess(onSuccess)(file, response);

      setUploadedFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === file.id ? { ...f, status: "Uploaded" } : f
        )
      );
    }); // Handle upload-error using the event handler

    uppy.on("upload-error", handleUploadError(onError)); // Handle upload-progress using the event handler

    uppy.on("upload-progress", handleUploadProgress(onProgress));

    uppy.on("file-removed", (file) => {
      console.log("file removed:", file);
      setUploadedFiles((prevFiles) =>
        prevFiles.filter((f) => f.id !== file.id)
      );
    });
    return () => {
      uppy.cancelAll();
    };
  }, [uppy, onSuccess, onError, onProgress]);

  const handleSaveToLocalStorage = () => {
    uploadToLocalStorage(uppy);
  };
  return (
    <Container>
      {/* Title */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          fontSize: "16px",
          color: "#374151",
          paddingBottom: "10px",
        }}
      >
        Upload a new file
      </Typography>
      {/* Drag-and-Drop Area */}
      <DragDropArea>
        <Icon
          src={UploadSmallIcon}
          alt="Upload Icon"
          sx={{ marginBottom: "6px" }}
        />
        <input
          type="file"
          id="fileInput"
          hidden
          onChange={(e) => {
            if (e.target.files) {
              Array.from(e.target.files).forEach((file) => {
                try {
                  const existingFile = uppy.getFiles().find((f)=> f.name === file.name);
                  if (existingFile) {
                    console.warn(`file ${file.name} already exists in Uppy`);
                    return;
                  }
                  uppy.addFile({
                    name: file.name,
                    type: file.type,
                    data: file,
                  });
                } catch (error) {
                  console.error("error uploading file:", error);
                }
              });
            }
          }}
        />
        <label htmlFor="fileInput" style={{cursor:"pointer", textAlign:"center"}}>
          <Typography variant="body2" sx={{fontSize:"13px", color:"#6b7280"}}>
            <span style={{
              color:"#3b82f6",
              cursor:"pointer",
            }}>
              Click to upload
            </span> {" "}
            or drag and drop 
          </Typography>
        </label>

        {/* max size */}
        <Typography
        variant="body2"
        sx={{fontSize:"12px",
          color:"#6b7280",
          textAlign:"center",
        }}
        >
          Maximum size: 50 MB
        </Typography>
        <DragDrop uppy={uppy} locale={locale} />

        {/* Uploaded Files List */}
       
        {uploadedFiles.length > 0 ? (
          <List
           sx={{
            width:"100%",
            maxHeight:"150px",
            overflowY:"auto",
            padding:0,
            marginTop:"16px",
            borderTop:"1px solid #e5e7eb",
            paddingTop:"8px"
           }}
          >
            {uploadedFiles.map((file) => (
              <ListItem
                key={file.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                }}
              >
                <ListItemText
                  primary={file.name}
                  secondary={`Size: ${file.size}`}
                  sx={{
                    "& .MuiListItemText-primary": { fontSize: "13px" },
                    "& .MuiListItemText-secondary": {
                      fontSize: "12px",
                      color: "#6B7280",
                    },
                  }}
                />
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => {
                    uppy.removeFile(file.id);
                    setUploadedFiles((prevFiles)=>prevFiles.filter((f)=> f.id !== file.id))
                   }} 
                >
                  <DeleteIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="caption" sx={{ color: "#6B7280" }}>
            No files uploaded yet.
          </Typography>
        )}
        {/* Supported Formats */}
      </DragDropArea>

      <Typography
        variant="caption"
        sx={{ fontSize: "12px", color: "#6B7280", mt: 2 }}
      >
        Supported formats: PDF
      </Typography>
      <Button
        variant="contained"
        sx={{
          mt: 2,
          width: "180px",
          backgroundColor: "#3B82F6",
          textTransform: "none",
        }}
        onClick={handleSaveToLocalStorage}
      >
        Upload
      </Button>
    </Container>
  );
};

export default FileUploadComponent;
