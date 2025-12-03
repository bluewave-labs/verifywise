import React, { useCallback } from "react";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import { X as CloseIcon } from "lucide-react";
import Uploader, { UploadFile } from "../../Uploader";
import { uploadFileToManager } from "../../../../application/repository/file.repository";

interface InsertImageUploaderModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (url: string, alt?: string) => void;
}

const InsertImageUploaderModal: React.FC<InsertImageUploaderModalProps> = ({
  open,
  onClose,
  onInsert,
}) => {
  const handleUploadComplete = (files: UploadFile[]) => {
    // Insert all uploaded images into the editor
    files.forEach((file) => {
      if (file.url) {
        onInsert(file.url, file.name);
      }
    });
    onClose();
  };

  // Custom upload handler that uses our file.repository API
  const customUploadHandler = useCallback(async (file: File, onProgress: (progress: number) => void): Promise<string> => {
    try {
      // Simulate progress since uploadFileToManager doesn't provide progress callback
      onProgress(0);

      const response = await uploadFileToManager({
        file,
        model_id: null,
        signal: undefined,
      });

      onProgress(100);

      // Return the file URL - using the file ID from the response
      const fileId = response.data.id;
      return `/api/file-manager/${fileId}`;
    } catch (error) {
      console.error("File upload error:", error);
      throw new Error("Failed to upload file");
    }
  }, []);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, p: 1.5 },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 0 }}>
        Insert Images
        <IconButton
          onClick={onClose}
          sx={{
            color: "#6B7280",
            "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
          }}
        >
          <CloseIcon size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Uploader
          acceptedTypes={['image/*']}
          maxFileSize={10 * 1024 * 1024} // 10MB
          maxFiles={10}
          multiple={true}
          onUploadComplete={handleUploadComplete}
          showPreview={true}
          customUploadHandler={customUploadHandler}
        />
      </DialogContent>
    </Dialog>
  );
};

export default InsertImageUploaderModal;
