import React, { useState } from "react";
import {
  StyledDialog,
  StyledDialogContent,
} from "../../FileUpload/FileUpload.styles";
import FileUploadComponent from "../../FileUpload";
import { FileUploadProps } from "../../FileUpload/types";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton } from "@mui/material";

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
          {...uploadProps}
          onHeightChange={handleHeightChange}
        />
      </StyledDialogContent>
    </StyledDialog>
  );
};

export default FileUploadModal;
