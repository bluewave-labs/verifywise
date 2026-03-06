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
import Chip from "../../../../components/Chip";
import {
  FriaAssessment,
  FriaRight,
  FriaRiskItem,
} from "../../../../../application/hooks/useFria";
import FriaEvidenceButton from "../FriaEvidenceButton";

interface SummarySectionProps {
  assessment: FriaAssessment;
  rights: FriaRight[];
  riskItems: FriaRiskItem[];
  onUpdate: (data: Partial<FriaAssessment>) => void;
  isSaving: boolean;
}

const DEPLOYMENT_DECISION_OPTIONS = [
  { _id: "Proceed", name: "Proceed" },
  { _id: "Proceed with conditions", name: "Proceed with conditions" },
  { _id: "Do not proceed", name: "Do not proceed" },
  { _id: "Pending", name: "Pending" },
];

function SummarySection({
  assessment,
  rights,
  onUpdate,
  isSaving,
}: SummarySectionProps) {
  const theme = useTheme();

  const [decisionConditions, setDecisionConditions] = useState(
    assessment.decision_conditions ?? ""
  );

  const flaggedRights = rights.filter((r) => r.flagged);

  const handleDeploymentDecisionChange = (e: SelectChangeEvent<unknown>) => {
    onUpdate({ deployment_decision: e.target.value as string });
  };

  const handleDecisionConditionsBlur = () => {
    if (decisionConditions !== (assessment.decision_conditions ?? "")) {
      onUpdate({ decision_conditions: decisionConditions });
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
              8. Summary &amp; recommendation
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                color: theme.palette.text.secondary,
              }}
            >
              Review the overall assessment and record the deployment decision.
            </Typography>
          </Box>

          {/* Auto-generated summary (read-only) */}
          <Box
            sx={{
              p: 2,
              border: "1px solid #d0d5dd",
              borderRadius: "4px",
              backgroundColor: theme.palette.background.default,
            }}
            aria-label="Assessment summary"
          >
            <Stack spacing={0} gap="8px">
              <Box sx={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <Typography sx={{ fontSize: 13, color: theme.palette.text.primary }}>
                  Assessment:{" "}
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {assessment.completion_pct}% complete
                  </Box>
                  {" | "}Risk score:{" "}
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {assessment.risk_score}/100
                  </Box>
                </Typography>
                <Chip label={assessment.risk_level} size="small" />
                <Typography sx={{ fontSize: 13, color: theme.palette.text.primary }}>
                  {" | "}
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {assessment.rights_flagged}
                  </Box>{" "}
                  right{assessment.rights_flagged !== 1 ? "s" : ""} flagged
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>
                  Status:
                </Typography>
                <Chip label={assessment.status} size="small" />
              </Box>
            </Stack>

            {/* Flagged rights chips */}
            {flaggedRights.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px", mt: 1.5 }}>
                {flaggedRights.map((right) => (
                  <Chip
                    key={right.id}
                    label={right.right_title}
                    variant="warning"
                    size="small"
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* Deployment decision */}
          <Select
            id="deployment-decision"
            label="Deployment decision"
            placeholder="Select..."
            value={assessment.deployment_decision ?? ""}
            items={DEPLOYMENT_DECISION_OPTIONS}
            onChange={handleDeploymentDecisionChange}
            disabled={isSaving}
          />

          {/* Decision conditions / rationale */}
          <Field
            id="decision-conditions"
            label="Decision conditions / rationale"
            placeholder="Describe any conditions that must be met before deployment, or explain the rationale behind the deployment decision..."
            type="description"
            rows={4}
            value={decisionConditions}
            onChange={(e) => setDecisionConditions(e.target.value)}
            onBlur={handleDecisionConditionsBlur}
            disabled={isSaving}
          />

          <FriaEvidenceButton friaId={assessment.id} entityType="section_8" />
        </Stack>
      </CardContent>
    </Card>
  );
}

export default SummarySection;
