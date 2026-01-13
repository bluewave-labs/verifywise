import { FC } from 'react';
import { Box, Typography, Paper, useTheme } from '@mui/material';
import { BarChart, PieChart, LineChart } from '@mui/x-charts';

interface ChartData {
  type: 'bar' | 'pie' | 'table' | 'donut' | 'line';
  data: {label: string, value: number, color?: string}[] ;
  title: string;
  // For line charts with multiple series (timeseries data)
  series?: Array<{
    label: string;
    data: number[];
  }>;
  xAxisLabels?: string[];
}

interface ChartRendererProps {
  chartData: ChartData;
}

// Common tooltip styles for all charts - targets the tooltip container
const tooltipSlotProps = {
  tooltip: {
    sx: {
      '& .MuiChartsTooltip-table': {
        fontSize: '13px',
      },
      '& .MuiChartsTooltip-cell': {
        fontSize: '13px',
      },
      '& .MuiChartsTooltip-labelCell': {
        fontSize: '13px',
      },
      '& .MuiChartsTooltip-valueCell': {
        fontSize: '13px',
      },
      '& .MuiChartsTooltip-mark': {
        width: '10px',
        height: '10px',
      },
    },
  },
};

export const ChartRenderer: FC<ChartRendererProps> = ({ chartData }) => {
  const theme = useTheme();
  const size = 200;

  // Return null if no chart data at all
  if (!chartData) {
    return null;
  }

  const { type, data, title, series, xAxisLabels } = chartData;

  // For line charts with series, we don't need data array
  // For all other charts, we need data array
  const hasValidData = data && Array.isArray(data) && data.length > 0;
  const hasValidSeries = series && Array.isArray(series) && series.length > 0 && xAxisLabels;

  if (type === 'line') {
    // Line chart can use either series or data
    if (!hasValidSeries && !hasValidData) {
      return null;
    }
  } else {
    // All other chart types require data
    if (!hasValidData) {
      return null;
    }
  }

  const renderChart = () => {
    // Only compute labels/values if data exists
    const labels = hasValidData ? data.map(item => item.label) : [];
    const dataValues = hasValidData ? data.map(item => item.value) : [];

    switch (type) {
      case 'line':
        // Line chart for timeseries data with series
        if (hasValidSeries) {
          return (
            <LineChart
              xAxis={[{
                scaleType: 'point',
                data: xAxisLabels,
              }]}
              series={series!.map(s => ({
                data: s.data,
                label: s.label,
                curve: 'linear',
              }))}
              height={250}
              width={300}
              margin={{ left: 0, right: 20, top: 20, bottom: 0 }}
              slotProps={tooltipSlotProps}
            />
          );
        }
        // Fallback for simple line chart using data array
        if (!hasValidData) return null;
        return (
          <LineChart
            xAxis={[{ scaleType: 'point', data: labels }]}
            series={[{ data: dataValues, curve: 'linear' }]}
            height={250}
            width={320}
            margin={{ left: 0, right: 20, top: 20, bottom: 0 }}
            slotProps={tooltipSlotProps}
          />
        );

      case 'bar':
        return (
          <BarChart
            xAxis={[{ scaleType: 'band', data: labels }]}
            series={[{ data: dataValues }]}
            height={size}
            width={300}
            margin={{ left: 0, right: 20, top: 20 }}
            slotProps={tooltipSlotProps}
          />
        );

      case 'pie':
        return (
          <PieChart
            series={[
              {
                data: data.map((item, index) => ({
                  id: index,
                  value: item.value,
                  label: item.label,
                  color: item.color,
                })),
                faded: { innerRadius: 30, additionalRadius: -30 },
              },
            ]}
            width={size}
            height={size}
            slotProps={tooltipSlotProps}
          />
        );

      case 'donut':
        return (
          <PieChart
            series={[
              {
                data: data.map((item, index) => ({
                  id: index,
                  value: item.value,
                  label: item.label,
                  color: item.color,
                })),
                innerRadius: size * 0.35,
                outerRadius: size * 0.45,
                paddingAngle: 2,
                cornerRadius: 2,
              },
            ]}
            width={size}
            height={size}
            slotProps={tooltipSlotProps}
          />
        );

      case 'table':
        return (
          <Box sx={{ width: '100%', minWidth: 200 }}>
            {data.map((item, index) => (
              <Box
                key={`row-${index}`}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 3,
                  padding: '5px 0',
                  borderBottom: index < data.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '12px',
                    color: theme.palette.text.secondary,
                  }}
                >
                  {item.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                  }}
                >
                  {item.value}
                </Typography>
              </Box>
            ))}
          </Box>
        );

      default:
        return (
          <Typography variant="body2" color="text.secondary">
            Unsupported chart type: {type}
          </Typography>
        );
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        padding: 2,
        marginTop: 1,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '8px',
        width: '100%',
      }}
    >
      {title && (
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, marginBottom: type === 'table' ? 1 : 2, fontSize: '13px' }}>
          {title}
        </Typography>
      )}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: type === 'table' ? 'auto' : 200,
        }}
      >
        {renderChart()}
      </Box>
    </Paper>
  );
};
