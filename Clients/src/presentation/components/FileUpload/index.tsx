import React from "react";
import { Typography, Button } from "@mui/material";
import {
  Container,
  DragDropArea,
  Icon,
  ButtonWrapper,
} from "./FileUpload.styles";
import { createUppyInstance } from "./uppyConfig";
import {
  handleUploadSuccess,
  handleUploadError,
  handleUploadProgress,
} from "./eventHandlers";
import { DragDrop } from "@uppy/react";
import UploadSmallIcon from "../../assets/icons/file-upload.svg";
import { FileUploadProps } from "./types";

const FileUploadComponent: React.FC<FileUploadProps> = ({
  onSuccess,
  onError,
  onProgress,
  maxFileSize = 50 * 1024 * 1024,
  allowedFileTypes = [".pdf"],
  uploadEndpoint,
}) => {
  // Configure Uppy instance
  const uppy = React.useMemo(
    () => createUppyInstance(uploadEndpoint, allowedFileTypes, maxFileSize),
    [uploadEndpoint, allowedFileTypes, maxFileSize]
  ); // Attach event handlers

  React.useEffect(() => {
    uppy.on("upload-success", handleUploadSuccess(onSuccess));
    uppy.on("upload-error", handleUploadError(onError));
    uppy.on("upload-progress", handleUploadProgress(onProgress));

    return () => uppy.cancelAll();
  }, [uppy, onSuccess, onError, onProgress]);

  const locale = React.useMemo(
    () => ({
      strings: {
        dropHereOr: "Click to upload or drag and drop",
      },
      pluralize:(count:number)=> count,
    }),
    []
  );

  return (
    <Container>
      {/* Title */}
      <Typography
        variant="h6"
        sx={{ fontWeight: 600, fontSize: "16px", color: "#374151" }}
      >
        Upload a new file
      </Typography>
      {/* Drag-and-Drop Area */}
      <DragDropArea>
        <Icon src={UploadSmallIcon} alt="Upload Icon" />

        <Typography
          variant="body2"
          sx={{
            fontSize: "14px",
            color: "#6B7280",
          }}
        >
          <span
            style={{
              color: "#3B82F6",
              cursor: "pointer",
            }}
          >
            Click to upload
          </span>{" "}
          or drag and drop
        </Typography>

        <Typography
          variant="caption"
          sx={{
            fontSize: "12px",
            color: "#6B7280",
          }}
        >
          (maximum size: 50 MB)
        </Typography>
        {/* DragDrop Component */}
        <DragDrop uppy={uppy} locale={locale} />
      </DragDropArea>
      {/* Supported Formats */}
      <Typography variant="caption" sx={{ fontSize: "12px", color: "#6B7280" }}>
        Supported formats: PDF
      </Typography>
      {/* Upload Button */}
      <ButtonWrapper>
        <Button
          variant="contained"
          sx={{
            width: "120px",
            backgroundColor: "#3B82F6",
            textTransform: "none",
          }}
          onClick={() => uppy.upload()}
        >
          Upload
        </Button>
      </ButtonWrapper>
    </Container>
  );
};

export default FileUploadComponent;
