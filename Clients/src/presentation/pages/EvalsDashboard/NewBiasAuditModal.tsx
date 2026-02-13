/**
 * NewBiasAuditModal - Multi-step modal for creating a new bias audit
 *
 * Uses StepperModal to guide users through:
 * 1. Selecting a compliance framework preset
 * 2. Entering AEDT (Automated Employment Decision Tool) information
 * 3. Uploading demographic data and mapping columns
 * 4. Reviewing configuration and running the audit
 *
 * @component
 */

import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { Box, Stack, Typography, Grid, Chip, CircularProgress } from "@mui/material";
import { Upload, FileSpreadsheet, CheckCircle } from "lucide-react";
import StepperModal from "../../components/Modals/StepperModal";
import Field from "../../components/Inputs/Field";
import Select from "../../components/Inputs/Select";
import {
  listBiasAuditPresets,
  getBiasAuditPreset,
  runBiasAudit,
  type BiasAuditPresetSummary,
  type BiasAuditPreset,
  type CreateBiasAuditConfig,
} from "../../../application/repository/deepEval.repository";

interface NewBiasAuditModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback when modal closes */
  onClose: () => void;
  /** Organization ID for the audit */
  orgId: string;
  /** Callback when audit is successfully created */
  onAuditCreated: (auditId: string) => void;
}

/**
 * PresetCard - Card component for displaying a bias audit preset
 */
