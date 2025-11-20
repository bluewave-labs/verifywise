import React, { useState, useRef, useCallback } from "react";
import {
  Stack,
  Typography,
  IconButton,
  Box,
  LinearProgress,
  useTheme,
  SxProps,
  Theme,
  Paper,
  Chip,
  Avatar,
  Fade,
  Backdrop,
} from "@mui/material";
import {
  Upload as UploadIcon,
  Trash2 as DeleteIcon,
  Download as DownloadIcon,
  FileText,
  Eye as EyeIcon,
  Image as ImageIcon,
  File as DefaultFileIcon,
  CheckCircle as CheckIcon,
  AlertCircle as ErrorIcon,
  Clock as PendingIcon,
} from "lucide-react";
import CustomizableButton from "../Button/CustomizableButton";
import singleTheme from "../../themes/v1SingleTheme";

// Types
export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

export interface UploaderProps {
  /** Acceptable file types (e.g., ['image/*', '.pdf', '.doc']) */
  acceptedTypes?: string[];
  /** Maximum file size in bytes (default: 10MB) */
  maxFileSize?: number;
  /** Maximum number of files allowed */
  maxFiles?: number;
  /** Whether multiple files can be selected */
  multiple?: boolean;
  /** Callback when files are successfully uploaded */
  onUploadComplete?: (files: UploadFile[]) => void;
  /** Callback when file upload progresses */
  onUploadProgress?: (file: UploadFile, progress: number) => void;
  /** Callback when upload fails */
  onUploadError?: (file: UploadFile, error: string) => void;
  /** Custom styles */
  sx?: SxProps<Theme>;
  /** Whether to show file preview */
  showPreview?: boolean;
  /** Upload endpoint URL */
  uploadUrl?: string;
  /** Additional headers for upload request */
  uploadHeaders?: Record<string, string>;
}

// Default file type configurations
const DEFAULT_ACCEPTED_TYPES = [
  'image/*',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.csv',
  '.zip',
  '.rar'
];

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const generateFileId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const isFileTypeAccepted = (file: File, acceptedTypes: string[]): boolean => {
  if (acceptedTypes.length === 0) return true;

  return acceptedTypes.some(type => {
    if (type.startsWith('.')) {
      return file.name.toLowerCase().endsWith(type.toLowerCase());
    }
    if (type.includes('/*')) {
      const mainType = type.split('/')[0];
      return file.type.startsWith(mainType + '/');
    }
    return file.type === type;
  });
};

