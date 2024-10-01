import { Box, Tooltip, Typography } from "@mui/material";
import React, { useRef, useState } from "react";
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
    const [bold, setBold] = useState<boolean>(false);
    const [italic, setItalic] = useState<boolean>(false);
    const [bulleted, setBulleted] = useState<boolean>(false);
    const [numbered, setNumbered] = useState<boolean>(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFieldChange = (e: any) => {
      setText(e.target.value);
    };

    const applyFormatting = (type: string) => {
      let updatedText = text;
      switch (type) {
        case "bold":
          setBold(!bold); // Toggle bold state
          break;
        case "italic":
          setItalic(!italic); // Toggle italic state
          break;
        case "uppercase":
          updatedText = text.toUpperCase();
          break;
        case "lowercase":
          updatedText = text.toLowerCase();
          break;
        case "bullets":
          if (bulleted) {
            // Remove bullet points if active
            updatedText = text
              .split("\n")
              .map((line) => line.replace(/^•\s/, "")) // Remove bullet point if it exists
              .join("\n");
            setBulleted(false);
          } else {
            // Add bullet points and remove numbering if active
            updatedText = text
              .split("\n")
              .map((line) => `• ${line.replace(/^\d+\.\s/, "")}`) // Remove number if exists, add bullet
              .join("\n");
            setBulleted(true);
            setNumbered(false); // Disable numbered list if active
          }
          break;
        case "numbers":
          if (numbered) {
            // Remove numbers if active
            updatedText = text
              .split("\n")
              .map((line) => line.replace(/^\d+\.\s/, "")) // Remove numbered prefix if it exists
              .join("\n");
            setNumbered(false);
          } else {
            // Add numbers and remove bullets if active
            updatedText = text
              .split("\n")
              .map((line, index) => `${index + 1}. ${line.replace(/^•\s/, "")}`) // Remove bullet if exists, add number
              .join("\n");
            setNumbered(true);
            setBulleted(false); // Disable bullet list if active
          }
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

    const UploadFile = () => {
      fileInputRef.current?.click();
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
            border: "1px solid",
            borderColor: "#c4c4c4",
            borderBottom: "none",
          }}
        >
          <Tooltip title="Bold">
            <IconButton onClick={() => applyFormatting("bold")} disableRipple>
              <FormatBold />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic">
            <IconButton onClick={() => applyFormatting("italic")} disableRipple>
              <FormatItalic />
            </IconButton>
          </Tooltip>
          <Tooltip title="Uppercase">
            <IconButton
              onClick={() => applyFormatting("uppercase")}
              disableRipple
            >
              <HMobiledata sx={{ fontSize: "30px", fontWeight: "bold" }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Lowercase">
            <IconButton
              onClick={() => applyFormatting("lowercase")}
              disableRipple
            >
              <HMobiledata />
            </IconButton>
          </Tooltip>
          <Tooltip title="Bullets">
            <IconButton
              onClick={() => applyFormatting("bullets")}
              disableRipple
              color={bulleted ? "primary" : "default"} // Visual indicator for toggle
            >
              <FormatListBulleted />
            </IconButton>
          </Tooltip>
          <Tooltip title="Numbers">
            <IconButton
              onClick={() => applyFormatting("numbers")}
              disableRipple
              color={numbered ? "primary" : "default"} // Visual indicator for toggle
            >
              <FormatListNumbered />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Text Field */}
        <Field
          value={text}
          onChange={(e) => handleFieldChange(e)}
          type="description"
          sx={{
            height: "50px",
            "& .MuiOutlinedInput-root": {
              height: "161px",
              fontWeight: bold ? "bold" : "normal", // Apply bold
              fontStyle: italic ? "italic" : "normal", // Apply italic
            },
            "& fieldset": {
              borderTop: "#c4c4c4",
              borderRadius: "0 0 0 0",
            },
            marginBottom: 30,
            "& .MuiOutlinedInput-root.Mui-focused fieldset": {
              border: "solid 1px",
              borderColor: "#c4c4c4",
            },
          }}
        />

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
                onChange={handleFileUpload}
                ref={fileInputRef}
              />
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
