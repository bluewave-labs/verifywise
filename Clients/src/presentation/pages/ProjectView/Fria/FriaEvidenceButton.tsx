import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Typography, Stack, Dialog, DialogContent, IconButton, CircularProgress } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Paperclip, X, Upload, Trash2 } from "lucide-react";
import { CustomizableButton } from "../../../components/button/customizable-button";
import { FilePickerModal } from "../../../components/FilePickerModal";
import { friaRepository } from "../../../../application/repository/fria.repository";
import { uploadFileToManager } from "../../../../application/repository/file.repository";

interface FriaEvidenceButtonProps {
  friaId: number;
  entityType: string;
  label?: string;
}

interface EvidenceFile {
  id: number;
  link_id: number;
  file_name: string;
  file_type?: string;
}

interface UploadState {
  file: File | null;
  uploading: boolean;
  error: string | null;
}

const FriaUploadModal = ({
  open,
  onClose,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  onUploaded: (fileId: number, fileName: string) => void;
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({
    file: null,
    uploading: false,
    error: null,
  });
  const [dragging, setDragging] = useState(false);

  const handleClose = () => {
    if (state.uploading) return;
    setState({ file: null, uploading: false, error: null });
    onClose();
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setState({ file, uploading: false, error: null });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files?.[0] ?? null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    handleFileChange(e.dataTransfer.files?.[0] ?? null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleUpload = async () => {
    if (!state.file) return;
    setState((prev) => ({ ...prev, uploading: true, error: null }));
    try {
      const response = await uploadFileToManager({
        file: state.file,
        source: "fria_evidence",
      });
      const fileId = response?.data?.id;
      if (!fileId) throw new Error("Upload failed: no file ID returned");
      onUploaded(fileId, state.file.name);
      setState({ file: null, uploading: false, error: null });
    } catch {
      setState((prev) => ({
        ...prev,
        uploading: false,
        error: "Upload failed. Please try again.",
      }));
    }
  };

  const handleRemoveFile = () => {
    setState({ file: null, uploading: false, error: null });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "4px",
          border: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <DialogContent sx={{ p: 3, position: "relative" }}>
        <IconButton
          onClick={handleClose}
          disabled={state.uploading}
          sx={{ position: "absolute", top: 8, right: 8 }}
          disableRipple
        >
          <X size={16} />
        </IconButton>

        <Typography sx={{ fontWeight: 600, fontSize: 16, mb: 2 }}>
          Upload new file
        </Typography>

        <Box
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !state.file && fileInputRef.current?.click()}
          sx={{
            border: `2px dashed ${dragging ? theme.palette.primary.main : theme.palette.divider}`,
            borderRadius: "4px",
            p: 3,
            textAlign: "center",
            cursor: state.file ? "default" : "pointer",
            backgroundColor: dragging
              ? `${theme.palette.primary.main}08`
              : theme.palette.background.default,
            transition: "border-color 0.15s, background-color 0.15s",
            minHeight: 120,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={handleInputChange}
          />

          {state.file ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                justifyContent: "center",
              }}
            >
              <Paperclip size={14} color={theme.palette.text.secondary} />
              <Typography sx={{ fontSize: 13, color: theme.palette.text.primary, flexShrink: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>
                {state.file.name}
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                disabled={state.uploading}
                sx={{ p: "2px" }}
              >
                <Trash2 size={13} color={theme.palette.text.secondary} />
              </IconButton>
            </Box>
          ) : (
            <>
              <Upload size={24} color={theme.palette.text.secondary} />
              <Typography sx={{ fontSize: 13, color: theme.palette.text.primary }}>
                <span style={{ color: "#3b82f6" }}>Click to upload</span> or drag and drop
              </Typography>
              <Typography sx={{ fontSize: 11, color: theme.palette.text.secondary }}>
                Any file type accepted
              </Typography>
            </>
          )}
        </Box>

        {state.error && (
          <Typography sx={{ fontSize: 12, color: theme.palette.error.main, mt: 1 }}>
            {state.error}
          </Typography>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, gap: "8px" }}>
          <CustomizableButton
            text="Cancel"
            variant="outlined"
            onClick={handleClose}
            disabled={state.uploading}
            sx={{ height: 34 }}
          />
          <CustomizableButton
            text={state.uploading ? "Uploading..." : "Upload"}
            variant="contained"
            onClick={handleUpload}
            disabled={!state.file || state.uploading}
            startIcon={state.uploading ? <CircularProgress size={12} color="inherit" /> : undefined}
            sx={{ height: 34 }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

const FriaEvidenceButton = ({
  friaId,
  entityType,
  label = "Attach evidence",
}: FriaEvidenceButtonProps) => {
  const theme = useTheme();
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEvidence = useCallback(async () => {
    if (!friaId) return;
    try {
      const data = await friaRepository.getEvidence(friaId, entityType);
      setFiles(Array.isArray(data) ? data : []);
    } catch {
      setFiles([]);
    }
  }, [friaId, entityType]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const handleSelect = async (selectedFiles: Array<{ id: string; fileName: string }>) => {
    setIsLoading(true);
    try {
      for (const file of selectedFiles) {
        await friaRepository.linkEvidence(friaId, parseInt(file.id), entityType);
      }
      await fetchEvidence();
    } catch {
      // Error handled silently
    } finally {
      setIsLoading(false);
      setPickerOpen(false);
    }
  };

  const handleUploaded = async (fileId: number) => {
    setUploadOpen(false);
    setIsLoading(true);
    try {
      await friaRepository.linkEvidence(friaId, fileId, entityType);
      await fetchEvidence();
    } catch {
      // Error handled silently
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (linkId: number) => {
    try {
      await friaRepository.unlinkEvidence(friaId, linkId);
      setFiles((prev) => prev.filter((f) => f.link_id !== linkId));
    } catch {
      // Error handled silently
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <CustomizableButton
          text={label}
          variant="text"
          onClick={() => setPickerOpen(true)}
          disabled={isLoading}
          startIcon={<Paperclip size={13} />}
          sx={{
            height: 28,
            fontSize: 12,
            color: theme.palette.text.secondary,
            textTransform: "none",
            p: "4px 8px",
          }}
        />
        <CustomizableButton
          text="Upload new"
          variant="text"
          onClick={() => setUploadOpen(true)}
          disabled={isLoading}
          startIcon={<Upload size={13} />}
          sx={{
            height: 28,
            fontSize: 12,
            color: theme.palette.text.secondary,
            textTransform: "none",
            p: "4px 8px",
          }}
        />
        {files.length > 0 && (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {files.map((file) => (
              <Box
                key={file.link_id}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1,
                  py: 0.25,
                  borderRadius: "4px",
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.default,
                }}
              >
                <Paperclip size={11} color={theme.palette.text.secondary} />
                <Typography sx={{ fontSize: 11, color: theme.palette.text.primary }}>
                  {file.file_name}
                </Typography>
                <Box
                  component="span"
                  onClick={() => handleRemove(file.link_id)}
                  sx={{
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    "&:hover": { opacity: 0.7 },
                  }}
                >
                  <X size={11} color={theme.palette.text.secondary} />
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      <FilePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelect}
        excludeFileIds={files.map((f) => String(f.id))}
        multiSelect
        title={`Attach evidence to ${entityType.replace(/_/g, " ")}`}
      />

      <FriaUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={handleUploaded}
      />
    </Box>
  );
};

export default FriaEvidenceButton;
