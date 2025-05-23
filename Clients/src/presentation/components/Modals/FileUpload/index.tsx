import React, { useState } from "react";
import {
  StyledDialog,
  StyledDialogContent,
} from "../../FileUpload/FileUpload.styles";
import { FileUploadProps } from "../../FileUpload/types";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton } from "@mui/material";
import FileUploadComponent from "../../FileUpload";

interface FileUploadModalProps {
  uploadProps: FileUploadProps;
}

const FileUploadModal: React.FC<FileUploadModalProps> = ({ uploadProps }) => {
  const { open, onClose } = uploadProps;
  const [modalHeight, setModalHeight] = useState(338);
  const handleHeightChange = (newHeight: number) => {
    setModalHeight(newHeight);
  };

  return (
    <StyledDialog open={open} onClose={onClose} modalHeight={modalHeight}>
      <StyledDialogContent>
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
          }}
          disableRipple
        >
          <CloseIcon />
        </IconButton>

        <FileUploadComponent
          onHeightChange={handleHeightChange}
          {...uploadProps}
        />
      </StyledDialogContent>
    </StyledDialog>
  );
};

export default FileUploadModal;
