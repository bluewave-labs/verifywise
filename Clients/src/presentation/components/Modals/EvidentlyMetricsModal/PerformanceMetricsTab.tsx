import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { PerformanceMetrics } from '../../../pages/Integrations/EvidentlyManagement/mockData/mockMetricsData';

interface PerformanceMetricsTabProps {
  metrics: PerformanceMetrics;
}

const PerformanceMetricsTab: React.FC<PerformanceMetricsTabProps> = ({ metrics }) => {
  // Prepare timeline data
  const timelineLabels = metrics.timeline.map(point => {
    const date = new Date(point.timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  // Performance status color based on comparison to baseline
  const getPerformanceColor = (current: number, baseline: number) => {
    const ratio = current / baseline;
    if (ratio >= 0.95) return '#10B981'; // Healthy
    if (ratio >= 0.90) return '#F59E0B'; // Warning
    return '#EF4444'; // Critical
  };

  // Calculate performance change
  const getPerformanceChange = (current: number, baseline: number) => {
    const diff = current - baseline;
    const percentage = ((diff / baseline) * 100).toFixed(1);
    return {
      value: diff.toFixed(3),
      percentage,
      isPositive: diff >= 0
    };
  };

  const metricsData = [
    { label: 'Accuracy', current: metrics.current.accuracy, baseline: metrics.baseline.accuracy },
    { label: 'Precision', current: metrics.current.precision, baseline: metrics.baseline.precision },
    { label: 'Recall', current: metrics.current.recall, baseline: metrics.baseline.recall },
    { label: 'F1 Score', current: metrics.current.f1Score, baseline: metrics.baseline.f1Score },
    { label: 'AUC-ROC', current: metrics.current.aucRoc, baseline: metrics.baseline.aucRoc }
  ];

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metricsData.map((metric) => {
          const change = getPerformanceChange(metric.current, metric.baseline);
          return (
            <Grid item xs={12} md={2.4} key={metric.label}>
              <Paper sx={{ p: 2.5, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
                <Typography sx={{ fontSize: '12px', color: '#6B7280', mb: 1, fontWeight: 500 }}>
                  {metric.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: getPerformanceColor(metric.current, metric.baseline)
                  }}
                >
                  {metric.current.toFixed(3)}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '11px',
                    color: change.isPositive ? '#10B981' : '#EF4444',
                    mt: 0.5,
                    fontWeight: 500
                  }}
                >
                  {change.isPositive ? '+' : ''}{change.percentage}% vs baseline
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Performance Timeline Chart */}
      <Paper sx={{ p: 3, mb: 4, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 3, color: '#111827' }}>
          Performance Metrics Timeline
        </Typography>
        <Box sx={{ width: '100%', height: 300 }}>
          <LineChart
            xAxis={[{ scaleType: 'point', data: timelineLabels }]}
            series={[
              {
                data: metrics.timeline.map(p => p.accuracy),
                label: 'Accuracy',
                color: '#6C5CE7',
                curve: 'linear'
              },
              {
                data: metrics.timeline.map(p => p.precision),
                label: 'Precision',
                color: '#10B981',
                curve: 'linear'
              },
              {
                data: metrics.timeline.map(p => p.recall),
                label: 'Recall',
                color: '#F59E0B',
                curve: 'linear'
              },
              {
                data: metrics.timeline.map(p => p.f1Score),
                label: 'F1 Score',
                color: '#3B82F6',
                curve: 'linear'
              }
            ]}
            height={300}
            margin={{ left: 50, right: 20, top: 20, bottom: 30 }}
            sx={{
              '& .MuiLineElement-root': {
                strokeWidth: 2
              }
            }}
          />
        </Box>
      </Paper>

      {/* Current vs Baseline Table */}
      <Paper sx={{ mb: 4, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #E5E7EB' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
            Current vs Baseline Comparison
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                  Metric
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                  Current
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                  Baseline
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                  Change
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {metricsData.map((metric) => {
                const change = getPerformanceChange(metric.current, metric.baseline);
                const color = getPerformanceColor(metric.current, metric.baseline);
                return (
                  <TableRow
                    key={metric.label}
                    sx={{
                      '&:hover': {
                        backgroundColor: '#F9FAFB'
                      }
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>
                        {metric.label}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                        {metric.current.toFixed(4)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                        {metric.baseline.toFixed(4)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        sx={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: change.isPositive ? '#10B981' : '#EF4444'
                        }}
                      >
                        {change.isPositive ? '+' : ''}{change.value} ({change.isPositive ? '+' : ''}{change.percentage}%)
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: color
                          }}
                        />
                        <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                          {color === '#10B981' ? 'Healthy' : color === '#F59E0B' ? 'Warning' : 'Critical'}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Confusion Matrix */}
      {metrics.confusionMatrix && (
        <Paper sx={{ p: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 3, color: '#111827' }}>
            Confusion Matrix
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Table sx={{ maxWidth: 500 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ border: 'none', fontWeight: 600, fontSize: '13px' }} />
                  <TableCell sx={{ border: '1px solid #E5E7EB', fontWeight: 600, fontSize: '13px', textAlign: 'center', backgroundColor: '#F9FAFB' }}>
                    Predicted Positive
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #E5E7EB', fontWeight: 600, fontSize: '13px', textAlign: 'center', backgroundColor: '#F9FAFB' }}>
                    Predicted Negative
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ border: '1px solid #E5E7EB', fontWeight: 600, fontSize: '13px', backgroundColor: '#F9FAFB' }}>
                    Actual Positive
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #E5E7EB', textAlign: 'center', backgroundColor: '#DCFCE715' }}>
                    <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#10B981' }}>
                      {metrics.confusionMatrix.truePositive.toLocaleString()}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                      True Positive
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #E5E7EB', textAlign: 'center', backgroundColor: '#FEE2E215' }}>
                    <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#EF4444' }}>
                      {metrics.confusionMatrix.falseNegative.toLocaleString()}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                      False Negative
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ border: '1px solid #E5E7EB', fontWeight: 600, fontSize: '13px', backgroundColor: '#F9FAFB' }}>
                    Actual Negative
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #E5E7EB', textAlign: 'center', backgroundColor: '#FEE2E215' }}>
                    <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#EF4444' }}>
                      {metrics.confusionMatrix.falsePositive.toLocaleString()}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                      False Positive
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ border: '1px solid #E5E7EB', textAlign: 'center', backgroundColor: '#DCFCE715' }}>
                    <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#10B981' }}>
                      {metrics.confusionMatrix.trueNegative.toLocaleString()}
                    </Typography>
                    <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                      True Negative
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default PerformanceMetricsTab;
