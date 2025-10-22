import { Chip } from "@mui/material";
import { useMemo } from "react";
import React from "react";
import { getSeverityColorByText, getRiskChipStyle } from "./constants";
import { IRiskChipProps } from "../../../domain/interfaces/iRiskForm";

const RiskChip: React.FC<IRiskChipProps> = React.memo(({ label }) => {
  // Return chip if label is provided
  if (label) {
    const normalizedLabel = label?.toLowerCase().trim() ?? "";
    const backgroundColor = useMemo(
      () => getSeverityColorByText(normalizedLabel),
      [normalizedLabel]
    );

    return (
      <Chip
        label={label}
        size="small"
        sx={{
          ...getRiskChipStyle(),
          backgroundColor,
        }}
      />
    );
  }

  // Fallback for no label
  return <span>-</span>;
});

export default RiskChip;
