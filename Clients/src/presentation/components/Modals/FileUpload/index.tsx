import React from "react";
import { Dialog, DialogContent, DialogActions, Button } from "@mui/material";
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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <FileUploadComponent {...uploadProps} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileUploadModal;
