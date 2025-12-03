/**
 * @fileoverview NoteComposer Component
 *
 * Form component for creating and editing notes.
 * Provides text input with validation, character count, and submit/cancel buttons.
 *
 * Props:
 * - onSubmit: Callback when form is submitted
 * - onCancel: Callback when edit is cancelled
 * - initialContent: Content for edit mode (optional)
 * - isLoading: Loading state during submission
 * - isEditing: Boolean indicating edit vs create mode
 *
 * @module components/Notes
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Stack,
  TextField,
  Button,
  CircularProgress,
  Typography,
  useTheme,
  Card,
} from "@mui/material";
import {
  Plus as PlusIcon,
  Save as SaveIcon,
  X as CloseIcon,
} from "lucide-react";

interface NoteComposerProps {
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  initialContent?: string;
  isLoading?: boolean;
  isEditing?: boolean;
}

const NoteComposer: React.FC<NoteComposerProps> = ({
  onSubmit,
  onCancel,
  initialContent = "",
  isLoading = false,
  isEditing = false,
}) => {
  const theme = useTheme();
  const [content, setContent] = useState(initialContent);
  const MAX_LENGTH = 5000;
  const remainingChars = MAX_LENGTH - content.length;

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim());
      if (!isEditing) {
        setContent("");
      }
    }
  };

  const handleCancel = () => {
    setContent(initialContent);
    onCancel?.();
  };

  const isContentValid =
    content.trim().length > 0 && content.length <= MAX_LENGTH;
  const isOverLimit = content.length > MAX_LENGTH;

  return (
    <Card
      elevation={0}
      component="form"
      onSubmit={handleSubmit}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.mode === "dark" ? "#1e1e1e" : "#fafafa",
        padding: 2,
        borderRadius: 1,
      }}
    >
      <Stack spacing={1.5}>
        {/* Text Input */}
        <TextField
          fullWidth
          multiline
          minRows={3}
          maxRows={6}
          placeholder={isEditing ? "Edit your note..." : "Add a note..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
          variant="standard"
          slotProps={{
            input: {
              disableUnderline: false,
            },
          }}
          sx={{
            "& .MuiInput-root": {
              backgroundColor: theme.palette.background.paper,
              borderRadius: "4px",
              padding: "12px",
              border: `1px solid ${theme.palette.divider}`,
              "&:hover": {
                borderColor: theme.palette.primary.main,
              },
              "&.Mui-focused": {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.background.paper,
              },
            },
            "& .MuiInput-input": {
              fontFamily: "inherit",
              fontSize: "14px",
            },
          }}
        />

        {/* Character Count and Error Message */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            minHeight: 24,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: isOverLimit
                ? theme.palette.error.main
                : theme.palette.text.secondary,
              fontWeight: isOverLimit ? 600 : 400,
            }}
          >
            {isOverLimit
              ? `Exceeded by ${content.length - MAX_LENGTH} characters`
              : `${remainingChars} characters remaining`}
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          {isEditing && onCancel && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleCancel}
              disabled={isLoading}
              startIcon={<CloseIcon size={16} />}
              sx={{
                textTransform: "none",
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                "&:hover": {
                  borderColor: theme.palette.text.primary,
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            variant="contained"
            size="small"
            disabled={!isContentValid || isLoading}
            sx={{
              textTransform: "none",
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
              },
              "&:disabled": {
                backgroundColor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled,
              },
            }}
          >
            {isLoading ? (
              <CircularProgress size={16} sx={{ mr: 1 }} />
            ) : isEditing ? (
              <SaveIcon size={16} style={{ marginRight: 4 }} />
            ) : (
              <PlusIcon size={16} style={{ marginRight: 4 }} />
            )}
            {isEditing ? "Save" : "Add Note"}
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
};

export default NoteComposer;
