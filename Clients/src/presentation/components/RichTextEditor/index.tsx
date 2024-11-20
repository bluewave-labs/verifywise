import React, { useState } from "react";
import { Box, Tooltip, IconButton, Stack } from "@mui/material";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  HMobiledata,
} from "@mui/icons-material";

interface RichTextEditorProps {
  onContentChange?: (content: string) => void;
  headerSx?: object;
  bodySx?: object;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  onContentChange,
  headerSx,
  bodySx,
}) => {
  const [bulleted, setBulleted] = useState<boolean>(false);
  const [numbered, setNumbered] = useState<boolean>(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    autofocus: true,
    onUpdate({ editor }) {
      if (onContentChange) {
        onContentChange(editor.getHTML());
      }
    },
  });

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

  return (
    <Stack>
      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          border: "1px solid",
          borderColor: "#c4c4c4",
          borderBottom: "none",
          borderRadius: "4px",
          ...headerSx,
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

      {/* Tiptap Editor */}
      <Box>
        <EditorContent
          editor={editor}
          style={{
            border: "1px solid #c4c4c4",
            minHeight: "110px",
            maxHeight: "110px",
            overflowY: "auto",
            padding: "8px",
            borderTop: "none",
            outline: "none",
            marginBottom: "10px",
            ...bodySx,
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
    </Stack>
  );
};

export default RichTextEditor;
