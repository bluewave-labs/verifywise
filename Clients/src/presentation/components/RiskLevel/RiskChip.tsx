import { Chip, useTheme } from "@mui/material";
import { useMemo } from "react";
import React from "react";
import { getSeverityColorByText, RISK_COLOR_BY_TEXT, getRiskChipStyle } from "./constants";

interface RiskChipProps {
  label: string;
  type?: 'severity' | 'risk-level' | 'auto';
}

const RiskChip: React.FC<RiskChipProps> = React.memo(({ 
  label, 
  type = 'auto'
}) => {
  const theme = useTheme();
  
  // Memoize the backgroundColor calculation to avoid recalculation on every render
  const backgroundColor = useMemo(() => {
    if (!label) return '#B0B0B0';

    if (type === 'severity') {
      return getSeverityColorByText(label);
    } else if (type === 'risk-level') {
      return RISK_COLOR_BY_TEXT[label] || '#B0B0B0';
    } else {
      // Auto-detect: try severity first, then risk level
      const severityColor = getSeverityColorByText(label);
      if (severityColor !== '#B0B0B0') {
        return severityColor;
      }
      return RISK_COLOR_BY_TEXT[label] || '#B0B0B0';
    }
  }, [label, type]);

  // Memoize the chip style to avoid recreating the style object on every render
  const chipStyle = useMemo(() => 
    getRiskChipStyle(backgroundColor, theme), 
    [backgroundColor, theme]
  );

  if (!label) {
    return <span>-</span>;
  }

  return (
    <Chip
      label={label}
      size="small"
      sx={chipStyle}
    />
  );
});

export default RiskChip; 