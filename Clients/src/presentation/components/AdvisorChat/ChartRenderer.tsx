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

export const ChartRenderer: FC<ChartRendererProps> = ({ chartData }) => {
  const theme = useTheme();
  const size = 200;

  if (!chartData || (chartData.type !== 'line' && (!chartData.data || chartData.data.length === 0))) {
    return null;
  }

  const { type, data, title, series, xAxisLabels } = chartData;

  const renderChart = () => {
    const labels = data.map(item => item.label);
    const dataValues = data.map(item => item.value);
    switch (type) {
      case 'line':
        // Line chart for timeseries data
        if (series && xAxisLabels) {
          return (
            <LineChart
              xAxis={[{
                scaleType: 'point',
                data: xAxisLabels,
              }]}
              series={series.map(s => ({
                data: s.data,
                label: s.label,
                curve: 'linear',
              }))}
              height={250}
              width={300}
              margin={{ left: 0, right: 20, top: 20, bottom: 0 }}
            />
          );
        }
        // Fallback for simple line chart
        return (
          <LineChart
            xAxis={[{ scaleType: 'point', data: labels }]}
            series={[{ data: dataValues, curve: 'linear' }]}
            height={250}
            width={320}
            margin={{ left: 0, right: 20, top: 20, bottom: 0 }}
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
