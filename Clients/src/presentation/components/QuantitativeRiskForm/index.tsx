import { FC, useCallback } from "react";
import { Stack, Typography, useTheme, Divider } from "@mui/material";
import Field from "../Inputs/Field";
import { IQuantitativeRiskFields } from "../../../domain/interfaces/i.quantitativeRisk";
import { IRiskBenchmark } from "../../../domain/interfaces/i.quantitativeRisk";
import BenchmarkSelector from "./BenchmarkSelector";
import MitigationROI from "./MitigationROI";
import ALESummaryCard from "./ALESummaryCard";

// Layout constants matching RisksSection
const LAYOUT = {
  FIELD_WIDTH: 200,
  HORIZONTAL_GAP: 8,
  VERTICAL_GAP: 16,
} as const;

export interface QuantitativeRiskFormValues {
  event_frequency_min: number | null;
  event_frequency_likely: number | null;
  event_frequency_max: number | null;
  loss_regulatory_min: number | null;
  loss_regulatory_likely: number | null;
  loss_regulatory_max: number | null;
  loss_operational_min: number | null;
  loss_operational_likely: number | null;
  loss_operational_max: number | null;
  loss_litigation_min: number | null;
  loss_litigation_likely: number | null;
  loss_litigation_max: number | null;
  loss_reputational_min: number | null;
  loss_reputational_likely: number | null;
  loss_reputational_max: number | null;
  control_effectiveness: number | null;
  mitigation_cost_annual: number | null;
  benchmark_id: number | null;
  currency: string | null;
}

export const quantitativeInitialState: QuantitativeRiskFormValues = {
  event_frequency_min: null,
  event_frequency_likely: null,
  event_frequency_max: null,
  loss_regulatory_min: null,
  loss_regulatory_likely: null,
  loss_regulatory_max: null,
  loss_operational_min: null,
  loss_operational_likely: null,
  loss_operational_max: null,
  loss_litigation_min: null,
  loss_litigation_likely: null,
  loss_litigation_max: null,
  loss_reputational_min: null,
  loss_reputational_likely: null,
  loss_reputational_max: null,
  control_effectiveness: null,
  mitigation_cost_annual: null,
  benchmark_id: null,
  currency: "USD",
};

interface QuantitativeRiskFormProps {
  values: QuantitativeRiskFormValues;
  onChange: (values: QuantitativeRiskFormValues) => void;
  disabled?: boolean;
}

/**
 * FAIR quantitative risk assessment form section.
 * Renders frequency inputs, 4 loss category rows (min/likely/max),
 * benchmark selector, mitigation/ROI controls, and live ALE summary.
 */
