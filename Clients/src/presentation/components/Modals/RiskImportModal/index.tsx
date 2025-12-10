/**
 * RiskImportModal - Multi-step modal for bulk importing risks from CSV/Excel files
 *
 * Steps:
 * 1. Upload - Select file and risk type
 * 2. Map columns - Map file columns to risk fields
 * 3. Preview & validate - Review data and handle duplicates
 * 4. Import - Execute import and show results
 */

import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  Box,
  Stack,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  LinearProgress,
  Alert,
  AlertTitle,
} from "@mui/material";
import { Upload, FileSpreadsheet, Download, Check, AlertCircle, X } from "lucide-react";
import StepperModal from "../StepperModal";
import CustomizableButton from "../../Button/CustomizableButton";
import CustomAxios from "../../../../infrastructure/api/customAxios";

// Types matching backend
interface ParsedRow {
  rowIndex: number;
  data: Record<string, string>;
}

interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
}

interface FieldDefinition {
  field: string;
  label: string;
  required: boolean;
  type: string;
  options?: string[];
}

interface ValidationResult {
  rowIndex: number;
  isValid: boolean;
  errors: string[];
  data: Record<string, unknown>;
}

interface DuplicateCheck {
  rowIndex: number;
  existingRiskId: number | null;
  existingRiskName: string | null;
  isDuplicate: boolean;
}

interface ImportResult {
  rowIndex: number;
  success: boolean;
  riskId?: number;
  error?: string;
  action: "created" | "skipped" | "overwritten" | "error";
}

interface RiskImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultRiskType?: "project" | "vendor";
  projectId?: number;
  vendorId?: number;
}

const API_BASE = "/plugins/risk-importer";

