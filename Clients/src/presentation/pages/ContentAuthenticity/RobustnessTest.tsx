/**
 * @fileoverview Robustness Test Page
 *
 * Allows users to test watermark robustness against various
 * image transformations for EU AI Act Article 50 compliance verification.
 *
 * @module pages/ContentAuthenticity/RobustnessTest
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Upload,
  FlaskConical,
  CheckCircle,
  XCircle,
  Shield,
  AlertTriangle,
} from "lucide-react";
import {
  testRobustness,
  fileToBase64,
  RobustnessTestResult,
  getRobustnessLevel,
  getRobustnessLevelLabel,
  getRobustnessColor,
  getTransformationDescription,
  TransformationType,
} from "../../../application/repository/contentAuthenticity.repository";

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function RobustnessTest() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RobustnessTestResult | null>(null);
  const [quickTest, setQuickTest] = useState(false);

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

  const handleTest = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const imageBase64 = await fileToBase64(file);

      const response = await testRobustness({
        image_base64: imageBase64,
        quick_test: quickTest,
      });

      setResult(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const robustnessLevel = result ? getRobustnessLevel(result.overallRobustnessScore) : null;

  return (
    <Box sx={{ p: 3, maxWidth: 1000 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Robustness test
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Test if your watermarked image survives common image transformations like compression, resizing, and cropping.
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
          onClick={() => document.getElementById("file-input-robustness")?.click()}
        >
          <input
            id="file-input-robustness"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <Upload size={40} style={{ marginBottom: 16, opacity: 0.5 }} />
          <Typography variant="body1" gutterBottom>
            {file ? file.name : "Drag & drop a watermarked image here, or click to browse"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Upload an image that has already been watermarked
          </Typography>
        </Paper>

        {/* Preview */}
        {preview && (
          <Stack direction="row" spacing={3}>
            <Box sx={{ width: 200 }}>
              <Typography variant="subtitle2" gutterBottom>
                Test image
              </Typography>
              <Paper variant="outlined" sx={{ p: 1 }}>
                <img
                  src={preview}
                  alt="Test"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </Paper>
            </Box>

            {/* Test Options */}
            <Box sx={{ flex: 1 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle2">Test options</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={quickTest}
                        onChange={(e) => setQuickTest(e.target.checked)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">Quick test</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Run only essential transformations (faster)
                        </Typography>
                      </Box>
                    }
                  />
                  <Typography variant="caption" color="text.secondary">
                    {quickTest
                      ? "Tests: JPEG Q75, Resize 75%, Crop 10%, Brightness +20%"
                      : "Tests: JPEG (Q90, Q75, Q50), Resize, Crop, Rotation, Brightness, Contrast, Noise, Blur, Format conversion"}
                  </Typography>
                </Stack>
              </Paper>
            </Box>
          </Stack>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Results */}
        {result && (
          <Stack spacing={3}>
            {/* Summary */}
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                bgcolor: result.isRobust ? "#f0fdf4" : "#fef2f2",
              }}
            >
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" gap={2}>
                  {result.isRobust ? (
                    <Shield size={32} color="#22c55e" />
                  ) : (
                    <AlertTriangle size={32} color="#ef4444" />
                  )}
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {result.isRobust ? "Watermark is robust" : "Watermark needs improvement"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {result.transformationsPassed} of {result.transformationsTested} transformations passed
                    </Typography>
                  </Box>
                </Stack>

                <Box>
                  <Stack direction="row" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">Robustness score</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {(result.overallRobustnessScore * 100).toFixed(0)}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={result.overallRobustnessScore * 100}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: "#e5e7eb",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: robustnessLevel ? getRobustnessColor(robustnessLevel) : "#6b7280",
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>

                <Stack direction="row" spacing={2}>
                  <Chip
                    label={`${getRobustnessLevelLabel(robustnessLevel!)} robustness`}
                    sx={{
                      bgcolor: `${getRobustnessColor(robustnessLevel!)}20`,
                      color: getRobustnessColor(robustnessLevel!),
                      fontWeight: 500,
                    }}
                  />
                  <Chip
                    label={`Original confidence: ${(result.originalConfidence * 100).toFixed(1)}%`}
                    variant="outlined"
                    size="small"
                  />
                  <Chip
                    label={`Threshold: ${(result.detectionThreshold * 100).toFixed(0)}%`}
                    variant="outlined"
                    size="small"
                  />
                </Stack>
              </Stack>
            </Paper>

            {/* Detailed Results Table */}
            <Paper variant="outlined">
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f9fafb" }}>
                      <TableCell>Transformation</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="right">Confidence</TableCell>
                      <TableCell align="right">Loss</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.results.map((r, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Stack direction="row" alignItems="center" gap={1}>
                            <Typography variant="body2">
                              {r.parameters.name as string || getTransformationDescription(r.transformationType as TransformationType)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          {r.passed ? (
                            <CheckCircle size={18} color="#22c55e" />
                          ) : (
                            <XCircle size={18} color="#ef4444" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            color={r.passed ? "success.main" : "error.main"}
                          >
                            {(r.confidence * 100).toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            color={r.confidenceLoss > 30 ? "error.main" : "text.secondary"}
                          >
                            -{r.confidenceLoss.toFixed(1)}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Recommendations */}
            {!result.isRobust && (
              <Alert severity="warning">
                <Typography variant="subtitle2" gutterBottom>
                  Recommendations
                </Typography>
                <Typography variant="body2">
                  Your watermark may not survive common image transformations. Consider:
                </Typography>
                <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
                  <li>Increasing the watermark strength when embedding</li>
                  <li>Using a higher quality source image</li>
                  <li>Re-embedding with Article 50 compliant settings</li>
                </ul>
              </Alert>
            )}
          </Stack>
        )}

        {/* Actions */}
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} /> : <FlaskConical size={16} />}
            onClick={handleTest}
            disabled={!file || loading}
            sx={{ bgcolor: "#13715B", "&:hover": { bgcolor: "#0f5a48" } }}
          >
            {loading ? "Testing..." : "Run robustness test"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
