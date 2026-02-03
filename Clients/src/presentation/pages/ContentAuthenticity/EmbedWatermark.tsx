/**
 * @fileoverview Embed Watermark Page
 *
 * Allows users to upload images and embed invisible watermarks with
 * full EU AI Act Article 50 compliance (watermark + C2PA Content Credentials).
 *
 * @module pages/ContentAuthenticity/EmbedWatermark
 */

import { useState, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  Paper,
  Slider,
  Button,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  TextField,
  Collapse,
  Chip,
} from "@mui/material";
import { Upload, Download, Stamp, ChevronDown, ChevronUp, Shield, FileCheck } from "lucide-react";
import {
  embedArticle50,
  fileToBase64,
  downloadBase64Image,
  Article50EmbedResponse,
} from "../../../application/repository/contentAuthenticity.repository";

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function EmbedWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [strength, setStrength] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Article50EmbedResponse | null>(null);
  const [watermarkedPreview, setWatermarkedPreview] = useState<string | null>(null);

  // Article 50 Compliance Options
  const [enableC2PA, setEnableC2PA] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [allowTraining, setAllowTraining] = useState(false);
  const [allowMining, setAllowMining] = useState(false);
  const [modelName, setModelName] = useState("");
  const [modelVersion, setModelVersion] = useState("");
  const [provider, setProvider] = useState("");

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
      setWatermarkedPreview(null);
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
      setWatermarkedPreview(null);
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

  const handleEmbed = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const imageBase64 = await fileToBase64(file);

      const response = await embedArticle50({
        image_base64: imageBase64,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        strength,
        enable_c2pa: enableC2PA,
        c2pa_options: {
          allowTraining,
          allowMining,
        },
        provenance: {
          modelName: modelName || undefined,
          modelVersion: modelVersion || undefined,
          provider: provider || undefined,
        },
      });

      setResult(response);

      // Create preview of watermarked image
      if (response.watermarkedImageBase64) {
        setWatermarkedPreview(`data:image/png;base64,${response.watermarkedImageBase64}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result?.watermarkedImageBase64) return;

    const originalName = file?.name || "image";
    const baseName = originalName.replace(/\.[^/.]+$/, "");
    downloadBase64Image(
      result.watermarkedImageBase64,
      `watermarked_${baseName}.png`,
      "image/png"
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Embed watermark
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add an invisible watermark and C2PA Content Credentials to your AI-generated images for EU AI Act Article 50 compliance.
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
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
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

        {/* Preview */}
        {preview && (
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Original
              </Typography>
              <Paper variant="outlined" sx={{ p: 1 }}>
                <img
                  src={preview}
                  alt="Original"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </Paper>
            </Box>
            {watermarkedPreview && (
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Watermarked
                </Typography>
                <Paper variant="outlined" sx={{ p: 1 }}>
                  <img
                    src={watermarkedPreview}
                    alt="Watermarked"
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                </Paper>
              </Box>
            )}
          </Stack>
        )}

        {/* Settings */}
        {file && (
          <Stack spacing={2}>
            {/* Watermark Strength */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Watermark strength
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="caption">Subtle</Typography>
                <Slider
                  value={strength}
                  onChange={(_, value) => setStrength(value as number)}
                  min={0.1}
                  max={2.0}
                  step={0.1}
                  valueLabelDisplay="auto"
                  sx={{ flex: 1 }}
                />
                <Typography variant="caption">Strong</Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Higher strength = more robust watermark but potentially more visible
              </Typography>
            </Paper>

            {/* Article 50 Compliance Options */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Shield size={18} color="#13715B" />
                    <Typography variant="subtitle2">
                      Article 50 compliance
                    </Typography>
                  </Box>
                  <Chip
                    label="EU AI Act"
                    size="small"
                    sx={{ bgcolor: "#e8f5e9", color: "#13715B" }}
                  />
                </Stack>

                <FormControlLabel
                  control={
                    <Switch
                      checked={enableC2PA}
                      onChange={(e) => setEnableC2PA(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">Enable C2PA Content Credentials</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Embeds machine-readable provenance metadata (recommended)
                      </Typography>
                    </Box>
                  }
                />

                {/* Advanced Options Toggle */}
                <Button
                  size="small"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  endIcon={showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  sx={{ alignSelf: "flex-start", textTransform: "none" }}
                >
                  {showAdvanced ? "Hide" : "Show"} advanced options
                </Button>

                <Collapse in={showAdvanced}>
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    {/* AI Model Provenance */}
                    <Typography variant="caption" fontWeight={500}>
                      AI model provenance (optional)
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <TextField
                        size="small"
                        label="Model name"
                        placeholder="e.g., DALL-E 3"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        fullWidth
                      />
                      <TextField
                        size="small"
                        label="Version"
                        placeholder="e.g., 3.0"
                        value={modelVersion}
                        onChange={(e) => setModelVersion(e.target.value)}
                        sx={{ width: 120 }}
                      />
                    </Stack>
                    <TextField
                      size="small"
                      label="Provider"
                      placeholder="e.g., OpenAI"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      fullWidth
                    />

                    {/* Data Usage Permissions */}
                    <Typography variant="caption" fontWeight={500} sx={{ mt: 1 }}>
                      Data usage permissions
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={allowTraining}
                          onChange={(e) => setAllowTraining(e.target.checked)}
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2">Allow AI training</Typography>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={allowMining}
                          onChange={(e) => setAllowMining(e.target.checked)}
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2">Allow data mining</Typography>
                      }
                    />
                  </Stack>
                </Collapse>
              </Stack>
            </Paper>
          </Stack>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Success Result */}
        {result && (
          <Paper variant="outlined" sx={{ p: 2, bgcolor: "#f0fdf4" }}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" gap={1}>
                <FileCheck size={20} color="#13715B" />
                <Typography variant="subtitle2" color="#13715B">
                  Watermark embedded successfully
                </Typography>
              </Stack>

              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Chip
                  label={result.euAiActCompliant ? "EU AI Act compliant" : "Basic watermark"}
                  color={result.euAiActCompliant ? "success" : "default"}
                  size="small"
                  variant="outlined"
                />
                {result.c2paManifestApplied && (
                  <Chip
                    label="C2PA manifest applied"
                    color="info"
                    size="small"
                    variant="outlined"
                  />
                )}
                {result.processingTimeMs && (
                  <Chip
                    label={`${result.processingTimeMs}ms`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Stack>

              {result.c2paManifestId && (
                <Typography variant="caption" color="text.secondary">
                  C2PA Manifest ID: {result.c2paManifestId}
                </Typography>
              )}
              {result.contentHash && (
                <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                  Content hash: {result.contentHash}
                </Typography>
              )}
            </Stack>
          </Paper>
        )}

        {/* Actions */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <Stamp size={16} />}
            onClick={handleEmbed}
            disabled={!file || loading}
            sx={{ bgcolor: "#13715B", "&:hover": { bgcolor: "#0f5a48" } }}
          >
            {loading ? "Embedding..." : "Embed watermark"}
          </Button>
          {result?.watermarkedImageBase64 && (
            <Button
              variant="outlined"
              startIcon={<Download size={16} />}
              onClick={handleDownload}
            >
              Download watermarked image
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
