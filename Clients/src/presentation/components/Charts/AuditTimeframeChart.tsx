import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import { LineChart, BarChart } from '@mui/x-charts';
import { IAuditTimeframe, AuditTimeframeType } from '../AuditTimeframe';
import { getRiskCountsByTimeframe, RiskWithDates } from '../AuditTimeframe/utils';

// Error Boundary Component
class ChartErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Alert severity="error">
          Failed to render chart. Please try again.
        </Alert>
      );
    }

    return this.props.children;
  }
}

export interface IAuditTimeframeChartProps {
  risks: RiskWithDates[];
  timeframe: IAuditTimeframe;
  chartType?: 'line' | 'bar';
  groupBy?: 'day' | 'week' | 'month';
  title?: string;
  height?: number;
  loading?: boolean;
  error?: string | null;
}

const CHART_COLORS = {
  [AuditTimeframeType.CREATED]: '#10b981',
  [AuditTimeframeType.UPDATED]: '#f59e0b', 
  [AuditTimeframeType.DELETED]: '#ef4444',
};

const TIMEFRAME_LABELS = {
  [AuditTimeframeType.CREATED]: 'Created',
  [AuditTimeframeType.UPDATED]: 'Updated',
  [AuditTimeframeType.DELETED]: 'Deleted',
};

const AuditTimeframeChart: React.FC<IAuditTimeframeChartProps> = ({
  risks,
  timeframe,
  chartType = 'line',
  groupBy = 'month',
  title,
  height = 300,
  loading = false,
  error = null,
}) => {
  const theme = useTheme();

  const chartData = useMemo(() => {
    try {
      if (!Array.isArray(risks)) {
        console.warn('Invalid risks data provided to chart');
        return [];
      }
      return getRiskCountsByTimeframe(risks, timeframe, groupBy);
    } catch (error) {
      console.error('Error calculating chart data:', error);
      return [];
    }
  }, [risks, timeframe, groupBy]);

  const formatDate = (dateStr: string) => {
    try {
      if (groupBy === 'month') {
        const parts = dateStr.split('-');
        if (parts.length !== 2) {
          console.warn('Invalid date format for month grouping:', dateStr);
          return dateStr;
        }
        const [year, month] = parts;
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(month, 10);
        
        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
          console.warn('Invalid date values:', { year: yearNum, month: monthNum });
          return dateStr;
        }
        
        return new Date(yearNum, monthNum - 1).toLocaleDateString('en-US', {
          month: 'short',
          year: '2-digit',
        });
      }
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateStr);
        return dateStr;
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateStr);
      return dateStr;
    }
  };

  const chartColor = CHART_COLORS[timeframe.type];

  // Prepare data for MUI X Charts with error handling
  const { xAxisData, seriesData } = useMemo(() => {
    try {
      const xAxis = chartData.map(item => formatDate(item.date));
      const series = chartData.map(item => Math.max(0, item.count)); // Ensure non-negative counts
      return { xAxisData: xAxis, seriesData: series };
    } catch (error) {
      console.error('Error preparing chart data:', error);
      return { xAxisData: [], seriesData: [] };
    }
  }, [chartData, groupBy]);

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Error loading chart data: {error}
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${theme.palette.border.light}`,
          borderRadius: theme.shape.borderRadius,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          Loading chart data...
        </Typography>
      </Box>
    );
  }

  if (!chartData.length) {
    return (
      <Box
        sx={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${theme.palette.border.light}`,
          borderRadius: theme.shape.borderRadius,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No data available for the selected timeframe
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.border.light}`,
        borderRadius: theme.shape.borderRadius,
        padding: theme.spacing(4),
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {title && (
        <Typography
          variant="h6"
          sx={{
            fontSize: 16,
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: theme.spacing(4),
          }}
        >
          {title}
        </Typography>
      )}

      <Stack spacing={theme.spacing(2)} mb={theme.spacing(4)}>
        <Typography variant="body2" sx={{ fontSize: 13, color: theme.palette.text.secondary }}>
          {`${TIMEFRAME_LABELS[timeframe.type]} Risks Over Time`}
        </Typography>
        {timeframe.startDate && timeframe.endDate && (
          <Typography variant="caption" sx={{ fontSize: 11, color: theme.palette.text.disabled }}>
            {`${timeframe.startDate.toLocaleDateString()} - ${timeframe.endDate.toLocaleDateString()}`}
          </Typography>
        )}
      </Stack>

      <ChartErrorBoundary>
        {chartType === 'line' ? (
          <LineChart
            width={undefined}
            height={height}
            series={[
              {
                data: seriesData,
                label: `${TIMEFRAME_LABELS[timeframe.type]} Risks`,
                color: chartColor,
              },
            ]}
            xAxis={[{ 
              scaleType: 'point', 
              data: xAxisData,
            }]}
            margin={{ left: 30, right: 30, top: 30, bottom: 30 }}
            grid={{ vertical: true, horizontal: true }}
          />
        ) : (
          <BarChart
            width={undefined}
            height={height}
            series={[
              {
                data: seriesData,
                label: `${TIMEFRAME_LABELS[timeframe.type]} Risks`,
                color: chartColor,
              },
            ]}
            xAxis={[{ 
              scaleType: 'band', 
              data: xAxisData,
            }]}
            margin={{ left: 30, right: 30, top: 30, bottom: 30 }}
          />
        )}
      </ChartErrorBoundary>
    </Box>
  );
};

export default AuditTimeframeChart;