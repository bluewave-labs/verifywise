import {
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import React, { useState } from "react";

import ErrorModal from "../Error";
import FileUploadComponent from "../../FileUpload";
import { FileUploadProps } from "../../FileUpload/types";

/**
 * File Upload Modal: A modal wrapper for the file upload component
 * 
 *
 * @component
 * @param {boolean} open - determines if the modal is open
 * @param {function} onClose - function to close modal 
 * @param {FileUploadProps} uploadProps - props for the file upload component
 */

interface FileUploadModalProps {
  //set props 
  open: boolean;
  onClose: () => void;
  uploadProps: FileUploadProps;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({
  open,
  onClose,
  uploadProps,
}: FileUploadModalProps) => {
  const [loading, setLoading] = useState(false); //loading state
  const [error, setError] = useState<string | null>(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState<boolean>(false);

  const handleUploadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleUploadError = (errorMessage: string) => {
    setLoading(false);
    setError(errorMessage);
    setIsErrorModalOpen(true);
  };

  const handleUploadSuccess = () => {
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogContent
      sx={{
        display:"flex",
        flexDirection:"column",
        alignItems:"center",
        justifyContent:"center",
        padding:"16px",
      }}
      >
        {loading && (
          <CircularProgress
          size={50}
          sx={{position:"absolute",
            top:"50%",
            left:"50%",
            transform:"translate(-50%, -50%)",
            zIndex:1000,
          }}
          />
        )}
        <FileUploadComponent {...uploadProps} 
        onStart={handleUploadStart} 
        onError={handleUploadError}
        onSuccess={handleUploadSuccess}/>
      </DialogContent>
      <DialogActions>
        {!loading && (
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        )}
      </DialogActions>
      <ErrorModal
        open={isErrorModalOpen}
        errorMessage={error}
        handleClose={() => setIsErrorModalOpen(false)}
      />
    </Dialog>
  );
};

export default FileUploadModal;
