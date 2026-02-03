/**
 * @fileoverview Detect Watermark Page
 *
 * Allows users to upload images and check if they contain watermarks
 * with comprehensive AI content detection including C2PA verification.
 *
 * @module pages/ContentAuthenticity/DetectWatermark
 */

import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  Divider,
} from "@mui/material";
import {
  Upload,
  ScanSearch,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileSearch,
  Shield,
  Info,
} from "lucide-react";
import {
  detectComprehensive,
  fileToBase64,
  ComprehensiveDetectResponse,
  getConfidenceLevelLabel,
  getAssessmentLabel,
  getConfidenceLevelColor,
} from "../../../application/repository/contentAuthenticity.repository";

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function DetectWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComprehensiveDetectResponse | null>(null);

  const validateFile = (selectedFile: File): string | null => {
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`;
    }
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(selectedFile.type)) {
      return "Invalid file type. Only PNG, JPG, and WebP are supported";
    }
    return null;
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        return;
      }

      setFile(selectedFile);
      setResult(null);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      const validationError = validateFile(droppedFile);
      if (validationError) {
        setError(validationError);
        return;
      }

      setFile(droppedFile);
      setResult(null);
      setError(null);

      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(droppedFile);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDetect = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const imageBase64 = await fileToBase64(file);

      const response = await detectComprehensive({
        image_base64: imageBase64,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      });

      setResult(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getAssessmentIcon = (assessment: string) => {
    switch (assessment) {
      case "confirmed":
        return <CheckCircle size={48} color="#22c55e" />;
      case "likely":
        return <CheckCircle size={48} color="#3b82f6" />;
      case "possible":
        return <AlertTriangle size={48} color="#f59e0b" />;
      default:
        return <XCircle size={48} color="#6b7280" />;
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Detect watermark
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Check if an image contains an invisible watermark or C2PA Content Credentials for AI content verification.
          </Typography>
        </Box>

        {/* Upload Area */}
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: "center",
            cursor: "pointer",
            borderStyle: "dashed",
            borderColor: file ? "primary.main" : "divider",
            bgcolor: file ? "action.hover" : "background.paper",
            "&:hover": {
              borderColor: "primary.main",
              bgcolor: "action.hover",
            },
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById("file-input-detect")?.click()}
        >
          <input
            id="file-input-detect"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <Upload size={40} style={{ marginBottom: 16, opacity: 0.5 }} />
          <Typography variant="body1" gutterBottom>
            {file ? file.name : "Drag & drop an image here, or click to browse"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Supports PNG, JPG, WebP (max {MAX_FILE_SIZE_MB}MB)
          </Typography>
        </Paper>

        {/* Preview and Result */}
        {preview && (
          <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Image
              </Typography>
              <Paper variant="outlined" sx={{ p: 1 }}>
                <img
                  src={preview}
                  alt="Uploaded"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </Paper>
            </Box>

            {result && (
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Detection result
                </Typography>
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Stack spacing={3}>
                    {/* Main Assessment */}
                    <Stack spacing={2} alignItems="center">
                      {getAssessmentIcon(result.aiGeneratedAssessment)}
                      <Typography variant="h6" fontWeight={600} textAlign="center">
                        {getAssessmentLabel(result.aiGeneratedAssessment)}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                        sx={{ maxWidth: 300 }}
                      >
                        {result.assessmentReasoning}
                      </Typography>
                    </Stack>

                    <Divider />

                    {/* Watermark Detection */}
                    <Box>
                      <Stack direction="row" alignItems="center" gap={1} mb={1}>
                        <FileSearch size={16} />
                        <Typography variant="subtitle2">Watermark detection</Typography>
                      </Stack>

                      <Stack spacing={1}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">
                            {result.hasWatermark ? "Watermark detected" : "No watermark detected"}
                          </Typography>
                          <Chip
                            label={getConfidenceLevelLabel(result.confidenceLevel)}
                            size="small"
                            sx={{
                              bgcolor: `${getConfidenceLevelColor(result.confidenceLevel)}20`,
                              color: getConfidenceLevelColor(result.confidenceLevel),
                              fontWeight: 500,
                            }}
                          />
                        </Stack>

                        <Box>
                          <Stack direction="row" justifyContent="space-between" mb={0.5}>
                            <Typography variant="caption" color="text.secondary">
                              Confidence
                            </Typography>
                            <Typography variant="caption" fontWeight={500}>
                              {(result.confidence * 100).toFixed(1)}%
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={result.confidence * 100}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: "#e5e7eb",
                              "& .MuiLinearProgress-bar": {
                                bgcolor: getConfidenceLevelColor(result.confidenceLevel),
                                borderRadius: 3,
                              },
                            }}
                          />
                        </Box>

                        {result.bitAccuracy !== undefined && (
                          <Typography variant="caption" color="text.secondary">
                            Bit accuracy: {(result.bitAccuracy * 100).toFixed(1)}%
                          </Typography>
                        )}
                      </Stack>
                    </Box>

                    {/* C2PA Results */}
                    {result.c2pa && (
                      <>
                        <Divider />
                        <Box>
                          <Stack direction="row" alignItems="center" gap={1} mb={1}>
                            <Shield size={16} />
                            <Typography variant="subtitle2">C2PA Content Credentials</Typography>
                          </Stack>

                          {result.c2pa.manifestFound ? (
                            <Stack spacing={1}>
                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                <Chip
                                  label="Manifest found"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                />
                                {result.c2pa.signatureValid && (
                                  <Chip
                                    label="Signature valid"
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                  />
                                )}
                                {result.c2pa.chainVerified && (
                                  <Chip
                                    label="Chain verified"
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                  />
                                )}
                              </Stack>

                              {result.c2pa.digitalSourceType && (
                                <Typography variant="caption" color="text.secondary">
                                  Source type: {result.c2pa.digitalSourceType}
                                </Typography>
                              )}

                              {result.c2pa.generatorInfo && (
                                <Typography variant="caption" color="text.secondary">
                                  Generator: {result.c2pa.generatorInfo.name}{" "}
                                  {result.c2pa.generatorInfo.version}
                                </Typography>
                              )}

                              {result.c2pa.aiModelInfo && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" fontWeight={500}>
                                    AI model information
                                  </Typography>
                                  <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                                    {result.c2pa.aiModelInfo.name && (
                                      <Typography variant="caption" color="text.secondary">
                                        Model: {result.c2pa.aiModelInfo.name}
                                      </Typography>
                                    )}
                                    {result.c2pa.aiModelInfo.provider && (
                                      <Typography variant="caption" color="text.secondary">
                                        Provider: {result.c2pa.aiModelInfo.provider}
                                      </Typography>
                                    )}
                                    {result.c2pa.aiModelInfo.version && (
                                      <Typography variant="caption" color="text.secondary">
                                        Version: {result.c2pa.aiModelInfo.version}
                                      </Typography>
                                    )}
                                  </Stack>
                                </Box>
                              )}

                              {result.c2pa.manifestId && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ wordBreak: "break-all" }}
                                >
                                  Manifest ID: {result.c2pa.manifestId}
                                </Typography>
                              )}
                            </Stack>
                          ) : (
                            <Stack direction="row" alignItems="center" gap={1}>
                              <Info size={14} color="#6b7280" />
                              <Typography variant="body2" color="text.secondary">
                                No C2PA manifest found
                              </Typography>
                            </Stack>
                          )}
                        </Box>
                      </>
                    )}

                    {/* Processing Time */}
                    {result.processingTimeMs && (
                      <Typography variant="caption" color="text.secondary" textAlign="center">
                        Processed in {result.processingTimeMs}ms
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              </Box>
            )}
          </Stack>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Actions */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <ScanSearch size={16} />}
            onClick={handleDetect}
            disabled={!file || loading}
            sx={{ bgcolor: "#13715B", "&:hover": { bgcolor: "#0f5a48" } }}
          >
            {loading ? "Detecting..." : "Detect watermark"}
          </Button>
        </Stack>

        {/* Confidence Level Legend */}
        {!result && file && (
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "#f9fafb" }}>
            <Stack spacing={1}>
              <Typography variant="caption" fontWeight={500}>
                Detection confidence levels
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#22c55e",
                    }}
                  />
                  <Typography variant="caption">High (≥85%)</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#f59e0b",
                    }}
                  />
                  <Typography variant="caption">Medium (≥65%)</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#ef4444",
                    }}
                  />
                  <Typography variant="caption">Low (≥50%)</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#6b7280",
                    }}
                  />
                  <Typography variant="caption">None (&lt;50%)</Typography>
                </Stack>
              </Stack>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