const QuantitativeRiskForm: FC<QuantitativeRiskFormProps> = ({
  values,
  onChange,
  disabled = false,
}) => {
  const theme = useTheme();

  const fieldWidth = `${LAYOUT.FIELD_WIDTH}px`;

  const handleFieldChange = useCallback(
    (field: keyof QuantitativeRiskFormValues) =>
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const val = event.target.value;
        onChange({
          ...values,
          [field]: val === "" ? null : parseFloat(val),
        });
      },
    [values, onChange]
  );

  const handleBenchmarkApply = useCallback(
    (benchmark: IRiskBenchmark) => {
      onChange({
        ...values,
        event_frequency_min: benchmark.event_frequency_min ?? null,
        event_frequency_likely: benchmark.event_frequency_likely ?? null,
        event_frequency_max: benchmark.event_frequency_max ?? null,
        loss_regulatory_min: benchmark.loss_regulatory_min ?? null,
        loss_regulatory_likely: benchmark.loss_regulatory_likely ?? null,
        loss_regulatory_max: benchmark.loss_regulatory_max ?? null,
        loss_operational_min: benchmark.loss_operational_min ?? null,
        loss_operational_likely: benchmark.loss_operational_likely ?? null,
        loss_operational_max: benchmark.loss_operational_max ?? null,
        loss_litigation_min: benchmark.loss_litigation_min ?? null,
        loss_litigation_likely: benchmark.loss_litigation_likely ?? null,
        loss_litigation_max: benchmark.loss_litigation_max ?? null,
        loss_reputational_min: benchmark.loss_reputational_min ?? null,
        loss_reputational_likely: benchmark.loss_reputational_likely ?? null,
        loss_reputational_max: benchmark.loss_reputational_max ?? null,
        benchmark_id: benchmark.id ?? null,
      });
    },
    [values, onChange]
  );

  // Build the fields object for the summary card
  const fairFields: Partial<IQuantitativeRiskFields> = { ...values };

  const formRowStyles = {
    display: "flex",
    flexDirection: "row" as const,
    gap: `${LAYOUT.HORIZONTAL_GAP}px`,
    alignItems: "flex-end",
  };

  /**
   * Renders a three-point estimate row (min / likely / max)
   */
  const renderThreePointRow = (
    label: string,
    prefix: string,
    unit: string
  ) => (
    <Stack sx={{ gap: 1 }}>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 500,
          color: theme.palette.text.secondary,
        }}
      >
        {label}
      </Typography>
      <Stack sx={formRowStyles}>
        <Field
          id={`${prefix}-min-input`}
          label="Min"
          placeholder={unit === "$" ? "0" : "0.0"}
          type="number"
          value={
            values[`${prefix}_min` as keyof QuantitativeRiskFormValues] != null
              ? String(
                  values[`${prefix}_min` as keyof QuantitativeRiskFormValues]
                )
              : ""
          }
          onChange={handleFieldChange(
            `${prefix}_min` as keyof QuantitativeRiskFormValues
          )}
          disabled={disabled}
          sx={{ width: fieldWidth }}
        />
        <Field
          id={`${prefix}-likely-input`}
          label="Most likely"
          placeholder={unit === "$" ? "0" : "0.0"}
          type="number"
          value={
            values[
              `${prefix}_likely` as keyof QuantitativeRiskFormValues
            ] != null
              ? String(
                  values[
                    `${prefix}_likely` as keyof QuantitativeRiskFormValues
                  ]
                )
              : ""
          }
          onChange={handleFieldChange(
            `${prefix}_likely` as keyof QuantitativeRiskFormValues
          )}
          disabled={disabled}
          sx={{ width: fieldWidth }}
        />
        <Field
          id={`${prefix}-max-input`}
          label="Max"
          placeholder={unit === "$" ? "0" : "0.0"}
          type="number"
          value={
            values[`${prefix}_max` as keyof QuantitativeRiskFormValues] != null
              ? String(
                  values[`${prefix}_max` as keyof QuantitativeRiskFormValues]
                )
              : ""
          }
          onChange={handleFieldChange(
            `${prefix}_max` as keyof QuantitativeRiskFormValues
          )}
          disabled={disabled}
          sx={{ width: fieldWidth }}
        />
      </Stack>
    </Stack>
  );

  return (
    <Stack sx={{ gap: 3 }}>
      {/* Benchmark selector */}
      <BenchmarkSelector onApply={handleBenchmarkApply} disabled={disabled} />

      <Divider />

      {/* Event Frequency */}
      <Stack sx={{ gap: 2 }}>
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          Event Frequency (annualized)
        </Typography>
        <Typography
          sx={{
            fontSize: theme.typography.fontSize,
            color: theme.palette.text.tertiary,
            lineHeight: 1.5,
          }}
        >
          How often is this risk event expected to occur per year? Use
          three-point estimates (min / most likely / max).
        </Typography>
        {renderThreePointRow(
          "Frequency (times per year)",
          "event_frequency",
          "#"
        )}
      </Stack>

      <Divider />

      {/* Loss Magnitude */}
      <Stack sx={{ gap: 2 }}>
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          Loss Magnitude ($)
        </Typography>
        <Typography
          sx={{
            fontSize: theme.typography.fontSize,
            color: theme.palette.text.tertiary,
            lineHeight: 1.5,
          }}
        >
          Estimate the monetary impact per occurrence across four loss
          categories.
        </Typography>
        {renderThreePointRow("Regulatory fines", "loss_regulatory", "$")}
        {renderThreePointRow("Operational costs", "loss_operational", "$")}
        {renderThreePointRow("Litigation costs", "loss_litigation", "$")}
        {renderThreePointRow("Reputational damage", "loss_reputational", "$")}
      </Stack>

      <Divider />

      {/* Mitigation & ROI */}
      <MitigationROI
        controlEffectiveness={values.control_effectiveness}
        mitigationCostAnnual={values.mitigation_cost_annual}
        onControlEffectivenessChange={(val) =>
          onChange({ ...values, control_effectiveness: val })
        }
        onMitigationCostChange={(val) =>
          onChange({ ...values, mitigation_cost_annual: val })
        }
        disabled={disabled}
      />

      <Divider />

      {/* Live ALE Summary */}
      <ALESummaryCard fields={fairFields} />
    </Stack>
  );
};

export default QuantitativeRiskForm;