function PresetCard({
  preset,
  selected,
  onClick,
}: {
  preset: BiasAuditPresetSummary;
  selected: boolean;
  onClick: () => void;
}) {
  const modeColors: Record<string, { bg: string; color: string }> = {
    quantitative_audit: { bg: "#ECFDF5", color: "#065F46" },
    impact_assessment: { bg: "#EFF6FF", color: "#1E40AF" },
    compliance_checklist: { bg: "#FFF7ED", color: "#9A3412" },
    framework_assessment: { bg: "#F5F3FF", color: "#5B21B6" },
    custom: { bg: "#F9FAFB", color: "#374151" },
  };

  const modeLabels: Record<string, string> = {
    quantitative_audit: "Quantitative",
    impact_assessment: "Assessment",
    compliance_checklist: "Checklist",
    framework_assessment: "Framework",
    custom: "Custom",
  };

  const mc = modeColors[preset.mode] || modeColors.custom;

  return (
    <Box
      onClick={onClick}
      sx={{
        border: selected ? "2px solid #13715B" : "1px solid #d0d5dd",
        borderRadius: "4px",
        p: 2,
        cursor: "pointer",
        backgroundColor: selected ? "#F0FDF9" : "#fff",
        "&:hover": { borderColor: "#13715B" },
        transition: "border-color 0.15s",
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
            {preset.name}
          </Typography>
          <Chip
            label={modeLabels[preset.mode] || preset.mode}
            size="small"
            sx={{
              fontSize: 10,
              height: 20,
              backgroundColor: mc.bg,
              color: mc.color,
            }}
          />
        </Stack>
        <Typography sx={{ fontSize: 11, color: "#667085" }}>
          {preset.jurisdiction}
        </Typography>
        <Typography
          sx={{
            fontSize: 12,
            color: "#475467",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {preset.description}
        </Typography>
      </Stack>
    </Box>
  );
}

const NewBiasAuditModal: React.FC<NewBiasAuditModalProps> = ({
  isOpen,
  onClose,
  orgId,
  onAuditCreated,
}) => {
  // Step control
  const [activeStep, setActiveStep] = useState(0);

  // Step 1: Preset selection
  const [presets, setPresets] = useState<BiasAuditPresetSummary[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [fullPreset, setFullPreset] = useState<BiasAuditPreset | null>(null);
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [loadingPreset, setLoadingPreset] = useState(false);

  // Step 2: AEDT metadata
  const [aedtName, setAedtName] = useState("");
  const [aedtDescription, setAedtDescription] = useState("");
  const [distributionDate, setDistributionDate] = useState("");
  const [dataSourceDescription, setDataSourceDescription] = useState("");

  // Step 3: Demographic data
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [outcomeColumn, setOutcomeColumn] = useState("");

  // Step 4: Review & run
  const [threshold, setThreshold] = useState<number | null>(0.8);
  const [smallSampleExclusion, setSmallSampleExclusion] = useState<number | null>(null);
  const [intersectionalEnabled, setIntersectionalEnabled] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load presets on modal open
  useEffect(() => {
    if (!isOpen) return;
    setLoadingPresets(true);
    listBiasAuditPresets()
      .then(setPresets)
      .catch((err) => {
        console.error("Failed to load presets:", err);
      })
      .finally(() => setLoadingPresets(false));
  }, [isOpen]);

  // Handle preset selection
  const handlePresetSelect = async (presetId: string) => {
    setSelectedPresetId(presetId);
    setLoadingPreset(true);
    try {
      const preset = await getBiasAuditPreset(presetId);
      setFullPreset(preset);
      // Auto-fill from preset
      setThreshold(preset.threshold ?? 0.8);
      setSmallSampleExclusion(preset.small_sample_exclusion ?? null);
      setIntersectionalEnabled(preset.intersectional?.required ?? false);
    } catch (err) {
      console.error("Failed to load preset:", err);
    } finally {
      setLoadingPreset(false);
    }
  };

  // Handle CSV file upload and parsing
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length === 0) return;

      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/^"|"$/g, ""));
      setCsvHeaders(headers);

      const preview: string[][] = [];
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        preview.push(
          lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
        );
      }
      setCsvPreview(preview);
    };
    reader.readAsText(file);
  };

  // Handle column mapping change
  const handleColumnMappingChange = (categoryKey: string, columnName: string) => {
    setColumnMapping((prev) => ({ ...prev, [categoryKey]: columnName }));
  };

  // Handle final submission
  const handleSubmit = async () => {
    if (!csvFile || !fullPreset) return;
    setIsSubmitting(true);
    try {
      const config: CreateBiasAuditConfig = {
        presetId: fullPreset.id,
        presetName: fullPreset.name,
        mode: fullPreset.mode,
        orgId,
        categories: fullPreset.categories,
        intersectional: {
          required: intersectionalEnabled,
          cross: fullPreset.intersectional?.cross || [],
        },
        metrics: fullPreset.metrics,
        threshold,
        smallSampleExclusion: smallSampleExclusion,
        outcomeColumn,
        columnMapping,
        metadata: {
          aedt_name: aedtName,
          description: aedtDescription,
          distribution_date: distributionDate,
          data_source_description: dataSourceDescription,
        },
      };
      const result = await runBiasAudit(csvFile, config);
      onAuditCreated(result.auditId);
      handleClose();
    } catch (err) {
      console.error("Failed to create bias audit:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset all state on close
  const handleClose = () => {
    setActiveStep(0);
    setSelectedPresetId(null);
    setFullPreset(null);
    setAedtName("");
    setAedtDescription("");
    setDistributionDate("");
    setDataSourceDescription("");
    setCsvFile(null);
    setCsvHeaders([]);
    setCsvPreview([]);
    setColumnMapping({});
    setOutcomeColumn("");
    setThreshold(0.8);
    setSmallSampleExclusion(null);
    setIntersectionalEnabled(false);
    onClose();
  };

  // Determine if current step is valid
  const canProceed = (() => {
    switch (activeStep) {
      case 0:
        return !!selectedPresetId && !loadingPreset;
      case 1:
        return aedtName.trim().length > 0;
      case 2: {
        if (!csvFile || !outcomeColumn) return false;
        const categoryKeys = Object.keys(fullPreset?.categories || {});
        return categoryKeys.every((key) => !!columnMapping[key]);
      }
      case 3:
        return true;
      default:
        return false;
    }
  })();

  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderStep1();
      case 1:
        return renderStep2();
      case 2:
        return renderStep3();
      case 3:
        return renderStep4();
      default:
        return null;
    }
  };

  // Step 1: Compliance framework selection
  const renderStep1 = () => (
    <Stack spacing={3}>
      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#344054", mb: 1 }}>
          Select a compliance framework
        </Typography>
        <Typography sx={{ fontSize: 13, color: "#667085", mb: 3 }}>
          Choose the regulatory framework that applies to your bias audit
        </Typography>
      </Box>

      {loadingPresets ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={32} sx={{ color: "#13715B" }} />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {presets.map((preset) => (
            <Grid item xs={12} sm={6} md={4} key={preset.id}>
              <PresetCard
                preset={preset}
                selected={selectedPresetId === preset.id}
                onClick={() => handlePresetSelect(preset.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {loadingPreset && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={24} sx={{ color: "#13715B" }} />
        </Box>
      )}
    </Stack>
  );

  // Step 2: AEDT metadata
  const renderStep2 = () => (
    <Stack spacing={3}>
      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#344054", mb: 1 }}>
          Model / AEDT information
        </Typography>
        <Typography sx={{ fontSize: 13, color: "#667085", mb: 3 }}>
          Provide details about the Automated Employment Decision Tool being audited
        </Typography>
      </Box>

      <Field
        id="aedt-name"
        label="AEDT name"
        placeholder="Enter the name of your decision tool"
        value={aedtName}
        onChange={(e) => setAedtName(e.target.value)}
        isRequired
      />

      <Field
        id="aedt-description"
        label="Description"
        placeholder="Describe the purpose and function of this tool"
        value={aedtDescription}
        onChange={(e) => setAedtDescription(e.target.value)}
        type="description"
        rows={3}
        isOptional
      />

      <Field
        id="distribution-date"
        label="Distribution date"
        placeholder="YYYY-MM-DD"
        value={distributionDate}
        onChange={(e) => setDistributionDate(e.target.value)}
        isOptional
      />

      <Field
        id="data-source-description"
        label="Data source description"
        placeholder="Describe where this data comes from"
        value={dataSourceDescription}
        onChange={(e) => setDataSourceDescription(e.target.value)}
        type="description"
        rows={3}
        isOptional
      />
    </Stack>
  );

  // Step 3: Demographic data upload and mapping
  const renderStep3 = () => (
    <Stack spacing={3}>
      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#344054", mb: 1 }}>
          Upload demographic data
        </Typography>
        <Typography sx={{ fontSize: 13, color: "#667085", mb: 3 }}>
          Upload a CSV file containing demographic information and outcomes
        </Typography>
      </Box>

      {/* File upload area */}
      <Box
        sx={{
          border: "2px dashed #d0d5dd",
          borderRadius: "4px",
          p: 4,
          textAlign: "center",
          cursor: "pointer",
          "&:hover": { borderColor: "#13715B", backgroundColor: "#F9FAFB" },
          position: "relative",
        }}
        onClick={() => document.getElementById("csv-upload-input")?.click()}
      >
        <input
          id="csv-upload-input"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        {csvFile ? (
          <Stack alignItems="center" spacing={1}>
            <FileSpreadsheet size={32} color="#13715B" strokeWidth={1.5} />
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>
              {csvFile.name}
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#667085" }}>
              {csvHeaders.length} columns detected
            </Typography>
          </Stack>
        ) : (
          <Stack alignItems="center" spacing={1}>
            <Upload size={32} color="#98a2b3" strokeWidth={1.5} />
            <Typography sx={{ fontSize: 13, color: "#475467" }}>
              Click to upload CSV file
            </Typography>
            <Typography sx={{ fontSize: 12, color: "#98a2b3" }}>
              Comma-separated values with demographic columns
            </Typography>
          </Stack>
        )}
      </Box>

      {/* Column mapping */}
      {csvFile && csvHeaders.length > 0 && (
        <Stack spacing={2} mt={3}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#344054" }}>
            Column mapping
          </Typography>

          {Object.entries(fullPreset?.categories || {}).map(([key, cat]) => (
            <Stack key={key} direction="row" alignItems="center" spacing={2}>
              <Typography sx={{ fontSize: 13, color: "#475467", minWidth: 140 }}>
                {cat.label}
              </Typography>
              <Select
                id={`mapping-${key}`}
                value={columnMapping[key] || ""}
                onChange={(e) =>
                  handleColumnMappingChange(key, String(e.target.value))
                }
                items={csvHeaders.map((h) => ({ _id: h, name: h }))}
                placeholder={`Select column for ${cat.label}`}
                sx={{ flex: 1 }}
              />
            </Stack>
          ))}

          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography sx={{ fontSize: 13, color: "#475467", minWidth: 140 }}>
              Outcome column
            </Typography>
            <Select
              id="outcome-column"
              value={outcomeColumn}
              onChange={(e) => setOutcomeColumn(String(e.target.value))}
              items={csvHeaders.map((h) => ({ _id: h, name: h }))}
              placeholder="Select outcome column"
              sx={{ flex: 1 }}
            />
          </Stack>
        </Stack>
      )}

      {/* CSV preview */}
      {csvPreview.length > 0 && (
        <Box mt={3}>
          <Typography
            sx={{ fontSize: 13, fontWeight: 600, color: "#344054", mb: 2 }}
          >
            Data preview
          </Typography>
          <Box
            sx={{
              border: "1px solid #d0d5dd",
              borderRadius: "4px",
              overflow: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#F9FAFB" }}>
                  {csvHeaders.map((header, idx) => (
                    <th
                      key={idx}
                      style={{
                        padding: "8px 12px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "#344054",
                        borderBottom: "1px solid #d0d5dd",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvPreview.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    style={{
                      borderBottom:
                        rowIdx < csvPreview.length - 1
                          ? "1px solid #EAECF0"
                          : "none",
                    }}
                  >
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        style={{
                          padding: "8px 12px",
                          color: "#475467",
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box>
      )}
    </Stack>
  );

  // Step 4: Review & run
  const renderStep4 = () => (
    <Stack spacing={3}>
      <Box>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#344054", mb: 1 }}>
          Review & run
        </Typography>
        <Typography sx={{ fontSize: 13, color: "#667085", mb: 3 }}>
          Review your configuration and adjust audit settings before running
        </Typography>
      </Box>

      {/* Summary */}
      <Box sx={{ border: "1px solid #d0d5dd", borderRadius: "4px", p: 2 }}>
        <Typography
          sx={{ fontSize: 13, fontWeight: 600, color: "#344054", mb: 1.5 }}
        >
          Summary
        </Typography>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between">
            <Typography sx={{ fontSize: 13, color: "#667085" }}>
              Framework
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#111827", fontWeight: 500 }}>
              {fullPreset?.name}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography sx={{ fontSize: 13, color: "#667085" }}>
              AEDT name
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#111827" }}>
              {aedtName}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography sx={{ fontSize: 13, color: "#667085" }}>Dataset</Typography>
            <Typography sx={{ fontSize: 13, color: "#111827" }}>
              {csvFile?.name}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography sx={{ fontSize: 13, color: "#667085" }}>
              Categories
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#111827" }}>
              {Object.keys(fullPreset?.categories || {}).length}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {/* Audit settings */}
      <Stack spacing={2}>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#344054" }}>
          Audit settings
        </Typography>
        <Stack direction="row" spacing={2}>
          <Field
            id="threshold"
            label="Threshold (4/5ths rule)"
            type="number"
            value={threshold?.toString() || ""}
            onChange={(e) =>
              setThreshold(e.target.value ? parseFloat(e.target.value) : null)
            }
            sx={{ flex: 1 }}
          />
          <Field
            id="small-sample-exclusion"
            label="Small sample exclusion %"
            type="number"
            value={smallSampleExclusion?.toString() || ""}
            onChange={(e) =>
              setSmallSampleExclusion(
                e.target.value ? parseFloat(e.target.value) : null
              )
            }
            sx={{ flex: 1 }}
          />
        </Stack>
        {fullPreset?.intersectional && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <input
              type="checkbox"
              checked={intersectionalEnabled}
              onChange={(e) => setIntersectionalEnabled(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <Typography sx={{ fontSize: 13, color: "#475467" }}>
              Enable intersectional analysis (
              {fullPreset.intersectional.cross.join(" × ")})
            </Typography>
          </Stack>
        )}
      </Stack>
    </Stack>
  );

  return (
    <StepperModal
      isOpen={isOpen}
      onClose={handleClose}
      title="New bias audit"
      steps={[
        "Compliance framework",
        "Model / AEDT",
        "Demographic data",
        "Review & run",
      ]}
      activeStep={activeStep}
      onNext={() => setActiveStep((prev) => prev + 1)}
      onBack={() => setActiveStep((prev) => prev - 1)}
      onSubmit={handleSubmit}
      canProceed={canProceed}
      isSubmitting={isSubmitting}
      submitButtonText="Run audit"
      maxWidth="900px"
    >
      {renderStepContent()}
    </StepperModal>
  );
};

export default NewBiasAuditModal;
