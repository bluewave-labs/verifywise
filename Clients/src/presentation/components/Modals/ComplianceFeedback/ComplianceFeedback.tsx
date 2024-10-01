import { Box, Tooltip, Typography } from "@mui/material";
import React, { useState } from "react";
import {
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  HMobiledata,
} from "@mui/icons-material";
import Field from "../../Inputs/Field";
import { IconButton } from "@mui/material";
import CloudUpload from "../../../assets/icons/cloudUpload.svg";

interface AuditorFeedbackProps {
  activeSection: string;
}

const AuditorFeedback: React.FC<AuditorFeedbackProps> = React.memo(
  ({ activeSection }) => {
    const [text, setText] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);

    const applyFormatting = (type: string) => {
      let updatedText = text;
      switch (type) {
        case "bold":
          updatedText = `**${text}**`;
          break;
        case "italic":
          updatedText = `*${text}*`;
          break;
        case "uppercase":
          updatedText = text.toUpperCase();
          break;
        case "lowercase":
          updatedText = text.toLowerCase();
          break;
        case "bullets":
          updatedText = text
            .split("\n")
            .map((line) => `• ${line}`)
            .join("\n");
          break;
        case "numbers":
          updatedText = text
            .split("\n")
            .map((line, index) => `${index + 1}. ${line}`)
            .join("\n");
          break;
        default:
          break;
      }
      setText(updatedText);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setFile(e.target.files[0]);
      }
    };

    return (
      <Box sx={{ width: "100%", padding: 2 }}>
        <Typography sx={{ mb: 2 }}>
          {activeSection === "Evidence" ? "Evidence:" : "Auditor Feedback:"}
        </Typography>

        {/* Toolbar */}
        <Box
          sx={{
            display: "flex",
            border: "1px, solid",
            borderColor: "#c4c4c4",
            borderBottom: "none",
          }}
        >
          <Tooltip title="Bold">
            <IconButton onClick={() => applyFormatting("bold")}>
              <FormatBold />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic">
            <IconButton onClick={() => applyFormatting("italic")}>
              <FormatItalic />
            </IconButton>
          </Tooltip>
          <Tooltip title="Uppercase">
            <IconButton onClick={() => applyFormatting("uppercase")}>
              <HMobiledata sx={{ fontSize: "30px", fontWeight: "bold" }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Lowercase">
            <IconButton onClick={() => applyFormatting("lowercase")}>
              <HMobiledata />
            </IconButton>
          </Tooltip>
          <Tooltip title="Bullets">
            <IconButton onClick={() => applyFormatting("bullets")}>
              <FormatListBulleted />
            </IconButton>
          </Tooltip>
          <Tooltip title="Numbers">
            <IconButton onClick={() => applyFormatting("numbers")}>
              <FormatListNumbered />
            </IconButton>
          </Tooltip>
        </Box>
        <Field
          type="description"
          sx={{
            height: "50px",
            "& .MuiOutlinedInput-root": {
              height: "161px",
            },
            "& fieldset": {
              borderTop: "none",
            },
            marginBottom: 30,
          }}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: "row-reverse",
            border: "1px dotted",
            borderColor: "#D0D5DD",
            width: 472,
            alignItems: "center",
          }}
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
              <input type="file" hidden onChange={handleFileUpload} />
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
  }
);

export default AuditorFeedback;
