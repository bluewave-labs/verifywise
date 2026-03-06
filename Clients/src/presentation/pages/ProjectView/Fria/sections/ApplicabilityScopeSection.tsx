import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { SelectChangeEvent } from "@mui/material/Select";
import Field from "../../../../components/Inputs/Field";
import Select from "../../../../components/Inputs/Select";
import DatePicker from "../../../../components/Inputs/Datepicker";
import { FriaAssessment } from "../../../../../application/hooks/useFria";
import FriaEvidenceButton from "../FriaEvidenceButton";

interface ApplicabilityScopeSectionProps {
  assessment: FriaAssessment;
  onUpdate: (data: Partial<FriaAssessment>) => void;
  isSaving: boolean;
}

const HIGH_RISK_OPTIONS = [
  { _id: "Yes", name: "Yes" },
  { _id: "No", name: "No" },
  { _id: "Needs legal review", name: "Needs legal review" },
];

const HIGH_RISK_BASIS_OPTIONS = [
  { _id: "Annex I product", name: "Annex I product" },
  { _id: "Annex III use case", name: "Annex III use case" },
  { _id: "Unclear", name: "Unclear" },
];

const DEPLOYER_TYPE_OPTIONS = [
  { _id: "Body governed by public law", name: "Body governed by public law" },
  { _id: "Private entity serving public interest", name: "Private entity serving public interest" },
  { _id: "Private entity", name: "Private entity" },
  { _id: "Other", name: "Other" },
];

const ANNEX_III_OPTIONS = [
  { _id: "1-Biometric identification", name: "1 — Biometric identification" },
  { _id: "2-Critical infrastructure", name: "2 — Critical infrastructure" },
  { _id: "3-Education", name: "3 — Education" },
  { _id: "4-Employment", name: "4 — Employment" },
  { _id: "5-Essential services", name: "5 — Essential services" },
  { _id: "6-Law enforcement", name: "6 — Law enforcement" },
  { _id: "7-Migration/asylum", name: "7 — Migration / asylum" },
  { _id: "8-Administration of justice", name: "8 — Administration of justice" },
];

const REVIEW_CYCLE_OPTIONS = [
  { _id: "Quarterly", name: "Quarterly" },
  { _id: "Every 6 months", name: "Every 6 months" },
  { _id: "Annually", name: "Annually" },
  { _id: "On material change", name: "On material change" },
];

function ApplicabilityScopeSection({
  assessment,
  onUpdate,
  isSaving,
}: ApplicabilityScopeSectionProps) {
  const theme = useTheme();

  const [periodFrequency, setPeriodFrequency] = useState(
    assessment.period_frequency ?? ""
  );
  const [friaRationale, setFriaRationale] = useState(
    assessment.fria_rationale ?? ""
  );

  const handleSelectChange =
    (field: keyof FriaAssessment) => (e: SelectChangeEvent<unknown>) => {
      onUpdate({ [field]: e.target.value as string });
    };

  const handleFirstUseDateChange = (value: unknown) => {
    const dateValue = value as { toISOString?: () => string } | null;
    const iso = dateValue?.toISOString ? dateValue.toISOString() : null;
    onUpdate({ first_use_date: iso });
  };

  const handlePeriodFrequencyBlur = () => {
    if (periodFrequency !== (assessment.period_frequency ?? "")) {
      onUpdate({ period_frequency: periodFrequency });
    }
  };

  const handleFriaRationaleBlur = () => {
    if (friaRationale !== (assessment.fria_rationale ?? "")) {
      onUpdate({ fria_rationale: friaRationale });
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: "#d0d5dd",
        borderRadius: "4px",
        boxShadow: "none",
      }}
    >
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Stack spacing={2.5}>
          {/* Section header */}
          <Box>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              2. Applicability &amp; scope
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                color: theme.palette.text.secondary,
              }}
            >
              Determine if this AI system requires a FRIA under EU AI Act Article 27.
            </Typography>
          </Box>

          {/* Row 1: high-risk classification */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <Select
              id="is-high-risk"
              label="Is this a high-risk AI system?"
              placeholder="Select…"
              value={assessment.is_high_risk ?? ""}
              items={HIGH_RISK_OPTIONS}
              onChange={handleSelectChange("is_high_risk")}
              disabled={isSaving}
            />

            {assessment.is_high_risk === "Yes" && (
              <Select
                id="high-risk-basis"
                label="High-risk basis"
                placeholder="Select…"
                value={assessment.high_risk_basis ?? ""}
                items={HIGH_RISK_BASIS_OPTIONS}
                onChange={handleSelectChange("high_risk_basis")}
                disabled={isSaving}
              />
            )}
          </Box>

          {/* Row 2: deployer type + Annex III */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <Select
              id="deployer-type"
              label="Deployer type"
              placeholder="Select…"
              value={assessment.deployer_type ?? ""}
              items={DEPLOYER_TYPE_OPTIONS}
              onChange={handleSelectChange("deployer_type")}
              disabled={isSaving}
            />

            <Select
              id="annex-iii-category"
              label="Annex III category"
              placeholder="Select…"
              value={assessment.annex_iii_category ?? ""}
              items={ANNEX_III_OPTIONS}
              onChange={handleSelectChange("annex_iii_category")}
              disabled={isSaving}
            />
          </Box>

          {/* Row 3: dates + review cycle */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <DatePicker
              label="First use date"
              date={assessment.first_use_date ?? null}
              handleDateChange={handleFirstUseDateChange}
              disabled={isSaving}
            />

            <Select
              id="review-cycle"
              label="Review cycle"
              placeholder="Select…"
              value={assessment.review_cycle ?? ""}
              items={REVIEW_CYCLE_OPTIONS}
              onChange={handleSelectChange("review_cycle")}
              disabled={isSaving}
            />
          </Box>

          {/* Period / frequency details */}
          <Field
            id="period-frequency"
            label="Period / frequency details"
            placeholder="Describe any additional scheduling detail for assessments and reviews…"
            type="description"
            rows={3}
            value={periodFrequency}
            onChange={(e) => setPeriodFrequency(e.target.value)}
            onBlur={handlePeriodFrequencyBlur}
            disabled={isSaving}
          />

          {/* FRIA rationale */}
          <Field
            id="fria-rationale"
            label="FRIA rationale"
            placeholder="Explain why a FRIA is required or not required for this system, referencing the relevant legal basis…"
            type="description"
            rows={4}
            value={friaRationale}
            onChange={(e) => setFriaRationale(e.target.value)}
            onBlur={handleFriaRationaleBlur}
            disabled={isSaving}
          />

          <FriaEvidenceButton friaId={assessment.id} entityType="section_2" />
        </Stack>
      </CardContent>
    </Card>
  );
}

export default ApplicabilityScopeSection;
