import { Box, Typography, Tooltip, IconButton } from "@mui/material";
import React, { useState } from "react";
import CloudUpload from "../../../assets/icons/cloudUpload.svg";
import RichTextEditor from "../../../components/RichTextEditor/index"; 

interface AuditorFeedbackProps {
  activeSection: string;
}

const AuditorFeedback: React.FC<AuditorFeedbackProps> = ({ activeSection }) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const UploadFile = () => {
    document.getElementById("file-upload")?.click();
  };

  const handleContentChange = (content: string) => {
    console.log("Updated content: ", content);
  };

  return (
    <Box sx={{ width: "100%", padding: 2 }}>
      <Typography sx={{ mb: 2 }}>
        {activeSection === "Evidence" ? "Evidence:" : "Auditor Feedback:"}
      </Typography>

      {/* Use the RichTextEditor component */}
      <RichTextEditor onContentChange={handleContentChange} />

      {/* File Upload */}
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
        <Typography sx={{ color: "black", padding: 5, marginLeft: 1, paddingLeft: 0 }}>
          You can also drag and drop, or click to upload a feedback.
        </Typography>
        <Tooltip title="Attach a file">
          <IconButton component="label">
            <img
              src={CloudUpload}
              alt="Upload"
              style={{ height: 19, width: 20 }}
            />
            <input type="file" hidden id="file-upload" onChange={handleFileUpload} />
          </IconButton>
        </Tooltip>
      </Box>

      {file && (
        <Typography variant="body2" sx={{ mt: 2 }}>
          Attached file: {file.name}
        </Typography>
      )}
    </Box>
  );
};

export default AuditorFeedback;
