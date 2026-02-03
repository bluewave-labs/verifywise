/**
 * @fileoverview FileMetadataEditor Component
 *
 * A modal dialog for editing file metadata (tags, status, version, expiry date, description).
 *
 * @module presentation/pages/FileManager/components/FileMetadataEditor
 */

import React, { useState, useEffect } from "react";
import {
  Stack,
  Box,
  Typography,
  TextField,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
} from "@mui/material";
import StandardModal from "../../../../components/Modals/StandardModal";
import {
  FileMetadata,
  ReviewStatus,
  UpdateFileMetadataInput,
} from "../../../../../application/repository/file.repository";
import StatusBadge from "../StatusBadge";

interface FileMetadataEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (updates: UpdateFileMetadataInput) => Promise<void>;
  file: FileMetadata | null;
  isSubmitting?: boolean;
}

const REVIEW_STATUS_OPTIONS: { value: ReviewStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "pending_review", label: "Pending review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];

/**
 * FileMetadataEditor Component
 */
export const FileMetadataEditor: React.FC<FileMetadataEditorProps> = ({
  isOpen,
  onClose,
  onSubmit,
  file,
  isSubmitting,
}) => {
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("draft");
  const [version, setVersion] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens or file changes
  useEffect(() => {
    if (isOpen && file) {
      setTags(file.tags || []);
      setTagInput("");
      setReviewStatus(file.review_status || "draft");
      setVersion(file.version || "1.0");
      setExpiryDate(file.expiry_date || "");
      setDescription(file.description || "");
      setErrors({});
    }
  }, [isOpen, file]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate version format (X.Y or X.Y.Z)
    if (version && !/^[0-9]+\.[0-9]+(\.[0-9]+)?$/.test(version)) {
      newErrors.version = "Version must be in X.Y or X.Y.Z format";
    }

    // Validate expiry date format
    if (expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
      newErrors.expiryDate = "Date must be in YYYY-MM-DD format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const updates: UpdateFileMetadataInput = {
      tags,
      review_status: reviewStatus,
      version: version || undefined,
      expiry_date: expiryDate || null,
      description: description || null,
    };

    await onSubmit(updates);
  };

  if (!file) return null;

  return (
    <StandardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit file metadata"
      description={`Update metadata for "${file.filename}"`}
      onSubmit={handleSubmit}
      submitButtonText="Save changes"
      isSubmitting={isSubmitting}
      maxWidth="500px"
    >
      <Stack spacing={3}>
        {/* Tags */}
        <Stack spacing={1}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 500,
              color: "#344054",
            }}
          >
            Tags
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                onDelete={() => handleRemoveTag(tag)}
                sx={{
                  backgroundColor: "#F2F4F7",
                  color: "#344054",
                  fontSize: "12px",
                  "& .MuiChip-deleteIcon": {
                    color: "#667085",
                    "&:hover": {
                      color: "#344054",
                    },
                  },
                }}
              />
            ))}
          </Box>
          <TextField
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInputKeyDown}
            onBlur={handleAddTag}
            placeholder="Type a tag and press Enter"
            fullWidth
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "4px",
                "& fieldset": {
                  borderColor: "#D0D5DD",
                },
                "&:hover fieldset": {
                  borderColor: "#98A2B3",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#13715B",
                },
              },
              "& .MuiInputBase-input": {
                fontSize: 13,
                padding: "10px 12px",
              },
            }}
          />
        </Stack>

        {/* Review Status */}
        <Stack spacing={1}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 500,
              color: "#344054",
            }}
          >
            Review status
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}
              input={<OutlinedInput />}
              sx={{
                borderRadius: "4px",
                fontSize: 13,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#D0D5DD",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#98A2B3",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#13715B",
                },
              }}
              renderValue={(value) => <StatusBadge status={value} size="small" />}
            >
              {REVIEW_STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <StatusBadge status={option.value} size="small" />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Version */}
        <Stack spacing={1}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 500,
              color: "#344054",
            }}
          >
            Version
          </Typography>
          <TextField
            value={version}
            onChange={(e) => {
              setVersion(e.target.value);
              if (errors.version) {
                setErrors((prev) => ({ ...prev, version: "" }));
              }
            }}
            placeholder="1.0"
            fullWidth
            size="small"
            error={!!errors.version}
            helperText={errors.version || "Format: X.Y or X.Y.Z (e.g., 1.0 or 2.1.3)"}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "4px",
                "& fieldset": {
                  borderColor: errors.version ? "#EF4444" : "#D0D5DD",
                },
                "&:hover fieldset": {
                  borderColor: errors.version ? "#EF4444" : "#98A2B3",
                },
                "&.Mui-focused fieldset": {
                  borderColor: errors.version ? "#EF4444" : "#13715B",
                },
              },
              "& .MuiInputBase-input": {
                fontSize: 13,
                padding: "10px 12px",
              },
            }}
          />
        </Stack>

        {/* Expiry Date */}
        <Stack spacing={1}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 500,
              color: "#344054",
            }}
          >
            Expiry date
          </Typography>
          <TextField
            type="date"
            value={expiryDate}
            onChange={(e) => {
              setExpiryDate(e.target.value);
              if (errors.expiryDate) {
                setErrors((prev) => ({ ...prev, expiryDate: "" }));
              }
            }}
            fullWidth
            size="small"
            error={!!errors.expiryDate}
            helperText={errors.expiryDate || "Optional: Set when the document needs review"}
            InputLabelProps={{ shrink: true }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "4px",
                "& fieldset": {
                  borderColor: errors.expiryDate ? "#EF4444" : "#D0D5DD",
                },
                "&:hover fieldset": {
                  borderColor: errors.expiryDate ? "#EF4444" : "#98A2B3",
                },
                "&.Mui-focused fieldset": {
                  borderColor: errors.expiryDate ? "#EF4444" : "#13715B",
                },
              },
              "& .MuiInputBase-input": {
                fontSize: 13,
                padding: "10px 12px",
              },
            }}
          />
        </Stack>

        {/* Description */}
        <Stack spacing={1}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 500,
              color: "#344054",
            }}
          >
            Description
          </Typography>
          <TextField
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter file description (optional)"
            fullWidth
            multiline
            rows={3}
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "4px",
                "& fieldset": {
                  borderColor: "#D0D5DD",
                },
                "&:hover fieldset": {
                  borderColor: "#98A2B3",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#13715B",
                },
              },
              "& .MuiInputBase-input": {
                fontSize: 13,
              },
            }}
          />
        </Stack>

        {/* File info */}
        <Box
          sx={{
            padding: "12px",
            backgroundColor: "#F9FAFB",
            borderRadius: "4px",
            border: "1px solid #E0E4E9",
          }}
        >
          <Typography sx={{ fontSize: 12, color: "#667085" }}>
            Editing metadata for:{" "}
            <strong style={{ color: "#344054" }}>{file.filename}</strong>
          </Typography>
          {file.uploader_name && (
            <Typography sx={{ fontSize: 12, color: "#667085", mt: 0.5 }}>
              Uploaded by: {file.uploader_name} {file.uploader_surname}
            </Typography>
          )}
        </Box>
      </Stack>
    </StandardModal>
  );
};

export default FileMetadataEditor;
