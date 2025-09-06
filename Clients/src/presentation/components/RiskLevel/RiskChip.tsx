import { Chip } from "@mui/material";
import { useMemo } from "react";
import React from "react";
import { getSeverityColorByText, getRiskChipStyle } from "./constants";

interface RiskChipProps {
  label: string;
}

const RiskChip: React.FC<RiskChipProps> = React.memo(({ label }) => {

  if (!label) {
    return <span>-</span>;
  }
  const normalizedLabel = label?.toLowerCase().trim() ?? '';

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
});

export default RiskChip; 