import { Chip } from "@mui/material";
import React, { useMemo } from "react";
import { getSeverityColorByText, getRiskChipStyle } from "./constants";
import { IRiskChipProps } from "../../../domain/interfaces/iRiskForm";

const RiskChip: React.FC<IRiskChipProps> = React.memo(({ label, backgroundColor }) => {
  const normalizedLabel = label?.toLowerCase().trim() ?? "";
  const derivedColor = useMemo(
    () => getSeverityColorByText(normalizedLabel),
    [normalizedLabel]
  );
  const chipColor = backgroundColor ?? derivedColor;

  if (label) {
    return (
      <Chip
        label={label}
        size="small"
        sx={{
          ...getRiskChipStyle(),
          backgroundColor: chipColor,
        }}
      />
    );
  }

  return <span>-</span>;
});

export default RiskChip;
