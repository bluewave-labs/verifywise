import { SelectChangeEvent, Stack, Typography, useTheme } from "@mui/material";
import { FC } from "react";
import Select from "../Inputs/Select";
import { Likelihood, RISK_LABELS, Severity } from "./constants";
import { riskSeverityItems, likelihoodItems } from "../AddNewRiskForm/projectRiskValue";

interface RiskLevelFormValues {
  likelihood: Likelihood;
  riskSeverity: Severity;
}

interface RiskLevelProps {
  likelihood: Likelihood;
  riskSeverity: Severity;
  handleOnSelectChange: (
    prop: keyof RiskLevelFormValues
  ) => (event: SelectChangeEvent<string | number>) => void;
}

/**
 * RiskLevel component displays a form to select the likelihood and severity of a risk,
 * and calculates and displays the corresponding risk level.
 *
 * @component
 * @param {RiskLevelProps} props - The props for the RiskLevel component.
 * @param {number} props.likelihood - The likelihood of the risk occurring.
 * @param {number} props.riskSeverity - The severity of the risk.
 * @param {function} props.handleOnSelectChange - The function to handle changes in the select inputs.
 * @returns {JSX.Element} The rendered RiskLevel component.
 */
const RiskLevel: FC<RiskLevelProps> = ({
  likelihood,
  riskSeverity,
  handleOnSelectChange,
}) => {
  const theme = useTheme();

  // Define thresholds for risk levels based on the calculated score
  const getRiskLevel = (score: number): { text: string; color: string } => {
    if (score <= 3) {
      return RISK_LABELS.low;
    } else if (score <= 6) {
      return RISK_LABELS.medium;
    } else if (score <= 9) {
      return RISK_LABELS.high;
    } else {
      return RISK_LABELS.critical;
    }
  };

  const renderRiskLabel = getRiskLevel(likelihood * riskSeverity);

  return (
    <Stack sx={{ flexDirection: "row", columnGap: 12.5, mb: 12.5 }}>
      <Select
        id="likelihood-input"
        label="Likelihood"
        placeholder="Select likelihood of risk to happen"
        value={likelihood}
        onChange={handleOnSelectChange("likelihood")}
        items={likelihoodItems}
        sx={{ width: 324, backgroundColor: theme.palette.background.main }}
      />
      <Select
        id="risk-severity-input"
        label="Risk severity"
        placeholder="Select risk severity"
        value={riskSeverity}
        onChange={handleOnSelectChange("riskSeverity")}
        items={riskSeverityItems}
        sx={{ width: 324, backgroundColor: theme.palette.background.main }}
      />
      <Stack rowGap={2}>
        <Typography
          sx={{ fontSize: theme.typography.fontSize, fontWeight: 500 }}
        >
          Risk level
        </Typography>
        <Stack
          sx={{
            backgroundColor: renderRiskLabel.color,
            color: theme.palette.background.main,
            p: "0 8px",
            height: 34,
            borderRadius: theme.shape.borderRadius,
            justifyContent: "center",
          }}
        >
          {renderRiskLabel.text}
        </Stack>
      </Stack>
    </Stack>
  );
};

export default RiskLevel;
