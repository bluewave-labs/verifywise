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
import { BarChart } from '@mui/x-charts/BarChart';
import { FairnessMetrics } from '../../../pages/Integrations/EvidentlyManagement/mockData/mockMetricsData';

interface FairnessMetricsTabProps {
  metrics: FairnessMetrics;
}

const FairnessMetricsTab: React.FC<FairnessMetricsTabProps> = ({ metrics }) => {
  // Fairness status color
  const getFairnessColor = (score: number) => {
    if (score >= 0.90) return '#10B981'; // Healthy
    if (score >= 0.80) return '#F59E0B'; // Warning
    return '#EF4444'; // Critical
  };

  const fairnessMetricsData = [
    { label: 'Demographic Parity', value: metrics.demographicParity },
    { label: 'Equal Opportunity', value: metrics.equalOpportunity },
    { label: 'Disparate Impact', value: metrics.disparateImpact }
  ];

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {fairnessMetricsData.map((metric) => (
          <Grid item xs={12} md={4} key={metric.label}>
            <Paper sx={{ p: 3, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
              <Typography sx={{ fontSize: '12px', color: '#6B7280', mb: 1, fontWeight: 500 }}>
                {metric.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: getFairnessColor(metric.value)
                }}
              >
                {metric.value.toFixed(2)}
              </Typography>
              <Typography sx={{ fontSize: '12px', color: '#9CA3AF', mt: 0.5 }}>
                {metric.value >= 0.90 ? 'Fair' : metric.value >= 0.80 ? 'Moderate concern' : 'Significant bias'}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Fairness Metrics Comparison Chart */}
      <Paper sx={{ p: 3, mb: 4, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 600, mb: 3, color: '#111827' }}>
          Fairness Metrics Comparison
        </Typography>
        <Box sx={{ width: '100%', height: 250 }}>
          <BarChart
            xAxis={[{ scaleType: 'band', data: fairnessMetricsData.map(m => m.label) }]}
            series={[
              {
                data: fairnessMetricsData.map(m => m.value),
                label: 'Score',
                color: '#6C5CE7'
              }
            ]}
            height={250}
            margin={{ left: 50, right: 20, top: 20, bottom: 60 }}
            slotProps={{
              legend: { hidden: true }
            }}
            sx={{
              '& .MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': {
                fontSize: '12px'
              }
            }}
          />
        </Box>
      </Paper>

      {/* Protected Attributes Analysis */}
      {metrics.attributes.map((attribute) => (
        <Paper key={attribute.name} sx={{ mb: 4, border: '1px solid #E5E7EB', boxShadow: 'none' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #E5E7EB' }}>
            <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#111827', textTransform: 'capitalize' }}>
              Fairness by {attribute.name.replace('_', ' ')}
            </Typography>
          </Box>

          {/* Selection Rate Chart */}
          <Box sx={{ p: 3, borderBottom: '1px solid #E5E7EB' }}>
            <Typography sx={{ fontSize: '13px', fontWeight: 500, mb: 2, color: '#6B7280' }}>
              Selection Rate by Group
            </Typography>
            <Box sx={{ width: '100%', height: 200 }}>
              <BarChart
                xAxis={[{ scaleType: 'band', data: attribute.groups.map(g => g.value) }]}
                series={[
                  {
                    data: attribute.groups.map(g => g.selectionRate),
                    label: 'Selection Rate',
                    color: '#6C5CE7'
                  }
                ]}
                height={200}
                margin={{ left: 50, right: 20, top: 20, bottom: 30 }}
                slotProps={{
                  legend: { hidden: true }
                }}
              />
            </Box>
          </Box>

          {/* Detailed Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                    Group
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                    Count
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                    Selection Rate
                  </TableCell>
                  {attribute.groups[0].truePositiveRate !== undefined && (
                    <>
                      <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                        True Positive Rate
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                        False Positive Rate
                      </TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {attribute.groups.map((group, index) => (
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
                        {group.value}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                        {group.count.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                        {(group.selectionRate * 100).toFixed(1)}%
                      </Typography>
                    </TableCell>
                    {group.truePositiveRate !== undefined && (
                      <>
                        <TableCell>
                          <Typography sx={{ fontSize: '13px', color: '#10B981', fontWeight: 600 }}>
                            {(group.truePositiveRate * 100).toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '13px', color: '#EF4444', fontWeight: 600 }}>
                            {(group.falsePositiveRate! * 100).toFixed(1)}%
                          </Typography>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Fairness Assessment */}
          <Box sx={{ p: 3, backgroundColor: '#F9FAFB' }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#374151', mb: 1 }}>
              Fairness Assessment
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.6 }}>
              {(() => {
                const rates = attribute.groups.map(g => g.selectionRate);
                const max = Math.max(...rates);
                const min = Math.min(...rates);
                const ratio = min / max;

                if (ratio >= 0.80) {
                  return `✓ Selection rates are relatively balanced across ${attribute.name.replace('_', ' ')} groups (ratio: ${ratio.toFixed(2)}). No significant fairness concerns detected.`;
                } else if (ratio >= 0.60) {
                  return `⚠ Moderate disparity detected in selection rates across ${attribute.name.replace('_', ' ')} groups (ratio: ${ratio.toFixed(2)}). Consider reviewing the model for potential bias.`;
                } else {
                  return `✗ Significant disparity in selection rates across ${attribute.name.replace('_', ' ')} groups (ratio: ${ratio.toFixed(2)}). This indicates potential bias that should be addressed.`;
                }
              })()}
            </Typography>
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default FairnessMetricsTab;
