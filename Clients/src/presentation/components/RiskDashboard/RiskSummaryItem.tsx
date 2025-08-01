import React from 'react';
import { Stack, Typography, Box } from '@mui/material';
import { getRiskLevelColor } from '../../../application/utils/riskFormatters';

interface RiskSummaryItemProps {
  label: string;
  count: number;
  level: string;
}

const RiskSummaryItem: React.FC<RiskSummaryItemProps> = ({ 
  label, 
  count, 
  level 
}) => {
  const color = getRiskLevelColor(level);

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <Typography
        variant="body2"
        sx={{
          fontSize: 11,
          color: 'text.secondary',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}: {count}
      </Typography>
    </Stack>
  );
};

export default RiskSummaryItem;