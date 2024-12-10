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
 * FileUpload component allows users to upload a file by either clicking a button or dragging and dropping a file.
 * It displays the uploaded file name or an error message if the upload fails.
 *
 * @component
 * @returns {JSX.Element} The rendered FileUpload component.
 */

interface FileUploadModalProps {
  //set props and removed FC
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
      }}
      >
        <FileUploadComponent {...uploadProps} onStart={handleUploadStart} 
        onError={handleUploadError}
        onSuccess={handleUploadSuccess}/>
      </DialogContent>
      <DialogActions>
        {loading ? (
          <CircularProgress size={24} />
        ) : (
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
