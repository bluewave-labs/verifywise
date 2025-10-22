import { Chip } from "@mui/material";
import { useMemo } from "react";
import React from "react";
import { getSeverityColorByText, getRiskChipStyle } from "./constants";

interface RiskChipProps {
  label?: string;
}

const RiskChip: React.FC<RiskChipProps> = React.memo(({ label }) => {
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
