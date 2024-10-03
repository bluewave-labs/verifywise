import { Box, Tooltip, Typography } from "@mui/material";
import React, { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  HMobiledata,
} from "@mui/icons-material";
import { IconButton } from "@mui/material";
import CloudUpload from "../../../assets/icons/cloudUpload.svg";

interface AuditorFeedbackProps {
  activeSection: string;
}

const AuditorFeedback: React.FC<AuditorFeedbackProps> = React.memo(
  ({ activeSection }) => {
    const [file, setFile] = useState<File | null>(null);
    const [bulleted, setBulleted] = useState<boolean>(false);
    const [numbered, setNumbered] = useState<boolean>(false);

    const editor = useEditor({
      extensions: [StarterKit],
      content: "",
      autofocus: true,
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setFile(e.target.files[0]);
      }
    };

    const applyFormatting = (type: string) => {
      if (!editor) return;

      switch (type) {
        case "bold":
          editor.chain().focus().toggleBold().run();
          break;
        case "italic":
          editor.chain().focus().toggleItalic().run();
          break;
        case "uppercase":
          const uppercaseText = editor.getText().toUpperCase();
          editor.commands.setContent(uppercaseText);
          break;
        case "lowercase":
          const lowercaseText = editor.getText().toLowerCase();
          editor.commands.setContent(lowercaseText);
          break;
        case "bullets":
          editor.chain().focus().toggleBulletList().run();
          setBulleted(!bulleted);
          setNumbered(false);
          break;
        case "numbers":
          editor.chain().focus().toggleOrderedList().run();
          setNumbered(!numbered);
          setBulleted(false);
          break;
        default:
          break;
      }
    };

    const UploadFile = () => {
      document.getElementById("file-upload")?.click();
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
              color={bulleted ? "primary" : "default"}
            >
              <FormatListBulleted />
            </IconButton>
          </Tooltip>
          <Tooltip title="Numbers">
            <IconButton
              onClick={() => applyFormatting("numbers")}
              disableRipple
              color={numbered ? "primary" : "default"}
            >
              <FormatListNumbered />
            </IconButton>
          </Tooltip>
        </Box>

        <Box>
          <EditorContent
            editor={editor}
            style={{
              border: "1px solid #c4c4c4",
              minHeight: "110px",
              maxHeight: "110px",
              overflowY: 'auto',
              padding: "8px",
              borderTop: "none",
              outline: "none",
              marginBottom: "10px",
            }}
          />
        </Box>
        <style>
          {`
          .ProseMirror {
            border: none !important;      
            outline: none !important;      
            box-shadow: none !important;   
            white-space: pre-wrap;
          }
        `}
        </style>

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
      </Box>
    );
  }
);

export default AuditorFeedback;
