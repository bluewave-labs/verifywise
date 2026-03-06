import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Field from "../../../../components/Inputs/Field";
import DatePicker from "../../../../components/Inputs/Datepicker";
import { FriaAssessment } from "../../../../../application/hooks/useFria";
import FriaEvidenceButton from "../FriaEvidenceButton";

interface OrgProfileSectionProps {
  assessment: FriaAssessment;
  onUpdate: (data: Partial<FriaAssessment>) => void;
  isSaving: boolean;
}

function OrgProfileSection({ assessment, onUpdate, isSaving }: OrgProfileSectionProps) {
  const theme = useTheme();

  const [assessmentOwner, setAssessmentOwner] = useState(
    assessment.assessment_owner ?? ""
  );
  const [operationalContext, setOperationalContext] = useState(
    assessment.operational_context ?? ""
  );

  const handleOwnerBlur = () => {
    if (assessmentOwner !== (assessment.assessment_owner ?? "")) {
      onUpdate({ assessment_owner: assessmentOwner });
    }
  };

  const handleContextBlur = () => {
    if (operationalContext !== (assessment.operational_context ?? "")) {
      onUpdate({ operational_context: operationalContext });
    }
  };

  const handleDateChange = (value: unknown) => {
    const dateValue = value as { toISOString?: () => string } | null;
    const iso = dateValue?.toISOString ? dateValue.toISOString() : null;
    onUpdate({ assessment_date: iso });
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
              1. Organisation &amp; system profile
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                color: theme.palette.text.secondary,
              }}
            >
              Identify the deployer organisation and the AI system under assessment.
            </Typography>
            <Box
              sx={{
                marginTop: "8px",
                padding: "8px 12px",
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "4px",
                fontSize: 12,
                color: theme.palette.text.secondary,
                lineHeight: 1.6,
              }}
            >
              <strong>EU AI Act reference:</strong>{" "}
              <a href="https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1689#art_27" target="_blank" rel="noopener noreferrer" style={{ color: "#13715B" }}>
                Article 27(1)
              </a>{" "}
              requires deployers of high-risk AI systems to perform a fundamental rights impact assessment before putting the system into use.
            </Box>
          </Box>

          {/* Read-only fields */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: "8px",
            }}
          >
            <Field
              id="org-name"
              label="Organisation name"
              value={assessment.organization_name ?? ""}
              disabled
              onChange={() => {}}
            />
            <Field
              id="project-title"
              label="System / project name"
              value={assessment.project_title ?? ""}
              disabled
              onChange={() => {}}
            />
          </Box>

          {/* Editable fields */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: "8px",
            }}
          >
            <Field
              id="assessment-owner"
              label="Assessment owner"
              placeholder="Enter name or role"
              value={assessmentOwner}
              onChange={(e) => setAssessmentOwner(e.target.value)}
              onBlur={handleOwnerBlur}
              disabled={isSaving}
            />
            <DatePicker
              label="Assessment date"
              date={assessment.assessment_date ?? null}
              handleDateChange={handleDateChange}
              disabled={isSaving}
            />
          </Box>

          <Field
            id="operational-context"
            label="Operational context"
            placeholder="Describe the operational context, deployment environment and intended purpose of the AI system…"
            type="description"
            rows={4}
            value={operationalContext}
            onChange={(e) => setOperationalContext(e.target.value)}
            onBlur={handleContextBlur}
            disabled={isSaving}
          />

          <FriaEvidenceButton friaId={assessment.id} entityType="section_1" />
        </Stack>
      </CardContent>
    </Card>
  );
}

export default OrgProfileSection;
