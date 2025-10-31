import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Chip,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import { Eye, RefreshCw } from 'lucide-react';
import CustomizableButton from '../../components/Button/CustomizableButton';
import {
  MOCK_EVIDENTLY_MODELS,
  EvidentlyModel,
  getStatusColor,
  getStatusLabel
} from '../Integrations/EvidentlyManagement/mockData/mockEvidentlyData';

interface EvidentlyDataTableProps {
  onViewMetrics?: (modelId: string) => void;
}

const EvidentlyDataTable: React.FC<EvidentlyDataTableProps> = ({ onViewMetrics }) => {
  const [models] = useState<EvidentlyModel[]>(MOCK_EVIDENTLY_MODELS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncingModelId, setSyncingModelId] = useState<string | null>(null);

  /**
   * Handle bulk sync all models
   */
  const handleBulkSync = async () => {
    setIsSyncing(true);
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSyncing(false);
  };

  /**
   * Handle sync single model
   */
  const handleSyncModel = async (modelId: string) => {
    setSyncingModelId(modelId);
    // TODO: Replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSyncingModelId(null);
  };

  /**
   * Format last sync timestamp
   */
  const formatLastSync = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  };

  /**
   * Render status chip
   */
  const renderStatusChip = (status: 'healthy' | 'warning' | 'critical') => {
    return (
      <Chip
        label={getStatusLabel(status)}
        size="small"
        sx={{
          backgroundColor: getStatusColor(status) + '15',
          color: getStatusColor(status),
          fontWeight: 500,
          fontSize: '12px',
          height: '24px',
          borderRadius: '4px'
        }}
      />
    );
  };

  // Check if Evidently is configured
  const isConfigured = localStorage.getItem('evidently_configured') === 'true';

  if (!isConfigured) {
    return (
      <Box
        sx={{
          p: 4,
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          backgroundColor: '#FFFFFF',
          textAlign: 'center'
        }}
      >
        <Typography variant="h6" sx={{ mb: 2, fontSize: '14px', fontWeight: 600 }}>
          Evidently AI Not Configured
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, fontSize: '13px', color: '#667085' }}>
          Configure your Evidently Cloud connection to view model metrics.
        </Typography>
        <CustomizableButton
          variant="contained"
          text="Configure Evidently"
          onClick={() => window.location.href = '/integrations/evidently'}
          sx={{
            backgroundColor: '#6C5CE7',
            color: 'white',
            fontSize: '13px',
            fontWeight: 500,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#5A4BC7'
            }
          }}
        />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Bulk Sync Button */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 600 }}>
          Monitored Models ({models.length})
        </Typography>
        <CustomizableButton
          variant="outlined"
          text={isSyncing ? "Syncing..." : "Bulk Sync All"}
          icon={isSyncing ? <CircularProgress size={16} sx={{ color: '#13715B' }} /> : <RefreshCw size={16} />}
          onClick={handleBulkSync}
          isDisabled={isSyncing}
          sx={{
            border: '1px solid #13715B',
            color: '#13715B',
            fontSize: '13px',
            fontWeight: 500,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#F0FDF4',
              border: '1px solid #13715B'
            }
          }}
        />
      </Stack>

      {/* Table */}
      <TableContainer
        component={Paper}
        sx={{
          boxShadow: 'none',
          border: '1px solid #E5E7EB',
          borderRadius: '8px'
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
              <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                Model Name
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                Project ID
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                Last Sync
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                Drift
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                Performance
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>
                Fairness
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#374151', textAlign: 'right' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {models.map((model) => (
              <TableRow
                key={model.id}
                sx={{
                  '&:hover': {
                    backgroundColor: '#F9FAFB'
                  }
                }}
              >
                <TableCell>
                  <Box>
                    <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>
                      {model.modelName}
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                      {model.projectName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: '12px', color: '#6B7280', fontFamily: 'monospace' }}>
                    {model.projectId}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: '13px', color: '#374151' }}>
                    {formatLastSync(model.lastSync)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {renderStatusChip(model.driftStatus)}
                </TableCell>
                <TableCell>
                  {renderStatusChip(model.performanceStatus)}
                </TableCell>
                <TableCell>
                  {renderStatusChip(model.fairnessStatus)}
                </TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Sync metrics">
                      <IconButton
                        size="small"
                        onClick={() => handleSyncModel(model.id)}
                        disabled={syncingModelId === model.id}
                        sx={{
                          color: '#6B7280',
                          '&:hover': {
                            backgroundColor: '#F3F4F6'
                          }
                        }}
                      >
                        {syncingModelId === model.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <RefreshCw size={16} />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View metrics">
                      <IconButton
                        size="small"
                        onClick={() => onViewMetrics?.(model.id)}
                        sx={{
                          color: '#13715B',
                          '&:hover': {
                            backgroundColor: '#F0FDF4'
                          }
                        }}
                      >
                        <Eye size={16} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Empty State */}
      {models.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="body1" sx={{ fontSize: '14px', color: '#6B7280', mb: 1 }}>
            No models found
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '13px', color: '#9CA3AF' }}>
            Models from Evidently Cloud will appear here once synced.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default EvidentlyDataTable;
