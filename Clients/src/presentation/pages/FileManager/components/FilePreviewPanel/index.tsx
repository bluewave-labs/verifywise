/**
 * @fileoverview FilePreviewPanel Component
 *
 * A slide-out panel for quick preview of files.
 * Supports preview for PDFs, images, and text files.
 *
 * @module presentation/pages/FileManager/components/FilePreviewPanel
 */

import React, { useState, useEffect } from "react";
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  CircularProgress,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { FileMetadata } from "../../../../../application/repository/file.repository";
import { getFilePreview, downloadFileFromManager } from "../../../../../application/repository/file.repository";
import StatusBadge from "../StatusBadge";

interface FilePreviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileMetadata | null;
  onEdit?: (file: FileMetadata) => void;
  onDownload?: (file: FileMetadata) => void;
}

type PreviewType = "pdf" | "image" | "text" | "unsupported";

const getPreviewType = (mimetype?: string): PreviewType => {
  if (!mimetype) return "unsupported";

  if (mimetype === "application/pdf") return "pdf";
  if (mimetype.startsWith("image/")) return "image";
  if (
    mimetype.startsWith("text/") ||
    mimetype === "application/json" ||
    mimetype === "application/xml"
  ) {
    return "text";
  }

  return "unsupported";
};

const getFileIcon = (mimetype?: string) => {
  const type = getPreviewType(mimetype);
  switch (type) {
    case "pdf":
      return <PictureAsPdfIcon sx={{ fontSize: 48, color: "#EF4444" }} />;
    case "image":
      return <ImageIcon sx={{ fontSize: 48, color: "#3B82F6" }} />;
    default:
      return <DescriptionIcon sx={{ fontSize: 48, color: "#6B7280" }} />;
  }
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "Unknown date";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * FilePreviewPanel Component
 */
export const FilePreviewPanel: React.FC<FilePreviewPanelProps> = ({
  isOpen,
  onClose,
  file,
  onEdit,
  onDownload,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewType = file ? getPreviewType(file.mimetype) : "unsupported";

  // Load preview when file changes
  useEffect(() => {
    if (!isOpen || !file || previewType === "unsupported") {
      setPreviewUrl(null);
      setPreviewText(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const loadPreview = async () => {
      try {
        setLoading(true);
        setError(null);

        const blob = await getFilePreview({ id: file.id });

        if (cancelled) return;

        if (previewType === "text") {
          const text = await blob.text();
          setPreviewText(text);
          setPreviewUrl(null);
        } else {
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          setPreviewText(null);
        }
      } catch (err: any) {
        if (cancelled) return;

        if (err?.response?.status === 413) {
          setError("File is too large for preview");
        } else {
          setError("Failed to load preview");
        }
        console.error("Error loading preview:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadPreview();

    return () => {
      cancelled = true;
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen, file?.id, previewType]);

  const handleDownload = async () => {
    if (!file) return;

    if (onDownload) {
      onDownload(file);
      return;
    }

    // Default download behavior
    try {
      const blob = await downloadFileFromManager({ id: file.id });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading file:", err);
    }
  };

  const renderPreview = () => {
    if (loading) {
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 300,
          }}
        >
          <CircularProgress size={40} sx={{ color: "#13715B" }} />
        </Box>
      );
    }

    if (error) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: 300,
            backgroundColor: "#F9FAFB",
            borderRadius: "4px",
            border: "1px solid #E0E4E9",
          }}
        >
          {getFileIcon(file?.mimetype)}
          <Typography sx={{ mt: 2, color: "#667085", fontSize: 13 }}>
            {error}
          </Typography>
        </Box>
      );
    }

    if (previewType === "unsupported") {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: 300,
            backgroundColor: "#F9FAFB",
            borderRadius: "4px",
            border: "1px solid #E0E4E9",
          }}
        >
          {getFileIcon(file?.mimetype)}
          <Typography sx={{ mt: 2, color: "#667085", fontSize: 13 }}>
            Preview not available for this file type
          </Typography>
          <Typography sx={{ mt: 1, color: "#98A2B3", fontSize: 12 }}>
            Download the file to view its contents
          </Typography>
        </Box>
      );
    }

    if (previewType === "pdf" && previewUrl) {
      return (
        <Box
          component="iframe"
          src={previewUrl}
          sx={{
            width: "100%",
            height: 400,
            border: "1px solid #E0E4E9",
            borderRadius: "4px",
          }}
          title={file?.filename}
        />
      );
    }

    if (previewType === "image" && previewUrl) {
      return (
        <Box
          component="img"
          src={previewUrl}
          alt={file?.filename}
          sx={{
            width: "100%",
            maxHeight: 400,
            objectFit: "contain",
            border: "1px solid #E0E4E9",
            borderRadius: "4px",
            backgroundColor: "#F9FAFB",
          }}
        />
      );
    }

    if (previewType === "text" && previewText) {
      return (
        <Box
          component="pre"
          sx={{
            width: "100%",
            maxHeight: 400,
            overflow: "auto",
            padding: 2,
            backgroundColor: "#F9FAFB",
            border: "1px solid #E0E4E9",
            borderRadius: "4px",
            fontSize: 12,
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {previewText}
        </Box>
      );
    }

    return null;
  };

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 450 },
          maxWidth: "100%",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid #E0E4E9",
        }}
      >
        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 600,
            color: "#101828",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "70%",
          }}
        >
          {file?.filename || "File preview"}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {onEdit && file && (
            <IconButton
              onClick={() => onEdit(file)}
              size="small"
              sx={{ color: "#667085" }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton
            onClick={handleDownload}
            size="small"
            sx={{ color: "#667085" }}
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={onClose} size="small" sx={{ color: "#667085" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      {file && (
        <Box sx={{ padding: "20px", overflow: "auto" }}>
          {/* Preview */}
          <Box sx={{ mb: 3 }}>{renderPreview()}</Box>

          <Divider sx={{ my: 3 }} />

          {/* File details */}
          <Stack spacing={2}>
            <Typography
              sx={{ fontSize: 14, fontWeight: 600, color: "#344054" }}
            >
              File details
            </Typography>

            {/* Size & Date */}
            <Box sx={{ display: "flex", gap: 4 }}>
              <Box>
                <Typography sx={{ fontSize: 12, color: "#667085" }}>
                  Size
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#344054" }}>
                  {formatFileSize(file.size)}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, color: "#667085" }}>
                  Uploaded
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#344054" }}>
                  {formatDate(file.upload_date)}
                </Typography>
              </Box>
            </Box>

            {/* Uploader */}
            {file.uploader_name && (
              <Box>
                <Typography sx={{ fontSize: 12, color: "#667085" }}>
                  Uploaded by
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#344054" }}>
                  {file.uploader_name} {file.uploader_surname}
                </Typography>
              </Box>
            )}

            {/* Status */}
            {file.review_status && (
              <Box>
                <Typography sx={{ fontSize: 12, color: "#667085", mb: 0.5 }}>
                  Status
                </Typography>
                <StatusBadge status={file.review_status} />
              </Box>
            )}

            {/* Version */}
            {file.version && (
              <Box>
                <Typography sx={{ fontSize: 12, color: "#667085" }}>
                  Version
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#344054" }}>
                  v{file.version}
                </Typography>
              </Box>
            )}

            {/* Expiry Date */}
            {file.expiry_date && (
              <Box>
                <Typography sx={{ fontSize: 12, color: "#667085" }}>
                  Expiry date
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#344054" }}>
                  {formatDate(file.expiry_date)}
                </Typography>
              </Box>
            )}

            {/* Tags */}
            {file.tags && file.tags.length > 0 && (
              <Box>
                <Typography sx={{ fontSize: 12, color: "#667085", mb: 1 }}>
                  Tags
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {file.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{
                        backgroundColor: "#F2F4F7",
                        color: "#344054",
                        fontSize: "11px",
                        height: 22,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Description */}
            {file.description && (
              <Box>
                <Typography sx={{ fontSize: 12, color: "#667085" }}>
                  Description
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#344054" }}>
                  {file.description}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      )}
    </Drawer>
  );
};

export default FilePreviewPanel;
