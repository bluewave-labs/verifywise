import React, { useEffect, useState } from "react";
import { Box, Tooltip, IconButton, Stack } from "@mui/material";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
} from "@mui/icons-material";
import "./index.css";

interface RichTextEditorProps {
  onContentChange?: (content: string) => void;
  headerSx?: object;
  bodySx?: object;
  initialContent?: string;
  isEditable?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  onContentChange,
  headerSx,
  initialContent = "",
  isEditable = true,
}) => {
  const [activeList, setActiveList] = useState<"bulleted" | "numbered" | null>(
    null
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    autofocus: false,
    immediatelyRender: true,
    editable: isEditable,
    onUpdate: ({ editor }) => {
      onContentChange?.(editor.getHTML());
    },
  });

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  const applyFormatting = (type: string) => {
    if (!editor) return;

    const toggleFormatting: { [key: string]: () => void } = {
      bold: () => editor.chain().focus().toggleBold().run(),
      italic: () => editor.chain().focus().toggleItalic().run(),
      uppercase: () =>
        editor.commands.setContent(editor.getText().toUpperCase()),
      lowercase: () =>
        editor.commands.setContent(editor.getText().toLowerCase()),
      bullets: () => {
        editor.chain().focus().toggleBulletList().run();
        setActiveList((prev) => (prev === "bulleted" ? null : "bulleted"));
      },
      numbers: () => {
        editor.chain().focus().toggleOrderedList().run();
        setActiveList((prev) => (prev === "numbered" ? null : "numbered"));
      },
    };

    toggleFormatting[type]();
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
        {[
          { title: "Bold", icon: <FormatBold />, action: "bold" },
          { title: "Italic", icon: <FormatItalic />, action: "italic" },
          { title: "Bullets", icon: <FormatListBulleted />, action: "bullets" },
          { title: "Numbers", icon: <FormatListNumbered />, action: "numbers" },
        ].map(({ title, icon, action }) => (
          <Tooltip
            key={action}
            title={title}
            aria-label={title}
            sx={{ fontSize: 13 }}
          >
            <IconButton
              onClick={() => applyFormatting(action)}
              disableRipple
              color={
                (action === "bullets" && activeList === "bulleted") ||
                (action === "numbers" && activeList === "numbered")
                  ? "primary"
                  : "default"
              }
              disabled={!isEditable}
            >
              {icon}
            </IconButton>
          </Tooltip>
        ))}
      </Box>

      {/* Tiptap Editor */}
      <Stack>
        <EditorContent
          className="custom-tip-tap-editor"
          editor={editor}
          style={{
            border: "1px solid #c4c4c4",
            height: "90px", // Set height of the editor container
            overflowY: "auto",
            padding: "8px",
            paddingTop: "0px",
            borderTop: "none",
            marginBottom: "5px",
            outline: "none",
            display: "flex", // Allow flex behavior
            alignItems: "flex-start", // Align content at the top
          }}
          disabled={!isEditable} // Disable editing
        />
      </Stack>

      <style>
        {`
          .ProseMirror {
         flex: 1; /* Allow content to grow naturally */
        outline: none !important;
        box-shadow: none !important;
        white-space: pre-wrap;
          }
          .custom-tip-tap-editor .ProseMirror p {
            margin: 0;
          }
        `}
      </style>
    </Stack>
  );
};

export default RichTextEditor;
