import React from 'react';
import { PieChart } from '@mui/x-charts';
import { Box, Typography } from '@mui/material';

export interface StatusData {
  label: string;
  value: number;
  color: string;
}

interface StatusDonutChartProps {
  data: StatusData[];
  total: number;
  size?: number;
}

const StatusDonutChart: React.FC<StatusDonutChartProps> = ({ 
  data, 
  total, 
  size = 80 
}) => {
  // Filter out zero values for cleaner visualization
  const filteredData = data.filter(item => item.value > 0);
  
  if (filteredData.length === 0 || total === 0) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #E5E7EB',
          borderRadius: '50%',
          backgroundColor: '#F9FAFB'
        }}
      >
        <Typography 
          variant="caption" 
          sx={{ 
            color: '#9CA3AF',
            fontSize: '10px',
            textAlign: 'center'
          }}
        >
          No Data
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: size, height: size, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <PieChart
        series={[{
          data: filteredData.map((item, index) => ({
            id: index,
            value: item.value,
            label: item.label,
            color: item.color
          })),
          innerRadius: size * 0.35,
          outerRadius: size * 0.45,
          paddingAngle: 2,
          cornerRadius: 2,
        }]}
        width={size}
        height={size}
        slotProps={{
          tooltip: {
            sx: {
              '& .MuiChartsTooltip-root': {
                fontSize: '13px !important',
              },
              '& .MuiChartsTooltip-table': {
                fontSize: '13px !important',
              },
              '& .MuiChartsTooltip-cell': {
                fontSize: '13px !important',
              },
              '& .MuiChartsTooltip-labelCell': {
                fontSize: '13px !important',
              },
              '& .MuiChartsTooltip-valueCell': {
                fontSize: '13px !important',
              }
            }
          }
        }}
        sx={{
          '& .MuiChartsLegend-root': {
            display: 'none !important'
          },
          '& .MuiChartsTooltip-root': {
            fontSize: '13px !important',
          },
          '& .MuiChartsTooltip-table': {
            fontSize: '13px !important',
          },
          '& .MuiChartsTooltip-cell': {
            fontSize: '13px !important',
          }
        }}
      />
      {/* Center text showing total */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: '14px',
            color: '#1F2937'
          }}
        >
          {total}
        </Typography>
      </Box>
    </Box>
  );
};

export default StatusDonutChart;