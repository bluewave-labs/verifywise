import { useState, useCallback } from "react";
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
import Checkbox from "../../../../components/Inputs/Checkbox";
import { FriaRight } from "../../../../../application/hooks/useFria";
import FriaEvidenceButton from "../FriaEvidenceButton";

interface RightsMatrixSectionProps {
  friaId: number;
  rights: FriaRight[];
  onUpdateRights: (rights: Partial<FriaRight>[]) => void;
  isSaving: boolean;
}

const SEVERITY_OPTIONS = [
  { _id: 0, name: "0 — None" },
  { _id: 1, name: "1 — Low" },
  { _id: 2, name: "2 — Medium" },
  { _id: 3, name: "3 — High" },
];

const CONFIDENCE_OPTIONS = [
  { _id: 0, name: "0 — High confidence" },
  { _id: 1, name: "1 — Some uncertainty" },
  { _id: 2, name: "2 — Material uncertainty" },
];

function RightsMatrixSection({
  friaId,
  rights,
  onUpdateRights,
  isSaving,
}: RightsMatrixSectionProps) {
  const theme = useTheme();

  // Local state mirrors the rights array so edits are reflected immediately
  const [localRights, setLocalRights] = useState<FriaRight[]>(() =>
    rights.map((r) => ({ ...r }))
  );

  const updateLocalRight = useCallback(
    (index: number, patch: Partial<FriaRight>) => {
      setLocalRights((prev) => {
        const next = prev.map((r, i) => (i === index ? { ...r, ...patch } : r));
        return next;
      });
    },
    []
  );

  const flushToParent = useCallback(
    (updatedRights: FriaRight[]) => {
      onUpdateRights(updatedRights);
    },
    [onUpdateRights]
  );

  const handleFlagChange = (index: number, checked: boolean) => {
    const patch: Partial<FriaRight> = { flagged: checked };
    const next = localRights.map((r, i) =>
      i === index ? { ...r, ...patch } : r
    );
    setLocalRights(next);
    flushToParent(next);
  };

  const handleSelectChange =
    (index: number, field: "severity" | "confidence") =>
    (e: SelectChangeEvent<unknown>) => {
      const patch = { [field]: Number(e.target.value) };
      const next = localRights.map((r, i) =>
        i === index ? { ...r, ...patch } : r
      );
      setLocalRights(next);
      flushToParent(next);
    };

  const handleTextChange = (
    index: number,
    field: "impact_pathway" | "mitigation",
    value: string
  ) => {
    updateLocalRight(index, { [field]: value });
  };

  const handleTextBlur = () => {
    flushToParent(localRights);
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
              4. Fundamental rights matrix
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                color: theme.palette.text.secondary,
              }}
            >
              Assess the potential impact of the AI system on each fundamental right from the EU Charter.
            </Typography>
          </Box>

          {/* Rights grid */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
              gap: "8px",
            }}
          >
            {localRights.map((right, index) => (
              <Box
                key={right.id ?? right.right_key}
                sx={{
                  border: `1px solid ${right.flagged ? theme.palette.warning.light : "#d0d5dd"}`,
                  borderRadius: "4px",
                  p: 2,
                  backgroundColor: right.flagged
                    ? `${theme.palette.warning.main}08`
                    : theme.palette.background.paper,
                  transition: "border-color 0.15s ease, background-color 0.15s ease",
                }}
              >
                <Stack spacing={0} gap="8px">
                  {/* Right title + flag checkbox */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          lineHeight: 1.4,
                        }}
                      >
                        {right.right_title}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: theme.palette.text.secondary,
                          mt: 0.25,
                        }}
                      >
                        {right.charter_ref}
                      </Typography>
                    </Box>

                    <Box sx={{ flexShrink: 0, pt: 0.25 }}>
                      <Checkbox
                        id={`flag-right-${right.right_key}`}
                        label="Flag"
                        isChecked={right.flagged}
                        value={right.right_key}
                        onChange={(e) =>
                          handleFlagChange(index, e.target.checked)
                        }
                        isDisabled={isSaving}
                      />
                    </Box>
                  </Box>

                  {/* Expanded fields when flagged */}
                  {right.flagged && (
                    <Stack spacing={0} gap="8px">
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "8px",
                        }}
                      >
                        <Select
                          id={`severity-${right.right_key}`}
                          label="Severity"
                          placeholder="Select…"
                          value={right.severity ?? 0}
                          items={SEVERITY_OPTIONS}
                          onChange={handleSelectChange(index, "severity")}
                          disabled={isSaving}
                          sx={{ width: "100%" }}
                        />
                        <Select
                          id={`confidence-${right.right_key}`}
                          label="Confidence"
                          placeholder="Select…"
                          value={right.confidence ?? 0}
                          items={CONFIDENCE_OPTIONS}
                          onChange={handleSelectChange(index, "confidence")}
                          disabled={isSaving}
                          sx={{ width: "100%" }}
                        />
                      </Box>

                      <Box onBlur={handleTextBlur}>
                        <Field
                          id={`impact-${right.right_key}`}
                          label="Impact pathway"
                          placeholder="Describe how this right may be impacted…"
                          type="description"
                          rows={3}
                          value={right.impact_pathway ?? ""}
                          onChange={(e) =>
                            handleTextChange(
                              index,
                              "impact_pathway",
                              e.target.value
                            )
                          }
                          disabled={isSaving}
                        />
                      </Box>

                      <Box onBlur={handleTextBlur}>
                        <Field
                          id={`mitigation-${right.right_key}`}
                          label="Mitigation measures"
                          placeholder="Describe measures to mitigate the identified impact…"
                          type="description"
                          rows={3}
                          value={right.mitigation ?? ""}
                          onChange={(e) =>
                            handleTextChange(
                              index,
                              "mitigation",
                              e.target.value
                            )
                          }
                          disabled={isSaving}
                        />
                      </Box>
                    </Stack>
                  )}
                </Stack>
              </Box>
            ))}
          </Box>

          {localRights.length === 0 && (
            <Box
              sx={{
                py: 4,
                textAlign: "center",
                color: theme.palette.text.secondary,
                fontSize: 13,
              }}
            >
              No fundamental rights loaded. Save the FRIA to generate the rights matrix.
            </Box>
          )}

          <FriaEvidenceButton friaId={friaId} entityType="section_4" />
        </Stack>
      </CardContent>
    </Card>
  );
}

export default RightsMatrixSection;
