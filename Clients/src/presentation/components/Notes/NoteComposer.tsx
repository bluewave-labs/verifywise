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
  IconButton,
  CircularProgress,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Send as SendIcon,
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
        padding: theme.spacing(3),
        transition: `border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out`,
        "&:focus-within": {
          borderColor: theme.palette.primary.main,
          boxShadow: `0 0 0 3px rgba(19, 113, 91, 0.1)`,
        },
      }}
    >
      <Stack spacing={theme.spacing(3)}>
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
              fontSize: "13px",
              color: theme.palette.text.primary,
              "&::placeholder": {
                color: theme.palette.text.secondary,
                opacity: 0.5,
              },
            },
            "& .MuiInput-input": {
              padding: 0,
              lineHeight: 1.6,
              "&:disabled": {
                color: theme.palette.text.secondary,
                opacity: 0.6,
              },
            },
          }}
        />

        {/* Character Count */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            minHeight: 20,
            mt: theme.spacing(1),
          }}
        >
          <Typography
            sx={{
              fontSize: 11,
              color: isOverLimit
                ? theme.palette.error.main
                : theme.palette.text.secondary,
              fontWeight: isOverLimit ? 600 : 500,
              letterSpacing: "0.3px",
            }}
          >
            {isOverLimit
              ? `⚠️ Exceeded by ${content.length - MAX_LENGTH} characters`
              : `${remainingChars} characters remaining`}
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Stack
          direction="row"
          spacing={theme.spacing(1.5)}
          sx={{ justifyContent: "flex-end", alignItems: "center", mt: theme.spacing(2) }}
        >
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
                fontWeight: 500,
                borderColor: theme.palette.border.light,
                color: theme.palette.text.primary,
                padding: theme.spacing(1, 1.5),
                transition: `all 0.2s ease-in-out`,
                "&:hover:not(:disabled)": {
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

          {isEditing ? (
            <Button
              type="submit"
              variant="contained"
              size="small"
              disabled={!isContentValid || isLoading}
              startIcon={
                isLoading ? (
                  <CircularProgress size={14} />
                ) : (
                  <SaveIcon size={16} />
                )
              }
              sx={{
                textTransform: "none",
                fontSize: 13,
                fontWeight: 500,
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                padding: theme.spacing(1, 1.5),
                transition: `all 0.2s ease-in-out`,
                "&:hover:not(:disabled)": {
                  backgroundColor: theme.palette.primary.dark,
                  boxShadow: `0 2px 8px -2px rgba(19, 113, 91, 0.25)`,
                },
                "&:disabled": {
                  backgroundColor: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled,
                },
              }}
            >
              Save
            </Button>
          ) : (
            <IconButton
              type="submit"
              disabled={!isContentValid || isLoading}
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                transition: `all 0.2s ease-in-out`,
                "&:hover:not(:disabled)": {
                  backgroundColor: theme.palette.primary.dark,
                  boxShadow: `0 2px 8px -2px rgba(19, 113, 91, 0.35)`,
                  transform: "scale(1.08)",
                },
                "&:disabled": {
                  backgroundColor: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled,
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={18} sx={{ color: "inherit" }} />
              ) : (
                <SendIcon size={18} />
              )}
            </IconButton>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default NoteComposer;
