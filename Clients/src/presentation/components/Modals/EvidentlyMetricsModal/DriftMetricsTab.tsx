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
  TableRow,
  Chip
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { DriftMetrics } from '../../../pages/Integrations/EvidentlyManagement/mockData/mockMetricsData';
import { getStatusColor, getStatusLabel } from '../../../pages/Integrations/EvidentlyManagement/mockData/mockEvidentlyData';

interface DriftMetricsTabProps {
  metrics: DriftMetrics;
}

const DriftMetricsTab: React.FC<DriftMetricsTabProps> = ({ metrics }) => {
  // Get top 10 drifted features for bar chart
  const topDriftedFeatures = [...metrics.features]
    .sort((a, b) => b.driftScore - a.driftScore)
    .slice(0, 10);

  // Prepare timeline data
  const timelineLabels = metrics.timeline.map(point => {
    const date = new Date(point.timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  const timelineScores = metrics.timeline.map(point => point.score);

  // Drift status color
  const getDriftStatusColor = (score: number) => {
    if (score >= 0.7) return '#EF4444'; // Critical
    if (score >= 0.5) return '#F59E0B'; // Warning
    return '#10B981'; // Healthy
  };

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
            <Typography sx={{ fontSize: '12px', color: '#6B7280', mb: 1, fontWeight: 500 }}>
              Dataset Drift Score
            </Typography>
            <Typography
              sx={{
                fontSize: '32px',
                fontWeight: 700,
                color: getDriftStatusColor(metrics.datasetDriftScore)
              }}
            >
              {metrics.datasetDriftScore.toFixed(2)}
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#9CA3AF', mt: 0.5 }}>
              {metrics.datasetDriftScore >= 0.7 ? 'Critical drift detected' :
               metrics.datasetDriftScore >= 0.5 ? 'Moderate drift' : 'Minimal drift'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
            <Typography sx={{ fontSize: '12px', color: '#6B7280', mb: 1, fontWeight: 500 }}>
              Drifted Features
            </Typography>
            <Typography sx={{ fontSize: '32px', fontWeight: 700, color: '#111827' }}>
              {metrics.driftedFeatures}
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#9CA3AF', mt: 0.5 }}>
              out of {metrics.totalFeatures} features
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
            <Typography sx={{ fontSize: '12px', color: '#6B7280', mb: 1, fontWeight: 500 }}>
              Last Updated
            </Typography>
            <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#111827', mt: 2 }}>
              {new Date(metrics.lastUpdated).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Drift Timeline Chart */}
      <Paper sx={{ p: 3, mb: 4, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 3, color: '#111827' }}>
          Drift Score Timeline
        </Typography>
        <Box sx={{ width: '100%', height: 250 }}>
          <LineChart
            xAxis={[{ scaleType: 'point', data: timelineLabels }]}
            series={[
              {
                data: timelineScores,
                label: 'Drift Score',
                color: '#6C5CE7',
                curve: 'linear'
              }
            ]}
            height={250}
            margin={{ left: 50, right: 20, top: 20, bottom: 30 }}
            sx={{
              '& .MuiLineElement-root': {
                strokeWidth: 2
              }
            }}
          />
        </Box>
      </Paper>

      {/* Top Drifted Features Chart */}
      <Paper sx={{ p: 3, mb: 4, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 3, color: '#111827' }}>
          Top Drifted Features
        </Typography>
        <Box sx={{ width: '100%', height: 300 }}>
          <BarChart
            xAxis={[{ scaleType: 'band', data: topDriftedFeatures.map(f => f.name) }]}
            series={[
              {
                data: topDriftedFeatures.map(f => f.driftScore),
                label: 'Drift Score',
                color: '#6C5CE7'
              }
            ]}
            height={300}
            margin={{ left: 50, right: 20, top: 20, bottom: 80 }}
            slotProps={{
              legend: { hidden: true }
            }}
            sx={{
              '& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': {
                transform: 'rotate(-45deg)',
                textAnchor: 'end'
              }
            }}
          />
        </Box>
      </Paper>

      {/* Feature-Level Drift Table */}
      <Paper sx={{ border: '1px solid #E5E7EB', boxShadow: 'none' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #E5E7EB' }}>
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
            Feature-Level Drift Details
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                  Feature Name
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                  Drift Score
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                  P-Value
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                  Statistical Test
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {metrics.features.map((feature, index) => (
                <TableRow
                  key={index}
                  sx={{
                    '&:hover': {
                      backgroundColor: '#F9FAFB'
                    }
                  }}
                >
                  <TableCell>
                    <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>
                      {feature.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                      {feature.driftScore.toFixed(3)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(feature.status)}
                      size="small"
                      sx={{
                        backgroundColor: getStatusColor(feature.status) + '15',
                        color: getStatusColor(feature.status),
                        fontWeight: 500,
                        fontSize: '12px',
                        height: '24px'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                      {feature.pValue ? feature.pValue.toFixed(4) : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                      {feature.statTestName || 'N/A'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default DriftMetricsTab;
