/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { MetricData, MetricsWidgetProps } from '../../../../domain/interfaces/i.dashboard';

export const MetricsWidget: React.FC<MetricsWidgetProps> = ({
  loading = false,
  data = [],
}) => {
  const theme = useTheme();

  // Default sample data
  const defaultData: MetricData[] = [
    { label: 'Active Projects', value: 42, change: 12, color: 'primary' },
    { label: 'Risk Items', value: 26, change: -8, color: 'warning' },
    { label: 'Compliance Score', value: '92%', change: 5, color: 'success' },
    { label: 'Pending Tasks', value: 15, change: 0, color: 'info' },
  ];

  const metrics = data.length > 0 ? data : defaultData;

  const getTrendIcon = (change?: number) => {
    if (!change) return <Minus size={16} />;
    if (change > 0) return <TrendingUp size={16} color="green" />;
    return <TrendingDown size={16} color="red" />;
  };

  const getTrendColor = (change?: number) => {
    if (!change) return theme.palette.text.secondary;
    if (change > 0) return theme.palette.success.main;
    return theme.palette.error.main;
  };

  if (loading) {
    return (
      <Grid container spacing={2}>
        {[1, 2, 3, 4].map((i) => (
          <Grid item xs={6} key={i}>
            <Box>
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="80%" height={40} />
              <Skeleton variant="text" width="40%" height={16} />
            </Box>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={2}>
      {metrics.map((metric, index) => (
        <Grid item xs={12} sm={6} key={index}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              background: `linear-gradient(135deg, ${theme.palette.grey[50]} 0%, ${theme.palette.grey[200]} 100%)`,
              borderRadius: 2,
              height: '100%',
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              {metric.label}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                my: 0.5,
                color: metric.color ? (theme.palette[metric.color as keyof typeof theme.palette] as any)?.main || metric.color : 'inherit',
              }}
            >
              {metric.value}
              {metric.unit && (
                <Typography
                  component="span"
                  variant="h6"
                  sx={{ ml: 0.5, fontWeight: 400 }}
                >
                  {metric.unit}
                </Typography>
              )}
            </Typography>
            {metric.change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {getTrendIcon(metric.change)}
                <Typography
                  variant="body2"
                  sx={{ color: getTrendColor(metric.change) }}
                >
                  {Math.abs(metric.change)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  vs last month
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default MetricsWidget;