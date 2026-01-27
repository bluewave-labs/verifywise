/**
 * PlaygroundInputBar Component
 * 
 * A reusable input bar for the Playground with:
 * - Text input for messages
 * - Send button
 * - Add files button (+)
 * - Run evaluation button (flask)
 */

import { useState, useRef, forwardRef } from "react";
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  CircularProgress,
  Stack,
  Chip,
} from "@mui/material";
import {
  ArrowUp,
  FlaskConical,
  Plus,
  Paperclip,
  FileText,
  X,
} from "lucide-react";

export interface DatasetOption {
  id: string;
  name: string;
  path: string;
  promptCount?: number;
  type: "user" | "template";
}

export interface AttachedFile {
  id: string;
  file: File;
  type: "image" | "document";
  preview?: string;
}

export interface PlaygroundInputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onRunEval?: () => void;
  placeholder?: string;
  disabled?: boolean;
  canSend?: boolean;
  isLoading?: boolean;
  showEvalButton?: boolean;
  attachedFiles?: AttachedFile[];
  onFilesChange?: (files: AttachedFile[]) => void;
}

const PlaygroundInputBar = forwardRef<HTMLTextAreaElement, PlaygroundInputBarProps>(
  (
    {
      value,
      onChange,
      onSend,
      onRunEval,
      placeholder = "Message...",
      disabled = false,
      canSend = false,
      isLoading = false,
      showEvalButton = true,
      attachedFiles = [],
      onFilesChange,
    },
    ref
  ) => {
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const menuOpen = Boolean(menuAnchor);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
      setMenuAnchor(event.currentTarget);
    };

    const handleMenuClose = () => {
      setMenuAnchor(null);
    };

    const handleFileUpload = () => {
      handleMenuClose();
      fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const newFiles: AttachedFile[] = Array.from(files).map((file) => {
        const isImage = file.type.startsWith("image/");
        const attachedFile: AttachedFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          type: isImage ? "image" : "document",
        };

        if (isImage) {
          attachedFile.preview = URL.createObjectURL(file);
        }

        return attachedFile;
      });

      onFilesChange?.([...attachedFiles, ...newFiles]);
      event.target.value = "";
    };

    const handleRemoveFile = (fileId: string) => {
      const fileToRemove = attachedFiles.find((f) => f.id === fileId);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      onFilesChange?.(attachedFiles.filter((f) => f.id !== fileId));
    };

    const hasAttachments = attachedFiles.length > 0;

    return (
      <Box sx={{ width: "100%", maxWidth: 720 }}>
        {/* Attached Files Preview */}
        {hasAttachments && (
          <Stack direction="row" gap={1} sx={{ mb: 1.5, flexWrap: "wrap" }}>
            {attachedFiles.map((file) => (
              <Chip
                key={file.id}
                label={
                  <Stack direction="row" alignItems="center" gap={0.75}>
                    {file.type === "image" && file.preview ? (
                      <Box
                        component="img"
                        src={file.preview}
                        alt={file.file.name}
                        sx={{ width: 20, height: 20, borderRadius: "4px", objectFit: "cover" }}
                      />
                    ) : (
                      <FileText size={14} />
                    )}
                    <Typography variant="caption" sx={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {file.file.name}
                    </Typography>
                  </Stack>
                }
                onDelete={() => handleRemoveFile(file.id)}
                deleteIcon={<X size={14} />}
                size="small"
                sx={{
                  bgcolor: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  height: 32,
                  "& .MuiChip-label": { px: 1 },
                  "& .MuiChip-deleteIcon": { color: "#9ca3af", "&:hover": { color: "#dc2626" } },
                }}
              />
            ))}
          </Stack>
        )}

        {/* Input Bar */}
        <Box sx={{ position: "relative" }}>
          <TextField
            inputRef={ref}
            fullWidth
            multiline
            maxRows={6}
            minRows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            sx={{
              "& .MuiOutlinedInput-root": {
                fontSize: 15,
                bgcolor: "#fff",
                borderRadius: "24px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
                pl: 1.5,
                pr: 7,
                "& fieldset": { border: "none" },
                "&:hover": { borderColor: "#d1d5db" },
                "&.Mui-focused": {
                  borderColor: "#13715B",
                  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08), 0 0 0 2px rgba(19, 113, 91, 0.1)",
                },
                "&.Mui-disabled": { bgcolor: "#f9fafb", borderColor: "#e5e7eb" },
              },
              "& .MuiOutlinedInput-input": {
                py: 1.75,
                px: 1,
                lineHeight: 1.5,
              },
            }}
            InputProps={{
              startAdornment: (
                <Stack direction="row" alignItems="center" gap={0.5} sx={{ mr: 1 }}>
                  {/* Add Files Button */}
                  <Tooltip title="Add photos & files">
                    <IconButton
                      onClick={handleMenuClick}
                      disabled={disabled}
                      size="small"
                      sx={{
                        width: 32,
                        height: 32,
                        color: menuOpen ? "#fff" : "#6b7280",
                        bgcolor: menuOpen ? "#13715B" : "transparent",
                        borderRadius: "50%",
                        transition: "all 0.15s",
                        "&:hover": { 
                          bgcolor: menuOpen ? "#0f5c4a" : "#f3f4f6",
                          color: menuOpen ? "#fff" : "#374151",
                        },
                        "&:disabled": { color: "#d1d5db" },
                      }}
                    >
                      <Plus size={18} strokeWidth={2} />
                    </IconButton>
                  </Tooltip>

                  {/* Run Evaluation Button */}
                  {showEvalButton && (
                    <Tooltip title="Run evaluation with dataset">
                      <IconButton
                        onClick={onRunEval}
                        disabled={disabled}
                        size="small"
                        sx={{
                          width: 32,
                          height: 32,
                          color: "#6b7280",
                          bgcolor: "transparent",
                          borderRadius: "50%",
                          transition: "all 0.15s",
                          "&:hover": { 
                            bgcolor: "#fff7ed",
                            color: "#ea580c",
                          },
                          "&:disabled": { color: "#d1d5db" },
                        }}
                      >
                        <FlaskConical size={17} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              ),
            }}
          />

          {/* Send Button */}
          <IconButton
            onClick={onSend}
            disabled={!canSend || isLoading}
            sx={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              width: 36,
              height: 36,
              bgcolor: canSend && !isLoading ? "#13715B" : "#e5e7eb",
              color: canSend && !isLoading ? "#fff" : "#9ca3af",
              borderRadius: "50%",
              transition: "all 0.2s",
              "&:hover": {
                bgcolor: canSend && !isLoading ? "#0f5c4a" : "#e5e7eb",
                transform: canSend && !isLoading ? "translateY(-50%) scale(1.05)" : "translateY(-50%)",
              },
              "&:disabled": { bgcolor: "#e5e7eb", color: "#9ca3af" },
            }}
          >
            {isLoading ? (
              <CircularProgress size={16} sx={{ color: "#9ca3af" }} />
            ) : (
              <ArrowUp size={18} strokeWidth={2.5} />
            )}
          </IconButton>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv,.json,.xml,.html"
            multiple
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </Box>

        {/* Add Files Menu */}
        <Menu
          anchorEl={menuAnchor}
          open={menuOpen}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: "top", horizontal: "left" }}
          transformOrigin={{ vertical: "bottom", horizontal: "left" }}
          PaperProps={{
            sx: {
              mt: -1,
              minWidth: 220,
              borderRadius: "12px",
              boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
              border: "1px solid #e5e7eb",
            },
          }}
        >
          <MenuItem
            onClick={handleFileUpload}
            sx={{ py: 1.5, px: 2, "&:hover": { bgcolor: "#f3f4f6" } }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Paperclip size={18} color="#13715B" />
            </ListItemIcon>
            <ListItemText
              primary="Add photos & files"
              secondary="Images, PDFs, documents"
              primaryTypographyProps={{ fontSize: 14, fontWeight: 500, color: "#111827" }}
              secondaryTypographyProps={{ fontSize: 11, color: "#6b7280" }}
            />
          </MenuItem>
        </Menu>
      </Box>
    );
  }
);

PlaygroundInputBar.displayName = "PlaygroundInputBar";

export default PlaygroundInputBar;
