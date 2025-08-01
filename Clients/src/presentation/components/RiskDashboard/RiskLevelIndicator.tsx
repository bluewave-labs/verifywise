import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { getRiskLevelColor, formatRiskLevel } from '../../../application/utils/riskFormatters';

interface RiskLevelIndicatorProps extends Omit<ChipProps, 'label' | 'color'> {
  level: string;
  count?: number;
}

const RiskLevelIndicator: React.FC<RiskLevelIndicatorProps> = ({ 
  level, 
  count,
  sx,
  ...props 
}) => {
  const color = getRiskLevelColor(level);
  const formattedLevel = formatRiskLevel(level);
  const label = count !== undefined ? `${formattedLevel} (${count})` : formattedLevel;

  return (
    <Chip
      label={label}
      sx={{
        backgroundColor: color,
        color: '#fff',
        fontWeight: 500,
        fontSize: 11,
        height: 24,
        borderRadius: 2,
        '& .MuiChip-label': {
          paddingX: 1,
        },
        ...sx,
      }}
      {...props}
    />
  );
};

export default RiskLevelIndicator;