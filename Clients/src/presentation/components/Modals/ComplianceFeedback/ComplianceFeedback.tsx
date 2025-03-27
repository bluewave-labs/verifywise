import { Box, Typography, Button, useTheme, Dialog, Stack } from "@mui/material";
import React, { useState, useEffect } from "react";
import RichTextEditor from "../../../components/RichTextEditor/index";
import UppyUploadFile from "../../../vw-v2-components/Inputs/FileUpload";
import Alert, { AlertProps } from "../../../components/Alert";
import { handleAlert } from "../../../../application/tools/alertUtils";
import { FileData } from "../../../../domain/Subcontrol";
import Uppy from "@uppy/core";

interface AuditorFeedbackProps {
  activeSection?: string;
  feedback: string | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  files: FileData[];
  onFilesChange?: (files: FileData[]) => void;
  deletedFilesIds: number[];
  onDeletedFilesChange: (ids: number[]) => void;
}

const AuditorFeedback: React.FC<AuditorFeedbackProps> = ({
  activeSection,
  feedback,
  onChange,
  files,
  onFilesChange,
  deletedFilesIds,
  onDeletedFilesChange
}) => {
  const theme = useTheme();
  const [isFileUploadOpen, setIsFileUploadOpen] = useState<boolean>(false);
  const [evidenceFiles, setEvidenceFiles] = useState<FileData[]>([]);
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [uppy] = useState(() => new Uppy());

  // Parse files when they change
  useEffect(() => {
    const parsedFiles = files.map(file => {
      if (typeof file === 'string') {
        const parsedFile = JSON.parse(file);
        return {
          ...parsedFile,
          data: undefined  // API files don't have data property
        } as FileData;
      }
      return file;
    });
    setEvidenceFiles(parsedFiles);
  }, [files]);

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

  const handleRemoveFile = async (fileId: string) => {
    const fileIdNumber = parseInt(fileId);
    if (isNaN(fileIdNumber)) {
      handleAlert({
        variant: "error",
        body: "Invalid file ID",
        setAlert,
      });
      return;
    }
    const newEvidenceFiles = evidenceFiles.filter(
      (file) => file.id !== fileId
    );
    setEvidenceFiles(newEvidenceFiles);
    onFilesChange?.(newEvidenceFiles);
    onDeletedFilesChange([...deletedFilesIds, fileIdNumber]);
    handleAlert({
      variant: "success",
      body: "File deleted successfully",
      setAlert,
    });
  };

  const closeFileUploadModal = () => {
    const uppyFiles = uppy.getFiles();
    const newEvidenceFiles = uppyFiles
      .map(file => {
        if (!(file.data instanceof Blob)) {
          return null;
        }
        return {
          data: file.data,  // Keep the actual file for upload
          id: file.id,
          fileName: file.name || 'unnamed',
          size: file.size || 0,
          type: file.type || 'application/octet-stream'
        } as FileData;
      })
      .filter((file): file is FileData => file !== null);

    const combinedFiles = [...evidenceFiles, ...newEvidenceFiles];
    setEvidenceFiles(combinedFiles);
    onFilesChange?.(combinedFiles);
    setIsFileUploadOpen(false);
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

      <Stack direction="row" spacing={2}>
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
          onClick={() => setIsFileUploadOpen(true)}
        >
          Add/Remove evidence
        </Button>
        <Typography
          sx={{
            fontSize: 11,
            color: "#344054",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            margin: "auto",
            textWrap: "wrap",
          }}
        >
          {`${evidenceFiles.length || 0} evidence files attached`}
        </Typography>
      </Stack>
      <Dialog
        open={isFileUploadOpen}
        onClose={closeFileUploadModal}
      >
        <UppyUploadFile
          uppy={uppy}
          files={evidenceFiles}
          onClose={closeFileUploadModal}
          onRemoveFile={handleRemoveFile}
        />
      </Dialog>
      {alert && (
        <Alert {...alert} isToast={true} onClick={() => setAlert(null)} />
      )}
    </Box>
  );
};

export default AuditorFeedback;
