import React from "react";
import {  DialogActions, Button } from "@mui/material";
import { StyledDialog, StyledDialogContent } from "../../FileUpload/FileUpload.styles";
import FileUploadComponent from "../../FileUpload";

import { FileUploadProps } from "../../FileUpload/types";

interface FileUploadModalProps {
  open: boolean;
  onClose: () => void;
  uploadProps: FileUploadProps;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  open,
  onClose,
  uploadProps,
}) => {
  return (
    <StyledDialog open={open} onClose={onClose} aria-labelledby="upload-dialog-title"
    >
      <StyledDialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap:"16px",
          overflow:"visible"
        }}
      >
        <FileUploadComponent {...uploadProps} />
      </StyledDialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined" sx={{
          height:"30px", marginTop:2
        }}>
          Close
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default FileUploadModal;
