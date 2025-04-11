import { useEffect, useRef, useState } from 'react';
import './drop-file-input.css';
import UploadSmallIcon from '../../assets/icons/folder-upload.svg';
import { FileProps, FileUploadProps } from './types';
import { DragDropArea, Icon } from './FileUpload.styles';
import { List, ListItem, ListItemText, Stack, Typography, IconButton, Button } from '@mui/material';
import DeleteIcon from "@mui/icons-material/Delete";

const FileUploadComponent = ({onClose, onHeightChange, topicId = 0, assessmentsValues = [], setAssessmentsValue, allowedFileTypes}: FileUploadProps) => {

  const wrapperRef = useRef<HTMLDivElement>(null);

  const [fileList, setFileList] = useState<FileProps[]>(assessmentsValues[topicId]?.file || []);

  const onDragEnter = () => wrapperRef?.current?.classList.add('dragover');

  const onDragLeave = () => wrapperRef?.current?.classList.remove('dragover');

  const onDrop = () => wrapperRef?.current?.classList.remove('dragover');

  // Dynamically adjust based on uploaded files
  useEffect(() => {
    if (onHeightChange) {
      const baseHeight = 338;
      const fileHeightIncrement = 55;
      const maxHeight = 600;

      const newHeight = Math.min(
        baseHeight + fileList.length * fileHeightIncrement,
        maxHeight
      );

      onHeightChange?.(newHeight);
    }
  }, [fileList.length, onHeightChange]);

  const onFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFile: File | undefined = e.target.files?.[0];

    if (!newFile) {
      return;
    }

    if (!allowedFileTypes?.includes(newFile.type)) {
      console.error(`invalid file type: ${newFile.type}`);
      return;                                           
    }
    // Prevent duplicate files
    if (newFile) {
      const fileExists = fileList.some(
        (f: FileProps) => f.name === newFile.name || f.size === newFile.size
      );
      if (fileExists) {
        console.warn(`File ${newFile.name} already exists.`);
        return;
      }
    }
    // Update the file list
    const updatedList: FileProps[] = [...fileList, newFile];
    setFileList(updatedList);
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = fileList.filter((_, i) => i !== index);
    setFileList(newFiles);
  };

  const handleUploadClick = () => {
    if (assessmentsValues != null && topicId != null && assessmentsValues[topicId] != null && typeof assessmentsValues === "object" && assessmentsValues[topicId].file != null ) {
      const newAssessmentValues = { ...assessmentsValues,
      [topicId]: {
        ...assessmentsValues[topicId],
        file: fileList,
      }}
      setAssessmentsValue?.(newAssessmentValues);
    }

    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      <Stack
        spacing={3}
        sx={{
          width: "fit-content",
          mt: 0,
          pt: 0,
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, fontSize: "16px", pb: 2 }}
        >
          Upload a new file
        </Typography>

        <DragDropArea uploadedFilesCount={fileList.length}>
          <div
            ref={wrapperRef}
            className="drop-file-input"
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <div className="drop-file-input__label">
              <Icon src={UploadSmallIcon} alt="Upload Icon" sx={{ mb: 2 }} />
              <Typography variant="body2">
                <span style={{ color: "#3b82f6" }}>Click to upload</span> or
                drag and drop
              </Typography>
            </div>
            <input type="file" value="" onChange={onFileDrop} />
          </div>
          {fileList.length > 0 && (
            <Stack
              sx={{
                mt: 2,
                borderTop: "1px solid #e5e7eb",
                width: "100%",
                padding: "8px",
                maxHeight: "300px",
                overflowY: "auto",
                boxSizing: "border-box",
              }}
            >
              <List>
                {fileList.map((file, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0",
                    }}
                  >
                    <ListItemText
                      primary={file.name}
                      secondary={`Size: ${file.size}`}
                      sx={{
                        fontSize: "12px",
                        wordBreak: "break-word",
                        maxWidth: "100%",
                      }}
                    />
                    <IconButton
                      onClick={() => handleRemoveFile(index)}
                      edge="end"
                      size="small"
                      sx={{ padding: "4px" }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </Stack>
          )}
        </DragDropArea>
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ fontSize: "12px" }}>
            Supported formats: PDF
          </Typography>
          <Button
            variant="contained"
            sx={{ marginTop: "8px", width: "100px", height: "34px" }}
            onClick={handleUploadClick}
          >
            Save
          </Button>
        </Stack>
      </Stack>
    </>
  );
}

export default FileUploadComponent;
