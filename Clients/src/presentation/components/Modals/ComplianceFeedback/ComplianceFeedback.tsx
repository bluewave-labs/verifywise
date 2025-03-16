import { Box, Typography, Button, useTheme, Dialog } from "@mui/material";
import React, { useState } from "react";
import RichTextEditor from "../../../components/RichTextEditor/index";
import ErrorModal from "../Error";
import UppyUploadFile from "../../../vw-v2-components/Inputs/FileUpload";
import Uppy from "@uppy/core";
import UploadFileIcon from '@mui/icons-material/UploadFile';

interface AuditorFeedbackProps {
  activeSection?: string;
  feedback: string | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AuditorFeedback: React.FC<AuditorFeedbackProps> = ({
  activeSection,
  feedback,
  onChange,
}) => {
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState<boolean>(false);
  const [isFileUploadOpen, setIsFileUploadOpen] = useState<boolean>(false);
  const [evidenceFiles, setEvidenceFiles] = useState<any[]>([]);
  const [uppy] = useState(() => new Uppy());

  const handleOpenFileUploadModal = () => {
    setIsFileUploadOpen(true);
  };

  const handleCloseFileUploadModal = () => {
    setIsFileUploadOpen(false);
  };

  const handleFileUploadConfirm = (files: any[]) => {
    setEvidenceFiles(files);
    setIsFileUploadOpen(false);
  };

  const handleContentChange = (content: string) => {
    onChange({
      target: {
        value:
          " " +
          content
            .replace(/^<p>/, "")
            .replace(/<\/p>$/, "")
            .trim(),
      },
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
  };

  return (
    <Box sx={{ width: "100%", padding: 2 }}>
      {activeSection && (
        <>
          <Typography sx={{ mb: 2 }}>
            {activeSection === "Evidence" ? "Evidence:" : "Feedback:"}
          </Typography>

          <RichTextEditor
            initialContent={feedback}
            onContentChange={handleContentChange}
          />
        </>
      )}

      <Button
        variant="contained"
        sx={{
          mt: 2,
          borderRadius: 2,
          width: 155,
          height: 25,
          fontSize: 11,
          border: "1px solid #D0D5DD",
          backgroundColor: "white",
          color: "#344054",
        }}
        disableRipple={
          theme.components?.MuiButton?.defaultProps?.disableRipple
        }
        onClick={handleOpenFileUploadModal}
      >
        Add/Remove evidence
      </Button>

      <Dialog
        open={isFileUploadOpen}
        onClose={handleCloseFileUploadModal}
      >
        <UppyUploadFile
          uppy={uppy}
          evidence_files={evidenceFiles}
          onClose={handleCloseFileUploadModal}
          onConfirm={handleFileUploadConfirm}
        />
      </Dialog>

      <ErrorModal
        open={isErrorModalOpen}
        errorMessage={error}
        handleClose={closeErrorModal}
      />
    </Box>
  );
};

export default AuditorFeedback;
