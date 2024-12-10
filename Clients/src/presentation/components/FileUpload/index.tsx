import React, { useState } from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Stack,
} from "@mui/material";
import { Container, DragDropArea, Icon } from "./FileUpload.styles";
import DeleteIcon from "@mui/icons-material/Delete";
import { createUppyInstance } from "./uppyConfig";
import { DragDrop } from "@uppy/react";
import UploadSmallIcon from "../../assets/icons/folder-upload.svg";

import { useDispatch } from "react-redux";
import { addFile } from "../../../application/redux/slices/fileSlice";

const FileUploadComponent: React.FC = () => {
  const dispatch = useDispatch();
  //local state to display uploaded files in uppy dashboard
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  // Uppy instance
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

  //local storage
  const uploadToLocalStorage = () => {
    if (!uploadedFiles.length) {
      alert("no files to upload");
      return;
    }
    uploadedFiles.forEach((file) => {
      if (!(file.data instanceof Blob)) {
        console.error(`file data is not a Blob for file: ${file.name}`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result;
        localStorage.setItem(
          file.id,
          JSON.stringify({
            name: file.name,
            type: file.type,
            data: base64Data,
          })
        );
        console.log(`File ${file.name} saved to local storage`);
      };
      reader.onerror = (error) => {
        console.error(`error reading file: ${file.name}:`, error);
      };
      reader.readAsDataURL(file.data);
    });
    alert("File added to local storage successfully");
  };

  React.useEffect(() => {
    const handleFileAdded = (file: any) => {
      console.log("File added:", file);

      if (!file) {
        console.error("File is undefined in file-added event");
        return;
      }
      // Prevent duplicate files by checking against uploadedFiles
      setUploadedFiles((prevFiles) => {
        const fileExists = prevFiles.some((f) => f.id === file.id);
        if (fileExists) {
          console.warn(`File ${file.name} already exists, skipping.`);
          return prevFiles;
        }

        return [
          ...prevFiles,
          {
            id: file.id,
            name: file.name,
            size: file.size
              ? `${(file.size / 1024).toFixed(2)} MB`
              : "Unknown size",
            status: "Queued",
          },
        ];
      });
    };

    const handleUploadSuccess = (file: any, response: any) => {
      if (!file) {
        console.error("File is undefined in upload success event");
        return;
      }
      console.log("Upload success:", { file, response });

      //change redux state
      const newFile = {
        id: file.id,
        name: file.name,
        type: file.type,
        uploadDate: new Date().toISOString(),
        uploader: "placeholder user",
      };
      dispatch(addFile(newFile));

      //change local state
      setUploadedFiles((prevFiles) => {
        const fileExists = prevFiles.some((f) => f.id === file.id);
        if (fileExists) {
          console.warn(`file ${file.name} already exists`);
          return prevFiles;
        }
        return [
          ...prevFiles,
          {
            id: file.id,
            name: file.name,
            size: file.size
              ? `${(file.size / 1024).toFixed(2)} MB`
              : "unknown size",
            status: "Queued",
            data: file.data,
          },
        ];
      });
    };

    const handleUploadError = (file: any, error: any) => {
      console.error("Upload error:", file, error);
    };

    const handleFileRemoved = (file: any) => {
      console.log("File removed:", file);

      setUploadedFiles((prevFiles) =>
        prevFiles.filter((f) => f.id !== file.id)
      );
    };

    uppy.on("file-added", handleFileAdded);
    uppy.on("upload-success", handleUploadSuccess);
    uppy.on("upload-error", handleUploadError);
    uppy.on("file-removed", handleFileRemoved);

    return () => {
      uppy.off("file-added", handleFileAdded);
      uppy.off("upload-success", handleUploadSuccess);
      uppy.off("upload-error", handleUploadError);

      uppy.off("file-removed", handleFileRemoved);
      uppy.cancelAll();
    };
  }, [uppy, dispatch]);

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
      <DragDropArea
        sx={{
          width: "100%",
          padding: "16px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "200px",
          height:
            uploadedFiles.length > 0
              ? `${200 + uploadedFiles.length * 20}px`
              : "200px", // Dynamically adjust height when files added
          transition: "height 0.3s ease", // Smooth transition
        }}
      >
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
                //prevent duplicate files
                const existingFile = uploadedFiles.find(
                  (f) => f.name === file.name
                );
                if (existingFile) {
                  console.warn(`File ${file.name} already exists`);
                  return;
                }
                try {
                  uppy.addFile({
                    name: file.name,
                    type: file.type,
                    data: file,
                  });
                } catch (error) {
                  console.error("error uploading file:", error);
                }
              });
              //clear input to make sure next uploads trigger the onchange
              e.target.value = "";
            }
          }}
        />
        <label
          htmlFor="fileInput"
          style={{ cursor: "pointer", textAlign: "center" }}
        >
          <Typography
            variant="body2"
            sx={{ fontSize: "13px", color: "#6b7280" }}
          >
            <span
              style={{
                color: "#3b82f6",
                cursor: "pointer",
              }}
            >
              Click to upload
            </span>{" "}
            or drag and drop
          </Typography>
        </label>

        {/* max size */}
        <Typography
          variant="body2"
          sx={{ fontSize: "12px", color: "#6b7280", textAlign: "center" }}
        >
          Maximum size: 50 MB
        </Typography>
        <DragDrop uppy={uppy} locale={locale} />

        {/* Uploaded Files List */}

        {uploadedFiles.length > 0 ? (
          <Stack
            sx={{
              width: "100%",
              flexGrow: 1,
              marginTop: "16px",
              borderTop: "1px solid #e5e7eb",
              paddingTop: "8px",
            }}
          >
            <List>
              {uploadedFiles.map((file, index) => (
                <ListItem
                  key={`${file.name}-${index}`}
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
                      setUploadedFiles((prevFiles) =>
                        prevFiles.filter((f) => f.id !== file.id)
                      );
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </Stack>
        ) : (
          <Typography variant="caption" sx={{ color: "#6B7280" }}>
            No files uploaded yet.
          </Typography>
        )}
        {/* Supported Formats */}
      </DragDropArea>
      <Stack
        direction="row"
        justifyContent="space-between"
        sx={{ width: "100%" }}
      >
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
            width: "100px",
            backgroundColor: "#3B82F6",
            textTransform: "none",
          }}
          onClick={() => uploadToLocalStorage}
        >
          Upload
        </Button>
      </Stack>
    </Container>
  );
};

export default FileUploadComponent;
