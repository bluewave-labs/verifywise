import { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Collapse,
  useTheme,
} from "@mui/material";
import { FileText, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { useEntityIntakeSubmission } from "../../../../application/hooks/useEntityIntakeSubmission";
import type { IntakeSubmissionField } from "../../../../application/repository/intakeForm.repository";
import dayjs from "dayjs";

interface IntakeSubmissionCardProps {
  projectId: number;
}

function renderFieldValue(field: IntakeSubmissionField): string {
  const { value, type, options } = field;
  if (value === null || value === undefined || value === "") return "\u2014";

  if (type === "checkbox") return value ? "Yes" : "No";

  if (type === "date") {
    return dayjs(value as string).isValid()
      ? dayjs(value as string).format("MMMM D, YYYY")
      : String(value);
  }

  if (type === "select" && options) {
    const match = options.find((o) => o.value === value);
    return match ? match.label : String(value);
  }

  if (type === "multiselect" && Array.isArray(value) && options) {
    return value
      .map((v) => options.find((o) => o.value === v)?.label || v)
      .join(", ");
  }

  return String(value);
}

export default function IntakeSubmissionCard({
  projectId,
}: IntakeSubmissionCardProps) {
  const theme = useTheme();
  const { data: submission, isLoading } = useEntityIntakeSubmission(
    "use_case",
    projectId
  );
  const [showUnmapped, setShowUnmapped] = useState(true);

  if (isLoading || !submission) return null;

  const mappedFields = submission.fields.filter(
    (f) => f.isMapped && f.value !== null && f.value !== undefined && f.value !== ""
  );
  const unmappedFields = submission.fields.filter(
    (f) => !f.isMapped && f.value !== null && f.value !== undefined && f.value !== ""
  );

  if (mappedFields.length === 0 && unmappedFields.length === 0) return null;

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.border.dark}`,
        borderRadius: "4px",
        backgroundColor: theme.palette.background.main,
        mb: 3,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: "12px 16px",
          borderBottom: `1px solid ${theme.palette.border.light}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" gap="8px" alignItems="center">
          <FileText
            size={16}
            color={theme.palette.text.tertiary}
            strokeWidth={1.5}
          />
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: theme.palette.text.primary,
            }}
          >
            Intake form submission
          </Typography>
          {submission.riskTier && (
            <Box
              sx={{
                fontSize: 11,
                fontWeight: 500,
                px: "6px",
                py: "2px",
                borderRadius: "4px",
                backgroundColor:
                  submission.riskTier.toLowerCase() === "high"
                    ? "#FFE5D0"
                    : submission.riskTier.toLowerCase() === "medium"
                      ? "#FFF8E1"
                      : "#E6F4EA",
                color:
                  submission.riskTier.toLowerCase() === "high"
                    ? "#E64A19"
                    : submission.riskTier.toLowerCase() === "medium"
                      ? "#795548"
                      : "#138A5E",
              }}
            >
              {submission.riskTier}
            </Box>
          )}
        </Stack>
        <Typography sx={{ fontSize: 12, color: theme.palette.text.accent }}>
          From &quot;{submission.formName}&quot;
          {submission.submittedAt && (
            <> &mdash; {dayjs(submission.submittedAt).format("MMM D, YYYY")}</>
          )}
        </Typography>
      </Box>

      {/* Submitter info */}
      {(submission.submitterName || submission.submitterEmail) && (
        <Box sx={{ px: 2, pt: 1.5, pb: 0 }}>
          <Typography sx={{ fontSize: 12, color: theme.palette.text.accent }}>
            Submitted by{" "}
            <Box
              component="span"
              sx={{
                fontWeight: 500,
                color: theme.palette.text.secondary,
              }}
            >
              {submission.submitterName || submission.submitterEmail}
            </Box>
            {submission.submitterName && submission.submitterEmail && (
              <> ({submission.submitterEmail})</>
            )}
          </Typography>
        </Box>
      )}

      {/* Mapped fields */}
      {mappedFields.length > 0 && (
        <Box sx={{ p: 2 }}>
          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 500,
              color: theme.palette.text.accent,
              mb: 1.5,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Mapped to use case fields
          </Typography>
          <Stack gap="12px">
            {mappedFields.map((field) => (
              <Box key={field.fieldId}>
                <Stack
                  direction="row"
                  alignItems="center"
                  gap="4px"
                  sx={{ mb: 0.25 }}
                >
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: theme.palette.text.secondary,
                    }}
                  >
                    {field.label}
                  </Typography>
                  <ArrowRight size={12} color={theme.palette.text.accent} />
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: theme.palette.text.accent,
                      fontStyle: "italic",
                    }}
                  >
                    {field.entityFieldMapping?.replace(/_/g, " ")}
                  </Typography>
                </Stack>
                <Typography
                  sx={{
                    fontSize: 13,
                    color: theme.palette.text.primary,
                    wordBreak: "break-word",
                  }}
                >
                  {renderFieldValue(field)}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Unmapped fields */}
      {unmappedFields.length > 0 && (
        <Box
          sx={{
            borderTop: `1px solid ${theme.palette.border.light}`,
          }}
        >
          <Box
            component="button"
            onClick={() => setShowUnmapped((prev) => !prev)}
            sx={{
              width: "100%",
              p: "10px 16px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: theme.palette.text.tertiary,
              fontSize: "13px",
              fontWeight: 500,
              fontFamily: "inherit",
              "&:hover": { color: theme.palette.text.primary },
            }}
          >
            {showUnmapped ? (
              <ChevronUp size={15} />
            ) : (
              <ChevronDown size={15} />
            )}
            Additional intake answers ({unmappedFields.length})
          </Box>
          <Collapse in={showUnmapped} timeout="auto" unmountOnExit>
            <Stack gap="12px" sx={{ px: 2, pb: 2 }}>
              {unmappedFields.map((field) => (
                <Box key={field.fieldId}>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: theme.palette.text.secondary,
                      mb: 0.25,
                    }}
                  >
                    {field.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: theme.palette.text.primary,
                      wordBreak: "break-word",
                    }}
                  >
                    {renderFieldValue(field)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Collapse>
        </Box>
      )}
    </Box>
  );
}
