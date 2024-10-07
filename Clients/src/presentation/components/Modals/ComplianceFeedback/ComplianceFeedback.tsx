import { Box, Typography, Tooltip, IconButton } from "@mui/material";
import React, { useState } from "react";
import CloudUpload from "../../../assets/icons/cloudUpload.svg";
import RichTextEditor from "../../../components/RichTextEditor/index";
import { uploadFile } from "../../../../application/tools/fileUtil";
import ErrorModal from "../Error";

interface AuditorFeedbackProps {
  activeSection: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-rar-compressed",
];

const AuditorFeedback: React.FC<AuditorFeedbackProps> = ({ activeSection }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const { error: uploadError, file: uploadedFile } = uploadFile(
        file,
        ALLOWED_FILE_TYPES,
        MAX_FILE_SIZE
      );

      if (uploadError) {
        setError(uploadError);
        setIsErrorModalOpen(true);
      } else if (uploadedFile) {
        setFile(uploadedFile);
      }
    }
  };

  const UploadFile = () => {
    document.getElementById("file-upload")?.click();
  };

  const handleContentChange = (content: string) => {
    console.log("Updated content: ", content);
  };

  const closeErrorModal = () => {
    setIsErrorModalOpen(false);
  };

  return (
    <Box sx={{ width: "100%", padding: 2 }}>
      <Typography sx={{ mb: 2 }}>
        {activeSection === "Evidence" ? "Evidence:" : "Auditor Feedback:"}
      </Typography>

      <RichTextEditor onContentChange={handleContentChange} />

      <Box
        sx={{
          display: "flex",
          flexDirection: "row-reverse",
          border: "1px dotted",
          borderColor: "#D0D5DD",
          width: 472,
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={UploadFile}
      >
        <Typography
          sx={{ color: "black", padding: 5, marginLeft: 1, paddingLeft: 0 }}
        >
          You can also drag and drop, or click to upload a feedback.
        </Typography>
        <Tooltip title="Attach a file">
          <IconButton component="label">
            <img
              src={CloudUpload}
              alt="Upload"
              style={{ height: 19, width: 20 }}
            />
            <input
              type="file"
              hidden
              id="file-upload"
              onChange={handleFileUpload}
            />
          </IconButton>
        </Tooltip>
      </Box>

      {file && (
        <Typography variant="body2" sx={{ mt: 2 }}>
          Attached file: {file.name}
        </Typography>
      )}

      <ErrorModal
        open={isErrorModalOpen}
        errorMessage={error}
        handleClose={closeErrorModal}
      />
    </Box>
  );
};

export default AuditorFeedback;
