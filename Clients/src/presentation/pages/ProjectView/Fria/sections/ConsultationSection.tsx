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
import { FriaAssessment } from "../../../../../application/hooks/useFria";
import FriaEvidenceButton from "../FriaEvidenceButton";

interface ConsultationSectionProps {
  assessment: FriaAssessment;
  onUpdate: (data: Partial<FriaAssessment>) => void;
  isSaving: boolean;
}

const REVIEW_STATUS_OPTIONS = [
  { _id: "Yes", name: "Yes" },
  { _id: "No", name: "No" },
  { _id: "Planned", name: "Planned" },
];

function ConsultationSection({
  assessment,
  onUpdate,
  isSaving,
}: ConsultationSectionProps) {
  const theme = useTheme();

  const [stakeholdersConsulted, setStakeholdersConsulted] = useState(
    assessment.stakeholders_consulted ?? ""
  );
  const [consultationNotes, setConsultationNotes] = useState(
    assessment.consultation_notes ?? ""
  );

  const handleSelectChange =
    (field: keyof FriaAssessment) => (e: SelectChangeEvent<unknown>) => {
      onUpdate({ [field]: e.target.value as string });
    };

  const handleTextBlur =
    (
      field: keyof FriaAssessment,
      currentVal: string,
      originalVal: string | null
    ) =>
    () => {
      if (currentVal !== (originalVal ?? "")) {
        onUpdate({ [field]: currentVal });
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
      <CardContent sx={{ padding: "16px", "&:last-child": { paddingBottom: "16px" } }}>
        <Stack spacing={0} gap="8px">
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
              7. Stakeholder consultation &amp; sign-off
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                color: theme.palette.text.secondary,
              }}
            >
              Record the consultation process and approvals required before deploying the AI system.
            </Typography>
          </Box>

          {/* Review status grid — 3 columns */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
              gap: "8px",
            }}
          >
            <Select
              id="legal-review"
              label="Legal review status"
              placeholder="Select…"
              value={assessment.legal_review ?? ""}
              items={REVIEW_STATUS_OPTIONS}
              onChange={handleSelectChange("legal_review")}
              disabled={isSaving}
            />

            <Select
              id="dpo-review"
              label="DPO review status"
              placeholder="Select…"
              value={assessment.dpo_review ?? ""}
              items={REVIEW_STATUS_OPTIONS}
              onChange={handleSelectChange("dpo_review")}
              disabled={isSaving}
            />

            <Select
              id="owner-approval"
              label="Owner approval status"
              placeholder="Select…"
              value={assessment.owner_approval ?? ""}
              items={REVIEW_STATUS_OPTIONS}
              onChange={handleSelectChange("owner_approval")}
              disabled={isSaving}
            />
          </Box>

          {/* Stakeholders consulted */}
          <Field
            id="stakeholders-consulted"
            label="Stakeholders consulted"
            placeholder="List the individuals, teams, or external parties consulted during this assessment…"
            type="description"
            rows={3}
            value={stakeholdersConsulted}
            onChange={(e) => setStakeholdersConsulted(e.target.value)}
            onBlur={handleTextBlur(
              "stakeholders_consulted",
              stakeholdersConsulted,
              assessment.stakeholders_consulted
            )}
            disabled={isSaving}
          />

          {/* Consultation notes */}
          <Field
            id="consultation-notes"
            label="Consultation notes"
            placeholder="Summarise the key findings, concerns raised, and outcomes from the consultation process…"
            type="description"
            rows={4}
            value={consultationNotes}
            onChange={(e) => setConsultationNotes(e.target.value)}
            onBlur={handleTextBlur(
              "consultation_notes",
              consultationNotes,
              assessment.consultation_notes
            )}
            disabled={isSaving}
          />

          <FriaEvidenceButton friaId={assessment.id} entityType="section_7" />
        </Stack>
      </CardContent>
    </Card>
  );
}

export default ConsultationSection;