const Uploader: React.FC<UploaderProps> = ({
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  maxFiles = 10,
  multiple = true,
  onUploadComplete,
  onUploadProgress,
  onUploadError,
  sx,
  showPreview = true,
  uploadUrl = '/api/upload',
  uploadHeaders = {},
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragAreaRef = useRef<HTMLDivElement>(null);

  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    file: UploadFile | null;
  }>({ isOpen: false, file: null });

  // Handle drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, [files, maxFiles]);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [files, maxFiles]);

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    if (type.includes('pdf')) return FileText;
    return DefaultFileIcon;
  };

  // Get status chip props
  const getStatusChip = (file: UploadFile) => {
    switch (file.status) {
      case 'completed':
        return {
          label: 'Completed',
          icon: CheckIcon,
          backgroundColor: '#ECFDF3',
          color: '#027A48',
        };
      case 'uploading':
        return {
          label: `Uploading ${file.progress}%`,
          icon: PendingIcon,
          backgroundColor: '#F0F9FF',
          color: '#026AA2',
        };
      case 'error':
        return {
          label: file.error || 'Failed',
          icon: ErrorIcon,
          backgroundColor: '#FEF3F2',
          color: '#DC2626',
        };
      default:
        return {
          label: 'Pending',
          icon: PendingIcon,
          backgroundColor: '#F9FAFB',
          color: '#6B7280',
        };
    }
  };

  // Process files
  const handleFiles = useCallback((newFiles: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Check file limits and validation
    newFiles.forEach(file => {
      // Check file count limit
      if (files.length + validFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`${file.name} exceeds maximum size of ${formatFileSize(maxFileSize)}`);
        return;
      }

      // Check file type
      if (!isFileTypeAccepted(file, acceptedTypes)) {
        errors.push(`${file.name} is not a supported file type`);
        return;
      }

      // Check for duplicates
      const isDuplicate = files.some(existingFile =>
        existingFile.name === file.name && existingFile.size === file.size
      );

      if (isDuplicate) {
        errors.push(`${file.name} has already been added`);
        return;
      }

      validFiles.push(file);
    });

    // Show errors if any
    if (errors.length > 0) {
      console.error('File validation errors:', errors);
      // You could implement a toast/notification system here
    }

    // Add valid files
    if (validFiles.length > 0) {
      const uploadFiles: UploadFile[] = validFiles.map(file => ({
        id: generateFileId(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: 'uploading' as const,
      }));

      setFiles(prev => [...prev, ...uploadFiles]);

      // Start upload for each file
      uploadFiles.forEach(fileToUpload => {
        uploadFile(fileToUpload);
      });
    }
  }, [files, maxFiles, maxFileSize, acceptedTypes]);

  // Upload file simulation
  const uploadFile = useCallback(async (uploadFile: UploadFile) => {
    try {
      const formData = new FormData();
      formData.append('file', uploadFile.file);

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);

          setFiles(prev => prev.map(f =>
            f.id === uploadFile.id ? { ...f, progress } : f
          ));

          onUploadProgress?.(uploadFile, progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            const url = response.url || `${uploadUrl}/${uploadFile.id}`;

            setFiles(prev => prev.map(f =>
              f.id === uploadFile.id
                ? { ...f, status: 'completed', progress: 100, url }
                : f
            ));
          } catch {
            // If JSON parsing fails, still mark as completed
            setFiles(prev => prev.map(f =>
              f.id === uploadFile.id
                ? { ...f, status: 'completed', progress: 100, url: `${uploadUrl}/${uploadFile.id}` }
                : f
            ));
          }
        } else {
          throw new Error(`Upload failed with status ${xhr.status}`);
        }
      });

      xhr.addEventListener('error', () => {
        const error = 'Network error during upload';
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'error', error }
            : f
        ));
        onUploadError?.(uploadFile, error);
      });

      // Configure and send request
      xhr.open('POST', uploadUrl, true);

      // Add headers
      Object.entries(uploadHeaders).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.send(formData);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setFiles(prev => prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, status: 'error', error: errorMessage }
          : f
      ));
      onUploadError?.(uploadFile, errorMessage);
    }
  }, [uploadUrl, uploadHeaders, onUploadProgress, onUploadError]);

  // Handle file actions
  const handleDeleteFile = useCallback((file: UploadFile) => {
    setDeleteModal({ isOpen: true, file });
  }, []);

  const confirmDeleteFile = useCallback(() => {
    if (deleteModal.file) {
      setFiles(prev => prev.filter(f => f.id !== deleteModal.file!.id));
      setDeleteModal({ isOpen: false, file: null });
    }
  }, [deleteModal]);

  const handleDownloadFile = useCallback((file: UploadFile) => {
    if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Create object URL for local file
      const url = URL.createObjectURL(file.file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, []);

  const handlePreviewFile = useCallback((file: UploadFile) => {
    if (file.url) {
      window.open(file.url, '_blank');
    } else if (file.file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file.file);
      window.open(url, '_blank');
      // Note: In a real app, you might want to revoke this URL after some time
    }
  }, []);

  // Save all uploaded files
  const handleSave = useCallback(() => {
    const completedFiles = files.filter(f => f.status === 'completed');
    if (completedFiles.length > 0) {
      onUploadComplete?.(completedFiles);
    }
  }, [files, onUploadComplete]);

  // Clear all files
  const handleClearAll = useCallback(() => {
    setFiles([]);
  }, []);

  // Check if all files are completed
  const allCompleted = files.length > 0 && files.every(f => f.status === 'completed');

  // Calculate overall progress
  const overallProgress = files.length > 0
    ? Math.round(files.reduce((sum, f) => sum + f.progress, 0) / files.length)
    : 0;

  // Modern drop zone styles
  const dropZoneStyles: SxProps<Theme> = {
    position: 'relative',
    borderRadius: '12px',
    background: isDragging
      ? 'linear-gradient(135deg, rgba(19, 113, 91, 0.05) 0%, rgba(19, 113, 91, 0.1) 100%)'
      : 'linear-gradient(135deg, #FFFFFF 0%, #FCFCFD 100%)',
    border: `2px dashed ${isDragging ? singleTheme.buttons.primary.contained.backgroundColor : theme.palette.border.light}`,
    boxShadow: isDragging
      ? '0px 8px 24px rgba(19, 113, 91, 0.15), 0px 2px 8px rgba(19, 113, 91, 0.1)'
      : '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    overflow: 'hidden',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    p: 4,
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: isDragging
        ? 'linear-gradient(135deg, rgba(19, 113, 91, 0.03) 0%, rgba(19, 113, 91, 0.08) 100%)'
        : 'transparent',
      opacity: 0,
      transition: 'opacity 0.3s ease',
    },
    '&:hover': {
      borderColor: singleTheme.buttons.primary.contained.backgroundColor,
      backgroundColor: 'rgba(19, 113, 91, 0.02)',
      '&::before': { opacity: 1 },
    },
  };

  // Modern file card styles
  const fileCardStyles: SxProps<Theme> = {
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%)',
    border: `1px solid ${theme.palette.border.light}`,
    boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
    mb: 2,
    '&:hover': {
      backgroundColor: 'rgba(19, 113, 91, 0.02)',
    },
  };

  return (
    <Fade in timeout={300}>
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 800,
          mx: 'auto',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FBFBFB 100%)',
          border: `1px solid ${theme.palette.border.light}`,
          boxShadow: '0px 4px 24px -4px rgba(16, 24, 40, 0.08), 0px 2px 8px -2px rgba(16, 24, 40, 0.04)',
          overflow: 'hidden',
          ...sx,
        }}
      >
        {/* Header */}
        <Box sx={{ p: 4, borderBottom: `1px solid ${theme.palette.border.light}` }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                backgroundColor: `${singleTheme.buttons.primary.contained.backgroundColor}15`,
                color: singleTheme.buttons.primary.contained.backgroundColor,
                width: 48,
                height: 48,
              }}
            >
              <UploadIcon size={24} />
            </Avatar>
            <Box flex={1}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 0.5 }}>
                Modern File Uploader
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Drag & drop files or click to browse • Max {formatFileSize(maxFileSize)} per file
              </Typography>
            </Box>
            {files.length > 0 && (
              <Chip
                label={`${files.length} file${files.length !== 1 ? 's' : ''}`}
                sx={{
                  backgroundColor: `${singleTheme.buttons.primary.contained.backgroundColor}10`,
                  color: singleTheme.buttons.primary.contained.backgroundColor,
                  fontWeight: 500,
                }}
              />
            )}
          </Stack>
        </Box>

        {/* Upload Area */}
        <Box sx={{ p: 4 }}>
          <Box
            ref={dragAreaRef}
            sx={dropZoneStyles}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Fade in timeout={200}>
              <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <Avatar
                  sx={{
                    backgroundColor: isDragging
                      ? `${singleTheme.buttons.primary.contained.backgroundColor}20`
                      : `${singleTheme.buttons.primary.contained.backgroundColor}10`,
                    color: isDragging
                      ? singleTheme.buttons.primary.contained.backgroundColor
                      : theme.palette.text.secondary,
                    width: 64,
                    height: 64,
                    mb: 2,
                    mx: 'auto',
                  }}
                >
                  <UploadIcon size={32} />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
                  {isDragging ? 'Drop files here' : (
                    <>
                      <Typography component="span" color={singleTheme.buttons.primary.contained.backgroundColor}>
                        Click to upload
                      </Typography>
                      {' or drag and drop'}
                    </>
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {multiple ? `Up to ${maxFiles} files` : 'Single file upload'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7 }}>
                  Supported formats: {acceptedTypes.slice(0, 4).join(', ')}
                  {acceptedTypes.length > 4 && ` +${acceptedTypes.length - 4} more`}
                </Typography>
              </Box>
            </Fade>
            <input
              ref={fileInputRef}
              type="file"
              multiple={multiple}
              accept={acceptedTypes.join(',')}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </Box>
        </Box>

        {/* Overall Progress */}
        {files.length > 0 && (
          <Fade in timeout={300}>
            <Box sx={{ px: 4, pb: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Overall Progress
                </Typography>
                <Typography variant="body2" color={singleTheme.buttons.primary.contained.backgroundColor} sx={{ fontWeight: 600 }}>
                  {overallProgress}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={overallProgress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#F3F4F6',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: singleTheme.buttons.primary.contained.backgroundColor,
                    borderRadius: 4,
                    transition: 'all 0.3s ease',
                  },
                }}
              />
            </Box>
          </Fade>
        )}

        {/* File List */}
        {files.length > 0 && (
          <Fade in timeout={400}>
            <Box sx={{ px: 4, pb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 3, color: theme.palette.text.primary }}>
                Files ({files.length})
              </Typography>
              <Stack spacing={2}>
                {files.map((file, index) => {
                  const FileIconComponent = getFileIcon(file.type);
                  const statusChip = getStatusChip(file);
                  const StatusIcon = statusChip.icon;

                  return (
                    <Fade key={file.id} in timeout={300 + index * 100}>
                      <Paper
                        variant="outlined"
                        sx={fileCardStyles}
                      >
                        <Box sx={{ p: 3 }}>
                          <Stack direction="row" alignItems="center" spacing={3}>
                            {/* File Icon */}
                            <Avatar
                              sx={{
                                backgroundColor: file.type.startsWith('image/')
                                  ? '#FEF3C7'
                                  : file.type.includes('pdf')
                                  ? '#DBEAFE'
                                  : '#F3F4F6',
                                color: file.type.startsWith('image/')
                                  ? '#D97706'
                                  : file.type.includes('pdf')
                                  ? '#2563EB'
                                  : '#6B7280',
                                width: 48,
                                height: 48,
                                flexShrink: 0,
                              }}
                            >
                              <FileIconComponent size={24} />
                            </Avatar>

                            {/* File Info */}
                            <Box flex={1} minWidth={0}>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 500,
                                  color: theme.palette.text.primary,
                                  mb: 0.5,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {file.name}
                              </Typography>
                              <Stack direction="row" alignItems="center" spacing={2}>
                                <Typography variant="caption" color="text.secondary">
                                  {formatFileSize(file.size)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  •
                                </Typography>
                                <Chip
                                  label={statusChip.label}
                                  size="small"
                                  icon={
                                    <StatusIcon size={12} style={{ marginLeft: 4 }} />
                                  }
                                  sx={{
                                    backgroundColor: statusChip.backgroundColor,
                                    color: statusChip.color,
                                    fontWeight: 500,
                                    fontSize: '11px',
                                    height: 24,
                                    '& .MuiChip-icon': {
                                      fontSize: '12px',
                                    },
                                  }}
                                />
                              </Stack>

                              {/* Progress Bar for Uploading Files */}
                              {file.status === 'uploading' && (
                                <Box sx={{ mt: 2, width: '100%' }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={file.progress}
                                    sx={{
                                      height: 6,
                                      borderRadius: 3,
                                      backgroundColor: '#F3F4F6',
                                      '& .MuiLinearProgress-bar': {
                                        backgroundColor: singleTheme.buttons.primary.contained.backgroundColor,
                                        borderRadius: 3,
                                      },
                                    }}
                                  />
                                </Box>
                              )}
                            </Box>

                            {/* Action Buttons */}
                            <Stack direction="row" spacing={1}>
                              {showPreview && file.status === 'completed' && file.file.type.startsWith('image/') && (
                                <IconButton
                                  size="small"
                                  onClick={() => handlePreviewFile(file)}
                                  title="Preview"
                                  sx={{
                                    color: theme.palette.text.secondary,
                                    '&:hover': {
                                      backgroundColor: `${singleTheme.buttons.primary.contained.backgroundColor}10`,
                                      color: singleTheme.buttons.primary.contained.backgroundColor,
                                    },
                                  }}
                                >
                                  <EyeIcon size={18} />
                                </IconButton>
                              )}
                              {file.status === 'completed' && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleDownloadFile(file)}
                                  title="Download"
                                  sx={{
                                    color: theme.palette.text.secondary,
                                    '&:hover': {
                                      backgroundColor: `${singleTheme.buttons.primary.contained.backgroundColor}10`,
                                      color: singleTheme.buttons.primary.contained.backgroundColor,
                                    },
                                  }}
                                >
                                  <DownloadIcon size={18} />
                                </IconButton>
                              )}
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteFile(file)}
                                title="Delete"
                                sx={{
                                  color: theme.palette.text.secondary,
                                  '&:hover': {
                                    backgroundColor: `${singleTheme.buttons.error}10`,
                                    color: singleTheme.buttons.error,
                                  },
                                }}
                              >
                                <DeleteIcon size={18} />
                              </IconButton>
                            </Stack>
                          </Stack>
                        </Box>
                      </Paper>
                    </Fade>
                  );
                })}
              </Stack>
            </Box>
          </Fade>
        )}

        {/* Action Buttons */}
        {files.length > 0 && (
          <Fade in timeout={500}>
            <Box sx={{ p: 4, borderTop: `1px solid ${theme.palette.border.light}` }}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <CustomizableButton
                  variant="outlined"
                  color="secondary"
                  onClick={handleClearAll}
                  text="Clear All"
                />
                <CustomizableButton
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  isDisabled={!allCompleted}
                  loading={!allCompleted}
                  text="Save Files"
                />
              </Stack>
            </Box>
          </Fade>
        )}

        {/* Delete Confirmation Modal */}
        <Backdrop
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1300,
          }}
          open={deleteModal.isOpen}
        >
          <Fade in={deleteModal.isOpen}>
            <Paper
              elevation={24}
              sx={{
                p: 4,
                borderRadius: '12px',
                maxWidth: 400,
                mx: 2,
              }}
            >
              <Stack spacing={3} alignItems="center">
                <Avatar
                  sx={{
                    backgroundColor: `${singleTheme.buttons.error}15`,
                    color: singleTheme.buttons.error,
                    width: 56,
                    height: 56,
                  }}
                >
                  <ErrorIcon size={28} />
                </Avatar>
                <Box textAlign="center">
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Delete File?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Are you sure you want to delete "{deleteModal.file?.name}"? This action cannot be undone.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={2} width="100%">
                  <CustomizableButton
                    variant="text"
                    onClick={() => setDeleteModal({ isOpen: false, file: null })}
                    text="Cancel"
                    sx={{ color: "#344054", px: "32px" }}
                  />
                  <CustomizableButton
                    variant="contained"
                    color="error"
                    onClick={confirmDeleteFile}
                    text="Delete"
                  />
                </Stack>
              </Stack>
            </Paper>
          </Fade>
        </Backdrop>
      </Paper>
    </Fade>
  );
};

export default Uploader;
