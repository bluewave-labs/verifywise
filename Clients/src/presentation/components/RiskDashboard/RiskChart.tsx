import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { Box, useTheme } from '@mui/material';
import { RiskChartData } from './types';

interface RiskChartProps {
  data: RiskChartData[];
  width?: number;
  height?: number;
}

const RiskChart: React.FC<RiskChartProps> = ({ 
  data, 
  width = 300, 
  height = 200 
}) => {
  const theme = useTheme();

  const chartData = data.map((item, index) => ({
    id: index,
    value: item.value,
    label: item.label,
    color: item.color,
  }));

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      width: '100%',
      height: height
    }}>
      <PieChart
        series={[
          {
            data: chartData,
            highlightScope: { faded: 'global', highlighted: 'item' },
            faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
            innerRadius: 40,
            outerRadius: 80,
            paddingAngle: 2,
            cornerRadius: 4,
          },
        ]}
        width={width}
        height={height}
        slotProps={{
          legend: {
            direction: 'column',
            position: { vertical: 'middle', horizontal: 'right' },
            padding: 0,
            itemMarkWidth: 12,
            itemMarkHeight: 12,
            markGap: 8,
            itemGap: 4,
            labelStyle: {
              fontSize: theme.typography.fontSize - 1,
              fill: theme.palette.text.secondary,
            },
          },
        }}
        margin={{ top: 20, bottom: 20, left: 20, right: 120 }}
      />
    </Box>
  );
};

export default RiskChart;