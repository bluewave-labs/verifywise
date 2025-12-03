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
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.border.light}`,
        borderRadius: "4px",
        padding: "16px",
        transition: "all 150ms ease",
        "&:focus-within": {
          borderColor: theme.palette.primary.main,
          boxShadow: `0px 0px 0px 3px ${theme.palette.primary.main}20`,
        },
      }}
    >
      <Stack spacing={12}>
        {/* Text Input */}
        <TextField
          fullWidth
          multiline
          minRows={isEditing ? 4 : 3}
          maxRows={8}
          placeholder={isEditing ? "Edit your note..." : "Add a note..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
          variant="standard"
          slotProps={{
            input: {
              disableUnderline: true,
            },
          }}
          sx={{
            "& .MuiInput-root": {
              fontFamily: "inherit",
              fontSize: "14px",
              color: theme.palette.text.primary,
              "&::placeholder": {
                color: theme.palette.text.secondary,
                opacity: 0.6,
              },
            },
            "& .MuiInput-input": {
              padding: 0,
              "&:disabled": {
                color: theme.palette.text.secondary,
              },
            },
          }}
        />

        {/* Character Count */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            minHeight: 20,
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              color: isOverLimit
                ? theme.palette.error.main
                : theme.palette.text.secondary,
              fontWeight: isOverLimit ? 600 : 400,
            }}
          >
            {isOverLimit
              ? `⚠️ Exceeded by ${content.length - MAX_LENGTH} characters`
              : `${remainingChars} characters remaining`}
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={8} sx={{ justifyContent: "flex-end" }}>
          {isEditing && onCancel && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleCancel}
              disabled={isLoading}
              startIcon={<CloseIcon size={16} />}
              sx={{
                textTransform: "none",
                fontSize: 13,
                borderColor: theme.palette.border.light,
                color: theme.palette.text.primary,
                padding: "8px 12px",
                transition: "all 150ms ease",
                "&:hover": {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                },
                "&:disabled": {
                  borderColor: theme.palette.border.light,
                  color: theme.palette.text.secondary,
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
              fontSize: 13,
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              padding: "8px 12px",
              transition: "all 150ms ease",
              "&:hover": {
                backgroundColor: theme.palette.primary.dark,
                boxShadow: `0px 2px 8px -2px ${theme.palette.primary.main}40`,
              },
              "&:disabled": {
                backgroundColor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled,
              },
            }}
          >
            {isLoading ? (
              <CircularProgress size={14} sx={{ mr: 8 }} />
            ) : isEditing ? (
              <SaveIcon size={16} style={{ marginRight: 6 }} />
            ) : (
              <PlusIcon size={16} style={{ marginRight: 6 }} />
            )}
            {isEditing ? "Save" : "Add Note"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default NoteComposer;
