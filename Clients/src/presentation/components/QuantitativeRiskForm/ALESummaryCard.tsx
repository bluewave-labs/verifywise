import { FC } from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { IQuantitativeRiskFields } from "../../../domain/interfaces/i.quantitativeRisk";
import {
  computeDerivedFields,
  formatCurrency,
  formatPercentage,
} from "../../tools/fairCalculator";

interface ALESummaryCardProps {
  fields: Partial<IQuantitativeRiskFields>;
}

/**
 * Live ALE summary card that shows computed FAIR values.
 * Recalculates on every render from the current field values.
 */
const ALESummaryCard: FC<ALESummaryCardProps> = ({ fields }) => {
  const theme = useTheme();
  const derived = computeDerivedFields(fields);
  const currency = fields.currency || "USD";

  const hasData = derived.ale_estimate != null;

  const metrics = [
    {
      label: "Total Loss (PERT)",
      value: formatCurrency(derived.total_loss_likely, currency),
    },
    {
      label: "Annualized Loss (ALE)",
      value: formatCurrency(derived.ale_estimate, currency),
      highlight: true,
    },
    {
      label: "Residual ALE",
      value: formatCurrency(derived.residual_ale, currency),
    },
    {
      label: "ROI",
      value: formatPercentage(derived.roi_percentage),
      color:
        derived.roi_percentage != null && derived.roi_percentage > 0
          ? theme.palette.success.main
          : derived.roi_percentage != null && derived.roi_percentage < 0
          ? theme.palette.error.main
          : undefined,
    },
  ];

  if (!hasData) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: `1px dashed ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Typography
          sx={{
            fontSize: 13,
            color: theme.palette.text.tertiary,
            textAlign: "center",
          }}
        >
          Enter frequency and loss values to see the ALE calculation
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 600,
          color: theme.palette.text.primary,
          mb: 1.5,
        }}
      >
        Risk Exposure Summary
      </Typography>
      <Stack direction="row" sx={{ gap: 3, flexWrap: "wrap" }}>
        {metrics.map((metric) => (
          <Stack key={metric.label} sx={{ minWidth: 140 }}>
            <Typography
              sx={{
                fontSize: 11,
                color: theme.palette.text.tertiary,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              {metric.label}
            </Typography>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 600,
                color: metric.color || theme.palette.text.primary,
              }}
            >
              {metric.value}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

export default ALESummaryCard;
