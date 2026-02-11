/**
 * @fileoverview FileMetadataEditor Component
 *
 * A modal dialog for editing file metadata (tags, status, version, expiry date, description).
 * Uses VerifyWise components for consistent styling.
 *
 * @module presentation/pages/FileManager/components/FileMetadataEditor
 */

import React, { useState, useEffect } from "react";
import { Stack, Box, Typography } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import StandardModal from "../../../../components/Modals/StandardModal";
import {
  FileMetadata,
  ReviewStatus,
  UpdateFileMetadataInput,
} from "../../../../../application/repository/file.repository";
import Field from "../../../../components/Inputs/Field";
import Select from "../../../../components/Inputs/Select";
import DatePicker from "../../../../components/Inputs/Datepicker";
import ChipInput from "../../../../components/Inputs/ChipInput";
import StatusBadge from "../StatusBadge";

interface FileMetadataEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (updates: UpdateFileMetadataInput) => Promise<void>;
  file: FileMetadata | null;
  isSubmitting?: boolean;
}

const REVIEW_STATUS_OPTIONS = [
  { _id: "draft", name: "Draft" },
  { _id: "pending_review", name: "Pending review" },
  { _id: "approved", name: "Approved" },
  { _id: "rejected", name: "Rejected" },
  { _id: "expired", name: "Expired" },
  { _id: "superseded", name: "Superseded" },
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
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("draft");
  const [version, setVersion] = useState("");
  const [expiryDate, setExpiryDate] = useState<Dayjs | null>(null);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens or file changes
  useEffect(() => {
    if (isOpen && file) {
      setTags(file.tags || []);
      setReviewStatus(file.review_status || "draft");
      setVersion(file.version || "1.0");
      setExpiryDate(file.expiry_date ? dayjs(file.expiry_date) : null);
      setDescription(file.description || "");
      setErrors({});
    }
  }, [isOpen, file]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate version format (X.Y or X.Y.Z)
    if (version && !/^[0-9]+\.[0-9]+(\.[0-9]+)?$/.test(version)) {
      newErrors.version = "Version must be in X.Y or X.Y.Z format";
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
      expiry_date: expiryDate ? expiryDate.format("YYYY-MM-DD") : null,
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
        <ChipInput
          id="file-tags"
          label="Tags"
          value={tags}
          onChange={setTags}
          placeholder="Type a tag and press Enter"
        />

        {/* Review Status */}
        <Select
          id="review-status"
          label="Review status"
          value={reviewStatus}
          items={REVIEW_STATUS_OPTIONS}
          onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}
          customRenderValue={(value) => {
            const status = value as ReviewStatus;
            return <StatusBadge status={status} size="small" />;
          }}
        />

        {/* Version */}
        <Field
          id="version"
          label="Version"
          value={version}
          onChange={(e) => {
            setVersion(e.target.value);
            if (errors.version) {
              setErrors((prev) => ({ ...prev, version: "" }));
            }
          }}
          placeholder="1.0"
          error={errors.version}
          helperText="Format: X.Y or X.Y.Z (e.g., 1.0 or 2.1.3)"
        />

        {/* Expiry Date */}
        <DatePicker
          label="Expiry date"
          date={expiryDate}
          handleDateChange={(value) => setExpiryDate(value)}
          isOptional
          optionalLabel="(optional)"
        />

        {/* Description */}
        <Field
          id="description"
          type="description"
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter file description"
          isOptional
          optionalLabel="(optional)"
          rows={3}
        />

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
