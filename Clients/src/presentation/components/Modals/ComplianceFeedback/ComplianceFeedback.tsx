import { Box, Typography, Button, useTheme, Dialog, Stack } from "@mui/material";
import React, { useState } from "react";
import RichTextEditor from "../../../components/RichTextEditor/index";
import UppyUploadFile from "../../../vw-v2-components/Inputs/FileUpload";
import Alert, { AlertProps } from "../../../components/Alert";
import { handleAlert } from "../../../../application/tools/alertUtils";
import { FileData } from "../../../../domain/File";
import Uppy from "@uppy/core";

interface AuditorFeedbackProps {
  activeSection?: string;
  feedback: string | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  files: FileData[];
  onFilesChange?: (files: FileData[]) => void;
  deletedFilesIds: number[];
  onDeletedFilesChange: (ids: number[]) => void;
  uploadFiles: FileData[];
  onUploadFilesChange: (files: FileData[]) => void;
}

const parseFileData = (file: FileData | string): FileData => {
  if (typeof file === 'string') {
    try {
      const parsedFile = JSON.parse(file);
      return {
        ...parsedFile,
        data: undefined  // API files don't have data property
      } as FileData;
    } catch (error) {
      console.error('Failed to parse file data:', error);
      throw new Error('Invalid file data format');
    }
  }
  return file;
};

const AuditorFeedback: React.FC<AuditorFeedbackProps> = ({
  activeSection,
  feedback,
  onChange,
  files,
  onFilesChange,
  deletedFilesIds,
  onDeletedFilesChange,
  uploadFiles = [],
  onUploadFilesChange = () => {}
}) => {
  const theme = useTheme();
  const [isFileUploadOpen, setIsFileUploadOpen] = useState<boolean>(false);
  const [evidenceFiles, setEvidenceFiles] = useState<FileData[]>(() => 
    files.map(parseFileData)
  );
  const [alert, setAlert] = useState<AlertProps | null>(null);
  const [uppy] = useState(() => new Uppy());

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

    // Check if file is in evidenceFiles or uploadFiles
    const isEvidenceFile = evidenceFiles.some(file => file.id === fileId);
    
    if (isEvidenceFile) {
      const newEvidenceFiles = evidenceFiles.filter(
        (file) => file.id !== fileId
      );
      setEvidenceFiles(newEvidenceFiles);
      onFilesChange?.(newEvidenceFiles);
      onDeletedFilesChange([...deletedFilesIds, fileIdNumber]);
    } else {
      const newUploadFiles = uploadFiles.filter(
        (file) => file.id !== fileId
      );
      onUploadFilesChange(newUploadFiles);
    }

    handleAlert({
      variant: "success",
      body: "File deleted successfully",
      setAlert,
    });
  };

  const closeFileUploadModal = () => {
    const uppyFiles = uppy.getFiles();
    const newUploadFiles = uppyFiles
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

    // Only update uploadFiles state, don't combine with evidenceFiles yet
    onUploadFilesChange(newUploadFiles);
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
        <Stack direction="row" spacing={10}>
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
        {uploadFiles.length > 0 && (
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
            {`${uploadFiles.length} ${uploadFiles.length === 1 ? 'file' : 'files'} pending upload`}
          </Typography>
        )}
        </Stack>
      </Stack>
      <Dialog
        open={isFileUploadOpen}
        onClose={closeFileUploadModal}
      >
        <UppyUploadFile
          uppy={uppy}
          files={[...evidenceFiles, ...uploadFiles]}
          onClose={closeFileUploadModal}
          onRemoveFile={handleRemoveFile}
          hideProgressIndicators={true}
        />
      </Dialog>
      {alert && (
        <Alert {...alert} isToast={true} onClick={() => setAlert(null)} />
      )}
    </Box>
  );
};

export default AuditorFeedback;
