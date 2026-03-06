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
import { FriaAssessment } from "../../../../../application/hooks/useFria";
import FriaEvidenceButton from "../FriaEvidenceButton";

interface OversightSectionProps {
  assessment: FriaAssessment;
  onUpdate: (data: Partial<FriaAssessment>) => void;
  isSaving: boolean;
}

function OversightSection({
  assessment,
  onUpdate,
  isSaving,
}: OversightSectionProps) {
  const theme = useTheme();

  const [humanOversight, setHumanOversight] = useState(
    assessment.human_oversight ?? ""
  );
  const [transparencyMeasures, setTransparencyMeasures] = useState(
    assessment.transparency_measures ?? ""
  );
  const [redressProcess, setRedressProcess] = useState(
    assessment.redress_process ?? ""
  );
  const [dataGovernance, setDataGovernance] = useState(
    assessment.data_governance ?? ""
  );

  const handleBlur =
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
              6. Human oversight, transparency &amp; contestability
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                color: theme.palette.text.secondary,
              }}
            >
              Describe the measures in place to ensure human oversight, transparency, and the ability to contest AI-driven decisions.
            </Typography>
          </Box>

          <Field
            id="human-oversight"
            label="Human oversight measures"
            placeholder="Describe the human oversight mechanisms and controls in place, including who is responsible and how interventions are made…"
            type="description"
            rows={3}
            value={humanOversight}
            onChange={(e) => setHumanOversight(e.target.value)}
            onBlur={handleBlur("human_oversight", humanOversight, assessment.human_oversight)}
            disabled={isSaving}
          />

          <Field
            id="transparency-measures"
            label="Transparency measures"
            placeholder="Describe how affected individuals are informed about the use of the AI system and what information is disclosed…"
            type="description"
            rows={3}
            value={transparencyMeasures}
            onChange={(e) => setTransparencyMeasures(e.target.value)}
            onBlur={handleBlur(
              "transparency_measures",
              transparencyMeasures,
              assessment.transparency_measures
            )}
            disabled={isSaving}
          />

          <Field
            id="redress-process"
            label="Redress and contestability process"
            placeholder="Describe the process for individuals to contest AI-driven decisions, seek human review, and obtain redress…"
            type="description"
            rows={3}
            value={redressProcess}
            onChange={(e) => setRedressProcess(e.target.value)}
            onBlur={handleBlur("redress_process", redressProcess, assessment.redress_process)}
            disabled={isSaving}
          />

          <Field
            id="data-governance"
            label="Data governance arrangements"
            placeholder="Describe the data governance practices, data quality controls, and data management procedures relevant to this AI system…"
            type="description"
            rows={3}
            value={dataGovernance}
            onChange={(e) => setDataGovernance(e.target.value)}
            onBlur={handleBlur("data_governance", dataGovernance, assessment.data_governance)}
            disabled={isSaving}
          />

          <FriaEvidenceButton friaId={assessment.id} entityType="section_6" />
        </Stack>
      </CardContent>
    </Card>
  );
}

export default OversightSection;