const RiskImportModal: React.FC<RiskImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultRiskType = "project",
  projectId,
  vendorId,
}) => {
  const steps = ["Upload file", "Map columns", "Preview", "Import"];
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Upload state
  const [riskType, setRiskType] = useState<"project" | "vendor">(defaultRiskType);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<{
    columns: string[];
    rows: ParsedRow[];
    preview: ParsedRow[];
  } | null>(null);

  // Step 2: Mapping state
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);

  // Step 3: Validation state
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateCheck[]>([]);
  const [duplicateActions, setDuplicateActions] = useState<Record<number, "skip" | "overwrite" | "create">>({});

  // Step 4: Import state
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [importProgress, setImportProgress] = useState(0);

  // File input ref for resetting
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes
  const resetState = useCallback(() => {
    setActiveStep(0);
    setFile(null);
    setParsedData(null);
    setFields([]);
    setColumnMappings([]);
    setValidationResults([]);
    setDuplicates([]);
    setDuplicateActions({});
    setImportResults([]);
    setImportProgress(0);
    setError(null);
    setIsSubmitting(false);
    setIsParsing(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  // File upload handler
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setIsParsing(true);

    // Read file and send to backend for parsing
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(",")[1];
        const response = await CustomAxios.post(`${API_BASE}/parse`, {
          fileContent: base64,
          fileName: selectedFile.name,
        });

        const result = response.data;
        if (result.success) {
          setParsedData({
            columns: result.data.columns,
            rows: result.data.allRows,
            preview: result.data.preview,
          });
        } else {
          setError(result.error || "Failed to parse file");
          setFile(null);
        }
      } catch (err) {
        setError("Failed to parse file");
        setFile(null);
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file");
      setFile(null);
      setIsParsing(false);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  // Fetch fields when risk type changes or entering step 2
  const fetchFields = useCallback(async () => {
    try {
      const response = await CustomAxios.get(`${API_BASE}/fields?type=${riskType}`);
      const result = response.data;
      if (result.success) {
        setFields(result.data.fields);
        // Initialize mappings with auto-detected matches
        if (parsedData) {
          const autoMappings: ColumnMapping[] = [];
          result.data.fields.forEach((field: FieldDefinition) => {
            // Try to find matching column by label or field name
            const matchingColumn = parsedData.columns.find(
              (col) =>
                col.toLowerCase() === field.label.toLowerCase() ||
                col.toLowerCase() === field.field.toLowerCase() ||
                col.toLowerCase().replace(/[_\s]/g, "") ===
                  field.field.toLowerCase().replace(/[_\s]/g, "")
            );
            if (matchingColumn) {
              autoMappings.push({
                sourceColumn: matchingColumn,
                targetField: field.field,
              });
            }
          });
          setColumnMappings(autoMappings);
        }
      }
    } catch (err) {
      setError("Failed to fetch field definitions");
    }
  }, [riskType, parsedData]);

  // Validate data
  const validateData = useCallback(async () => {
    if (!parsedData) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Validate
      const validateResponse = await CustomAxios.post(`${API_BASE}/validate`, {
        rows: parsedData.rows,
        mapping: columnMappings,
        riskType,
      });

      const validateResult = validateResponse.data;
      if (!validateResult.success) {
        setError(validateResult.error || "Validation failed");
        setIsSubmitting(false);
        return;
      }

      setValidationResults(validateResult.data.results);

      // Check for duplicates - separate try-catch so validation errors aren't confused with duplicate check errors
      const validRows = validateResult.data.results.filter((r: ValidationResult) => r.isValid);
      if (validRows.length > 0) {
        try {
          const duplicateResponse = await CustomAxios.post(`${API_BASE}/check-duplicates`, {
            validatedRows: validRows,
            riskType,
          });

          const duplicateResult = duplicateResponse.data;
          if (duplicateResult.success) {
            setDuplicates(duplicateResult.data.duplicates);
            // Default action for duplicates is "skip"
            const defaultActions: Record<number, "skip" | "overwrite" | "create"> = {};
            duplicateResult.data.duplicates.forEach((d: DuplicateCheck) => {
              if (d.isDuplicate) {
                defaultActions[d.rowIndex] = "skip";
              }
            });
            setDuplicateActions(defaultActions);
          }
        } catch (dupErr) {
          // Duplicate check failed, but validation succeeded - continue without duplicate detection
          console.warn("Duplicate check failed, continuing without duplicate detection:", dupErr);
          setDuplicates([]);
        }
      }
    } catch (err) {
      setError("Validation failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [parsedData, columnMappings, riskType]);

  // Execute import
  const executeImport = useCallback(async () => {
    setIsSubmitting(true);
    setError(null);
    setImportProgress(0);

    try {
      const validRows = validationResults.filter((r) => r.isValid);
      const linkTo = riskType === "vendor" && vendorId
        ? { type: "vendor" as const, id: vendorId }
        : riskType === "project" && projectId
        ? { type: "project" as const, id: projectId }
        : undefined;

      const response = await CustomAxios.post(`${API_BASE}/import`, {
        validatedRows: validRows,
        duplicateActions,
        riskType,
        linkTo,
      });

      const result = response.data;
      if (result.success) {
        setImportResults(result.data.results);
        setImportProgress(100);
      } else {
        setError(result.error || "Import failed");
      }
    } catch (err) {
      setError("Import failed");
    } finally {
      setIsSubmitting(false);
    }
  }, [validationResults, duplicateActions, riskType, projectId, vendorId]);

  // Handle step navigation
  const handleNext = useCallback(async () => {
    if (activeStep === 0) {
      // Moving from Upload to Mapping
      await fetchFields();
      setActiveStep(1);
    } else if (activeStep === 1) {
      // Moving from Mapping to Preview
      await validateData();
      setActiveStep(2);
    } else if (activeStep === 2) {
      // Moving from Preview to Import
      setActiveStep(3);
      await executeImport();
    }
  }, [activeStep, fetchFields, validateData, executeImport]);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  }, []);

  const handleSubmit = useCallback(() => {
    if (onSuccess) onSuccess();
    handleClose();
  }, [onSuccess, handleClose]);

  // Download template
  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await CustomAxios.get(`${API_BASE}/template?type=${riskType}&format=csv`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `risk-import-template-${riskType}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download template");
    }
  }, [riskType]);

  // Can proceed logic for each step
  const canProceed = useMemo(() => {
    switch (activeStep) {
      case 0:
        return !!parsedData && parsedData.rows.length > 0;
      case 1:
        // Must have at least required fields mapped
        const requiredFields = fields.filter((f) => f.required).map((f) => f.field);
        const mappedFields = columnMappings.map((m) => m.targetField);
        return requiredFields.every((rf) => mappedFields.includes(rf));
      case 2:
        return validationResults.some((r) => r.isValid);
      case 3:
        return importResults.length > 0;
      default:
        return true;
    }
  }, [activeStep, parsedData, fields, columnMappings, validationResults, importResults]);

  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderUploadStep();
      case 1:
        return renderMappingStep();
      case 2:
        return renderPreviewStep();
      case 3:
        return renderImportStep();
      default:
        return null;
    }
  };

  // Step 1: Upload
  const renderUploadStep = () => (
    <Stack spacing={3}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <FormControl fullWidth size="small">
        <InputLabel>Risk type</InputLabel>
        <Select
          value={riskType}
          label="Risk type"
          onChange={(e) => {
            const newType = e.target.value as "project" | "vendor";
            if (newType !== riskType) {
              // Reset file and parsed data when risk type changes
              setFile(null);
              setParsedData(null);
              setColumnMappings([]);
              setError(null);
            }
            setRiskType(newType);
          }}
        >
          <MenuItem value="project">Project risks</MenuItem>
          <MenuItem value="vendor">Vendor risks</MenuItem>
        </Select>
      </FormControl>

      <Box
        sx={{
          border: "2px dashed #D0D5DD",
          borderRadius: "8px",
          padding: "40px",
          textAlign: "center",
          backgroundColor: "#FAFAFA",
          cursor: "pointer",
          "&:hover": {
            borderColor: "#13715B",
            backgroundColor: "#F0FAF8",
          },
        }}
        component="label"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <Upload size={40} color="#667085" />
        <Typography sx={{ mt: 2, fontSize: 14, color: "#344054" }}>
          Click to upload or drag and drop
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#667085" }}>
          CSV or Excel files (.csv, .xlsx, .xls)
        </Typography>
      </Box>

      {file && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{
            padding: "12px 16px",
            backgroundColor: isParsing ? "#F9FAFB" : "#F0FAF8",
            borderRadius: "8px",
            border: isParsing ? "1px solid #D0D5DD" : "1px solid #13715B",
          }}
        >
          {isParsing ? (
            <CircularProgress size={20} sx={{ color: "#667085" }} />
          ) : (
            <FileSpreadsheet size={20} color="#13715B" />
          )}
          <Stack flex={1}>
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{file.name}</Typography>
            {isParsing ? (
              <Typography sx={{ fontSize: 12, color: "#667085" }}>
                Parsing file...
              </Typography>
            ) : parsedData ? (
              <Typography sx={{ fontSize: 12, color: "#667085" }}>
                {parsedData.rows.length} rows, {parsedData.columns.length} columns
              </Typography>
            ) : null}
          </Stack>
          {!isParsing && (
            <Box
              sx={{ cursor: "pointer", color: "#667085" }}
              onClick={() => {
                setFile(null);
                setParsedData(null);
                // Reset file input so the same file can be selected again
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
            >
              <X size={18} />
            </Box>
          )}
        </Stack>
      )}

      <CustomizableButton
        variant="outlined"
        text="Download template"
        onClick={handleDownloadTemplate}
        startIcon={<Download size={16} />}
        sx={{
          alignSelf: "flex-start",
          height: "34px",
          fontSize: "13px",
          border: "1px solid #D0D5DD",
          color: "#344054",
        }}
      />

      {parsedData && parsedData.preview.length > 0 && (
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>Preview</Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 200 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Row</TableCell>
                  {parsedData.columns.slice(0, 5).map((col) => (
                    <TableCell key={col} sx={{ fontWeight: 600, fontSize: 12 }}>
                      {col}
                    </TableCell>
                  ))}
                  {parsedData.columns.length > 5 && (
                    <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>...</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {parsedData.preview.map((row) => (
                  <TableRow key={row.rowIndex}>
                    <TableCell sx={{ fontSize: 12 }}>{row.rowIndex}</TableCell>
                    {parsedData.columns.slice(0, 5).map((col) => (
                      <TableCell key={col} sx={{ fontSize: 12 }}>
                        {row.data[col]?.substring(0, 30) || "-"}
                      </TableCell>
                    ))}
                    {parsedData.columns.length > 5 && (
                      <TableCell sx={{ fontSize: 12 }}>...</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Stack>
  );

  // Step 2: Mapping
  const renderMappingStep = () => (
    <Stack spacing={3}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Typography sx={{ fontSize: 14, color: "#667085" }}>
        Map columns from your file to risk fields. Required fields are marked with *.
      </Typography>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, width: "45%" }}>Risk field</TableCell>
              <TableCell sx={{ fontWeight: 600, width: "45%" }}>File column</TableCell>
              <TableCell sx={{ fontWeight: 600, width: "10%" }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field) => {
              const mapping = columnMappings.find((m) => m.targetField === field.field);
              return (
                <TableRow key={field.field}>
                  <TableCell>
                    <Typography sx={{ fontSize: 13 }}>
                      {field.label}
                      {field.required && <span style={{ color: "#DC2626" }}> *</span>}
                    </Typography>
                    {field.type === "enum" && field.options && (
                      <Typography sx={{ fontSize: 11, color: "#667085" }}>
                        Options: {field.options.join(", ")}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small">
                      <Select
                        value={mapping?.sourceColumn || ""}
                        displayEmpty
                        onChange={(e) => {
                          const newMappings = columnMappings.filter(
                            (m) => m.targetField !== field.field
                          );
                          if (e.target.value) {
                            newMappings.push({
                              sourceColumn: e.target.value,
                              targetField: field.field,
                            });
                          }
                          setColumnMappings(newMappings);
                        }}
                        sx={{ fontSize: 13 }}
                      >
                        <MenuItem value="">
                          <em>Not mapped</em>
                        </MenuItem>
                        {parsedData?.columns.map((col) => (
                          <MenuItem key={col} value={col}>
                            {col}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    {mapping ? (
                      <Check size={18} color="#16A34A" />
                    ) : field.required ? (
                      <AlertCircle size={18} color="#DC2626" />
                    ) : (
                      <Typography sx={{ fontSize: 12, color: "#667085" }}>-</Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );

  // Step 3: Preview & Validate
  const renderPreviewStep = () => {
    const validCount = validationResults.filter((r) => r.isValid).length;
    const invalidCount = validationResults.filter((r) => !r.isValid).length;
    const duplicateCount = duplicates.filter((d) => d.isDuplicate).length;

    return (
      <Stack spacing={3}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack direction="row" spacing={2}>
          <Chip
            label={`${validCount} valid`}
            color="success"
            size="small"
            sx={{ fontSize: 12 }}
          />
          {invalidCount > 0 && (
            <Chip
              label={`${invalidCount} invalid`}
              color="error"
              size="small"
              sx={{ fontSize: 12 }}
            />
          )}
          {duplicateCount > 0 && (
            <Chip
              label={`${duplicateCount} duplicates`}
              color="warning"
              size="small"
              sx={{ fontSize: 12 }}
            />
          )}
        </Stack>

        {duplicateCount > 0 && (
          <Alert severity="warning">
            <AlertTitle>Duplicates found</AlertTitle>
            <Typography sx={{ fontSize: 13, mb: 1 }}>
              {duplicateCount} risk(s) already exist. Choose how to handle each:
            </Typography>
            {duplicates
              .filter((d) => d.isDuplicate)
              .map((dup) => (
                <Stack
                  key={dup.rowIndex}
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ mt: 1 }}
                >
                  <Typography sx={{ fontSize: 12, minWidth: 200 }}>
                    Row {dup.rowIndex}: "{dup.existingRiskName}"
                  </Typography>
                  <RadioGroup
                    row
                    value={duplicateActions[dup.rowIndex] || "skip"}
                    onChange={(e) =>
                      setDuplicateActions({
                        ...duplicateActions,
                        [dup.rowIndex]: e.target.value as "skip" | "overwrite" | "create",
                      })
                    }
                  >
                    <FormControlLabel
                      value="skip"
                      control={<Radio size="small" />}
                      label={<Typography sx={{ fontSize: 12 }}>Skip</Typography>}
                    />
                    <FormControlLabel
                      value="overwrite"
                      control={<Radio size="small" />}
                      label={<Typography sx={{ fontSize: 12 }}>Overwrite</Typography>}
                    />
                    <FormControlLabel
                      value="create"
                      control={<Radio size="small" />}
                      label={<Typography sx={{ fontSize: 12 }}>Create duplicate</Typography>}
                    />
                  </RadioGroup>
                </Stack>
              ))}
          </Alert>
        )}

        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Row</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>
                  {riskType === "project" ? "Risk name" : "Risk description"}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Issues</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {validationResults.map((result) => (
                <TableRow
                  key={result.rowIndex}
                  sx={{
                    backgroundColor: result.isValid ? "inherit" : "#FEF2F2",
                  }}
                >
                  <TableCell sx={{ fontSize: 12 }}>{result.rowIndex}</TableCell>
                  <TableCell>
                    {result.isValid ? (
                      <Chip label="Valid" color="success" size="small" sx={{ fontSize: 11 }} />
                    ) : (
                      <Chip label="Invalid" color="error" size="small" sx={{ fontSize: 11 }} />
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12 }}>
                    {riskType === "project"
                      ? (result.data.risk_name as string)?.substring(0, 40) || "-"
                      : (result.data.risk_description as string)?.substring(0, 40) || "-"}
                  </TableCell>
                  <TableCell sx={{ fontSize: 12, color: "#DC2626" }}>
                    {result.errors.join(", ") || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    );
  };

  // Step 4: Import Results
  const renderImportStep = () => {
    const summary = {
      total: importResults.length,
      created: importResults.filter((r) => r.action === "created").length,
      overwritten: importResults.filter((r) => r.action === "overwritten").length,
      skipped: importResults.filter((r) => r.action === "skipped").length,
      errors: importResults.filter((r) => r.action === "error").length,
    };

    return (
      <Stack spacing={3}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {isSubmitting ? (
          <Stack spacing={2} alignItems="center" sx={{ py: 4 }}>
            <CircularProgress sx={{ color: "#13715B" }} />
            <Typography sx={{ fontSize: 14 }}>Importing risks...</Typography>
            <LinearProgress
              variant="determinate"
              value={importProgress}
              sx={{ width: "100%", "& .MuiLinearProgress-bar": { backgroundColor: "#13715B" } }}
            />
          </Stack>
        ) : importResults.length > 0 ? (
          <>
            <Alert severity="success">
              <AlertTitle>Import complete</AlertTitle>
              <Typography sx={{ fontSize: 13 }}>
                {summary.created} created, {summary.overwritten} overwritten, {summary.skipped}{" "}
                skipped, {summary.errors} errors
              </Typography>
            </Alert>

            <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Row</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Result</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importResults.map((result) => (
                    <TableRow key={result.rowIndex}>
                      <TableCell sx={{ fontSize: 12 }}>{result.rowIndex}</TableCell>
                      <TableCell>
                        <Chip
                          label={result.action}
                          color={
                            result.action === "created"
                              ? "success"
                              : result.action === "overwritten"
                              ? "info"
                              : result.action === "skipped"
                              ? "default"
                              : "error"
                          }
                          size="small"
                          sx={{ fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        {result.error || (result.riskId ? `ID: ${result.riskId}` : "-")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : null}
      </Stack>
    );
  };

  return (
    <StepperModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import risks"
      steps={steps}
      activeStep={activeStep}
      onNext={activeStep < 3 ? handleNext : undefined}
      onBack={activeStep > 0 && activeStep < 3 ? handleBack : undefined}
      onSubmit={activeStep === 3 ? handleSubmit : undefined}
      isSubmitting={isSubmitting}
      canProceed={canProceed}
      submitButtonText="Done"
      maxWidth="900px"
    >
      {renderStepContent()}
    </StepperModal>
  );
};

export default RiskImportModal;
