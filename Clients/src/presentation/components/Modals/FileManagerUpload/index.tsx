/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  IconButton,
} from "@mui/material";
import { X as CloseIcon } from "lucide-react";
import Uploader, { UploadFile } from "../../Uploader";
import { uploadFileToManager } from "../../../../application/repository/file.repository";
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE_BYTES } from "../../../../application/constants/fileManager";

interface FileManagerUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (uploadedFile: any) => void;
  modelId?: string | number | undefined;
}

const FileManagerUploadModal: React.FC<FileManagerUploadModalProps> = ({
  open,
  onClose,
  onSuccess,
  modelId
}) => {
  // Custom upload handler using the file manager repository
  const handleUpload = async (file: File): Promise<{ url: string; id: string }> => {
    const response = await uploadFileToManager({ file, model_id: modelId });

    if (!response || !response.data) {
      throw new Error("Server failed to store the file. Please try again.");
    }

    if (!response.data.id) {
      throw new Error("File uploaded but not stored properly. Please contact support.");
    }

    return {
      url: response.data.url || `/api/files/${response.data.id}`,
      id: response.data.id.toString()
    };
  };

  // Handle all uploads completion
  const handleUploadComplete = (files: UploadFile[]) => {
    if (files.length > 0 && onSuccess) {
      const uploadedFiles = files.map(f => ({
        id: f.url, // or extract from f.url
        filename: f.name,
        size: f.size,
        type: f.type
      }));
      onSuccess(uploadedFiles);
    }
    // Close modal after successful upload
    setTimeout(() => onClose(), 500);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            Upload Files
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon size={20} />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Uploader
          acceptedTypes={SUPPORTED_FILE_TYPES}
          maxFileSize={MAX_FILE_SIZE_BYTES}
          maxFiles={10}
          multiple={true}
          onUploadComplete={handleUploadComplete}
          showPreview={true}
          customUploadHandler={handleUpload}
        />
      </DialogContent>
    </Dialog>
  );
};

export default FileManagerUploadModal;